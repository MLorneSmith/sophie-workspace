#!/usr/bin/env bash
#
# renumber-tasks.sh
#
# Renumbers task IDs in tasks.json after splitting a task into multiple tasks.
# Updates all references including dependencies, execution groups, and critical path.
#
# Usage:
#   ./renumber-tasks.sh <tasks.json> --split <task_id> --count <num_new_tasks>
#   ./renumber-tasks.sh <tasks.json> --shift <start_id> --by <shift_amount>
#
# Examples:
#   # After splitting T14 into 4 tasks (T14, T15, T16, T17), shift subsequent:
#   ./renumber-tasks.sh tasks.json --split T14 --count 4
#
#   # Shift all tasks from T15 onwards by 3 (T15→T18, T16→T19, etc.):
#   ./renumber-tasks.sh tasks.json --shift T15 --by 3
#
# Options:
#   --dry-run    Show what would change without modifying file
#   --backup     Create .bak file before modifying
#
# Output:
#   Modified tasks.json with updated task IDs and references
#
# Exit codes:
#   0 - Success
#   1 - Missing arguments
#   2 - File not found
#   3 - Invalid task ID
#   4 - jq processing error

set -euo pipefail

# Colors for messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit "$2"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}" >&2
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" >&2
}

usage() {
    echo "Usage: $0 <tasks.json> --split <task_id> --count <num_new_tasks> [--dry-run] [--backup]"
    echo "   or: $0 <tasks.json> --shift <start_id> --by <shift_amount> [--dry-run] [--backup]"
    echo ""
    echo "Examples:"
    echo "  $0 tasks.json --split T14 --count 4"
    echo "  $0 tasks.json --shift T15 --by 3 --dry-run"
    exit 1
}

# Parse arguments
TASKS_FILE=""
MODE=""
SPLIT_TASK=""
SPLIT_COUNT=""
SHIFT_START=""
SHIFT_AMOUNT=""
DRY_RUN=false
BACKUP=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --split)
            MODE="split"
            SPLIT_TASK="$2"
            shift 2
            ;;
        --count)
            SPLIT_COUNT="$2"
            shift 2
            ;;
        --shift)
            MODE="shift"
            SHIFT_START="$2"
            shift 2
            ;;
        --by)
            SHIFT_AMOUNT="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --backup)
            BACKUP=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            if [[ -z "$TASKS_FILE" ]]; then
                TASKS_FILE="$1"
            else
                error "Unknown option: $1" 1
            fi
            shift
            ;;
    esac
done

# Validate arguments
if [[ -z "$TASKS_FILE" ]]; then
    error "Missing tasks.json file path" 1
fi

if [[ ! -f "$TASKS_FILE" ]]; then
    error "File not found: $TASKS_FILE" 2
fi

if [[ "$MODE" == "split" ]]; then
    if [[ -z "$SPLIT_TASK" || -z "$SPLIT_COUNT" ]]; then
        error "Split mode requires --split <task_id> --count <num_new_tasks>" 1
    fi
    # Calculate shift: if T14 becomes 4 tasks (T14-T17), shift T15+ by 3
    TASK_NUM=$(echo "$SPLIT_TASK" | grep -oE '[0-9]+')
    SHIFT_START="T$((TASK_NUM + 1))"
    SHIFT_AMOUNT=$((SPLIT_COUNT - 1))
elif [[ "$MODE" == "shift" ]]; then
    if [[ -z "$SHIFT_START" || -z "$SHIFT_AMOUNT" ]]; then
        error "Shift mode requires --shift <start_id> --by <shift_amount>" 1
    fi
else
    error "Must specify --split or --shift mode" 1
fi

# Extract start number
START_NUM=$(echo "$SHIFT_START" | grep -oE '[0-9]+')

if [[ -z "$START_NUM" ]]; then
    error "Invalid task ID format: $SHIFT_START (expected T<number>)" 3
fi

info "Mode: $MODE"
info "Shifting tasks T${START_NUM}+ by $SHIFT_AMOUNT"

# Create jq filter for renumbering
# This updates task IDs and all references

JQ_FILTER=$(cat <<'EOF'
def renumber_id($start; $shift):
  if . == null then null
  elif type != "string" then .
  elif startswith("T") then
    (.[1:] | tonumber) as $num |
    if $num >= $start then "T" + (($num + $shift) | tostring)
    else .
    end
  elif startswith("S") then .  # Don't renumber spikes
  else .
  end;

def renumber_array($start; $shift):
  if . == null then null
  else map(renumber_id($start; $shift))
  end;

# Update task IDs
.tasks |= map(
  .id = (.id | renumber_id($start; $shift)) |
  .dependencies.blocked_by = (.dependencies.blocked_by | renumber_array($start; $shift)) |
  .dependencies.blocks = (.dependencies.blocks | renumber_array($start; $shift))
) |

# Update execution groups
.execution.groups |= map(
  .task_ids = (.task_ids | renumber_array($start; $shift))
) |

# Update critical path
.execution.critical_path.task_ids = (.execution.critical_path.task_ids | renumber_array($start; $shift)) |

# Update validation if present
if .validation.dependency_checks? then
  .validation.dependency_checks.details.critical_path = (.validation.dependency_checks.details.critical_path | renumber_array($start; $shift))
else .
end
EOF
)

# Replace variables in the filter
JQ_FILTER="${JQ_FILTER//\$start/$START_NUM}"
JQ_FILTER="${JQ_FILTER//\$shift/$SHIFT_AMOUNT}"

# Process the file
info "Processing $TASKS_FILE..."

if $DRY_RUN; then
    info "DRY RUN - showing changes without modifying file"

    # Show before/after for task IDs
    echo ""
    echo "=== Task ID Changes ==="
    BEFORE_IDS=$(jq -r '.tasks[].id' "$TASKS_FILE" | sort -V)
    AFTER_IDS=$(echo "$BEFORE_IDS" | while read id; do
        NUM=$(echo "$id" | grep -oE '[0-9]+')
        if [[ "$id" == T* && $NUM -ge $START_NUM ]]; then
            echo "T$((NUM + SHIFT_AMOUNT))"
        else
            echo "$id"
        fi
    done)

    paste <(echo "$BEFORE_IDS") <(echo "$AFTER_IDS") | while read before after; do
        if [[ "$before" != "$after" ]]; then
            echo "  $before → $after"
        fi
    done

    # Show dependency changes
    echo ""
    echo "=== Dependency Reference Changes ==="
    jq -r '.tasks[] | "\(.id): blocked_by=\(.dependencies.blocked_by | join(",")) blocks=\(.dependencies.blocks | join(","))"' "$TASKS_FILE" | while read line; do
        # Check if any referenced ID will change
        if echo "$line" | grep -qE "T($START_NUM|$((START_NUM+1))|$((START_NUM+2))|$((START_NUM+3))|$((START_NUM+4)))"; then
            echo "  $line"
        fi
    done

    echo ""
    info "Run without --dry-run to apply changes"
    exit 0
fi

# Create backup if requested
if $BACKUP; then
    cp "$TASKS_FILE" "${TASKS_FILE}.bak"
    info "Created backup: ${TASKS_FILE}.bak"
fi

# Apply the transformation
if ! jq "$JQ_FILTER" "$TASKS_FILE" > "${TASKS_FILE}.tmp"; then
    error "jq processing failed" 4
fi

mv "${TASKS_FILE}.tmp" "$TASKS_FILE"

# Verify the result
TASK_COUNT=$(jq '.tasks | length' "$TASKS_FILE")
success "Renumbering complete!"
info "Tasks in file: $TASK_COUNT"

# Show summary of changes
echo ""
echo "=== Updated Task IDs ==="
jq -r '.tasks[].id' "$TASKS_FILE" | paste - - - - - | head -5

echo ""
info "Verify changes with: jq '.tasks[].id' $TASKS_FILE"
info "Validate with: .ai/alpha/scripts/validate-tasks-json.sh $TASKS_FILE"
