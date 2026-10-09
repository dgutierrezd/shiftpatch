import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { isCrossSiteBrowserRequest } from "@/server/auth/actor";
import { DomainError } from "@/server/domain/errors";

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

export function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: { "cache-control": "no-store" } });
}

/** Every failure leaves as `{ "error": "<message>" }`; internals are logged, never returned. */
export function withRoute<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      // Blocks login CSRF and any other forged cross-site write (e.g. text/plain form posts
      // that happen to be valid JSON). API scripts send no Origin, so they're unaffected.
      if (isCrossSiteBrowserRequest(req)) return jsonError(403, "Cross-site request blocked");
      const res = await handler(req, ctx);
      if (!res.headers.has("cache-control")) res.headers.set("cache-control", "no-store");
      return res;
    } catch (err) {
      // Let Next.js control-flow signals (prerender bailout, redirect, notFound) pass through.
      unstable_rethrow(err);
      if (err instanceof DomainError) return jsonError(err.status, err.message);
      if (err instanceof ZodError)
        return jsonError(400, err.issues[0]?.message ?? "Invalid request");
      console.error("Unhandled route error", err);
      return jsonError(500, "Internal server error");
    }
  };
}
