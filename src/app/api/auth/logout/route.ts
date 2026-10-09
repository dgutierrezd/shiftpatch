import { clearedSessionCookie } from "@/server/auth/session-cookie";
import { withRoute } from "@/server/http/with-route";

/** Always succeeds: clearing a cookie needs no session, and must work with an expired one. */
export const POST = withRoute(async () => {
  return new Response(null, { status: 204, headers: { "set-cookie": clearedSessionCookie() } });
});
