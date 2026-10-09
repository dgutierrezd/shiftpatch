import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/server/db/client";
import { forbidden } from "@/server/domain/errors";
import { withRoute } from "@/server/http/with-route";
import { deliverQueued } from "@/server/services/email.service";

function authorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Unset secret = always 403. */
export const GET = withRoute(async (req: Request) => {
  if (!authorized(req.headers.get("authorization"))) throw forbidden();
  return Response.json(await deliverQueued(getDb()));
});
