---
name: security-pass
description: Security review of ShiftPatch — OWASP Top 10 checklist over the API routes, authZ matrix, headers, dependency audit, secret scan. Use before deploying to production and after adding a route.
allowed-tools: Bash(npm audit *) Bash(git log *) Bash(git grep *) Bash(curl *)
---

Work through each item and report finding → file:line → severity → fix:

1. **AuthZ matrix**: for every `src/app/api/**/route.ts`, confirm `requireActor` with the
   right roles and an ownership check in the service (agency scope, claiming nurse, admin).
   Try the cross-tenant case mentally: agency-a acting on agency-b data, nurse on another nurse.
2. **Injection**: no `sql.raw` with request data; zod on every body/param; file uploads
   checked by magic bytes + size, stored private, served only via authorized route.
3. **Auth**: HS256 only, `exp` set, generic login error, rate limit, cookie httpOnly/Secure/SameSite,
   CSRF origin check on cookie writes.
4. **Data exposure**: responses never include password hashes, blob URLs, or other nurses'
   credentials; errors never include stack traces; analytics/email carry no PII/health data.
5. **Headers**: CSP, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, HSTS in `next.config.ts`.
6. **Dependencies**: `npm audit --omit=dev --audit-level=high` must be clean; list dev-only advisories.
7. **Secrets**: `git log -p | grep -iE "secret|token|password|api[_-]?key"` — only seed password and test fixtures allowed.

Fix confirmed issues with a regression test, then run `/verify`.
