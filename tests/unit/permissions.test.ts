import { describe, expect, it } from "vitest";
import {
  canCancelShift,
  canPostShift,
  canViewAgencyShifts,
  type Actor,
} from "@/server/domain/permissions";

const nurse1: Actor = { id: "nurse-1", role: "nurse", name: "Maria Lopez", agencyId: null };
const nurse2: Actor = { id: "nurse-2", role: "nurse", name: "James Cook", agencyId: null };
const agencyA: Actor = { id: "agency-a", role: "agency", name: "Sunrise", agencyId: "agency-a" };
const agencyB: Actor = { id: "agency-b", role: "agency", name: "Metro", agencyId: "agency-b" };
const admin: Actor = { id: "admin-1", role: "admin", name: "Alex Kim", agencyId: null };

const shift2 = { agencyId: "agency-a", claimedBy: "nurse-1" };

describe("permissions", () => {
  it("only agencies post shifts", () => {
    expect(canPostShift(agencyA)).toBe(true);
    expect(canPostShift(nurse1)).toBe(false);
    expect(canPostShift(admin)).toBe(false);
  });

  it("scopes agency shift views to the agency itself or an admin", () => {
    expect(canViewAgencyShifts(agencyA, "agency-a")).toBe(true);
    expect(canViewAgencyShifts(agencyA, "agency-b")).toBe(false);
    expect(canViewAgencyShifts(admin, "agency-b")).toBe(true);
    expect(canViewAgencyShifts(nurse1, "agency-a")).toBe(false);
  });

  it("lets the claiming nurse, owning agency, or admin cancel", () => {
    expect(canCancelShift(nurse1, shift2)).toBe(true);
    expect(canCancelShift(agencyA, shift2)).toBe(true);
    expect(canCancelShift(admin, shift2)).toBe(true);
    expect(canCancelShift(nurse2, shift2)).toBe(false);
    expect(canCancelShift(agencyB, shift2)).toBe(false);
  });
});
