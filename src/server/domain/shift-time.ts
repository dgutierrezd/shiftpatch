/** Shift times are 24-hour, facility-local; no timezone conversion (per spec). */

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const FACILITY_TIME_ZONE = "America/New_York";

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

/** True only for a real calendar date in YYYY-MM-DD form (rejects 2026-02-30). */
export function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** An end time earlier than the start time means the shift runs past midnight. */
export function isOvernight(startTime: string, endTime: string): boolean {
  return toMinutes(endTime) < toMinutes(startTime);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Calendar date on which the shift ends (next day for overnight shifts). */
export function shiftEndDate(shift: { date: string; startTime: string; endTime: string }): string {
  return isOvernight(shift.startTime, shift.endTime) ? addDays(shift.date, 1) : shift.date;
}

export function scheduledHours(startTime: string, endTime: string): number {
  const start = toMinutes(startTime);
  let end = toMinutes(endTime);
  if (end <= start) end += 24 * 60;
  return Math.round(((end - start) / 60) * 100) / 100;
}

/** Today's date (YYYY-MM-DD) in the facility's time zone. */
export function facilityToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FACILITY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Absolute minute range of a shift, used for double-booking checks. */
export function shiftInterval(shift: { date: string; startTime: string; endTime: string }): {
  start: number;
  end: number;
} {
  const dayMinutes = Date.parse(`${shift.date}T00:00:00Z`) / 60000;
  const start = dayMinutes + toMinutes(shift.startTime);
  return { start, end: start + scheduledHours(shift.startTime, shift.endTime) * 60 };
}

/** Back-to-back shifts (one ends exactly when the next starts) do not overlap. */
export function overlaps(
  a: { date: string; startTime: string; endTime: string },
  b: { date: string; startTime: string; endTime: string },
): boolean {
  const x = shiftInterval(a);
  const y = shiftInterval(b);
  return x.start < y.end && y.start < x.end;
}
