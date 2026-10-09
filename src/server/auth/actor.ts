import { forbidden, unauthorized } from "@/server/domain/errors";
import type { Actor, Role } from "@/server/domain/permissions";
import { verifySession } from "./jwt";
import { SESSION_COOKIE, readCookie } from "./session-cookie";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Resolves the caller from `Authorization: Bearer` (API clients) or the session cookie
 * (browser UI). Cookie-authenticated writes must come from our own origin (CSRF guard);
 * bearer requests can't be forged cross-site, so they skip that check.
 */
export async function getActor(req: Request): Promise<Actor | null> {
  const header = req.headers.get("authorization");
  if (header) {
    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    return match?.[1] ? verifySession(match[1]) : null;
  }
  const token = readCookie(req.headers.get("cookie"), SESSION_COOKIE);
  if (!token) return null;
  if (!SAFE_METHODS.has(req.method) && !isSameOrigin(req)) {
    throw forbidden("Cross-site request blocked");
  }
  return verifySession(token);
}

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") === "same-origin";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function requireActor(req: Request, ...roles: Role[]): Promise<Actor> {
  const actor = await getActor(req);
  if (!actor) throw unauthorized();
  if (roles.length > 0 && !roles.includes(actor.role)) throw forbidden();
  return actor;
}
