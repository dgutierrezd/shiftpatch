import "server-only";
import type { CreateShiftInput } from "@/lib/validation";
import { getDb } from "@/server/db/client";
import type { ShiftRow } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { checkEligibility } from "@/server/domain/eligibility";
import { ERRORS, conflict, forbidden, notFound } from "@/server/domain/errors";
import {
  canCancelShift,
  canPostShift,
  canViewAgencyShifts,
  type Actor,
} from "@/server/domain/permissions";
import { facilityToday, overlaps, scheduledHours } from "@/server/domain/shift-time";
import { toShiftDto, type ShiftDto } from "@/server/http/dto";
import * as repo from "@/server/repositories/shifts.repo";
import { recordAudit } from "./audit";
import { queueNotification } from "./notify";

export const ERROR_OVERLAP = "You already have a shift that overlaps this one";

export type CancellationReason = "no-show" | "advance";

export interface CancelledShiftDto extends ShiftDto {
  cancellation: { reason: CancellationReason; previousNurseId: string };
}

async function withAgencyName(db: Db, row: ShiftRow): Promise<ShiftDto> {
  const name = await repo.findAgencyName(db, row.agencyId);
  if (name === null) throw new Error(`Agency ${row.agencyId} missing for ${row.id}`);
  return toShiftDto(row, name);
}

/** Notification copy references only the shift slot — never credential or health details. */
function slot(row: ShiftRow): string {
  return `${row.id} on ${row.date}, ${row.startTime}-${row.endTime} (${row.role})`;
}

export async function listAllShifts(): Promise<ShiftDto[]> {
  const rows = await repo.listShifts(getDb());
  return rows.map((r) => toShiftDto(r.shift, r.agencyName));
}

export async function listAgencyShifts(actor: Actor, agencyId: string): Promise<ShiftDto[]> {
  if (!canViewAgencyShifts(actor, agencyId)) throw forbidden();
  const db = getDb();
  if ((await repo.findAgencyName(db, agencyId)) === null) throw notFound(ERRORS.agencyNotFound);
  const rows = await repo.listShiftsByAgency(db, agencyId);
  return rows.map((r) => toShiftDto(r.shift, r.agencyName));
}

export async function createShift(actor: Actor, input: CreateShiftInput): Promise<ShiftDto> {
  if (!canPostShift(actor) || actor.agencyId === null) throw forbidden();
  const agencyId = actor.agencyId; // From the token only — never the request body.
  return getDb().transaction(async (tx) => {
    const row = await repo.insertShift(tx, {
      agencyId,
      role: input.role,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
    });
    await recordAudit(tx, actor, "shift.created", "shift", row.id, {
      role: row.role,
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
    });
    return withAgencyName(tx, row);
  });
}

/**
 * Check order is part of the contract: (401/403 role in the handler) → 404 → 403 credential
 * → 409 not open. Credentials are checked before availability so an ineligible nurse always
 * sees the credential message, even for a shift that's already filled.
 */
export async function claimShift(actor: Actor, shiftId: string): Promise<ShiftDto> {
  if (actor.role !== "nurse") throw forbidden();
  const db = getDb();
  const shift = await repo.findShift(db, shiftId);
  if (!shift) throw notFound(ERRORS.shiftNotFound);

  const eligibility = checkEligibility(
    await repo.nurseCredentials(db, actor.id),
    shift,
    facilityToday(),
  );
  if (!eligibility.eligible) {
    await recordAudit(db, actor, "shift.claim_blocked", "shift", shift.id, {
      reason: eligibility.reason,
    });
    throw forbidden(eligibility.reason);
  }

  return db.transaction(async (tx) => {
    await repo.lockUser(tx, actor.id);
    const current = await repo.findShift(tx, shiftId, { lock: true });
    if (!current || current.status !== "open") throw conflict(ERRORS.shiftNotOpen);

    const held = await repo.listFilledShiftsForNurse(tx, actor.id);
    if (held.some((h) => h.id !== current.id && overlaps(h, current))) {
      throw conflict(ERROR_OVERLAP);
    }

    const claimed = await repo.claimIfOpen(tx, shiftId, actor.id);
    if (!claimed) throw conflict(ERRORS.shiftNotOpen);

    await repo.insertTimesheet(tx, {
      shiftId: claimed.id,
      nurseId: actor.id,
      scheduledHours: scheduledHours(claimed.startTime, claimed.endTime),
    });
    await recordAudit(tx, actor, "shift.claimed", "shift", claimed.id, {});
    await queueNotification(
      tx,
      actor.id,
      "shift.claimed",
      "Shift confirmed",
      `You're confirmed for shift ${slot(claimed)}.`,
    );
    for (const userId of await repo.agencyUserIds(tx, claimed.agencyId)) {
      await queueNotification(
        tx,
        userId,
        "shift.filled",
        "Shift filled",
        `Shift ${slot(claimed)} has been claimed by ${actor.name}.`,
      );
    }
    return withAgencyName(tx, claimed);
  });
}

export async function cancelShift(
  actor: Actor,
  shiftId: string,
  reason: CancellationReason,
): Promise<CancelledShiftDto> {
  return getDb().transaction(async (tx) => {
    const shift = await repo.findShift(tx, shiftId, { lock: true });
    if (!shift) throw notFound(ERRORS.shiftNotFound);
    if (!canCancelShift(actor, shift)) throw forbidden();
    if (shift.status !== "filled" || shift.claimedBy === null) {
      throw conflict(ERRORS.shiftNotFilled);
    }
    const previousNurseId = shift.claimedBy;

    const reopened = await repo.reopenIfFilled(tx, shiftId);
    if (!reopened) throw conflict(ERRORS.shiftNotFilled);

    await repo.insertCancellation(tx, {
      shiftId,
      reason,
      previousNurseId,
      cancelledBy: actor.id,
    });
    await repo.voidActiveTimesheets(tx, shiftId, previousNurseId);
    await recordAudit(tx, actor, "shift.cancelled", "shift", shiftId, {
      reason,
      previousNurseId,
    });
    const label = reason === "no-show" ? "marked as a no-show" : "cancelled";
    await queueNotification(
      tx,
      previousNurseId,
      "shift.cancelled",
      "Shift cancelled",
      `Your shift ${slot(reopened)} was ${label}.`,
    );
    for (const userId of await repo.agencyUserIds(tx, reopened.agencyId)) {
      await queueNotification(
        tx,
        userId,
        "shift.reopened",
        "Shift reopened",
        `Shift ${slot(reopened)} was ${label} and is open again.`,
      );
    }

    const dto = await withAgencyName(tx, reopened);
    return { ...dto, cancellation: { reason, previousNurseId } };
  });
}
