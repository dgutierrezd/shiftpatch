import type { ShiftDto } from "@/server/http/dto";

export type { ShiftDto };

export type CredentialType = "license" | "tb_screening";
export type CredentialStatus = "pending" | "verified" | "rejected";

/** GET /api/credentials item (docs/api.md). */
export interface CredentialDto {
  id: string;
  nurseId: string;
  nurseName: string;
  type: CredentialType;
  fileName: string | null;
  expiresAt: string;
  status: CredentialStatus;
  uploadedAt: string;
  reviewedAt: string | null;
}

export type TimesheetStatus = "pending" | "submitted" | "approved" | "void";

/** GET /api/timesheets item (docs/api.md). */
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
  status: TimesheetStatus;
}

/** GET /api/notifications item (docs/api.md). */
export interface NotificationDto {
  id: string;
  kind: string;
  subject: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}
