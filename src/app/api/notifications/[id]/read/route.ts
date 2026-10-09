import { requireActor } from "@/server/auth/actor";
import { getDb } from "@/server/db/client";
import { withRoute } from "@/server/http/with-route";
import { markNotificationRead } from "@/server/services/activity.service";

export const POST = withRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireActor(req);
  const { id } = await ctx.params;
  return Response.json(await markNotificationRead(getDb(), actor, id));
});
