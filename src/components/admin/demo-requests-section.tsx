import {
  rowEnterClass,
  staggerStyle,
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
        <ul className="mb-4 flex flex-wrap gap-2 text-xs">
          <li className="rounded-full bg-brand-soft px-3 py-1 font-semibold text-brand-strong">
            {rows.length} total
          </li>
          {Object.entries(byRole).map(([role, n]) => (
            <li key={role} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {role}: {n}
            </li>
          ))}
        </ul>
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
            {rows.map((r, i) => (
              <tr key={r.id} className={`${trClass} ${rowEnterClass}`} style={staggerStyle(i)}>
                <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(r.createdAt)}</td>
                <td className={tdClass}>
                  <a href={`mailto:${r.email}`} className="text-brand hover:underline">
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
