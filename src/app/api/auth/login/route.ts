import { loginSchema } from "@/lib/validation";
import { sessionCookie } from "@/server/auth/session-cookie";
import { readJson } from "@/server/http/body";
import { withRoute } from "@/server/http/with-route";
import { clientIp, login } from "@/server/services/auth.service";

export const POST = withRoute(async (req: Request) => {
  const { email, password } = await readJson(req, loginSchema);
  const result = await login(email, password, clientIp(req));
  return Response.json(result, { headers: { "set-cookie": sessionCookie(result.token) } });
});
