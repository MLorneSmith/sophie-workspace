#!/bin/bash

# Codecheck wrapper script that tracks combined linting/typecheck status for Claude statusline
# Usage: codecheck-wrapper.sh [codecheck command and arguments]

# Status file for tracking codecheck results (combines lint + typecheck)
CHECK_STATUS_FILE="/tmp/.claude_codecheck_status_${PWD//\//_}"

# Mark check as running
echo "running|$(date +%s)|0|0|0" > "$CHECK_STATUS_FILE"

# Capture output to parse results
TEMP_OUTPUT="/tmp/check_output_$$"

# Run the actual check command and capture output
"$@" 2>&1 | tee "$TEMP_OUTPUT"
CHECK_EXIT_CODE=${PIPESTATUS[0]}

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
    if grep -qE "Found [0-9]+ error" "$TEMP_OUTPUT"; then
        TYPE_ERRORS=$(grep -oE "Found ([0-9]+) error" "$TEMP_OUTPUT" | grep -oE "[0-9]+" | head -1 || echo "0")
    fi
    
    # TypeScript errors alternate: "error TS"
    if grep -qE "error TS[0-9]+" "$TEMP_OUTPUT"; then
        TS_COUNT=$(grep -cE "error TS[0-9]+" "$TEMP_OUTPUT" || echo "0")
        TYPE_ERRORS=$((TYPE_ERRORS + TS_COUNT))
    fi
    
    # ESLint pattern: "✖ X problems (Y errors, Z warnings)"
    if grep -qE "✖.*problems" "$TEMP_OUTPUT"; then
        LINT_ERRORS=$(grep -oE "([0-9]+) error" "$TEMP_OUTPUT" | grep -oE "[0-9]+" | tail -1 || echo "0")
        WARNINGS=$(grep -oE "([0-9]+) warning" "$TEMP_OUTPUT" | grep -oE "[0-9]+" | tail -1 || echo "0")
    fi
    
    # Biome pattern: "Found X errors"
    if grep -qE "Checked [0-9]+ file.*Found [0-9]+ error" "$TEMP_OUTPUT"; then
        BIOME_ERRORS=$(grep -oE "Found ([0-9]+) error" "$TEMP_OUTPUT" | grep -oE "[0-9]+" | tail -1 || echo "0")
        LINT_ERRORS=$((LINT_ERRORS + BIOME_ERRORS))
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