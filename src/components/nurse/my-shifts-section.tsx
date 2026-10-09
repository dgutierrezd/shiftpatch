"use client";

import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { Button, EmptyState, freshRowClass, Section } from "@/components/ui/primitives";
import { useFreshIds } from "@/components/ui/use-fresh-ids";
import { api, errorMessage } from "@/lib/api-client";
import { track } from "@/lib/analytics";
import { SectionStatus } from "./section-status";
import { ShiftSummary } from "./shift-summary";
import type { ShiftDto } from "./types";
import type { Resource } from "./use-resource";

/** Shifts this nurse holds. A nurse only cancels ahead of time, so one click = reason "advance". */
export function MyShiftsSection({
  userId,
  shifts,
  onChanged,
}: {
  userId: string;
  shifts: Resource<ShiftDto[]>;
  onChanged: () => void;
}) {
  const notify = useNotify();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const mine = (shifts.data ?? []).filter((s) => s.claimedBy === userId && s.status === "filled");
  const fresh = useFreshIds(shifts.data ? mine.map((s) => s.id) : null);

  async function cancel(id: string) {
    setCancellingId(id);
    try {
      await api<ShiftDto>(`/api/shifts/${encodeURIComponent(id)}/cancel`, {
        body: { reason: "advance" },
      });
      notify("success", "Shift cancelled");
      track("shift_cancelled", { by: "nurse", reason: "advance" });
      onChanged();
    } catch (err) {
      notify("error", errorMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <Section title="My shifts" dek="Shifts you hold. Cancelling ahead of time reopens the shift.">
      <SectionStatus resource={shifts} label="your shifts" />
      {shifts.data !== null && mine.length === 0 ? (
        <EmptyState>You haven&apos;t claimed any upcoming shifts yet.</EmptyState>
      ) : (
        <ul className="border-t border-ink">
          {mine.map((shift) => (
            <li
              key={shift.id}
              className={`flex flex-col gap-3 border-b border-rule py-4 sm:flex-row sm:items-center sm:justify-between ${
                fresh.has(shift.id) ? freshRowClass : ""
              }`}
            >
              <ShiftSummary shift={shift} />
              <Button
                variant="danger"
                data-testid="shift-cancel-button"
                onClick={() => cancel(shift.id)}
                disabled={cancellingId === shift.id}
                aria-label={`Cancel ${shift.role} shift at ${shift.agencyName} on ${shift.date}`}
                className="self-start sm:self-auto"
              >
                {cancellingId === shift.id ? "Cancelling…" : "Cancel shift"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
