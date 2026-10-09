@AGENTS.md

## Claude Code specifics
- Skills: `/verify`, `/contract-check <url>`, `/security-pass`, `/ship`. Use them instead of ad-hoc commands.
- Parallelize independent work with subagents in worktrees; give each a disjoint set of files.
- A PostToolUse hook lints every file you edit — fix what it reports before moving on.
