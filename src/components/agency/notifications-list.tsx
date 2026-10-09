import { Card, EmptyState, SkeletonList } from "@/components/ui/primitives";
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
    <Card title="Recent notifications">
      {error && items.length === 0 ? (
        <p role="alert" className="text-sm text-danger">
          Couldn&apos;t load notifications: {error}
        </p>
      ) : items.length === 0 ? (
        loading ? (
          <SkeletonList label="Loading notifications…" rows={2} />
        ) : (
          <EmptyState>No notifications yet.</EmptyState>
        )
      ) : (
        <ul className="divide-y divide-border">
          {items.map((n) => (
            <li key={n.id} className="flex animate-fade flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className={`text-sm ${n.readAt ? "" : "font-semibold"}`}>{n.subject}</p>
                <time dateTime={n.createdAt} className="text-xs text-muted">
                  {formatTimestamp(n.createdAt)}
                </time>
              </div>
              <p className="text-sm text-muted">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
