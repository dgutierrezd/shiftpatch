"use client";

import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { Button, Card } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api-client";
import { formatTimestamp } from "./format";
import { SectionStatus } from "./section-status";
import type { NotificationDto } from "./types";
import type { Resource } from "./use-resource";

export function NotificationsSection({
  notifications,
  onChanged,
}: {
  notifications: Resource<NotificationDto[]>;
  onChanged: () => void;
}) {
  const notify = useNotify();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const list = [...(notifications.data ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const unread = list.filter((n) => n.readAt === null).length;

  async function markRead(id: string) {
    setMarkingId(id);
    try {
      await api(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "POST" });
      onChanged();
    } catch (err) {
      notify("error", errorMessage(err));
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <Card
      title="Notifications"
      actions={unread > 0 ? <span className="text-sm text-muted">{unread} unread</span> : undefined}
    >
      <SectionStatus resource={notifications} label="notifications" />
      {notifications.data !== null && list.length === 0 ? (
        <p className="text-sm text-muted">You&apos;re all caught up.</p>
      ) : (
        <ul className="max-h-96 divide-y divide-border overflow-y-auto">
          {list.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className={`text-sm ${n.readAt ? "text-muted" : "font-medium"}`}>
                  {n.readAt === null && (
                    <span className="mr-1.5 inline-block size-2 rounded-full bg-brand" aria-label="Unread" />
                  )}
                  {n.subject}
                </p>
                {n.body && <p className="text-xs text-muted">{n.body}</p>}
                <p className="text-xs text-muted">{formatTimestamp(n.createdAt)}</p>
              </div>
              {n.readAt === null && (
                <Button
                  variant="ghost"
                  className="shrink-0 px-2 py-1 text-xs"
                  disabled={markingId === n.id}
                  onClick={() => markRead(n.id)}
                >
                  Mark read
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
