#!/bin/bash

# Claude statusline wrapper aliases
# Source this file to use wrapper commands: source ~/.claude/statusline/aliases.sh
# Or add to your shell profile (.bashrc, .zshrc, etc.)

CLAUDE_STATUSLINE_DIR="$(dirname "${BASH_SOURCE[0]}")"

# Test wrapper aliases
alias ctest="$CLAUDE_STATUSLINE_DIR/test-wrapper.sh"
alias cpnpm-test="$CLAUDE_STATUSLINE_DIR/test-wrapper.sh pnpm test"
alias cnpm-test="$CLAUDE_STATUSLINE_DIR/test-wrapper.sh npm test"
alias cvitest="$CLAUDE_STATUSLINE_DIR/test-wrapper.sh pnpm vitest"
alias cjest="$CLAUDE_STATUSLINE_DIR/test-wrapper.sh pnpm jest"

# Lint wrapper aliases
alias clint="$CLAUDE_STATUSLINE_DIR/lint-wrapper.sh"
alias cpnpm-lint="$CLAUDE_STATUSLINE_DIR/lint-wrapper.sh pnpm lint"
alias cnpm-lint="$CLAUDE_STATUSLINE_DIR/lint-wrapper.sh npm run lint"
alias cbiome="$CLAUDE_STATUSLINE_DIR/lint-wrapper.sh pnpm biome"
alias ceslint="$CLAUDE_STATUSLINE_DIR/lint-wrapper.sh pnpm eslint"

# Build wrapper aliases (using existing build-wrapper.sh)
alias cbuild="$CLAUDE_STATUSLINE_DIR/build-wrapper.sh"
alias cpnpm-build="$CLAUDE_STATUSLINE_DIR/build-wrapper.sh pnpm build"
alias cnpm-build="$CLAUDE_STATUSLINE_DIR/build-wrapper.sh npm run build"

# TypeCheck wrapper aliases (if typecheck-wrapper.sh exists)
if [ -f "$CLAUDE_STATUSLINE_DIR/typecheck-wrapper.sh" ]; then
    alias ctypecheck="$CLAUDE_STATUSLINE_DIR/typecheck-wrapper.sh"
    alias cpnpm-typecheck="$CLAUDE_STATUSLINE_DIR/typecheck-wrapper.sh pnpm typecheck"
    alias ctsc="$CLAUDE_STATUSLINE_DIR/typecheck-wrapper.sh pnpm tsc"
fi

# Helper function to run any command with appropriate wrapper
claude-run() {
    case "$1" in
        test|vitest|jest)
            "$CLAUDE_STATUSLINE_DIR/test-wrapper.sh" "$@"
            ;;
        lint|eslint|biome)
            "$CLAUDE_STATUSLINE_DIR/lint-wrapper.sh" "$@"
            ;;
        build)
            "$CLAUDE_STATUSLINE_DIR/build-wrapper.sh" "$@"
            ;;
        typecheck|tsc)
            if [ -f "$CLAUDE_STATUSLINE_DIR/typecheck-wrapper.sh" ]; then
                "$CLAUDE_STATUSLINE_DIR/typecheck-wrapper.sh" "$@"
            else
                "$@"
            fi
            ;;
        *)
            "$@"
            ;;
    esac
}

# Convenience function to clear all status files
claude-clear-status() {
    rm -f /tmp/.claude_*_status_*
    echo "Cleared all Claude statusline status files"
}

echo "Claude statusline aliases loaded. Available commands:"
echo "  Test:  ctest, cpnpm-test, cvitest, cjest"
echo "  Lint:  clint, cpnpm-lint, cbiome, ceslint"
echo "  Build: cbuild, cpnpm-build"
echo "  Utils: claude-run <command>, claude-clear-status"