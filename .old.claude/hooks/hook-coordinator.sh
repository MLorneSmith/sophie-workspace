#!/bin/bash

# Hook Coordinator
# Manages sequential execution of hooks with priority ordering
# Prevents race conditions and ensures proper sequencing

set -euo pipefail

# Get the project root
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
CONFIG_FILE="${PROJECT_ROOT}/.claude/settings.json"
HOOK_DIR="${PROJECT_ROOT}/.claude/hooks"
LOCK_DIR="/tmp/claude_hook_locks"
QUEUE_DIR="/tmp/claude_hook_queue"

# Create lock and queue directories
mkdir -p "$LOCK_DIR" "$QUEUE_DIR"

# Function to log messages
log() {
    echo "[hook-coordinator] $*" >&2
}

# Hook execution priority (lower number = higher priority)
declare -A HOOK_PRIORITY=(
    ["typecheck-changed.sh"]=1      # TypeScript checks run first
    ["biome-lint-changed.sh"]=2     # Linting second
    ["biome-format-changed.sh"]=3   # Formatting last (to avoid conflicts)
    ["check-any-types.sh"]=4        # Type safety checks
    ["test-changed.sh"]=5           # Tests run after fixes
    ["markdown-lint-changed.sh"]=6  # Markdown checks last
)

# Function to acquire lock with timeout
acquire_lock() {
    local lock_name="$1"
    local lock_file="$LOCK_DIR/${lock_name}.lock"
    local timeout=30
    local elapsed=0

    while [ $elapsed -lt $timeout ]; do
        if mkdir "$lock_file" 2>/dev/null; then
            echo $$ > "$lock_file/pid"
            return 0
        fi

        # Check if lock holder is still alive
        if [ -f "$lock_file/pid" ]; then
            local pid=$(cat "$lock_file/pid" 2>/dev/null || echo "0")
            if ! kill -0 "$pid" 2>/dev/null; then
                # Process is dead, remove stale lock
                rm -rf "$lock_file"
                continue
            fi
        fi

        sleep 0.5
        elapsed=$((elapsed + 1))
    done

    log "⏱️ Lock timeout for $lock_name after ${timeout}s"
    return 1
}

# Function to release lock
release_lock() {
    local lock_name="$1"
    local lock_file="$LOCK_DIR/${lock_name}.lock"
    rm -rf "$lock_file"
}

# Function to queue a hook for execution
queue_hook() {
    local hook_name="$1"
    local file_path="$2"
    local priority="${HOOK_PRIORITY[$hook_name]:-99}"
    local queue_file="$QUEUE_DIR/${priority}_${hook_name}_$(date +%s%N)"

    echo "$file_path" > "$queue_file"
    log "📝 Queued $hook_name for $file_path (priority: $priority)"
}

# Function to process hook queue
process_queue() {
    local file_path="$1"

    # Wait a moment for all hooks to be queued
    sleep 0.2

    # Get global lock for processing
    if ! acquire_lock "global_hook_processing"; then
        log "❌ Failed to acquire global lock"
        return 1
    fi

    # Process hooks in priority order
    for queue_file in $(ls "$QUEUE_DIR" 2>/dev/null | sort -n); do
        if [ ! -f "$QUEUE_DIR/$queue_file" ]; then
            continue
        fi

        # Extract hook name from queue file
        local hook_name=$(echo "$queue_file" | cut -d'_' -f2-)
        hook_name="${hook_name%_*}"

        # Check if this queue entry is for our file
        local queued_file=$(cat "$QUEUE_DIR/$queue_file" 2>/dev/null || echo "")
        if [ "$queued_file" != "$file_path" ]; then
            continue
        fi

        log "▶️ Executing $hook_name for $file_path"

        # Execute the hook
        if [ -f "$HOOK_DIR/$hook_name" ]; then
            # Set environment for hook
            export CLAUDE_HOOK_COORDINATED=true
            export CLAUDE_PARAM_file_path="$file_path"

            # Run hook with timeout
            set +e
            timeout 30 bash "$HOOK_DIR/$hook_name"
            local exit_code=$?
            set -e

            if [ $exit_code -eq 0 ]; then
                log "✅ $hook_name completed successfully"
            elif [ $exit_code -eq 124 ]; then
                log "⏱️ $hook_name timed out"
            else
                log "❌ $hook_name failed with code $exit_code"
            fi
        fi

        # Remove processed queue entry
        rm -f "$QUEUE_DIR/$queue_file"
    done

    # Release global lock
    release_lock "global_hook_processing"

    log "✅ Hook processing complete for $file_path"
}

# Function to check if coordination is enabled
is_coordination_enabled() {
    if [ -f "$CONFIG_FILE" ]; then
        local enabled=$(jq -r '.hook_coordination.enabled // false' "$CONFIG_FILE" 2>/dev/null || echo "false")
        [ "$enabled" = "true" ]
    else
        return 1
    fi
}

# Main execution
main() {
    local operation="${1:-queue}"
    local hook_name="${2:-}"
    local file_path="${3:-}"

    case "$operation" in
        queue)
            if [ -z "$hook_name" ] || [ -z "$file_path" ]; then
                log "Usage: $0 queue <hook_name> <file_path>"
                exit 1
            fi
            queue_hook "$hook_name" "$file_path"
            ;;

        process)
            if [ -z "$file_path" ]; then
                log "Usage: $0 process <file_path>"
                exit 1
            fi
            process_queue "$file_path"
            ;;

        cleanup)
            # Clean up old locks and queue entries (older than 5 minutes)
            find "$LOCK_DIR" -type d -mmin +5 -exec rm -rf {} + 2>/dev/null || true
            find "$QUEUE_DIR" -type f -mmin +5 -exec rm -f {} + 2>/dev/null || true
            log "🧹 Cleaned up old locks and queue entries"
            ;;

        *)
            log "Unknown operation: $operation"
            log "Usage: $0 {queue|process|cleanup} ..."
            exit 1
            ;;
    esac
}

# Run main if not sourced
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi