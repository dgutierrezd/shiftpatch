"use client";

import { useEffect, useRef, useState } from "react";
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
  const doneRef = useRef<HTMLDivElement>(null);

  // Move focus to the confirmation so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (state === "done") doneRef.current?.focus();
  }, [state]);

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
      // Only an allow-listed role goes to analytics — never the email or organization.
      track("demo_requested", { role: ROLES.includes(role) ? role : "unspecified" });
      setState("done");
    } catch (err) {
      setError(errorMessage(err));
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div
        ref={doneRef}
        tabIndex={-1}
        role="status"
        className="animate-fade-in border-l-[3px] border-l-success py-1 pl-4 outline-none"
      >
        <p className="font-serif text-heading text-ink">You&apos;re on the list.</p>
        <p className="mt-1 text-muted">
          Thank you. We&apos;ll be in touch to schedule a walkthrough.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Work email" htmlFor="waitlist-email">
        <Input
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@hospital.org"
          required
        />
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
        <p className="text-small text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="mt-2 w-full sm:w-auto" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Request a walkthrough"}
      </Button>
    </form>
  );
}
