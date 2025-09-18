#!/bin/bash

# =============================================================================
# RLS Performance Testing Script
# =============================================================================
#
# PURPOSE: Automated testing framework for RLS performance validation
# ISSUE: GitHub #345 - Critical RLS performance issues
#
# USAGE:
#   ./run-rls-performance-tests.sh [--baseline|--post-migration|--compare]
#
# MODES:
#   --baseline       Run baseline tests before migration
#   --post-migration Run tests after migration
#   --compare        Compare baseline vs post-migration results
#   (no flags)       Run complete test suite
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$SCRIPT_DIR"
RESULTS_DIR="$TEST_DIR/performance_results"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"

# Test files
SETUP_FILE="$TEST_DIR/rls-performance.test.sql"
BENCHMARK_FILE="$TEST_DIR/rls-performance-benchmarks.test.sql"
SECURITY_FILE="$TEST_DIR/validate-rls-fix.test.sql"

# Result files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BASELINE_PERF="$RESULTS_DIR/baseline_performance_${TIMESTAMP}.log"
BASELINE_SEC="$RESULTS_DIR/baseline_security_${TIMESTAMP}.log"
OPTIMIZED_PERF="$RESULTS_DIR/optimized_performance_${TIMESTAMP}.log"
OPTIMIZED_SEC="$RESULTS_DIR/optimized_security_${TIMESTAMP}.log"
COMPARISON_REPORT="$RESULTS_DIR/comparison_report_${TIMESTAMP}.md"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Supabase is running
check_supabase() {
    print_status "Checking Supabase status..."

    cd "$PROJECT_ROOT/apps/web"

    if ! pnpm supabase status >/dev/null 2>&1; then
        print_error "Supabase is not running. Please start it first:"
        echo "  cd apps/web && pnpm supabase start"
        exit 1
    fi

    print_success "Supabase is running"
}

# Function to setup test environment
setup_test_environment() {
    print_status "Setting up test environment..."

    cd "$PROJECT_ROOT/apps/web"

    # Create results directory
    mkdir -p "$RESULTS_DIR"

    # Reset database to clean state
    print_status "Resetting database..."
    pnpm supabase:web:reset

    # Load test data
    print_status "Loading test data..."
    if ! psql "$(pnpm supabase status | grep 'DB URL' | awk '{print $3}')" -f "$SETUP_FILE" > "$RESULTS_DIR/setup_${TIMESTAMP}.log" 2>&1; then
        print_error "Failed to load test data. Check $RESULTS_DIR/setup_${TIMESTAMP}.log"
        exit 1
    fi

    print_success "Test environment ready"
}

# Function to run performance benchmarks
run_performance_benchmarks() {
    local output_file="$1"
    local test_name="$2"

    print_status "Running performance benchmarks ($test_name)..."

    cd "$PROJECT_ROOT/apps/web"

    # Add timestamp and test info to output
    {
        echo "# RLS Performance Benchmark Results"
        echo "# Test: $test_name"
        echo "# Timestamp: $(date)"
        echo "# Database: $(pnpm supabase status | grep 'DB URL' | awk '{print $3}')"
        echo ""
    } > "$output_file"

    # Run benchmarks
    if ! psql "$(pnpm supabase status | grep 'DB URL' | awk '{print $3}')" -f "$BENCHMARK_FILE" >> "$output_file" 2>&1; then
        print_error "Performance benchmarks failed. Check $output_file"
        return 1
    fi

    print_success "Performance benchmarks completed: $output_file"
}

# Function to run security validation
run_security_validation() {
    local output_file="$1"
    local test_name="$2"

    print_status "Running security validation ($test_name)..."

    cd "$PROJECT_ROOT/apps/web"

    # Add timestamp and test info to output
    {
        echo "# RLS Security Validation Results"
        echo "# Test: $test_name"
        echo "# Timestamp: $(date)"
        echo "# Database: $(pnpm supabase status | grep 'DB URL' | awk '{print $3}')"
        echo ""
    } > "$output_file"

    # Run security tests
    if ! psql "$(pnpm supabase status | grep 'DB URL' | awk '{print $3}')" -f "$SECURITY_FILE" >> "$output_file" 2>&1; then
        print_error "Security validation failed. Check $output_file"
        return 1
    fi

    # Check for security violations
    if grep -q "SECURITY VIOLATION\|EXCEPTION" "$output_file"; then
        print_error "Security violations detected! Check $output_file"
        return 1
    fi

    print_success "Security validation passed: $output_file"
}

# Function to run baseline tests
run_baseline_tests() {
    print_status "Running baseline tests (BEFORE migration)..."

    setup_test_environment

    run_performance_benchmarks "$BASELINE_PERF" "Baseline (Before Migration)"
    run_security_validation "$BASELINE_SEC" "Baseline (Before Migration)"

    print_success "Baseline tests completed"
    echo "Results saved to:"
    echo "  Performance: $BASELINE_PERF"
    echo "  Security: $BASELINE_SEC"
}

# Function to run post-migration tests
run_post_migration_tests() {
    print_status "Running post-migration tests (AFTER migration)..."

    # Don't reset database - assume migration has been applied
    print_status "Using existing database state (migration should be applied)"

    # Verify test data still exists
    cd "$PROJECT_ROOT/apps/web"
    local test_data_count
    test_data_count=$(psql "$(pnpm supabase status | grep 'DB URL' | awk '{print $3}')" -t -c "SELECT COUNT(*) FROM public.survey_responses WHERE user_id = '11111111-1111-1111-1111-111111111111'::UUID;")

    if [ "$test_data_count" -eq 0 ]; then
        print_warning "Test data not found. Reloading..."
        psql "$(pnpm supabase status | grep 'DB URL' | awk '{print $3}')" -f "$SETUP_FILE" > "$RESULTS_DIR/reload_${TIMESTAMP}.log" 2>&1
    fi

    run_performance_benchmarks "$OPTIMIZED_PERF" "Post-Migration (After Optimization)"
    run_security_validation "$OPTIMIZED_SEC" "Post-Migration (After Optimization)"

    print_success "Post-migration tests completed"
    echo "Results saved to:"
    echo "  Performance: $OPTIMIZED_PERF"
    echo "  Security: $OPTIMIZED_SEC"
}

# Function to extract performance metrics
extract_performance_metrics() {
    local file="$1"

    # Extract execution times from EXPLAIN ANALYZE output
    grep -E "Execution Time:|execution time:|Total runtime:" "$file" | \
        sed 's/.*Execution Time: \([0-9.]*\) ms.*/\1/' | \
        sed 's/.*execution time: \([0-9.]*\) ms.*/\1/' | \
        sed 's/.*Total runtime: \([0-9.]*\) ms.*/\1/'
}

# Function to compare results
compare_results() {
    print_status "Comparing baseline vs post-migration results..."

    # Find most recent baseline and optimized files
    local latest_baseline_perf latest_optimized_perf latest_baseline_sec latest_optimized_sec
    latest_baseline_perf=$(ls -t "$RESULTS_DIR"/baseline_performance_*.log 2>/dev/null | head -1)
    latest_optimized_perf=$(ls -t "$RESULTS_DIR"/optimized_performance_*.log 2>/dev/null | head -1)
    latest_baseline_sec=$(ls -t "$RESULTS_DIR"/baseline_security_*.log 2>/dev/null | head -1)
    latest_optimized_sec=$(ls -t "$RESULTS_DIR"/optimized_security_*.log 2>/dev/null | head -1)

    if [[ -z "$latest_baseline_perf" || -z "$latest_optimized_perf" ]]; then
        print_error "Missing performance test results. Run baseline and post-migration tests first."
        exit 1
    fi

    # Generate comparison report
    {
        echo "# RLS Performance Test Comparison Report"
        echo "Generated: $(date)"
        echo ""
        echo "## Test Files Compared"
        echo "- Baseline Performance: $(basename "$latest_baseline_perf")"
        echo "- Optimized Performance: $(basename "$latest_optimized_perf")"
        echo "- Baseline Security: $(basename "$latest_baseline_sec")"
        echo "- Optimized Security: $(basename "$latest_optimized_sec")"
        echo ""
        echo "## Performance Comparison"
        echo ""

        # Extract and compare execution times
        echo "### Execution Times"
        echo ""
        echo "| Test | Baseline (ms) | Optimized (ms) | Improvement |"
        echo "|------|---------------|----------------|-------------|"

        # This is a simplified comparison - would need more sophisticated parsing for real metrics
        local baseline_count optimized_count
        baseline_count=$(grep -c "Execution Time\|execution time" "$latest_baseline_perf" 2>/dev/null || echo "0")
        optimized_count=$(grep -c "Execution Time\|execution time" "$latest_optimized_perf" 2>/dev/null || echo "0")

        echo "| Query Count | $baseline_count | $optimized_count | N/A |"
        echo ""

        echo "## Security Validation"
        echo ""

        # Check security test results
        local baseline_sec_status optimized_sec_status
        if grep -q "All security validations PASSED" "$latest_baseline_sec" 2>/dev/null; then
            baseline_sec_status="✅ PASSED"
        else
            baseline_sec_status="❌ FAILED"
        fi

        if grep -q "All security validations PASSED" "$latest_optimized_sec" 2>/dev/null; then
            optimized_sec_status="✅ PASSED"
        else
            optimized_sec_status="❌ FAILED"
        fi

        echo "- Baseline Security: $baseline_sec_status"
        echo "- Optimized Security: $optimized_sec_status"
        echo ""

        echo "## Detailed Analysis"
        echo ""
        echo "### Performance Analysis"
        echo ""
        echo "For detailed performance metrics, see:"
        echo "- Baseline: $latest_baseline_perf"
        echo "- Optimized: $latest_optimized_perf"
        echo ""
        echo "### Security Analysis"
        echo ""
        echo "For detailed security test results, see:"
        echo "- Baseline: $latest_baseline_sec"
        echo "- Optimized: $latest_optimized_sec"
        echo ""

        echo "## Summary"
        echo ""
        if [[ "$baseline_sec_status" == *"PASSED"* && "$optimized_sec_status" == *"PASSED"* ]]; then
            echo "✅ **Security validation PASSED for both baseline and optimized versions**"
        else
            echo "❌ **Security validation FAILED** - Review security test results before deployment"
        fi
        echo ""
        echo "Performance improvements should be visible in the optimized results."
        echo "Look for reduced execution times and improved query plans."

    } > "$COMPARISON_REPORT"

    print_success "Comparison report generated: $COMPARISON_REPORT"

    # Display summary
    echo ""
    print_status "=== COMPARISON SUMMARY ==="
    echo "Security Status:"
    echo "  Baseline:  $baseline_sec_status"
    echo "  Optimized: $optimized_sec_status"
    echo ""
    echo "Full report: $COMPARISON_REPORT"
    echo ""
}

# Function to run complete test suite
run_complete_tests() {
    print_status "Running complete RLS performance test suite..."

    echo ""
    echo "This will:"
    echo "1. Run baseline tests (before migration)"
    echo "2. Prompt you to apply the migration"
    echo "3. Run post-migration tests"
    echo "4. Generate comparison report"
    echo ""

    # Run baseline tests
    run_baseline_tests

    echo ""
    print_warning "=== APPLY MIGRATION NOW ==="
    echo "Please apply your RLS performance migration now."
    echo "Example commands:"
    echo "  cd apps/web"
    echo "  pnpm supabase migration up"
    echo ""
    read -p "Press Enter after applying the migration to continue..."
    echo ""

    # Run post-migration tests
    run_post_migration_tests

    # Compare results
    compare_results

    print_success "Complete test suite finished!"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [--baseline|--post-migration|--compare|--help]"
    echo ""
    echo "Options:"
    echo "  --baseline       Run baseline tests before migration"
    echo "  --post-migration Run tests after migration"
    echo "  --compare        Compare baseline vs post-migration results"
    echo "  --help           Show this help message"
    echo "  (no flags)       Run complete test suite"
    echo ""
    echo "Test Results Location: $RESULTS_DIR"
    echo ""
}

# Main script logic
main() {
    local mode="$1"

    echo "=== RLS Performance Testing Framework ==="
    echo "GitHub Issue #345 - Critical RLS performance validation"
    echo ""

    case "$mode" in
        --baseline)
            check_supabase
            run_baseline_tests
            ;;
        --post-migration)
            check_supabase
            run_post_migration_tests
            ;;
        --compare)
            compare_results
            ;;
        --help)
            show_usage
            ;;
        "")
            check_supabase
            run_complete_tests
            ;;
        *)
            print_error "Unknown option: $mode"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"