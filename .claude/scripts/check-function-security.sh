#!/bin/bash

# Script: check-function-security.sh
# Purpose: Check PostgreSQL migration files for functions without explicit search_path
# Usage: ./check-function-security.sh [directory]

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default directory to check
MIGRATION_DIR="${1:-apps/web/supabase/migrations}"

echo "🔍 Checking PostgreSQL functions for security issues..."
echo "Directory: $MIGRATION_DIR"
echo ""

# Track issues found
ISSUES_FOUND=0
FILES_CHECKED=0

# Function to check a single file
check_file() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Skip verification scripts
    if [[ "$filename" == *"verify"* ]]; then
        return
    fi
    
    # Check if file contains function definitions
    if grep -q "CREATE\s\+\(OR\s\+REPLACE\s\+\)\?FUNCTION" "$file" 2>/dev/null; then
        FILES_CHECKED=$((FILES_CHECKED + 1))
        
        # Extract function definitions and check for search_path
        while IFS= read -r line_num; do
            # Get the function definition context (20 lines)
            local context=$(sed -n "${line_num},$((line_num + 20))p" "$file")
            
            # Check if this function has SET search_path
            if ! echo "$context" | grep -q "SET\s\+search_path"; then
                # Extract function name
                local func_name=$(echo "$context" | grep -oP "FUNCTION\s+\K[^\(]+" | head -1)
                
                if [[ -n "$func_name" ]]; then
                    echo -e "${RED}❌ Security Issue Found${NC}"
                    echo -e "   File: ${YELLOW}$file${NC}"
                    echo -e "   Line: ${YELLOW}$line_num${NC}"
                    echo -e "   Function: ${YELLOW}$func_name${NC}"
                    echo -e "   Issue: Missing ${RED}SET search_path${NC} declaration"
                    echo ""
                    ISSUES_FOUND=$((ISSUES_FOUND + 1))
                fi
            fi
        done < <(grep -n "CREATE\s\+\(OR\s\+REPLACE\s\+\)\?FUNCTION" "$file" | cut -d: -f1)
    fi
}

# Check all SQL files in the directory
if [[ -d "$MIGRATION_DIR" ]]; then
    while IFS= read -r -d '' file; do
        check_file "$file"
    done < <(find "$MIGRATION_DIR" -name "*.sql" -type f -print0 | sort -z)
else
    echo -e "${RED}Error: Directory not found: $MIGRATION_DIR${NC}"
    exit 1
fi

# Summary
echo "========================================"
echo "Security Check Summary"
echo "========================================"
echo "Files checked: $FILES_CHECKED"
echo "Security issues found: $ISSUES_FOUND"
echo ""

if [[ $ISSUES_FOUND -eq 0 ]]; then
    echo -e "${GREEN}✅ All functions have proper search_path security!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Found $ISSUES_FOUND functions without search_path set!${NC}"
    echo ""
    echo "To fix these issues:"
    echo "1. Add 'SET search_path = ''' to each function definition"
    echo "2. Use fully qualified table names (schema.table) in function bodies"
    echo "3. See .claude/docs/security/postgresql-function-security.md for details"
    echo ""
    echo "Example fix:"
    echo "  CREATE OR REPLACE FUNCTION public.my_function(...)"
    echo "  RETURNS ..."
    echo "  LANGUAGE plpgsql"
    echo "  SET search_path = ''  -- Add this line"
    echo "  AS \$\$"
    echo "  ..."
    echo "  \$\$;"
    exit 1
fi