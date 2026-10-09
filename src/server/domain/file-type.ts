/** Credential uploads are accepted by content, never by the client-declared MIME type or extension. */

export const MAX_CREDENTIAL_FILE_BYTES = 4 * 1024 * 1024;

export interface CredentialFileKind {
  mime: "application/pdf" | "image/png" | "image/jpeg";
  ext: "pdf" | "png" | "jpg";
}

const SIGNATURES: ReadonlyArray<{ bytes: readonly number[]; kind: CredentialFileKind }> = [
  { bytes: [0x25, 0x50, 0x44, 0x46, 0x2d], kind: { mime: "application/pdf", ext: "pdf" } }, // %PDF-
  {
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    kind: { mime: "image/png", ext: "png" },
  },
  { bytes: [0xff, 0xd8, 0xff], kind: { mime: "image/jpeg", ext: "jpg" } },
];

/** Detects PDF / PNG / JPEG from magic bytes; anything else returns null. */
export function sniffCredentialFile(data: Uint8Array): CredentialFileKind | null {
  for (const { bytes, kind } of SIGNATURES) {
    if (data.length >= bytes.length && bytes.every((b, i) => data[i] === b)) return kind;
  }
  return null;
}

/** Display-safe file name: basename only, no control characters or quotes, bounded length. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[\u0000-\u001f\u007f"]/g, "").trim();
  return (cleaned || "credential").slice(0, 200);
}

/** ASCII-only fallback for the Content-Disposition `filename` parameter. */
export function asciiFileName(name: string): string {
  return name.replace(/[^\x20-\x7e]/g, "_").replace(/[\\;"]/g, "_");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** uuid-keyed rows: any other id can't exist, so it is a 404 rather than a SQL cast error. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
