#!/bin/bash
# Direct execution script for codecheck - ensures actual commands are run
# This script is called by agents to guarantee real execution, not simulation

set -euo pipefail

# Disable hooks during codecheck to prevent interference
export CLAUDE_HOOKS_DISABLED=true
export CLAUDE_CODECHECK_ACTIVE="/tmp/.claude_codecheck_active_$$"
touch "$CLAUDE_CODECHECK_ACTIVE"

# Initialize status tracking
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
CODECHECK_STATUS_FILE="/tmp/.claude_codecheck_status_${GIT_ROOT//\//_}"
STATUS_UPDATE_SCRIPT="${GIT_ROOT}/.claude/statusline/update-codecheck-status.sh"
TIMESTAMP=$(date +%s)
WORK_DIR="/tmp/codecheck_${TIMESTAMP}"

# Ensure work directory exists
mkdir -p "$WORK_DIR"

# Initialize status file using robust updater
if [ -f "$STATUS_UPDATE_SCRIPT" ]; then
    "$STATUS_UPDATE_SCRIPT" running 0 0 0
else
    # Fallback if script not found
    echo "running|$TIMESTAMP|0|0|0" > "$CODECHECK_STATUS_FILE"
fi
echo "✅ Status file initialized: $CODECHECK_STATUS_FILE"

# Set up cleanup trap
cleanup() {
    local exit_code=$?
    # Remove codecheck active marker
    [ -f "$CLAUDE_CODECHECK_ACTIVE" ] && rm -f "$CLAUDE_CODECHECK_ACTIVE"

    if [ $exit_code -ne 0 ] && [ -f "$CODECHECK_STATUS_FILE" ]; then
        if grep -q "running" "$CODECHECK_STATUS_FILE"; then
            if [ -f "$STATUS_UPDATE_SCRIPT" ]; then
                "$STATUS_UPDATE_SCRIPT" failed 1 0 0
            else
                echo "failed|$(date +%s)|1|0|0" > "$CODECHECK_STATUS_FILE"
            fi
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
        # Parse lint errors from output
        local lint_errors=0
        local lint_warnings=0
        
        # Check for markdownlint-cli2 errors (e.g., "Summary: 43 error(s)")
        if grep -q "Summary:.*error" "$output_file"; then
            local md_count=$(grep "Summary:" "$output_file" | sed -n 's/Summary: \([0-9]*\) error.*/\1/p' | head -1)
            if [ -n "$md_count" ] && [ "$md_count" -gt 0 ]; then
                lint_errors=$md_count
            fi
        fi
        
        # Check for Biome lint errors
        local biome_count=$(grep -c "lint/correctness" "$output_file" 2>/dev/null || true)
        if [ -n "$biome_count" ] && [ "$biome_count" -gt 0 ]; then
            lint_errors=$((lint_errors + biome_count))
        fi
        
        # Check for warnings
        local warning_count=$(grep -c "⚠" "$output_file" 2>/dev/null || true)
        if [ -n "$warning_count" ] && [ "$warning_count" -gt 0 ]; then
            lint_warnings=$warning_count
        fi
        
        # If we still found no errors but the command failed, count it as 1 error
        if [ $lint_errors -eq 0 ] && [ $lint_warnings -eq 0 ]; then
            lint_errors=1
        fi
        
        echo "status: failed" > "$WORK_DIR/lint_result.yaml"
        echo "errors_found: $lint_errors" >> "$WORK_DIR/lint_result.yaml"
        echo "warnings_found: $lint_warnings" >> "$WORK_DIR/lint_result.yaml"
        echo "❌ Lint issues found - Errors: $lint_errors, Warnings: $lint_warnings"
        
        # Smart auto-fix (git-aware)
        echo "🔧 Checking for auto-fix eligibility..."
        local modified_files=$(git diff --name-only)

        if [ -z "$modified_files" ]; then
            echo "🔧 No modifications detected - applying auto-fix"
            if pnpm lint:fix > "$WORK_DIR/lint_fix_output.log" 2>&1; then
                echo "✅ Auto-fix applied"
                # Re-check
                if pnpm lint > "$WORK_DIR/lint_recheck.log" 2>&1; then
                    sed -i "s/status: failed/status: success/" "$WORK_DIR/lint_result.yaml"
                    echo "✅ All lint issues resolved"
                    return 0
                fi
            fi
        else
            echo "⚠️ Modified files detected - skipping auto-fix to preserve changes:"
            echo "$modified_files" | sed 's/^/   /'
            echo "💡 Commit or stash changes first to enable auto-fixing"
        fi
        return 1
    fi
}

# Function to run format
run_format() {
    echo "✨ Running format checks..."
    local output_file="$WORK_DIR/format_output.log"
    
    # First check if formatting is needed
    if pnpm format > "$output_file" 2>&1; then
        echo "status: success" > "$WORK_DIR/format_result.yaml"
        echo "files_formatted: 0" >> "$WORK_DIR/format_result.yaml"
        echo "✅ All files properly formatted"
        return 0
    else
        # Smart formatting (git-aware)
        echo "🔧 Checking for format auto-fix eligibility..."
        local modified_files=$(git diff --name-only)

        if [ -z "$modified_files" ]; then
            echo "🔧 No modifications detected - applying formatting"
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
        else
            echo "⚠️ Modified files detected - skipping format auto-fix to preserve changes:"
            echo "$modified_files" | sed 's/^/   /'
            echo "💡 Commit or stash changes first to enable auto-formatting"
            echo "status: failed" > "$WORK_DIR/format_result.yaml"
            echo "files_formatted: 0" >> "$WORK_DIR/format_result.yaml"
            return 1
        fi
    fi
}

# Main execution
main() {
    local type_status=0
    local lint_status=0
    local format_status=0

    # Capture baseline metrics for comparison
    echo "📊 Capturing baseline metrics..."
    local baseline_errors=0
    local baseline_warnings=0
    if [ -f "$CODECHECK_STATUS_FILE" ]; then
        IFS='|' read -r prev_status prev_time prev_errors prev_warnings prev_type_errors < "$CODECHECK_STATUS_FILE" || true
        baseline_errors=${prev_errors:-0}
        baseline_warnings=${prev_warnings:-0}
    fi

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
    
    # Update final status using robust updater
    if [ $type_status -eq 0 ] && [ $lint_status -eq 0 ] && [ $format_status -eq 0 ]; then
        if [ -f "$STATUS_UPDATE_SCRIPT" ]; then
            "$STATUS_UPDATE_SCRIPT" success 0 0 0
        else
            echo "success|$(date +%s)|0|0|0" > "$CODECHECK_STATUS_FILE"
        fi
        echo ""
        echo "✅ ALL CHECKS PASSED"
        local overall_status="success"
    else
        if [ -f "$STATUS_UPDATE_SCRIPT" ]; then
            "$STATUS_UPDATE_SCRIPT" failed "$total_errors" "$lint_warnings" "$type_errors"
        else
            echo "failed|$(date +%s)|$total_errors|$lint_warnings|$type_errors" > "$CODECHECK_STATUS_FILE"
        fi
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

    # Show metrics improvement if baseline exists
    if [ $baseline_errors -gt 0 ] || [ $baseline_warnings -gt 0 ]; then
        local error_diff=$((baseline_errors - total_errors))
        local warning_diff=$((baseline_warnings - lint_warnings))
        echo "📊 Metrics Improvement:"
        if [ $error_diff -gt 0 ]; then
            echo "   Errors reduced: $baseline_errors → $total_errors (-$error_diff)"
        elif [ $error_diff -lt 0 ]; then
            echo "   Errors increased: $baseline_errors → $total_errors (+$((-error_diff)))"
        fi
        if [ $warning_diff -gt 0 ]; then
            echo "   Warnings reduced: $baseline_warnings → $lint_warnings (-$warning_diff)"
        elif [ $warning_diff -lt 0 ]; then
            echo "   Warnings increased: $baseline_warnings → $lint_warnings (+$((-warning_diff)))"
        fi
        echo ""
    fi

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