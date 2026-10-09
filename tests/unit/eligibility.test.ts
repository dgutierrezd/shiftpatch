import { describe, expect, it } from "vitest";
import { checkEligibility, type CredentialFact } from "@/server/domain/eligibility";
import { ERRORS } from "@/server/domain/errors";

const shift1 = { date: "2026-10-02", startTime: "19:00", endTime: "07:00" };
const today = "2026-10-09";

const valid = (
  expiresAt: string,
  status: CredentialFact["status"] = "verified",
): CredentialFact[] => [
  { type: "license", status, expiresAt },
  { type: "tb_screening", status, expiresAt },
];

describe("claim eligibility", () => {
  it("allows a nurse whose credentials are valid (Maria, nurse-1)", () => {
    expect(checkEligibility(valid("2027-01-01"), shift1, today)).toEqual({ eligible: true });
  });

  it("blocks a nurse whose credentials lapsed (James, nurse-2)", () => {
    expect(checkEligibility(valid("2026-06-01"), shift1, today)).toEqual({
      eligible: false,
      reason: ERRORS.credentialExpired,
    });
  });

  it("does not block a past-dated shift when credentials are valid today", () => {
    expect(checkEligibility(valid("2026-10-09"), shift1, today).eligible).toBe(true);
  });

  it("treats the expiry date itself as still valid", () => {
    expect(checkEligibility(valid("2026-10-09"), shift1, "2026-10-09").eligible).toBe(true);
    expect(checkEligibility(valid("2026-10-08"), shift1, "2026-10-09").eligible).toBe(false);
  });

  it("requires validity through the end date of an overnight future shift", () => {
    const overnight = { date: "2026-12-20", startTime: "19:00", endTime: "07:00" };
    expect(checkEligibility(valid("2026-12-20"), overnight, today).eligible).toBe(false);
    expect(checkEligibility(valid("2026-12-21"), overnight, today).eligible).toBe(true);
  });

  it("ignores pending uploads so a self-typed date cannot unblock a nurse", () => {
    const creds = [...valid("2026-06-01"), ...valid("2030-01-01", "pending")];
    expect(checkEligibility(creds, shift1, today)).toEqual({
      eligible: false,
      reason: ERRORS.credentialExpired,
    });
  });

  it("uses the latest verified record per credential type", () => {
    const creds = [...valid("2026-06-01"), ...valid("2027-06-01")];
    expect(checkEligibility(creds, shift1, today).eligible).toBe(true);
  });

  it("blocks when a required credential type is missing", () => {
    const creds: CredentialFact[] = [
      { type: "license", status: "verified", expiresAt: "2027-01-01" },
    ];
    expect(checkEligibility(creds, shift1, today)).toEqual({
      eligible: false,
      reason: ERRORS.credentialMissing,
    });
  });
});
