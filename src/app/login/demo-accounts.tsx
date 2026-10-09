"use client";

import { useState } from "react";

const DEMO_PASSWORD = "Trial2026!";

const DEMO_ACCOUNTS = [
  { role: "Nurse", note: "valid credentials", email: "maria.lopez@example.com" },
  { role: "Nurse", note: "expired credentials", email: "james.cook@example.com" },
  { role: "Agency", note: "Sunrise Health", email: "admin@sunrisehealth.example" },
  { role: "Agency", note: "MetroCare", email: "admin@metrocare.example" },
  { role: "Admin", note: "platform admin", email: "alex.kim@example.com" },
];

/** Fills the (uncontrolled) login inputs; the user still presses "Sign in". */
function fill(email: string) {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  if (emailInput instanceof HTMLInputElement) emailInput.value = email;
  if (passwordInput instanceof HTMLInputElement) passwordInput.value = DEMO_PASSWORD;
  document.querySelector<HTMLButtonElement>('form button[type="submit"]')?.focus();
}

export function DemoAccounts() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <section
      aria-labelledby="demo-accounts-title"
      className="rounded-xl border border-dashed border-border bg-surface/70 p-4 text-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="demo-accounts-title" className="font-semibold">
          Demo accounts
        </h2>
        <p className="text-xs text-muted">
          Password{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">{DEMO_PASSWORD}</code>
        </p>
      </div>
      <ul className="mt-3 space-y-1">
        {DEMO_ACCOUNTS.map((a) => (
          <li key={a.email}>
            <button
              type="button"
              onClick={() => {
                fill(a.email);
                setPicked(a.email);
              }}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
                picked === a.email ? "bg-brand-soft" : "hover:bg-slate-100"
              }`}
            >
              <span className="min-w-0">
                <span className="font-medium">{a.role}</span>
                <span className="text-muted"> · {a.note}</span>
                <code className="block truncate font-mono text-xs text-muted">{a.email}</code>
              </span>
              <span className="shrink-0 text-xs font-semibold text-brand">
                {picked === a.email ? "Filled" : "Use"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
