import { tableClass, tdClass, thClass, theadClass, trClass } from "@/components/ui/primitives";
import { actionLabel, formatDateTime, metadataPairs } from "./format";
import { AdminSection, TableScroll, TableStatus } from "./section";
import type { AuditEntry, Loadable } from "./types";

const COLUMNS = ["Time", "Actor", "Action", "Entity", "Details"];

export function AuditSection({ audit }: { audit: Loadable<AuditEntry[]> }) {
  const rows = audit.data ?? [];
  return (
    <AdminSection
      id="audit"
      title="Audit log"
      description="Latest 100 events, newest first."
      error={audit.data ? audit.error : null}
    >
      <TableScroll>
        <table data-testid="audit-log-table" className={tableClass}>
          <caption className="sr-only">Audit log, newest first</caption>
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
            {rows.map((e) => {
              const pairs = metadataPairs(e.metadata);
              return (
                <tr key={e.id} className={trClass}>
                  <td className={`${tdClass} whitespace-nowrap text-xs tabular-nums`}>
                    <time dateTime={e.createdAt}>{formatDateTime(e.createdAt)}</time>
                  </td>
                  <td className={tdClass}>
                    <span className="font-mono text-xs">{e.actorId ?? "system"}</span>
                    {e.actorRole && (
                      <span className="block text-xs capitalize text-muted">{e.actorRole}</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    <span className="font-medium">{actionLabel(e.action)}</span>
                    <span className="block font-mono text-[11px] text-muted">{e.action}</span>
                  </td>
                  <td className={`${tdClass} text-xs`}>
                    {e.entity}
                    {e.entityId && <span className="block font-mono text-muted">{e.entityId}</span>}
                  </td>
                  <td className={`${tdClass} text-xs`}>
                    {pairs.length === 0 ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <dl className="flex max-w-xs flex-wrap gap-x-3 gap-y-0.5">
                        {pairs.map(([k, v]) => (
                          <div key={k} className="flex gap-1">
                            <dt className="text-muted">{k}:</dt>
                            <dd className="break-all">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </td>
                </tr>
              );
            })}
            <TableStatus
              colSpan={COLUMNS.length}
              resource={audit}
              rows={rows.length}
              empty="No audit events yet."
            />
          </tbody>
        </table>
      </TableScroll>
    </AdminSection>
  );
}
