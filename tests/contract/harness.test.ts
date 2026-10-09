import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb } from "../helpers/test-db";

let ctx: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  ctx = await createTestDb();
});
afterAll(() => ctx.close());

describe("test database harness", () => {
  it("migrates and seeds exactly the spec sample data, idempotently", async () => {
    await ctx.reset();
    await ctx.reset();
    const counts = await ctx.db.execute<{ t: string; n: number }>(sql`
      SELECT 'agencies' AS t, count(*)::int AS n FROM agencies
      UNION ALL SELECT 'users', count(*)::int FROM users
      UNION ALL SELECT 'shifts', count(*)::int FROM shifts
      UNION ALL SELECT 'next', nextval('shift_seq')::int`);
    const rows =
      (counts as unknown as { rows?: Array<{ t: string; n: number }> }).rows ??
      (counts as unknown as Array<{ t: string; n: number }>);
    expect(Object.fromEntries(rows.map((r) => [r.t, r.n]))).toEqual({
      agencies: 2,
      users: 5,
      shifts: 3,
      next: 4,
    });
  });
});
