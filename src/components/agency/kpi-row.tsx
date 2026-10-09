import type { ShiftDto } from "./types";

export function computeKpis(shifts: ShiftDto[]) {
  const open = shifts.filter((s) => s.status === "open").length;
  const filled = shifts.filter((s) => s.status === "filled").length;
  const active = open + filled;
  return { open, filled, fillRate: active === 0 ? null : Math.round((filled / active) * 100) };
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      {/* Re-keyed on change so a new value ticks in. */}
      <dd key={value} className="mt-1 animate-tick text-2xl font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function show(n: number | null | undefined, suffix = ""): string {
  return n === null || n === undefined ? "—" : `${n}${suffix}`;
}

/** Fill rate = filled / (open + filled); cancelled shifts are excluded. */
export function KpiRow({ shifts }: { shifts: ShiftDto[] | undefined }) {
  const kpis = shifts ? computeKpis(shifts) : null;
  return (
    <dl className="grid grid-cols-3 gap-3" aria-label="Shift summary">
      <Kpi label="Open" value={show(kpis?.open)} />
      <Kpi label="Filled" value={show(kpis?.filled)} />
      <Kpi label="Fill rate" value={show(kpis?.fillRate, "%")} />
    </dl>
  );
}
