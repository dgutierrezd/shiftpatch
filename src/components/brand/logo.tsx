/** ShiftPatch mark: a rounded "patch" with a cross-shaped shift slot. Decorative. */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="9" fill="#0f766e" />
      <path d="M0 9a9 9 0 0 1 9-9h14a9 9 0 0 1 9 9v3C22 4 10 4 0 12z" fill="#14b8a6" />
      <path d="M13 8.5h6v4.5h4.5v6H19v4.5h-6V19H8.5v-6H13z" fill="#fff" fillOpacity="0.95" />
      <circle cx="16" cy="16" r="1.7" fill="#0f766e" />
    </svg>
  );
}

/** Mark + wordmark. The visible text keeps the brand name accessible. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="text-lg font-bold tracking-tight text-foreground">
        Shift<span className="text-brand">Patch</span>
      </span>
    </span>
  );
}
