#!/usr/bin/env bash
# Check for new CodeRabbit plan comments on issues with 'plan-me' label
# Writes notifications to state/notifications.jsonl for Sophie to pick up on heartbeat

set -euo pipefail

REPO="slideheroes/2025slideheroes"
STATE_FILE="/home/ubuntu/clawd/state/coderabbit-plan-seen.json"
NOTIFY_FILE="/home/ubuntu/clawd/state/notifications.jsonl"

# Initialize state file if missing
[ -f "$STATE_FILE" ] || echo '{}' > "$STATE_FILE"

# Get open issues with plan-me label
ISSUES=$(gh issue list --repo "$REPO" --label "plan-me" --state open --json number,title --jq '.[] | "\(.number)\t\(.title)"' 2>/dev/null) || exit 0

[ -z "$ISSUES" ] && exit 0

while IFS=$'\t' read -r ISSUE_NUM ISSUE_TITLE; do
    # Get latest coderabbitai comment timestamp
    LATEST=$(gh issue view "$ISSUE_NUM" --repo "$REPO" --json comments \
        --jq '[.comments[] | select(.author.login == "coderabbitai") | .createdAt] | sort | last // empty' 2>/dev/null) || continue

    [ -z "$LATEST" ] && continue

    # Check if we've already seen this
    SEEN=$(python3 -c "import json; d=json.load(open('$STATE_FILE')); print(d.get('$ISSUE_NUM',''))" 2>/dev/null)

    if [ "$LATEST" != "$SEEN" ]; then
        # New plan comment! Write notification
        echo "{\"type\":\"coderabbit_plan\",\"issue\":$ISSUE_NUM,\"title\":\"$ISSUE_TITLE\",\"timestamp\":\"$LATEST\",\"url\":\"https://github.com/$REPO/issues/$ISSUE_NUM\"}" >> "$NOTIFY_FILE"
        
        # Update seen state
        python3 -c "
import json
d = json.load(open('$STATE_FILE'))
d['$ISSUE_NUM'] = '$LATEST'
json.dump(d, open('$STATE_FILE', 'w'))
"
        echo "[coderabbit-plans] New plan on #$ISSUE_NUM: $ISSUE_TITLE"
    fi
done <<< "$ISSUES"
