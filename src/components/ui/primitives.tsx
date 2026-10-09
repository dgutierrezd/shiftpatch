import type {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-sm hover:bg-brand-strong hover:shadow-md",
  secondary:
    "border border-border bg-surface text-foreground shadow-xs hover:border-slate-300 hover:bg-slate-50",
  danger: "border border-danger/30 bg-surface text-danger hover:bg-danger-soft",
  ghost: "text-muted hover:bg-slate-100 hover:text-foreground",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Card({
  title,
  actions,
  children,
  className = "",
  style,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section
      style={style}
      className={`rounded-xl border border-border bg-surface shadow-sm ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          {title && <h2 className="text-base font-semibold tracking-tight">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

const control =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-xs transition-[border-color,box-shadow] duration-150 hover:border-slate-300 focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/20 aria-invalid:border-danger/60";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${control} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${control} ${props.className ?? ""}`} />;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-muted">
        <span className="inline-flex animate-fade flex-col items-center gap-2">
          <EmptyIcon />
          <span>{children}</span>
        </span>
      </td>
    </tr>
  );
}

/** Small decorative tray icon for empty lists and tables. */
export function EmptyIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-8 rounded-full bg-slate-100 p-1.5 text-slate-400 ${className}`}
    >
      <path d="M4 13.5 6.2 6.6A1.5 1.5 0 0 1 7.6 5.5h8.8a1.5 1.5 0 0 1 1.4 1.1L20 13.5" />
      <path d="M4 13.5V17a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 17v-3.5h-4.5l-1 2h-5l-1-2Z" />
    </svg>
  );
}

/** Centered empty state for non-table lists. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex animate-fade flex-col items-center gap-2 py-6 text-center text-sm text-muted">
      <EmptyIcon />
      <p>{children}</p>
    </div>
  );
}

/** Shimmering placeholder block; decorative only. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton block h-3 ${className}`} />;
}

/** Placeholder lines for a list while it loads; the label is announced to screen readers. */
export function SkeletonList({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div role="status" className="mb-4 space-y-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="w-2/5" />
            <Skeleton className="h-2.5 w-3/5" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton table rows so the table (and its header / test ID) renders while loading. */
export function SkeletonRows({
  colSpan,
  label,
  rows = 3,
}: {
  colSpan: number;
  label: string;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className={trClass} aria-hidden={r > 0 ? true : undefined}>
          {Array.from({ length: colSpan }, (_, c) => (
            <td key={c} className={tdClass}>
              {r === 0 && c === 0 && (
                <span role="status" className="sr-only">
                  {label}
                </span>
              )}
              <Skeleton className={c === 0 ? "w-24" : c % 2 ? "w-16" : "w-20"} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Style for staggered entrance: pair with `animate-rise stagger`. */
export function staggerStyle(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

export const tableClass = "w-full min-w-[640px] text-left text-sm";
export const theadClass = "border-b border-border text-xs uppercase tracking-wide text-muted";
export const thClass = "px-4 py-2.5 font-medium";
export const tdClass = "px-4 py-3 align-middle";
export const trClass =
  "border-b border-border transition-colors duration-150 last:border-0 hover:bg-slate-50/70";
/** Row entrance (opacity/translate only, mount-time) — rows unmount instantly on removal. */
export const rowEnterClass = "animate-rise stagger";
