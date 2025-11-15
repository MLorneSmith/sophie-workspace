#!/bin/bash
# Claude statusline wrapper aliases
# Source this file to use wrapper commands: source .claude/statusline/aliases.sh
# Or add to your shell profile (.bashrc, .zshrc, etc.)

CLAUDE_STATUSLINE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============================================================================
# Test Wrapper Aliases
# ============================================================================

alias ctest="$CLAUDE_STATUSLINE_DIR/test-wrapper.sh"
alias cpnpm-test="$CLAUDE_STATUSLINE_DIR/test-wrapper.sh pnpm test"
alias cnpm-test="$CLAUDE_STATUSLINE_DIR/test-wrapper.sh npm test"
alias cvitest="$CLAUDE_STATUSLINE_DIR/test-wrapper.sh pnpm vitest"
alias cjest="$CLAUDE_STATUSLINE_DIR/test-wrapper.sh pnpm jest"
alias cplaywright="$CLAUDE_STATUSLINE_DIR/test-wrapper.sh pnpm playwright test"

# ============================================================================
# Codecheck Wrapper Aliases
# ============================================================================

alias ccodecheck="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh"
alias cpnpm-codecheck="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh 'pnpm typecheck && pnpm lint'"
alias cnpm-codecheck="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh 'npm run typecheck && npm run lint'"

# Individual codecheck components
alias clint="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh"
alias cpnpm-lint="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh pnpm lint"
alias cnpm-lint="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh npm run lint"
alias cbiome="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh pnpm biome check"
alias ceslint="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh pnpm eslint"

alias ctypecheck="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh"
alias cpnpm-typecheck="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh pnpm typecheck"
alias cnpm-typecheck="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh npm run typecheck"
alias ctsc="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh pnpm tsc --noEmit"

# ============================================================================
# Build Wrapper Aliases
# ============================================================================

alias cbuild="$CLAUDE_STATUSLINE_DIR/build-wrapper.sh"
alias cpnpm-build="$CLAUDE_STATUSLINE_DIR/build-wrapper.sh pnpm build"
alias cnpm-build="$CLAUDE_STATUSLINE_DIR/build-wrapper.sh npm run build"
alias cyarn-build="$CLAUDE_STATUSLINE_DIR/build-wrapper.sh yarn build"

# ============================================================================
# Utility Functions
# ============================================================================

# Helper function to run any command with appropriate wrapper
# Usage: claude-run <command> [args...]
claude-run() {
    if [ $# -eq 0 ]; then
        echo "Usage: claude-run <command> [args...]"
        echo "Examples:"
        echo "  claude-run test"
        echo "  claude-run pnpm typecheck"
        echo "  claude-run build"
        return 1
    fi

    case "$1" in
        test|vitest|jest|playwright)
            "$CLAUDE_STATUSLINE_DIR/test-wrapper.sh" "$@"
            ;;
        code-check|codecheck|lint|eslint|biome|typecheck|tsc)
            "$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh" "$@"
            ;;
        build)
            "$CLAUDE_STATUSLINE_DIR/build-wrapper.sh" "$@"
            ;;
        *)
            # If first arg looks like a pnpm/npm command, try to detect intent
            if [[ "$*" == *"test"* ]]; then
                "$CLAUDE_STATUSLINE_DIR/test-wrapper.sh" "$@"
            elif [[ "$*" == *"lint"* ]] || [[ "$*" == *"typecheck"* ]] || [[ "$*" == *"codecheck"* ]]; then
                "$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh" "$@"
            elif [[ "$*" == *"build"* ]]; then
                "$CLAUDE_STATUSLINE_DIR/build-wrapper.sh" "$@"
            else
                # Just run the command without wrapper
                "$@"
            fi
            ;;
    esac
}

# Clear all status files for current repository
# Usage: claude-clear-status
claude-clear-status() {
    # Source the library to get the clear function
    source "$CLAUDE_STATUSLINE_DIR/lib/status-common.sh"
    clear_all_status
}

# Validate status files (debugging)
# Usage: claude-validate-status
claude-validate-status() {
    source "$CLAUDE_STATUSLINE_DIR/lib/status-common.sh"

    local git_root
    git_root=$(get_git_root)

    echo "Validating statusline files for: $(basename "$git_root")"
    echo "================================================"

    # Check build status
    local build_file
    build_file=$(get_status_file_path "build")
    echo -n "Build status: "
    if validate_status_file "$build_file" 3; then
        echo "✅ Valid ($(cat "$build_file"))"
    else
        echo "❌ Invalid or missing"
    fi

    # Check test status
    local test_file
    test_file=$(get_status_file_path "test")
    echo -n "Test status:  "
    if validate_status_file "$test_file" 5; then
        echo "✅ Valid ($(cat "$test_file"))"
    else
        echo "❌ Invalid or missing"
    fi

    # Check codecheck status
    local codecheck_file
    codecheck_file=$(get_status_file_path "codecheck")
    echo -n "Codecheck:    "
    if validate_status_file "$codecheck_file" 5; then
        echo "✅ Valid ($(cat "$codecheck_file"))"
    else
        echo "❌ Invalid or missing"
    fi

    echo "================================================"
}

# Enable debug logging
# Usage: claude-debug-on
claude-debug-on() {
    export DEBUG_STATUSLINE=true
    echo "Debug logging enabled. Logs will be written to: $STATUS_LOG_FILE"
    echo "To view logs: tail -f $STATUS_LOG_FILE"
}

# Disable debug logging
# Usage: claude-debug-off
claude-debug-off() {
    export DEBUG_STATUSLINE=false
    echo "Debug logging disabled"
}

# View debug logs
# Usage: claude-debug-view [lines]
claude-debug-view() {
    local lines="${1:-50}"
    if [ -f "$STATUS_LOG_FILE" ]; then
        tail -n "$lines" "$STATUS_LOG_FILE"
    else
        echo "No debug log found at: $STATUS_LOG_FILE"
    fi
}

# Clear debug logs
# Usage: claude-debug-clear
claude-debug-clear() {
    if [ -f "$STATUS_LOG_FILE" ]; then
        rm -f "$STATUS_LOG_FILE"
        echo "Debug log cleared"
    else
        echo "No debug log to clear"
    fi
}

# ============================================================================
# Help Function
# ============================================================================

claude-statusline-help() {
    cat <<'EOF'
Claude Statusline - Enhanced Status Tracking
=============================================

ALIASES:
  Test:      ctest, cpnpm-test, cvitest, cjest, cplaywright
  Codecheck: ccodecheck, clint, ctypecheck, cbiome, ceslint
  Build:     cbuild, cpnpm-build, cnpm-build

UTILITIES:
  claude-run <command>         Run command with auto-detected wrapper
  claude-clear-status          Clear all status files
  claude-validate-status       Validate current status files
  claude-debug-on              Enable debug logging
  claude-debug-off             Disable debug logging
  claude-debug-view [lines]    View debug logs (default: 50 lines)
  claude-debug-clear           Clear debug logs
  claude-statusline-help       Show this help message

EXAMPLES:
  ctest                        Run tests with wrapper
  ccodecheck                   Run codecheck with wrapper
  cbuild                       Run build with wrapper
  claude-run pnpm test         Auto-detect and run with wrapper
  claude-clear-status          Clear all cached status
  claude-debug-on              Enable debugging

For more info, see: .claude/statusline/README.md
EOF
}

# ============================================================================
# Initialization Message
# ============================================================================

echo "Claude statusline aliases loaded ✅"
echo "Type 'claude-statusline-help' for usage information"
