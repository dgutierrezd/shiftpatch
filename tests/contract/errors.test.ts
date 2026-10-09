import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GET as agencyShifts } from "@/app/api/agencies/[agencyId]/shifts/route";
import { POST as cancelShift } from "@/app/api/shifts/[id]/cancel/route";
import { POST as claimShift } from "@/app/api/shifts/[id]/claim/route";
import { GET as listShifts, POST as postShift } from "@/app/api/shifts/route";
import { ERRORS } from "@/server/domain/errors";
import { login, loginAll, loginRaw } from "../helpers/auth";
import { call, expectError } from "../helpers/contract";
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

/** One request per authenticated route, parameterised by token. */
const routes: Array<[string, (token?: string) => Promise<Response>]> = [
  ["GET /api/shifts", (token) => call(listShifts, apiRequest("/api/shifts", { token }))],
  [
    "POST /api/shifts",
    (token) =>
      call(
        postShift,
        apiRequest("/api/shifts", {
          method: "POST",
          token,
          body: { role: "RN", date: "2026-10-05", startTime: "07:00", endTime: "19:00" },
        }),
      ),
  ],
  [
    "POST /api/shifts/:id/claim",
    (token) =>
      call(claimShift, apiRequest("/api/shifts/shift-1/claim", { method: "POST", token }), {
        id: "shift-1",
      }),
  ],
  [
    "POST /api/shifts/:id/cancel",
    (token) =>
      call(
        cancelShift,
        apiRequest("/api/shifts/shift-2/cancel", {
          method: "POST",
          token,
          body: { reason: "no-show" },
        }),
        { id: "shift-2" },
      ),
  ],
  [
    "GET /api/agencies/:agencyId/shifts",
    (token) =>
      call(agencyShifts, apiRequest("/api/agencies/agency-a/shifts", { token }), {
        agencyId: "agency-a",
      }),
  ],
];

describe("error envelope: every non-2xx is JSON { error: string } and nothing else", () => {
  it.each(routes)("%s without a token -> 401 envelope", async (_name, send) => {
    await expectError(await send(), 401);
  });

  it.each(routes)("%s with a garbage token -> 401 envelope", async (_name, send) => {
    await expectError(await send("garbage"), 401);
  });

  it.each(routes)("%s with a tampered JWT -> 401 envelope", async (_name, send) => {
    const [h, p] = t.agencyA.split(".");
    await expectError(await send(`${h}.${p}.invalidsignature`), 401);
  });

  it("login 401 uses the exact spec message", async () => {
    await expectError(
      await login({ email: "maria.lopez@example.com", password: "x" }),
      401,
      ERRORS.invalidLogin,
    );
  });

  it("login malformed JSON -> 400 envelope", async () => {
    await expectError(await loginRaw("{", { "content-type": "application/json" }), 400);
  });

  it("POST /api/shifts malformed JSON -> 400 envelope", async () => {
    const res = await call(
      postShift,
      apiRequest("/api/shifts", {
        method: "POST",
        token: t.agencyA,
        rawBody: "{role:",
        headers: { "content-type": "application/json" },
      }),
    );
    await expectError(res, 400);
  });

  it("POST /api/shifts/:id/cancel malformed JSON -> 400 envelope", async () => {
    const res = await call(
      cancelShift,
      apiRequest("/api/shifts/shift-2/cancel", {
        method: "POST",
        token: t.agencyA,
        rawBody: "not json",
        headers: { "content-type": "application/json" },
      }),
      { id: "shift-2" },
    );
    await expectError(res, 400);
  });

  it("claim 403 credential error is exact", async () => {
    const res = await call(
      claimShift,
      apiRequest("/api/shifts/shift-3/claim", { method: "POST", token: t.nurse2 }),
      { id: "shift-3" },
    );
    expect(await expectError(res, 403)).toBe("Credential expired, cannot claim shift");
  });

  it("claim 404 / 409 envelopes", async () => {
    await expectError(
      await call(
        claimShift,
        apiRequest("/api/shifts/nope/claim", { method: "POST", token: t.nurse1 }),
        { id: "nope" },
      ),
      404,
    );
    await expectError(
      await call(
        claimShift,
        apiRequest("/api/shifts/shift-2/claim", { method: "POST", token: t.nurse1 }),
        { id: "shift-2" },
      ),
      409,
    );
  });

  it("403 envelopes for role violations on each route", async () => {
    await expectError(await routes[1]![1](t.nurse1), 403);
    await expectError(await routes[2]![1](t.agencyA), 403);
    await expectError(await routes[3]![1](t.agencyB), 403);
    await expectError(await routes[4]![1](t.nurse1), 403);
  });
});
