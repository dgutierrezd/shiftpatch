"use client";

import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { StatusBadge } from "@/components/status-badge";
import {
  Button,
  EmptyRow,
  Input,
  LoadingRow,
  numClass,
  Section,
  tableClass,
  tdClass,
  theadClass,
  thClass,
  trClass,
} from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api-client";
import { track } from "@/lib/analytics";
import { formatDay, formatHours, isOvernight } from "./format";
import { SectionStatus } from "./section-status";
import type { TimesheetDto } from "./types";
import type { Resource } from "./use-resource";

const COLUMNS = ["Shift", "Agency", "Scheduled", "Worked", "Status", "Action"];
const NUMERIC = new Set(["Scheduled", "Worked"]);

function SubmitHours({ sheet, onChanged }: { sheet: TimesheetDto; onChanged: () => void }) {
  const notify = useNotify();
  const [hours, setHours] = useState(String(sheet.scheduledHours));
  const [pending, setPending] = useState(false);
  const inputId = `worked-${sheet.id}`;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const workedHours = Number(hours);
    if (
      hours.trim() === "" ||
      !Number.isFinite(workedHours) ||
      workedHours < 0 ||
      workedHours > 24
    ) {
      notify("error", "Worked hours must be between 0 and 24");
      return;
    }
    setPending(true);
    try {
      await api(`/api/timesheets/${encodeURIComponent(sheet.id)}/submit`, {
        body: { workedHours },
      });
      notify("success", "Timesheet submitted");
      track("timesheet_submitted");
      onChanged();
    } catch (err) {
      notify("error", errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <label htmlFor={inputId} className="sr-only">
        Worked hours for {sheet.date}
      </label>
      <Input
        id={inputId}
        type="number"
        min={0}
        max={24}
        step={0.25}
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        className="h-8 w-20 text-right font-mono text-small tabular-nums"
      />
      <Button type="submit" variant="secondary" size="sm" className="h-8" disabled={pending}>
        {pending ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}

/** The table (and its test ID) is always rendered; empty/loading show as a row. */
export function TimesheetsSection({
  timesheets,
  onChanged,
}: {
  timesheets: Resource<TimesheetDto[]>;
  onChanged: () => void;
}) {
  const rows = timesheets.data ?? [];
  return (
    <Section title="Timesheets" dek="Submit the hours you worked; the agency approves them.">
      {timesheets.error && <SectionStatus resource={timesheets} label="timesheets" />}
      <div className="overflow-x-auto">
        <table data-testid="timesheet-table" className={tableClass}>
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
            {rows.length === 0 ? (
              timesheets.data === null && !timesheets.error ? (
                <LoadingRow colSpan={COLUMNS.length} label="Loading timesheets…" />
              ) : (
                <EmptyRow colSpan={COLUMNS.length}>
                  No timesheets yet. They appear here once you work a claimed shift.
                </EmptyRow>
              )
            ) : (
              rows.map((t) => (
                <tr key={t.id} className={trClass}>
                  <td className={tdClass}>
                    <span className="font-medium whitespace-nowrap">{formatDay(t.date)}</span>
                    <span className="block font-mono text-small whitespace-nowrap text-muted">
                      {t.startTime}–{t.endTime}
                      {isOvernight(t.startTime, t.endTime) && (
                        <span className="ml-1.5 font-serif italic">overnight</span>
                      )}
                    </span>
                  </td>
                  <td className={tdClass}>{t.agencyName}</td>
                  <td className={`${tdClass} ${numClass}`}>{formatHours(t.scheduledHours)}</td>
                  <td className={`${tdClass} ${numClass}`}>
                    {t.workedHours === null ? "—" : formatHours(t.workedHours)}
                  </td>
                  <td className={tdClass}>
                    <StatusBadge status={t.status} />
                  </td>
                  <td className={tdClass}>
                    {t.status === "pending" ? (
                      <SubmitHours sheet={t} onChanged={onChanged} />
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
    </Section>
  );
}
