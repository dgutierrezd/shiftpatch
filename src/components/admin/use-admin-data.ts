"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, apiList, errorMessage } from "@/lib/api-client";
import type {
  AdminReport,
  AuditEntry,
  CredentialDto,
  DemoRequestDto,
  Loadable,
  ShiftDto,
  TimesheetDto,
} from "./types";

export const POLL_MS = 10_000;

export interface AdminData {
  report: Loadable<AdminReport>;
  shifts: Loadable<ShiftDto[]>;
  credentials: Loadable<CredentialDto[]>;
  timesheets: Loadable<TimesheetDto[]>;
  audit: Loadable<AuditEntry[]>;
  demoRequests: Loadable<DemoRequestDto[]>;
}

type Key = keyof AdminData;

const SOURCES: Record<Key, () => Promise<unknown>> = {
  report: () => api<AdminReport>("/api/admin/report"),
  shifts: () => apiList<ShiftDto>("/api/shifts", "shifts"),
  credentials: () => apiList<CredentialDto>("/api/credentials?status=pending", "credentials"),
  timesheets: () => apiList<TimesheetDto>("/api/timesheets", "timesheets"),
  audit: () => apiList<AuditEntry>("/api/audit-log?limit=100", "entries"),
  demoRequests: () => apiList<DemoRequestDto>("/api/admin/demo-requests", "requests"),
};

const KEYS = Object.keys(SOURCES) as Key[];

const INITIAL: AdminData = {
  report: { data: null, error: null },
  shifts: { data: null, error: null },
  credentials: { data: null, error: null },
  timesheets: { data: null, error: null },
  audit: { data: null, error: null },
  demoRequests: { data: null, error: null },
};

/**
 * Loads every dashboard resource in parallel and re-polls every 10 s while the tab is
 * visible. Resources fail independently so one broken route never blanks the page; on a
 * failed refresh the last good data stays on screen next to the error.
 */
export function useAdminData() {
  const [data, setData] = useState<AdminData>(INITIAL);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const seq = useRef(0);

  const refresh = useCallback(async () => {
    const mine = ++seq.current;
    const results = await Promise.allSettled(KEYS.map((key) => SOURCES[key]()));
    if (mine !== seq.current) return; // superseded by a newer refresh
    setData((prev) => {
      const next: Record<Key, Loadable<unknown>> = { ...prev };
      KEYS.forEach((key, i) => {
        const result = results[i];
        if (!result) return;
        next[key] =
          result.status === "fulfilled"
            ? { data: result.value, error: null }
            : { data: prev[key].data, error: errorMessage(result.reason) };
      });
      return next as AdminData;
    });
    setUpdatedAt(new Date());
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return { data, updatedAt, refresh };
}
