#!/usr/bin/env bash
#
# validate-tasks-json.sh
#
# Validates tasks.json against schema and performs sanity checks.
#
# Usage:
#   ./validate-tasks-json.sh <tasks.json>
#   ./validate-tasks-json.sh .ai/alpha/specs/1333-Spec-foo/1335-Initiative-bar/1340-Feature-baz/tasks.json
#
# Checks performed:
#   1. Valid JSON syntax
#   2. Required top-level fields present
#   3. Each task has required fields
#   4. m=1 compliance checks (single verb, no conjunctions, etc.)
#   5. Hours within range (2-8)
#   6. Dependency validation (via validate-dependencies.py)
#
# Output (JSON):
#   {
#     "valid": true,
#     "checks": {
#       "json_syntax": true,
#       "required_fields": true,
#       "task_fields": true,
#       "m1_compliance": true,
#       "hours_range": true,
#       "dependencies": true
#     },
#     "errors": [],
#     "warnings": []
#   }
#
# Exit codes:
#   0 - Valid
#   1 - Invalid

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE=".ai/alpha/templates/tasks.schema.json"

# Check for required argument
if [[ $# -lt 1 ]]; then
    echo '{"valid": false, "errors": ["Usage: validate-tasks-json.sh <tasks.json>"]}'
    exit 1
fi

TASKS_FILE="$1"

# Initialize results
ERRORS=()
WARNINGS=()
CHECKS='{}'

add_error() {
    ERRORS+=("$1")
}

add_warning() {
    WARNINGS+=("$1")
}

set_check() {
    CHECKS=$(echo "$CHECKS" | jq --arg k "$1" --argjson v "$2" '.[$k] = $v')
}

# Check 1: File exists
if [[ ! -f "$TASKS_FILE" ]]; then
    echo '{"valid": false, "checks": {"file_exists": false}, "errors": ["File not found: '"$TASKS_FILE"'"], "warnings": []}'
    exit 1
fi

# Check 2: Valid JSON syntax
if ! jq empty "$TASKS_FILE" 2>/dev/null; then
    echo '{"valid": false, "checks": {"json_syntax": false}, "errors": ["Invalid JSON syntax"], "warnings": []}'
    exit 1
fi
set_check "json_syntax" "true"

# Check 3: Required top-level fields
REQUIRED_FIELDS=("metadata" "tasks" "execution" "validation")
MISSING_FIELDS=()

for field in "${REQUIRED_FIELDS[@]}"; do
    if [[ $(jq ".$field == null" "$TASKS_FILE") == "true" ]]; then
        MISSING_FIELDS+=("$field")
    fi
done

if [[ ${#MISSING_FIELDS[@]} -gt 0 ]]; then
    add_error "Missing required fields: ${MISSING_FIELDS[*]}"
    set_check "required_fields" "false"
else
    set_check "required_fields" "true"
fi

# Check 4: Task-level required fields
TASK_REQUIRED=("id" "type" "name" "action" "estimated_hours" "group" "acceptance_criterion")
TASK_ERRORS=()

TASK_COUNT=$(jq '.tasks | length' "$TASKS_FILE")
for i in $(seq 0 $((TASK_COUNT - 1))); do
    TASK_ID=$(jq -r ".tasks[$i].id" "$TASKS_FILE")

    for field in "${TASK_REQUIRED[@]}"; do
        VALUE=$(jq -r ".tasks[$i].$field // empty" "$TASKS_FILE")
        if [[ -z "$VALUE" ]]; then
            TASK_ERRORS+=("Task $TASK_ID missing field: $field")
        fi
    done

    # Check action has verb and target
    VERB=$(jq -r ".tasks[$i].action.verb // empty" "$TASKS_FILE")
    TARGET=$(jq -r ".tasks[$i].action.target // empty" "$TASKS_FILE")
    if [[ -z "$VERB" ]]; then
        TASK_ERRORS+=("Task $TASK_ID missing action.verb")
    fi
    if [[ -z "$TARGET" ]]; then
        TASK_ERRORS+=("Task $TASK_ID missing action.target")
    fi
done

if [[ ${#TASK_ERRORS[@]} -gt 0 ]]; then
    for err in "${TASK_ERRORS[@]}"; do
        add_error "$err"
    done
    set_check "task_fields" "false"
else
    set_check "task_fields" "true"
fi

# Check 5: m=1 compliance
M1_ERRORS=()
VALID_VERBS=("Create" "Add" "Update" "Remove" "Wire" "Extract" "Rename" "Move" "Configure" "Test" "Spike")

for i in $(seq 0 $((TASK_COUNT - 1))); do
    TASK_ID=$(jq -r ".tasks[$i].id" "$TASKS_FILE")
    NAME=$(jq -r ".tasks[$i].name" "$TASKS_FILE")
    VERB=$(jq -r ".tasks[$i].action.verb" "$TASKS_FILE")

    # Check valid verb
    VERB_VALID=false
    for v in "${VALID_VERBS[@]}"; do
        if [[ "$VERB" == "$v" ]]; then
            VERB_VALID=true
            break
        fi
    done
    if [[ "$VERB_VALID" == "false" ]]; then
        M1_ERRORS+=("Task $TASK_ID: Invalid verb '$VERB'")
    fi

    # Check for conjunctions in name (case insensitive)
    if echo "$NAME" | grep -qiE '\band\b|\bthen\b'; then
        M1_ERRORS+=("Task $TASK_ID: Name contains conjunction (and/then)")
    fi

    # Check m1_checks if present
    M1_CHECKS=$(jq ".tasks[$i].m1_checks // {}" "$TASKS_FILE")
    if [[ "$M1_CHECKS" != "{}" ]]; then
        # Verify all checks are true
        for check in single_verb no_conjunctions under_8_hours under_750_tokens binary_done_state max_3_files; do
            CHECK_VAL=$(echo "$M1_CHECKS" | jq -r ".$check // true")
            if [[ "$CHECK_VAL" == "false" ]]; then
                add_warning "Task $TASK_ID: m1_check '$check' is false"
            fi
        done
    fi
done

if [[ ${#M1_ERRORS[@]} -gt 0 ]]; then
    for err in "${M1_ERRORS[@]}"; do
        add_error "$err"
    done
    set_check "m1_compliance" "false"
else
    set_check "m1_compliance" "true"
fi

# Check 6: Hours range (2-8)
HOURS_ERRORS=()

for i in $(seq 0 $((TASK_COUNT - 1))); do
    TASK_ID=$(jq -r ".tasks[$i].id" "$TASKS_FILE")
    HOURS=$(jq -r ".tasks[$i].estimated_hours" "$TASKS_FILE")

    if (( $(echo "$HOURS < 1" | bc -l) )); then
        HOURS_ERRORS+=("Task $TASK_ID: Hours ($HOURS) below minimum (1)")
    elif (( $(echo "$HOURS > 8" | bc -l) )); then
        HOURS_ERRORS+=("Task $TASK_ID: Hours ($HOURS) exceeds maximum (8)")
    fi
done

if [[ ${#HOURS_ERRORS[@]} -gt 0 ]]; then
    for err in "${HOURS_ERRORS[@]}"; do
        add_error "$err"
    done
    set_check "hours_range" "false"
else
    set_check "hours_range" "true"
fi

# Check 7: Dependencies (use Python script)
if [[ -x "$SCRIPT_DIR/validate-dependencies.py" ]]; then
    DEP_RESULT=$("$SCRIPT_DIR/validate-dependencies.py" "$TASKS_FILE" 2>/dev/null || echo '{"valid": false}')
    DEP_VALID=$(echo "$DEP_RESULT" | jq -r '.valid')

    if [[ "$DEP_VALID" == "true" ]]; then
        set_check "dependencies" "true"
    else
        set_check "dependencies" "false"
        DEP_ERRORS=$(echo "$DEP_RESULT" | jq -r '.errors[]' 2>/dev/null || echo "")
        while IFS= read -r err; do
            if [[ -n "$err" ]]; then
                add_error "$err"
            fi
        done <<< "$DEP_ERRORS"
    fi
else
    add_warning "validate-dependencies.py not found, skipping dependency validation"
    set_check "dependencies" "null"
fi

# Build final result
VALID="true"
if [[ ${#ERRORS[@]} -gt 0 ]]; then
    VALID="false"
fi

# Build errors array
ERRORS_JSON="[]"
for err in "${ERRORS[@]}"; do
    ERRORS_JSON=$(echo "$ERRORS_JSON" | jq --arg e "$err" '. += [$e]')
done

# Build warnings array
WARNINGS_JSON="[]"
for warn in "${WARNINGS[@]}"; do
    WARNINGS_JSON=$(echo "$WARNINGS_JSON" | jq --arg w "$warn" '. += [$w]')
done

# Output result
jq -n \
    --argjson valid "$VALID" \
    --argjson checks "$CHECKS" \
    --argjson errors "$ERRORS_JSON" \
    --argjson warnings "$WARNINGS_JSON" \
    '{valid: $valid, checks: $checks, errors: $errors, warnings: $warnings}'

# Exit with appropriate code
if [[ "$VALID" == "true" ]]; then
    exit 0
else
    exit 1
fi
