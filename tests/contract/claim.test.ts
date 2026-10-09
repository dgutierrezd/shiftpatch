import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as claimShift } from "@/app/api/shifts/[id]/claim/route";
import { GET as listShifts, POST as postShift } from "@/app/api/shifts/route";
import { ERRORS } from "@/server/domain/errors";
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

/** Spec "POST /api/shifts/:id/claim" Response 200, verbatim. */
const SPEC_CLAIM_200 = {
  id: "shift-1",
  agencyId: "agency-a",
  agencyName: "Sunrise Health Staffing",
  role: "RN",
  date: "2026-10-02",
  startTime: "19:00",
  endTime: "07:00",
  status: "filled",
  claimedBy: "nurse-1",
};

const claim = (token: string | undefined, id: string) =>
  call(claimShift, apiRequest(`/api/shifts/${id}/claim`, { method: "POST", token }), { id });
const list = async (token: string) =>
  (
    await expectJson<{ shifts: ShiftDto[] }>(
      await call(listShifts, apiRequest("/api/shifts", { token })),
      200,
    )
  ).shifts;
const postNew = async (date: string) =>
  expectJson<ShiftDto>(
    await call(
      postShift,
      apiRequest("/api/shifts", {
        method: "POST",
        token: t.agencyA,
        body: { role: "RN", date, startTime: "07:00", endTime: "19:00" },
      }),
    ),
    201,
  );

describe("POST /api/shifts/:id/claim", () => {
  it("nurse-1 claims shift-1 -> 200 deep-equal to the spec example", async () => {
    const body = await expectJson<ShiftDto>(await claim(t.nurse1, "shift-1"), 200);
    expectShiftShape(body);
    expect(body).toEqual(SPEC_CLAIM_200);
  });

  it("GET /api/shifts reflects the claim", async () => {
    await expectJson(await claim(t.nurse1, "shift-1"), 200);
    expect(await list(t.admin)).toEqual([SPEC_CLAIM_200, SHIFT_2, SHIFT_3]);
  });

  it("claiming an already-claimed shift -> 409", async () => {
    await expectJson(await claim(t.nurse1, "shift-1"), 200);
    await expectError(await claim(t.nurse1, "shift-1"), 409);
  });

  it("claiming seeded filled shift-2 -> 409 for a valid nurse", async () => {
    await expectError(await claim(t.nurse1, "shift-2"), 409);
  });

  it("nurse-2 (expired credential) -> 403 with the exact spec message", async () => {
    const res = await claim(t.nurse2, "shift-3");
    await expectError(res, 403, "Credential expired, cannot claim shift");
    expect(ERRORS.credentialExpired).toBe("Credential expired, cannot claim shift");
    expect(await list(t.admin)).toContainEqual(SHIFT_3);
  });

  it("nurse-2 on already-filled shift-2 still gets the credential 403 (check order)", async () => {
    await expectError(await claim(t.nurse2, "shift-2"), 403, ERRORS.credentialExpired);
  });

  it("agency -> 403", async () => {
    await expectError(await claim(t.agencyA, "shift-1"), 403);
  });

  it("admin -> 403", async () => {
    await expectError(await claim(t.admin, "shift-1"), 403);
  });

  it("unknown shift -> 404", async () => {
    await expectError(await claim(t.nurse1, "shift-999"), 404);
  });

  it("no token -> 401", async () => {
    await expectError(await claim(undefined, "shift-1"), 401);
  });

  it("garbage token -> 401", async () => {
    await expectError(await claim("garbage.token.here", "shift-1"), 401);
  });

  it("works with an empty body and no content-type", async () => {
    const req = apiRequest("/api/shifts/shift-1/claim", { method: "POST", token: t.nurse1 });
    expect(req.headers.get("content-type")).toBeNull();
    const res = await call(claimShift, req, { id: "shift-1" });
    expect(await expectJson(res, 200)).toEqual(SPEC_CLAIM_200);
  });

  it("works with an empty JSON object body", async () => {
    const req = apiRequest("/api/shifts/shift-1/claim", {
      method: "POST",
      token: t.nurse1,
      body: {},
    });
    expect(await expectJson(await call(claimShift, req, { id: "shift-1" }), 200)).toEqual(
      SPEC_CLAIM_200,
    );
  });

  it("two concurrent claims on a new shift -> exactly one 200 and one 409", async () => {
    const created = await postNew("2026-11-01");
    const [a, b] = await Promise.all([claim(t.nurse1, created.id), claim(t.nurse1, created.id)]);
    const results = [a, b];
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 409]);
    const loser = results.find((r) => r.status === 409);
    if (!loser) throw new Error("expected a 409");
    await expectError(loser, 409);
    const winner = results.find((r) => r.status === 200);
    if (!winner) throw new Error("expected a 200");
    expect(await expectJson(winner, 200)).toEqual({
      ...created,
      status: "filled",
      claimedBy: "nurse-1",
    });
  });

  it("claiming a past-dated shift is allowed (seed shift-1 is in the past)", async () => {
    const created = await postNew("2020-01-01");
    const body = await expectJson<ShiftDto>(await claim(t.nurse1, created.id), 200);
    expect(body).toEqual({ ...created, status: "filled", claimedBy: "nurse-1" });
  });

  it("seed shift-1 (dated before today) remains claimable", async () => {
    expect(SHIFT_1.date).toBe("2026-10-02");
    await expectJson(await claim(t.nurse1, SHIFT_1.id), 200);
  });
});
