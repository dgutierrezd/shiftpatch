import type { ShiftDto } from "@/server/http/dto";

export type { ShiftDto };

/** Response shapes as documented in docs/api.md. */

export type CredentialType = "license" | "tb_screening";
export type CredentialStatus = "pending" | "verified" | "rejected";

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

export interface ExpiringCredential {
  nurseId: string;
  nurseName: string;
  type: CredentialType;
  expiresAt: string;
}

export interface AgencyBreakdown {
  agencyId: string;
  agencyName: string;
  open: number;
  filled: number;
}

export interface AdminReport {
  totals: { open: number; filled: number; cancelled: number; total: number };
  fillRate: number;
  cancellationsByReason: { "no-show": number; advance: number };
  credentialsExpiringSoon: ExpiringCredential[];
  pendingCredentialReviews: number;
  byAgency: AgencyBreakdown[];
}

export type TimesheetStatus = "pending" | "submitted" | "approved" | "void";

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

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ComplianceNurse {
  nurseId: string;
  name: string;
  licenseNumber: string | null;
  licenseExpiresAt: string | null;
  licenseStatus: string;
  tbScreeningExpiresAt: string | null;
  tbStatus: string;
  eligibleToday: boolean;
}

export interface ComplianceReport {
  generatedAt: string;
  generatedBy: string;
  reason: string;
  nurses: ComplianceNurse[];
}

/** One remote resource: `data === null && error === null` means the first load is in flight. */
export interface Loadable<T> {
  data: T | null;
  error: string | null;
}
