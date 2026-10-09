import { SignJWT, jwtVerify } from "jose";
import type { Actor, Role } from "@/server/domain/permissions";

const ISSUER = "shiftpatch";
const AUDIENCE = "shiftpatch-api";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

function secret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error("JWT_SECRET must be set (32+ characters)");
  return new TextEncoder().encode(value);
}

export async function signSession(actor: Actor): Promise<string> {
  return new SignJWT({ role: actor.role, name: actor.name, agencyId: actor.agencyId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(actor.id)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

const ROLES: readonly Role[] = ["nurse", "agency", "admin"];

/** Returns null for any invalid, expired, or tampered token. Only HS256 is accepted. */
export async function verifySession(token: string): Promise<Actor | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const role = payload.role as Role;
    if (!payload.sub || !ROLES.includes(role) || typeof payload.name !== "string") return null;
    const agencyId = typeof payload.agencyId === "string" ? payload.agencyId : null;
    return { id: payload.sub, role, name: payload.name, agencyId };
  } catch {
    return null;
  }
}
