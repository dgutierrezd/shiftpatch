import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { scheduledHours } from "@/server/domain/shift-time";
import type { Db } from "./types";
import { agencies, credentials, shifts, timesheets, users } from "./schema";
import {
  NEXT_SHIFT_NUMBER,
  SEED_PASSWORD,
  seedAgencies,
  seedCredentials,
  seedShifts,
  seedUsers,
} from "./seed-data";

let cachedHash: Promise<string> | null = null;
const passwordHash = () => (cachedHash ??= bcrypt.hash(SEED_PASSWORD, 10));

/**
 * Idempotent: restores the exact spec sample data. The audit log is deliberately kept —
 * a demo reset must not erase history (the reset itself is audited by the caller).
 */
export async function reseed(db: Db): Promise<void> {
  const hash = await passwordHash();
  await db.transaction(async (tx) => {
    await tx.execute(sql`TRUNCATE notifications, timesheets, cancellations, credentials,
      shifts, users, agencies, login_attempts, waitlist RESTART IDENTITY CASCADE`);
    await tx.execute(sql.raw(`ALTER SEQUENCE shift_seq RESTART WITH ${NEXT_SHIFT_NUMBER}`));
    await tx.insert(agencies).values([...seedAgencies]);
    await tx.insert(users).values(seedUsers.map((u) => ({ ...u, passwordHash: hash })));
    await tx.insert(credentials).values(
      seedCredentials.map((c) => ({
        ...c,
        status: "verified" as const,
        reviewedBy: "admin-1",
        reviewedAt: new Date("2026-01-01T00:00:00Z"),
      })),
    );
    await tx.insert(shifts).values([...seedShifts]);
    const filled = seedShifts.filter((s) => s.claimedBy !== null);
    await tx.insert(timesheets).values(
      filled.map((s) => ({
        shiftId: s.id,
        nurseId: s.claimedBy as string,
        scheduledHours: scheduledHours(s.startTime, s.endTime),
      })),
    );
  });
}
