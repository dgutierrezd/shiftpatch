import { asc, eq, inArray } from "drizzle-orm";
import { notifications, users } from "@/server/db/schema";
import type { Db } from "@/server/db/types";

const RESEND_URL = "https://api.resend.com/emails";

export interface DeliveryResult {
  sent: number;
  skipped: number;
  failed: number;
}

/** Seed and demo addresses are undeliverable by design; never try to send to them. */
export function isDeliverable(email: string): boolean {
  const lower = email.trim().toLowerCase();
  return !lower.endsWith(".example") && !lower.endsWith("@example.com");
}

/**
 * Drains the notification outbox. Sends through the Resend REST API only when
 * RESEND_API_KEY and EMAIL_FROM are set; otherwise (or for .example recipients) the row
 * is marked `skipped`. Failed sends stay `queued` for the next run; the notification id
 * is the Resend idempotency key, so a retry or an overlapping run cannot double-send.
 */
export async function deliverQueued(
  db: Db,
  options: { limit?: number; fetchImpl?: typeof fetch } = {},
): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const doFetch = options.fetchImpl ?? fetch;
  const result: DeliveryResult = { sent: 0, skipped: 0, failed: 0 };

  const queued = await db
    .select({
      id: notifications.id,
      subject: notifications.subject,
      body: notifications.body,
      email: users.email,
    })
    .from(notifications)
    .innerJoin(users, eq(users.id, notifications.userId))
    .where(eq(notifications.emailStatus, "queued"))
    .orderBy(asc(notifications.createdAt))
    .limit(options.limit ?? 50);

  const skipped: string[] = [];
  for (const n of queued) {
    if (!apiKey || !from || !isDeliverable(n.email)) {
      skipped.push(n.id);
      continue;
    }
    try {
      const res = await doFetch(RESEND_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
          "idempotency-key": `notification-${n.id}`,
        },
        body: JSON.stringify({ from, to: [n.email], subject: n.subject, text: n.body }),
      });
      if (!res.ok) throw new Error(`Resend responded ${res.status}`);
      await db.update(notifications).set({ emailStatus: "sent" }).where(eq(notifications.id, n.id));
      result.sent += 1;
    } catch (err) {
      console.error("Email delivery failed", { notificationId: n.id, err });
      result.failed += 1;
    }
  }
  if (skipped.length) {
    await db
      .update(notifications)
      .set({ emailStatus: "skipped" })
      .where(inArray(notifications.id, skipped));
    result.skipped = skipped.length;
  }
  return result;
}
