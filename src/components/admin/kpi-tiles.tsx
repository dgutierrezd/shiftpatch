import { formatPercent } from "./format";
import type { AdminReport, AgencyBreakdown, Loadable } from "./types";

interface Tile {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "danger";
}

function tiles(report: AdminReport): Tile[] {
  const expiring = report.credentialsExpiringSoon.length;
  const noShows = report.cancellationsByReason["no-show"];
  return [
    { label: "Open shifts", value: String(report.totals.open) },
    { label: "Filled shifts", value: String(report.totals.filled) },
    {
      label: "Fill rate",
      value: formatPercent(report.fillRate),
      hint: `of ${report.totals.total} shift${report.totals.total === 1 ? "" : "s"}`,
    },
    { label: "No-shows", value: String(noShows), tone: noShows > 0 ? "danger" : "default" },
    {
      label: "Pending reviews",
      value: String(report.pendingCredentialReviews),
      hint: "credentials",
      tone: report.pendingCredentialReviews > 0 ? "warning" : "default",
    },
    {
      label: "Expiring ≤ 30 days",
      value: String(expiring),
      hint: "credentials",
      tone: expiring > 0 ? "warning" : "default",
    },
  ];
}

const TONE: Record<NonNullable<Tile["tone"]>, string> = {
  default: "text-foreground",
  warning: "text-warning",
  danger: "text-danger",
};

export function KpiTiles({ report }: { report: Loadable<AdminReport> }) {
  if (!report.data) {
    return (
      <div
        className="rounded-xl border border-border bg-surface p-5 text-sm text-muted shadow-sm"
        role={report.error ? "alert" : "status"}
      >
        {report.error ? `Couldn’t load the report: ${report.error}` : "Loading report…"}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {report.error && (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          Couldn’t refresh the report: {report.error}
        </p>
      )}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles(report.data).map((t) => (
          <div key={t.label} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <dt className="text-xs font-medium text-muted">{t.label}</dt>
            <dd className={`mt-1 text-2xl font-semibold tabular-nums ${TONE[t.tone ?? "default"]}`}>
              {t.value}
            </dd>
            {t.hint && <dd className="text-xs text-muted">{t.hint}</dd>}
          </div>
        ))}
      </dl>
      <AgencyBreakdownList rows={report.data.byAgency} />
    </div>
  );
}

function AgencyBreakdownList({ rows }: { rows: AgencyBreakdown[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">By agency</h3>
        <div className="flex gap-4 text-xs text-muted" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-success" /> Filled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-brand-soft ring-1 ring-brand/30" /> Open
          </span>
        </div>
      </div>
      <ul className="space-y-3">
        {rows.map((a) => {
          const total = a.open + a.filled;
          const filledPct = total === 0 ? 0 : (a.filled / total) * 100;
          return (
            <li key={a.agencyId} className="grid gap-1.5 sm:grid-cols-[12rem_1fr_auto] sm:items-center sm:gap-4">
              <span className="truncate text-sm font-medium">{a.agencyName}</span>
              <div
                className="flex h-2.5 overflow-hidden rounded-full bg-brand-soft"
                role="img"
                aria-label={`${a.agencyName}: ${a.filled} filled, ${a.open} open`}
              >
                <div className="bg-success" style={{ width: `${filledPct}%` }} />
              </div>
              <span className="text-xs text-muted tabular-nums">
                {a.filled} filled · {a.open} open
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
