#!/bin/bash

# Codecheck wrapper script that tracks combined linting/typecheck status for Claude statusline
# Usage: codecheck-wrapper.sh <command>
# Example: codecheck-wrapper.sh "pnpm typecheck && pnpm lint && pnpm format"

# Get git root for consistent status file path
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")

# Status file for tracking codecheck results (combines lint + typecheck)
CHECK_STATUS_FILE="/tmp/.claude_codecheck_status_${GIT_ROOT//\//_}"

# Mark check as running
echo "running|$(date +%s)|0|0|0" > "$CHECK_STATUS_FILE"

# Capture output to parse results
TEMP_OUTPUT="/tmp/check_output_$$"

# If multiple arguments, join them; if single argument, use it as command
if [ $# -gt 1 ]; then
    # Multiple arguments - execute directly
    "$@" 2>&1 | tee "$TEMP_OUTPUT"
    CHECK_EXIT_CODE=${PIPESTATUS[0]}
else
    # Single argument - execute as shell command
    # Run the command and capture output - exit code will be from last command
    eval "$1" 2>&1 | tee "$TEMP_OUTPUT"
    CHECK_EXIT_CODE=${PIPESTATUS[0]}
    
    # Check if any command in the chain failed by looking for error patterns
    if grep -qE "(ELIFECYCLE|error|Error|failed|Failed)" "$TEMP_OUTPUT"; then
        CHECK_EXIT_CODE=1
    fi
fi

# Parse check results based on common linter/typecheck outputs
if [ $CHECK_EXIT_CODE -eq 0 ]; then
    # No issues found
    echo "success|$(date +%s)|0|0|0" > "$CHECK_STATUS_FILE"
else
    # Try to extract error and warning counts from various tools
    LINT_ERRORS=0
    TYPE_ERRORS=0
    WARNINGS=0
    
    # TypeScript errors: "Found X errors"
    if [ -f "$TEMP_OUTPUT" ] && grep -qE "Found [0-9]+ error" "$TEMP_OUTPUT"; then
        TYPE_ERRORS=$(grep -oE "Found ([0-9]+) error" "$TEMP_OUTPUT" | grep -oE "[0-9]+" | head -1 || echo "0")
    fi
    
    # TypeScript errors alternate: "error TS"
    if [ -f "$TEMP_OUTPUT" ] && grep -qE "error TS[0-9]+" "$TEMP_OUTPUT"; then
        TS_COUNT=$(grep -cE "error TS[0-9]+" "$TEMP_OUTPUT" || echo "0")
        TYPE_ERRORS=$((TYPE_ERRORS + TS_COUNT))
    fi
    
    # ESLint pattern: "✖ X problems (Y errors, Z warnings)"
    if [ -f "$TEMP_OUTPUT" ] && grep -qE "✖.*problems" "$TEMP_OUTPUT"; then
        LINT_ERRORS=$(grep -oE "([0-9]+) error" "$TEMP_OUTPUT" | grep -oE "[0-9]+" | tail -1 || echo "0")
        WARNINGS=$(grep -oE "([0-9]+) warning" "$TEMP_OUTPUT" | grep -oE "[0-9]+" | tail -1 || echo "0")
    fi
    
    # Biome pattern: "Found X errors." or "Found X error."
    if [ -f "$TEMP_OUTPUT" ]; then
        # Look for "Found X errors." or "Found X error." (with or without period)
        if grep -qE "Found [0-9]+ errors?\.?" "$TEMP_OUTPUT"; then
            BIOME_ERRORS=$(grep -E "Found [0-9]+ errors?\.?" "$TEMP_OUTPUT" | grep -oE "[0-9]+" | tail -1 || echo "0")
            LINT_ERRORS=$((LINT_ERRORS + BIOME_ERRORS))
        fi
        # Also look for "Found X warning." or "Found X warnings." (with or without period)
        if grep -qE "Found [0-9]+ warnings?\.?" "$TEMP_OUTPUT"; then
            BIOME_WARNINGS=$(grep -E "Found [0-9]+ warnings?\.?" "$TEMP_OUTPUT" | grep -oE "[0-9]+" | tail -1 || echo "0")
            WARNINGS=$((WARNINGS + BIOME_WARNINGS))
        fi
    fi
    
    # Total errors
    TOTAL_ERRORS=$((LINT_ERRORS + TYPE_ERRORS))
    
    # If we couldn't parse specific counts, assume at least 1 error
    if [ "$TOTAL_ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
        TOTAL_ERRORS=1
    fi
    
    echo "failed|$(date +%s)|$TOTAL_ERRORS|$WARNINGS|$TYPE_ERRORS" > "$CHECK_STATUS_FILE"
fi

# Clean up temp file
rm -f "$TEMP_OUTPUT"

# Exit with the same code as the check command
exit $CHECK_EXIT_CODE