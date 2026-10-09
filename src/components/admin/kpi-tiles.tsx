import { type FigureItem, Figures } from "@/components/ui/figures";
import { LoadingLine, Note, numClass, tdClass, thClass } from "@/components/ui/primitives";
import { formatPercent } from "./format";
import type { AdminReport, AgencyBreakdown, Loadable } from "./types";

function figures(report: AdminReport): FigureItem[] {
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

export function KpiTiles({ report }: { report: Loadable<AdminReport> }) {
  if (!report.data) {
    if (report.error) {
      return (
        <Note tone="danger" role="alert">
          Couldn’t load the report: {report.error}
        </Note>
      );
    }
    return <LoadingLine label="Loading report…" />;
  }
  return (
    <div className="space-y-10">
      {report.error && (
        <Note tone="danger" role="alert">
          Couldn’t refresh the report: {report.error}
        </Note>
      )}
      <Figures
        label="Key figures"
        columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
        items={figures(report.data)}
      />
      <AgencyBreakdownTable rows={report.data.byAgency} />
    </div>
  );
}

/** Coverage by agency as a small report table with a thin fill bar. */
function AgencyBreakdownTable({ rows }: { rows: AgencyBreakdown[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h3 className="mb-3 text-lead text-ink">Coverage by agency</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] border-t border-ink text-left text-[0.875rem]">
          <thead className="border-b border-rule text-small text-muted">
            <tr>
              <th scope="col" className={thClass}>
                Agency
              </th>
              <th scope="col" className={`${thClass} ${numClass}`}>
                Filled
              </th>
              <th scope="col" className={`${thClass} ${numClass}`}>
                Open
              </th>
              <th scope="col" className={`${thClass} ${numClass}`}>
                Fill rate
              </th>
              <th scope="col" className={`${thClass} w-[34%]`}>
                <span className="sr-only">Fill rate bar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const total = a.open + a.filled;
              const pct = total === 0 ? 0 : Math.round((a.filled / total) * 100);
              return (
                <tr key={a.agencyId} className="border-b border-rule last:border-0">
                  <td className={tdClass}>{a.agencyName}</td>
                  <td className={`${tdClass} ${numClass}`}>{a.filled}</td>
                  <td className={`${tdClass} ${numClass}`}>{a.open}</td>
                  <td className={`${tdClass} ${numClass}`}>{total === 0 ? "—" : `${pct}%`}</td>
                  <td className={tdClass}>
                    <div aria-hidden="true" className="h-1 bg-rule">
                      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
