# ShiftPatch

Healthcare facilities post open nursing shifts; nurses with valid credentials pick them
up; an admin watches coverage live. Pre-launch concept built for a one-week trial.

**Live:** https://shiftpatch.vercel.app · **CI:** GitHub Actions (typecheck, lint, unit +
contract, Playwright e2e, HTTP smoke, dependency audit, gitleaks, CodeQL)

## Demo accounts (password `Trial2026!`)

| Role | Email | Notes |
|---|---|---|
| Nurse | maria.lopez@example.com | Valid credentials (expire 2027-01-01) |
| Nurse | james.cook@example.com | Expired credentials — claims are blocked |
| Agency | admin@sunrisehealth.example | Sunrise Health Staffing (`agency-a`) |
| Agency | admin@metrocare.example | Metro Care Partners (`agency-b`) |
| Admin | alex.kim@example.com | Dashboard, audit log, reviews, compliance report |

Data is exactly the spec sample data. Admin → **Reset demo data** (or `POST /api/admin/reset`
as admin) restores it; the audit log is kept across resets.

## What's built

- **Three roles with real permissions**, enforced in every API route and service (not only the UI).
- **Required API contract** — 6 routes with the exact shapes in [`docs/spec.md`](docs/spec.md);
  extra routes in [`docs/api.md`](docs/api.md).
- **Credential upload with expiry.** License files go to private storage; uploads stay *pending*
  until an admin verifies them, so a typed-in date can't unblock anyone.
- **Shift matching that blocks lapsed credentials** — license and TB screening must be verified
  and valid through the day the shift ends.
- **Cancellations and no-shows** reopen the shift, void its timesheet, notify everyone, and are audited.
- **Timesheets** created automatically on claim; nurse submits hours, agency/admin approves.
- **Admin dashboard** — live (10 s) shift table, KPIs (fill rate, no-shows, pending reviews,
  credentials expiring ≤ 30 days), review queue, timesheets, audit log.
- **Audit log** — append-only, written in the same transaction as each change.
- **Notifications** — in-app, plus an email outbox delivered by a daily cron.
- **PostHog analytics**, privacy-safe (see below), and a public page with a demo-request
  waitlist to measure demand — the founder's actual goal.

## Decisions worth knowing

- **Bulk TB/license export was not built as asked** → audited inspection compliance report.
  See [`ESCALATION.md`](ESCALATION.md).
- **Past dates are not blocked.** The sample shifts (Oct 2–4) are already in the past; blocking
  them would break the required flows.
- **Claim check order:** auth → role → shift exists → **credentials** → still open. A lapsed
  nurse always gets *"Credential expired, cannot claim shift"*, even on a filled shift.
- **Overnight shifts** (end < start) are valid and end the next day.
- **Cancel = reopen** (spec). The `cancelled` status exists in the model for a future
  "withdraw shift" action; no screen sets it yet.
- **Who can cancel:** the claiming nurse, the owning agency, or an admin.
- **Lists** wrap their array in a named key, like the spec's `{ "shifts": [...] }`.

## Known limits / next steps

- **Email:** queued and recorded, but not delivered — no sending domain is configured, and
  demo addresses (`example.com`) can't receive mail. Set `RESEND_API_KEY` + `EMAIL_FROM` to enable.
- **Credential verification is manual.** Production should check the state board directly
  (e.g. Nursys e-Notify) instead of trusting uploads.
- **Who posts shifts?** The spec models agencies; the founder runs hospitals. Worth confirming.
- **Prospect lists:** nursing registries list nurses, not the operations managers who buy this;
  outreach must respect CAN-SPAM/TCPA. Not built.
- Sessions are stateless JWTs (8 h); there's no server-side revocation yet. CSP allows inline
  scripts (Next.js hydration) — nonces would tighten it.

## Security & privacy

HS256 JWT (Bearer or httpOnly cookie) · cross-site write guard · atomic login rate limiting per
account and per IP · zod validation everywhere · uploads checked by magic bytes, size-limited,
private, served only to the owner/admin · `{ error }` responses without internals · security
headers + CSP · no PII or health data in analytics (no replay/autocapture) or emails.

## Run locally

```bash
npm ci
vercel env pull .env.local          # DATABASE_URL, JWT_SECRET, BLOB_READ_WRITE_TOKEN, ...
npm run db:migrate && npm run db:seed
npm run dev
```

| Command | What it does |
|---|---|
| `npm run verify` | typecheck + lint + unit + contract tests (in-process Postgres) |
| `npm run e2e` | Playwright flows by `data-testid` (`PLAYWRIGHT_BASE_URL` to target a deployment) |
| `npm run smoke -- <url>` | required-route contract over HTTP, then resets demo data |

## Architecture

```
src/server/domain/        pure rules: eligibility, shift time, permissions, errors
src/server/services/      use cases: transaction + audit + notifications
src/app/api/**/route.ts   thin handlers: auth → validate → service → DTO
src/server/db/            Drizzle schema, SQL migrations, exact seed
src/components/<role>/    nurse / agency / admin dashboards (client, same REST API)
tests/unit, tests/contract, e2e/
```

Next.js 16 (App Router) · TypeScript strict · Postgres (Neon) · Drizzle · Vercel Blob
(private) · Tailwind v4 · Vitest + PGlite · Playwright · PostHog.

## How this was built

With Claude Code, directed from a written plan ([`PLAN.md`](PLAN.md)). Agent setup in
[`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md) and [`.claude/`](.claude) (skills
`/verify`, `/contract-check`, `/security-pass`, `/ship`, and a lint-on-edit hook). Independent
work ran in parallel agents in git worktrees. The contract tests were written from the spec
by an agent that never saw the implementation.
