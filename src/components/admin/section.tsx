import type { ReactNode } from "react";
import { Card, EmptyRow, SkeletonRows } from "@/components/ui/primitives";
import type { Loadable } from "./types";

/** In-page anchor target wrapping a Card; `scroll-mt` keeps the heading visible after a jump. */
export function AdminSection({
  id,
  title,
  description,
  actions,
  error,
  className = "",
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Refresh error shown above the content while the last good data stays visible. */
  error?: string | null;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className={`scroll-mt-16 ${className}`}>
      <Card title={title} actions={actions}>
        {description && <p className="mb-4 text-sm text-muted">{description}</p>}
        {error && (
          <p role="alert" className="mb-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            Couldn’t refresh: {error}
          </p>
        )}
        {children}
      </Card>
    </div>
  );
}

/**
 * Tables scroll horizontally on narrow screens instead of breaking the layout. With
 * `tall`, long tables also scroll vertically inside the card (pair with a sticky thead).
 */
export function TableScroll({ children, tall = false }: { children: ReactNode; tall?: boolean }) {
  return (
    <div
      className={`-mx-5 overflow-x-auto px-5 ${tall ? "max-h-[36rem] overflow-y-auto overscroll-contain" : ""}`}
      tabIndex={0}
      role="group"
      aria-label="Scrollable table"
    >
      {children}
    </div>
  );
}

/**
 * Body placeholder for a table that must always render (header + EmptyRow): shows the
 * loading, error or empty message. Returns null once there are rows to show.
 */
export function TableStatus<T>({
  colSpan,
  resource,
  rows,
  empty,
}: {
  colSpan: number;
  resource: Loadable<T>;
  rows: number;
  empty: string;
}) {
  if (rows > 0) return null;
  if (resource.data === null && resource.error === null)
    return <SkeletonRows colSpan={colSpan} label="Loading…" />;
  if (resource.data === null)
    return <EmptyRow colSpan={colSpan}>Couldn’t load: {resource.error}</EmptyRow>;
  return <EmptyRow colSpan={colSpan}>{empty}</EmptyRow>;
}
