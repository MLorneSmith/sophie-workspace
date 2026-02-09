#!/usr/bin/env bash
# Sophie Loop Orchestrator — shell wrapper
# 
# This script is called by Sophie (main session) to run the full loop
# on a single task. It coordinates loop-runner.py steps.
#
# Usage:
#   ./orchestrate.sh run-task <task-id> <agent> [persona]
#   ./orchestrate.sh plan [--board-id N] [--initiative-id N]
#   ./orchestrate.sh next-batch [--slots N]
#   ./orchestrate.sh consistency [--initiative-id N]
#   ./orchestrate.sh escalate <task-id>

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AI_DIR="${SCRIPT_DIR}"
LOOP_RUNNER="${AI_DIR}/loop-runner.py"
ORCHESTRATOR="${AI_DIR}/orchestrator.py"

case "${1:-}" in
  plan)
    shift
    python3 "$ORCHESTRATOR" plan "$@"
    ;;
  next-batch)
    shift
    python3 "$ORCHESTRATOR" next-batch "$@"
    ;;
  consistency)
    shift
    python3 "$ORCHESTRATOR" consistency "$@"
    ;;
  escalate)
    shift
    python3 "$ORCHESTRATOR" escalate --task-id "$1"
    ;;
  run-task)
    # Full single-task loop: prepare → (output from Sophie spawn) → review-prep → (output) → process-review
    # This outputs JSON instructions at each step for Sophie to act on
    TASK_ID="${2:?task-id required}"
    AGENT="${3:?agent required}"
    PERSONA="${4:-}"
    
    PERSONA_FLAG=""
    if [ -n "$PERSONA" ]; then
      PERSONA_FLAG="--persona $PERSONA"
    fi
    
    echo "=== STEP 1: Prepare builder prompt ==="
    python3 "$LOOP_RUNNER" prepare \
      --task-id "$TASK_ID" \
      --agent "$AGENT" \
      $PERSONA_FLAG \
      --update-status
    
    echo ""
    echo "=== INSTRUCTION: Sophie should now spawn the builder agent ==="
    echo "=== Read the JSON above for model, promptFile, and runDir ==="
    echo "=== After builder completes, save output to <runDir>/output.md ==="
    echo "=== Then run: $0 review-task $TASK_ID $AGENT ==="
    ;;
  review-task)
    # Second half: review-prep → (output from Sophie spawn) → process-review
    TASK_ID="${2:?task-id required}"
    AGENT="${3:-}"
    RUN_DIR="${AI_DIR}/runs/${TASK_ID}"
    
    AGENT_FLAG=""
    if [ -n "$AGENT" ]; then
      AGENT_FLAG="--agent $AGENT"
    fi
    
    echo "=== STEP 2: Prepare review prompt ==="
    python3 "$LOOP_RUNNER" review-prep \
      --task-id "$TASK_ID" \
      --output-file "${RUN_DIR}/output.md" \
      $AGENT_FLAG \
      --update-status
    
    echo ""
    echo "=== INSTRUCTION: Sophie should now spawn the reviewer agent ==="
    echo "=== Read JSON above for model, promptFile ==="
    echo "=== After reviewer completes, save output to <runDir>/review.md ==="
    echo "=== Then run: $0 verdict $TASK_ID ==="
    ;;
  verdict)
    TASK_ID="${2:?task-id required}"
    RUN_DIR="${AI_DIR}/runs/${TASK_ID}"
    
    echo "=== STEP 3: Process review verdict ==="
    RESULT=$(python3 "$LOOP_RUNNER" process-review \
      --task-id "$TASK_ID" \
      --review-file "${RUN_DIR}/review.md")
    
    echo "$RESULT"
    
    case "$RESULT" in
      PASS)
        echo "=== Task passed review. Moved to mike_review in MC. ==="
        ;;
      FAIL:iterate)
        echo "=== Task failed review. Iterating... ==="
        echo "=== Run: $0 run-task $TASK_ID <agent> [persona] to re-run ==="
        ;;
      FAIL:blocked)
        echo "=== Task hit iteration cap. Blocked in MC. ==="
        python3 "$ORCHESTRATOR" escalate --task-id "$TASK_ID"
        ;;
      *)
        echo "=== Unknown verdict: $RESULT ==="
        ;;
    esac
    ;;
  *)
    echo "Usage: $0 {plan|next-batch|consistency|escalate|run-task|review-task|verdict}"
    exit 1
    ;;
esac
