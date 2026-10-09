"use client";

import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { Button, Card, EmptyState, rowEnterClass, staggerStyle } from "@/components/ui/primitives";
import { ApiError, api, errorMessage } from "@/lib/api-client";
import { track } from "@/lib/analytics";
import { SectionStatus } from "./section-status";
import { ShiftSummary } from "./shift-summary";
import type { ShiftDto } from "./types";
import type { Resource } from "./use-resource";

/**
 * Marketplace of open shifts. The claim button is only disabled while its own request is in
 * flight — never for credentials: the server decides and its 403 text shows in the banner.
 */
export function OpenShiftsSection({
  shifts,
  credentialsNeedAttention,
  onChanged,
}: {
  shifts: Resource<ShiftDto[]>;
  credentialsNeedAttention: boolean;
  onChanged: () => void;
}) {
  const notify = useNotify();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const open = (shifts.data ?? []).filter((s) => s.status === "open");

  async function claim(id: string) {
    setClaimingId(id);
    try {
      await api<ShiftDto>(`/api/shifts/${encodeURIComponent(id)}/claim`, { method: "POST" });
      notify("success", "Shift claimed");
      track("shift_claimed");
      onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) track("shift_claim_blocked");
      notify("error", errorMessage(err));
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <Card
      title="Open shifts"
      actions={
        <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-strong tabular-nums">
          {open.length} available
        </span>
      }
    >
      {credentialsNeedAttention && (
        <div
          role="note"
          className="mb-4 flex animate-fade gap-2.5 rounded-md border border-warning/30 bg-warning-soft px-3 py-2.5 text-sm text-warning"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="mt-0.5 size-4 shrink-0"
            fill="currentColor"
          >
            <path d="M10 2.5 1.8 17h16.4L10 2.5Zm-.9 5h1.8v4.8H9.1V7.5Zm.9 8a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z" />
          </svg>
          <span>
            Your credentials need attention — claims will be blocked until an admin verifies an
            up-to-date license and TB screening.
          </span>
        </div>
      )}
      <SectionStatus resource={shifts} label="open shifts" />
      {shifts.data !== null && open.length === 0 ? (
        <EmptyState>No open shifts right now. New postings will show up here.</EmptyState>
      ) : (
        <ul className="divide-y divide-border">
          {open.map((shift, i) => (
            <li
              key={shift.id}
              data-testid="shift-list-item"
              style={staggerStyle(i)}
              className={`-mx-2 flex flex-col gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${rowEnterClass}`}
            >
              <ShiftSummary shift={shift} />
              <Button
                data-testid="shift-claim-button"
                onClick={() => claim(shift.id)}
                disabled={claimingId === shift.id}
                aria-label={`Claim ${shift.role} shift at ${shift.agencyName} on ${shift.date}`}
                className="shrink-0"
              >
                {claimingId === shift.id ? "Claiming…" : "Claim shift"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
