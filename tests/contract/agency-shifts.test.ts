import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GET as agencyShifts } from "@/app/api/agencies/[agencyId]/shifts/route";
import { loginAll } from "../helpers/auth";
import {
  SHIFT_1,
  SHIFT_2,
  SHIFT_3,
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

type AgencyView = { agencyId: string; shifts: ShiftDto[] };

const view = (token: string | undefined, agencyId: string) =>
  call(agencyShifts, apiRequest(`/api/agencies/${agencyId}/shifts`, { token }), { agencyId });

describe("GET /api/agencies/:agencyId/shifts", () => {
  it("agency-a on its own id -> shift-1 and shift-2 in full shape", async () => {
    const body = await expectJson<AgencyView>(await view(t.agencyA, "agency-a"), 200);
    expect(body).toEqual({ agencyId: "agency-a", shifts: [SHIFT_1, SHIFT_2] });
    for (const s of body.shifts) expectShiftShape(s);
  });

  it("matches the spec's abbreviated example fields", async () => {
    const body = await expectJson<AgencyView>(await view(t.agencyA, "agency-a"), 200);
    expect(body.shifts).toMatchObject([
      { id: "shift-1", status: "open", claimedBy: null },
      { id: "shift-2", status: "filled", claimedBy: "nurse-1" },
    ]);
  });

  it("agency-b on its own id -> only shift-3", async () => {
    const body = await expectJson<AgencyView>(await view(t.agencyB, "agency-b"), 200);
    expect(body).toEqual({ agencyId: "agency-b", shifts: [SHIFT_3] });
    for (const s of body.shifts) expectShiftShape(s);
  });

  it("agency-a requesting agency-b -> 403", async () => {
    await expectError(await view(t.agencyA, "agency-b"), 403);
  });

  it("agency-b requesting agency-a -> 403", async () => {
    await expectError(await view(t.agencyB, "agency-a"), 403);
  });

  it.each(["nurse1", "nurse2"] as const)("%s -> 403", async (who) => {
    await expectError(await view(t[who], "agency-a"), 403);
  });

  it("admin -> 200 for agency-a", async () => {
    const body = await expectJson<AgencyView>(await view(t.admin, "agency-a"), 200);
    expect(body).toEqual({ agencyId: "agency-a", shifts: [SHIFT_1, SHIFT_2] });
  });

  it("admin -> 200 for agency-b", async () => {
    const body = await expectJson<AgencyView>(await view(t.admin, "agency-b"), 200);
    expect(body).toEqual({ agencyId: "agency-b", shifts: [SHIFT_3] });
  });

  it("admin on an unknown agency -> 404", async () => {
    await expectError(await view(t.admin, "agency-zzz"), 404);
  });

  it("no token -> 401", async () => {
    await expectError(await view(undefined, "agency-a"), 401);
  });

  it("garbage token -> 401", async () => {
    await expectError(await view("nope", "agency-a"), 401);
  });
});
