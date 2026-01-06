#!/usr/bin/env bash
#
# match-decomposition-pattern.sh
#
# Matches feature keywords against cached decomposition patterns.
# Returns the best matching pattern if success_rate > threshold.
#
# Usage:
#   ./match-decomposition-pattern.sh <feature-file-or-keywords>
#   ./match-decomposition-pattern.sh "crud dashboard user settings"
#   ./match-decomposition-pattern.sh .ai/alpha/specs/1333-Spec-foo/1335-Initiative-bar/1340-Feature-baz/feature.md
#
# Output (JSON):
#   {
#     "matched": true,
#     "pattern_id": "crud-server-action",
#     "pattern_file": ".ai/alpha/cache/decomposition-patterns/crud-server-action.json",
#     "success_rate": 0.85,
#     "matched_keywords": ["crud", "form", "validation"],
#     "confidence": "high"
#   }
#
# Or if no match:
#   {
#     "matched": false,
#     "reason": "No pattern matched with success_rate > 0.7"
#   }

set -euo pipefail

CACHE_DIR=".ai/alpha/cache/decomposition-patterns"
INDEX_FILE="${CACHE_DIR}/index.json"
THRESHOLD=0.7

# Check for required argument
if [[ $# -lt 1 ]]; then
    echo '{"matched": false, "reason": "Usage: $0 <feature-file-or-keywords>"}'
    exit 1
fi

INPUT="$1"

# Extract keywords from input
if [[ -f "$INPUT" ]]; then
    # It's a file - extract keywords from content
    KEYWORDS=$(cat "$INPUT" | tr '[:upper:]' '[:lower:]' | \
        grep -oE '\b[a-z]{3,}\b' | \
        sort | uniq | \
        tr '\n' ' ')
else
    # It's already keywords
    KEYWORDS=$(echo "$INPUT" | tr '[:upper:]' '[:lower:]')
fi

# Check if index exists
if [[ ! -f "$INDEX_FILE" ]]; then
    echo '{"matched": false, "reason": "Pattern index not found at '"$INDEX_FILE"'"}'
    exit 0
fi

# Read the index and find best match
# The index.json structure:
# {
#   "patterns": [
#     {
#       "id": "crud-server-action",
#       "keywords": ["crud", "create", "read", "update", "delete", "form"],
#       "success_rate": 0.85,
#       "use_count": 12
#     }
#   ]
# }

BEST_MATCH=""
BEST_SCORE=0
BEST_RATE=0
MATCHED_KW=""

# Process each pattern
while IFS= read -r pattern; do
    PATTERN_ID=$(echo "$pattern" | jq -r '.id')
    PATTERN_KW=$(echo "$pattern" | jq -r '.keywords[]' | tr '\n' ' ')
    SUCCESS_RATE=$(echo "$pattern" | jq -r '.success_rate')

    # Count matching keywords
    MATCH_COUNT=0
    MATCHED_KEYWORDS=""
    for kw in $PATTERN_KW; do
        if echo "$KEYWORDS" | grep -qw "$kw"; then
            MATCH_COUNT=$((MATCH_COUNT + 1))
            MATCHED_KEYWORDS="$MATCHED_KEYWORDS\"$kw\","
        fi
    done

    # Calculate score (matches * success_rate)
    if [[ $MATCH_COUNT -gt 0 ]]; then
        SCORE=$(echo "$MATCH_COUNT * $SUCCESS_RATE" | bc -l)

        if (( $(echo "$SCORE > $BEST_SCORE" | bc -l) )); then
            BEST_MATCH="$PATTERN_ID"
            BEST_SCORE="$SCORE"
            BEST_RATE="$SUCCESS_RATE"
            MATCHED_KW="${MATCHED_KEYWORDS%,}"  # Remove trailing comma
        fi
    fi
done < <(jq -c '.patterns[]' "$INDEX_FILE" 2>/dev/null || echo "")

# Check if we found a match above threshold
if [[ -n "$BEST_MATCH" ]] && (( $(echo "$BEST_RATE >= $THRESHOLD" | bc -l) )); then
    # Determine confidence level
    if (( $(echo "$BEST_RATE >= 0.9" | bc -l) )); then
        CONFIDENCE="high"
    elif (( $(echo "$BEST_RATE >= 0.8" | bc -l) )); then
        CONFIDENCE="medium"
    else
        CONFIDENCE="low"
    fi

    cat <<EOF
{
  "matched": true,
  "pattern_id": "$BEST_MATCH",
  "pattern_file": "${CACHE_DIR}/${BEST_MATCH}.json",
  "success_rate": $BEST_RATE,
  "matched_keywords": [$MATCHED_KW],
  "confidence": "$CONFIDENCE"
}
EOF
else
    echo '{"matched": false, "reason": "No pattern matched with success_rate > '"$THRESHOLD"'"}'
fi
