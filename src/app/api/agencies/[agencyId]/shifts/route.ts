import { requireActor } from "@/server/auth/actor";
import { withRoute } from "@/server/http/with-route";
import { listAgencyShifts } from "@/server/services/shifts.service";

export const GET = withRoute(
  async (req: Request, ctx: { params: Promise<{ agencyId: string }> }) => {
    const actor = await requireActor(req);
    const { agencyId } = await ctx.params;
    return Response.json({ agencyId, shifts: await listAgencyShifts(actor, agencyId) });
  },
);
