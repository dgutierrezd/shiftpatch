#!/usr/bin/env bash
# PostToolUse hook: lint the file Claude just edited and feed problems back (exit 2).
set -euo pipefail
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in
  *.ts|*.tsx|*.mts|*.mjs) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0
cd "$CLAUDE_PROJECT_DIR"
if ! out=$(npx eslint --max-warnings=0 "$file" 2>&1); then
  echo "$out" >&2
  exit 2
fi
