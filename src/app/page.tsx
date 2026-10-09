import Link from "next/link";
import { WaitlistForm } from "@/components/landing/waitlist-form";

const STEPS = [
  {
    title: "Post an open shift in seconds",
    body: "Role, date and hours — that's it. Overnight shifts are handled automatically.",
  },
  {
    title: "Only qualified nurses can pick it up",
    body: "A nurse whose license or TB screening has lapsed is stopped before the claim goes through.",
  },
  {
    title: "See coverage as it happens",
    body: "One live board shows which shifts are open, which are filled, and by whom.",
  },
];

const PROOF_POINTS = [
  "No-shows and cancellations reopen the shift immediately",
  "Every action is recorded: who did what, and when",
  "Timesheets created automatically for every filled shift",
  "Inspection-ready compliance report, without exporting medical records",
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-lg font-bold tracking-tight text-brand">ShiftPatch</span>
          <Link
            href="/login"
            className="rounded-md border border-border px-3.5 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
              For hospital operations &amp; staffing teams
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Fill last-minute nursing shifts without the phone tree.
            </h1>
            <p className="max-w-xl text-lg text-muted">
              ShiftPatch posts your open shifts to qualified nurses, blocks anyone with lapsed
              credentials, and keeps a live view of who is covering what.
            </p>
            <ul className="space-y-2 text-sm">
              {PROOF_POINTS.map((point) => (
                <li key={point} className="flex gap-2">
                  <span aria-hidden className="text-brand">
                    ✓
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Is short-notice staffing a headache for you too?
            </h2>
            <p className="mt-1 text-sm text-muted">
              We&apos;re talking to operations managers and staffing directors before launch. Leave
              your details and we&apos;ll show you a walkthrough.
            </p>
            <div className="mt-5">
              <WaitlistForm />
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-surface">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="space-y-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong">
                  {i + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted">
          ShiftPatch is a pre-launch concept. Demo data only — no real patient or nurse information.
        </div>
      </footer>
    </div>
  );
}
