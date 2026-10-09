import {
  linkClass,
  tableClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from "@/components/ui/primitives";
import { formatDateTime } from "./format";
import { AdminSection, TableScroll, TableStatus } from "./section";
import type { DemoRequestDto, Loadable } from "./types";

const COLUMNS = ["Requested", "Email", "Organization", "Role"];

/**
 * Walkthrough requests from the public page — the founder's demand-validation signal.
 * Kept across demo resets because these are real leads, not sample data.
 */
export function DemoRequestsSection({ requests }: { requests: Loadable<DemoRequestDto[]> }) {
  const rows = requests.data ?? [];
  const byRole = rows.reduce<Record<string, number>>((acc, r) => {
    const key = r.role ?? "Unspecified";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AdminSection
      id="demo-requests"
      title="Demo requests"
      description="People who asked for a walkthrough on the public page. Kept when demo data is reset."
      error={requests.data ? requests.error : null}
    >
      {rows.length > 0 && (
        <p className="mb-5 text-muted">
          <span className="figure text-lead text-ink">{rows.length}</span>{" "}
          {rows.length === 1 ? "request" : "requests"} so far —{" "}
          {Object.entries(byRole)
            .map(([role, n]) => `${role} ${n}`)
            .join(", ")}
          .
        </p>
      )}
      <TableScroll>
        <table className={tableClass}>
          <caption className="sr-only">Demo requests, newest first</caption>
          <thead className={theadClass}>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c} scope="col" className={thClass}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={trClass}>
                <td className={`${tdClass} font-mono text-small whitespace-nowrap`}>
                  {formatDateTime(r.createdAt)}
                </td>
                <td className={tdClass}>
                  <a href={`mailto:${r.email}`} className={linkClass}>
                    {r.email}
                  </a>
                </td>
                <td className={tdClass}>{r.organization ?? "—"}</td>
                <td className={tdClass}>{r.role ?? "—"}</td>
              </tr>
            ))}
            <TableStatus
              colSpan={COLUMNS.length}
              resource={requests}
              rows={rows.length}
              empty="No demo requests yet. Share the public page to start collecting them."
            />
          </tbody>
        </table>
      </TableScroll>
    </AdminSection>
  );
}
