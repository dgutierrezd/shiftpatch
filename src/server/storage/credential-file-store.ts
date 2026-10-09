import "server-only";
import { randomUUID } from "node:crypto";
import { del, get, put } from "@vercel/blob";

export interface StoredFile {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
}

/**
 * Where credential documents live. Production uses private Vercel Blob (no public URL ever
 * exists); tests and local dev without Blob credentials fall back to an in-memory store.
 */
export interface CredentialFileStore {
  /** Stores the bytes and returns the final pathname (a random suffix is appended). */
  put(pathname: string, data: Uint8Array, contentType: string): Promise<{ pathname: string }>;
  get(pathname: string): Promise<StoredFile | null>;
  remove(pathname: string): Promise<void>;
}

export const vercelBlobStore: CredentialFileStore = {
  async put(pathname, data, contentType) {
    const result = await put(pathname, Buffer.from(data), {
      access: "private",
      addRandomSuffix: true,
      contentType,
    });
    return { pathname: result.pathname };
  },
  async get(pathname) {
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    return { stream: result.stream, contentType: result.blob.contentType };
  },
  async remove(pathname) {
    await del(pathname);
  },
};

export function createMemoryStore(): CredentialFileStore {
  const files = new Map<string, { data: Uint8Array; contentType: string }>();
  return {
    async put(pathname, data, contentType) {
      const dot = pathname.lastIndexOf(".");
      const suffix = randomUUID().slice(0, 8);
      const stored =
        dot > 0
          ? `${pathname.slice(0, dot)}-${suffix}${pathname.slice(dot)}`
          : `${pathname}-${suffix}`;
      files.set(stored, { data: new Uint8Array(data), contentType });
      return { pathname: stored };
    },
    async get(pathname) {
      const file = files.get(pathname);
      if (!file) return null;
      const bytes = file.data;
      return {
        contentType: file.contentType,
        stream: new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(bytes);
            controller.close();
          },
        }),
      };
    },
    async remove(pathname) {
      files.delete(pathname);
    },
  };
}

let override: CredentialFileStore | null = null;
let memory: CredentialFileStore | null = null;

export function setCredentialFileStoreForTesting(store: CredentialFileStore | null): void {
  override = store;
}

export function getCredentialFileStore(): CredentialFileStore {
  if (override) return override;
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) return vercelBlobStore;
  if (!memory) {
    if (process.env.NODE_ENV === "production") {
      console.warn("Blob storage is not configured; credential files are kept in memory only");
    }
    memory = createMemoryStore();
  }
  return memory;
}
