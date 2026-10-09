"use client";

import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { StatusBadge } from "@/components/status-badge";
import {
  Button,
  freshRowClass,
  idClass,
  Section,
  Select,
  tableClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from "@/components/ui/primitives";
import { useFreshIds } from "@/components/ui/use-fresh-ids";
import { api, errorMessage } from "@/lib/api-client";
import { track } from "@/lib/analytics";
import { CANCELLATION_REASONS } from "@/lib/validation";
import { formatShiftDate, isOvernight } from "./format";
import { StatusRow } from "./section-status";
import type { ShiftDto } from "./types";

type Reason = (typeof CANCELLATION_REASONS)[number];

const REASON_LABELS: Record<Reason, string> = {
  "no-show": "No-show",
  advance: "Cancelled in advance",
};

const COLUMNS = ["Date", "Time", "Role", "Status", "Claimed by", "Action"] as const;

export function ShiftTime({ startTime, endTime }: { startTime: string; endTime: string }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 whitespace-nowrap">
      <span className="font-mono text-small">
        {startTime}–{endTime}
      </span>
      {isOvernight(startTime, endTime) && (
        <span className="font-serif text-muted italic">overnight</span>
      )}
    </span>
  );
}

function CancelControls({ shift, onChanged }: { shift: ShiftDto; onChanged: () => void }) {
  const notify = useNotify();
  const [reason, setReason] = useState<Reason>("no-show");
  const [pending, setPending] = useState(false);
  const selectId = `cancel-reason-${shift.id}`;

  async function cancel() {
    setPending(true);
    try {
      await api(`/api/shifts/${encodeURIComponent(shift.id)}/cancel`, { body: { reason } });
      notify("success", "Shift cancelled");
      track("shift_cancelled", { by: "agency", reason });
      onChanged();
    } catch (err) {
      notify("error", errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={selectId} className="sr-only">
        Cancellation reason for {shift.role} shift on {formatShiftDate(shift.date)}
      </label>
      <Select
        id={selectId}
        name="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value as Reason)}
        className="h-8 w-auto text-small"
      >
        {CANCELLATION_REASONS.map((r) => (
          <option key={r} value={r}>
            {REASON_LABELS[r]}
          </option>
        ))}
      </Select>
      <Button
        variant="danger"
        size="sm"
        className="h-8"
        onClick={cancel}
        disabled={pending}
        data-testid="shift-cancel-button"
      >
        {pending ? "Cancelling…" : "Cancel & reopen"}
      </Button>
    </div>
  );
}

function compareShifts(a: ShiftDto, b: ShiftDto): number {
  return `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);
}

export function ShiftsTable({
  shifts,
  loading,
  error,
  nurseNames,
  onChanged,
}: {
  shifts: ShiftDto[] | undefined;
  loading: boolean;
  error: string | null;
  nurseNames: ReadonlyMap<string, string>;
  onChanged: () => void;
}) {
  const sorted = shifts ? [...shifts].sort(compareShifts) : [];
  const fresh = useFreshIds(shifts?.map((s) => s.id));

  return (
    <Section
      title="Your shifts"
      dek="A cancellation or no-show reopens the shift for other nurses."
    >
      <div className="relative overflow-x-auto">
        <table className={tableClass}>
          <caption className="sr-only">Shifts posted by your agency</caption>
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
            {sorted.length === 0 ? (
              <StatusRow
                colSpan={COLUMNS.length}
                loading={loading}
                error={error}
                empty="No shifts posted yet. Use “Post a shift” to add one."
              />
            ) : (
              sorted.map((shift) => (
                <tr
                  key={shift.id}
                  className={`${trClass} ${fresh.has(shift.id) ? freshRowClass : ""}`}
                >
                  <td className={`${tdClass} whitespace-nowrap`}>{formatShiftDate(shift.date)}</td>
                  <td className={tdClass}>
                    <ShiftTime startTime={shift.startTime} endTime={shift.endTime} />
                  </td>
                  <td className={`${tdClass} font-mono text-small`}>{shift.role}</td>
                  <td className={tdClass}>
                    <StatusBadge status={shift.status} />
                  </td>
                  <td className={tdClass}>
                    {shift.claimedBy ? (
                      (nurseNames.get(shift.claimedBy) ?? (
                        <code className={idClass}>{shift.claimedBy}</code>
                      ))
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className={tdClass}>
                    {shift.status === "filled" ? (
                      <CancelControls shift={shift} onChanged={onChanged} />
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
      {error && sorted.length > 0 && (
        <p role="alert" className="mt-4 text-small text-danger">
          Couldn&apos;t refresh shifts: {error}
        </p>
      )}
    </Section>
  );
}
