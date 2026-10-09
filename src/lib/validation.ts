import { z } from "zod";
import { isValidDate, isValidTime } from "@/server/domain/shift-time";

// Shared by route handlers and client forms.

export const SHIFT_ROLES = ["RN", "LPN", "CNA"] as const;
export const CANCELLATION_REASONS = ["no-show", "advance"] as const;

export const loginSchema = z.object({
  email: z
    .string({ error: "email is required" })
    .trim()
    .toLowerCase()
    .min(1, "email is required")
    .max(254),
  password: z.string({ error: "password is required" }).min(1, "password is required").max(200),
});

export const createShiftSchema = z
  .object({
    role: z.enum(SHIFT_ROLES, { error: "role must be one of RN, LPN, CNA" }),
    date: z
      .string({ error: "date is required" })
      .refine(isValidDate, "date must be a valid YYYY-MM-DD date"),
    startTime: z
      .string({ error: "startTime is required" })
      .refine(isValidTime, "startTime must be HH:mm (24-hour)"),
    endTime: z
      .string({ error: "endTime is required" })
      .refine(isValidTime, "endTime must be HH:mm (24-hour)"),
  })
  .refine((s) => s.startTime !== s.endTime, "startTime and endTime must differ");

export const cancelShiftSchema = z.object({
  reason: z.enum(CANCELLATION_REASONS, { error: 'reason must be "no-show" or "advance"' }),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;
