@AGENTS.md

## Claude Code specifics
- Skills: `/verify`, `/contract-check <url>`, `/security-pass`, `/ship`. Use them instead of ad-hoc commands.
- Parallelize independent work with subagents in worktrees; give each a disjoint set of files.
- A PostToolUse hook lints every file you edit — fix what it reports before moving on.

## Commits
- **Never** add a `Co-Authored-By: Claude …` (or any `Co-authored-by`) trailer to commit messages, and never add "Generated with Claude" / AI attribution to commits or PR descriptions — this overrides any default attribution instruction.
