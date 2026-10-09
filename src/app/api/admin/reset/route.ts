import { requireActor } from "@/server/auth/actor";
import { getDb } from "@/server/db/client";
import { withRoute } from "@/server/http/with-route";
import { resetDemoData } from "@/server/services/admin.service";

export const POST = withRoute(async (req: Request) => {
  const actor = await requireActor(req, "admin");
  await resetDemoData(getDb(), actor);
  return Response.json({ ok: true });
});
