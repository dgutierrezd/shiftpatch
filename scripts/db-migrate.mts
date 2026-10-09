import postgres from "postgres";
import { applyMigrations } from "../src/server/db/migrate";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const sql = postgres(url, { max: 1, prepare: false });
const ran = await applyMigrations(
  (q) => sql.unsafe(q),
  (q) => sql.unsafe(q) as unknown as Promise<Array<{ name: string }>>,
);
console.log(ran.length ? `Applied: ${ran.join(", ")}` : "Database is up to date");
await sql.end();
