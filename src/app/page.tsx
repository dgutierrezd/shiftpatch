import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { BoardPreview } from "@/components/landing/board-preview";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { staggerStyle } from "@/components/ui/primitives";

const STEPS: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Post an open shift in seconds",
    body: "Role, date and hours — that's it. Overnight shifts are handled automatically.",
    icon: <path d="M12 5v14M5 12h14" strokeWidth={2} strokeLinecap="round" stroke="currentColor" />,
  },
  {
    title: "Only qualified nurses can pick it up",
    body: "A nurse whose license or TB screening has lapsed is stopped before the claim goes through.",
    icon: (
      <path
        d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
        fill="none"
      />
    ),
  },
  {
    title: "See coverage as it happens",
    body: "One live board shows which shifts are open, which are filled, and by whom.",
    icon: (
      <path
        d="M4 19V9m5 10V5m5 14v-7m5 7V8"
        strokeWidth={2}
        strokeLinecap="round"
        stroke="currentColor"
      />
    ),
  },
];

const PROOF_POINTS = [
  {
    title: "Cancellations reopen instantly",
    body: "No-shows and cancellations put the shift straight back on the board.",
  },
  {
    title: "A full audit trail",
    body: "Every action is recorded: who did what, and when.",
  },
  {
    title: "Timesheets on autopilot",
    body: "A timesheet is created for every filled shift, ready for approval.",
  },
  {
    title: "Inspection-ready reports",
    body: "Credential status for surveyors — without exporting medical records.",
  },
];

function CheckDot() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong"
    >
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
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/65">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <nav aria-label="Main" className="flex items-center gap-1 text-sm sm:gap-2">
            <a
              href="#how"
              className="hidden rounded-md px-3 py-2 text-muted transition-colors hover:text-foreground sm:inline-block"
            >
              How it works
            </a>
            <Link
              href="/login"
              className="rounded-md border border-border bg-surface px-3.5 py-2 font-medium shadow-xs transition-[background-color,transform] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.97]"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_28rem_at_10%_-10%,rgb(20_184_166/0.18),transparent_70%),radial-gradient(36rem_26rem_at_95%_10%,rgb(99_102_241/0.12),transparent_70%),radial-gradient(30rem_22rem_at_60%_110%,rgb(16_185_129/0.12),transparent_70%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(15_23_42/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(15_23_42/0.05)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)] bg-size-[40px_40px]"
          />
          <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-16 md:grid-cols-[1.1fr_1fr] md:items-center md:pt-20 md:pb-24">
            <div className="space-y-6">
              <p
                style={staggerStyle(0)}
                className="inline-flex animate-rise stagger items-center gap-2 rounded-full border border-brand/20 bg-surface/80 px-3 py-1 text-xs font-semibold text-brand-strong shadow-xs"
              >
                <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
                For hospital operations &amp; staffing teams
              </p>
              <h1
                style={staggerStyle(1)}
                className="animate-rise stagger text-4xl leading-[1.1] font-bold tracking-tight text-balance md:text-5xl lg:text-[3.5rem]"
              >
                Fill last-minute nursing shifts{" "}
                <span className="bg-linear-to-r from-brand to-teal-600 bg-clip-text text-transparent">
                  without the phone tree.
                </span>
              </h1>
              <p
                style={staggerStyle(2)}
                className="max-w-xl animate-rise stagger text-lg text-pretty text-muted"
              >
                ShiftPatch posts your open shifts to qualified nurses, blocks anyone with lapsed
                credentials, and keeps a live view of who is covering what.
              </p>
              <div
                style={staggerStyle(3)}
                className="flex animate-rise stagger flex-wrap items-center gap-3"
              >
                <a
                  href="#walkthrough"
                  className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-brand-strong hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.97]"
                >
                  Request a walkthrough
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none">
                    <path
                      d="M3 8h10m-4-4 4 4-4 4"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <Link
                  href="/login"
                  className="rounded-md px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-slate-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Try the demo
                </Link>
              </div>
            </div>
            <div style={staggerStyle(3)} className="animate-rise stagger">
              <BoardPreview />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-16 border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-brand">How it works</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                From open shift to covered shift, without a single phone call.
              </h2>
            </div>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="group relative rounded-xl border border-border bg-background/60 p-6 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-brand/30 hover:bg-surface hover:shadow-lift"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand-strong transition-transform duration-200 group-hover:scale-105">
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
                        {step.icon}
                      </svg>
                    </span>
                    <span className="font-mono text-xs text-muted">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-5 font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Trust + waitlist */}
        <section id="walkthrough" className="scroll-mt-16">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[1fr_1fr] md:items-start md:py-20">
            <div>
              <p className="text-sm font-semibold text-brand">Built for compliance</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                Coverage you can defend in an inspection.
              </h2>
              <p className="mt-3 text-muted">
                Credential checks happen at the moment of the claim, and every step leaves a trail
                your compliance team can read.
              </p>
              <ul className="mt-8 grid gap-5 sm:grid-cols-2">
                {PROOF_POINTS.map((point) => (
                  <li key={point.title} className="flex gap-3">
                    <CheckDot />
                    <div>
                      <p className="text-sm font-semibold">{point.title}</p>
                      <p className="mt-0.5 text-sm text-muted">{point.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-3 -z-10 rounded-3xl bg-linear-to-br from-brand/15 via-teal-200/20 to-indigo-200/25 blur-2xl"
              />
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-lift sm:p-8">
                <h2 className="text-lg font-semibold tracking-tight">
                  Is short-notice staffing a headache for you too?
                </h2>
                <p className="mt-1 text-sm text-muted">
                  We&apos;re talking to operations managers and staffing directors before launch.
                  Leave your details and we&apos;ll show you a walkthrough.
                </p>
                <div className="mt-6">
                  <WaitlistForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <Logo className="scale-90 origin-left" />
          <p>
            ShiftPatch is a pre-launch concept. Demo data only — no real patient or nurse
            information.
          </p>
        </div>
      </footer>
    </div>
  );
}
