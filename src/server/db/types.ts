import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

/** Common type for the postgres-js (runtime) and PGlite (tests) drivers; transactions satisfy it too. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
