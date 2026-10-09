"use client";

import { useCallback, useState } from "react";
import { useSessionUser } from "@/components/shell/app-shell";
import { CredentialsSection } from "./credentials-section";
import { facilityToday, hasValidCredentials } from "./format";
import { MyShiftsSection } from "./my-shifts-section";
import { NotificationsSection } from "./notifications-section";
import { OpenShiftsSection } from "./open-shifts-section";
import { TimesheetsSection } from "./timesheets-section";
import type { CredentialDto, NotificationDto, ShiftDto, TimesheetDto } from "./types";
import { useResource } from "./use-resource";

/** List routes wrap their array in a named key (`{ <key>: [...] }`); tolerate a bare array too. */
function listFrom<T>(raw: unknown, key: string): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && key in raw) {
    const value: unknown = (raw as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

const selectShifts = (raw: unknown) => listFrom<ShiftDto>(raw, "shifts");
const selectCredentials = (raw: unknown) => listFrom<CredentialDto>(raw, "credentials");
const selectTimesheets = (raw: unknown) => listFrom<TimesheetDto>(raw, "timesheets");
const selectNotifications = (raw: unknown) => listFrom<NotificationDto>(raw, "notifications");

/**
 * Everything a nurse needs on one stacked page (no tabs, so every required test ID is in
 * the DOM without clicking). Any mutation re-fetches every list.
 */
export function NurseDashboard() {
  const user = useSessionUser();
  const [today] = useState(() => facilityToday());

  const shifts = useResource("/api/shifts", selectShifts);
  const credentials = useResource("/api/credentials", selectCredentials);
  const timesheets = useResource("/api/timesheets", selectTimesheets);
  const notifications = useResource("/api/notifications", selectNotifications);

  const { reload: reloadShifts } = shifts;
  const { reload: reloadCredentials } = credentials;
  const { reload: reloadTimesheets } = timesheets;
  const { reload: reloadNotifications } = notifications;
  const refreshAll = useCallback(() => {
    reloadShifts();
    reloadCredentials();
    reloadTimesheets();
    reloadNotifications();
  }, [reloadShifts, reloadCredentials, reloadTimesheets, reloadNotifications]);

  const credentialsNeedAttention =
    credentials.data !== null && !hasValidCredentials(credentials.data, today);

  return (
    <div>
      <header className="mb-12">
        <h1 className="text-title text-ink sm:text-display">{user.name}</h1>
        <p className="mt-2 max-w-[40rem] text-lead text-muted">
          Pick up open shifts, manage the ones you hold, and keep your credentials current.
        </p>
      </header>
      <div className="grid gap-14 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0 space-y-14">
          <OpenShiftsSection
            shifts={shifts}
            credentialsNeedAttention={credentialsNeedAttention}
            onChanged={refreshAll}
          />
          <MyShiftsSection userId={user.id} shifts={shifts} onChanged={refreshAll} />
          <TimesheetsSection timesheets={timesheets} onChanged={refreshAll} />
        </div>
        <div className="min-w-0 space-y-14">
          <CredentialsSection credentials={credentials} today={today} onChanged={refreshAll} />
          <NotificationsSection notifications={notifications} onChanged={refreshAll} />
        </div>
      </div>
    </div>
  );
}
