#!/bin/bash

# Lint wrapper script that tracks linting status for Claude statusline
# Usage: lint-wrapper.sh [lint command and arguments]

# Status file for tracking lint results
LINT_STATUS_FILE="/tmp/.claude_lint_status_${PWD//\//_}"

# Mark lint as running
echo "running|$(date +%s)|0|0" > "$LINT_STATUS_FILE"

# Capture output to parse results
TEMP_OUTPUT="/tmp/lint_output_$$"

# Run the actual lint command and capture output
"$@" 2>&1 | tee "$TEMP_OUTPUT"
LINT_EXIT_CODE=${PIPESTATUS[0]}

# Parse lint results based on common linter outputs
if [ $LINT_EXIT_CODE -eq 0 ]; then
    # No issues found
    echo "success|$(date +%s)|0|0" > "$LINT_STATUS_FILE"
else
    # Try to extract error and warning counts from various linters
    ERRORS=0
    WARNINGS=0
    
    # ESLint pattern: "✖ X problems (Y errors, Z warnings)"
    if grep -qE "✖.*problems" "$TEMP_OUTPUT"; then
        ERRORS=$(grep -oE "([0-9]+) error" "$TEMP_OUTPUT" | grep -oE "[0-9]+" | tail -1 || echo "0")
        WARNINGS=$(grep -oE "([0-9]+) warning" "$TEMP_OUTPUT" | grep -oE "[0-9]+" | tail -1 || echo "0")
    fi
    
    # Biome pattern: "Found X errors"
    if grep -qE "Found [0-9]+ error" "$TEMP_OUTPUT"; then
        ERRORS=$(grep -oE "Found ([0-9]+) error" "$TEMP_OUTPUT" | grep -oE "[0-9]+" | head -1 || echo "0")
    fi
    
    # TypeScript pattern: "Found X errors"
    if grep -qE "Found [0-9]+ error" "$TEMP_OUTPUT"; then
        ERRORS=$(grep -oE "Found ([0-9]+) error" "$TEMP_OUTPUT" | grep -oE "[0-9]+" | head -1 || echo "0")
    fi
    
    # Ruff/Python pattern
    if grep -qE "Found [0-9]+ error" "$TEMP_OUTPUT"; then
        ERRORS=$(grep -oE "([0-9]+) error" "$TEMP_OUTPUT" | grep -oE "[0-9]+" | head -1 || echo "0")
    fi
    
    # If we couldn't parse specific counts, assume at least 1 error
    if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
        ERRORS=1
    fi
    
    echo "failed|$(date +%s)|$ERRORS|$WARNINGS" > "$LINT_STATUS_FILE"
fi

# Clean up temp file
rm -f "$TEMP_OUTPUT"

# Exit with the same code as the lint command
exit $LINT_EXIT_CODE