"use client";

import { AuditSection } from "./audit-section";
import { ComplianceSection } from "./compliance-section";
import { CredentialsSection } from "./credentials-section";
import { formatClock } from "./format";
import { KpiTiles } from "./kpi-tiles";
import { ResetSection } from "./reset-section";
import { ShiftsSection } from "./shifts-section";
import { TimesheetsSection } from "./timesheets-section";
import { useAdminData } from "./use-admin-data";

const ANCHORS = [
  { href: "#shifts", label: "Shifts" },
  { href: "#credentials", label: "Credentials" },
  { href: "#timesheets", label: "Timesheets" },
  { href: "#audit", label: "Audit log" },
  { href: "#compliance", label: "Compliance report" },
];

/** Single stacked admin page (no tabs, so every required test ID is always in the DOM). */
export function AdminDashboard() {
  const { data, updatedAt, refresh } = useAdminData();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Shifts, credentials, timesheets and audit across all agencies.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-2 text-muted">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {updatedAt ? `Live · updated ${formatClock(updatedAt)}` : "Live · connecting…"}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-md px-2 py-1 text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand"
          >
            Refresh
          </button>
        </div>
      </div>

      <nav aria-label="Dashboard sections" className="print:hidden">
        <ul className="flex flex-wrap gap-2 text-sm">
          {ANCHORS.map((a) => (
            <li key={a.href}>
              <a
                href={a.href}
                className="inline-block rounded-full border border-border bg-surface px-3 py-1 text-muted hover:border-brand hover:text-brand-strong"
              >
                {a.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="print:hidden">
        <KpiTiles report={data.report} />
      </div>
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
