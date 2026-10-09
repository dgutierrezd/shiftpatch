import { and, desc, eq, isNull } from "drizzle-orm";
import { auditLog, notifications } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { forbidden, notFound } from "@/server/domain/errors";
import { isUuid } from "@/server/domain/file-type";
import type { Actor } from "@/server/domain/permissions";

export interface AuditEntryDto {
  id: number;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export async function listAuditLog(db: Db, actor: Actor, limit: number): Promise<AuditEntryDto[]> {
  if (actor.role !== "admin") throw forbidden();
  const rows = await db.select().from(auditLog).orderBy(desc(auditLog.id)).limit(limit);
  return rows.map((r) => ({
    id: r.id,
    actorId: r.actorId,
    actorRole: r.actorRole,
    action: r.action,
    entity: r.entity,
    entityId: r.entityId,
    metadata: r.metadata,
    createdAt: r.createdAt.toISOString(),
  }));
}

export interface NotificationDto {
  id: string;
  kind: string;
  subject: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

type NotificationRow = typeof notifications.$inferSelect;

function toNotificationDto(r: NotificationRow): NotificationDto {
  return {
    id: r.id,
    kind: r.kind,
    subject: r.subject,
    body: r.body,
    readAt: r.readAt ? r.readAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listNotifications(db: Db, actor: Actor): Promise<NotificationDto[]> {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, actor.id))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(50);
  return rows.map(toNotificationDto);
}

export async function markNotificationRead(
  db: Db,
  actor: Actor,
  id: string,
): Promise<NotificationDto> {
  const [existing] = isUuid(id)
    ? await db.select().from(notifications).where(eq(notifications.id, id))
    : [];
  if (!existing) throw notFound("Notification not found");
  if (existing.userId !== actor.id) throw forbidden();
  if (existing.readAt) return toNotificationDto(existing);
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), isNull(notifications.readAt)))
    .returning();
  return toNotificationDto(updated ?? existing);
}
