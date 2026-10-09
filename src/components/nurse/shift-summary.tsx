import { formatDay, formatHours, isOvernight, scheduledHours } from "./format";
import type { ShiftDto } from "./types";

/** Agency, role, day, time range (with overnight note) and scheduled hours for one shift. */
export function ShiftSummary({ shift }: { shift: ShiftDto }) {
  const overnight = isOvernight(shift.startTime, shift.endTime);
  return (
    <div className="min-w-0">
      <p className="flex flex-wrap items-baseline gap-x-2.5">
        <span className="font-medium text-ink">{formatDay(shift.date)}</span>
        <span className="font-mono text-small text-ink">
          {shift.startTime}–{shift.endTime}
        </span>
        {overnight && <span className="font-serif text-muted italic">overnight</span>}
      </p>
      <p className="mt-0.5 text-small text-muted">
        <span className="font-mono text-ink">{shift.role}</span> · {shift.agencyName} ·{" "}
        <span className="tabular-nums">
          {formatHours(scheduledHours(shift.startTime, shift.endTime))}
        </span>
      </p>
    </div>
  );
}
