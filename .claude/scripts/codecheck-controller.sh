#!/bin/bash

# Codecheck Controller Script
# This script ensures proper status file creation and updates for the statusline
# It wraps the actual codecheck execution to guarantee status tracking

set -euo pipefail

# Get git root for consistent status file path
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
STATUS_FILE="/tmp/.claude_codecheck_status_${GIT_ROOT//\//_}"
WORK_DIR="/tmp/codecheck_$(date +%s)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure status file is created at start
echo "running|$(date +%s)|0|0|0" > "$STATUS_FILE"
echo -e "${BLUE}🔍 Codecheck starting...${NC}"
echo "Status file: $STATUS_FILE"

# Trap to ensure status file is updated on exit
cleanup() {
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo "success|$(date +%s)|0|0|0" > "$STATUS_FILE"
        echo -e "${GREEN}✅ Codecheck completed successfully${NC}"
    else
        # Try to extract error counts from output
        local errors=${TOTAL_ERRORS:-1}
        local warnings=${TOTAL_WARNINGS:-0}
        local type_errors=${TYPE_ERRORS:-0}
        echo "failed|$(date +%s)|$errors|$warnings|$type_errors" > "$STATUS_FILE"
        echo -e "${RED}❌ Codecheck failed with $errors errors${NC}"
    fi
    
    # Clean up work directory
    rm -rf "$WORK_DIR"
}

trap cleanup EXIT

# Create work directory
mkdir -p "$WORK_DIR"

# Initialize counters
TOTAL_ERRORS=0
TOTAL_WARNINGS=0
TYPE_ERRORS=0

# Function to run a check command and update counters
run_check() {
    local cmd="$1"
    local name="$2"
    local output_file="$WORK_DIR/${name}.log"
    
    echo -e "${BLUE}Running ${name}...${NC}"
    
    # Run command and capture output
    if $cmd > "$output_file" 2>&1; then
        echo -e "${GREEN}  ✓ ${name} passed${NC}"
        return 0
    else
        local exit_code=$?
        echo -e "${RED}  ✗ ${name} failed${NC}"
        
        # Try to extract error counts
        if grep -qE "Found [0-9]+ error" "$output_file"; then
            local errors=$(grep -oE "Found ([0-9]+) error" "$output_file" | grep -oE "[0-9]+" | head -1 || echo "0")
            if [ "$name" = "typecheck" ]; then
                TYPE_ERRORS=$((TYPE_ERRORS + errors))
            else
                TOTAL_ERRORS=$((TOTAL_ERRORS + errors))
            fi
        fi
        
        if grep -qE "error TS[0-9]+" "$output_file"; then
            local ts_count=$(grep -cE "error TS[0-9]+" "$output_file" || echo "0")
            TYPE_ERRORS=$((TYPE_ERRORS + ts_count))
        fi
        
        if grep -qE "Found [0-9]+ warning" "$output_file"; then
            local warnings=$(grep -oE "Found ([0-9]+) warning" "$output_file" | grep -oE "[0-9]+" | head -1 || echo "0")
            TOTAL_WARNINGS=$((TOTAL_WARNINGS + warnings))
        fi
        
        # Show first few lines of errors
        echo "  First errors:"
        head -n 5 "$output_file" | sed 's/^/    /'
        
        return $exit_code
    fi
}

# Track overall success
ALL_SUCCESS=true

# Phase 1: TypeScript Check (blocking)
echo -e "\n${YELLOW}📋 Phase 1: TypeScript Check${NC}"
if ! run_check "pnpm typecheck:raw --force" "typecheck"; then
    ALL_SUCCESS=false
    # TypeScript errors are blocking, but continue to get full picture
fi

# Update status file with interim results
TOTAL_ERRORS=$((TOTAL_ERRORS + TYPE_ERRORS))
echo "running|$(date +%s)|$TOTAL_ERRORS|$TOTAL_WARNINGS|$TYPE_ERRORS" > "$STATUS_FILE"

# Phase 2: Linting
echo -e "\n${YELLOW}📋 Phase 2: Linting${NC}"
if ! run_check "pnpm lint" "lint-js"; then
    ALL_SUCCESS=false
fi

if ! run_check "pnpm lint:yaml" "lint-yaml"; then
    ALL_SUCCESS=false
fi

if ! run_check "pnpm lint:md" "lint-markdown"; then
    ALL_SUCCESS=false
fi

# Update status file with interim results
echo "running|$(date +%s)|$TOTAL_ERRORS|$TOTAL_WARNINGS|$TYPE_ERRORS" > "$STATUS_FILE"

# Phase 3: Formatting
echo -e "\n${YELLOW}📋 Phase 3: Formatting${NC}"
if ! run_check "pnpm format" "format"; then
    ALL_SUCCESS=false
fi

# Final summary
echo -e "\n${YELLOW}📊 Summary${NC}"
echo "  Total errors: $TOTAL_ERRORS"
echo "  Type errors: $TYPE_ERRORS"
echo "  Warnings: $TOTAL_WARNINGS"

# Exit with appropriate code (cleanup trap will update status file)
if [ "$ALL_SUCCESS" = true ]; then
    exit 0
else
    exit 1
fi