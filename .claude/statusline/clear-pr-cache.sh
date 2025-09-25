#!/bin/bash

# Clear PR status cache for better refresh
# Usage: ./clear-pr-cache.sh

GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")

# Clear all PR cache files for this repository
rm -f /tmp/.claude_pr_status_${GIT_ROOT//\//_}*

echo "Cleared PR status cache for $(basename "$GIT_ROOT")"