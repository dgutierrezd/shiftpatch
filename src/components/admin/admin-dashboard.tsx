"use client";

import { AuditSection } from "./audit-section";
import { ComplianceSection } from "./compliance-section";
import { CredentialsSection } from "./credentials-section";
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
  { id: "audit", label: "Audit log" },
  { id: "compliance", label: "Compliance report" },
];

/** Single stacked admin page (no tabs, so every required test ID is always in the DOM). */
export function AdminDashboard() {
  const { data, updatedAt, refresh } = useAdminData();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <p className="text-xs font-semibold tracking-wide text-brand uppercase">Admin</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Admin dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Shifts, credentials, timesheets and audit across all agencies.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-2 rounded-full border border-success/25 bg-success-soft/60 px-3 py-1 text-xs font-medium text-success">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {updatedAt ? `Live · updated ${formatClock(updatedAt)}` : "Live · connecting…"}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="group inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-muted transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              className="size-3.5 transition-transform duration-500 group-active:rotate-180"
            >
              <path
                d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v2.8h-2.8"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="print:hidden">
        <KpiTiles report={data.report} />
      </div>

      <SectionNav anchors={ANCHORS} />

      <div className="print:hidden">
        <ShiftsSection shifts={data.shifts} onChanged={refresh} />
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
        <AuditSection audit={data.audit} />
      </div>
      <ComplianceSection onGenerated={refresh} />
      <ResetSection onReset={refresh} />
    </div>
  );
}
