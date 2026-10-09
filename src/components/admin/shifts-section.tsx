"use client";

import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { StatusBadge } from "@/components/status-badge";
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
import { useFreshIds } from "@/components/ui/use-fresh-ids";
import { api, errorMessage } from "@/lib/api-client";
import { track } from "@/lib/analytics";
import { isOvernight } from "./format";
import { AdminSection, TableScroll, TableStatus } from "./section";
import type { Loadable, ShiftDto } from "./types";

type Filter = "all" | "open" | "filled";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "filled", label: "Filled" },
];

const COLUMNS = ["Shift", "Agency", "Role", "Date", "Time", "Claimed by", "Status", "Action"];

export function ShiftsSection({
  shifts,
  onChanged,
}: {
  shifts: Loadable<ShiftDto[]>;
  onChanged: () => Promise<void>;
}) {
  const notify = useNotify();
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const all = shifts.data ?? [];
  const rows = filter === "all" ? all : all.filter((s) => s.status === filter);
  const fresh = useFreshIds(shifts.data?.map((s) => s.id));
  const count = (f: Filter) =>
    f === "all" ? all.length : all.filter((s) => s.status === f).length;

  async function markNoShow(shift: ShiftDto) {
    setBusyId(shift.id);
    try {
      await api(`/api/shifts/${encodeURIComponent(shift.id)}/cancel`, {
        body: { reason: "no-show" },
      });
      notify("success", "Shift cancelled");
      track("shift_cancelled", { by: "admin", reason: "no-show" });
      await onChanged();
    } catch (err) {
      notify("error", errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminSection
      id="shifts"
      title="Shifts"
      error={shifts.data ? shifts.error : null}
      actions={
        <div role="group" aria-label="Filter shifts by status" className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                filter === f.value
                  ? "border-brand bg-brand-soft text-brand-strong"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {f.label} <span className="tabular-nums">({count(f.value)})</span>
            </button>
          ))}
        </div>
      }
    >
      <TableScroll>
        <table data-testid="admin-dashboard-shift-table" className={tableClass}>
          <caption className="sr-only">All shifts across agencies</caption>
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
            {rows.map((s, i) => (
              <tr
                key={s.id}
                style={staggerStyle(i)}
                className={`${trClass} ${fresh.has(s.id) ? "animate-flash" : rowEnterClass}`}
              >
                <td className={`${tdClass} font-mono text-xs`}>{s.id}</td>
                <td className={tdClass}>{s.agencyName}</td>
                <td className={tdClass}>{s.role}</td>
                <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{s.date}</td>
                <td className={`${tdClass} whitespace-nowrap tabular-nums`}>
                  {s.startTime}–{s.endTime}
                  {isOvernight(s.startTime, s.endTime) && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      overnight
                    </span>
                  )}
                </td>
                <td className={`${tdClass} font-mono text-xs`}>{s.claimedBy ?? "—"}</td>
                <td className={tdClass}>
                  <StatusBadge testId="admin-shift-status-badge" status={s.status} />
                </td>
                <td className={tdClass}>
                  {s.status === "filled" ? (
                    <Button
                      variant="danger"
                      className="whitespace-nowrap px-2.5 py-1 text-xs"
                      data-testid="shift-cancel-button"
                      disabled={busyId === s.id}
                      aria-label={`Mark no-show for shift ${s.id}`}
                      onClick={() => void markNoShow(s)}
                    >
                      {busyId === s.id ? "Cancelling…" : "Mark no-show"}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            <TableStatus
              colSpan={COLUMNS.length}
              resource={shifts}
              rows={rows.length}
              empty={filter === "all" ? "No shifts yet." : `No ${filter} shifts.`}
            />
          </tbody>
        </table>
      </TableScroll>
    </AdminSection>
  );
}
