#!/usr/bin/env bash
#
# create-feature-tasks-issue.sh
#
# Creates a single GitHub issue for a Feature that lists all tasks
# as checkboxes, grouped by parallel execution group.
#
# This replaces the previous approach of creating individual issues
# per task, reducing issue clutter and keeping tasks consolidated.
#
# Usage:
#   ./create-feature-tasks-issue.sh <tasks.json>
#   ./create-feature-tasks-issue.sh .ai/alpha/specs/1333-Spec-foo/1335-Initiative-bar/1340-Feature-baz/tasks.json
#
# Options:
#   --dry-run    Show what would be created without actually creating the issue
#   --update     Update existing feature issue instead of creating new one
#
# Output:
#   Updates tasks.json in place with:
#   - github.feature_tasks_issue = <issue-number>
#   - github.issues_created = true
#
# Exit codes:
#   0 - Success
#   1 - Missing argument
#   2 - File not found
#   3 - Invalid JSON
#   4 - GitHub CLI error

set -euo pipefail

REPO="MLorneSmith/2025slideheroes"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

DRY_RUN=false
UPDATE_MODE=false

# Parse arguments
TASKS_FILE=""
for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            ;;
        --update)
            UPDATE_MODE=true
            ;;
        *)
            TASKS_FILE="$arg"
            ;;
    esac
done

if [[ -z "$TASKS_FILE" ]]; then
    log_error "Usage: $0 [--dry-run] [--update] <tasks.json>"
    exit 1
fi

if [[ ! -f "$TASKS_FILE" ]]; then
    log_error "File not found: $TASKS_FILE"
    exit 2
fi

# Validate JSON
if ! jq empty "$TASKS_FILE" 2>/dev/null; then
    log_error "Invalid JSON: $TASKS_FILE"
    exit 3
fi

# Check if issue already created
ALREADY_CREATED=$(jq -r '.github.issues_created // false' "$TASKS_FILE")
if [[ "$ALREADY_CREATED" == "true" && "$UPDATE_MODE" == "false" ]]; then
    log_warn "Issue already created for this tasks.json"
    log_warn "Use --update to update the existing issue"
    exit 0
fi

# Extract metadata
FEATURE_ID=$(jq -r '.metadata.feature_id' "$TASKS_FILE")
FEATURE_NAME=$(jq -r '.metadata.feature_name // "Feature"' "$TASKS_FILE")
COMPLEXITY_SCORE=$(jq -r '.metadata.complexity.score // "N/A"' "$TASKS_FILE")
COMPLEXITY_LEVEL=$(jq -r '.metadata.complexity.granularity // "N/A"' "$TASKS_FILE")
PATTERN_MATCHED=$(jq -r '.metadata.pattern_matched // "none"' "$TASKS_FILE")

if [[ -z "$FEATURE_ID" || "$FEATURE_ID" == "null" ]]; then
    log_error "No feature_id in metadata"
    exit 3
fi

# Get parent initiative ID from feature_id path or metadata
PARENT_INIT=$(jq -r '.metadata.parent_initiative // ""' "$TASKS_FILE")

# Ensure required labels exist
ensure_labels() {
    local labels=("type:feature-tasks" "alpha:tasks" "status:ready" "parent:$FEATURE_ID")

    if [[ -n "$PARENT_INIT" ]]; then
        labels+=("initiative:$PARENT_INIT")
    fi

    for label in "${labels[@]}"; do
        if ! gh label list --repo "$REPO" --limit 200 | grep -q "^$label"; then
            log_info "Creating label: $label"
            if [[ "$DRY_RUN" == "false" ]]; then
                case "$label" in
                    type:feature-tasks) COLOR="0075ca" ;;
                    alpha:*) COLOR="6f42c1" ;;
                    status:*) COLOR="0e8a16" ;;
                    parent:*) COLOR="bfdadc" ;;
                    initiative:*) COLOR="d4c5f9" ;;
                    *) COLOR="ededed" ;;
                esac
                gh label create "$label" --repo "$REPO" --color "$COLOR" 2>/dev/null || true
            fi
        fi
    done
}

# Generate task checkbox line
generate_task_line() {
    local task_json="$1"

    local id=$(echo "$task_json" | jq -r '.id')
    local name=$(echo "$task_json" | jq -r '.name')
    local hours=$(echo "$task_json" | jq -r '.estimated_hours')
    local task_type=$(echo "$task_json" | jq -r '.type')
    local criterion=$(echo "$task_json" | jq -r '.acceptance_criterion' | head -1)
    local blocked_by=$(echo "$task_json" | jq -r '.dependencies.blocked_by // [] | join(", ")')

    # Truncate criterion if too long
    if [[ ${#criterion} -gt 80 ]]; then
        criterion="${criterion:0:77}..."
    fi

    # Format based on type
    if [[ "$task_type" == "spike" ]]; then
        echo "- [ ] **🔬 $id**: $name (${hours}h spike)"
    else
        local deps_info=""
        if [[ -n "$blocked_by" && "$blocked_by" != "" ]]; then
            deps_info=" ← $blocked_by"
        fi
        echo "- [ ] **$id**: $name (${hours}h)$deps_info"
    fi
}

# Generate full issue body
generate_issue_body() {
    local tasks_file="$1"

    # Get counts
    local total_tasks=$(jq '.tasks | length' "$tasks_file")
    local spike_count=$(jq '[.tasks[] | select(.type == "spike")] | length' "$tasks_file")
    local task_count=$((total_tasks - spike_count))

    # Get execution info
    local sequential_hours=$(jq -r '.execution.duration.sequential_hours // "N/A"' "$tasks_file")
    local parallel_hours=$(jq -r '.execution.duration.parallel_hours // "N/A"' "$tasks_file")
    local time_saved=$(jq -r '.execution.duration.time_saved_percent // "N/A"' "$tasks_file")
    local critical_path=$(jq -r '.execution.critical_path | join(" → ")' "$tasks_file" 2>/dev/null || echo "N/A")

    # Get validation info
    local discriminator_verdict=$(jq -r '.validation.discriminator_verdict // "N/A"' "$tasks_file")
    local completeness=$(jq -r '.validation.scores.completeness // "N/A"' "$tasks_file")
    local atomicity=$(jq -r '.validation.scores.atomicity // "N/A"' "$tasks_file")

    # Get group count
    local max_group=$(jq '[.tasks[].group] | max // 0' "$tasks_file")

    cat <<EOF
# Feature Tasks: $FEATURE_NAME

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | $total_tasks |
| **Spikes** | $spike_count |
| **Implementation Tasks** | $task_count |
| **Complexity** | $COMPLEXITY_SCORE/100 ($COMPLEXITY_LEVEL) |
| **Pattern** | $PATTERN_MATCHED |

## Tasks by Execution Group

EOF

    # Generate tasks grouped by execution group
    for group in $(seq 0 "$max_group"); do
        local group_tasks=$(jq "[.tasks[] | select(.group == $group)]" "$tasks_file")
        local group_count=$(echo "$group_tasks" | jq 'length')

        if [[ "$group_count" -gt 0 ]]; then
            if [[ "$group" -eq 0 ]]; then
                echo "### Group 0: Spikes (Run First)"
                echo ""
                echo "> ⚠️ These spike tasks must complete before implementation tasks begin."
                echo ""
            else
                echo "### Group $group: Implementation"
                echo ""
            fi

            # List each task in this group
            for i in $(seq 0 $((group_count - 1))); do
                local task=$(echo "$group_tasks" | jq ".[$i]")
                generate_task_line "$task"
            done
            echo ""
        fi
    done

    cat <<EOF

## Execution Summary

| Metric | Value |
|--------|-------|
| **Sequential Duration** | ${sequential_hours}h |
| **Parallel Duration** | ${parallel_hours}h |
| **Time Saved** | ${time_saved}% |
| **Critical Path** | $critical_path |

## Validation Status

| Check | Result |
|-------|--------|
| **Discriminator Verdict** | $discriminator_verdict |
| **Completeness** | $completeness |
| **Atomicity** | $atomicity |
| **Cycle Detection** | ✅ Pass |

## Task Details

<details>
<summary>Click to expand full task details</summary>

EOF

    # Add detailed task information
    local task_count=$(jq '.tasks | length' "$tasks_file")
    for i in $(seq 0 $((task_count - 1))); do
        local task=$(jq ".tasks[$i]" "$tasks_file")
        local id=$(echo "$task" | jq -r '.id')
        local name=$(echo "$task" | jq -r '.name')
        local verb=$(echo "$task" | jq -r '.action.verb')
        local target=$(echo "$task" | jq -r '.action.target')
        local purpose=$(echo "$task" | jq -r '.purpose // "N/A"')
        local criterion=$(echo "$task" | jq -r '.acceptance_criterion')
        local hours=$(echo "$task" | jq -r '.estimated_hours')
        local files=$(echo "$task" | jq -r '.context.files // [] | join(", ")')
        local blocked_by=$(echo "$task" | jq -r '.dependencies.blocked_by // [] | join(", ")')
        local blocks=$(echo "$task" | jq -r '.dependencies.blocks // [] | join(", ")')

        cat <<TASK_EOF

### $id: $name

- **Action**: $verb $target
- **Purpose**: $purpose
- **Hours**: $hours
- **Files**: ${files:-None}
- **Blocked By**: ${blocked_by:-None}
- **Blocks**: ${blocks:-None}

**Acceptance Criterion**: $criterion

---

TASK_EOF
    done

    cat <<EOF

</details>

## Next Steps

1. Complete all Group 0 spikes (if any) first
2. Work through implementation tasks by group
3. Check off tasks as completed
4. Run validation commands after each task

---
*Generated from: \`$TASKS_FILE\`*
*Source of truth: tasks.json in feature directory*
EOF
}

# Main logic
log_step "Ensuring required labels exist..."
ensure_labels

# Generate issue content
log_step "Generating issue body..."
TITLE="Tasks: $FEATURE_NAME [#$FEATURE_ID]"
BODY=$(generate_issue_body "$TASKS_FILE")

# Build labels
LABELS="type:feature-tasks,alpha:tasks,status:ready,parent:$FEATURE_ID"
if [[ -n "$PARENT_INIT" ]]; then
    LABELS="$LABELS,initiative:$PARENT_INIT"
fi

if [[ "$DRY_RUN" == "true" ]]; then
    log_info "[DRY-RUN] Would create issue:"
    echo "  Title: $TITLE"
    echo "  Labels: $LABELS"
    echo ""
    echo "=== Issue Body Preview ==="
    echo "$BODY" | head -100
    echo "..."
    echo "=== ($(echo "$BODY" | wc -l) total lines) ==="
    exit 0
fi

# Create or update issue
if [[ "$UPDATE_MODE" == "true" ]]; then
    EXISTING_ISSUE=$(jq -r '.github.feature_tasks_issue // ""' "$TASKS_FILE")
    if [[ -n "$EXISTING_ISSUE" && "$EXISTING_ISSUE" != "null" ]]; then
        log_step "Updating existing issue #$EXISTING_ISSUE..."
        gh issue edit "$EXISTING_ISSUE" \
            --repo "$REPO" \
            --title "$TITLE" \
            --body "$BODY"
        ISSUE_NUM="$EXISTING_ISSUE"
        log_info "Updated issue #$ISSUE_NUM"
    else
        log_warn "No existing issue found, creating new one..."
        UPDATE_MODE=false
    fi
fi

if [[ "$UPDATE_MODE" == "false" ]]; then
    log_step "Creating GitHub issue..."

    ISSUE_URL=$(gh issue create \
        --repo "$REPO" \
        --title "$TITLE" \
        --body "$BODY" \
        --label "$LABELS" 2>&1) || {
        log_error "Failed to create issue"
        exit 4
    }

    # Extract issue number from URL
    ISSUE_NUM=$(echo "$ISSUE_URL" | grep -oE '[0-9]+$')
    log_info "Created issue #$ISSUE_NUM"
fi

# Update tasks.json
log_step "Updating tasks.json..."
TEMP_FILE=$(mktemp)
jq --argjson num "$ISSUE_NUM" \
   '.github.feature_tasks_issue = $num | .github.issues_created = true' \
   "$TASKS_FILE" > "$TEMP_FILE" && mv "$TEMP_FILE" "$TASKS_FILE"

log_info "Updated $TASKS_FILE with issue #$ISSUE_NUM"
log_info "Done!"

echo ""
echo "Issue URL: https://github.com/$REPO/issues/$ISSUE_NUM"
