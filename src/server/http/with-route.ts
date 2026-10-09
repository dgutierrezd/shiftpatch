import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { DomainError } from "@/server/domain/errors";

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

export function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: { "cache-control": "no-store" } });
}

/** Every failure leaves as `{ "error": "<message>" }`; internals are logged, never returned. */
export function withRoute<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
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
