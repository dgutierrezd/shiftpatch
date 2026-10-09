import { requireActor } from "@/server/auth/actor";
import { getDb } from "@/server/db/client";
import { withRoute } from "@/server/http/with-route";
import { approveTimesheet } from "@/server/services/timesheets.service";

export const POST = withRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireActor(req, "agency", "admin");
  const { id } = await ctx.params;
  return Response.json(await approveTimesheet(getDb(), actor, id));
});
