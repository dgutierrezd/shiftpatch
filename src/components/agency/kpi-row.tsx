import { Figures } from "@/components/ui/figures";
import type { ShiftDto } from "./types";

export function computeKpis(shifts: ShiftDto[]) {
  const open = shifts.filter((s) => s.status === "open").length;
  const filled = shifts.filter((s) => s.status === "filled").length;
  const active = open + filled;
  return { open, filled, fillRate: active === 0 ? null : Math.round((filled / active) * 100) };
}

function show(n: number | null | undefined, suffix = ""): string {
  return n === null || n === undefined ? "—" : `${n}${suffix}`;
}

/** Fill rate = filled / (open + filled); cancelled shifts are excluded. */
export function KpiRow({ shifts }: { shifts: ShiftDto[] | undefined }) {
  const kpis = shifts ? computeKpis(shifts) : null;
  return (
    <Figures
      label="Shift summary"
      layout="three"
      items={[
        { label: "Open", value: show(kpis?.open) },
        { label: "Filled", value: show(kpis?.filled) },
        { label: "Fill rate", value: show(kpis?.fillRate, "%") },
      ]}
    />
  );
}
