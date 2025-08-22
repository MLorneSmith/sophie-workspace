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

# Codecheck wrapper aliases (combines lint + typecheck)
alias ccodecheck="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh"
alias cpnpm-codecheck="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh pnpm codecheck"

# Legacy lint wrapper aliases (still work but use codecheck wrapper)
alias clint="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh"
alias cpnpm-lint="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh pnpm lint"
alias cnpm-lint="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh npm run lint"
alias cbiome="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh pnpm biome"
alias ceslint="$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh pnpm eslint"

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
        code-check|codecheck|lint|eslint|biome|typecheck|tsc)
            "$CLAUDE_STATUSLINE_DIR/codecheck-wrapper.sh" "$@"
            ;;
        build)
            "$CLAUDE_STATUSLINE_DIR/build-wrapper.sh" "$@"
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

# Convenience function to clear PR cache for faster refresh
claude-refresh-pr() {
    "$CLAUDE_STATUSLINE_DIR/clear-pr-cache.sh"
}

echo "Claude statusline aliases loaded. Available commands:"
echo "  Test:      ctest, cpnpm-test, cvitest, cjest"
echo "  Codecheck: ccodecheck, cpnpm-codecheck (combines lint+typecheck)"
echo "  Build:     cbuild, cpnpm-build"
echo "  Utils:     claude-run <command>, claude-clear-status, claude-refresh-pr"