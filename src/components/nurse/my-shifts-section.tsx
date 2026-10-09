"use client";

import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { Button, Card } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api-client";
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

  async function cancel(id: string) {
    setCancellingId(id);
    try {
      await api<ShiftDto>(`/api/shifts/${encodeURIComponent(id)}/cancel`, {
        body: { reason: "advance" },
      });
      notify("success", "Shift cancelled");
      onChanged();
    } catch (err) {
      notify("error", errorMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <Card title="My shifts">
      <SectionStatus resource={shifts} label="your shifts" />
      {shifts.data !== null && mine.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          You haven&apos;t claimed any upcoming shifts yet.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {mine.map((shift) => (
            <li
              key={shift.id}
              className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <ShiftSummary shift={shift} />
              <Button
                variant="danger"
                data-testid="shift-cancel-button"
                onClick={() => cancel(shift.id)}
                disabled={cancellingId === shift.id}
                aria-label={`Cancel ${shift.role} shift at ${shift.agencyName} on ${shift.date}`}
                className="shrink-0"
              >
                {cancellingId === shift.id ? "Cancelling…" : "Cancel shift"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
