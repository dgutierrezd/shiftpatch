import { eq } from "drizzle-orm";
import { users, waitlist } from "@/server/db/schema";
import { reseed } from "@/server/db/seed";
import type { Db } from "@/server/db/types";
import { forbidden, unauthorized } from "@/server/domain/errors";
import type { Actor } from "@/server/domain/permissions";
import type { WaitlistInput } from "@/lib/product-validation";
import { recordAudit } from "./audit";

export const DEMO_RESET_DISABLED = "Demo reset is disabled";

/** Restores the exact spec seed. Admin-only and off unless ALLOW_DEMO_RESET=true. */
export async function resetDemoData(db: Db, actor: Actor): Promise<void> {
  if (actor.role !== "admin") throw forbidden();
  if (process.env.ALLOW_DEMO_RESET !== "true") throw forbidden(DEMO_RESET_DISABLED);
  await reseed(db);
  await recordAudit(db, actor, "demo.reset", "system", null);
}

/** Returns true when a new row was created. Duplicates are silently accepted. */
export async function joinWaitlist(db: Db, input: WaitlistInput): Promise<boolean> {
  const inserted = await db
    .insert(waitlist)
    .values({
      email: input.email,
      organization: input.organization || null,
      role: input.role || null,
    })
    .onConflictDoNothing({ target: waitlist.email })
    .returning({ id: waitlist.id });
  return inserted.length > 0;
}

/** The current account as stored, so a token for a since-deleted user stops working. */
export async function currentUser(db: Db, actor: Actor) {
  const [user] = await db
    .select({ id: users.id, name: users.name, role: users.role, agencyId: users.agencyId })
    .from(users)
    .where(eq(users.id, actor.id));
  if (!user) throw unauthorized();
  return { id: user.id, name: user.name, role: user.role, agencyId: user.agencyId ?? null };
}
