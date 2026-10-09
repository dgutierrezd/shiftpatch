const TONE: Record<string, string> = {
  open: "text-accent",
  filled: "text-success",
  cancelled: "text-muted",
  pending: "text-warning",
  submitted: "text-warning",
  verified: "text-success",
  approved: "text-success",
  rejected: "text-danger",
  expired: "text-danger",
  void: "text-muted",
};

/** ○ still open / waiting, ● settled, ✕ ended. Decorative; the word carries the meaning. */
const GLYPH: Record<string, string> = {
  open: "○",
  pending: "○",
  submitted: "○",
  filled: "●",
  verified: "●",
  approved: "●",
  cancelled: "✕",
  rejected: "✕",
  expired: "✕",
  void: "✕",
};

/**
 * Status set as a small colored word, not a pill. The test-ID element holds only the literal
 * lowercase status (no CSS text-transform), so scripts read exactly "open" / "filled" / ….
 */
export function StatusBadge({ status, testId }: { status: string; testId?: string }) {
  const glyph = GLYPH[status];
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 text-small whitespace-nowrap ${TONE[status] ?? "text-muted"}`}
    >
      {glyph && (
        <span aria-hidden="true" className="relative -top-px text-[0.6875rem] leading-none">
          {glyph}
        </span>
      )}
      <span data-testid={testId}>{status}</span>
    </span>
  );
}
