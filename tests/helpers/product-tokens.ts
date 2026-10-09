import { signSession } from "@/server/auth/jwt";
import type { Actor } from "@/server/domain/permissions";

export const ACTORS = {
  nurse1: { id: "nurse-1", role: "nurse", name: "Maria Lopez", agencyId: null },
  nurse2: { id: "nurse-2", role: "nurse", name: "James Cook", agencyId: null },
  agencyA: {
    id: "agency-a",
    role: "agency",
    name: "Sunrise Health Staffing",
    agencyId: "agency-a",
  },
  agencyB: { id: "agency-b", role: "agency", name: "Metro Care Partners", agencyId: "agency-b" },
  admin: { id: "admin-1", role: "admin", name: "Alex Kim", agencyId: null },
} as const satisfies Record<string, Actor>;

export type Tokens = Record<keyof typeof ACTORS, string>;

/** Mints session tokens directly (independent of the login route). */
export async function mintTokens(): Promise<Tokens> {
  const entries = await Promise.all(
    Object.entries(ACTORS).map(async ([k, a]) => [k, await signSession(a)] as const),
  );
  return Object.fromEntries(entries) as Tokens;
}

export async function readJsonBody<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
