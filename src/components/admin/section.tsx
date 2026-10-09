import type { ReactNode } from "react";
import { EmptyRow, LoadingRow, Note, Section } from "@/components/ui/primitives";
import type { Loadable } from "./types";

/** In-page anchor target: an editorial section with a heading, a dek and its content. */
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
    <Section id={id} title={title} dek={description} actions={actions} className={className}>
      {error && (
        <Note tone="danger" role="alert" className="mb-4">
          Couldn’t refresh: {error}
        </Note>
      )}
      {children}
    </Section>
  );
}

/**
 * Tables scroll horizontally on narrow screens instead of breaking the layout. With
 * `tall`, long tables also scroll vertically (pair with a sticky thead).
 */
export function TableScroll({ children, tall = false }: { children: ReactNode; tall?: boolean }) {
  return (
    <div
      className={`relative overflow-x-auto rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${tall ? "max-h-[36rem] overflow-y-auto overscroll-contain" : ""}`}
      tabIndex={0}
      role="group"
      aria-label="Scrollable table"
    >
      {children}
    </div>
  );
}

/**
 * Body placeholder for a table that must always render (header + a status row): shows the
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
    return <LoadingRow colSpan={colSpan} label="Loading…" />;
  if (resource.data === null)
    return <EmptyRow colSpan={colSpan}>Couldn’t load: {resource.error}</EmptyRow>;
  return <EmptyRow colSpan={colSpan}>{empty}</EmptyRow>;
}
