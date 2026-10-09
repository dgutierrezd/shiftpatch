import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as cancelShift } from "@/app/api/shifts/[id]/cancel/route";
import { POST as claimShift } from "@/app/api/shifts/[id]/claim/route";
import { GET as listShifts } from "@/app/api/shifts/route";
import { loginAll } from "../helpers/auth";
import {
  SHIFT_1,
  SHIFT_2,
  SHIFT_3,
  SHIFT_KEYS,
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

/** Spec "POST /api/shifts/:id/cancel" Response 200, verbatim. */
const SPEC_CANCEL_200 = {
  id: "shift-2",
  agencyId: "agency-a",
  agencyName: "Sunrise Health Staffing",
  role: "LPN",
  date: "2026-10-03",
  startTime: "07:00",
  endTime: "19:00",
  status: "open",
  claimedBy: null,
  cancellation: { reason: "no-show", previousNurseId: "nurse-1" },
};
const SHIFT_2_REOPENED: ShiftDto = { ...SHIFT_2, status: "open", claimedBy: null };

const cancel = (token: string | undefined, id: string, body?: unknown) =>
  call(cancelShift, apiRequest(`/api/shifts/${id}/cancel`, { method: "POST", token, body }), {
    id,
  });
const claim = (token: string, id: string) =>
  call(claimShift, apiRequest(`/api/shifts/${id}/claim`, { method: "POST", token }), { id });
const list = async (token: string) =>
  (
    await expectJson<{ shifts: ShiftDto[] }>(
      await call(listShifts, apiRequest("/api/shifts", { token })),
      200,
    )
  ).shifts;

describe("POST /api/shifts/:id/cancel", () => {
  it("agency-a cancels shift-2 as no-show -> 200 deep-equal to the spec example", async () => {
    const body = await expectJson<Record<string, unknown>>(
      await cancel(t.agencyA, "shift-2", { reason: "no-show" }),
      200,
    );
    expect(body).toEqual(SPEC_CANCEL_200);
    expect(Object.keys(body).sort()).toEqual([...SHIFT_KEYS, "cancellation"].sort());
  });

  it("afterwards GET shows shift-2 open, claimedBy null, and no cancellation key", async () => {
    await expectJson(await cancel(t.agencyA, "shift-2", { reason: "no-show" }), 200);
    const shifts = await list(t.nurse1);
    expect(shifts).toEqual([SHIFT_1, SHIFT_2_REOPENED, SHIFT_3]);
    const s2 = shifts.find((s) => s.id === "shift-2");
    expectShiftShape(s2);
    expect(s2).not.toHaveProperty("cancellation");
  });

  it("the claiming nurse (nurse-1) can cancel in advance", async () => {
    const body = await expectJson(await cancel(t.nurse1, "shift-2", { reason: "advance" }), 200);
    expect(body).toEqual({
      ...SHIFT_2_REOPENED,
      cancellation: { reason: "advance", previousNurseId: "nurse-1" },
    });
  });

  it("admin can cancel", async () => {
    const body = await expectJson(await cancel(t.admin, "shift-2", { reason: "no-show" }), 200);
    expect(body).toEqual(SPEC_CANCEL_200);
  });

  it("agency-b cancelling an agency-a shift -> 403", async () => {
    await expectError(await cancel(t.agencyB, "shift-2", { reason: "no-show" }), 403);
    expect(await list(t.admin)).toContainEqual(SHIFT_2);
  });

  it("nurse-2 cancelling nurse-1's shift -> 403", async () => {
    await expectError(await cancel(t.nurse2, "shift-2", { reason: "advance" }), 403);
    expect(await list(t.admin)).toContainEqual(SHIFT_2);
  });

  it("cancelling an open shift -> 409", async () => {
    await expectError(await cancel(t.agencyA, "shift-1", { reason: "advance" }), 409);
  });

  it("cancelling twice -> second is 409", async () => {
    await expectJson(await cancel(t.agencyA, "shift-2", { reason: "no-show" }), 200);
    await expectError(await cancel(t.agencyA, "shift-2", { reason: "no-show" }), 409);
  });

  it.each([
    ["unknown reason", { reason: "sick" }],
    ["wrong-case reason", { reason: "No-Show" }],
    ["non-string reason", { reason: 1 }],
    ["missing reason", {}],
  ])("%s -> 400", async (_label, body) => {
    await expectError(await cancel(t.agencyA, "shift-2", body), 400);
    expect(await list(t.admin)).toContainEqual(SHIFT_2);
  });

  it("no body at all -> 400", async () => {
    await expectError(await cancel(t.agencyA, "shift-2"), 400);
  });

  it("unknown shift -> 404", async () => {
    await expectError(await cancel(t.admin, "shift-999", { reason: "no-show" }), 404);
  });

  it("no token -> 401", async () => {
    await expectError(await cancel(undefined, "shift-2", { reason: "no-show" }), 401);
  });

  it("after cancel, nurse-1 can re-claim -> 200", async () => {
    await expectJson(await cancel(t.agencyA, "shift-2", { reason: "no-show" }), 200);
    const body = await expectJson(await claim(t.nurse1, "shift-2"), 200);
    expect(body).toEqual(SHIFT_2);
  });

  it("a freshly claimed shift can be cancelled with previousNurseId of the claimer", async () => {
    await expectJson(await claim(t.nurse1, "shift-1"), 200);
    const body = await expectJson(await cancel(t.agencyA, "shift-1", { reason: "advance" }), 200);
    expect(body).toEqual({
      ...SHIFT_1,
      cancellation: { reason: "advance", previousNurseId: "nurse-1" },
    });
  });
});
