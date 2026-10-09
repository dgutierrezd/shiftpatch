import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GET as listCredentials, POST as uploadCredential } from "@/app/api/credentials/route";
import { GET as getFile } from "@/app/api/credentials/[id]/file/route";
import { POST as review } from "@/app/api/credentials/[id]/review/route";
import { POST as complianceReport } from "@/app/api/admin/compliance-report/route";
import { GET as auditLog } from "@/app/api/audit-log/route";
import { GET as notificationsList } from "@/app/api/notifications/route";
import {
  createMemoryStore,
  setCredentialFileStoreForTesting,
} from "@/server/storage/credential-file-store";
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
beforeEach(async () => {
  await ctx.reset();
  setCredentialFileStoreForTesting(createMemoryStore());
});

const PDF = new TextEncoder().encode("%PDF-1.7\n%test license\n");
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const FUTURE = "2030-01-01";

function upload(
  token: string | undefined,
  fields: { type?: string; expiresAt?: string },
  file?: { bytes: Uint8Array; name: string; mime?: string },
): Request {
  const form = new FormData();
  if (fields.type !== undefined) form.set("type", fields.type);
  if (fields.expiresAt !== undefined) form.set("expiresAt", fields.expiresAt);
  if (file) {
    form.set(
      "file",
      new Blob([file.bytes as BlobPart], { type: file.mime ?? "application/octet-stream" }),
      file.name,
    );
  }
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request("http://localhost:3000/api/credentials", {
    method: "POST",
    headers,
    body: form,
  });
}

async function uploadLicense(token: string, expiresAt = FUTURE) {
  const res = await uploadCredential(
    upload(token, { type: "license", expiresAt }, { bytes: PDF, name: "license.pdf" }),
    undefined,
  );
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string; status: string };
}

async function uploadTb(token: string, expiresAt = FUTURE) {
  const res = await uploadCredential(upload(token, { type: "tb_screening", expiresAt }), undefined);
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string; status: string };
}

describe("GET /api/credentials", () => {
  it("401 without token, 403 for agency", async () => {
    expect((await listCredentials(apiRequest("/api/credentials"), undefined)).status).toBe(401);
    const res = await listCredentials(
      apiRequest("/api/credentials", { token: t.agencyA }),
      undefined,
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: expect.any(String) });
  });

  it("nurse sees only own credentials; admin sees all and can filter", async () => {
    const own = await (
      await listCredentials(apiRequest("/api/credentials", { token: t.nurse1 }), undefined)
    ).json();
    expect(own.credentials).toHaveLength(2);
    expect(own.credentials.every((c: { nurseId: string }) => c.nurseId === "nurse-1")).toBe(true);
    expect(Object.keys(own.credentials[0]).sort()).toEqual(
      [
        "expiresAt",
        "fileName",
        "id",
        "nurseId",
        "nurseName",
        "reviewedAt",
        "status",
        "type",
        "uploadedAt",
      ].sort(),
    );

    const all = await (
      await listCredentials(apiRequest("/api/credentials", { token: t.admin }), undefined)
    ).json();
    expect(all.credentials).toHaveLength(4);

    await uploadLicense(t.nurse2);
    const pending = await (
      await listCredentials(
        apiRequest("/api/credentials?status=pending", { token: t.admin }),
        undefined,
      )
    ).json();
    expect(pending.credentials).toHaveLength(1);
    expect(pending.credentials[0]).toMatchObject({
      nurseId: "nurse-2",
      status: "pending",
      type: "license",
    });
    expect(JSON.stringify(pending)).not.toMatch(/blob|pathname|credentials\//i);

    const bad = await listCredentials(
      apiRequest("/api/credentials?status=nope", { token: t.admin }),
      undefined,
    );
    expect(bad.status).toBe(400);
  });
});

describe("POST /api/credentials", () => {
  it("401 without token; 403 for agency and admin", async () => {
    const body = { type: "license", expiresAt: FUTURE };
    const file = { bytes: PDF, name: "l.pdf" };
    expect((await uploadCredential(upload(undefined, body, file), undefined)).status).toBe(401);
    expect((await uploadCredential(upload(t.agencyA, body, file), undefined)).status).toBe(403);
    expect((await uploadCredential(upload(t.admin, body, file), undefined)).status).toBe(403);
  });

  it("stores a license as pending, audits without PII, notifies admins", async () => {
    const created = await uploadLicense(t.nurse2);
    expect(created).toMatchObject({
      nurseId: "nurse-2",
      nurseName: "James Cook",
      type: "license",
      fileName: "license.pdf",
      expiresAt: FUTURE,
      status: "pending",
      reviewedAt: null,
    });
    expect(created).not.toHaveProperty("blobPathname");

    const log = await (
      await auditLog(apiRequest("/api/audit-log", { token: t.admin }), undefined)
    ).json();
    const entry = log.entries.find((e: { action: string }) => e.action === "credential.uploaded");
    expect(entry).toMatchObject({ actorId: "nurse-2", entityId: created.id });
    expect(entry.metadata).toEqual({ type: "license", expiresAt: FUTURE });

    const notes = await (
      await notificationsList(apiRequest("/api/notifications", { token: t.admin }), undefined)
    ).json();
    expect(notes.notifications[0]).toMatchObject({ subject: "Credential pending review" });
  });

  it("rejects files by magic bytes, not by declared type", async () => {
    const fake = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    const res = await uploadCredential(
      upload(
        t.nurse1,
        { type: "license", expiresAt: FUTURE },
        { bytes: fake, name: "x.pdf", mime: "application/pdf" },
      ),
      undefined,
    );
    expect(res.status).toBe(415);
    expect(await res.json()).toEqual({ error: "File must be a PDF, PNG or JPEG document" });

    const png = await uploadCredential(
      upload(t.nurse1, { type: "license", expiresAt: FUTURE }, { bytes: PNG, name: "scan.txt" }),
      undefined,
    );
    expect(png.status).toBe(201);
  });

  it("413 over 4 MB", async () => {
    const big = new Uint8Array(4 * 1024 * 1024 + 1);
    big.set(PDF);
    const res = await uploadCredential(
      upload(t.nurse1, { type: "license", expiresAt: FUTURE }, { bytes: big, name: "big.pdf" }),
      undefined,
    );
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: expect.any(String) });
  });

  it("TB screening is attestation only: file rejected, no file stored", async () => {
    const res = await uploadCredential(
      upload(t.nurse1, { type: "tb_screening", expiresAt: FUTURE }, { bytes: PDF, name: "tb.pdf" }),
      undefined,
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "TB screening is recorded as an attestation; do not upload medical documents",
    });
    const tb = await uploadTb(t.nurse1);
    expect(tb).toMatchObject({ type: "tb_screening", fileName: null, status: "pending" });
    const file = await getFile(
      apiRequest(`/api/credentials/${tb.id}/file`, { token: t.admin }),
      params({ id: tb.id }),
    );
    expect(file.status).toBe(404);
  });

  it("validates fields: license needs a file, expiry must be a real date not in the past", async () => {
    const cases: Array<[Record<string, string>, number]> = [
      [{ type: "license", expiresAt: FUTURE }, 400], // no file
      [{ type: "passport", expiresAt: FUTURE }, 400],
      [{ type: "tb_screening", expiresAt: "2030-02-30" }, 400],
      [{ type: "tb_screening", expiresAt: "2020-01-01" }, 400],
      [{ type: "tb_screening" }, 400],
    ];
    for (const [fields, status] of cases) {
      const res = await uploadCredential(upload(t.nurse1, fields), undefined);
      expect(res.status, JSON.stringify(fields)).toBe(status);
      expect(await res.json()).toEqual({ error: expect.any(String) });
    }
    const json = await uploadCredential(
      apiRequest("/api/credentials", {
        method: "POST",
        token: t.nurse1,
        body: { type: "license" },
      }),
      undefined,
    );
    expect(json.status).toBe(415);
  });
});

describe("review flow and eligibility", () => {
  async function eligible(nurseId: string): Promise<boolean> {
    const res = await complianceReport(
      apiRequest("/api/admin/compliance-report", {
        method: "POST",
        token: t.admin,
        body: { reason: "test check", nurseIds: [nurseId] },
      }),
      undefined,
    );
    expect(res.status).toBe(200);
    return (await res.json()).nurses[0].eligibleToday;
  }

  it("pending uploads do not unblock nurse-2; verification does", async () => {
    expect(await eligible("nurse-2")).toBe(false);
    const license = await uploadLicense(t.nurse2);
    const tb = await uploadTb(t.nurse2);
    expect(await eligible("nurse-2")).toBe(false);

    for (const c of [license, tb]) {
      const res = await review(
        apiRequest(`/api/credentials/${c.id}/review`, {
          method: "POST",
          token: t.admin,
          body: { decision: "verified" },
        }),
        params({ id: c.id }),
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({
        id: c.id,
        status: "verified",
        reviewedAt: expect.any(String),
      });
    }
    expect(await eligible("nurse-2")).toBe(true);

    const nurseNotes = await (
      await notificationsList(apiRequest("/api/notifications", { token: t.nurse2 }), undefined)
    ).json();
    expect(nurseNotes.notifications[0].subject).toBe("Credential verified");
  });

  it("review authZ, validation, 404 and 409", async () => {
    const c = await uploadLicense(t.nurse2);
    const path = `/api/credentials/${c.id}/review`;
    const body = { decision: "rejected" };
    expect(
      (await review(apiRequest(path, { method: "POST", body }), params({ id: c.id }))).status,
    ).toBe(401);
    expect(
      (
        await review(
          apiRequest(path, { method: "POST", token: t.nurse2, body }),
          params({ id: c.id }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await review(
          apiRequest(path, { method: "POST", token: t.agencyA, body }),
          params({ id: c.id }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await review(
          apiRequest(path, { method: "POST", token: t.admin, body: { decision: "maybe" } }),
          params({ id: c.id }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await review(
          apiRequest("/api/credentials/nope/review", { method: "POST", token: t.admin, body }),
          params({ id: "nope" }),
        )
      ).status,
    ).toBe(404);
    const ok = await review(
      apiRequest(path, { method: "POST", token: t.admin, body }),
      params({ id: c.id }),
    );
    expect(await ok.json()).toMatchObject({ status: "rejected" });
    const again = await review(
      apiRequest(path, { method: "POST", token: t.admin, body }),
      params({ id: c.id }),
    );
    expect(again.status).toBe(409);
  });
});

describe("GET /api/credentials/[id]/file", () => {
  it("streams to owner and admin with safe headers, audits each view", async () => {
    const c = await uploadLicense(t.nurse1);
    for (const token of [t.nurse1, t.admin]) {
      const res = await getFile(
        apiRequest(`/api/credentials/${c.id}/file`, { token }),
        params({ id: c.id }),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
      expect(res.headers.get("content-disposition")).toMatch(
        /^attachment; filename="license\.pdf"/,
      );
      expect(res.headers.get("cache-control")).toBe("private, no-store");
      expect(new Uint8Array(await res.arrayBuffer())).toEqual(PDF);
    }
    const log = await (
      await auditLog(apiRequest("/api/audit-log", { token: t.admin }), undefined)
    ).json();
    const views = log.entries.filter(
      (e: { action: string }) => e.action === "credential.file_viewed",
    );
    expect(views.map((v: { actorId: string }) => v.actorId).sort()).toEqual(["admin-1", "nurse-1"]);
  });

  it("401 / 403 other nurse / 403 agency / 404 unknown", async () => {
    const c = await uploadLicense(t.nurse1);
    const path = `/api/credentials/${c.id}/file`;
    expect((await getFile(apiRequest(path), params({ id: c.id }))).status).toBe(401);
    expect(
      (await getFile(apiRequest(path, { token: t.nurse2 }), params({ id: c.id }))).status,
    ).toBe(403);
    expect(
      (await getFile(apiRequest(path, { token: t.agencyA }), params({ id: c.id }))).status,
    ).toBe(403);
    const missing = "00000000-0000-4000-8000-000000000000";
    const res = await getFile(
      apiRequest(`/api/credentials/${missing}/file`, { token: t.admin }),
      params({ id: missing }),
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Credential not found" });
  });

  it("seed credentials have no stored file", async () => {
    const all = await (
      await listCredentials(apiRequest("/api/credentials", { token: t.admin }), undefined)
    ).json();
    const id = all.credentials[0].id;
    const res = await getFile(
      apiRequest(`/api/credentials/${id}/file`, { token: t.admin }),
      params({ id }),
    );
    expect(res.status).toBe(404);
  });
});
