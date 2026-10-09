import { auditLog } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import type { Actor } from "@/server/domain/permissions";

export type AuditAction =
  | "auth.login"
  | "auth.login_failed"
  | "shift.created"
  | "shift.claimed"
  | "shift.claim_blocked"
  | "shift.cancelled"
  | "credential.uploaded"
  | "credential.verified"
  | "credential.rejected"
  | "credential.file_viewed"
  | "timesheet.submitted"
  | "timesheet.approved"
  | "compliance_report.generated"
  | "demo.reset";

/** Append-only. Call inside the same transaction as the change it records. */
export async function recordAudit(
  db: Db,
  actor: Pick<Actor, "id" | "role"> | null,
  action: AuditAction,
  entity: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await db.insert(auditLog).values({
    actorId: actor?.id ?? null,
    actorRole: actor?.role ?? null,
    action,
    entity,
    entityId,
    metadata,
  });
}
