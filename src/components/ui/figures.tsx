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

/**
 * Key figures set like a report: a row of numbers in the serif, separated by vertical
 * hairlines (1px grid gaps over the rule color), no boxes. Wraps into a ruled grid on phones.
 */
export function Figures({
  items,
  label,
  columns,
}: {
  items: FigureItem[];
  label: string;
  /** Tailwind grid-cols classes for each breakpoint. */
  columns: string;
}) {
  return (
    <div className="border-y border-rule">
      <dl aria-label={label} className={`-mx-4 grid gap-px bg-rule ${columns}`}>
        {items.map((f) => (
          <div key={f.label} className="flex flex-col bg-paper px-4 py-4">
            <dt className="text-small text-muted">{f.label}</dt>
            <dd
              className={`figure mt-1.5 text-[2.25rem] leading-none ${TONE[f.tone ?? "default"]}`}
            >
              {f.value}
            </dd>
            {f.hint && <dd className="mt-1.5 text-small text-muted">{f.hint}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
}
