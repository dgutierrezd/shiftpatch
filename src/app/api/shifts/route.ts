import { createShiftSchema } from "@/lib/validation";
import { requireActor } from "@/server/auth/actor";
import { readJson } from "@/server/http/body";
import { withRoute } from "@/server/http/with-route";
import { createShift, listAllShifts } from "@/server/services/shifts.service";

export const GET = withRoute(async (req: Request) => {
  await requireActor(req);
  return Response.json({ shifts: await listAllShifts() });
});

export const POST = withRoute(async (req: Request) => {
  const actor = await requireActor(req, "agency");
  const input = await readJson(req, createShiftSchema);
  return Response.json(await createShift(actor, input), { status: 201 });
});
