#!/bin/bash
# Direct execution script for codecheck - ensures actual commands are run
# This script is called by agents to guarantee real execution, not simulation

set -euo pipefail

# Initialize status tracking
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
CODECHECK_STATUS_FILE="/tmp/.claude_codecheck_status_${GIT_ROOT//\//_}"
TIMESTAMP=$(date +%s)
WORK_DIR="/tmp/codecheck_${TIMESTAMP}"

# Ensure work directory exists
mkdir -p "$WORK_DIR"

# Initialize status file
echo "running|$TIMESTAMP|0|0|0" > "$CODECHECK_STATUS_FILE"
echo "✅ Status file initialized: $CODECHECK_STATUS_FILE"

# Set up cleanup trap
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ] && [ -f "$CODECHECK_STATUS_FILE" ]; then
        if grep -q "running" "$CODECHECK_STATUS_FILE"; then
            echo "failed|$(date +%s)|1|0|0" > "$CODECHECK_STATUS_FILE"
        fi
    fi
}
trap cleanup EXIT

# Function to run typecheck
run_typecheck() {
    echo "📘 Running TypeScript checks with cache bypass..."
    local output_file="$WORK_DIR/typecheck_output.log"
    
    if pnpm typecheck:raw --force > "$output_file" 2>&1; then
        echo "status: success" > "$WORK_DIR/typecheck_result.yaml"
        echo "errors_found: 0" >> "$WORK_DIR/typecheck_result.yaml"
        echo "✅ TypeScript checks passed"
        return 0
    else
        local type_errors=$(grep -c "error TS" "$output_file" 2>/dev/null || echo "1")
        echo "status: failed" > "$WORK_DIR/typecheck_result.yaml"
        echo "errors_found: $type_errors" >> "$WORK_DIR/typecheck_result.yaml"
        echo "❌ TypeScript errors found: $type_errors"
        return 1
    fi
}

# Function to run lint
run_lint() {
    echo "🔍 Running lint checks..."
    local output_file="$WORK_DIR/lint_output.log"
    
    if pnpm lint > "$output_file" 2>&1; then
        echo "status: success" > "$WORK_DIR/lint_result.yaml"
        echo "errors_found: 0" >> "$WORK_DIR/lint_result.yaml"
        echo "warnings_found: 0" >> "$WORK_DIR/lint_result.yaml"
        echo "✅ Lint checks passed"
        return 0
    else
        # Check for Biome lint errors
        local lint_errors=$(grep -c "lint/correctness" "$output_file" 2>/dev/null || echo "0")
        local lint_warnings=$(grep -c "⚠" "$output_file" 2>/dev/null || echo "0")
        echo "status: failed" > "$WORK_DIR/lint_result.yaml"
        echo "errors_found: $lint_errors" >> "$WORK_DIR/lint_result.yaml"
        echo "warnings_found: $lint_warnings" >> "$WORK_DIR/lint_result.yaml"
        echo "❌ Lint issues found - Errors: $lint_errors, Warnings: $lint_warnings"
        
        # Try auto-fix
        echo "🔧 Attempting auto-fix..."
        if pnpm lint:fix > "$WORK_DIR/lint_fix_output.log" 2>&1; then
            echo "✅ Auto-fix applied"
            # Re-check
            if pnpm lint > "$WORK_DIR/lint_recheck.log" 2>&1; then
                sed -i "s/status: failed/status: success/" "$WORK_DIR/lint_result.yaml"
                echo "✅ All lint issues resolved"
                return 0
            fi
        fi
        return 1
    fi
}

# Function to run format
run_format() {
    echo "✨ Running format checks..."
    local output_file="$WORK_DIR/format_output.log"
    
    # First check if formatting is needed
    if pnpm format:check > "$output_file" 2>&1; then
        echo "status: success" > "$WORK_DIR/format_result.yaml"
        echo "files_formatted: 0" >> "$WORK_DIR/format_result.yaml"
        echo "✅ All files properly formatted"
        return 0
    else
        echo "🔧 Applying formatting..."
        # Apply formatting fix
        if pnpm biome format --write . > "$output_file" 2>&1; then
            echo "status: success" > "$WORK_DIR/format_result.yaml"
            echo "files_formatted: 1" >> "$WORK_DIR/format_result.yaml"
            echo "✅ Formatting applied"
            return 0
        else
            echo "status: failed" > "$WORK_DIR/format_result.yaml"
            echo "files_formatted: 0" >> "$WORK_DIR/format_result.yaml"
            echo "❌ Format check failed"
            return 1
        fi
    fi
}

# Main execution
main() {
    local type_status=0
    local lint_status=0
    local format_status=0
    
    # Phase 1: TypeScript (blocking)
    run_typecheck || type_status=$?
    
    # Phase 2: Parallel lint and format
    echo ""
    echo "🔄 Running parallel lint and format checks..."
    
    # Run in background
    (run_lint) &
    local lint_pid=$!
    
    (run_format) &
    local format_pid=$!
    
    # Wait for parallel tasks
    wait $lint_pid || lint_status=$?
    wait $format_pid || format_status=$?
    
    # Aggregate results
    echo ""
    echo "📊 Aggregating results..."
    
    # Read results
    local type_errors=0
    local lint_errors=0
    local lint_warnings=0
    
    if [ -f "$WORK_DIR/typecheck_result.yaml" ]; then
        type_errors=$(grep "errors_found:" "$WORK_DIR/typecheck_result.yaml" | awk '{print $2}' || echo "0")
    fi
    
    if [ -f "$WORK_DIR/lint_result.yaml" ]; then
        lint_errors=$(grep "errors_found:" "$WORK_DIR/lint_result.yaml" | awk '{print $2}' || echo "0")
        lint_warnings=$(grep "warnings_found:" "$WORK_DIR/lint_result.yaml" | awk '{print $2}' || echo "0")
    fi
    
    local total_errors=$((type_errors + lint_errors))
    
    # Update final status
    local current_time=$(date +%s)
    if [ $type_status -eq 0 ] && [ $lint_status -eq 0 ] && [ $format_status -eq 0 ]; then
        echo "success|$current_time|0|0|0" > "$CODECHECK_STATUS_FILE"
        echo ""
        echo "✅ ALL CHECKS PASSED"
        local overall_status="success"
    else
        echo "failed|$current_time|$total_errors|$lint_warnings|$type_errors" > "$CODECHECK_STATUS_FILE"
        echo ""
        echo "⚠️ SOME CHECKS FAILED"
        local overall_status="failed"
    fi
    
    # Display summary
    echo ""
    echo "========================================="
    echo "         CODECHECK SUMMARY"
    echo "========================================="
    echo "📘 TypeScript: $([ $type_status -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL") (errors: $type_errors)"
    echo "🔍 Linting: $([ $lint_status -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL") (errors: $lint_errors, warnings: $lint_warnings)"
    echo "✨ Formatting: $([ $format_status -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL")"
    echo ""
    echo "📈 Overall: $overall_status"
    echo "📍 Status file: $CODECHECK_STATUS_FILE"
    echo "   Content: $(cat "$CODECHECK_STATUS_FILE")"
    echo "📋 Logs saved to: $WORK_DIR"
    echo "========================================="
    
    # Exit with appropriate code
    [ "$overall_status" = "success" ] && exit 0 || exit 1
}

# Run main function
main "$@"