#!/bin/zsh
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
PROMPT_PATH="$PROJECT_ROOT/claude-stage13-admin-review-sensitive-and-credential-images-prompt.md"

cd "$PROJECT_ROOT"

if [ ! -f "$PROMPT_PATH" ]; then
  echo "Missing prompt file: $PROMPT_PATH"
  echo "Press any key to close this window."
  read -k 1
  exit 1
fi

export PATH="$HOME/.local/lib/npm-global/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

if ! command -v claude >/dev/null 2>&1; then
  echo "Claude Code CLI was not found."
  echo "Install or sign in to Claude Code first, then run this script again."
  echo "Press any key to close this window."
  read -k 1
  exit 1
fi

echo ""
echo "Starting Claude Code for Stage 13 admin review fixes in:"
echo "$PROJECT_ROOT"
echo ""
echo "File edits will be accepted automatically."
echo "Allowed safe work: edit project source, create verifier/report, run local verifier/build/type-check."
echo "Reject .env reads, npx prisma, git reset/checkout, file deletion, commits, and out-of-scope modules."
echo ""

claude --effort high --permission-mode acceptEdits "$(cat "$PROMPT_PATH")"

echo ""
echo "Claude Stage 13 task finished or was interrupted."
echo "Press any key to close this window."
read -k 1
