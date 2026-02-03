#!/usr/bin/env bash
#
# resolve-feature-paths.sh
#
# Resolves directory paths for a feature issue number by traversing
# the parent hierarchy (feature → initiative → spec).
#
# Uses two resolution strategies:
#   1. GitHub labels (parent:XXX) - preferred
#   2. Directory structure search - fallback when labels missing
#
# Usage:
#   ./resolve-feature-paths.sh <feature-issue-number>
#   ./resolve-feature-paths.sh 1343
#
# Output (JSON):
#   {
#     "feature_id": 1343,
#     "initiative_id": 1340,
#     "spec_id": 1333,
#     "spec_dir": ".ai/alpha/specs/1333-Spec-user-dashboard-home",
#     "init_dir": ".ai/alpha/specs/1333-Spec-user-dashboard-home/1340-Initiative-core-foundation",
#     "feat_dir": ".ai/alpha/specs/1333-Spec-user-dashboard-home/1340-Initiative-core-foundation/1343-Feature-feature-name",
#     "research_dir": ".ai/alpha/specs/1333-Spec-user-dashboard-home/research-library"
#   }
#
# Exit codes:
#   0 - Success
#   1 - Missing argument
#   2 - Feature issue not found
#   3 - Cannot resolve paths (no labels, no matching directory)

set -euo pipefail

REPO="slideheroes/2025slideheroes"
SPECS_ROOT=".ai/alpha/specs"

# Colors for messages
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit "$2"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}" >&2
}

# Check for required argument
if [[ $# -lt 1 ]]; then
    error "Usage: $0 <feature-issue-number>" 1
fi

FEATURE_ID="$1"

# Initialize variables
INIT_ID=""
SPEC_ID=""
SPEC_DIR=""
INIT_DIR=""
FEAT_DIR=""

#######################################
# Strategy 1: Resolve via GitHub labels
#######################################

resolve_via_labels() {
    # Get feature labels
    FEATURE_LABELS=$(gh issue view "$FEATURE_ID" --repo "$REPO" --json labels --jq '.labels[].name' 2>/dev/null) || {
        warn "Could not fetch labels for feature #$FEATURE_ID"
        return 1
    }

    # Extract initiative ID from parent: label
    INIT_ID=$(echo "$FEATURE_LABELS" | grep "^parent:" | head -1 | cut -d':' -f2)
    if [[ -z "$INIT_ID" ]]; then
        warn "Feature #$FEATURE_ID has no parent: label"
        return 1
    fi

    # Get initiative labels
    INIT_LABELS=$(gh issue view "$INIT_ID" --repo "$REPO" --json labels --jq '.labels[].name' 2>/dev/null) || {
        warn "Could not fetch labels for initiative #$INIT_ID"
        return 1
    }

    # Extract spec ID from initiative's parent label
    SPEC_ID=$(echo "$INIT_LABELS" | grep "^parent:" | head -1 | cut -d':' -f2)
    if [[ -z "$SPEC_ID" ]]; then
        warn "Initiative #$INIT_ID has no parent: label, will try directory search"
        # Continue with partial info - we have INIT_ID
        return 1
    fi

    return 0
}

#######################################
# Strategy 2: Resolve via directory structure
#######################################

resolve_via_directory() {
    # Search for feature directory anywhere in specs
    FEAT_DIR=$(find "$SPECS_ROOT" -type d -name "${FEATURE_ID}-*" 2>/dev/null | head -1)

    if [[ -z "$FEAT_DIR" ]]; then
        return 1
    fi

    # Extract initiative directory (parent of feature)
    INIT_DIR=$(dirname "$FEAT_DIR")

    # Extract initiative ID from directory name (e.g., "1340-core-foundation" -> "1340")
    INIT_DIR_NAME=$(basename "$INIT_DIR")
    INIT_ID=$(echo "$INIT_DIR_NAME" | grep -oE '^[0-9]+' || true)

    # Extract spec directory (parent of initiative)
    SPEC_DIR=$(dirname "$INIT_DIR")

    # Verify spec dir is directly under SPECS_ROOT
    SPEC_DIR_PARENT=$(dirname "$SPEC_DIR")
    if [[ "$SPEC_DIR_PARENT" != "$SPECS_ROOT" ]]; then
        # We might be one level too deep, adjust
        SPEC_DIR="$INIT_DIR"
        INIT_DIR="$FEAT_DIR"
        # This shouldn't happen with proper structure, but handle gracefully
    fi

    # Extract spec ID from directory name
    SPEC_DIR_NAME=$(basename "$SPEC_DIR")
    SPEC_ID=$(echo "$SPEC_DIR_NAME" | grep -oE '^[0-9]+' || true)

    return 0
}

#######################################
# Main resolution logic
#######################################

# Try label-based resolution first
if resolve_via_labels; then
    # Labels worked, now find directories
    SPEC_DIR=$(find "$SPECS_ROOT" -maxdepth 1 -type d -name "${SPEC_ID}-*" 2>/dev/null | head -1)
    if [[ -n "$SPEC_DIR" ]]; then
        INIT_DIR=$(find "$SPEC_DIR" -maxdepth 1 -type d -name "${INIT_ID}-*" 2>/dev/null | head -1)
        if [[ -n "$INIT_DIR" ]]; then
            FEAT_DIR=$(find "$INIT_DIR" -maxdepth 1 -type d -name "${FEATURE_ID}-*" 2>/dev/null | head -1)
        fi
    fi
fi

# If labels didn't fully resolve, try directory search
if [[ -z "$FEAT_DIR" ]]; then
    warn "Label resolution incomplete, searching directory structure..."

    if ! resolve_via_directory; then
        error "Could not find feature #$FEATURE_ID in $SPECS_ROOT" 3
    fi
fi

# Final validation - ensure all paths are set
if [[ -z "$FEAT_DIR" ]]; then
    error "Feature directory not found for #$FEATURE_ID" 3
fi

if [[ -z "$INIT_DIR" ]]; then
    INIT_DIR=$(dirname "$FEAT_DIR")
fi

if [[ -z "$SPEC_DIR" ]]; then
    SPEC_DIR=$(dirname "$INIT_DIR")
fi

# Extract IDs from directory names if not already set
if [[ -z "$INIT_ID" ]]; then
    INIT_ID=$(basename "$INIT_DIR" | grep -oE '^[0-9]+' || echo "0")
fi

if [[ -z "$SPEC_ID" ]]; then
    SPEC_ID=$(basename "$SPEC_DIR" | grep -oE '^[0-9]+' || echo "0")
fi

# Research library is at spec level
RESEARCH_DIR="${SPEC_DIR}/research-library"

# Output JSON
cat <<EOF
{
  "feature_id": $FEATURE_ID,
  "initiative_id": $INIT_ID,
  "spec_id": $SPEC_ID,
  "spec_dir": "$SPEC_DIR",
  "init_dir": "$INIT_DIR",
  "feat_dir": "$FEAT_DIR",
  "research_dir": "$RESEARCH_DIR"
}
EOF
