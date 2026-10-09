"use client";

import { AuditSection } from "./audit-section";
import { ComplianceSection } from "./compliance-section";
import { CredentialsSection } from "./credentials-section";
import { DemoRequestsSection } from "./demo-requests-section";
import { formatClock } from "./format";
import { KpiTiles } from "./kpi-tiles";
import { ResetSection } from "./reset-section";
import { type Anchor, SectionNav } from "./section-nav";
import { ShiftsSection } from "./shifts-section";
import { TimesheetsSection } from "./timesheets-section";
import { useAdminData } from "./use-admin-data";

const ANCHORS: Anchor[] = [
  { id: "shifts", label: "Shifts" },
  { id: "credentials", label: "Credentials" },
  { id: "timesheets", label: "Timesheets" },
  { id: "demo-requests", label: "Demo requests" },
  { id: "audit", label: "Audit log" },
  { id: "compliance", label: "Compliance report" },
];

/** Single stacked admin page (no tabs, so every required test ID is always in the DOM). */
export function AdminDashboard() {
  const { data, updatedAt, refresh } = useAdminData();

  return (
    <div className="space-y-14">
      <div className="space-y-10 print:hidden">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-title text-ink sm:text-display">Operations</h1>
            <p className="mt-2 text-lead text-muted">
              Shifts, credentials, timesheets and audit across all agencies.
            </p>
          </div>
          <p className="flex items-baseline gap-4 text-small text-muted sm:pb-1.5">
            <span>
              {updatedAt ? (
                <>
                  Updated <span className="font-mono">{formatClock(updatedAt)}</span>
                </>
              ) : (
                "Connecting…"
              )}
            </span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-[2px] text-accent underline-offset-[3px] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Refresh
            </button>
          </p>
        </header>
        <KpiTiles report={data.report} />
      </div>

      {/* The contents line's rule doubles as the top rule of the first section. */}
      <div className="space-y-0">
        <SectionNav anchors={ANCHORS} />
        <div className="print:hidden [&>section]:border-t-0">
          <ShiftsSection shifts={data.shifts} onChanged={refresh} />
        </div>
      </div>
      <div className="print:hidden">
        <CredentialsSection
          credentials={data.credentials}
          expiringSoon={
            data.report.data?.credentialsExpiringSoon ?? (data.report.error ? [] : null)
          }
          onChanged={refresh}
        />
      </div>
      <div className="print:hidden">
        <TimesheetsSection timesheets={data.timesheets} onChanged={refresh} />
      </div>
      <div className="print:hidden">
        <DemoRequestsSection requests={data.demoRequests} />
      </div>
      <div className="print:hidden">
        <AuditSection audit={data.audit} />
      </div>
      <ComplianceSection onGenerated={refresh} />
      <ResetSection onReset={refresh} />
    </div>
  );
}
