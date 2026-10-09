import { requireActor } from "@/server/auth/actor";
import { getDb } from "@/server/db/client";
import { withRoute } from "@/server/http/with-route";
import { currentUser } from "@/server/services/admin.service";

export const GET = withRoute(async (req: Request) => {
  const actor = await requireActor(req);
  return Response.json(await currentUser(getDb(), actor));
});
