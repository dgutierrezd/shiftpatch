import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GET as listTimesheets } from "@/app/api/timesheets/route";
import { POST as submit } from "@/app/api/timesheets/[id]/submit/route";
import { POST as approve } from "@/app/api/timesheets/[id]/approve/route";
import { GET as notificationsList } from "@/app/api/notifications/route";
import { apiRequest, params } from "../helpers/http";
import { mintTokens, type Tokens } from "../helpers/product-tokens";
import { createTestDb } from "../helpers/test-db";

let ctx: Awaited<ReturnType<typeof createTestDb>>;
let t: Tokens;
let id: string;

beforeAll(async () => {
  ctx = await createTestDb();
  t = await mintTokens();
});
afterAll(() => ctx.close());
beforeEach(async () => {
  await ctx.reset();
  const res = await listTimesheets(apiRequest("/api/timesheets", { token: t.admin }), undefined);
  id = (await res.json()).timesheets[0].id;
});

const list = async (token: string) =>
  (await (await listTimesheets(apiRequest("/api/timesheets", { token }), undefined)).json())
    .timesheets as Array<Record<string, unknown>>;

const doSubmit = (token: string | undefined, body: unknown, tsId = id) =>
  submit(
    apiRequest(`/api/timesheets/${tsId}/submit`, { method: "POST", token, body }),
    params({ id: tsId }),
  );
const doApprove = (token: string | undefined, tsId = id) =>
  approve(
    apiRequest(`/api/timesheets/${tsId}/approve`, { method: "POST", token }),
    params({ id: tsId }),
  );

describe("GET /api/timesheets", () => {
  it("returns the seeded shift-2 timesheet with the documented shape", async () => {
    const rows = await list(t.admin);
    expect(rows).toEqual([
      {
        id: expect.any(String),
        shiftId: "shift-2",
        nurseId: "nurse-1",
        nurseName: "Maria Lopez",
        agencyId: "agency-a",
        agencyName: "Sunrise Health Staffing",
        date: "2026-10-03",
        startTime: "07:00",
        endTime: "19:00",
        scheduledHours: 12,
        workedHours: null,
        status: "pending",
      },
    ]);
  });

  it("scopes by role and tenant", async () => {
    expect(await list(t.nurse1)).toHaveLength(1);
    expect(await list(t.nurse2)).toHaveLength(0);
    expect(await list(t.agencyA)).toHaveLength(1);
    expect(await list(t.agencyB)).toHaveLength(0);
    expect((await listTimesheets(apiRequest("/api/timesheets"), undefined)).status).toBe(401);
  });
});

describe("timesheet state machine", () => {
  it("pending → submitted → approved, with notifications", async () => {
    const s = await doSubmit(t.nurse1, { workedHours: 11.5 });
    expect(s.status).toBe(200);
    expect(await s.json()).toMatchObject({ status: "submitted", workedHours: 11.5 });

    const agencyNotes = await (
      await notificationsList(apiRequest("/api/notifications", { token: t.agencyA }), undefined)
    ).json();
    expect(agencyNotes.notifications[0].subject).toBe("Timesheet submitted");

    expect((await doSubmit(t.nurse1, { workedHours: 10 })).status).toBe(409);

    const a = await doApprove(t.agencyA);
    expect(a.status).toBe(200);
    expect(await a.json()).toMatchObject({ status: "approved", workedHours: 11.5 });
    expect((await doApprove(t.admin)).status).toBe(409);
  });

  it("approve requires submitted (409 from pending); admin may approve", async () => {
    const early = await doApprove(t.agencyA);
    expect(early.status).toBe(409);
    expect(await early.json()).toEqual({ error: "Only a submitted timesheet can be approved" });
    await doSubmit(t.nurse1, { workedHours: 12 });
    expect((await doApprove(t.admin)).status).toBe(200);
  });

  it("submit authZ and validation", async () => {
    expect((await doSubmit(undefined, { workedHours: 1 })).status).toBe(401);
    expect((await doSubmit(t.agencyA, { workedHours: 1 })).status).toBe(403);
    expect((await doSubmit(t.admin, { workedHours: 1 })).status).toBe(403);
    expect((await doSubmit(t.nurse2, { workedHours: 1 })).status).toBe(403);
    for (const body of [{ workedHours: 25 }, { workedHours: -1 }, { workedHours: "8" }, {}]) {
      const res = await doSubmit(t.nurse1, body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(await res.json()).toEqual({ error: expect.any(String) });
    }
    expect((await doSubmit(t.nurse1, { workedHours: 1 }, "not-a-uuid")).status).toBe(404);
  });

  it("approve authZ: nurse 403, other agency 403", async () => {
    await doSubmit(t.nurse1, { workedHours: 12 });
    expect((await doApprove(undefined)).status).toBe(401);
    expect((await doApprove(t.nurse1)).status).toBe(403);
    expect((await doApprove(t.agencyB)).status).toBe(403);
    expect((await doApprove(t.agencyA, "00000000-0000-4000-8000-000000000000")).status).toBe(404);
  });
});
