import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/server/db/schema";
import { reseed } from "../src/server/db/seed";
import type { Db } from "../src/server/db/types";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const client = postgres(url, { max: 1, prepare: false });
await reseed(drizzle(client, { schema }) as unknown as Db);
console.log("Seeded spec sample data");
await client.end();
