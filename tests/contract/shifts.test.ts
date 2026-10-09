import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GET as agencyShifts } from "@/app/api/agencies/[agencyId]/shifts/route";
import { GET as listShifts, POST as postShift } from "@/app/api/shifts/route";
import { loginAll } from "../helpers/auth";
import {
  SEED_SHIFTS,
  type ShiftDto,
  call,
  expectError,
  expectJson,
  expectShiftShape,
} from "../helpers/contract";
import { apiRequest } from "../helpers/http";
import { createTestDb } from "../helpers/test-db";

let ctx: Awaited<ReturnType<typeof createTestDb>>;
let t: Awaited<ReturnType<typeof loginAll>>;
beforeAll(async () => {
  ctx = await createTestDb();
  await ctx.reset();
  t = await loginAll();
});
beforeEach(() => ctx.reset());
afterAll(() => ctx.close());

const SPEC_BODY = { role: "RN", date: "2026-10-05", startTime: "07:00", endTime: "19:00" };
const SPEC_201 = {
  agencyId: "agency-a",
  agencyName: "Sunrise Health Staffing",
  role: "RN",
  date: "2026-10-05",
  startTime: "07:00",
  endTime: "19:00",
  status: "open",
  claimedBy: null,
};

const get = (token?: string) => call(listShifts, apiRequest("/api/shifts", { token }));
const post = (token: string | undefined, body: unknown) =>
  call(postShift, apiRequest("/api/shifts", { method: "POST", token, body }));
const agencyView = (token: string, agencyId: string) =>
  call(agencyShifts, apiRequest(`/api/agencies/${agencyId}/shifts`, { token }), { agencyId });

describe("GET /api/shifts", () => {
  it("returns exactly the 3 seeded shifts with spec values", async () => {
    const body = await expectJson<{ shifts: ShiftDto[] }>(await get(t.nurse1), 200);
    expect(Object.keys(body)).toEqual(["shifts"]);
    expect(body.shifts).toEqual(SEED_SHIFTS);
  });

  it("every shift has exactly the 9 contract keys and claimedBy is explicit null when open", async () => {
    const body = await expectJson<{ shifts: ShiftDto[] }>(await get(t.nurse1), 200);
    for (const s of body.shifts) {
      expectShiftShape(s);
      if (s.status === "open") {
        expect(s).toHaveProperty("claimedBy");
        expect(s.claimedBy).toBeNull();
      }
    }
  });

  it.each(["nurse1", "nurse2", "agencyA", "agencyB", "admin"] as const)(
    "works for %s",
    async (who) => {
      const body = await expectJson<{ shifts: ShiftDto[] }>(await get(t[who]), 200);
      expect(body.shifts).toEqual(SEED_SHIFTS);
    },
  );

  it("no token -> 401", async () => {
    await expectError(await get(), 401);
  });

  it("garbage token -> 401", async () => {
    await expectError(await get("not.a.jwt"), 401);
    await expectError(await get("garbage"), 401);
  });

  it("non-Bearer authorization scheme -> 401", async () => {
    const res = await call(
      listShifts,
      apiRequest("/api/shifts", { headers: { authorization: `Basic ${t.nurse1}` } }),
    );
    await expectError(res, 401);
  });
});

describe("POST /api/shifts", () => {
  it("agency-a posts the spec example -> 201 matching spec (id shift-4)", async () => {
    const body = await expectJson<ShiftDto>(await post(t.agencyA, SPEC_BODY), 201);
    expectShiftShape(body);
    const { id, ...rest } = body;
    expect(rest).toEqual(SPEC_201);
    expect(id).toMatch(/^shift-\d+$/);
    expect(id).toBe("shift-4");
  });

  it("ids are sequential: shift-4 then shift-5", async () => {
    const a = await expectJson<ShiftDto>(await post(t.agencyA, SPEC_BODY), 201);
    const b = await expectJson<ShiftDto>(await post(t.agencyB, SPEC_BODY), 201);
    expect(a.id).toBe("shift-4");
    expect(b.id).toBe("shift-5");
    expect(b.agencyId).toBe("agency-b");
    expect(b.agencyName).toBe("Metro Care Partners");
  });

  it("agencyId comes from the token, not the body", async () => {
    const body = await expectJson<ShiftDto>(
      await post(t.agencyA, { ...SPEC_BODY, agencyId: "agency-b" }),
      201,
    );
    expect(body.agencyId).toBe("agency-a");
    expect(body.agencyName).toBe("Sunrise Health Staffing");
  });

  it("accepts an overnight shift (19:00 -> 07:00)", async () => {
    const body = await expectJson<ShiftDto>(
      await post(t.agencyA, { ...SPEC_BODY, startTime: "19:00", endTime: "07:00" }),
      201,
    );
    expect(body.startTime).toBe("19:00");
    expect(body.endTime).toBe("07:00");
  });

  it("accepts a past date", async () => {
    const body = await expectJson<ShiftDto>(
      await post(t.agencyA, { ...SPEC_BODY, date: "2020-01-01" }),
      201,
    );
    expect(body.date).toBe("2020-01-01");
  });

  it("nurse -> 403", async () => {
    await expectError(await post(t.nurse1, SPEC_BODY), 403);
  });

  it("admin -> 403", async () => {
    await expectError(await post(t.admin, SPEC_BODY), 403);
  });

  it("no token -> 401", async () => {
    await expectError(await post(undefined, SPEC_BODY), 401);
  });

  it.each([
    ["bad role", { ...SPEC_BODY, role: "MD" }],
    ["invalid calendar date", { ...SPEC_BODY, date: "2026-02-30" }],
    ["malformed date", { ...SPEC_BODY, date: "10/05/2026" }],
    ["non-HH:mm start time", { ...SPEC_BODY, startTime: "7:00" }],
    ["out-of-range end time", { ...SPEC_BODY, endTime: "25:00" }],
    ["start equals end", { ...SPEC_BODY, startTime: "07:00", endTime: "07:00" }],
    ["missing role", { date: "2026-10-05", startTime: "07:00", endTime: "19:00" }],
    ["missing date", { role: "RN", startTime: "07:00", endTime: "19:00" }],
    ["missing startTime", { role: "RN", date: "2026-10-05", endTime: "19:00" }],
    ["missing endTime", { role: "RN", date: "2026-10-05", startTime: "07:00" }],
  ])("%s -> 400", async (_label, body) => {
    await expectError(await post(t.agencyA, body), 400);
  });

  it("rejected posts do not create shifts", async () => {
    await post(t.agencyA, { ...SPEC_BODY, role: "MD" });
    await post(t.nurse1, SPEC_BODY);
    const body = await expectJson<{ shifts: ShiftDto[] }>(await get(t.admin), 200);
    expect(body.shifts).toEqual(SEED_SHIFTS);
  });

  it("new shift appears in GET /api/shifts and agency-a's view, not agency-b's", async () => {
    const created = await expectJson<ShiftDto>(await post(t.agencyA, SPEC_BODY), 201);

    const all = await expectJson<{ shifts: ShiftDto[] }>(await get(t.nurse1), 200);
    expect(all.shifts.map((s) => s.id)).toEqual(["shift-1", "shift-2", "shift-3", "shift-4"]);
    expect(all.shifts.find((s) => s.id === created.id)).toEqual(created);

    const a = await expectJson<{ agencyId: string; shifts: ShiftDto[] }>(
      await agencyView(t.agencyA, "agency-a"),
      200,
    );
    expect(a.shifts.find((s) => s.id === created.id)).toEqual(created);

    const b = await expectJson<{ agencyId: string; shifts: ShiftDto[] }>(
      await agencyView(t.agencyB, "agency-b"),
      200,
    );
    expect(b.shifts.map((s) => s.id)).toEqual(["shift-3"]);
  });
});
