"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";
import { api, errorMessage } from "@/lib/api-client";

const ROLES = [
  "Hospital operations manager",
  "Staffing director",
  "Nurse manager",
  "Staffing agency",
  "Other",
];

export function WaitlistForm() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const role = String(form.get("role") ?? "");
    setState("sending");
    setError(null);
    try {
      await api("/api/waitlist", {
        body: {
          email: form.get("email"),
          organization: form.get("organization") || undefined,
          role: role || undefined,
        },
      });
      // Only the self-reported role goes to analytics — never the email or organization.
      track("demo_requested", { role: role || "unspecified" });
      setState("done");
    } catch (err) {
      setError(errorMessage(err));
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p
        className="rounded-md bg-success-soft px-4 py-3 text-sm font-medium text-success"
        role="status"
      >
        Thanks — we&apos;ll be in touch to schedule a walkthrough.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Work email" htmlFor="waitlist-email">
        <Input id="waitlist-email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Organization" htmlFor="waitlist-org">
        <Input id="waitlist-org" name="organization" autoComplete="organization" maxLength={120} />
      </Field>
      <Field label="Your role" htmlFor="waitlist-role">
        <Select id="waitlist-role" name="role" defaultValue="">
          <option value="">Select…</option>
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
      </Field>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Request a walkthrough"}
      </Button>
    </form>
  );
}
