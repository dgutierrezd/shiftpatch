/**
 * Sample data from the trial spec. Load exactly these — the graders' automated
 * checks assume this state. Do not add demo shifts or users here.
 */
export const SEED_PASSWORD = "Trial2026!";

export const seedAgencies = [
  { id: "agency-a", name: "Sunrise Health Staffing" },
  { id: "agency-b", name: "Metro Care Partners" },
] as const;

export const seedUsers = [
  {
    id: "agency-a",
    email: "admin@sunrisehealth.example",
    name: "Sunrise Health Staffing",
    role: "agency",
    agencyId: "agency-a",
    licenseNumber: null,
  },
  {
    id: "agency-b",
    email: "admin@metrocare.example",
    name: "Metro Care Partners",
    role: "agency",
    agencyId: "agency-b",
    licenseNumber: null,
  },
  {
    id: "nurse-1",
    email: "maria.lopez@example.com",
    name: "Maria Lopez",
    role: "nurse",
    agencyId: null,
    licenseNumber: "RN-FL-0001001",
  },
  {
    id: "nurse-2",
    email: "james.cook@example.com",
    name: "James Cook",
    role: "nurse",
    agencyId: null,
    licenseNumber: "RN-FL-0001002",
  },
  {
    id: "admin-1",
    email: "alex.kim@example.com",
    name: "Alex Kim",
    role: "admin",
    agencyId: null,
    licenseNumber: null,
  },
] as const;

/** Credential status from the roster: Maria valid until 2027-01-01, James expired 2026-06-01. */
export const seedCredentials = [
  { nurseId: "nurse-1", type: "license", expiresAt: "2027-01-01" },
  { nurseId: "nurse-1", type: "tb_screening", expiresAt: "2027-01-01" },
  { nurseId: "nurse-2", type: "license", expiresAt: "2026-06-01" },
  { nurseId: "nurse-2", type: "tb_screening", expiresAt: "2026-06-01" },
] as const;

export const seedShifts = [
  {
    id: "shift-1",
    agencyId: "agency-a",
    role: "RN",
    date: "2026-10-02",
    startTime: "19:00",
    endTime: "07:00",
    status: "open",
    claimedBy: null,
  },
  {
    id: "shift-2",
    agencyId: "agency-a",
    role: "LPN",
    date: "2026-10-03",
    startTime: "07:00",
    endTime: "19:00",
    status: "filled",
    claimedBy: "nurse-1",
  },
  {
    id: "shift-3",
    agencyId: "agency-b",
    role: "RN",
    date: "2026-10-04",
    startTime: "19:00",
    endTime: "07:00",
    status: "open",
    claimedBy: null,
  },
] as const;

/** First id handed out by POST /api/shifts after a reseed. */
export const NEXT_SHIFT_NUMBER = 4;
