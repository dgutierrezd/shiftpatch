import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { agencies, cancellations, credentials, shifts, users } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { badRequest, forbidden } from "@/server/domain/errors";
import {
  REQUIRED_CREDENTIALS,
  checkEligibility,
  type CredentialFact,
  type CredentialKind,
} from "@/server/domain/eligibility";
import type { Actor } from "@/server/domain/permissions";
import { addDays, facilityToday } from "@/server/domain/shift-time";
import type { ComplianceReportInput } from "@/lib/product-validation";
import { recordAudit } from "./audit";

const EXPIRY_WINDOW_DAYS = 30;

function requireAdmin(actor: Actor): void {
  if (actor.role !== "admin") throw forbidden();
}

/** Latest verified expiry per nurse and credential type (what eligibility actually relies on). */
function latestVerified(
  facts: ReadonlyArray<CredentialFact & { nurseId: string }>,
): Map<string, Partial<Record<CredentialKind, string>>> {
  const byNurse = new Map<string, Partial<Record<CredentialKind, string>>>();
  for (const f of facts) {
    if (f.status !== "verified") continue;
    const entry = byNurse.get(f.nurseId) ?? {};
    const current = entry[f.type];
    if (!current || f.expiresAt > current) entry[f.type] = f.expiresAt;
    byNurse.set(f.nurseId, entry);
  }
  return byNurse;
}

async function credentialFacts(db: Db, nurseIds?: string[]) {
  return db
    .select({
      nurseId: credentials.nurseId,
      type: credentials.type,
      status: credentials.status,
      expiresAt: credentials.expiresAt,
    })
    .from(credentials)
    .where(nurseIds ? inArray(credentials.nurseId, nurseIds) : undefined);
}

export interface AdminReport {
  totals: { open: number; filled: number; cancelled: number; total: number };
  fillRate: number;
  cancellationsByReason: { "no-show": number; advance: number };
  credentialsExpiringSoon: Array<{
    nurseId: string;
    nurseName: string;
    type: CredentialKind;
    expiresAt: string;
  }>;
  pendingCredentialReviews: number;
  byAgency: Array<{ agencyId: string; agencyName: string; open: number; filled: number }>;
}

export async function buildAdminReport(
  db: Db,
  actor: Actor,
  today: string = facilityToday(),
): Promise<AdminReport> {
  requireAdmin(actor);

  const statusRows = await db
    .select({ agencyId: shifts.agencyId, status: shifts.status, n: sql<number>`count(*)::int` })
    .from(shifts)
    .groupBy(shifts.agencyId, shifts.status);
  const totals = { open: 0, filled: 0, cancelled: 0, total: 0 };
  for (const r of statusRows) {
    totals[r.status] += Number(r.n);
    totals.total += Number(r.n);
  }
  // Withdrawn (cancelled) shifts aren't demand, so they don't count against the fill rate.
  const fillable = totals.open + totals.filled;
  const fillRate = fillable === 0 ? 0 : Math.round((totals.filled / fillable) * 10000) / 10000;

  const reasonRows = await db
    .select({ reason: cancellations.reason, n: sql<number>`count(*)::int` })
    .from(cancellations)
    .groupBy(cancellations.reason);
  const cancellationsByReason = { "no-show": 0, advance: 0 };
  for (const r of reasonRows) cancellationsByReason[r.reason] = Number(r.n);

  const nurses = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, "nurse"))
    .orderBy(asc(users.id));
  const latest = latestVerified(await credentialFacts(db));
  const horizon = addDays(today, EXPIRY_WINDOW_DAYS);
  const credentialsExpiringSoon: AdminReport["credentialsExpiringSoon"] = [];
  for (const nurse of nurses) {
    const entry = latest.get(nurse.id) ?? {};
    for (const type of REQUIRED_CREDENTIALS) {
      const expiresAt = entry[type];
      if (expiresAt && expiresAt <= horizon) {
        credentialsExpiringSoon.push({ nurseId: nurse.id, nurseName: nurse.name, type, expiresAt });
      }
    }
  }
  credentialsExpiringSoon.sort(
    (a, b) => a.expiresAt.localeCompare(b.expiresAt) || a.nurseId.localeCompare(b.nurseId),
  );

  const [pending] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(credentials)
    .where(eq(credentials.status, "pending"));

  const agencyRows = await db
    .select({ id: agencies.id, name: agencies.name })
    .from(agencies)
    .orderBy(asc(agencies.id));
  const byAgency = agencyRows.map((a) => {
    const count = (status: "open" | "filled") =>
      Number(statusRows.find((r) => r.agencyId === a.id && r.status === status)?.n ?? 0);
    return { agencyId: a.id, agencyName: a.name, open: count("open"), filled: count("filled") };
  });

  return {
    totals,
    fillRate,
    cancellationsByReason,
    credentialsExpiringSoon,
    pendingCredentialReviews: Number(pending?.n ?? 0),
    byAgency,
  };
}

type CredentialState = "valid" | "expired" | "missing";

export interface ComplianceReport {
  generatedAt: string;
  generatedBy: { id: string; name: string };
  reason: string;
  nurses: Array<{
    nurseId: string;
    name: string;
    licenseNumber: string | null;
    licenseExpiresAt: string | null;
    licenseStatus: CredentialState;
    tbScreeningExpiresAt: string | null;
    tbStatus: CredentialState;
    eligibleToday: boolean;
  }>;
}

function stateOf(expiresAt: string | undefined, today: string): CredentialState {
  if (!expiresAt) return "missing";
  return expiresAt >= today ? "valid" : "expired";
}

/**
 * Replaces the requested bulk document export (ESCALATION.md): admin-only, reasoned,
 * audited, scoped to chosen nurses, built from verified records only — no documents.
 */
export async function generateComplianceReport(
  db: Db,
  actor: Actor,
  input: ComplianceReportInput,
  now: Date = new Date(),
): Promise<ComplianceReport> {
  requireAdmin(actor);
  const today = facilityToday(now);
  const requested = input.nurseIds ? [...new Set(input.nurseIds)] : undefined;

  const nurses = await db
    .select({ id: users.id, name: users.name, licenseNumber: users.licenseNumber })
    .from(users)
    .where(
      requested
        ? and(eq(users.role, "nurse"), inArray(users.id, requested.length ? requested : [""]))
        : eq(users.role, "nurse"),
    )
    .orderBy(asc(users.id));
  if (requested) {
    const found = new Set(nurses.map((n) => n.id));
    const unknown = requested.find((id) => !found.has(id));
    if (unknown) throw badRequest(`Unknown nurse id: ${unknown}`);
  }

  const nurseIds = nurses.map((n) => n.id);
  const facts = nurseIds.length ? await credentialFacts(db, nurseIds) : [];
  const latest = latestVerified(facts);
  const todayShift = { date: today, startTime: "00:00", endTime: "23:59" };

  const report: ComplianceReport = {
    generatedAt: now.toISOString(),
    generatedBy: { id: actor.id, name: actor.name },
    reason: input.reason,
    nurses: nurses.map((n) => {
      const entry = latest.get(n.id) ?? {};
      const own = facts.filter((f) => f.nurseId === n.id);
      return {
        nurseId: n.id,
        name: n.name,
        licenseNumber: n.licenseNumber ?? null,
        licenseExpiresAt: entry.license ?? null,
        licenseStatus: stateOf(entry.license, today),
        tbScreeningExpiresAt: entry.tb_screening ?? null,
        tbStatus: stateOf(entry.tb_screening, today),
        eligibleToday: checkEligibility(own, todayShift, today).eligible,
      };
    }),
  };

  await recordAudit(db, actor, "compliance_report.generated", "compliance_report", null, {
    reason: input.reason,
    nurseIds,
  });
  return report;
}
