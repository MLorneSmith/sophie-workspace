#!/bin/bash
# GitHub Labels Migration Script for SlideHeroes
# Migrates from 93 unorganized labels to 35 structured labels
#
# Usage: ./scripts/migrate-github-labels.sh [--dry-run] [--create-only] [--delete-old]
#
# Options:
#   --dry-run      Show what would be done without making changes
#   --create-only  Only create new labels, don't delete old ones
#   --delete-old   Delete old labels (use after migration is complete)

set -e

REPO="MLorneSmith/2025slideheroes"
DRY_RUN=false
CREATE_ONLY=false
DELETE_OLD=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      ;;
    --create-only)
      CREATE_ONLY=true
      ;;
    --delete-old)
      DELETE_OLD=true
      ;;
  esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

create_label() {
  local name="$1"
  local description="$2"
  local color="$3"

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY-RUN] Would create label: $name ($description) #$color"
  else
    if gh label create "$name" --repo "$REPO" --description "$description" --color "$color" --force 2>/dev/null; then
      log_success "Created/updated: $name"
    else
      log_warning "Label may already exist: $name"
    fi
  fi
}

delete_label() {
  local name="$1"

  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY-RUN] Would delete label: $name"
  else
    if gh label delete "$name" --repo "$REPO" --yes 2>/dev/null; then
      log_success "Deleted: $name"
    else
      log_warning "Label not found or already deleted: $name"
    fi
  fi
}

echo "=========================================="
echo "  GitHub Labels Migration for SlideHeroes"
echo "=========================================="
echo ""

if [ "$DRY_RUN" = true ]; then
  log_warning "DRY RUN MODE - No changes will be made"
  echo ""
fi

# ============================================
# STEP 1: Create new structured labels
# ============================================

if [ "$DELETE_OLD" = false ]; then
  echo "----------------------------------------"
  echo "Step 1: Creating new structured labels"
  echo "----------------------------------------"
  echo ""

  # Type labels (6)
  log_info "Creating TYPE labels..."
  create_label "type:bug" "Something isn't working" "d73a4a"
  create_label "type:feature" "New feature or capability" "a2eeef"
  create_label "type:chore" "Maintenance, refactoring, tooling" "c5def5"
  create_label "type:docs" "Documentation only" "0075ca"
  create_label "type:performance" "Performance improvements" "fbca04"
  create_label "type:security" "Security issues" "d73a4a"
  echo ""

  # Priority labels (4)
  log_info "Creating PRIORITY labels..."
  create_label "priority:critical" "Blocks release/production down" "b60205"
  create_label "priority:high" "Important, schedule ASAP" "d93f0b"
  create_label "priority:medium" "Normal priority" "fbca04"
  create_label "priority:low" "Nice to have" "0e8a16"
  echo ""

  # Status labels (7)
  log_info "Creating STATUS labels..."
  create_label "status:triage" "Needs initial review" "e4e669"
  create_label "status:needs-info" "Awaiting more information" "d876e3"
  create_label "status:planning" "In planning/design phase" "c2e0c6"
  create_label "status:ready" "Ready for implementation" "0e8a16"
  create_label "status:in-progress" "Currently being worked on" "1d76db"
  create_label "status:review" "In code review" "5319e7"
  create_label "status:blocked" "Blocked by external factor" "b60205"
  echo ""

  # Area labels (8)
  log_info "Creating AREA labels..."
  create_label "area:auth" "Authentication/authorization" "0052CC"
  create_label "area:billing" "Payments, subscriptions" "006B75"
  create_label "area:canvas" "Canvas/presentation editor" "1D76DB"
  create_label "area:database" "Schema, queries, migrations" "5319E7"
  create_label "area:cms" "Payload CMS" "FBCA04"
  create_label "area:ui" "UI components, styling" "D4C5F9"
  create_label "area:testing" "Tests, QA" "BFD4F2"
  create_label "area:infra" "CI/CD, Docker, deployment" "28A745"
  echo ""

  # Complexity & Risk labels (4)
  log_info "Creating COMPLEXITY & RISK labels..."
  create_label "complexity:simple" "1-2 hours of work" "c2e0c6"
  create_label "complexity:moderate" "Half day to full day" "fbca04"
  create_label "complexity:complex" "Multiple days of work" "d93f0b"
  create_label "risk:breaking-change" "Contains breaking changes" "b60205"
  echo ""

  # Community/Meta labels (6)
  log_info "Creating COMMUNITY/META labels..."
  create_label "good-first-issue" "Good for newcomers" "7057ff"
  create_label "help-wanted" "Extra attention needed" "008672"
  create_label "duplicate" "This issue already exists" "cfd3d7"
  create_label "wontfix" "Will not be worked on" "ffffff"
  create_label "invalid" "Not a valid issue" "e4e669"
  create_label "question" "Further information requested" "d876e3"
  echo ""

  log_success "New labels created: 35 total"
  echo ""
fi

# ============================================
# STEP 2: Delete old labels (only if --delete-old)
# ============================================

if [ "$DELETE_OLD" = true ]; then
  echo "----------------------------------------"
  echo "Step 2: Deleting old/redundant labels"
  echo "----------------------------------------"
  echo ""

  log_warning "This will delete old labels. Make sure issues have been migrated first!"
  echo ""

  # Old type-related labels
  log_info "Deleting old TYPE labels..."
  delete_label "bug"
  delete_label "enhancement"
  delete_label "feature"
  delete_label "chore"
  delete_label "documentation"
  delete_label "maintenance"
  delete_label "refactoring"
  delete_label "refactor"
  delete_label "performance"
  delete_label "security"
  echo ""

  # Old priority labels
  log_info "Deleting old PRIORITY labels..."
  delete_label "critical"
  delete_label "high"
  delete_label "medium"
  delete_label "low"
  delete_label "high-priority"
  delete_label "medium-priority"
  delete_label "low-priority"
  delete_label "blocking"
  echo ""

  # Old status labels
  log_info "Deleting old STATUS labels..."
  delete_label "needs-investigation"
  delete_label "in-progress"
  delete_label "ready-to-implement"
  delete_label "blocked-external"
  delete_label "completed"
  delete_label "resolved"
  delete_label "implemented"
  delete_label "diagnosed"
  delete_label "collaboration-required"
  delete_label "emergency-resolved"
  echo ""

  # Old domain labels (replaced by area:*)
  log_info "Deleting old DOMAIN labels..."
  delete_label "domain:frontend"
  delete_label "domain:backend"
  delete_label "domain:database"
  delete_label "domain:ai"
  delete_label "domain:devops"
  delete_label "domain:testing"
  echo ""

  # Tool-specific labels (too granular)
  log_info "Deleting TOOL-SPECIFIC labels..."
  delete_label "biome"
  delete_label "eslint"
  delete_label "vitest"
  delete_label "webpack"
  delete_label "snyk"
  delete_label "newrelic"
  delete_label "lint-staged"
  delete_label "tailwind"
  delete_label "react-query"
  delete_label "typescript"
  delete_label "react"
  delete_label "payload"
  delete_label "supabase"
  delete_label "docker"
  delete_label "pre-commit"
  delete_label "css"
  echo ""

  # Deep debug workflow labels
  log_info "Deleting DEEP-DEBUG labels..."
  delete_label "deep-debug-phase-1-complete"
  delete_label "deep-debug-phase-2-complete"
  delete_label "deep-debug-phase-3-complete"
  delete_label "deep-debug-active"
  delete_label "solution-designed"
  delete_label "recent-regression"
  delete_label "payload-cms-trigger"
  echo ""

  # Discovery workflow labels
  log_info "Deleting DISCOVERY labels..."
  delete_label "discovery"
  delete_label "discovery-complete"
  delete_label "discovery-in-progress"
  delete_label "needs-research"
  delete_label "research-complete"
  delete_label "chunk"
  delete_label "story"
  delete_label "from-feature-set"
  echo ""

  # Duplicate/redundant labels
  log_info "Deleting DUPLICATE/REDUNDANT labels..."
  delete_label "ci-cd"
  delete_label "ci/cd"
  delete_label "ci-failure"
  delete_label "tech-debt"
  delete_label "technical-debt"
  delete_label "e2e"
  delete_label "e2e-tests"
  delete_label "testing"
  delete_label "linting"
  delete_label "code-quality"
  delete_label "tooling"
  delete_label "configuration"
  delete_label "dependencies"
  delete_label "dependency-issue"
  delete_label "devops"
  delete_label "integration"
  delete_label "architecture"
  delete_label "database"
  delete_label "ai"
  delete_label "edge-functions"
  delete_label "authentication"
  delete_label "onboarding"
  delete_label "seed-data"
  delete_label "package-exports"
  delete_label "headers"
  echo ""

  # Vague/unused labels
  log_info "Deleting VAGUE/UNUSED labels..."
  delete_label "issue"
  delete_label "task"
  delete_label "automated"
  delete_label "verification"
  delete_label "audit"
  delete_label "logging"
  delete_label "compilation"
  delete_label "regression"
  delete_label "ui-bug"
  delete_label "bug-fix"
  delete_label "accessibility"
  echo ""

  # Risk labels (replaced by risk:breaking-change and complexity:*)
  log_info "Deleting old RISK labels..."
  delete_label "risk-low"
  delete_label "risk-medium"
  delete_label "risk-high"
  delete_label "complexity-simple"
  delete_label "complexity-moderate"
  delete_label "complexity-complex"
  echo ""

  log_success "Old labels deleted"
  echo ""
fi

# ============================================
# Summary
# ============================================

echo "=========================================="
echo "  Migration Summary"
echo "=========================================="
echo ""

if [ "$DELETE_OLD" = false ] && [ "$CREATE_ONLY" = false ]; then
  echo "New labels have been created."
  echo ""
  echo "Next steps:"
  echo "  1. Update slash commands to use new labels (see PR)"
  echo "  2. Migrate existing issues to new labels"
  echo "  3. Run: ./scripts/migrate-github-labels.sh --delete-old"
  echo ""
elif [ "$DELETE_OLD" = true ]; then
  echo "Old labels have been deleted."
  echo "Migration complete!"
  echo ""
fi

if [ "$DRY_RUN" = true ]; then
  echo "This was a DRY RUN. No changes were made."
  echo "Run without --dry-run to apply changes."
fi

echo ""
echo "Label structure (35 total):"
echo "  - type:*        (6 labels)"
echo "  - priority:*    (4 labels)"
echo "  - status:*      (7 labels)"
echo "  - area:*        (8 labels)"
echo "  - complexity:*  (3 labels)"
echo "  - risk:*        (1 label)"
echo "  - community     (6 labels)"
echo ""
