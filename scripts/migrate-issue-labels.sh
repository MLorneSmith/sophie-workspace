#!/bin/bash
# Migrate existing GitHub issues to new hierarchical label system
#
# Usage: ./scripts/migrate-issue-labels.sh [--dry-run] [--limit N] [--state open|closed|all]
#
# This script:
# 1. Fetches all issues with their current labels
# 2. Maps old labels to new hierarchical labels
# 3. Updates each issue with new labels
# 4. Removes old labels from issues

set -e

REPO="MLorneSmith/2025slideheroes"
DRY_RUN=false
LIMIT=200
STATE="all"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --limit)
      LIMIT="$2"
      shift 2
      ;;
    --state)
      STATE="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_migrate() { echo -e "${CYAN}[MIGRATE]${NC} $1"; }

# Label mapping: old label -> new label
# Format: "old_label:new_label"
declare -A LABEL_MAP=(
  # Type mappings
  ["bug"]="type:bug"
  ["feature"]="type:feature"
  ["enhancement"]="type:feature"
  ["chore"]="type:chore"
  ["documentation"]="type:docs"
  ["maintenance"]="type:chore"
  ["refactoring"]="type:chore"
  ["refactor"]="type:chore"
  ["performance"]="type:performance"
  ["security"]="type:security"
  ["bug-fix"]="type:bug"
  ["tech-debt"]="type:chore"
  ["technical-debt"]="type:chore"

  # Priority mappings
  ["critical"]="priority:critical"
  ["high"]="priority:high"
  ["medium"]="priority:medium"
  ["low"]="priority:low"
  ["high-priority"]="priority:high"
  ["medium-priority"]="priority:medium"
  ["low-priority"]="priority:low"
  ["priority-high"]="priority:high"
  ["priority-p0"]="priority:critical"
  ["P0"]="priority:critical"
  ["blocking"]="priority:critical"

  # Status mappings
  ["needs-investigation"]="status:triage"
  ["in-progress"]="status:in-progress"
  ["ready-to-implement"]="status:ready"
  ["blocked-external"]="status:blocked"
  ["implemented"]="status:review"
  ["diagnosed"]="status:planning"
  ["collaboration-required"]="status:blocked"
  ["needs-review"]="status:review"
  ["investigation"]="status:triage"
  ["needs-research"]="status:triage"
  ["needs-configuration"]="status:blocked"

  # Area mappings
  ["domain:frontend"]="area:ui"
  ["domain:backend"]="area:database"
  ["domain:database"]="area:database"
  ["domain:ai"]="area:infra"
  ["domain:devops"]="area:infra"
  ["domain:testing"]="area:testing"
  ["e2e"]="area:testing"
  ["e2e-tests"]="area:testing"
  ["testing"]="area:testing"
  ["integration-tests"]="area:testing"
  ["test-infrastructure"]="area:testing"
  ["ci-cd"]="area:infra"
  ["ci/cd"]="area:infra"
  ["ci"]="area:infra"
  ["ci-failure"]="area:infra"
  ["ci-alert"]="area:infra"
  ["github-actions"]="area:infra"
  ["docker"]="area:infra"
  ["vercel"]="area:infra"
  ["devops"]="area:infra"
  ["database"]="area:database"
  ["postgresql"]="area:database"
  ["supabase"]="area:database"
  ["rls"]="area:database"
  ["database-permissions"]="area:database"
  ["seeding"]="area:database"
  ["seed-data"]="area:database"
  ["authentication"]="area:auth"
  ["auth"]="area:auth"
  ["billing"]="area:billing"
  ["payload"]="area:cms"
  ["lexical"]="area:cms"
  ["ui"]="area:ui"
  ["ui-bug"]="area:ui"
  ["css"]="area:ui"
  ["tailwind"]="area:ui"
  ["react"]="area:ui"
  ["canvas"]="area:canvas"

  # Complexity mappings (from old risk labels)
  ["risk-low"]="complexity:simple"
  ["risk-medium"]="complexity:moderate"
  ["risk-high"]="complexity:complex"
)

# Labels to remove (don't map, just remove)
LABELS_TO_REMOVE=(
  "issue"
  "task"
  "automated"
  "verification"
  "audit"
  "logging"
  "compilation"
  "regression"
  "completed"
  "resolved"
  "emergency-resolved"
  "deep-debug-phase-1-complete"
  "deep-debug-phase-2-complete"
  "deep-debug-phase-3-complete"
  "deep-debug-active"
  "solution-designed"
  "recent-regression"
  "payload-cms-trigger"
  "discovery"
  "discovery-complete"
  "discovery-in-progress"
  "research-complete"
  "chunk"
  "story"
  "from-feature-set"
  "linting"
  "biome"
  "eslint"
  "vitest"
  "webpack"
  "snyk"
  "newrelic"
  "lint-staged"
  "react-query"
  "typescript"
  "pre-commit"
  "code-quality"
  "tooling"
  "configuration"
  "dependencies"
  "dependency-issue"
  "dependency"
  "dependabot"
  "integration"
  "architecture"
  "ai"
  "edge-functions"
  "package-exports"
  "headers"
  "onboarding"
  "accessibility"
  "account-settings"
  "account-deletion"
  "backend-service"
  "staging"
  "dx"
  "optimization"
  "automation"
  "runson"
  "javascript"
  "reliability"
  "email"
  "turbo"
  "workflow"
  "agents"
  "debugging"
  "stability"
  "statusline"
  "duplicate-detection"
  "prevention"
  "selectors"
  "claude-integration"
  "vscode"
  "partially-resolved"
  "admin"
  "implementation"
  "secret-scan"
  "ci-metrics"
)

echo "=========================================="
echo "  Issue Label Migration for SlideHeroes"
echo "=========================================="
echo ""
echo "Options:"
echo "  State: $STATE"
echo "  Limit: $LIMIT"
echo "  Dry Run: $DRY_RUN"
echo ""

if [ "$DRY_RUN" = true ]; then
  log_warning "DRY RUN MODE - No changes will be made"
  echo ""
fi

# Fetch all issues
log_info "Fetching issues..."
ISSUES=$(gh issue list --repo "$REPO" --state "$STATE" --limit "$LIMIT" --json number,title,labels,state)

ISSUE_COUNT=$(echo "$ISSUES" | jq '. | length')
log_info "Found $ISSUE_COUNT issues to process"
echo ""

# Process each issue
MIGRATED=0
SKIPPED=0
ERRORS=0

echo "$ISSUES" | jq -c '.[]' | while read -r issue; do
  NUMBER=$(echo "$issue" | jq -r '.number')
  TITLE=$(echo "$issue" | jq -r '.title' | cut -c1-60)
  STATE_VAL=$(echo "$issue" | jq -r '.state')
  CURRENT_LABELS=$(echo "$issue" | jq -r '[.labels[].name] | join(",")')

  # Arrays for new labels to add and old labels to remove
  ADD_LABELS=()
  REMOVE_LABELS=()

  # Track what types we've already added to avoid duplicates
  HAS_TYPE=false
  HAS_PRIORITY=false
  HAS_STATUS=false
  HAS_AREA=false
  HAS_COMPLEXITY=false

  # Check if issue already has new-style labels
  if echo "$CURRENT_LABELS" | grep -qE "(type:|priority:|status:|area:|complexity:|risk:)"; then
    # Already migrated partially, still process to complete
    if echo "$CURRENT_LABELS" | grep -q "type:"; then HAS_TYPE=true; fi
    if echo "$CURRENT_LABELS" | grep -q "priority:"; then HAS_PRIORITY=true; fi
    if echo "$CURRENT_LABELS" | grep -q "status:"; then HAS_STATUS=true; fi
    if echo "$CURRENT_LABELS" | grep -q "area:"; then HAS_AREA=true; fi
    if echo "$CURRENT_LABELS" | grep -q "complexity:"; then HAS_COMPLEXITY=true; fi
  fi

  # Process each current label
  IFS=',' read -ra LABEL_ARRAY <<< "$CURRENT_LABELS"
  for label in "${LABEL_ARRAY[@]}"; do
    # Skip if already a new-style label
    if [[ "$label" =~ ^(type:|priority:|status:|area:|complexity:|risk:) ]]; then
      continue
    fi

    # Check if label should be removed without replacement
    SHOULD_REMOVE=false
    for remove_label in "${LABELS_TO_REMOVE[@]}"; do
      if [ "$label" = "$remove_label" ]; then
        SHOULD_REMOVE=true
        REMOVE_LABELS+=("$label")
        break
      fi
    done

    if [ "$SHOULD_REMOVE" = true ]; then
      continue
    fi

    # Check if label has a mapping
    if [ -n "${LABEL_MAP[$label]}" ]; then
      NEW_LABEL="${LABEL_MAP[$label]}"

      # Check category and avoid duplicates
      case "$NEW_LABEL" in
        type:*)
          if [ "$HAS_TYPE" = false ]; then
            ADD_LABELS+=("$NEW_LABEL")
            HAS_TYPE=true
          fi
          ;;
        priority:*)
          if [ "$HAS_PRIORITY" = false ]; then
            ADD_LABELS+=("$NEW_LABEL")
            HAS_PRIORITY=true
          fi
          ;;
        status:*)
          if [ "$HAS_STATUS" = false ]; then
            ADD_LABELS+=("$NEW_LABEL")
            HAS_STATUS=true
          fi
          ;;
        area:*)
          if [ "$HAS_AREA" = false ]; then
            ADD_LABELS+=("$NEW_LABEL")
            HAS_AREA=true
          fi
          ;;
        complexity:*)
          if [ "$HAS_COMPLEXITY" = false ]; then
            ADD_LABELS+=("$NEW_LABEL")
            HAS_COMPLEXITY=true
          fi
          ;;
        *)
          ADD_LABELS+=("$NEW_LABEL")
          ;;
      esac

      REMOVE_LABELS+=("$label")
    fi
  done

  # Skip if nothing to do
  if [ ${#ADD_LABELS[@]} -eq 0 ] && [ ${#REMOVE_LABELS[@]} -eq 0 ]; then
    continue
  fi

  # Build the gh command
  log_migrate "#$NUMBER: $TITLE..."

  if [ ${#ADD_LABELS[@]} -gt 0 ]; then
    echo "  + Adding: ${ADD_LABELS[*]}"
  fi
  if [ ${#REMOVE_LABELS[@]} -gt 0 ]; then
    echo "  - Removing: ${REMOVE_LABELS[*]}"
  fi

  if [ "$DRY_RUN" = false ]; then
    # Add new labels
    for new_label in "${ADD_LABELS[@]}"; do
      gh issue edit "$NUMBER" --repo "$REPO" --add-label "$new_label" 2>/dev/null || true
    done

    # Remove old labels
    for old_label in "${REMOVE_LABELS[@]}"; do
      gh issue edit "$NUMBER" --repo "$REPO" --remove-label "$old_label" 2>/dev/null || true
    done

    log_success "  Migrated #$NUMBER"
  else
    echo "  [DRY-RUN] Would migrate #$NUMBER"
  fi

  echo ""
done

echo "=========================================="
echo "  Migration Complete"
echo "=========================================="
echo ""
echo "Processed $ISSUE_COUNT issues"
if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "This was a DRY RUN. Run without --dry-run to apply changes."
fi
