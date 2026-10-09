import { ERRORS } from "./errors";
import { shiftEndDate } from "./shift-time";

export const REQUIRED_CREDENTIALS = ["license", "tb_screening"] as const;
export type CredentialKind = (typeof REQUIRED_CREDENTIALS)[number];

export interface CredentialFact {
  type: CredentialKind;
  status: "pending" | "verified" | "rejected";
  expiresAt: string;
}

export type Eligibility = { eligible: true } | { eligible: false; reason: string };

/**
 * A nurse may claim a shift only if every required credential has a verified record
 * that stays valid through the day the shift ends (inclusive). Pending uploads don't
 * count: a self-typed expiry date must not unblock anyone until an admin verifies it.
 * Dates are YYYY-MM-DD strings, so lexical comparison is chronological.
 */
export function checkEligibility(
  credentials: readonly CredentialFact[],
  shift: { date: string; startTime: string; endTime: string },
  today: string,
): Eligibility {
  const mustBeValidThrough = [today, shiftEndDate(shift)].sort().at(-1) ?? today;

  for (const kind of REQUIRED_CREDENTIALS) {
    const verified = credentials.filter((c) => c.type === kind && c.status === "verified");
    if (verified.length === 0) return { eligible: false, reason: ERRORS.credentialMissing };
    const latestExpiry =
      verified
        .map((c) => c.expiresAt)
        .sort()
        .at(-1) ?? "";
    if (latestExpiry < mustBeValidThrough) {
      return { eligible: false, reason: ERRORS.credentialExpired };
    }
  }
  return { eligible: true };
}
