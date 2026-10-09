import type { Metadata } from "next";
import Link from "next/link";
import { Logo, LogoMark } from "@/components/brand/logo";
import { DemoAccounts } from "./demo-accounts";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const HIGHLIGHTS = [
  "Credential checks at the moment of every claim",
  "Live coverage board for agencies and admins",
  "Audit trail and inspection-ready reports",
];

export default function LoginPage() {
  return (
    <main className="grid flex-1 lg:grid-cols-[1fr_1.1fr]">
      {/* Brand panel (large screens only; purely presentational). */}
      <section
        aria-hidden="true"
        className="relative isolate hidden overflow-hidden bg-brand-strong p-12 text-white lg:flex lg:flex-col lg:justify-between"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(32rem_24rem_at_0%_0%,rgb(45_212_191/0.45),transparent_70%),radial-gradient(28rem_22rem_at_100%_100%,rgb(99_102_241/0.35),transparent_70%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.06)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_75%)] bg-size-[36px_36px]" />
        <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <LogoMark className="size-7 rounded-[9px] ring-1 ring-white/30" />
          ShiftPatch
        </span>
        <div className="max-w-md animate-rise">
          <p className="text-3xl leading-tight font-bold tracking-tight text-balance">
            Every open shift, covered by someone qualified to work it.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-teal-50">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-3">
                <span className="flex size-5 items-center justify-center rounded-full bg-white/15">
                  <svg viewBox="0 0 16 16" className="size-3" fill="none">
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="currentColor"
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-teal-100/80">Demo environment — sample data only.</p>
      </section>

      <div className="flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-sm animate-rise space-y-6">
          <div>
            <Link
              href="/"
              className="inline-block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <Logo />
            </Link>
            <h1 className="mt-6 text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted">Sign in to post, pick up, or monitor shifts.</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 shadow-lift">
            <LoginForm />
          </div>
          <DemoAccounts />
        </div>
      </div>
    </main>
  );
}
