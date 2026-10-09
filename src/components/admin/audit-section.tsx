"use client";

import { useState } from "react";
import {
  Button,
  idClass,
  tableClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from "@/components/ui/primitives";
import { actionLabel, formatDateTime, metadataPairs } from "./format";
import { AdminSection, TableScroll, TableStatus } from "./section";
import type { AuditEntry, Loadable } from "./types";

const COLUMNS = ["Time", "Actor", "Action", "Entity", "Details"];
const PAGE_SIZE = 25;

export function AuditSection({ audit }: { audit: Loadable<AuditEntry[]> }) {
  const all = audit.data ?? [];
  const [visible, setVisible] = useState(PAGE_SIZE);
  const rows = all.slice(0, visible);
  return (
    <AdminSection
      id="audit"
      title="Audit log"
      description={`Newest first · showing ${rows.length} of ${all.length} most recent events.`}
      error={audit.data ? audit.error : null}
    >
      <TableScroll tall>
        <table data-testid="audit-log-table" className={tableClass}>
          <caption className="sr-only">Audit log, newest first</caption>
          <thead
            className={`${theadClass} sticky top-0 z-10 bg-paper shadow-[0_1px_0_var(--rule)]`}
          >
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
                <tr key={e.id} className={`${trClass} align-top`}>
                  <td className={`${tdClass} font-mono text-small whitespace-nowrap`}>
                    <time dateTime={e.createdAt}>{formatDateTime(e.createdAt)}</time>
                  </td>
                  <td className={tdClass}>
                    <span className={idClass}>{e.actorId ?? "system"}</span>
                    {e.actorRole && (
                      <span className="block text-small text-muted capitalize">{e.actorRole}</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    <span className="text-ink">{actionLabel(e.action)}</span>
                    <span className="block font-mono text-[0.75rem] text-muted">{e.action}</span>
                  </td>
                  <td className={`${tdClass} text-small`}>
                    {e.entity}
                    {e.entityId && <span className="block font-mono text-muted">{e.entityId}</span>}
                  </td>
                  <td className={`${tdClass} text-small`}>
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
      {all.length > visible && (
        <div className="mt-5">
          <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Show {Math.min(PAGE_SIZE, all.length - visible)} more
          </Button>
        </div>
      )}
    </AdminSection>
  );
}
