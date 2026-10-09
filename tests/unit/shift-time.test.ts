import { describe, expect, it } from "vitest";
import {
  facilityToday,
  isOvernight,
  isValidDate,
  isValidTime,
  overlaps,
  scheduledHours,
  shiftEndDate,
} from "@/server/domain/shift-time";

describe("shift time rules", () => {
  it("validates 24h HH:mm times", () => {
    expect(isValidTime("07:00")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("7:00")).toBe(false);
  });

  it("accepts only real calendar dates", () => {
    expect(isValidDate("2026-10-05")).toBe(true);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("10/05/2026")).toBe(false);
  });

  it("treats an end before the start as an overnight shift", () => {
    expect(isOvernight("19:00", "07:00")).toBe(true);
    expect(isOvernight("07:00", "19:00")).toBe(false);
    expect(shiftEndDate({ date: "2026-10-02", startTime: "19:00", endTime: "07:00" })).toBe(
      "2026-10-03",
    );
    expect(shiftEndDate({ date: "2026-12-31", startTime: "19:00", endTime: "07:00" })).toBe(
      "2027-01-01",
    );
  });

  it("computes scheduled hours across midnight", () => {
    expect(scheduledHours("19:00", "07:00")).toBe(12);
    expect(scheduledHours("07:00", "19:00")).toBe(12);
    expect(scheduledHours("22:30", "06:15")).toBe(7.75);
  });

  it("does not count back-to-back shifts as overlapping", () => {
    const night = { date: "2026-10-02", startTime: "19:00", endTime: "07:00" };
    const day = { date: "2026-10-03", startTime: "07:00", endTime: "19:00" };
    expect(overlaps(night, day)).toBe(false);
    expect(overlaps(night, { date: "2026-10-03", startTime: "06:00", endTime: "10:00" })).toBe(
      true,
    );
  });

  it("uses the facility time zone for today", () => {
    // 02:00 UTC on Oct 10 is still Oct 9 in Florida.
    expect(facilityToday(new Date("2026-10-10T02:00:00Z"))).toBe("2026-10-09");
  });
});
