"use client";

import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { StatusBadge } from "@/components/status-badge";
import {
  Button,
  idClass,
  numClass,
  tableClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api-client";
import { track } from "@/lib/analytics";
import { isOvernight } from "./format";
import { AdminSection, TableScroll, TableStatus } from "./section";
import type { Loadable, TimesheetDto } from "./types";

const COLUMNS = ["Nurse", "Agency", "Shift", "When", "Scheduled", "Worked", "Status", "Action"];
const NUMERIC: ReadonlySet<string> = new Set(["Scheduled", "Worked"]);

function hours(h: number | null): string {
  return h === null ? "—" : `${h} h`;
}

export function TimesheetsSection({
  timesheets,
  onChanged,
}: {
  timesheets: Loadable<TimesheetDto[]>;
  onChanged: () => Promise<void>;
}) {
  const notify = useNotify();
  const [busyId, setBusyId] = useState<string | null>(null);
  const rows = timesheets.data ?? [];

  async function approve(t: TimesheetDto) {
    setBusyId(t.id);
    try {
      await api(`/api/timesheets/${encodeURIComponent(t.id)}/approve`, { method: "POST" });
      notify("success", "Timesheet approved");
      track("timesheet_approved", { by: "admin" });
      await onChanged();
    } catch (err) {
      notify("error", errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminSection
      id="timesheets"
      title="Timesheets"
      description="One per filled shift. Approve once the nurse has submitted hours."
      error={timesheets.data ? timesheets.error : null}
    >
      <TableScroll>
        <table data-testid="timesheet-table" className={tableClass}>
          <caption className="sr-only">Timesheets for all shifts</caption>
          <thead className={theadClass}>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c} scope="col" className={`${thClass} ${NUMERIC.has(c) ? numClass : ""}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className={trClass}>
                <td className={tdClass}>{t.nurseName}</td>
                <td className={tdClass}>{t.agencyName}</td>
                <td className={tdClass}>
                  <span className={idClass}>{t.shiftId}</span>
                </td>
                <td className={`${tdClass} whitespace-nowrap`}>
                  <span className="font-mono text-small">
                    {t.date} · {t.startTime}–{t.endTime}
                  </span>
                  {isOvernight(t.startTime, t.endTime) && (
                    <span className="ml-1.5 font-serif text-muted italic">overnight</span>
                  )}
                </td>
                <td className={`${tdClass} ${numClass}`}>{hours(t.scheduledHours)}</td>
                <td className={`${tdClass} ${numClass}`}>{hours(t.workedHours)}</td>
                <td className={tdClass}>
                  <StatusBadge status={t.status} />
                </td>
                <td className={tdClass}>
                  {t.status === "submitted" ? (
                    <Button
                      size="sm"
                      disabled={busyId === t.id}
                      aria-label={`Approve timesheet for ${t.nurseName}, shift ${t.shiftId}`}
                      onClick={() => void approve(t)}
                    >
                      {busyId === t.id ? "Approving…" : "Approve"}
                    </Button>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            <TableStatus
              colSpan={COLUMNS.length}
              resource={timesheets}
              rows={rows.length}
              empty="No timesheets yet. They appear once a nurse claims a shift."
            />
          </tbody>
        </table>
      </TableScroll>
    </AdminSection>
  );
}
