import { requireActor } from "@/server/auth/actor";
import { getDb } from "@/server/db/client";
import { withRoute } from "@/server/http/with-route";
import { buildAdminReport } from "@/server/services/reporting.service";

export const GET = withRoute(async (req: Request) => {
  const actor = await requireActor(req, "admin");
  return Response.json(await buildAdminReport(getDb(), actor));
});
