"use client";

import { useState } from "react";
import { useNotify } from "@/components/notification-banner";
import { Button, Card, Field, Input, Select } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api-client";
import { track } from "@/lib/analytics";
import { createShiftSchema, SHIFT_ROLES } from "@/lib/validation";
import { isOvernight, tomorrowLocal } from "./format";
import type { ShiftDto } from "./types";

type ShiftRole = (typeof SHIFT_ROLES)[number];

export const POST_SHIFT_FORM_ID = "agency-post-shift-form";

/** Inline (non-modal) form; submittable immediately with its defaults. */
export function PostShiftForm({ onPosted }: { onPosted: () => void }) {
  const notify = useNotify();
  const [role, setRole] = useState<ShiftRole>("RN");
  const [date, setDate] = useState(() => tomorrowLocal());
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("19:00");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overnight = isOvernight(startTime, endTime);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsed = createShiftSchema.safeParse({ role, date, startTime, endTime });
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Please check the shift details.";
      setError(message);
      notify("error", message);
      return;
    }
    setPending(true);
    try {
      await api<ShiftDto>("/api/shifts", { body: parsed.data });
      notify("success", "Shift posted");
      track("shift_posted");
      onPosted();
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      notify("error", message);
      setPending(false);
    }
  }

  return (
    <div id={POST_SHIFT_FORM_ID} className="animate-rise">
      <Card title="Post a new shift">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Role" htmlFor="post-shift-role">
              <Select
                id="post-shift-role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as ShiftRole)}
              >
                {SHIFT_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date" htmlFor="post-shift-date">
              <Input
                id="post-shift-date"
                name="date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Start time" htmlFor="post-shift-start">
              <Input
                id="post-shift-start"
                name="startTime"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </Field>
            <Field
              label="End time"
              htmlFor="post-shift-end"
              hint={overnight ? "Overnight shift — ends next day" : undefined}
            >
              <Input
                id="post-shift-end"
                name="endTime"
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </Field>
          </div>
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending} data-testid="agency-post-shift-submit-button">
              {pending ? "Posting…" : "Post shift"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
