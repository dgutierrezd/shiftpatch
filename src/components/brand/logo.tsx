/** ShiftPatch mark: a flat rounded square with a cross. Decorative. */
export function LogoMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="8" fill="#0f766e" />
      <path d="M13 8h6v5h5v6h-5v5h-6v-5H8v-6h5z" fill="#fff" />
    </svg>
  );
}

/** Mark + wordmark. The visible text keeps the brand name accessible. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="text-lg font-bold tracking-tight text-brand">ShiftPatch</span>
    </span>
  );
}
