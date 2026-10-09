import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

type Variant = "primary" | "secondary" | "danger" | "quiet";
type Size = "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "border border-rule bg-paper text-ink hover:border-muted",
  danger:
    "border border-danger/70 bg-transparent text-danger hover:border-danger hover:bg-danger/5",
  quiet: "text-accent underline-offset-4 hover:underline",
};

const SIZES: Record<Size, string> = {
  md: "h-9 px-3.5 text-[0.875rem]",
  sm: "h-7 px-2.5 text-small",
};

/** Shared focus ring: a 2px ink-blue outline, offset from the control. */
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${focusRing} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    />
  );
}

/** Inline text link styling for anchors and Next links. */
export const linkClass = `text-accent underline decoration-accent/30 underline-offset-[3px] transition-colors hover:decoration-accent ${focusRing} rounded-[2px]`;

/**
 * An editorial section: serif heading, an optional one-line dek in muted sans, and content
 * underneath. Sections are separated by a hairline and whitespace — no boxes, no shadows.
 */
export function Section({
  id,
  title,
  dek,
  actions,
  children,
  className = "",
}: {
  id?: string;
  title: ReactNode;
  dek?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-16 border-t border-rule pt-6 ${className}`}>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-heading text-ink">{title}</h2>
          {dek && <p className="mt-1 max-w-[46rem] text-muted">{dek}</p>}
        </div>
        {actions}
      </header>
      {children}
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
      <label htmlFor={htmlFor} className="text-small font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-small text-muted">{hint}</p>}
    </div>
  );
}

const control =
  "rounded-[4px] border border-rule bg-surface px-3 text-ink transition-colors duration-150 placeholder:text-muted/70 hover:border-muted/60 focus:border-accent focus:outline-1 focus:outline-accent aria-invalid:border-danger";

/** Default size classes, each dropped when the caller passes its own of that kind. */
const CONTROL_DEFAULTS: [RegExp, string][] = [
  [/(^|\s)h-/, "h-10"],
  [/(^|\s)w-/, "w-full"],
  [/(^|\s)text-(small|body|lead|\[)/, "text-body"],
];

function controlClass(extra = ""): string {
  const defaults = CONTROL_DEFAULTS.filter(([re]) => !re.test(extra)).map(([, cls]) => cls);
  return [control, ...defaults, extra].join(" ");
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={controlClass(props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={controlClass(`pr-8 ${props.className ?? ""}`)} />;
}

/** A note set off by a 3px left rule in the tone's color; ink text, no icon. */
export function Note({
  tone,
  children,
  role,
  className = "",
}: {
  tone: "warning" | "danger" | "success";
  children: ReactNode;
  role?: "note" | "alert" | "status";
  className?: string;
}) {
  const rule = {
    warning: "border-l-warning",
    danger: "border-l-danger",
    success: "border-l-success",
  };
  return (
    <div
      role={role}
      className={`border border-l-[3px] border-rule bg-paper px-4 py-3 text-ink ${rule[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-6 text-muted">
        {children}
      </td>
    </tr>
  );
}

/** Plain empty message for non-table lists. */
export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-3 text-muted">{children}</p>;
}

/** One quiet line while a list loads; announced to screen readers. */
export function LoadingLine({ label }: { label: string }) {
  return (
    <p role="status" className="py-3 text-muted">
      {label}
    </p>
  );
}

/** A single table row while the body loads, so the table (and its test ID) always renders. */
export function LoadingRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-6 text-muted">
        <span role="status">{label}</span>
      </td>
    </tr>
  );
}

/* Report tables: an ink rule above the header, hairline rows, no zebra striping. */
export const tableClass = "w-full min-w-[640px] border-t border-ink text-left text-[0.875rem]";
export const theadClass = "border-b border-rule text-small text-muted";
export const thClass = "px-3 py-2.5 font-medium first:pl-0 last:pr-0";
export const tdClass = "px-3 py-3 align-middle first:pl-0 last:pr-0";
export const trClass = "border-b border-rule last:border-0";
/** Right-aligned numeric cell / header. */
export const numClass = "text-right tabular-nums";
/** Mono identifiers (shift ids, user ids, license numbers). */
export const idClass = "font-mono text-small text-ink";
/** Optional settle highlight for a row that just appeared; exits stay instant. */
export const freshRowClass = "animate-settle";
