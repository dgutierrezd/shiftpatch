import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const DEMO_ACCOUNTS = [
  { role: "Nurse (valid credentials)", email: "maria.lopez@example.com" },
  { role: "Nurse (expired credentials)", email: "james.cook@example.com" },
  { role: "Agency", email: "admin@sunrisehealth.example" },
  { role: "Agency", email: "admin@metrocare.example" },
  { role: "Admin", email: "alex.kim@example.com" },
];

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-brand">
            ShiftPatch
          </Link>
          <p className="mt-2 text-sm text-muted">Sign in to post, pick up, or monitor shifts.</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <LoginForm />
        </div>
        <details className="rounded-xl border border-border bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-medium">Demo accounts</summary>
          <p className="mt-2 text-muted">
            All demo accounts use the password <code className="font-mono">Trial2026!</code>
          </p>
          <ul className="mt-2 space-y-1">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email} className="flex justify-between gap-4">
                <span className="text-muted">{a.role}</span>
                <code className="font-mono text-xs">{a.email}</code>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </main>
  );
}
