#!/bin/bash

# Hook Wrapper
# Intercepts hook calls and routes through coordinator when enabled
# Ensures proper sequencing and prevents race conditions

set -euo pipefail

# Get the project root
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
CONFIG_FILE="${PROJECT_ROOT}/.claude/settings.json"
HOOK_DIR="${PROJECT_ROOT}/.claude/hooks"
COORDINATOR="${HOOK_DIR}/hook-coordinator.sh"

# Function to check if coordination is enabled
is_coordination_enabled() {
    if [ -f "$CONFIG_FILE" ]; then
        local enabled=$(jq -r '.hook_coordination.enabled // false' "$CONFIG_FILE" 2>/dev/null || echo "false")
        [ "$enabled" = "true" ]
    else
        return 1
    fi
}

# Function to check if hook should be coordinated
should_coordinate() {
    local hook_name="$1"

    # Check if globally disabled (during codecheck)
    if [ "${CLAUDE_HOOKS_DISABLED:-}" = "true" ] || [ -f "${CLAUDE_CODECHECK_ACTIVE:-/dev/null}" ]; then
        return 1
    fi

    # Check if already running under coordinator
    if [ "${CLAUDE_HOOK_COORDINATED:-}" = "true" ]; then
        return 1
    fi

    # Check if coordination is enabled
    if ! is_coordination_enabled; then
        return 1
    fi

    # Only coordinate PostToolUse hooks that modify files
    case "$hook_name" in
        biome-format-changed.sh|biome-lint-changed.sh|typecheck-changed.sh|check-any-types.sh|test-changed.sh|markdown-lint-changed.sh)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Main wrapper logic
main() {
    local hook_name="$1"
    shift

    # Check if we should coordinate this hook
    if should_coordinate "$hook_name"; then
        # Queue the hook for coordinated execution
        local file_path="${CLAUDE_PARAM_file_path:-}"

        if [ -n "$file_path" ]; then
            # Queue this hook
            "$COORDINATOR" queue "$hook_name" "$file_path"

            # Trigger processing after a short delay (allow other hooks to queue)
            (
                sleep 0.5
                "$COORDINATOR" process "$file_path" &
            ) &

            exit 0
        fi
    fi

    # Run the hook directly if coordination is not needed/enabled
    if [ -f "$HOOK_DIR/$hook_name" ]; then
        exec "$HOOK_DIR/$hook_name" "$@"
    else
        echo "[hook-wrapper] Hook not found: $hook_name" >&2
        exit 1
    fi
}

# Execute if not sourced
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi