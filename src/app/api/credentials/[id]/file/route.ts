import { requireActor } from "@/server/auth/actor";
import { getDb } from "@/server/db/client";
import { asciiFileName } from "@/server/domain/file-type";
import { withRoute } from "@/server/http/with-route";
import { openCredentialFile } from "@/server/services/credentials.service";
import { getCredentialFileStore } from "@/server/storage/credential-file-store";

/** Streams a credential document to its owner or an admin; never a redirect to storage. */
export const GET = withRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireActor(req, "nurse", "admin");
  const { id } = await ctx.params;
  const file = await openCredentialFile(getDb(), getCredentialFileStore(), actor, id);
  const disposition = `attachment; filename="${asciiFileName(file.fileName)}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`;
  return new Response(file.stream, {
    status: 200,
    headers: {
      "content-type": file.contentType,
      "content-disposition": disposition,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
});
