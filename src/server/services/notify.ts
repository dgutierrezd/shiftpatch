import { notifications } from "@/server/db/schema";
import type { Db } from "@/server/db/types";

/**
 * Queues an in-app notification; the email outbox worker delivers it later.
 * Bodies must stay free of medical details (credential contents, TB status) — see ESCALATION.md.
 */
export async function queueNotification(
  db: Db,
  userId: string,
  kind: string,
  subject: string,
  body: string,
): Promise<void> {
  await db.insert(notifications).values({ userId, kind, subject, body });
}
