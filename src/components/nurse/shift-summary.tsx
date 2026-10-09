import { formatDay, formatHours, isOvernight, scheduledHours } from "./format";
import type { ShiftDto } from "./types";

/** Agency, role, day, time range (with overnight tag) and scheduled hours for one shift. */
export function ShiftSummary({ shift }: { shift: ShiftDto }) {
  const overnight = isOvernight(shift.startTime, shift.endTime);
  return (
    <div className="min-w-0 space-y-1">
      <p className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
          {shift.role}
        </span>
        <span className="truncate font-medium">{shift.agencyName}</span>
      </p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        <span className="font-medium text-foreground">{formatDay(shift.date)}</span>
        <span>
          {shift.startTime}–{shift.endTime}
        </span>
        {overnight && (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
            overnight
          </span>
        )}
        <span aria-hidden="true">·</span>
        <span>{formatHours(scheduledHours(shift.startTime, shift.endTime))}</span>
      </p>
    </div>
  );
}
