#!/bin/bash

# Coverage Helper Script
# Lightweight wrapper around Vitest's built-in coverage capabilities

set -euo pipefail

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run coverage for a specific test file
run_test_coverage() {
    local test_file="$1"
    local source_file="${2:-}"
    
    echo -e "${BLUE}📊 Running coverage analysis...${NC}"
    
    # Determine coverage include pattern
    local coverage_include=""
    if [ -n "$source_file" ]; then
        coverage_include="--coverage.include=$source_file"
    fi
    
    # Run vitest with coverage
    npx vitest run --coverage \
        --coverage.reporter=text,json-summary \
        --coverage.enabled \
        $coverage_include \
        "$test_file" 2>&1
    
    # Check if coverage file was generated
    if [ -f "$PROJECT_ROOT/coverage/coverage-summary.json" ]; then
        echo -e "\n${GREEN}✅ Coverage report generated${NC}"
        parse_coverage_summary
    else
        echo -e "${YELLOW}⚠️  No coverage summary generated${NC}"
    fi
}

# Function to parse and display coverage summary
parse_coverage_summary() {
    local coverage_file="$PROJECT_ROOT/coverage/coverage-summary.json"
    
    if [ ! -f "$coverage_file" ]; then
        echo -e "${YELLOW}⚠️  Coverage summary not found${NC}"
        return 1
    fi
    
    # Extract coverage percentages using jq
    local lines_pct=$(jq -r '.total.lines.pct // 0' "$coverage_file")
    local branches_pct=$(jq -r '.total.branches.pct // 0' "$coverage_file")
    local functions_pct=$(jq -r '.total.functions.pct // 0' "$coverage_file")
    local statements_pct=$(jq -r '.total.statements.pct // 0' "$coverage_file")
    
    echo -e "\n${BLUE}📈 Coverage Summary:${NC}"
    echo "   Lines:      $(format_percentage $lines_pct)"
    echo "   Branches:   $(format_percentage $branches_pct)"
    echo "   Functions:  $(format_percentage $functions_pct)"
    echo "   Statements: $(format_percentage $statements_pct)"
    
    # Check against thresholds (70% default)
    local threshold=70
    if (( $(echo "$lines_pct < $threshold" | bc -l) )); then
        echo -e "\n${YELLOW}⚠️  Line coverage below $threshold%${NC}"
        echo "   Consider adding more tests to improve coverage"
    else
        echo -e "\n${GREEN}✅ Coverage meets threshold ($threshold%)${NC}"
    fi
}

# Function to format percentage with color
format_percentage() {
    local pct="$1"
    local color
    
    if (( $(echo "$pct >= 80" | bc -l) )); then
        color=$GREEN
    elif (( $(echo "$pct >= 70" | bc -l) )); then
        color=$YELLOW
    else
        color=$RED
    fi
    
    printf "${color}%.1f%%${NC}" "$pct"
}

# Function to get uncovered lines
get_uncovered_lines() {
    local source_file="$1"
    
    echo -e "${BLUE}🔍 Analyzing uncovered lines...${NC}"
    
    # Run coverage with detailed output
    npx vitest run --coverage \
        --coverage.reporter=text \
        --coverage.include="$source_file" \
        --coverage.all \
        2>&1 | grep -A 20 "Uncovered Line"
}

# Function to compare coverage before/after
compare_coverage() {
    local before_file="${1:-coverage-before.json}"
    local after_file="${2:-coverage/coverage-summary.json}"
    
    if [ ! -f "$before_file" ] || [ ! -f "$after_file" ]; then
        echo -e "${YELLOW}⚠️  Cannot compare: missing coverage files${NC}"
        return 1
    fi
    
    local before_lines=$(jq -r '.total.lines.pct // 0' "$before_file")
    local after_lines=$(jq -r '.total.lines.pct // 0' "$after_file")
    local improvement=$(echo "$after_lines - $before_lines" | bc)
    
    echo -e "\n${BLUE}📊 Coverage Improvement:${NC}"
    echo "   Before: $(format_percentage $before_lines)"
    echo "   After:  $(format_percentage $after_lines)"
    
    if (( $(echo "$improvement > 0" | bc -l) )); then
        echo -e "   ${GREEN}+${improvement}% improvement!${NC}"
    elif (( $(echo "$improvement < 0" | bc -l) )); then
        echo -e "   ${RED}${improvement}% regression${NC}"
    else
        echo -e "   ${YELLOW}No change${NC}"
    fi
}

# Main command handling
case "${1:-help}" in
    run)
        if [ $# -lt 2 ]; then
            echo "Usage: $0 run <test_file> [source_file]"
            exit 1
        fi
        run_test_coverage "$2" "${3:-}"
        ;;
    summary)
        parse_coverage_summary
        ;;
    uncovered)
        if [ $# -lt 2 ]; then
            echo "Usage: $0 uncovered <source_file>"
            exit 1
        fi
        get_uncovered_lines "$2"
        ;;
    compare)
        compare_coverage "${2:-}" "${3:-}"
        ;;
    *)
        echo "Usage: $0 {run|summary|uncovered|compare} [options]"
        echo "  run <test> [source]  - Run coverage for test file"
        echo "  summary             - Display coverage summary"
        echo "  uncovered <source>  - Show uncovered lines"
        echo "  compare [before] [after] - Compare coverage reports"
        exit 1
        ;;
esac