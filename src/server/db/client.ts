import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Db } from "./types";
import * as schema from "./schema";

let override: Db | null = null;
let shared: Db | null = null;

/** Tests inject an in-process PGlite database here. */
export function setDbForTesting(db: Db | null): void {
  override = db;
}

export function getDb(): Db {
  if (override) return override;
  if (shared) return shared;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // One small pool per function instance; Fluid compute reuses instances across requests.
  const sql = postgres(url, { max: 5, prepare: false });
  shared = drizzle(sql, { schema }) as unknown as Db;
  return shared;
}
