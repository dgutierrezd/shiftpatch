"use client";

import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { StatusBadge } from "@/components/status-badge";
import {
  Button,
  Card,
  tableClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api-client";
import { track } from "@/lib/analytics";
import { formatShiftDate } from "./format";
import { StatusRow } from "./section-status";
import { ShiftTime } from "./shifts-table";
import type { TimesheetDto } from "./types";

const COLUMNS = ["Nurse", "Shift", "Scheduled", "Worked", "Status", "Action"] as const;

function hours(value: number | null): string {
  return value === null ? "—" : `${value} h`;
}

function ApproveButton({
  timesheet,
  onChanged,
}: {
  timesheet: TimesheetDto;
  onChanged: () => void;
}) {
  const notify = useNotify();
  const [pending, setPending] = useState(false);

  async function approve() {
    setPending(true);
    try {
      await api(`/api/timesheets/${encodeURIComponent(timesheet.id)}/approve`, { method: "POST" });
      notify("success", "Timesheet approved");
      track("timesheet_approved", { by: "agency" });
      onChanged();
    } catch (err) {
      notify("error", errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="secondary"
      onClick={approve}
      disabled={pending}
      aria-label={`Approve timesheet for ${timesheet.nurseName} on ${formatShiftDate(timesheet.date)}`}
    >
      {pending ? "Approving…" : "Approve"}
    </Button>
  );
}

export function TimesheetsTable({
  timesheets,
  loading,
  error,
  onChanged,
}: {
  timesheets: TimesheetDto[] | undefined;
  loading: boolean;
  error: string | null;
  onChanged: () => void;
}) {
  const rows = timesheets ?? [];

  return (
    <Card title="Timesheets">
      <div className="-mx-5 overflow-x-auto">
        <table data-testid="timesheet-table" className={tableClass}>
          <caption className="sr-only">Timesheets for your agency&apos;s shifts</caption>
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
            {rows.length === 0 ? (
              <StatusRow
                colSpan={COLUMNS.length}
                loading={loading}
                error={error}
                empty="No timesheets yet. They appear once a nurse claims one of your shifts."
              />
            ) : (
              rows.map((t) => (
                <tr key={t.id} className={trClass}>
                  <td className={tdClass}>{t.nurseName}</td>
                  <td className={tdClass}>
                    <div className="whitespace-nowrap">{formatShiftDate(t.date)}</div>
                    <div className="text-xs text-muted">
                      <ShiftTime startTime={t.startTime} endTime={t.endTime} />
                    </div>
                  </td>
                  <td className={`${tdClass} tabular-nums`}>{hours(t.scheduledHours)}</td>
                  <td className={`${tdClass} tabular-nums`}>{hours(t.workedHours)}</td>
                  <td className={tdClass}>
                    <StatusBadge status={t.status} />
                  </td>
                  <td className={tdClass}>
                    {t.status === "submitted" ? (
                      <ApproveButton timesheet={t} onChanged={onChanged} />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {error && rows.length > 0 && (
        <p role="alert" className="mt-4 text-sm text-danger">
          Couldn&apos;t refresh timesheets: {error}
        </p>
      )}
    </Card>
  );
}
