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
        className="flex animate-rise flex-col items-center gap-3 rounded-xl border border-success/25 bg-success-soft/60 px-5 py-8 text-center outline-none"
      >
        <span
          aria-hidden="true"
          className="flex size-12 animate-pop items-center justify-center rounded-full bg-success text-white shadow-lift"
        >
          <svg viewBox="0 0 16 16" className="size-6" fill="none">
            <path
              d="M3.5 8.5l3 3 6-7"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={24}
              className="animate-draw"
            />
          </svg>
        </span>
        <p className="font-semibold text-foreground">You&apos;re on the list</p>
        <p className="text-sm font-medium text-success">
          Thanks — we&apos;ll be in touch to schedule a walkthrough.
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
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={state === "sending"}>
        {state === "sending" ? (
          <>
            <Spinner /> Sending…
          </>
        ) : (
          "Request a walkthrough"
        )}
      </Button>
    </form>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:hidden"
    />
  );
}
