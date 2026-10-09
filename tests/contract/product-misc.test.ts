import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as me } from "@/app/api/auth/me/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as notificationsList } from "@/app/api/notifications/route";
import { POST as markRead } from "@/app/api/notifications/[id]/read/route";
import { POST as waitlistPost } from "@/app/api/waitlist/route";
import { GET as deliverEmail } from "@/app/api/cron/deliver-email/route";
import { notifications, users, waitlist } from "@/server/db/schema";
import { deliverQueued } from "@/server/services/email.service";
import { queueNotification } from "@/server/services/notify";
import { apiRequest, params } from "../helpers/http";
import { mintTokens, type Tokens } from "../helpers/product-tokens";
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
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  delete process.env.CRON_SECRET;
});

describe("auth/me and logout", () => {
  it("returns the caller for every role", async () => {
    expect(
      await (await me(apiRequest("/api/auth/me", { token: t.nurse1 }), undefined)).json(),
    ).toEqual({
      id: "nurse-1",
      name: "Maria Lopez",
      role: "nurse",
      agencyId: null,
    });
    expect(
      await (await me(apiRequest("/api/auth/me", { token: t.agencyB }), undefined)).json(),
    ).toEqual({
      id: "agency-b",
      name: "Metro Care Partners",
      role: "agency",
      agencyId: "agency-b",
    });
    const admin = await me(apiRequest("/api/auth/me", { token: t.admin }), undefined);
    expect((await admin.json()).role).toBe("admin");
  });

  it("401 without or with a bad token", async () => {
    expect((await me(apiRequest("/api/auth/me"), undefined)).status).toBe(401);
    const bad = await me(apiRequest("/api/auth/me", { token: "garbage" }), undefined);
    expect(bad.status).toBe(401);
    expect(await bad.json()).toEqual({ error: expect.any(String) });
  });

  it("logout clears the session cookie", async () => {
    const res = await logout(apiRequest("/api/auth/logout", { method: "POST" }), undefined);
    expect(res.status).toBe(204);
    expect(res.headers.get("set-cookie")).toMatch(/^sp_session=;.*Max-Age=0/);
  });
});

describe("notifications", () => {
  it("lists own notifications and marks them read; others' are 403", async () => {
    await queueNotification(ctx.db, "nurse-1", "test", "Hello", "Body");
    await queueNotification(ctx.db, "nurse-2", "test", "Other", "Body");
    expect((await notificationsList(apiRequest("/api/notifications"), undefined)).status).toBe(401);

    const list = await (
      await notificationsList(apiRequest("/api/notifications", { token: t.nurse1 }), undefined)
    ).json();
    expect(list.notifications).toEqual([
      {
        id: expect.any(String),
        kind: "test",
        subject: "Hello",
        body: "Body",
        readAt: null,
        createdAt: expect.any(String),
      },
    ]);
    const id = list.notifications[0].id;

    const read = await markRead(
      apiRequest(`/api/notifications/${id}/read`, { method: "POST", token: t.nurse1 }),
      params({ id }),
    );
    expect(read.status).toBe(200);
    expect((await read.json()).readAt).toEqual(expect.any(String));

    const cross = await markRead(
      apiRequest(`/api/notifications/${id}/read`, { method: "POST", token: t.nurse2 }),
      params({ id }),
    );
    expect(cross.status).toBe(403);
    expect(
      (
        await markRead(
          apiRequest("/api/notifications/x/read", { method: "POST", token: t.nurse1 }),
          params({ id: "x" }),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await markRead(
          apiRequest(`/api/notifications/${id}/read`, { method: "POST" }),
          params({ id }),
        )
      ).status,
    ).toBe(401);
  });
});

describe("POST /api/waitlist", () => {
  const join = (body: unknown) =>
    waitlistPost(apiRequest("/api/waitlist", { method: "POST", body }), undefined);

  it("201 first time, 200 on duplicate with the same body", async () => {
    const first = await join({
      email: "Ops@Facility.org",
      organization: "Bay Clinic",
      role: "DON",
    });
    expect(first.status).toBe(201);
    expect(await first.json()).toEqual({ ok: true });
    const dup = await join({ email: "ops@facility.org" });
    expect(dup.status).toBe(200);
    expect(await dup.json()).toEqual({ ok: true });
    expect(await ctx.db.select().from(waitlist)).toHaveLength(1);
  });

  it("validates the email", async () => {
    for (const body of [
      {},
      { email: "nope" },
      { email: "a@b.co", organization: "x".repeat(201) },
    ]) {
      const res = await join(body);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: expect.any(String) });
    }
    const malformed = await waitlistPost(
      apiRequest("/api/waitlist", { method: "POST", rawBody: "{" }),
      undefined,
    );
    expect(malformed.status).toBe(400);
  });
});

describe("email outbox", () => {
  it("skips everything when Resend is not configured", async () => {
    await queueNotification(ctx.db, "nurse-1", "test", "Hi", "Body");
    const fetchImpl = vi.fn<typeof fetch>();
    expect(await deliverQueued(ctx.db, { fetchImpl })).toEqual({ sent: 0, skipped: 1, failed: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
    const [row] = await ctx.db.select().from(notifications);
    expect(row?.emailStatus).toBe("skipped");
  });

  it("sends to real addresses only, never .example / @example.com", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "ShiftPatch <noreply@shiftpatch.test>";
    await queueNotification(ctx.db, "nurse-1", "test", "Seed user", "Body"); // @example.com
    await queueNotification(ctx.db, "agency-a", "test", "Seed agency", "Body"); // .example
    await ctx.db
      .update(users)
      .set({ email: "maria@realclinic.org" })
      .where(eq(users.id, "nurse-2"));
    await queueNotification(ctx.db, "nurse-2", "test", "Real", "Body");

    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    expect(await deliverQueued(ctx.db, { fetchImpl })).toEqual({ sent: 1, skipped: 2, failed: 0 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe("https://api.resend.com/emails");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      to: ["maria@realclinic.org"],
      subject: "Real",
    });
  });

  it("leaves failed sends queued", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "noreply@shiftpatch.test";
    await ctx.db.update(users).set({ email: "x@realclinic.org" }).where(eq(users.id, "nurse-2"));
    await queueNotification(ctx.db, "nurse-2", "test", "Real", "Body");
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("{}", { status: 500 }));
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await deliverQueued(ctx.db, { fetchImpl })).toEqual({ sent: 0, skipped: 0, failed: 1 });
    errors.mockRestore();
    const [row] = await ctx.db.select().from(notifications);
    expect(row?.emailStatus).toBe("queued");
  });

  it("cron route requires the CRON_SECRET bearer", async () => {
    const call = (token?: string) =>
      deliverEmail(apiRequest("/api/cron/deliver-email", { token }), undefined);
    expect((await call("anything")).status).toBe(403); // secret unset → always 403
    process.env.CRON_SECRET = "cron-secret-value";
    expect((await call()).status).toBe(403);
    expect((await call("wrong")).status).toBe(403);
    const ok = await call("cron-secret-value");
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ sent: 0, skipped: 0, failed: 0 });
  });
});
