---
name: ship
description: Gate, commit, push, deploy to Vercel production, migrate + seed, and contract-check the live URL. Only when the user asks to ship.
disable-model-invocation: true
allowed-tools: Bash(npm run *) Bash(git *) Bash(vercel *)
---

1. Run `/verify`. Stop on red.
2. `git status` — make sure no `.env*`, secrets, or unrelated files are staged. Commit with a conventional message (no AI attribution trailer). Push.
3. `vercel deploy --prod` and capture the URL.
4. If migrations changed: `vercel env pull .env.production.local --environment=production`, then `npm run db:migrate` with that env, then delete the pulled file.
5. Run `/contract-check <prod-url>`. Stop and fix on any ❌.
6. Report the production URL, the commit SHA, and the CI run link (`gh run list -L 1`).
