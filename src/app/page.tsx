import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { TonightsBoard } from "@/components/landing/tonights-board";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { focusRing, linkClass } from "@/components/ui/primitives";

const STEPS = [
  {
    title: "Post the shift",
    body: "Role, date and hours. Overnight shifts that end the next morning are handled for you.",
  },
  {
    title: "A qualified nurse claims it",
    body: "The claim is checked against the nurse’s license and TB screening at that moment. Lapsed credentials stop it, with a clear reason.",
  },
  {
    title: "Coverage stays current",
    body: "Your board shows what is open, what is filled and by whom. A cancellation puts the shift straight back on it.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className={`rounded-[2px] ${focusRing}`}>
            <Logo />
          </Link>
          <nav aria-label="Main" className="flex items-center gap-6 text-[0.875rem]">
            <a
              href="#how"
              className={`hidden text-muted transition-colors hover:text-ink sm:inline ${focusRing} rounded-[2px]`}
            >
              How it works
            </a>
            <Link href="/login" className={`text-ink hover:text-accent ${focusRing} rounded-[2px]`}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 animate-fade-in">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          {/* Hero */}
          <section className="pt-14 pb-16 sm:pt-24 sm:pb-20">
            <h1 className="max-w-[15ch] text-[2.5rem] leading-[1.04] font-normal tracking-[-0.02em] text-ink sm:text-[4rem]">
              Fill last-minute nursing shifts <em className="italic">without the phone tree.</em>
            </h1>
            <p className="mt-6 max-w-[36rem] text-lead text-muted">
              ShiftPatch posts your open shifts to qualified nurses, stops anyone whose
              credentials have lapsed, and keeps one current record of who is covering what.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <a
                href="#walkthrough"
                className={`inline-flex h-10 items-center rounded-md bg-accent px-4 text-[0.9375rem] font-medium text-white transition-colors hover:bg-accent-hover ${focusRing}`}
              >
                Request a walkthrough
              </a>
              <Link href="/login" className={`text-[0.9375rem] ${linkClass}`}>
                Try the demo →
              </Link>
            </div>
          </section>

          <TonightsBoard />

          {/* How it works */}
          <section id="how" className="scroll-mt-8 pt-24">
            <div className="grid gap-4 border-t border-rule pt-6 md:grid-cols-[1fr_2fr] md:gap-12">
              <div>
                <h2 className="text-title text-ink">How it works</h2>
                <p className="mt-2 text-muted">From open shift to covered shift, without a call.</p>
              </div>
              <ol className="grid gap-8 sm:grid-cols-3 sm:gap-8">
                {STEPS.map((step, i) => (
                  <li key={step.title}>
                    <span className="figure block text-title leading-none text-accent">
                      {i + 1}
                    </span>
                    <h3 className="mt-4 font-sans text-lead font-semibold tracking-normal text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-muted">{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Compliance */}
          <section className="pt-20">
            <div className="grid gap-4 border-t border-rule pt-6 md:grid-cols-[1fr_2fr] md:gap-12">
              <div>
                <h2 className="text-title text-ink">Built for compliance</h2>
                <p className="mt-2 text-muted">Coverage you can stand behind in an inspection.</p>
              </div>
              <div className="max-w-[40rem] space-y-4 text-lead text-ink">
                <p>
                  Credential checks happen at the moment of each claim, not at onboarding and
                  never again. Every post, claim, cancellation and approval is written to an audit
                  trail that names who did it and when.
                </p>
                <p className="text-muted">
                  When a surveyor asks, an admin generates an inspection report of license and
                  TB-screening status for each nurse. The report is itself audited, and it is not
                  an export of medical records: no documents or health data leave the system.
                </p>
              </div>
            </div>
          </section>

          {/* Waitlist */}
          <section id="walkthrough" className="scroll-mt-8 pt-20 pb-24">
            <div className="grid gap-8 border-t border-rule pt-6 md:grid-cols-[1fr_2fr] md:gap-12">
              <div>
                <h2 className="text-title text-ink">Request a walkthrough</h2>
                <p className="mt-2 text-muted">
                  We&apos;re speaking with operations managers and staffing directors before
                  launch.
                </p>
              </div>
              <div className="max-w-[32rem] rounded-md border border-rule bg-surface p-6 sm:p-8">
                <WaitlistForm />
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-2 px-5 py-6 text-small text-muted sm:flex-row sm:justify-between sm:px-8">
          <span>ShiftPatch</span>
          <p>A pre-launch concept. Demo data only; no real patient or nurse information.</p>
        </div>
      </footer>
    </div>
  );
}
