import { waitlistSchema } from "@/lib/product-validation";
import { getDb } from "@/server/db/client";
import { readJson } from "@/server/http/body";
import { withRoute } from "@/server/http/with-route";
import { joinWaitlist } from "@/server/services/admin.service";

/** Public. A duplicate email gets the same body (200 vs 201 only) and nothing about the row. */
export const POST = withRoute(async (req: Request) => {
  const input = await readJson(req, waitlistSchema);
  const created = await joinWaitlist(getDb(), input);
  return Response.json({ ok: true }, { status: created ? 201 : 200 });
});
