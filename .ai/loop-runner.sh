#!/usr/bin/env bash
set -euo pipefail

# loop-runner.sh
# Bash entrypoint for Sophie's loop runner.
# This is a compatibility wrapper around loop-runner.py.

AI_DIR_DEFAULT="$HOME/clawd/.ai"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=/dev/null
source "$SCRIPT_DIR/lib/loop-helpers.sh" || true

PY="$SCRIPT_DIR/loop-runner.py"

if [[ ! -f "$PY" ]]; then
  die "Missing $PY"
fi

exec python3 "$PY" "$@"
