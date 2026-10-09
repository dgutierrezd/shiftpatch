/**
 * Contract smoke test over real HTTP against a running/deployed app:
 *   npm run smoke -- https://shiftpatch.vercel.app
 * Exercises the 6 required routes incl. negative cases, then resets demo data
 * so the deployment is left with pristine spec seed state.
 */
const base = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const PASSWORD = "Trial2026!";
const SHIFT_KEYS = [
  "agencyId",
  "agencyName",
  "claimedBy",
  "date",
  "endTime",
  "id",
  "role",
  "startTime",
  "status",
];

let failures = 0;
function check(name: string, ok: boolean, detail = ""): void {
  console.log(`${ok ? "✅" : "❌"} ${name}${ok || !detail ? "" : ` — ${detail}`}`);
  if (!ok) failures++;
}

async function call(
  path: string,
  init: { method?: string; token?: string; body?: unknown; raw?: string } = {},
) {
  const headers: Record<string, string> = {};
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  let body: string | undefined = init.raw;
  if (init.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  const res = await fetch(`${base}${path}`, {
    method: init.method ?? "GET",
    headers,
    body,
    redirect: "manual",
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json: json as Record<string, unknown> };
}

async function login(email: string): Promise<string> {
  const res = await call("/api/auth/login", {
    method: "POST",
    body: { email, password: PASSWORD },
  });
  check(`login ${email} → 200`, res.status === 200, `got ${res.status}`);
  return String(res.json.token ?? "");
}

const isErrorBody = (j: unknown) =>
  !!j &&
  typeof j === "object" &&
  Object.keys(j).length === 1 &&
  typeof (j as { error?: unknown }).error === "string";
const hasShiftShape = (s: unknown) =>
  !!s &&
  typeof s === "object" &&
  JSON.stringify(Object.keys(s).sort()) === JSON.stringify(SHIFT_KEYS);

console.log(`Smoke testing ${base}\n`);

const admin = await login("alex.kim@example.com");
const reset = await call("/api/admin/reset", { method: "POST", token: admin });
check("admin reset → 200 (start from seed)", reset.status === 200, `got ${reset.status}`);

const nurse1 = await login("maria.lopez@example.com");
const nurse2 = await login("james.cook@example.com");
const agencyA = await login("admin@sunrisehealth.example");
const agencyB = await login("admin@metrocare.example");

const bad = await call("/api/auth/login", {
  method: "POST",
  body: { email: "maria.lopez@example.com", password: "nope" },
});
check(
  "bad password → 401 exact error",
  bad.status === 401 && bad.json.error === "Invalid email or password",
);

const malformed = await call("/api/auth/login", { method: "POST", raw: "{not json" });
check("malformed JSON → 400 {error}", malformed.status === 400 && isErrorBody(malformed.json));

const list = await call("/api/shifts", { token: nurse1 });
const shifts = (list.json.shifts ?? []) as Array<Record<string, unknown>>;
check(
  "GET /api/shifts → 3 seed shifts",
  list.status === 200 && shifts.length === 3,
  JSON.stringify(list.json),
);
check("every shift has exactly the 9 spec keys", shifts.every(hasShiftShape));
check(
  "shift-1 open with claimedBy null",
  shifts[0]?.id === "shift-1" && shifts[0]?.claimedBy === null,
);

const noAuth = await call("/api/shifts");
check("GET /api/shifts without token → 401", noAuth.status === 401 && isErrorBody(noAuth.json));

const blocked = await call("/api/shifts/shift-1/claim", { method: "POST", token: nurse2 });
check(
  "nurse-2 claim → 403 exact text",
  blocked.status === 403 && blocked.json.error === "Credential expired, cannot claim shift",
  JSON.stringify(blocked.json),
);

const claimed = await call("/api/shifts/shift-1/claim", { method: "POST", token: nurse1 });
check(
  "nurse-1 claim shift-1 → 200 filled",
  claimed.status === 200 &&
    claimed.json.status === "filled" &&
    claimed.json.claimedBy === "nurse-1" &&
    hasShiftShape(claimed.json),
);

const again = await call("/api/shifts/shift-1/claim", { method: "POST", token: nurse1 });
check("claim filled shift → 409", again.status === 409 && isErrorBody(again.json));

const posted = await call("/api/shifts", {
  method: "POST",
  token: agencyA,
  body: { role: "RN", date: "2026-10-05", startTime: "07:00", endTime: "19:00" },
});
check(
  "agency POST /api/shifts → 201",
  posted.status === 201 &&
    /^shift-\d+$/.test(String(posted.json.id)) &&
    posted.json.agencyId === "agency-a" &&
    hasShiftShape(posted.json),
  JSON.stringify(posted.json),
);

const nursePost = await call("/api/shifts", {
  method: "POST",
  token: nurse1,
  body: { role: "RN", date: "2026-10-05", startTime: "07:00", endTime: "19:00" },
});
check("nurse POST /api/shifts → 403", nursePost.status === 403);

const cancel = await call("/api/shifts/shift-2/cancel", {
  method: "POST",
  token: agencyA,
  body: { reason: "no-show" },
});
const cancellation = cancel.json.cancellation as Record<string, unknown> | undefined;
check(
  "cancel no-show → 200 reopened + cancellation",
  cancel.status === 200 &&
    cancel.json.status === "open" &&
    cancel.json.claimedBy === null &&
    cancellation?.reason === "no-show" &&
    cancellation?.previousNurseId === "nurse-1",
  JSON.stringify(cancel.json),
);

const own = await call("/api/agencies/agency-b/shifts", { token: agencyB });
const ownShifts = (own.json.shifts ?? []) as Array<Record<string, unknown>>;
check(
  "agency-b own view → shift-3 only",
  own.status === 200 &&
    own.json.agencyId === "agency-b" &&
    ownShifts.length === 1 &&
    ownShifts[0]?.id === "shift-3" &&
    hasShiftShape(ownShifts[0]),
);

const cross = await call("/api/agencies/agency-b/shifts", { token: agencyA });
check("agency-a reading agency-b → 403", cross.status === 403 && isErrorBody(cross.json));

const restore = await call("/api/admin/reset", { method: "POST", token: admin });
check("admin reset → 200 (leave seed state)", restore.status === 200);

console.log(`\n${failures === 0 ? "All checks passed" : `${failures} check(s) failed`}`);
process.exit(failures === 0 ? 0 : 1);
