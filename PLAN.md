# ShiftPatch — Execution Plan

Written before any code. Sources: trial brief + `ShiftPatch-Technical-Spec.md`.
Produced by fanning out 4 parallel research agents (architecture, spec-trap audit,
escalation/compliance, AI-direction/deliverables) and reconciling their output.

**Guiding rule:** small that works > big and incomplete. The required contract
(6 routes, seed data, 15 test IDs) is the floor and must be bulletproof before
anything else is built.

---

## 1. Decisions (binding)

| Area | Decision | Why |
|---|---|---|
| App | Next.js 16 App Router, Node runtime, on Vercel | One deploy for UI + API |
| DB | Neon Postgres (Vercel Marketplace) + Drizzle (`postgres` driver) | Serverless instances don't share memory; claims need atomic updates |
| Tests DB | PGlite (in-process Postgres) for unit/contract; Postgres service container for e2e in CI | Fast, no Docker locally |
| Auth | bcryptjs + jose HS256 JWT (8h exp). Login returns token **and** sets `sp_session` httpOnly/Secure/SameSite=Lax cookie. `getActor()` reads Bearer first, then cookie | Satisfies Bearer API contract and browser UI |
| CSRF | Bearer immune; cookie mutations require Origin/Host match | |
| AuthZ | Enforced in services/handlers, never only in `proxy.ts` | CVE-2025-29927 lesson |
| Validation | zod schemas shared by routes + forms | |
| Files | Vercel Blob **private**; served via authorized route; pdf/png/jpeg by magic bytes, ≤4 MB | Credential docs are never public |
| UI | Tailwind v4 + shadcn/ui | |
| Email | `notifications` outbox table is source of truth; Resend adapter sends only if key set and recipient not `.example` | Seed emails are undeliverable |
| Analytics | PostHog, US host, reverse-proxied, identify by opaque id only, `maskAllInputs` + text masking, no replay on credential pages | Health-adjacent data |
| Mutations | REST routes only (no server actions) | One surface to secure and test |

## 2. Spec traps → behavior (must hold, each has a test)

1. **Seed dates are in the past** (today 2026-10-09). Never block claims or posts by date.
2. **Overnight shifts** (`19:00→07:00`): `end < start` = overnight. Reject only `start == end`. Validate `HH:mm`, real `YYYY-MM-DD`.
3. **Claim check order:** 401 token → 403 not a nurse → 404 unknown shift → **403 credential** → 409 not open. Credential check runs before availability so nurse-2 always gets the exact 403.
4. **One serializer** `toShiftDto` with exactly 9 fields; `claimedBy: null` explicit. `cancellation` only on cancel response.
5. **Agency shifts route** returns the full shape (example is abbreviated). Other agency / nurse → 403, admin → 200, unknown agency → 404.
6. **IDs:** `'shift-' || nextval(seq)`, sequence restarted at 4 on seed. Lists sorted by numeric id (`shift-10` after `shift-9`).
7. **POST /api/shifts:** agencyId from token only (ignore body), nurse/admin → 403, 201 on success. Roles RN/LPN/CNA.
8. **Cancel:** claiming nurse, owning agency, or admin. Not filled → 409. Reason ∉ {no-show, advance} → 400. Reopens shift (`open`, `claimedBy: null`); cancellation stored in `cancellations` + audit. `cancelled` status reserved for an agency "withdraw" action.
9. **Credential validity:** valid while `expiresAt >= max(today, shiftEndDate)` (inclusive, facility-local date, America/New_York). Shift end date rolls to +1 for overnight.
10. **Uploads are "pending verification"** until an admin approves them. Self-typed expiry dates don't unblock anyone → protects nurse-2's expected 403 and closes a fraud hole.
11. **Concurrency:** `UPDATE … WHERE status='open' RETURNING`; 0 rows → 409.
12. **Errors:** every response JSON `{error}` incl. malformed JSON (400), unknown route/method (404/405), 500 → "Internal server error" (no stack).
13. **Login:** trim+lowercase email; identical 401 for unknown email/wrong password; dummy bcrypt compare for timing; generous rate limit (don't lock out grader scripts).
14. **Seed exactly** 2 agencies, 2 nurses, 1 admin, 3 shifts. Plus credentials: nurse-1 license 2027-01-01, nurse-2 license 2026-06-01. One timesheet for shift-2.
15. **Deployment:** production URL with Deployment Protection off; verify with curl from outside.

### UI / test-ID rules
- Each single-use test ID rendered exactly once (no mobile/desktop duplicates → Playwright strict mode).
- `shift-list-item` only on **open** shifts, `shift-claim-button` inside each. "My shifts" list holds `shift-cancel-button`.
- Never disable the claim button for nurse-2; the server's 403 message shows in the banner.
- `notification-banner`: one at a time, visible ≥8s or until dismissed. Exact texts: `Shift claimed`, `Shift cancelled`, `Shift posted`, or the API's `error` verbatim.
- Cancel is one click (inline reason select with a default). No `window.confirm`, no blocking modal.
- `agency-post-shift-button` reveals the form; inputs prefilled with valid defaults, labeled, `name` attrs.
- `credential-upload-input` = real `<input type="file">`; `credential-expiry-date-input` = real `<input type="date">`.
- `admin-shift-status-badge` text is literal lowercase (`open|filled|cancelled`), no CSS text-transform.
- `timesheet-table` / `audit-log-table` always render with header + empty-state row.
- Required test IDs never hidden inside inactive tabs.

## 3. Data model

```
agencies(id text pk, name)
users(id text pk, email unique, name, role nurse|agency|admin, password_hash, agency_id fk null)
credentials(id uuid, nurse_id, type license|tb_screening, blob_key null, file_name, mime, size,
            expires_at date, status pending|verified|rejected, verified_by, uploaded_at)
shifts(id text pk, agency_id, role RN|LPN|CNA, date, start_time, end_time,
       status open|filled|cancelled, claimed_by null, created_at)
cancellations(id, shift_id, reason no-show|advance, previous_nurse_id, cancelled_by, created_at)
timesheets(id, shift_id, nurse_id, scheduled_hours, actual_start, actual_end,
           status pending|submitted|approved|void)
audit_log(id bigserial, actor_id, action, entity, entity_id, metadata jsonb, created_at)  -- append-only, same tx as change
notifications(id, user_id, kind, subject, body, email_status queued|sent|skipped, read_at, created_at)
```

TB screening is stored as an attested status + expiry (no medical document) — see ESCALATION.md.

## 4. Layout

```
src/app/(public)/login, (app)/nurse, (app)/agency, (app)/admin/{page,audit,timesheets}
src/app/api/**/route.ts          # thin: parse → service → DTO
src/server/domain/               # pure: eligibility, shift-time, permissions, errors
src/server/services/             # shifts, credentials, timesheets, reporting, compliance-report
src/server/repositories/         # drizzle queries, injected Db
src/server/db/{schema,client,seed-data,seed}.ts
src/server/auth/{jwt,password,actor}.ts
src/server/http/{with-route,dto}.ts
src/lib/validation/
src/components/
tests/unit  tests/contract  e2e/
```

## 5. Verification loop

- `npm run verify` = typecheck + lint + unit + contract. Nothing is "done" until it passes.
- Contract tests (Vitest + PGlite): call route handlers with `new Request()`, deep-equal exact JSON for every row of the auth/status matrix. Re-seed per test.
- Playwright e2e using only `getByTestId`: nurse-1 claims → "Shift claimed"; nurse-2 blocked → exact error; agency posts; agency no-show cancel; credential upload; admin sees table/badges/audit/timesheets; each ID present exactly once.
- `npm run smoke -- <url>`: contract flow over HTTP against the deployed URL, then reset. Run after every deploy.
- Reset: idempotent `npm run db:seed` + admin-only `POST /api/admin/reset` (audited, gated by `ALLOW_DEMO_RESET`). No cron reset (could fire mid-grading).
- Claude Code skills in `.claude/skills/`: `verify`, `contract-check` (curl against URL), `security-pass` (OWASP checklist + `npm audit`), `ship`.
- Hooks: PostToolUse on Edit|Write → lint/typecheck edited file.

## 6. CI (GitHub Actions)

typecheck (tsc strict) · lint (ESLint flat, no `any`) · unit+contract (PGlite) · e2e (Postgres service, `next build && next start`, migrate+seed) · `npm audit --audit-level=high` · gitleaks · CodeQL.

## 7. Timeline (~8h) and cut lines

| Hours | Work | Parallelism |
|---|---|---|
| 0–0.5 | Repo, CLAUDE.md, skills, CI skeleton, Vercel+Neon+Blob, `.env.example`, scope email, ESCALATION.md | — |
| 0.5–1.5 | Schema, migrations, seed, domain functions + unit tests (tests first) | Agent A: domain+tests · Agent B: CI + skills |
| 1.5–3 | Auth, 6 routes, `withRoute`, contract tests → **deploy prod, smoke green** | Agent A: routes · Agent B: contract tests from spec (independently) |
| 3–5 | UI: login, nurse, agency, admin, banner | Worktree agents per role |
| 5–6 | Blob upload + admin verify, timesheets, outbox, audit wiring | |
| 6–7 | Playwright, CI green, security pass (review agent), PostHog | Review agent in parallel |
| 7–8 | Should items, README (decisions + known limits), Loom | |

**Must:** 3 roles w/ real permissions · auth · exact contract + seed · credential upload w/ expiry (admin-verified) · claim blocking · cancel/no-show · audit log · timesheets (auto-created, table) · admin dashboard (table + open/filled/no-show counts) · 15 test IDs · deployed · CI green · ESCALATION.md

**Should:** email outbox + Resend · timesheet submit/approve · reporting (fill rate, cancellations by reason, credentials expiring ≤30d) · PostHog PII-free events · audited compliance report (replaces bulk export) · login rate limit · reset button · overlap check (strict `<`) · admin auto-refresh (10s polling)

**Won't:** WebSockets · MFA/SSO · password reset · payroll · role-to-license matching · registry scraping / prospect tooling · bulk TB/license document export as asked

## 8. Escalation (commit in hour 1)

`ESCALATION.md` — one-click bulk export of license docs + TB results. TB results are worker
medical info (ADA 29 CFR 1630.14 confidentiality; Fla. Stat. 501.171 breach law; HIPAA likely
not applicable to employment records per 45 CFR 160.103, so the product must supply controls).
Recommended: don't store TB documents (attested status only); admin-only, scoped, reasoned,
audited, watermarked compliance report; raw license docs only via short-lived per-file links.

Non-escalation notes for README/Loom: demand validation vs. building the full product;
registries list nurses, not buyers (CAN-SPAM/TCPA); self-reported expiry needs
primary-source verification (Nursys e-Notify); facility vs. agency role question.

## 9. Open questions for recruiter

1. Do automated checks expect fresh seed state? Is a protected reset endpoint acceptable?
2. Is `GET /api/shifts` called with a Bearer token? (Plan: required.)
3. Is `"shift-7"` just an example, or is an id pattern/value checked?
4. Which roles/reasons do scripts use for `/cancel`?
5. Is it acceptable that new credential uploads stay pending until admin approval?
