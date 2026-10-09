"use client";

import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { Button, EmptyState, Note, Section } from "@/components/ui/primitives";
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
    <Section
      title="Open shifts"
      dek={
        shifts.data === null
          ? "Shifts posted by agencies, checked against your credentials when you claim."
          : `${open.length} available. Each claim is checked against your credentials.`
      }
    >
      {credentialsNeedAttention && (
        <Note tone="warning" role="note" className="mb-5">
          Your credentials need attention. Claims will be declined until an admin verifies an
          up-to-date license and TB screening.
        </Note>
      )}
      <SectionStatus resource={shifts} label="open shifts" />
      {shifts.data !== null && open.length === 0 ? (
        <EmptyState>No open shifts right now. New postings will show up here.</EmptyState>
      ) : (
        <ul className="border-t border-ink">
          {open.map((shift) => (
            <li
              key={shift.id}
              data-testid="shift-list-item"
              className="flex flex-col gap-3 border-b border-rule py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <ShiftSummary shift={shift} />
              <Button
                data-testid="shift-claim-button"
                onClick={() => claim(shift.id)}
                disabled={claimingId === shift.id}
                aria-label={`Claim ${shift.role} shift at ${shift.agencyName} on ${shift.date}`}
                className="self-start sm:self-auto"
              >
                {claimingId === shift.id ? "Claiming…" : "Claim shift"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
