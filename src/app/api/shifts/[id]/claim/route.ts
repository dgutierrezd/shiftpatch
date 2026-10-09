import { requireActor } from "@/server/auth/actor";
import { withRoute } from "@/server/http/with-route";
import { claimShift } from "@/server/services/shifts.service";

// The request body is ignored entirely: the nurse is identified by the token.
export const POST = withRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireActor(req, "nurse");
  const { id } = await ctx.params;
  return Response.json(await claimShift(actor, id));
});
