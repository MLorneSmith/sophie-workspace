#!/bin/bash

# Test Database Manager Script
# Manages test coverage database operations for unit test writer

set -euo pipefail

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
DB_PATH="$PROJECT_ROOT/.claude/data/test-coverage-db.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to read highest priority test
read_priority_test() {
    local test_type="${1:-unit}"
    
    if [ ! -f "$DB_PATH" ]; then
        echo -e "${YELLOW}⚠️  No test coverage database found at: $DB_PATH${NC}"
        echo "   Run /test-discovery first to generate the database."
        exit 1
    fi
    
    echo -e "${BLUE}🔍 Reading test coverage database...${NC}"
    
    # Extract highest priority test
    local priority_data=$(jq -r --arg type "$test_type" '
        .priorityQueue[] | 
        select(.testType == $type) | 
        "\(.file)|\(.score)|\(.reason)|\(.package // "unknown")"
    ' "$DB_PATH" | head -1)
    
    if [ -z "$priority_data" ]; then
        echo -e "${GREEN}✅ All priority $test_type tests completed!${NC}"
        exit 0
    fi
    
    # Parse the data
    IFS='|' read -r file score reason package <<< "$priority_data"
    
    # Get suggested tests
    local suggested_tests=$(jq -r --arg file "$file" '
        .priorityQueue[] | 
        select(.file == $file) | 
        .suggestedTests[]?
    ' "$DB_PATH" 2>/dev/null | head -5)
    
    # Output in structured format for parsing
    echo "PRIORITY_FILE=$file"
    echo "PRIORITY_SCORE=$score"
    echo "PRIORITY_REASON=$reason"
    echo "PRIORITY_PACKAGE=$package"
    
    # Display human-readable format
    echo -e "\n${GREEN}📊 Highest Priority Unit Test:${NC}"
    echo "   File: $file"
    echo "   Score: $score/100"
    echo "   Reason: $reason"
    echo "   Package: $package"
    
    if [ -n "$suggested_tests" ]; then
        echo "   Suggested Tests:"
        echo "$suggested_tests" | while IFS= read -r test; do
            [ -n "$test" ] && echo "     - $test"
        done
    fi
    
    # Find actual file location
    local actual_file=""
    if [ -f "$PROJECT_ROOT/$file" ]; then
        actual_file="$PROJECT_ROOT/$file"
    else
        local filename=$(basename "$file")
        actual_file=$(find "$PROJECT_ROOT" -name "$filename" -type f 2>/dev/null | head -1)
    fi
    
    if [ -n "$actual_file" ]; then
        echo -e "   ${GREEN}📍 Found at: $actual_file${NC}"
        echo "ACTUAL_FILE=$actual_file"
    else
        echo -e "   ${RED}❌ File not found in repository${NC}"
        echo "ACTUAL_FILE="
    fi
}

# Function to update database after test creation
update_test_database() {
    local source_file="$1"
    local test_file="$2"
    local test_count="${3:-0}"
    
    if [ ! -f "$DB_PATH" ]; then
        echo -e "${YELLOW}⚠️  No database to update${NC}"
        return 1
    fi
    
    # Remove from priority queue
    local temp_file=$(mktemp)
    jq --arg file "$source_file" '
        .priorityQueue = [.priorityQueue[] | select(.file != $file)]
    ' "$DB_PATH" > "$temp_file"
    
    # Update package stats if package info exists
    local package=$(dirname "$source_file" | sed 's|.*/packages/features/||' | cut -d'/' -f1)
    if [ -n "$package" ] && [ "$package" != "$source_file" ]; then
        jq --arg pkg "$package" \
           --arg testFile "$test_file" \
           --argjson count "$test_count" '
            if .packages[$pkg] then
                .packages[$pkg].testFiles = ((.packages[$pkg].testFiles // 0) + 1) |
                .packages[$pkg].testCases = ((.packages[$pkg].testCases // 0) + $count)
            else . end
        ' "$temp_file" > "${temp_file}.2"
        mv "${temp_file}.2" "$temp_file"
    fi
    
    # Update timestamp
    jq --arg updated "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '
        .lastUpdated = $updated
    ' "$temp_file" > "$DB_PATH"
    
    rm -f "$temp_file"
    
    echo -e "${GREEN}✅ Updated test coverage database${NC}"
    echo "   Removed $source_file from priority queue"
    [ -n "$package" ] && echo "   Added $test_count tests to $package package"
    
    # Show next priority
    local next_file=$(jq -r '.priorityQueue[] | select(.testType == "unit") | .file' "$DB_PATH" 2>/dev/null | head -1)
    if [ -n "$next_file" ]; then
        echo -e "   ${BLUE}📌 Next priority: $next_file${NC}"
    else
        echo -e "   ${GREEN}🎉 All priority unit tests completed!${NC}"
    fi
}

# Function to get test statistics
get_test_stats() {
    if [ ! -f "$DB_PATH" ]; then
        echo -e "${YELLOW}⚠️  No database found${NC}"
        return 1
    fi
    
    local total_priority=$(jq '.priorityQueue | length' "$DB_PATH")
    local unit_priority=$(jq '[.priorityQueue[] | select(.testType == "unit")] | length' "$DB_PATH")
    local total_packages=$(jq '.packages | length' "$DB_PATH")
    
    echo -e "${BLUE}📊 Test Coverage Statistics:${NC}"
    echo "   Total priority items: $total_priority"
    echo "   Unit test priorities: $unit_priority"
    echo "   Packages tracked: $total_packages"
    
    # Show package breakdown if requested
    if [ "${1:-}" = "--packages" ]; then
        echo -e "\n${BLUE}Package Breakdown:${NC}"
        jq -r '.packages | to_entries[] | 
            "   \(.key): \(.value.testFiles // 0) files, \(.value.testCases // 0) tests"
        ' "$DB_PATH"
    fi
}

# Main command handling
case "${1:-read}" in
    read)
        read_priority_test "${2:-unit}"
        ;;
    update)
        if [ $# -lt 3 ]; then
            echo "Usage: $0 update <source_file> <test_file> [test_count]"
            exit 1
        fi
        update_test_database "$2" "$3" "${4:-0}"
        ;;
    stats)
        get_test_stats "${2:-}"
        ;;
    *)
        echo "Usage: $0 {read|update|stats} [options]"
        echo "  read [type]           - Read highest priority test (default: unit)"
        echo "  update <src> <test> [count] - Update database after test creation"
        echo "  stats [--packages]    - Show test statistics"
        exit 1
        ;;
esac