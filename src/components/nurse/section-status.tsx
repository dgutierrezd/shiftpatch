import { LoadingLine, Note } from "@/components/ui/primitives";
import type { Resource } from "./use-resource";

/**
 * Loading / error line for a section. Renders nothing once data is present and healthy;
 * it never replaces the section body, so required test IDs stay in the DOM.
 */
export function SectionStatus<T>({ resource, label }: { resource: Resource<T>; label: string }) {
  if (resource.error) {
    return (
      <Note tone="danger" role="alert" className="mb-4">
        Couldn&apos;t load {label}: {resource.error}.{" "}
        <button
          type="button"
          onClick={resource.reload}
          className="text-accent underline underline-offset-[3px]"
        >
          Try again
        </button>
      </Note>
    );
  }
  if (resource.loading && resource.data === null) {
    return <LoadingLine label={`Loading ${label}…`} />;
  }
  return null;
}
