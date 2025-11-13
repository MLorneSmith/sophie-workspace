#!/bin/bash

# Biome Project Check Hook
# Runs comprehensive Biome validation on entire project
# Executes on Stop hook to ensure code quality before session ends
#
# Worktree Support:
# - When in a git worktree, only checks files in the current worktree
# - Prevents checking errors from other branches when working in parallel
# - In main repository, checks entire project as before
#
# Output Format:
# - Uses clean, concise box formatting for better terminal compatibility
# - Avoids verbose stderr output that can trigger persistent notifications in Warp
# - Warnings are non-blocking (exit 0) while errors are blocking (exit 2)

set -euo pipefail

# Function to detect if we're in a git worktree
is_in_worktree() {
    if ! git rev-parse --git-dir &>/dev/null; then
        return 1  # Not in a git repository
    fi
    
    local git_dir=$(git rev-parse --git-dir 2>/dev/null)
    local common_dir=$(git rev-parse --git-common-dir 2>/dev/null)
    
    # In a worktree, git-dir and git-common-dir are different
    # Also, .git is a file in worktrees, not a directory
    if [ -f ".git" ] && [ "$git_dir" != "$common_dir" ]; then
        return 0  # In a worktree
    else
        return 1  # In main repository
    fi
}

# Get the project root and hook configuration
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
CONFIG_FILE="${PROJECT_ROOT}/.claude/settings.json"

# Determine if we're in a worktree and set context message
if is_in_worktree; then
    WORKTREE_MODE=true
    WORKTREE_NAME=$(basename "$PROJECT_ROOT")
    CONTEXT_MESSAGE="(worktree: $WORKTREE_NAME)"
else
    WORKTREE_MODE=false
    CONTEXT_MESSAGE="(main repository)"
fi

# Function to log messages
log() {
    echo "[biome-project-check] $*" >&2
}

# Function to get config value from settings.json
get_config() {
    local key="$1"
    local default="$2"
    if [ -f "$CONFIG_FILE" ]; then
        value=$(jq -r ".biome.${key} // null" "$CONFIG_FILE" 2>/dev/null || echo "null")
        if [ "$value" != "null" ]; then
            echo "$value"
        else
            echo "$default"
        fi
    else
        echo "$default"
    fi
}

# Check if biome.json exists (indicating Biome is configured)
if [ ! -f "${PROJECT_ROOT}/biome.json" ]; then
    log "Biome not configured, skipping project check"
    exit 0
fi

# Load configuration
BIOME_COMMAND=$(get_config "command" "npx biome")
PROJECT_CHECK_ENABLED=$(get_config "projectCheck" "true")
TIMEOUT=$(get_config "projectCheckTimeout" "60")
CHECK_ON_STOP=$(get_config "checkOnStop" "true")

# Check if project check is enabled
if [ "$PROJECT_CHECK_ENABLED" = "false" ]; then
    exit 0
fi

# Only run on Stop hook if configured
if [ "${CLAUDE_HOOK:-}" = "Stop" ] && [ "$CHECK_ON_STOP" = "false" ]; then
    exit 0
fi

# Output status message with consistent formatting
echo "" >&2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
if [ "$WORKTREE_MODE" = true ]; then
    echo "🔍 Biome: Checking worktree files $CONTEXT_MESSAGE" >&2
else
    echo "🔍 Biome: Checking entire project $CONTEXT_MESSAGE" >&2
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2

# Build Biome command
BIOME_CMD="$BIOME_COMMAND check"

# Determine what to check based on worktree mode
if [ "$WORKTREE_MODE" = true ]; then
    # In worktree: only check files that are modified or staged in this worktree
    # This prevents checking errors from the main dev branch
    
    # Get list of modified and staged files
    CHANGED_FILES=$(cd "$PROJECT_ROOT" && git diff --name-only HEAD 2>/dev/null || true)
    STAGED_FILES=$(cd "$PROJECT_ROOT" && git diff --cached --name-only 2>/dev/null || true)
    
    # Combine and deduplicate the file lists
    ALL_CHANGED_FILES=$(echo -e "$CHANGED_FILES\n$STAGED_FILES" | sort -u | grep -v '^$' || true)
    
    if [ -z "$ALL_CHANGED_FILES" ]; then
        echo "No modified files in worktree to check" >&2
        echo "" >&2
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
        echo "✅ Biome: No files to check in worktree" >&2
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
        echo "" >&2
        exit 0
    fi
    
    # Filter for files that Biome should check (JS/TS/JSON files)
    BIOME_FILES=$(echo "$ALL_CHANGED_FILES" | grep -E '\.(js|jsx|ts|tsx|json|jsonc)$' || true)
    
    if [ -z "$BIOME_FILES" ]; then
        echo "No JavaScript/TypeScript/JSON files to check" >&2
        echo "" >&2
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
        echo "✅ Biome: No relevant files in worktree" >&2
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
        echo "" >&2
        exit 0
    fi
    
    # Convert newlines to spaces for command line
    CHECK_PATHS=$(echo "$BIOME_FILES" | tr '\n' ' ')
    echo "Checking $(echo "$BIOME_FILES" | wc -l) modified file(s) in worktree" >&2
else
    # In main repository: check entire project as before
    CHECK_PATHS=$(get_config "checkPaths" ".")
fi

BIOME_CMD="$BIOME_CMD $CHECK_PATHS"

# Run Biome with timeout
set +e
if command -v timeout >/dev/null 2>&1; then
    CHECK_OUTPUT=$(timeout "${TIMEOUT}s" bash -c "cd '$PROJECT_ROOT' && $BIOME_CMD" 2>&1)
    EXIT_CODE=$?
else
    CHECK_OUTPUT=$(cd "$PROJECT_ROOT" && eval "$BIOME_CMD" 2>&1)
    EXIT_CODE=$?
fi
set -e

# Check if timeout occurred
if [ $EXIT_CODE -eq 124 ]; then
    echo "" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "⏱️  Biome: Check timed out (${TIMEOUT}s)" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "Run 'npx biome check' manually to complete" >&2
    echo "" >&2
    exit 0  # Don't fail on timeout for project-wide checks
fi

# Parse the output to count issues
ERRORS=0
WARNINGS=0
if echo "$CHECK_OUTPUT" | grep -q "Found [0-9]* error"; then
    ERRORS=$(echo "$CHECK_OUTPUT" | grep -oE "Found [0-9]* error" | grep -oE "[0-9]*" | head -1)
fi
if echo "$CHECK_OUTPUT" | grep -q "Found [0-9]* warning"; then
    WARNINGS=$(echo "$CHECK_OUTPUT" | grep -oE "Found [0-9]* warning" | grep -oE "[0-9]*" | head -1)
fi

# Check for errors
if [ $EXIT_CODE -ne 0 ] && [ $ERRORS -gt 0 ]; then
    echo "❌ BIOME PROJECT CHECK FAILED" >&2
    echo "" >&2
    echo "$CHECK_OUTPUT" >&2
    echo "" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "CRITICAL: Project has $ERRORS error(s) and $WARNINGS warning(s)" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "" >&2
    echo "REQUIRED ACTIONS:" >&2
    echo "1. Review and fix all errors shown above" >&2
    echo "2. Run 'npx biome check --write' to auto-fix formatting issues" >&2
    echo "3. Run 'npx biome check' to verify all issues are resolved" >&2
    echo "" >&2
    echo "To see only errors: npx biome check --diagnostic-level=error" >&2
    echo "To auto-fix all: npx biome check --write" >&2
    exit 2
elif [ $WARNINGS -gt 0 ]; then
    # Output a clean, concise warning message
    echo "" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "⚠️  Biome: $WARNINGS warning(s) found" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "Run 'npx biome check' to see details" >&2
    echo "" >&2
    exit 0
fi

# Success - use consistent formatting
echo "" >&2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
echo "✅ Biome: All checks passed" >&2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
echo "" >&2
exit 0