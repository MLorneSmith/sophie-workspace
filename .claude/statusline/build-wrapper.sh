#!/bin/bash
# Build wrapper script that tracks build execution status for Claude statusline
# Usage: build-wrapper.sh [build command and arguments]
# Example: build-wrapper.sh pnpm build
# Example: build-wrapper.sh npm run build

# Get script directory and source common library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/status-common.sh
source "$SCRIPT_DIR/lib/status-common.sh"

# Exit on error, but capture exit codes for reporting
set -u

# Temp file for capturing build output
TEMP_OUTPUT="/tmp/build_output_$$"

# Cleanup function
cleanup() {
    local exit_code=$?
    rm -f "$TEMP_OUTPUT"
    clear_process_running "build"
    exit $exit_code
}
trap cleanup EXIT INT TERM

# ============================================================================
# Output Parsing Functions
# ============================================================================

# Parse build errors from output
# Tries multiple patterns for different build tools
parse_build_errors() {
    local output_file="$1"
    local error_count=0

    # TypeScript compilation errors: "Found X errors"
    if grep -qE "Found [0-9]+ error" "$output_file" 2>/dev/null; then
        error_count=$(grep -oE "Found ([0-9]+) error" "$output_file" | grep -oE "[0-9]+" | head -1)
    fi

    # ESBuild errors: "X errors"
    if [ "$error_count" -eq 0 ] && grep -qE "^[0-9]+ errors?" "$output_file" 2>/dev/null; then
        local esbuild_errors
        esbuild_errors=$(grep -oE "^([0-9]+) errors?" "$output_file" | grep -oE "[0-9]+" | head -1)
        error_count=$((error_count + esbuild_errors))
    fi

    # Webpack errors: "ERROR in"
    if [ "$error_count" -eq 0 ]; then
        local webpack_errors
        webpack_errors=$(grep -cE "^ERROR in" "$output_file" 2>/dev/null || echo "0")
        error_count=$((error_count + webpack_errors))
    fi

    # Vite errors: "error:"
    if [ "$error_count" -eq 0 ]; then
        local vite_errors
        vite_errors=$(grep -cE "error:" "$output_file" 2>/dev/null || echo "0")
        error_count=$((error_count + vite_errors))
    fi

    # Next.js errors: "Failed to compile"
    if [ "$error_count" -eq 0 ] && grep -qE "Failed to compile" "$output_file" 2>/dev/null; then
        error_count=$(grep -cE "^Error:" "$output_file" 2>/dev/null || echo "1")
    fi

    # Turbo errors: Look for "command .* exited"
    if [ "$error_count" -eq 0 ] && grep -qE "command.*exited \([0-9]+\)" "$output_file" 2>/dev/null; then
        error_count=$(grep -cE "command.*exited \([0-9]+\)" "$output_file" 2>/dev/null || echo "1")
    fi

    # Generic fallback: count "error" occurrences (case insensitive, excluding warnings)
    if [ "$error_count" -eq 0 ]; then
        error_count=$(grep -ciE "^[^w]*error[^s]" "$output_file" 2>/dev/null || echo "0")
    fi

    # Sanitize output
    error_count=$(sanitize_number "$error_count" "1")

    echo "$error_count"
}

# ============================================================================
# Main Execution
# ============================================================================

log_debug "Build wrapper started with args: $*"

# Validate we have a command to run
if [ $# -eq 0 ]; then
    log_error "No build command specified"
    echo "Usage: $0 <build command and arguments>"
    echo "Example: $0 pnpm build"
    exit 1
fi

# Mark build as running
mark_process_running "build"
log_debug "Build process marked as running (PID: $$)"

# Run the actual build command and capture output
log_debug "Executing build command: $*"
"$@" 2>&1 | tee "$TEMP_OUTPUT"
BUILD_EXIT_CODE=${PIPESTATUS[0]}

log_debug "Build command completed with exit code: $BUILD_EXIT_CODE"

# Parse results
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    log_debug "Build succeeded"
    update_build_status "success" "0"
    log_debug "Build status updated: success"
else
    # Parse error count from output
    ERROR_COUNT=$(parse_build_errors "$TEMP_OUTPUT")
    log_debug "Build failed with $ERROR_COUNT errors"
    update_build_status "failed" "$ERROR_COUNT"
    log_debug "Build status updated: failed with $ERROR_COUNT errors"
fi

# Cleanup happens in trap, exit with same code as build
exit $BUILD_EXIT_CODE
