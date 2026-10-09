import { requireActor } from "@/server/auth/actor";
import { getDb } from "@/server/db/client";
import { withRoute } from "@/server/http/with-route";
import { listDemoRequests } from "@/server/services/admin.service";

export const GET = withRoute(async (req: Request) => {
  const actor = await requireActor(req, "admin");
  return Response.json({ requests: await listDemoRequests(getDb(), actor) });
});
