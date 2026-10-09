<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ShiftPatch — agent rules

Healthcare shift marketplace (agencies post shifts, nurses claim, admin monitors).
Built for a graded trial: automated scripts hit the required API routes and click
through the UI by `data-testid`. **The contract is the floor — never break it.**

## Sources of truth
- `docs/spec.md` — required routes, exact JSON, seed data, test IDs. Read before touching routes/UI.
- `PLAN.md` — decisions, trap list (§2), data model, cut lines. Follow it; update it when a decision changes.
- `ESCALATION.md` — why the bulk TB/license export is replaced by an audited compliance report.

## Commands
- `npm run verify` — typecheck + lint + unit + contract tests. **Nothing is done until this passes.**
- `npm run e2e` — Playwright (needs `DATABASE_URL` + running app or `PLAYWRIGHT_BASE_URL`).
- `npm run smoke -- <base-url>` — contract flow over HTTP against a deployed URL (then resets data).
- `npm run db:migrate` / `npm run db:seed` — forward-only SQL migrations / exact spec seed (idempotent).

## Architecture
- `src/server/domain/` pure rules (eligibility, shift time, permissions, errors). No I/O. Unit-tested.
- `src/server/services/` use cases: transaction + audit + notification. Take `Db` from `getDb()`.
- `src/app/api/**/route.ts` thin: `withRoute(async (req, ctx) => …)` → `requireActor` → zod via `readJson` → service → `toShiftDto`.
- `src/server/db/schema.ts` mirrors `migrations/*.sql`; change both. Contract tests run the SQL on PGlite.
- UI pages are thin server shells; interactive parts are client components calling the same REST routes with the session cookie.

## Contract invariants (each has a test — keep them green)
- Errors are always `{ "error": "<message>" }`. Throw `DomainError` (`src/server/domain/errors.ts`); never return stack traces.
- Shift shape is exactly 9 fields via `toShiftDto`; `claimedBy` is `null` when open. `cancellation` only on cancel.
- Claim check order: 401 → 403 role → 404 → **403 credential** → 409 not open. Never block by date (seed dates are in the past).
- Overnight shifts (`end < start`) are valid. Only `start == end` is rejected.
- `agencyId` on POST comes from the token, never the body.
- Authorization lives in services/handlers, not only `proxy.ts`.
- Seed = exactly the spec data. Never add demo rows to `seed-data.ts`.

## UI / test-ID rules
- Required `data-testid`s (see `docs/spec.md`) render exactly once per page or once per row; never inside hidden tabs.
- Claim button is never disabled for an ineligible nurse — the server's 403 text shows in `notification-banner`.
- No `window.confirm`/`alert`/blocking modals. Badge text is literal lowercase (`open|filled|cancelled`).

## Security & privacy
- No secrets in code, tests, or chat. Env via `vercel env pull`. `.env*` is gitignored.
- No PII/health data in analytics events or email bodies. PostHog identifies by opaque user id only.
- Credential files live in private Vercel Blob and are only served through an authorized route.

## Working style
- Plan first for anything non-trivial; write the failing test before the fix.
- Run `npm run verify` before claiming done; run `/contract-check <url>` after every deploy.
- Commits: conventional (`feat:`, `fix:`, `test:` …), English, no AI attribution trailers.
