import { EmptyState, LoadingLine, Section } from "@/components/ui/primitives";
import { formatTimestamp } from "./format";
import type { NotificationDto } from "./types";

const MAX_ITEMS = 5;

export function NotificationsList({
  notifications,
  loading,
  error,
}: {
  notifications: NotificationDto[] | undefined;
  loading: boolean;
  error: string | null;
}) {
  const items = (notifications ?? []).slice(0, MAX_ITEMS);

  return (
    <Section title="Recent notifications" dek="The latest five messages for your agency.">
      {error && items.length === 0 ? (
        <p role="alert" className="text-small text-danger">
          Couldn&apos;t load notifications: {error}
        </p>
      ) : items.length === 0 ? (
        loading ? (
          <LoadingLine label="Loading notifications…" />
        ) : (
          <EmptyState>No notifications yet.</EmptyState>
        )
      ) : (
        <ul className="border-t border-ink">
          {items.map((n) => (
            <li
              key={n.id}
              className="grid gap-x-8 gap-y-0.5 border-b border-rule py-3 last:border-0 sm:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <p className={n.readAt ? "text-ink" : "font-medium text-ink"}>{n.subject}</p>
                <p className="text-small text-muted">{n.body}</p>
              </div>
              <time
                dateTime={n.createdAt}
                className="font-mono text-[0.75rem] whitespace-nowrap text-muted sm:pt-0.5"
              >
                {formatTimestamp(n.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
