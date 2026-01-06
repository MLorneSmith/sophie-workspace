#!/bin/bash
#
# list-initiative-features.sh - List all features for an initiative
#
# Usage:
#   ./list-initiative-features.sh <initiative-id>
#   ./list-initiative-features.sh <initiative-id> --json
#   ./list-initiative-features.sh <initiative-id> --paths
#
# Output (default):
#   Feature issue numbers, one per line
#
# Output (--json):
#   JSON array with feature details
#
# Output (--paths):
#   JSON with feature paths resolved

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

INITIATIVE_ID="${1:-}"
OUTPUT_FORMAT="${2:-simple}"

if [[ -z "$INITIATIVE_ID" ]]; then
    echo -e "${RED}[ERROR]${NC} Usage: $0 <initiative-id> [--json|--paths]" >&2
    exit 1
fi

REPO="MLorneSmith/2025slideheroes"

# Fetch features with parent label
FEATURES=$(gh issue list \
    --repo "$REPO" \
    --label "parent:${INITIATIVE_ID}" \
    --label "alpha:feature" \
    --state all \
    --json number,title,state,labels \
    --limit 100 2>/dev/null || echo "[]")

if [[ "$FEATURES" == "[]" ]]; then
    # Try alternative: search in initiative directory
    INIT_DIR=$(find .ai/alpha/specs -type d -name "${INITIATIVE_ID}-*" 2>/dev/null | head -1)

    if [[ -n "$INIT_DIR" ]]; then
        # Find feature directories (numeric prefix)
        FEATURE_DIRS=$(find "$INIT_DIR" -maxdepth 1 -type d -name "[0-9]*-*" 2>/dev/null | sort)

        if [[ -n "$FEATURE_DIRS" ]]; then
            # Build JSON from directories
            FEATURES="["
            FIRST=true
            while IFS= read -r dir; do
                FEAT_ID=$(basename "$dir" | cut -d'-' -f1)
                FEAT_NAME=$(basename "$dir" | cut -d'-' -f2-)

                # Check if feature.md exists
                if [[ -f "$dir/feature.md" ]]; then
                    if [[ "$FIRST" == "true" ]]; then
                        FIRST=false
                    else
                        FEATURES+=","
                    fi
                    FEATURES+="{\"number\":$FEAT_ID,\"title\":\"$FEAT_NAME\",\"state\":\"OPEN\",\"path\":\"$dir\"}"
                fi
            done <<< "$FEATURE_DIRS"
            FEATURES+="]"
        fi
    fi
fi

# Still empty?
if [[ "$FEATURES" == "[]" || "$FEATURES" == "[" ]]; then
    echo -e "${YELLOW}[WARN]${NC} No features found for initiative #${INITIATIVE_ID}" >&2
    echo "[]"
    exit 0
fi

case "$OUTPUT_FORMAT" in
    --json)
        echo "$FEATURES" | jq '.'
        ;;
    --paths)
        # Resolve paths for each feature
        echo "$FEATURES" | jq -c '.[]' | while read -r feature; do
            FEAT_ID=$(echo "$feature" | jq -r '.number')

            # Use resolve-feature-paths.sh if available
            if [[ -x ".ai/alpha/scripts/resolve-feature-paths.sh" ]]; then
                PATHS=$(.ai/alpha/scripts/resolve-feature-paths.sh "$FEAT_ID" 2>/dev/null || echo "{}")
                echo "$feature" | jq --argjson paths "$PATHS" '. + {paths: $paths}'
            else
                echo "$feature"
            fi
        done | jq -s '.'
        ;;
    *)
        # Simple: just issue numbers
        echo "$FEATURES" | jq -r '.[].number'
        ;;
esac
