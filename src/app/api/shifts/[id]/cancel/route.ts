import { cancelShiftSchema } from "@/lib/validation";
import { requireActor } from "@/server/auth/actor";
import { readJson } from "@/server/http/body";
import { withRoute } from "@/server/http/with-route";
import { cancelShift } from "@/server/services/shifts.service";

export const POST = withRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireActor(req);
  const { reason } = await readJson(req, cancelShiftSchema);
  const { id } = await ctx.params;
  return Response.json(await cancelShift(actor, id, reason));
});
