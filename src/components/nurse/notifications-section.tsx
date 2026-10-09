"use client";

import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { Button, EmptyState, Section } from "@/components/ui/primitives";
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
    <Section title="Notifications" dek={unread > 0 ? `${unread} unread.` : undefined}>
      <SectionStatus resource={notifications} label="notifications" />
      {notifications.data !== null && list.length === 0 ? (
        <EmptyState>You&apos;re all caught up.</EmptyState>
      ) : (
        <ul className="max-h-[28rem] overflow-y-auto border-t border-ink">
          {list.map((n) => (
            <li
              key={n.id}
              className="flex items-start justify-between gap-3 border-b border-rule py-3 last:border-0"
            >
              <div className="min-w-0">
                <p className={n.readAt ? "text-muted" : "font-medium text-ink"}>
                  {n.readAt === null && <span className="sr-only">Unread: </span>}
                  {n.subject}
                </p>
                {n.body && <p className="mt-0.5 text-small text-muted">{n.body}</p>}
                <p className="mt-0.5 font-mono text-[0.75rem] text-muted">
                  {formatTimestamp(n.createdAt)}
                </p>
              </div>
              {n.readAt === null && (
                <Button
                  variant="quiet"
                  size="sm"
                  className="px-0"
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
    </Section>
  );
}
