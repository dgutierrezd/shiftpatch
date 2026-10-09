const CREDENTIAL_LABELS: Record<string, string> = {
  license: "Nursing license",
  tb_screening: "TB screening",
};

export function credentialLabel(type: string): string {
  return CREDENTIAL_LABELS[type] ?? type;
}

/** Overnight shifts end the next day (`end < start`), see spec. */
export function isOvernight(startTime: string, endTime: string): boolean {
  return endTime < startTime;
}

/** `fillRate` is assumed to be a 0–1 ratio; a 0–100 percentage is tolerated too. */
export function formatPercent(rate: number): string {
  if (!Number.isFinite(rate)) return "—";
  const pct = rate > 1 ? rate : rate * 100;
  return `${Math.round(pct)}%`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function formatClock(d: Date): string {
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Whole days from today (local) until a YYYY-MM-DD date; negative when already past. */
export function daysUntil(date: string): number | null {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

export function expiryHint(date: string): string {
  const days = daysUntil(date);
  if (days === null) return "";
  if (days < 0) return "expired";
  if (days === 0) return "expires today";
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.logout": "Signed out",
  "shift.created": "Shift posted",
  "shift.claimed": "Shift claimed",
  "shift.cancelled": "Shift cancelled",
  "shift.claim_denied": "Claim denied",
  "credential.uploaded": "Credential uploaded",
  "credential.reviewed": "Credential reviewed",
  "credential.verified": "Credential verified",
  "credential.rejected": "Credential rejected",
  "credential.file_accessed": "Credential file viewed",
  "credential.file_downloaded": "Credential file downloaded",
  "timesheet.submitted": "Timesheet submitted",
  "timesheet.approved": "Timesheet approved",
  "compliance_report.generated": "Compliance report generated",
  "admin.compliance_report": "Compliance report generated",
  "admin.reset": "Demo data reset",
};

/** Known actions get a curated label; unknown ones are humanized ("foo.bar_baz" → "Foo bar baz"). */
export function actionLabel(action: string): string {
  const known = ACTION_LABELS[action];
  if (known) return known;
  const text = action.replace(/[._-]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function compactValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.map(compactValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function metadataPairs(metadata: Record<string, unknown> | null): [string, string][] {
  if (!metadata || typeof metadata !== "object") return [];
  return Object.entries(metadata).map(([k, v]) => [k, compactValue(v)]);
}
