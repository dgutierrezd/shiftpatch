/** ShiftPatch mark: a square drawn in a single line with a cross set inside it. Decorative. */
export function LogoMark({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={className} fill="none">
      <rect x="0.75" y="0.75" width="14.5" height="14.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.5v7M4.5 8h7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Mark + wordmark set in the serif. The visible text keeps the brand name accessible. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-ink ${className}`}>
      <LogoMark className="size-3.5 text-accent" />
      <span className="font-serif text-[1.3125rem] leading-none font-medium tracking-[-0.01em]">
        ShiftPatch
      </span>
    </span>
  );
}
