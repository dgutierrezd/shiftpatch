import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const MIGRATIONS_DIR = path.join(process.cwd(), "src/server/db/migrations");

/** Minimal forward-only migrator: applies each .sql file once, in filename order. */
export async function applyMigrations(
  exec: (sql: string) => Promise<unknown>,
  query: (sql: string) => Promise<Array<{ name: string }>>,
): Promise<string[]> {
  await exec(
    "CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const applied = new Set((await query("SELECT name FROM _migrations")).map((r) => r.name));
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  const ran: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    // `file` comes from readdir of our own migrations directory, not from user input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    await exec(
      `BEGIN;\n${sql}\nINSERT INTO _migrations (name) VALUES ('${file.replace(/'/g, "''")}');\nCOMMIT;`,
    );
    ran.push(file);
  }
  return ran;
}
