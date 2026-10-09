"use client";

import { useCallback, useMemo, useState } from "react";
import { AppShell, useSessionUser } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/primitives";
import { KpiRow } from "./kpi-row";
import { NotificationsList } from "./notifications-list";
import { POST_SHIFT_FORM_ID, PostShiftForm } from "./post-shift-form";
import { ShiftsTable } from "./shifts-table";
import { TimesheetsTable } from "./timesheets-table";
import type { AgencyShiftsResponse, NotificationDto, TimesheetDto } from "./types";
import { useResource } from "./use-resource";

const SHIFTS_REFRESH_MS = 15_000;

export function AgencyDashboard() {
  return (
    <AppShell role="agency">
      <AgencyDashboardContent />
    </AppShell>
  );
}

function AgencyDashboardContent() {
  const user = useSessionUser();
  const [version, setVersion] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const shiftsPath = `/api/agencies/${encodeURIComponent(user.agencyId ?? "")}/shifts`;
  const shifts = useResource<AgencyShiftsResponse>(shiftsPath, version, SHIFTS_REFRESH_MS);
  const timesheets = useResource<TimesheetDto[]>(
    "/api/timesheets",
    version,
    undefined,
    "timesheets",
  );
  const notifications = useResource<NotificationDto[]>(
    "/api/notifications",
    version,
    undefined,
    "notifications",
  );

  // The shifts API only returns the nurse id; timesheets carry the nurse's name.
  const nurseNames = useMemo(
    () => new Map((timesheets.data ?? []).map((t) => [t.nurseId, t.nurseName] as const)),
    [timesheets.data],
  );

  const onPosted = useCallback(() => {
    setFormOpen(false);
    refresh();
  }, [refresh]);

  if (!user.agencyId) {
    return (
      <p role="alert" className="text-small text-danger">
        Your account isn&apos;t linked to an agency. Contact support.
      </p>
    );
  }

  return (
    <div className="space-y-14">
      <div className="space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-title text-ink sm:text-display">Shifts</h1>
            <p className="mt-2 text-lead text-muted">
              Post open shifts and manage who&apos;s covering them.
            </p>
          </div>
          <Button
            onClick={() => setFormOpen((open) => !open)}
            aria-expanded={formOpen}
            aria-controls={POST_SHIFT_FORM_ID}
            data-testid="agency-post-shift-button"
            className="self-start sm:self-auto"
          >
            Post a shift
          </Button>
        </header>
        <KpiRow shifts={shifts.data?.shifts} />
        {formOpen && <PostShiftForm onPosted={onPosted} />}
      </div>

      <ShiftsTable
        shifts={shifts.data?.shifts}
        loading={shifts.loading}
        error={shifts.error}
        nurseNames={nurseNames}
        onChanged={refresh}
      />

      <TimesheetsTable
        timesheets={timesheets.data}
        loading={timesheets.loading}
        error={timesheets.error}
        onChanged={refresh}
      />

      <NotificationsList
        notifications={notifications.data}
        loading={notifications.loading}
        error={notifications.error}
      />
    </div>
  );
}
