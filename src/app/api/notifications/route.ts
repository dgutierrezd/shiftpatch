import { requireActor } from "@/server/auth/actor";
import { getDb } from "@/server/db/client";
import { withRoute } from "@/server/http/with-route";
import { listNotifications } from "@/server/services/activity.service";

export const GET = withRoute(async (req: Request) => {
  const actor = await requireActor(req);
  return Response.json({ notifications: await listNotifications(getDb(), actor) });
});
