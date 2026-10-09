import { staggerStyle } from "@/components/ui/primitives";

const ROWS = [
  { role: "RN", unit: "ICU · Night", time: "19:00–07:00", status: "filled", who: "M. Lopez" },
  { role: "LPN", unit: "Med-Surg", time: "07:00–15:00", status: "open", who: null },
  { role: "CNA", unit: "ER · Day", time: "08:00–20:00", status: "open", who: null },
] as const;

const BADGE = {
  open: "bg-brand-soft text-brand-strong",
  filled: "bg-success-soft text-success",
} as const;

/**
 * Illustrative product preview for the hero, built from HTML/CSS (no images, no external
 * assets). Purely decorative: hidden from assistive tech behind a one-line description.
 */
export function BoardPreview() {
  return (
    <figure
      className="relative mx-auto w-full max-w-md"
      aria-label="Illustration: a live shift board with open and filled shifts"
    >
      <div aria-hidden="true" className="animate-float">
        <div className="rounded-2xl border border-border bg-surface/95 p-4 shadow-lift backdrop-blur sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Tonight&apos;s board</p>
              <p className="text-xs text-muted">St. Example General</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-success" />
              </span>
              Live
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["Open", "2"],
              ["Filled", "1"],
              ["Fill rate", "33%"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border px-2.5 py-2">
                <p className="text-[10px] font-medium tracking-wide text-muted uppercase">
                  {label}
                </p>
                <p className="text-lg font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          <ul className="mt-4 divide-y divide-border">
            {ROWS.map((r, i) => (
              <li
                key={r.role}
                style={staggerStyle(i + 4)}
                className="flex animate-rise stagger items-center justify-between gap-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">
                    {r.role}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.unit}</p>
                    <p className="text-xs text-muted tabular-nums">{r.time}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {r.who && <span className="hidden text-xs text-muted sm:inline">{r.who}</span>}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${BADGE[r.status]}`}
                  >
                    <span className="size-1.5 rounded-full bg-current opacity-70" />
                    {r.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/20 bg-danger-soft/70 px-3 py-2 text-xs text-danger">
            <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none">
              <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth={1.6} />
              <path d="M5.5 10.5l5-5" stroke="currentColor" strokeWidth={1.6} />
            </svg>
            Claim blocked — TB screening expired
          </div>
        </div>

        {/* Floating confirmation, echoing the in-app banner. */}
        <div
          style={staggerStyle(7)}
          className="absolute -top-4 right-2 flex animate-pop stagger items-center gap-2 rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-xs font-semibold text-success shadow-lift sm:-right-6"
        >
          <span className="flex size-4 items-center justify-center rounded-full bg-success text-white">
            <svg viewBox="0 0 16 16" className="size-2.5" fill="none">
              <path
                d="M3.5 8.5l3 3 6-7"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          ICU night shift covered
        </div>
      </div>
    </figure>
  );
}
