import { auditLogQuerySchema } from "@/lib/product-validation";
import { requireActor } from "@/server/auth/actor";
import { getDb } from "@/server/db/client";
import { withRoute } from "@/server/http/with-route";
import { listAuditLog } from "@/server/services/activity.service";

export const GET = withRoute(async (req: Request) => {
  const actor = await requireActor(req, "admin");
  const { limit } = auditLogQuerySchema.parse({
    limit: new URL(req.url).searchParams.get("limit") ?? undefined,
  });
  return Response.json({ entries: await listAuditLog(getDb(), actor, limit) });
});
