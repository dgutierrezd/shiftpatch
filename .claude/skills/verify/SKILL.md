---
name: verify
description: Run the full local quality gate (typecheck, lint, unit + contract tests) and report pass/fail per stage. Use before claiming any task is done, before committing, and after merging parallel work.
allowed-tools: Bash(npm run *) Bash(npx vitest *) Bash(npx tsc *)
---

Run each stage separately so failures are attributable:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test`
4. If `$ARGUMENTS` contains `e2e`, also run `npm run e2e`.

Report a table: stage → pass/fail → first error. If anything fails, diagnose the root
cause and fix it (write/adjust a test first when it's a behavior bug), then re-run the
failed stage AND the full gate. Never mark work done, commit, or deploy on a red gate.
Never "fix" a contract test by changing an expected value from `docs/spec.md`.
