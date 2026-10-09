import { timesheetSubmitSchema } from "@/lib/product-validation";
import { requireActor } from "@/server/auth/actor";
import { getDb } from "@/server/db/client";
import { readJson } from "@/server/http/body";
import { withRoute } from "@/server/http/with-route";
import { submitTimesheet } from "@/server/services/timesheets.service";

export const POST = withRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireActor(req, "nurse");
  const { id } = await ctx.params;
  const { workedHours } = await readJson(req, timesheetSubmitSchema);
  return Response.json(await submitTimesheet(getDb(), actor, id, workedHours));
});
