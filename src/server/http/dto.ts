import type { ShiftRow } from "@/server/db/schema";

/** The one shape every shift-returning route uses (spec: 9 fields, claimedBy null when open). */
export interface ShiftDto {
  id: string;
  agencyId: string;
  agencyName: string;
  role: ShiftRow["role"];
  date: string;
  startTime: string;
  endTime: string;
  status: ShiftRow["status"];
  claimedBy: string | null;
}

export function toShiftDto(row: ShiftRow, agencyName: string): ShiftDto {
  return {
    id: row.id,
    agencyId: row.agencyId,
    agencyName,
    role: row.role,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    status: row.status,
    claimedBy: row.claimedBy ?? null,
  };
}
