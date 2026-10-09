import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import type { Db } from "@/server/db/types";
import { loginAttempts, users } from "@/server/db/schema";
import { verifyPassword } from "@/server/auth/password";
import { signSession } from "@/server/auth/jwt";
import { DomainError, ERRORS, unauthorized } from "@/server/domain/errors";
import type { Actor } from "@/server/domain/permissions";
import { recordAudit } from "./audit";

export const LOGIN_MAX_FAILURES = 10;
/** Failed attempts allowed per IP across all accounts (password-spraying guard). */
export const LOGIN_MAX_FAILURES_PER_IP = 100;
export const LOGIN_WINDOW_MINUTES = 15;
export const ERROR_TOO_MANY_LOGINS = "Too many login attempts, try again later";

export interface LoginResult {
  token: string;
  user: { id: string; name: string; role: Actor["role"] };
}

/** First hop of x-forwarded-for (set by Vercel's edge), else x-real-ip. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
}

const windowExpired = sql`${loginAttempts.windowStart} < now() - make_interval(mins => ${LOGIN_WINDOW_MINUTES})`;

/**
 * Atomically counts one attempt against `key` (resetting an expired window) and returns
 * the new count. Reserving before the bcrypt check means parallel bursts can't all slip
 * under the limit.
 */
async function reserveAttempt(db: Db, key: string): Promise<number> {
  const [row] = await db
    .insert(loginAttempts)
    .values({ key, count: 1 })
    .onConflictDoUpdate({
      target: loginAttempts.key,
      set: {
        count: sql`CASE WHEN ${windowExpired} THEN 1 ELSE ${loginAttempts.count} + 1 END`,
        windowStart: sql`CASE WHEN ${windowExpired} THEN now() ELSE ${loginAttempts.windowStart} END`,
      },
    })
    .returning({ count: loginAttempts.count });
  return row?.count ?? 1;
}

/** `email` must already be normalized (loginSchema trims + lowercases it). */
export async function login(email: string, password: string, ip: string): Promise<LoginResult> {
  const db = getDb();
  const accountKey = `acct:${ip}|${email}`;
  const ipKey = `ip:${ip}`;

  const [accountCount, ipCount] = await Promise.all([
    reserveAttempt(db, accountKey),
    reserveAttempt(db, ipKey),
  ]);
  if (accountCount > LOGIN_MAX_FAILURES || ipCount > LOGIN_MAX_FAILURES_PER_IP) {
    throw new DomainError(429, ERROR_TOO_MANY_LOGINS);
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  // Always one bcrypt comparison, so unknown emails and wrong passwords take the same time.
  const ok = await verifyPassword(password, user?.passwordHash ?? null);

  if (!user || !ok) {
    // No email in metadata: audit rows must not collect PII for unknown accounts.
    await recordAudit(db, null, "auth.login_failed", "user", null, {});
    throw unauthorized(ERRORS.invalidLogin);
  }

  // Successful logins don't count: clear the account counter and refund the IP attempt.
  await db.delete(loginAttempts).where(eq(loginAttempts.key, accountKey));
  await db
    .update(loginAttempts)
    .set({ count: sql`GREATEST(${loginAttempts.count} - 1, 0)` })
    .where(eq(loginAttempts.key, ipKey));
  const actor: Actor = { id: user.id, role: user.role, name: user.name, agencyId: user.agencyId };
  await recordAudit(db, actor, "auth.login", "user", user.id, {});
  return {
    token: await signSession(actor),
    user: { id: user.id, name: user.name, role: user.role },
  };
}
