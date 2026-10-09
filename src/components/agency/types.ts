import type { ShiftDto } from "@/server/http/dto";

export type { ShiftDto };

/** GET /api/agencies/:agencyId/shifts */
export interface AgencyShiftsResponse {
  agencyId: string;
  shifts: ShiftDto[];
}

/** GET /api/timesheets (agency sees timesheets for its own shifts). */
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
  status: "pending" | "submitted" | "approved" | "void";
}

/** GET /api/notifications */
export interface NotificationDto {
  id: string;
  kind: string;
  subject: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}
