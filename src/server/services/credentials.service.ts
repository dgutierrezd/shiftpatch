import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { credentials, users, type CredentialRow } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { DomainError, badRequest, conflict, forbidden, notFound } from "@/server/domain/errors";
import {
  MAX_CREDENTIAL_FILE_BYTES,
  isUuid,
  sanitizeFileName,
  sniffCredentialFile,
} from "@/server/domain/file-type";
import type { Actor } from "@/server/domain/permissions";
import { facilityToday } from "@/server/domain/shift-time";
import type { CredentialFileStore, StoredFile } from "@/server/storage/credential-file-store";
import { recordAudit } from "./audit";
import { queueNotification } from "./notify";

export const CREDENTIAL_ERRORS = {
  notFound: "Credential not found",
  noFile: "No file is stored for this credential",
  fileRequired: "A license document file is required",
  tbFile: "TB screening is recorded as an attestation; do not upload medical documents",
  badFileType: "File must be a PDF, PNG or JPEG document",
  tooLarge: "File is larger than the 4 MB limit",
  expired: "expiresAt must be today or later",
  notPending: "Credential has already been reviewed",
} as const;

/** Public shape. Storage location (blob pathname/url) is never exposed. */
export interface CredentialDto {
  id: string;
  nurseId: string;
  nurseName: string;
  type: CredentialRow["type"];
  fileName: string | null;
  expiresAt: string;
  status: CredentialRow["status"];
  uploadedAt: string;
  reviewedAt: string | null;
}

function toDto(row: CredentialRow, nurseName: string): CredentialDto {
  return {
    id: row.id,
    nurseId: row.nurseId,
    nurseName,
    type: row.type,
    fileName: row.fileName ?? null,
    expiresAt: row.expiresAt,
    status: row.status,
    uploadedAt: row.uploadedAt.toISOString(),
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
  };
}

export async function listCredentials(
  db: Db,
  actor: Actor,
  filter: { status?: CredentialRow["status"] },
): Promise<CredentialDto[]> {
  if (actor.role === "agency") throw forbidden();
  const conditions = [];
  if (actor.role === "nurse") conditions.push(eq(credentials.nurseId, actor.id));
  if (filter.status) conditions.push(eq(credentials.status, filter.status));
  const rows = await db
    .select({ credential: credentials, nurseName: users.name })
    .from(credentials)
    .innerJoin(users, eq(users.id, credentials.nurseId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(credentials.uploadedAt), desc(credentials.id));
  return rows.map((r) => toDto(r.credential, r.nurseName));
}

export interface CredentialUpload {
  type: CredentialRow["type"];
  expiresAt: string;
  file: { name: string; data: Uint8Array } | null;
}

export async function uploadCredential(
  db: Db,
  store: CredentialFileStore,
  actor: Actor,
  input: CredentialUpload,
  today: string = facilityToday(),
): Promise<CredentialDto> {
  if (actor.role !== "nurse") throw forbidden();
  if (input.expiresAt < today) throw badRequest(CREDENTIAL_ERRORS.expired);

  let file: { pathname: string; fileName: string; mime: string; size: number } | null = null;
  if (input.type === "tb_screening") {
    // Attestation only: TB results are worker medical records (see ESCALATION.md).
    if (input.file) throw badRequest(CREDENTIAL_ERRORS.tbFile);
  } else {
    if (!input.file) throw badRequest(CREDENTIAL_ERRORS.fileRequired);
    if (input.file.data.byteLength > MAX_CREDENTIAL_FILE_BYTES) {
      throw new DomainError(413, CREDENTIAL_ERRORS.tooLarge);
    }
    const kind = sniffCredentialFile(input.file.data);
    if (!kind) throw new DomainError(415, CREDENTIAL_ERRORS.badFileType);
    const stored = await store.put(
      `credentials/${actor.id}/${randomUUID()}.${kind.ext}`,
      input.file.data,
      kind.mime,
    );
    file = {
      pathname: stored.pathname,
      fileName: sanitizeFileName(input.file.name),
      mime: kind.mime,
      size: input.file.data.byteLength,
    };
  }

  try {
    const row = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(credentials)
        .values({
          nurseId: actor.id,
          type: input.type,
          expiresAt: input.expiresAt,
          status: "pending",
          blobPathname: file?.pathname ?? null,
          fileName: file?.fileName ?? null,
          mimeType: file?.mime ?? null,
          sizeBytes: file?.size ?? null,
        })
        .returning();
      if (!created) throw new Error("credential insert returned no row");
      await recordAudit(tx, actor, "credential.uploaded", "credential", created.id, {
        type: input.type,
        expiresAt: input.expiresAt,
      });
      const admins = await tx.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
      for (const admin of admins) {
        await queueNotification(
          tx,
          admin.id,
          "credential.pending_review",
          "Credential pending review",
          "A nurse submitted a credential that is waiting for review in the admin dashboard.",
        );
      }
      return created;
    });
    return toDto(row, actor.name);
  } catch (err) {
    if (file) await store.remove(file.pathname).catch(() => undefined);
    throw err;
  }
}

async function findCredential(db: Db, id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({ credential: credentials, nurseName: users.name })
    .from(credentials)
    .innerJoin(users, eq(users.id, credentials.nurseId))
    .where(eq(credentials.id, id));
  return row ?? null;
}

export async function reviewCredential(
  db: Db,
  actor: Actor,
  id: string,
  decision: "verified" | "rejected",
): Promise<CredentialDto> {
  if (actor.role !== "admin") throw forbidden();
  const existing = await findCredential(db, id);
  if (!existing) throw notFound(CREDENTIAL_ERRORS.notFound);

  const row = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(credentials)
      .set({ status: decision, reviewedBy: actor.id, reviewedAt: new Date() })
      .where(and(eq(credentials.id, id), eq(credentials.status, "pending")))
      .returning();
    if (!updated) throw conflict(CREDENTIAL_ERRORS.notPending);
    await recordAudit(
      tx,
      actor,
      decision === "verified" ? "credential.verified" : "credential.rejected",
      "credential",
      id,
      { type: updated.type, nurseId: updated.nurseId },
    );
    await queueNotification(
      tx,
      updated.nurseId,
      `credential.${decision}`,
      decision === "verified" ? "Credential verified" : "Credential rejected",
      decision === "verified"
        ? "An administrator verified one of your credentials."
        : "An administrator could not verify one of your credentials. Please sign in for details.",
    );
    return updated;
  });
  return toDto(row, existing.nurseName);
}

export interface CredentialFileDownload extends StoredFile {
  fileName: string;
}

/** Owner nurse or admin only. Every successful read is audited. */
export async function openCredentialFile(
  db: Db,
  store: CredentialFileStore,
  actor: Actor,
  id: string,
): Promise<CredentialFileDownload> {
  if (actor.role === "agency") throw forbidden();
  const existing = await findCredential(db, id);
  if (!existing) throw notFound(CREDENTIAL_ERRORS.notFound);
  const { credential } = existing;
  if (actor.role === "nurse" && credential.nurseId !== actor.id) throw forbidden();
  if (!credential.blobPathname) throw notFound(CREDENTIAL_ERRORS.noFile);

  const stored = await store.get(credential.blobPathname);
  if (!stored) throw notFound(CREDENTIAL_ERRORS.noFile);
  await recordAudit(db, actor, "credential.file_viewed", "credential", credential.id, {
    nurseId: credential.nurseId,
  });
  return {
    stream: stored.stream,
    contentType: credential.mimeType ?? stored.contentType,
    fileName: credential.fileName ?? "credential",
  };
}
