#!/bin/bash
# get-yesterday-captures.sh - Get capture activity from yesterday
# Output: Summary of yesterday's captures for Morning Brief

LOG_FILE="$HOME/clawd/data/capture-activity.log"
YESTERDAY=$(date -u -d 'yesterday' +"%Y-%m-%d")

if [ ! -f "$LOG_FILE" ]; then
    echo "No capture activity logged yet."
    exit 0
fi

# Count articles and practices
ARTICLES=$(grep "|$YESTERDAY|" "$LOG_FILE" 2>/dev/null | wc -l)
PRACTICES=$(grep "|$YESTERDAY|" "$LOG_FILE" 2>/dev/null | awk -F'|' '{sum+=$5} END {print sum+0}')
NOTHING_ACTIONABLE=$(grep "|$YESTERDAY|.*|nothing_actionable$" "$LOG_FILE" 2>/dev/null | wc -l)

if [ "$ARTICLES" -eq 0 ]; then
    echo "No captures processed yesterday."
    exit 0
fi

echo "📚 **Capture Activity (Yesterday)**"
echo "- Processed: $ARTICLES articles"
echo "- Extracted: $PRACTICES best practices"

if [ "$NOTHING_ACTIONABLE" -gt 0 ]; then
    echo "- Nothing actionable: $NOTHING_ACTIONABLE articles"
fi

echo ""
echo "**Sources:**"
grep "|$YESTERDAY|" "$LOG_FILE" 2>/dev/null | while IFS='|' read -r ts date title url count status; do
    if [ "$status" = "nothing_actionable" ]; then
        echo "- $title (reviewed, no practices)"
    else
        echo "- $title ($count practices)"
    fi
done
