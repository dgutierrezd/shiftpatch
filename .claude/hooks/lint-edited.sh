#!/usr/bin/env bash
# PostToolUse hook: lint the file Claude just edited and feed problems back (exit 2).
# Runs ESLint from the file's own checkout so edits inside agent worktrees are linted too.
set -euo pipefail
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in
  *.ts|*.tsx|*.mts|*.mjs) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0
root=$(git -C "$(dirname "$file")" rev-parse --show-toplevel 2>/dev/null || echo "$CLAUDE_PROJECT_DIR")
cd "$root"
if ! out=$(npx eslint --max-warnings=0 "$file" 2>&1); then
  echo "$out" >&2
  exit 2
fi
