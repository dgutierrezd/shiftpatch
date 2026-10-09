import { facilityToday, isOvernight, scheduledHours } from "@/server/domain/shift-time";
import type { CredentialDto, CredentialType } from "./types";

// Pure, I/O-free helpers shared with the server so the UI computes hours exactly like the API.
export { facilityToday, isOvernight, scheduledHours };

export const CREDENTIAL_LABELS: Record<CredentialType, string> = {
  license: "Nursing license",
  tb_screening: "TB screening",
};

const dayFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** "2026-10-02" → "Fri, Oct 2". Parsed as UTC so the calendar day never shifts. */
export function formatDay(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? date : dayFormat.format(parsed);
}

const longDayFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "2027-01-01" → "Jan 1, 2027". */
export function formatLongDay(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? date : longDayFormat.format(parsed);
}

const stampFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatTimestamp(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? iso : stampFormat.format(parsed);
}

export function formatHours(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(2)} h`;
}

/** Badge status for a credential: a verified record past its expiry reads "expired". */
export function credentialBadge(credential: CredentialDto, today: string): string {
  return credential.status === "verified" && credential.expiresAt < today
    ? "expired"
    : credential.status;
}

/** Loose mirror of the claim rule (as of today): a verified, unexpired record of each type. */
export function hasValidCredentials(credentials: readonly CredentialDto[], today: string): boolean {
  return (Object.keys(CREDENTIAL_LABELS) as CredentialType[]).every((type) =>
    credentials.some((c) => c.type === type && c.status === "verified" && c.expiresAt >= today),
  );
}
