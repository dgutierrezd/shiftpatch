import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as claim } from "@/app/api/shifts/[id]/claim/route";
import { LOGIN_MAX_FAILURES, LOGIN_MAX_FAILURES_PER_IP } from "@/server/services/auth.service";
import { createTestDb } from "../helpers/test-db";
import { call } from "../helpers/contract";
import { apiRequest, params } from "../helpers/http";

// Regression tests for the security review findings (login CSRF, rate-limit race).

let ctx: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  ctx = await createTestDb();
});
beforeEach(() => ctx.reset());
afterAll(() => ctx.close());

const creds = { email: "maria.lopez@example.com", password: "Trial2026!" };

function loginFrom(ip: string, body: unknown, headers: Record<string, string> = {}) {
  return call(
    login,
    apiRequest("/api/auth/login", {
      method: "POST",
      body,
      headers: { "x-forwarded-for": ip, ...headers },
    }),
  );
}

describe("cross-site request guard", () => {
  it("rejects a login posted from another site (login CSRF via text/plain form)", async () => {
    const forged = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "text/plain",
        origin: "https://evil.example",
        host: "localhost:3000",
      },
      body: `{"email":"${creds.email}","password":"${creds.password}","z":"="}`,
    });
    const res = await call(login, forged);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Cross-site request blocked" });
  });

  it("rejects writes flagged Sec-Fetch-Site: cross-site even with a bearer token", async () => {
    const { token } = (await (await loginFrom("10.0.0.1", creds)).json()) as { token: string };
    const res = await claim(
      apiRequest("/api/shifts/shift-1/claim", {
        method: "POST",
        token,
        headers: { "sec-fetch-site": "cross-site" },
      }),
      params({ id: "shift-1" }),
    );
    expect(res.status).toBe(403);
  });

  it("still allows same-origin browser logins and header-less API clients", async () => {
    expect(
      (
        await loginFrom("10.0.0.2", creds, {
          origin: "http://localhost:3000",
          host: "localhost:3000",
        })
      ).status,
    ).toBe(200);
    expect((await loginFrom("10.0.0.3", creds)).status).toBe(200);
  });
});

describe("login rate limiting", () => {
  it("cannot be bypassed by a parallel burst of guesses", async () => {
    const burst = await Promise.all(
      Array.from({ length: LOGIN_MAX_FAILURES + 8 }, () =>
        loginFrom("10.0.1.1", { ...creds, password: "wrong" }),
      ),
    );
    const statuses = burst.map((r) => r.status);
    expect(statuses.filter((s) => s === 401).length).toBeLessThanOrEqual(LOGIN_MAX_FAILURES);
    expect(statuses.filter((s) => s === 429).length).toBeGreaterThanOrEqual(8);
  });

  it("limits password spraying from one IP across many accounts", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < LOGIN_MAX_FAILURES_PER_IP + 1; i++) {
      statuses.push(
        (await loginFrom("10.0.2.1", { email: `nobody${i}@example.com`, password: "x" })).status,
      );
    }
    expect(statuses.at(-1)).toBe(429);
  });

  it("does not throttle many successful logins from one IP (grader scripts)", async () => {
    for (let i = 0; i < LOGIN_MAX_FAILURES_PER_IP + 5; i++) {
      const res = await loginFrom("10.0.3.1", creds);
      if (res.status !== 200) throw new Error(`login ${i} returned ${res.status}`);
    }
  });
});
