import { POST as loginHandler } from "@/app/api/auth/login/route";
import { call } from "./contract";
import { apiRequest } from "./http";

export const PASSWORD = "Trial2026!";

/** The 5 seed users from the spec, with the exact `user` object login must return. */
export const USERS = {
  agencyA: {
    email: "admin@sunrisehealth.example",
    user: { id: "agency-a", name: "Sunrise Health Staffing", role: "agency" },
  },
  agencyB: {
    email: "admin@metrocare.example",
    user: { id: "agency-b", name: "Metro Care Partners", role: "agency" },
  },
  nurse1: {
    email: "maria.lopez@example.com",
    user: { id: "nurse-1", name: "Maria Lopez", role: "nurse" },
  },
  nurse2: {
    email: "james.cook@example.com",
    user: { id: "nurse-2", name: "James Cook", role: "nurse" },
  },
  admin: {
    email: "alex.kim@example.com",
    user: { id: "admin-1", name: "Alex Kim", role: "admin" },
  },
} as const;

export const AGENCY_A = USERS.agencyA.email;
export const AGENCY_B = USERS.agencyB.email;
export const NURSE_1 = USERS.nurse1.email;
export const NURSE_2 = USERS.nurse2.email;
export const ADMIN = USERS.admin.email;

/** Calls the real login handler with a JSON body. */
export function login(body: unknown): Promise<Response> {
  return call(loginHandler, apiRequest("/api/auth/login", { method: "POST", body }));
}

/** Calls the real login handler with a raw (possibly malformed) body. */
export function loginRaw(rawBody: string, headers?: Record<string, string>): Promise<Response> {
  return call(loginHandler, apiRequest("/api/auth/login", { method: "POST", rawBody, headers }));
}

/** Logs in through the login route and returns the bearer token. */
export async function loginAs(email: string, password: string = PASSWORD): Promise<string> {
  const res = await login({ email, password });
  if (res.status !== 200) {
    throw new Error(`login failed for ${email}: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as { token: string };
  return body.token;
}

/** Tokens for all 5 seed users (logs each in once). */
export async function loginAll(): Promise<{
  agencyA: string;
  agencyB: string;
  nurse1: string;
  nurse2: string;
  admin: string;
}> {
  return {
    agencyA: await loginAs(AGENCY_A),
    agencyB: await loginAs(AGENCY_B),
    nurse1: await loginAs(NURSE_1),
    nurse2: await loginAs(NURSE_2),
    admin: await loginAs(ADMIN),
  };
}
