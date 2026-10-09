import type { z } from "zod";
import { badRequest } from "@/server/domain/errors";

/** Parses a JSON body against a schema; an empty body is treated as `{}`. */
export async function readJson<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  const text = await req.text();
  let data: unknown = {};
  if (text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      throw badRequest("Request body must be valid JSON");
    }
  }
  return schema.parse(data);
}
