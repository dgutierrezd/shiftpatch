---
name: contract-check
description: Verify the 6 required ShiftPatch API routes against a running or deployed base URL (exact status codes and JSON shapes from docs/spec.md), then reset demo data. Use after every deploy.
argument-hint: "[base-url]"
allowed-tools: Bash(npm run smoke *) Bash(curl *) Bash(jq *)
---

1. Base URL = `$ARGUMENTS` (default `http://localhost:3000`).
2. Run `npm run smoke -- <base-url>`. It logs in as every seed user, exercises all 6
   routes including the negative cases (nurse-2 → 403 exact text, cross-agency → 403,
   malformed JSON → 400 `{error}`), deep-compares shapes, and finally calls the
   admin reset so graders see pristine seed data.
3. If smoke fails, reproduce the single failing request with `curl -sS -i` and show
   status + body. Compare against `docs/spec.md` and fix the code — never the spec.
4. Report: route → expected → actual → ✅/❌.
