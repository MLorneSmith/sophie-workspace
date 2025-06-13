#!/bin/bash

# Auto-sync wrapper for debug-issue command
# Usage: ./sync-issue.sh <issue_reference>

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ISSUE_REF="$1"

if [ -z "$ISSUE_REF" ]; then
    echo "❌ Usage: $0 <issue_reference>"
    echo "   Examples: $0 30, $0 ISSUE-30, $0 \"#30\""
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required for auto-sync functionality"
    exit 1
fi

# Run the auto-sync script
echo "🔄 Starting auto-sync for issue: $ISSUE_REF"

cd "$SCRIPT_DIR"
node auto-sync.js "$ISSUE_REF"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Auto-sync completed successfully"
else
    echo "❌ Auto-sync failed with exit code: $EXIT_CODE"
fi

exit $EXIT_CODE