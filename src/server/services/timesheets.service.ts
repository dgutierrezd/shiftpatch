import { and, asc, eq, type SQL } from "drizzle-orm";
import { agencies, shifts, timesheets, users, type TimesheetRow } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { conflict, forbidden, notFound } from "@/server/domain/errors";
import { isUuid } from "@/server/domain/file-type";
import type { Actor } from "@/server/domain/permissions";
import { recordAudit } from "./audit";
import { queueNotification } from "./notify";

export const TIMESHEET_ERRORS = {
  notFound: "Timesheet not found",
  notPending: "Only a pending timesheet can be submitted",
  notSubmitted: "Only a submitted timesheet can be approved",
} as const;

export interface TimesheetDto {
  id: string;
  shiftId: string;
  nurseId: string;
  nurseName: string;
  agencyId: string;
  agencyName: string;
  date: string;
  startTime: string;
  endTime: string;
  scheduledHours: number;
  workedHours: number | null;
  status: TimesheetRow["status"];
}

const selection = {
  timesheet: timesheets,
  nurseName: users.name,
  agencyId: shifts.agencyId,
  agencyName: agencies.name,
  date: shifts.date,
  startTime: shifts.startTime,
  endTime: shifts.endTime,
};

function query(db: Db, where: SQL | undefined) {
  return db
    .select(selection)
    .from(timesheets)
    .innerJoin(shifts, eq(shifts.id, timesheets.shiftId))
    .innerJoin(agencies, eq(agencies.id, shifts.agencyId))
    .innerJoin(users, eq(users.id, timesheets.nurseId))
    .where(where)
    .orderBy(asc(shifts.date), asc(shifts.startTime), asc(timesheets.createdAt));
}

type Joined = Awaited<ReturnType<typeof query>>[number];

function toDto(row: Joined, override?: TimesheetRow): TimesheetDto {
  const t = override ?? row.timesheet;
  return {
    id: t.id,
    shiftId: t.shiftId,
    nurseId: t.nurseId,
    nurseName: row.nurseName,
    agencyId: row.agencyId,
    agencyName: row.agencyName,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    scheduledHours: Number(t.scheduledHours),
    workedHours: t.workedHours === null ? null : Number(t.workedHours),
    status: t.status,
  };
}

export async function listTimesheets(db: Db, actor: Actor): Promise<TimesheetDto[]> {
  let where: SQL | undefined;
  if (actor.role === "nurse") where = eq(timesheets.nurseId, actor.id);
  else if (actor.role === "agency") {
    if (!actor.agencyId) throw forbidden();
    where = eq(shifts.agencyId, actor.agencyId);
  }
  return (await query(db, where)).map((r) => toDto(r));
}

async function findTimesheet(db: Db, id: string): Promise<Joined | null> {
  if (!isUuid(id)) return null;
  const [row] = await query(db, eq(timesheets.id, id));
  return row ?? null;
}

export async function submitTimesheet(
  db: Db,
  actor: Actor,
  id: string,
  workedHours: number,
): Promise<TimesheetDto> {
  if (actor.role !== "nurse") throw forbidden();
  const existing = await findTimesheet(db, id);
  if (!existing) throw notFound(TIMESHEET_ERRORS.notFound);
  if (existing.timesheet.nurseId !== actor.id) throw forbidden();

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(timesheets)
      .set({ status: "submitted", workedHours, submittedAt: new Date() })
      .where(and(eq(timesheets.id, id), eq(timesheets.status, "pending")))
      .returning();
    if (!row) throw conflict(TIMESHEET_ERRORS.notPending);
    await recordAudit(tx, actor, "timesheet.submitted", "timesheet", id, {
      shiftId: row.shiftId,
      workedHours,
    });
    const agencyUsers = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "agency"), eq(users.agencyId, existing.agencyId)));
    for (const user of agencyUsers) {
      await queueNotification(
        tx,
        user.id,
        "timesheet.submitted",
        "Timesheet submitted",
        `A timesheet for shift ${row.shiftId} is ready for approval.`,
      );
    }
    return row;
  });
  return toDto(existing, updated);
}

export async function approveTimesheet(db: Db, actor: Actor, id: string): Promise<TimesheetDto> {
  if (actor.role !== "agency" && actor.role !== "admin") throw forbidden();
  const existing = await findTimesheet(db, id);
  if (!existing) throw notFound(TIMESHEET_ERRORS.notFound);
  if (actor.role === "agency" && actor.agencyId !== existing.agencyId) throw forbidden();

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(timesheets)
      .set({ status: "approved", approvedBy: actor.id, approvedAt: new Date() })
      .where(and(eq(timesheets.id, id), eq(timesheets.status, "submitted")))
      .returning();
    if (!row) throw conflict(TIMESHEET_ERRORS.notSubmitted);
    await recordAudit(tx, actor, "timesheet.approved", "timesheet", id, { shiftId: row.shiftId });
    await queueNotification(
      tx,
      row.nurseId,
      "timesheet.approved",
      "Timesheet approved",
      `Your timesheet for shift ${row.shiftId} was approved.`,
    );
    return row;
  });
  return toDto(existing, updated);
}
