import { expect } from "vitest";

/** Any Next.js route handler, called the way the framework would. */
type AnyHandler = (
  req: Request,
  ctx: { params: Promise<Record<string, string>> },
) => Promise<Response>;

/** Invokes a route handler regardless of its declared parameter types (Request vs NextRequest, ctx or not). */
export function call(
  handler: unknown,
  req: Request,
  params: Record<string, string> = {},
): Promise<Response> {
  return (handler as AnyHandler)(req, { params: Promise.resolve(params) });
}

/** The exact 9 keys every shift-returning route must emit (spec: "same shape"), sorted. */
export const SHIFT_KEYS = [
  "agencyId",
  "agencyName",
  "claimedBy",
  "date",
  "endTime",
  "id",
  "role",
  "startTime",
  "status",
] as const;

export interface ShiftDto {
  id: string;
  agencyId: string;
  agencyName: string;
  role: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  claimedBy: string | null;
}

/** Seed shifts exactly as the spec's tables/examples describe them. */
export const SHIFT_1: ShiftDto = {
  id: "shift-1",
  agencyId: "agency-a",
  agencyName: "Sunrise Health Staffing",
  role: "RN",
  date: "2026-10-02",
  startTime: "19:00",
  endTime: "07:00",
  status: "open",
  claimedBy: null,
};
export const SHIFT_2: ShiftDto = {
  id: "shift-2",
  agencyId: "agency-a",
  agencyName: "Sunrise Health Staffing",
  role: "LPN",
  date: "2026-10-03",
  startTime: "07:00",
  endTime: "19:00",
  status: "filled",
  claimedBy: "nurse-1",
};
export const SHIFT_3: ShiftDto = {
  id: "shift-3",
  agencyId: "agency-b",
  agencyName: "Metro Care Partners",
  role: "RN",
  date: "2026-10-04",
  startTime: "19:00",
  endTime: "07:00",
  status: "open",
  claimedBy: null,
};
export const SEED_SHIFTS: readonly ShiftDto[] = [SHIFT_1, SHIFT_2, SHIFT_3];

/** Asserts a shift object has exactly the 9 contract keys. */
export function expectShiftShape(value: unknown): void {
  expect(value).toBeTypeOf("object");
  expect(Object.keys(value as object).sort()).toEqual([...SHIFT_KEYS]);
}

/** Asserts status + JSON content type, and returns the parsed body. */
export async function expectJson<T = unknown>(res: Response, status: number): Promise<T> {
  const text = await res.text();
  expect(res.status, `body: ${text}`).toBe(status);
  expect(res.headers.get("content-type") ?? "").toMatch(/application\/json/i);
  return JSON.parse(text) as T;
}

/**
 * Every non-2xx response: JSON content type and a body of exactly `{ error: string }`.
 * Pass `message` to also require the exact text. Returns the error message.
 */
export async function expectError(
  res: Response,
  status: number,
  message?: string,
): Promise<string> {
  const text = await res.text();
  expect(res.status, `body: ${text}`).toBe(status);
  expect(res.headers.get("content-type") ?? "").toMatch(/application\/json/i);
  const body = JSON.parse(text) as Record<string, unknown>;
  expect(Object.keys(body)).toEqual(["error"]);
  expect(typeof body.error).toBe("string");
  expect(String(body.error).length).toBeGreaterThan(0);
  if (message !== undefined) expect(body).toEqual({ error: message });
  return String(body.error);
}
