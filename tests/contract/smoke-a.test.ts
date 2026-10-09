import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { GET as agencyShifts } from "@/app/api/agencies/[agencyId]/shifts/route";
import { POST as cancel } from "@/app/api/shifts/[id]/cancel/route";
import { POST as claim } from "@/app/api/shifts/[id]/claim/route";
import { GET as listShifts, POST as postShift } from "@/app/api/shifts/route";
import { apiRequest, params } from "../helpers/http";
import { createTestDb } from "../helpers/test-db";

let ctx: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  ctx = await createTestDb();
});
afterAll(() => ctx.close());
beforeEach(() => ctx.reset());

const PASSWORD = "Trial2026!";

async function tokenFor(email: string): Promise<string> {
  const res = await login(
    apiRequest("/api/auth/login", { method: "POST", body: { email, password: PASSWORD } }),
    undefined,
  );
  expect(res.status).toBe(200);
  return ((await res.json()) as { token: string }).token;
}

const claimReq = (id: string, token: string) =>
  claim(apiRequest(`/api/shifts/${id}/claim`, { method: "POST", token }), params({ id }));

describe("smoke: required routes happy path", () => {
  it("logs in with the exact response shape and sets the session cookie", async () => {
    const res = await login(
      apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: "maria.lopez@example.com", password: PASSWORD },
      }),
      undefined,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/^sp_session=/);
    const body = (await res.json()) as { token: string; user: unknown };
    expect(Object.keys(body).sort()).toEqual(["token", "user"]);
    expect(body.user).toEqual({ id: "nurse-1", name: "Maria Lopez", role: "nurse" });

    const bad = await login(
      apiRequest("/api/auth/login", {
        method: "POST",
        body: { email: "nobody@example.com", password: PASSWORD },
      }),
      undefined,
    );
    expect(bad.status).toBe(401);
    expect(await bad.json()).toEqual({ error: "Invalid email or password" });
  });

  it("rate-limits repeated failures per ip+email and resets on success", async () => {
    const attempt = (password: string, ip = "203.0.113.7") =>
      login(
        apiRequest("/api/auth/login", {
          method: "POST",
          headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
          body: { email: "alex.kim@example.com", password },
        }),
        undefined,
      );
    for (let i = 0; i < 9; i++) expect((await attempt("wrong")).status).toBe(401);
    expect((await attempt(PASSWORD)).status).toBe(200); // success clears the counter
    for (let i = 0; i < 10; i++) expect((await attempt("wrong")).status).toBe(401);
    const limited = await attempt(PASSWORD);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: "Too many login attempts, try again later" });
    expect((await attempt(PASSWORD, "198.51.100.2")).status).toBe(200);
  });

  it("lists every shift ordered by id", async () => {
    const token = await tokenFor("james.cook@example.com");
    const res = await listShifts(apiRequest("/api/shifts", { token }), undefined);
    expect(res.status).toBe(200);
    const { shifts } = (await res.json()) as { shifts: Array<Record<string, unknown>> };
    expect(shifts.map((s) => s.id)).toEqual(["shift-1", "shift-2", "shift-3"]);
    expect(shifts[0]).toEqual({
      id: "shift-1",
      agencyId: "agency-a",
      agencyName: "Sunrise Health Staffing",
      role: "RN",
      date: "2026-10-02",
      startTime: "19:00",
      endTime: "07:00",
      status: "open",
      claimedBy: null,
    });
  });

  it("enforces claim order: credential 403 before 409, then 200, then 409", async () => {
    const james = await tokenFor("james.cook@example.com");
    const maria = await tokenFor("maria.lopez@example.com");

    const blocked = await claimReq("shift-1", james);
    expect(blocked.status).toBe(403);
    expect(await blocked.json()).toEqual({ error: "Credential expired, cannot claim shift" });

    const blockedFilled = await claimReq("shift-2", james);
    expect(blockedFilled.status).toBe(403);
    expect(await blockedFilled.json()).toEqual({ error: "Credential expired, cannot claim shift" });

    const ok = await claimReq("shift-1", maria);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({
      id: "shift-1",
      agencyId: "agency-a",
      agencyName: "Sunrise Health Staffing",
      role: "RN",
      date: "2026-10-02",
      startTime: "19:00",
      endTime: "07:00",
      status: "filled",
      claimedBy: "nurse-1",
    });

    const again = await claimReq("shift-1", maria);
    expect(again.status).toBe(409);
    expect(await again.json()).toEqual({ error: "Shift is not open" });
  });

  it("agency posts a shift with a sequential id and its own agencyId", async () => {
    const token = await tokenFor("admin@sunrisehealth.example");
    const res = await postShift(
      apiRequest("/api/shifts", {
        method: "POST",
        token,
        body: {
          role: "RN",
          date: "2026-10-05",
          startTime: "07:00",
          endTime: "19:00",
          agencyId: "agency-b",
        },
      }),
      undefined,
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      id: "shift-4",
      agencyId: "agency-a",
      agencyName: "Sunrise Health Staffing",
      role: "RN",
      date: "2026-10-05",
      startTime: "07:00",
      endTime: "19:00",
      status: "open",
      claimedBy: null,
    });
  });

  it("cancels a filled shift as a no-show and reopens it", async () => {
    const token = await tokenFor("admin@sunrisehealth.example");
    const res = await cancel(
      apiRequest("/api/shifts/shift-2/cancel", {
        method: "POST",
        token,
        body: { reason: "no-show" },
      }),
      params({ id: "shift-2" }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
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
    });
  });

  it("scopes agency shifts to the caller's own agency", async () => {
    const token = await tokenFor("admin@metrocare.example");
    const own = await agencyShifts(
      apiRequest("/api/agencies/agency-b/shifts", { token }),
      params({ agencyId: "agency-b" }),
    );
    expect(own.status).toBe(200);
    const body = (await own.json()) as { agencyId: string; shifts: Array<{ id: string }> };
    expect(body.agencyId).toBe("agency-b");
    expect(body.shifts.map((s) => s.id)).toEqual(["shift-3"]);

    const other = await agencyShifts(
      apiRequest("/api/agencies/agency-a/shifts", { token }),
      params({ agencyId: "agency-a" }),
    );
    expect(other.status).toBe(403);
  });
});
