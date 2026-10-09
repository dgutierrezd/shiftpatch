import type { ReactNode } from "react";
import { Card, EmptyRow } from "@/components/ui/primitives";
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
    <div id={id} className={`scroll-mt-6 ${className}`}>
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

/** Tables scroll horizontally on narrow screens instead of breaking the layout. */
export function TableScroll({ children }: { children: ReactNode }) {
  return (
    <div
      className="-mx-5 overflow-x-auto px-5"
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
    return <EmptyRow colSpan={colSpan}>Loading…</EmptyRow>;
  if (resource.data === null)
    return <EmptyRow colSpan={colSpan}>Couldn’t load: {resource.error}</EmptyRow>;
  return <EmptyRow colSpan={colSpan}>{empty}</EmptyRow>;
}
