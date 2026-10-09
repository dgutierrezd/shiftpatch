import { credentialReviewSchema } from "@/lib/product-validation";
import { requireActor } from "@/server/auth/actor";
import { getDb } from "@/server/db/client";
import { readJson } from "@/server/http/body";
import { withRoute } from "@/server/http/with-route";
import { reviewCredential } from "@/server/services/credentials.service";

export const POST = withRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireActor(req, "admin");
  const { id } = await ctx.params;
  const { decision } = await readJson(req, credentialReviewSchema);
  return Response.json(await reviewCredential(getDb(), actor, id, decision));
});
