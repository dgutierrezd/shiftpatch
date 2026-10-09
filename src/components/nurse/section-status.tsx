import { SkeletonList } from "@/components/ui/primitives";
import type { Resource } from "./use-resource";

/**
 * Loading / error line for a section. Renders nothing once data is present and healthy;
 * it never replaces the section body, so required test IDs stay in the DOM.
 */
export function SectionStatus<T>({ resource, label }: { resource: Resource<T>; label: string }) {
  if (resource.error) {
    return (
      <div
        role="alert"
        className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
      >
        <span>
          Couldn&apos;t load {label}: {resource.error}
        </span>
        <button type="button" onClick={resource.reload} className="font-medium underline">
          Try again
        </button>
      </div>
    );
  }
  if (resource.loading && resource.data === null) {
    return <SkeletonList label={`Loading ${label}…`} rows={2} />;
  }
  return null;
}
