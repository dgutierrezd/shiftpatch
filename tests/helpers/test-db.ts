import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { setDbForTesting } from "@/server/db/client";
import { applyMigrations } from "@/server/db/migrate";
import * as schema from "@/server/db/schema";
import { reseed } from "@/server/db/seed";
import type { Db } from "@/server/db/types";

process.env.JWT_SECRET ??= "test-secret-that-is-long-enough-for-hs256-signing";

/** One in-process Postgres per test file, migrated from the real SQL and injected into getDb(). */
export async function createTestDb(): Promise<{
  db: Db;
  reset: () => Promise<void>;
  close: () => Promise<void>;
}> {
  const client = new PGlite();
  await applyMigrations(
    (q) => client.exec(q),
    async (q) => (await client.query<{ name: string }>(q)).rows,
  );
  const db = drizzle(client, { schema }) as unknown as Db;
  setDbForTesting(db);
  return {
    db,
    // reseed() keeps the audit log and waitlist (production behavior); tests also clear
    // them so every test starts isolated.
    reset: async () => {
      await reseed(db);
      await db.execute(sql`TRUNCATE audit_log, waitlist RESTART IDENTITY`);
    },
    close: async () => {
      setDbForTesting(null);
      await client.close();
    },
  };
}
