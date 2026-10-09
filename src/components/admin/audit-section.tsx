"use client";

import { useState } from "react";
import {
  Button,
  rowEnterClass,
  staggerStyle,
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

/** Color cue by verb (decorative; the label text carries the meaning). */
function actionTone(action: string): string {
  if (/cancel|reject|block|expire|fail|denied/.test(action)) return "bg-danger";
  if (/claim|verif|approv|creat|post|submit/.test(action)) return "bg-success";
  if (/report|export|download|view|reset/.test(action)) return "bg-warning";
  return "bg-slate-400";
}

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
            className={`${theadClass} sticky top-0 z-10 bg-surface shadow-[0_1px_0_var(--border)]`}
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
            {rows.map((e, i) => {
              const pairs = metadataPairs(e.metadata);
              return (
                <tr
                  key={e.id}
                  style={staggerStyle(i)}
                  className={`${trClass} even:bg-slate-50/60 ${rowEnterClass}`}
                >
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
                    <span className="flex items-center gap-1.5 font-medium">
                      <span
                        aria-hidden="true"
                        className={`size-1.5 shrink-0 rounded-full ${actionTone(e.action)}`}
                      />
                      {actionLabel(e.action)}
                    </span>
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
      {all.length > visible && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Show {Math.min(PAGE_SIZE, all.length - visible)} more
          </Button>
        </div>
      )}
    </AdminSection>
  );
}
