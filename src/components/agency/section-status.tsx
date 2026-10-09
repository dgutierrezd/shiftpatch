import { EmptyRow, LoadingRow } from "@/components/ui/primitives";

/** Loading / error / empty row for a table body, so the table header always renders. */
export function StatusRow({
  colSpan,
  loading,
  error,
  empty,
}: {
  colSpan: number;
  loading: boolean;
  error: string | null;
  empty: string;
}) {
  if (error) {
    return (
      <EmptyRow colSpan={colSpan}>
        <span role="alert" className="text-danger">
          Couldn&apos;t load: {error}
        </span>
      </EmptyRow>
    );
  }
  if (loading) return <LoadingRow colSpan={colSpan} label="Loading…" />;
  return <EmptyRow colSpan={colSpan}>{empty}</EmptyRow>;
}
