#!/bin/bash
# Codecheck wrapper script that tracks linting/typecheck status for Claude statusline
# Usage: codecheck-wrapper.sh <command>
# Example: codecheck-wrapper.sh "pnpm typecheck && pnpm lint"
# Example: codecheck-wrapper.sh pnpm codecheck

# Get script directory and source common library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/status-common.sh
source "$SCRIPT_DIR/lib/status-common.sh"

# Exit on error, but capture exit codes for reporting
set -u

# Temp file for capturing output
TEMP_OUTPUT="/tmp/codecheck_output_$$"

# Cleanup function
cleanup() {
    local exit_code=$?
    rm -f "$TEMP_OUTPUT"
    clear_process_running "codecheck"
    exit $exit_code
}
trap cleanup EXIT INT TERM

# ============================================================================
# Output Parsing Functions
# ============================================================================

# Parse linting errors from various linters
parse_lint_errors() {
    local output_file="$1"
    local errors=0
    local warnings=0

    log_debug "Parsing lint errors from: $output_file"

    # ESLint: "✖ X problems (Y errors, Z warnings)"
    if grep -qE "✖.*problems" "$output_file" 2>/dev/null; then
        errors=$(grep -oE "([0-9]+) error" "$output_file" | grep -oE "[0-9]+" | tail -1 || echo "0")
        warnings=$(grep -oE "([0-9]+) warning" "$output_file" | grep -oE "[0-9]+" | tail -1 || echo "0")
        log_debug "ESLint found: errors=$errors, warnings=$warnings"
    fi

    # Biome: "Found X errors" or "Found X error"
    if grep -qE "Found [0-9]+ errors?\.?" "$output_file" 2>/dev/null; then
        local biome_errors
        biome_errors=$(grep -E "Found [0-9]+ errors?\.?" "$output_file" | grep -oE "[0-9]+" | tail -1 || echo "0")
        errors=$((errors + biome_errors))
        log_debug "Biome errors found: $biome_errors"
    fi

    # Biome warnings: "Found X warnings" or "Found X warning"
    if grep -qE "Found [0-9]+ warnings?\.?" "$output_file" 2>/dev/null; then
        local biome_warnings
        biome_warnings=$(grep -E "Found [0-9]+ warnings?\.?" "$output_file" | grep -oE "[0-9]+" | tail -1 || echo "0")
        warnings=$((warnings + biome_warnings))
        log_debug "Biome warnings found: $biome_warnings"
    fi

    # Prettier: Usually just fails with exit code, count files mentioned
    if grep -qE "\[error\]" "$output_file" 2>/dev/null; then
        local prettier_errors
        prettier_errors=$(grep -cE "\[error\]" "$output_file" 2>/dev/null || echo "0")
        errors=$((errors + prettier_errors))
        log_debug "Prettier errors found: $prettier_errors"
    fi

    # TSLint (legacy): "ERROR:"
    if grep -qE "^ERROR:" "$output_file" 2>/dev/null; then
        local tslint_errors
        tslint_errors=$(grep -cE "^ERROR:" "$output_file" 2>/dev/null || echo "0")
        errors=$((errors + tslint_errors))
        log_debug "TSLint errors found: $tslint_errors"
    fi

    # Sanitize numbers
    errors=$(sanitize_number "$errors" "0")
    warnings=$(sanitize_number "$warnings" "0")

    echo "${errors}|${warnings}"
}

# Parse TypeScript errors
parse_typecheck_errors() {
    local output_file="$1"
    local type_errors=0

    log_debug "Parsing typecheck errors from: $output_file"

    # TypeScript: "Found X errors"
    if grep -qE "Found [0-9]+ error" "$output_file" 2>/dev/null; then
        type_errors=$(grep -oE "Found ([0-9]+) error" "$output_file" | grep -oE "[0-9]+" | head -1 || echo "0")
        log_debug "TypeScript 'Found X errors' pattern: $type_errors"
    fi

    # TypeScript: Count "error TS" occurrences
    if [ "$type_errors" -eq 0 ] && grep -qE "error TS[0-9]+" "$output_file" 2>/dev/null; then
        type_errors=$(grep -cE "error TS[0-9]+" "$output_file" 2>/dev/null || echo "0")
        log_debug "TypeScript 'error TS' pattern: $type_errors"
    fi

    # Generic TypeScript errors: ": error TS"
    if [ "$type_errors" -eq 0 ]; then
        type_errors=$(grep -cE ": error TS" "$output_file" 2>/dev/null || echo "0")
        log_debug "TypeScript generic pattern: $type_errors"
    fi

    # Sanitize
    type_errors=$(sanitize_number "$type_errors" "0")

    echo "$type_errors"
}

# Parse all code check errors
parse_codecheck_errors() {
    local output_file="$1"

    # Parse lint errors and warnings
    local lint_result
    lint_result=$(parse_lint_errors "$output_file")
    IFS='|' read -r lint_errors warnings <<< "$lint_result"

    # Parse typecheck errors
    local type_errors
    type_errors=$(parse_typecheck_errors "$output_file")

    # Total errors (lint + type)
    local total_errors=$((lint_errors + type_errors))

    log_debug "Total codecheck results: lint_errors=$lint_errors, warnings=$warnings, type_errors=$type_errors, total=$total_errors"

    echo "${total_errors}|${warnings}|${type_errors}"
}

# ============================================================================
# Main Execution
# ============================================================================

log_debug "Codecheck wrapper started with args: $*"

# Validate we have a command to run
if [ $# -eq 0 ]; then
    log_error "No codecheck command specified"
    echo "Usage: $0 <command>"
    echo "Example: $0 'pnpm typecheck && pnpm lint'"
    echo "Example: $0 pnpm codecheck"
    exit 1
fi

# Mark codecheck as running
mark_process_running "codecheck"
log_debug "Codecheck process marked as running (PID: $$)"

# Set environment variable so child scripts know they're running within codecheck
export CODECHECK_RUNNING=1

# Execute command
log_debug "Executing codecheck command: $*"

# If multiple arguments, execute directly; if single argument, eval as shell command
if [ $# -gt 1 ]; then
    "$@" 2>&1 | tee "$TEMP_OUTPUT"
    CHECK_EXIT_CODE=${PIPESTATUS[0]}
else
    eval "$1" 2>&1 | tee "$TEMP_OUTPUT"
    CHECK_EXIT_CODE=${PIPESTATUS[0]}
fi

log_debug "Codecheck command completed with exit code: $CHECK_EXIT_CODE"

# Parse results
if [ $CHECK_EXIT_CODE -eq 0 ]; then
    log_debug "Codecheck succeeded"
    update_codecheck_status "success" "0" "0" "0"
else
    # Parse error counts from output
    RESULTS=$(parse_codecheck_errors "$TEMP_OUTPUT")
    IFS='|' read -r TOTAL_ERRORS WARNINGS TYPE_ERRORS <<< "$RESULTS"

    # If we couldn't parse any errors but exit code was non-zero, assume at least 1 error
    if [ "$TOTAL_ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
        TOTAL_ERRORS=1
    fi

    log_debug "Codecheck failed: errors=$TOTAL_ERRORS, warnings=$WARNINGS, type_errors=$TYPE_ERRORS"
    update_codecheck_status "failed" "$TOTAL_ERRORS" "$WARNINGS" "$TYPE_ERRORS"
fi

# Cleanup happens in trap, exit with same code as check command
exit $CHECK_EXIT_CODE
