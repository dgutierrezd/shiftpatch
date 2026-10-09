import { sql } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GET as report } from "@/app/api/admin/report/route";
import { POST as complianceReport } from "@/app/api/admin/compliance-report/route";
import { POST as reset } from "@/app/api/admin/reset/route";
import { GET as auditLog } from "@/app/api/audit-log/route";
import { cancellations, shifts } from "@/server/db/schema";
import { recordAudit } from "@/server/services/audit";
import { apiRequest } from "../helpers/http";
import { ACTORS, mintTokens, type Tokens } from "../helpers/product-tokens";
import { createTestDb } from "../helpers/test-db";

let ctx: Awaited<ReturnType<typeof createTestDb>>;
let t: Tokens;

beforeAll(async () => {
  ctx = await createTestDb();
  t = await mintTokens();
});
afterAll(() => ctx.close());
beforeEach(() => ctx.reset());
afterEach(() => {
  delete process.env.ALLOW_DEMO_RESET;
});

describe("GET /api/admin/report", () => {
  it("admin only", async () => {
    expect((await report(apiRequest("/api/admin/report"), undefined)).status).toBe(401);
    for (const token of [t.nurse1, t.agencyA]) {
      const res = await report(apiRequest("/api/admin/report", { token }), undefined);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: expect.any(String) });
    }
  });

  it("summarises the seed", async () => {
    const res = await report(apiRequest("/api/admin/report", { token: t.admin }), undefined);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      totals: { open: 2, filled: 1, cancelled: 0, total: 3 },
      fillRate: 0.3333,
      cancellationsByReason: { "no-show": 0, advance: 0 },
      // nurse-2's records lapsed 2026-06-01; nurse-1's (2027-01-01) are outside the 30-day window.
      credentialsExpiringSoon: [
        { nurseId: "nurse-2", nurseName: "James Cook", type: "license", expiresAt: "2026-06-01" },
        {
          nurseId: "nurse-2",
          nurseName: "James Cook",
          type: "tb_screening",
          expiresAt: "2026-06-01",
        },
      ],
      pendingCredentialReviews: 0,
      byAgency: [
        { agencyId: "agency-a", agencyName: "Sunrise Health Staffing", open: 1, filled: 1 },
        { agencyId: "agency-b", agencyName: "Metro Care Partners", open: 1, filled: 0 },
      ],
    });
  });

  it("counts cancellations by reason", async () => {
    await ctx.db.insert(cancellations).values([
      {
        shiftId: "shift-2",
        reason: "no-show",
        previousNurseId: "nurse-1",
        cancelledBy: "agency-a",
      },
      { shiftId: "shift-2", reason: "advance", previousNurseId: "nurse-1", cancelledBy: "nurse-1" },
      { shiftId: "shift-2", reason: "no-show", previousNurseId: "nurse-1", cancelledBy: "admin-1" },
    ]);
    const body = await (
      await report(apiRequest("/api/admin/report", { token: t.admin }), undefined)
    ).json();
    expect(body.cancellationsByReason).toEqual({ "no-show": 2, advance: 1 });
  });
});

describe("POST /api/admin/compliance-report", () => {
  const call = (token: string | undefined, body: unknown) =>
    complianceReport(
      apiRequest("/api/admin/compliance-report", { method: "POST", token, body }),
      undefined,
    );

  it("admin only, reason required", async () => {
    expect((await call(undefined, { reason: "inspection" })).status).toBe(401);
    expect((await call(t.nurse1, { reason: "inspection" })).status).toBe(403);
    expect((await call(t.agencyA, { reason: "inspection" })).status).toBe(403);
    expect((await call(t.admin, {})).status).toBe(400);
    expect((await call(t.admin, { reason: "x" })).status).toBe(400);
    expect((await call(t.admin, { reason: "y".repeat(201) })).status).toBe(400);
    const unknown = await call(t.admin, { reason: "inspection", nurseIds: ["admin-1"] });
    expect(unknown.status).toBe(400);
    expect(await unknown.json()).toEqual({ error: "Unknown nurse id: admin-1" });
  });

  it("reports verified records for all nurses, no documents, and audits the request", async () => {
    const res = await call(t.admin, { reason: "FL AHCA inspection #42" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      generatedAt: expect.any(String),
      generatedBy: { id: "admin-1", name: "Alex Kim" },
      reason: "FL AHCA inspection #42",
    });
    expect(body.nurses).toEqual([
      {
        nurseId: "nurse-1",
        name: "Maria Lopez",
        licenseNumber: "RN-FL-0001001",
        licenseExpiresAt: "2027-01-01",
        licenseStatus: "valid",
        tbScreeningExpiresAt: "2027-01-01",
        tbStatus: "valid",
        eligibleToday: true,
      },
      {
        nurseId: "nurse-2",
        name: "James Cook",
        licenseNumber: "RN-FL-0001002",
        licenseExpiresAt: "2026-06-01",
        licenseStatus: "expired",
        tbScreeningExpiresAt: "2026-06-01",
        tbStatus: "expired",
        eligibleToday: false,
      },
    ]);
    expect(JSON.stringify(body)).not.toMatch(/blob|pathname|fileName/i);

    const log = await (
      await auditLog(apiRequest("/api/audit-log", { token: t.admin }), undefined)
    ).json();
    expect(log.entries[0]).toMatchObject({
      actorId: "admin-1",
      actorRole: "admin",
      action: "compliance_report.generated",
      metadata: { reason: "FL AHCA inspection #42", nurseIds: ["nurse-1", "nurse-2"] },
    });
  });

  it("scopes to the requested nurses", async () => {
    const body = await (
      await call(t.admin, { reason: "inspection", nurseIds: ["nurse-2"] })
    ).json();
    expect(body.nurses.map((n: { nurseId: string }) => n.nurseId)).toEqual(["nurse-2"]);
  });
});

describe("GET /api/audit-log", () => {
  it("admin only; newest first; honours limit", async () => {
    expect((await auditLog(apiRequest("/api/audit-log"), undefined)).status).toBe(401);
    expect(
      (await auditLog(apiRequest("/api/audit-log", { token: t.agencyA }), undefined)).status,
    ).toBe(403);
    expect(
      (await auditLog(apiRequest("/api/audit-log", { token: t.nurse1 }), undefined)).status,
    ).toBe(403);

    for (let i = 0; i < 3; i++) {
      await recordAudit(ctx.db, ACTORS.admin, "shift.created", "shift", `shift-${i}`);
    }
    const body = await (
      await auditLog(apiRequest("/api/audit-log?limit=2", { token: t.admin }), undefined)
    ).json();
    expect(body.entries).toHaveLength(2);
    expect(body.entries[0]).toEqual({
      id: expect.any(Number),
      actorId: "admin-1",
      actorRole: "admin",
      action: "shift.created",
      entity: "shift",
      entityId: "shift-2",
      metadata: {},
      createdAt: expect.any(String),
    });
    expect(
      (await auditLog(apiRequest("/api/audit-log?limit=0", { token: t.admin }), undefined)).status,
    ).toBe(400);
    expect(
      (await auditLog(apiRequest("/api/audit-log?limit=abc", { token: t.admin }), undefined))
        .status,
    ).toBe(400);
  });
});

describe("POST /api/admin/reset", () => {
  const call = (token?: string) =>
    reset(apiRequest("/api/admin/reset", { method: "POST", token }), undefined);

  it("is disabled unless ALLOW_DEMO_RESET=true", async () => {
    const res = await call(t.admin);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Demo reset is disabled" });
  });

  it("admin only even when enabled", async () => {
    process.env.ALLOW_DEMO_RESET = "true";
    expect((await call()).status).toBe(401);
    expect((await call(t.nurse1)).status).toBe(403);
    expect((await call(t.agencyA)).status).toBe(403);
  });

  it("restores the seed and audits the reset", async () => {
    process.env.ALLOW_DEMO_RESET = "true";
    await ctx.db.update(shifts).set({ status: "filled", claimedBy: "nurse-1" });
    await ctx.db.execute(sql`SELECT nextval('shift_seq')`);
    const res = await call(t.admin);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const rows = await ctx.db.select().from(shifts).orderBy(shifts.id);
    expect(rows.map((r) => [r.id, r.status, r.claimedBy])).toEqual([
      ["shift-1", "open", null],
      ["shift-2", "filled", "nurse-1"],
      ["shift-3", "open", null],
    ]);
    const log = await (
      await auditLog(apiRequest("/api/audit-log", { token: t.admin }), undefined)
    ).json();
    const actions = log.entries.map((e: { action: string }) => e.action);
    // History survives a reset (it must not be erasable), and the reset itself is newest.
    expect(actions[0]).toBe("demo.reset");
    expect(actions).toContain("shift.created");
  });
});
