import { credentialListQuerySchema, credentialUploadFieldsSchema } from "@/lib/product-validation";
import { requireActor } from "@/server/auth/actor";
import { getDb } from "@/server/db/client";
import { DomainError, badRequest } from "@/server/domain/errors";
import { MAX_CREDENTIAL_FILE_BYTES } from "@/server/domain/file-type";
import { withRoute } from "@/server/http/with-route";
import {
  CREDENTIAL_ERRORS,
  listCredentials,
  uploadCredential,
} from "@/server/services/credentials.service";
import { getCredentialFileStore } from "@/server/storage/credential-file-store";

// Room for multipart framing and the text fields on top of the 4 MB file limit.
const MAX_BODY_BYTES = MAX_CREDENTIAL_FILE_BYTES + 64 * 1024;

export const GET = withRoute(async (req: Request) => {
  const actor = await requireActor(req, "nurse", "admin");
  const url = new URL(req.url);
  const filter = credentialListQuerySchema.parse({
    status: url.searchParams.get("status") ?? undefined,
  });
  return Response.json({ credentials: await listCredentials(getDb(), actor, filter) });
});

export const POST = withRoute(async (req: Request) => {
  const actor = await requireActor(req, "nurse");

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) throw new DomainError(413, CREDENTIAL_ERRORS.tooLarge);
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("multipart/form-data")) {
    throw new DomainError(415, "Request must be multipart/form-data");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw badRequest("Request body must be valid multipart/form-data");
  }
  const fields = credentialUploadFieldsSchema.parse({
    type: form.get("type") ?? undefined,
    expiresAt: form.get("expiresAt") ?? undefined,
  });

  const entry = form.get("file");
  if (entry !== null && typeof entry === "string") throw badRequest("file must be a file upload");
  // Browsers send an empty, unnamed part when the file input is left blank.
  const file =
    entry && (entry.size > 0 || entry.name)
      ? { name: entry.name, data: new Uint8Array(await entry.arrayBuffer()) }
      : null;

  const credential = await uploadCredential(getDb(), getCredentialFileStore(), actor, {
    ...fields,
    file,
  });
  return Response.json(credential, { status: 201 });
});
