"use client";

import { useState } from "react";
import { focusRing } from "@/components/ui/primitives";

const DEMO_PASSWORD = "Trial2026!";

const DEMO_ACCOUNTS = [
  { role: "Nurse", note: "valid credentials", email: "maria.lopez@example.com" },
  { role: "Nurse", note: "expired credentials", email: "james.cook@example.com" },
  { role: "Agency", note: "Sunrise Health", email: "admin@sunrisehealth.example" },
  { role: "Agency", note: "MetroCare", email: "admin@metrocare.example" },
  { role: "Admin", note: "platform", email: "alex.kim@example.com" },
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
    <section aria-labelledby="demo-accounts-title" className="mt-12 border-t border-rule pt-5">
      <h2 id="demo-accounts-title" className="font-sans text-small font-medium tracking-normal">
        Demo accounts
      </h2>
      <p className="mt-1 text-small text-muted">
        Choose an email to fill the form. Password for all:{" "}
        <code className="font-mono text-ink">{DEMO_PASSWORD}</code>
      </p>
      <ul className="mt-4 text-small">
        {DEMO_ACCOUNTS.map((a) => (
          <li
            key={a.email}
            className="grid grid-cols-[6.5rem_1fr] items-baseline gap-x-3 border-b border-rule py-2 last:border-0 sm:grid-cols-[8.5rem_1fr]"
          >
            <span className="text-muted">
              {a.role} <span className="hidden sm:inline">· {a.note}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                fill(a.email);
                setPicked(a.email);
              }}
              aria-label={`Use ${a.role.toLowerCase()} account (${a.note}): ${a.email}`}
              className={`min-w-0 truncate rounded-[2px] text-left font-mono transition-colors ${focusRing} ${
                picked === a.email
                  ? "text-ink underline decoration-ink/40 underline-offset-[3px]"
                  : "text-accent hover:underline hover:underline-offset-[3px]"
              }`}
            >
              {a.email}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
