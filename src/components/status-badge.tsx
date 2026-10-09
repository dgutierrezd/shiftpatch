const STYLES: Record<string, string> = {
  open: "bg-brand-soft text-brand-strong",
  filled: "bg-success-soft text-success",
  cancelled: "bg-slate-100 text-slate-600",
  pending: "bg-warning-soft text-warning",
  submitted: "bg-warning-soft text-warning",
  verified: "bg-success-soft text-success",
  approved: "bg-success-soft text-success",
  rejected: "bg-danger-soft text-danger",
  expired: "bg-danger-soft text-danger",
  void: "bg-slate-100 text-slate-600",
};

/** Text is rendered literally in lowercase (no CSS text-transform) so scripts can read it. */
export function StatusBadge({ status, testId }: { status: string; testId?: string }) {
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        STYLES[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}
