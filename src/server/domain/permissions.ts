export type Role = "nurse" | "agency" | "admin";

export interface Actor {
  id: string;
  role: Role;
  name: string;
  /** Present when role === "agency". */
  agencyId: string | null;
}

export function canPostShift(actor: Actor): boolean {
  return actor.role === "agency" && actor.agencyId !== null;
}

export function canViewAgencyShifts(actor: Actor, agencyId: string): boolean {
  return actor.role === "admin" || (actor.role === "agency" && actor.agencyId === agencyId);
}

/** The nurse who holds the shift, the agency that owns it, or an admin. */
export function canCancelShift(
  actor: Actor,
  shift: { agencyId: string; claimedBy: string | null },
): boolean {
  if (actor.role === "admin") return true;
  if (actor.role === "agency") return actor.agencyId === shift.agencyId;
  return shift.claimedBy !== null && shift.claimedBy === actor.id;
}

export function canManageAgencyRecord(actor: Actor, agencyId: string): boolean {
  return canViewAgencyShifts(actor, agencyId);
}
