import { and, eq, ne, sql } from "drizzle-orm";
import {
  agencies,
  cancellations,
  credentials,
  shifts,
  timesheets,
  users,
  type ShiftRow,
} from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import type { CredentialFact } from "@/server/domain/eligibility";

export interface ShiftWithAgency {
  shift: ShiftRow;
  agencyName: string;
}

/** `shift-10` sorts after `shift-9`: order by the numeric suffix, then the raw id as a tiebreak. */
const byNumericId = [
  sql`NULLIF(regexp_replace(${shifts.id}, '\\D', '', 'g'), '')::bigint NULLS LAST`,
  shifts.id,
];

function selectWithAgency(db: Db) {
  return db
    .select({ shift: shifts, agencyName: agencies.name })
    .from(shifts)
    .innerJoin(agencies, eq(agencies.id, shifts.agencyId));
}

export function listShifts(db: Db): Promise<ShiftWithAgency[]> {
  return selectWithAgency(db).orderBy(...byNumericId);
}

export function listShiftsByAgency(db: Db, agencyId: string): Promise<ShiftWithAgency[]> {
  return selectWithAgency(db)
    .where(eq(shifts.agencyId, agencyId))
    .orderBy(...byNumericId);
}

/** With `lock`, the row stays locked until the surrounding transaction ends. */
export async function findShift(
  db: Db,
  id: string,
  opts: { lock?: boolean } = {},
): Promise<ShiftRow | null> {
  const query = db.select().from(shifts).where(eq(shifts.id, id));
  const rows = opts.lock ? await query.for("update") : await query;
  return rows[0] ?? null;
}

export async function findAgencyName(db: Db, agencyId: string): Promise<string | null> {
  const rows = await db
    .select({ name: agencies.name })
    .from(agencies)
    .where(eq(agencies.id, agencyId));
  return rows[0]?.name ?? null;
}

export async function insertShift(
  db: Db,
  values: Pick<ShiftRow, "agencyId" | "role" | "date" | "startTime" | "endTime">,
): Promise<ShiftRow> {
  const [row] = await db
    .insert(shifts)
    .values({ ...values, id: sql`'shift-' || nextval('shift_seq')`, status: "open" })
    .returning();
  if (!row) throw new Error("Shift insert returned no row");
  return row;
}

/** Atomic claim: only succeeds while the shift is still open. */
export async function claimIfOpen(db: Db, id: string, nurseId: string): Promise<ShiftRow | null> {
  const rows = await db
    .update(shifts)
    .set({ status: "filled", claimedBy: nurseId })
    .where(and(eq(shifts.id, id), eq(shifts.status, "open")))
    .returning();
  return rows[0] ?? null;
}

/** Atomic reopen: only succeeds while the shift is still filled. */
export async function reopenIfFilled(db: Db, id: string): Promise<ShiftRow | null> {
  const rows = await db
    .update(shifts)
    .set({ status: "open", claimedBy: null })
    .where(and(eq(shifts.id, id), eq(shifts.status, "filled")))
    .returning();
  return rows[0] ?? null;
}

export function listFilledShiftsForNurse(db: Db, nurseId: string): Promise<ShiftRow[]> {
  return db
    .select()
    .from(shifts)
    .where(and(eq(shifts.claimedBy, nurseId), eq(shifts.status, "filled")));
}

/** Serializes concurrent claims by the same nurse so the double-booking check holds. */
export async function lockUser(db: Db, userId: string): Promise<void> {
  await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
}

export async function agencyUserIds(db: Db, agencyId: string): Promise<string[]> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.agencyId, agencyId), eq(users.role, "agency")));
  return rows.map((r) => r.id);
}

export function nurseCredentials(db: Db, nurseId: string): Promise<CredentialFact[]> {
  return db
    .select({
      type: credentials.type,
      status: credentials.status,
      expiresAt: credentials.expiresAt,
    })
    .from(credentials)
    .where(eq(credentials.nurseId, nurseId));
}

export async function insertTimesheet(
  db: Db,
  values: { shiftId: string; nurseId: string; scheduledHours: number },
): Promise<void> {
  await db.insert(timesheets).values(values);
}

export async function voidActiveTimesheets(
  db: Db,
  shiftId: string,
  nurseId: string,
): Promise<void> {
  await db
    .update(timesheets)
    .set({ status: "void" })
    .where(
      and(
        eq(timesheets.shiftId, shiftId),
        eq(timesheets.nurseId, nurseId),
        ne(timesheets.status, "void"),
      ),
    );
}

export async function insertCancellation(
  db: Db,
  values: {
    shiftId: string;
    reason: "no-show" | "advance";
    previousNurseId: string;
    cancelledBy: string;
  },
): Promise<void> {
  await db.insert(cancellations).values(values);
}
