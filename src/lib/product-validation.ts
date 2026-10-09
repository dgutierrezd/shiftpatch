import { z } from "zod";
import { isValidDate } from "@/server/domain/shift-time";

// Request schemas for the product (non-contract) API. Shared by route handlers and client forms.

export const CREDENTIAL_TYPES = ["license", "tb_screening"] as const;
export const CREDENTIAL_STATUSES = ["pending", "verified", "rejected"] as const;

export const credentialUploadFieldsSchema = z.object({
  type: z.enum(CREDENTIAL_TYPES, { error: 'type must be "license" or "tb_screening"' }),
  expiresAt: z
    .string({ error: "expiresAt is required" })
    .refine(isValidDate, "expiresAt must be a valid YYYY-MM-DD date"),
});

export const credentialListQuerySchema = z.object({
  status: z
    .enum(CREDENTIAL_STATUSES, { error: "status must be pending, verified or rejected" })
    .optional(),
});

export const credentialReviewSchema = z.object({
  decision: z.enum(["verified", "rejected"], {
    error: 'decision must be "verified" or "rejected"',
  }),
});

export const timesheetSubmitSchema = z.object({
  workedHours: z
    .number({ error: "workedHours must be a number" })
    .min(0, "workedHours must be between 0 and 24")
    .max(24, "workedHours must be between 0 and 24"),
});

export const auditLogQuerySchema = z.object({
  limit: z.coerce
    .number({ error: "limit must be a number" })
    .int("limit must be an integer")
    .min(1, "limit must be between 1 and 500")
    .max(500, "limit must be between 1 and 500")
    .default(200),
});

export const complianceReportSchema = z.object({
  reason: z
    .string({ error: "reason is required" })
    .trim()
    .min(3, "reason must be 3-200 characters")
    .max(200, "reason must be 3-200 characters"),
  nurseIds: z
    .array(z.string().min(1).max(64), { error: "nurseIds must be an array of nurse ids" })
    .max(500, "nurseIds can list at most 500 nurses")
    .optional(),
});

export const waitlistSchema = z.object({
  email: z
    .string({ error: "email is required" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "email must be a valid email address" }).max(254)),
  organization: z.string().trim().max(200, "organization is too long").optional(),
  role: z.string().trim().max(100, "role is too long").optional(),
});

export type ComplianceReportInput = z.infer<typeof complianceReportSchema>;
export type WaitlistInput = z.infer<typeof waitlistSchema>;
