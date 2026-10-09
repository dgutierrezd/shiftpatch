import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GET as listShifts } from "@/app/api/shifts/route";
import { ERRORS } from "@/server/domain/errors";
import { PASSWORD, USERS, login, loginRaw } from "../helpers/auth";
import { call, expectError, expectJson } from "../helpers/contract";
import { apiRequest } from "../helpers/http";
import { createTestDb } from "../helpers/test-db";

let ctx: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  ctx = await createTestDb();
});
beforeEach(() => ctx.reset());
afterAll(() => ctx.close());

type LoginBody = { token: string; user: { id: string; name: string; role: string } };

describe("POST /api/auth/login", () => {
  for (const [key, seed] of Object.entries(USERS)) {
    it(`logs in ${key} (${seed.email}) with the exact spec shape`, async () => {
      const res = await login({ email: seed.email, password: PASSWORD });
      const body = await expectJson<LoginBody>(res, 200);
      expect(Object.keys(body).sort()).toEqual(["token", "user"]);
      expect(body.user).toEqual(seed.user);
      expect(typeof body.token).toBe("string");
      const parts = body.token.split(".");
      expect(parts).toHaveLength(3);
      for (const p of parts) expect(p).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  }

  it("agency login returns id agency-a and role agency; admin returns admin-1", async () => {
    const a = await expectJson<LoginBody>(
      await login({ email: USERS.agencyA.email, password: PASSWORD }),
      200,
    );
    expect(a.user.id).toBe("agency-a");
    expect(a.user.role).toBe("agency");
    const admin = await expectJson<LoginBody>(
      await login({ email: USERS.admin.email, password: PASSWORD }),
      200,
    );
    expect(admin.user.id).toBe("admin-1");
    expect(admin.user.role).toBe("admin");
  });

  it("issues a token that authenticates against the API", async () => {
    const { token } = await expectJson<LoginBody>(
      await login({ email: USERS.nurse1.email, password: PASSWORD }),
      200,
    );
    const res = await call(listShifts, apiRequest("/api/shifts", { token }));
    expect(res.status).toBe(200);
  });

  it("treats email case-insensitively and trims whitespace", async () => {
    const res = await login({ email: "  MARIA.Lopez@Example.COM  ", password: PASSWORD });
    const body = await expectJson<LoginBody>(res, 200);
    expect(body.user).toEqual(USERS.nurse1.user);
  });

  it("sets an HttpOnly sp_session cookie", async () => {
    const res = await login({ email: USERS.nurse1.email, password: PASSWORD });
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/(^|,\s*)sp_session=[^;]+/);
    expect(cookie).toMatch(/;\s*HttpOnly/i);
  });

  it("wrong password -> 401 with the exact spec error", async () => {
    const res = await login({ email: USERS.nurse1.email, password: "wrong-password" });
    await expectError(res, 401, "Invalid email or password");
  });

  it("unknown email -> 401 identical to wrong password", async () => {
    const wrongPw = await login({ email: USERS.nurse1.email, password: "nope" });
    const unknown = await login({ email: "nobody@example.com", password: PASSWORD });
    expect(unknown.status).toBe(401);
    expect(wrongPw.status).toBe(401);
    const a = await unknown.json();
    const b = await wrongPw.json();
    expect(a).toEqual(b);
    expect(a).toEqual({ error: ERRORS.invalidLogin });
  });

  it("password is case-sensitive", async () => {
    await expectError(
      await login({ email: USERS.nurse1.email, password: PASSWORD.toLowerCase() }),
      401,
      ERRORS.invalidLogin,
    );
  });

  it("missing password -> 400", async () => {
    await expectError(await login({ email: USERS.nurse1.email }), 400);
  });

  it("missing email -> 400", async () => {
    await expectError(await login({ password: PASSWORD }), 400);
  });

  it("empty object -> 400", async () => {
    await expectError(await login({}), 400);
  });

  it("non-string fields -> 400", async () => {
    await expectError(await login({ email: 123, password: true }), 400);
  });

  it("malformed JSON -> 400", async () => {
    await expectError(await loginRaw("{not json", { "content-type": "application/json" }), 400);
  });

  it("empty body -> 400", async () => {
    await expectError(await loginRaw("", { "content-type": "application/json" }), 400);
  });
});
