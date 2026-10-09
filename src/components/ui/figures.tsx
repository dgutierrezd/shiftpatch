export interface FigureItem {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "danger";
}

const TONE: Record<NonNullable<FigureItem["tone"]>, string> = {
  default: "text-ink",
  warning: "text-warning",
  danger: "text-danger",
};

/*
 * Hairlines are drawn per breakpoint (disjoint ranges, so rules never fight): a vertical
 * rule before every figure that doesn't start a row, a horizontal rule above later rows.
 * Text in the first column stays flush with the content edge.
 */
const LAYOUTS = {
  /** Three figures in one row at every width. */
  three: {
    grid: "grid-cols-3",
    cell: "[&:not(:first-child)]:border-l [&:not(:first-child)]:pl-4 sm:[&:not(:first-child)]:pl-6",
  },
  /** Six figures: 2 columns on phones, 3 on tablets, one row on desktop. */
  six: {
    grid: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
    cell: "max-sm:[&:nth-child(even)]:border-l max-sm:[&:nth-child(even)]:pl-4 max-sm:[&:nth-child(n+3)]:border-t sm:max-lg:[&:not(:nth-child(3n+1))]:border-l sm:max-lg:[&:not(:nth-child(3n+1))]:pl-5 sm:max-lg:[&:nth-child(n+4)]:border-t lg:[&:not(:first-child)]:border-l lg:[&:not(:first-child)]:pl-5",
  },
} as const;

/**
 * Key figures set like a report: numbers in the serif with small muted labels, separated
 * by vertical hairlines between a rule above and below. No boxes, no count-up.
 */
export function Figures({
  items,
  label,
  layout,
}: {
  items: FigureItem[];
  label: string;
  layout: keyof typeof LAYOUTS;
}) {
  const { grid, cell } = LAYOUTS[layout];
  return (
    <dl aria-label={label} className={`grid border-y border-rule ${grid}`}>
      {items.map((f) => (
        <div key={f.label} className={`flex flex-col border-rule py-4 pr-4 ${cell}`}>
          <dt className="text-small text-muted">{f.label}</dt>
          <dd className={`figure mt-1.5 text-[2.25rem] leading-none ${TONE[f.tone ?? "default"]}`}>
            {f.value}
          </dd>
          {f.hint && <dd className="mt-1.5 text-small text-muted">{f.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
