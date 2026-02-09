#!/bin/bash
# capture-log.sh - Log capture extraction activity
# Usage: capture-log.sh "source_title" "source_url" "practices_count" [nothing_actionable]
#
# Examples:
#   capture-log.sh "How to Build AI Agents" "https://example.com/article" "5"
#   capture-log.sh "Random News Article" "https://news.com/article" "0" "nothing_actionable"

LOG_FILE="$HOME/clawd/data/capture-activity.log"
mkdir -p "$(dirname "$LOG_FILE")"

TITLE="$1"
URL="$2"
PRACTICES="$3"
NOTHING_ACTIONABLE="$4"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE=$(date -u +"%Y-%m-%d")

if [ "$NOTHING_ACTIONABLE" = "nothing_actionable" ]; then
    echo "$TIMESTAMP|$DATE|$TITLE|$URL|0|nothing_actionable" >> "$LOG_FILE"
else
    echo "$TIMESTAMP|$DATE|$TITLE|$URL|$PRACTICES|extracted" >> "$LOG_FILE"
fi

echo "Logged: $TITLE ($PRACTICES practices)"
