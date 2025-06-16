#!/bin/bash

# Console.log Migration Helper Script
# This script helps identify and migrate console.log statements to the enhanced logger

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Console.log Migration Helper${NC}"
echo -e "${BLUE}================================${NC}\n"

# Function to count console usage
count_console_usage() {
    local path=$1
    local count=$(rg "console\.(log|error|warn|debug|info)" "$path" --type-add 'tsx:*.tsx' --type-add 'ts:*.ts' -t tsx -t ts 2>/dev/null | grep -v node_modules | grep -v "biome-ignore" | wc -l)
    echo $count
}

# Function to find files with console usage
find_console_files() {
    local path=$1
    rg -l "console\.(log|error|warn|debug|info)" "$path" --type-add 'tsx:*.tsx' --type-add 'ts:*.ts' -t tsx -t ts 2>/dev/null | grep -v node_modules | grep -v "\.d\.ts" | sort
}

# Main menu
show_menu() {
    echo -e "${YELLOW}What would you like to do?${NC}"
    echo "1. Show console usage statistics"
    echo "2. List files with console usage"
    echo "3. Show console usage by directory"
    echo "4. Generate migration report"
    echo "5. Show migration guide"
    echo "6. Exit"
    echo
    read -p "Select an option (1-6): " choice
}

# Show statistics
show_stats() {
    echo -e "\n${BLUE}📊 Console Usage Statistics${NC}"
    echo -e "${BLUE}===========================${NC}\n"
    
    local total=$(count_console_usage ".")
    local apps_count=$(count_console_usage "apps")
    local packages_count=$(count_console_usage "packages")
    
    echo -e "Total console statements: ${RED}$total${NC}"
    echo -e "In apps/: ${YELLOW}$apps_count${NC}"
    echo -e "In packages/: ${YELLOW}$packages_count${NC}"
    
    echo -e "\n${BLUE}Breakdown by type:${NC}"
    echo -e "console.log:   $(rg "console\.log" --type-add 'tsx:*.tsx' --type-add 'ts:*.ts' -t tsx -t ts | grep -v node_modules | wc -l)"
    echo -e "console.error: $(rg "console\.error" --type-add 'tsx:*.tsx' --type-add 'ts:*.ts' -t tsx -t ts | grep -v node_modules | wc -l)"
    echo -e "console.warn:  $(rg "console\.warn" --type-add 'tsx:*.tsx' --type-add 'ts:*.ts' -t tsx -t ts | grep -v node_modules | wc -l)"
    echo
}

# List files
list_files() {
    echo -e "\n${BLUE}📁 Files with Console Usage${NC}"
    echo -e "${BLUE}===========================${NC}\n"
    
    local files=$(find_console_files ".")
    local count=$(echo "$files" | wc -l)
    
    echo -e "Found ${RED}$count${NC} files with console usage:\n"
    
    # Group by directory
    echo "$files" | while read -r file; do
        local dir=$(dirname "$file")
        local instances=$(rg "console\.(log|error|warn|debug|info)" "$file" --type-add 'tsx:*.tsx' --type-add 'ts:*.ts' -t tsx -t ts | wc -l)
        echo -e "${YELLOW}$file${NC} (${instances} instances)"
    done | sort -k2 -nr
    echo
}

# Show by directory
show_by_directory() {
    echo -e "\n${BLUE}📂 Console Usage by Directory${NC}"
    echo -e "${BLUE}=============================${NC}\n"
    
    # Find all directories with TypeScript files
    find . -type f \( -name "*.ts" -o -name "*.tsx" \) | grep -v node_modules | xargs dirname | sort | uniq | while read -r dir; do
        local count=$(count_console_usage "$dir")
        if [ "$count" -gt 0 ]; then
            echo -e "${YELLOW}$dir${NC}: ${count} instances"
        fi
    done | sort -k2 -nr
    echo
}

# Generate migration report
generate_report() {
    local report_file="console-migration-report-$(date +%Y%m%d-%H%M%S).md"
    
    echo -e "\n${BLUE}📝 Generating Migration Report...${NC}"
    
    cat > "$report_file" << EOF
# Console.log Migration Report
Generated: $(date)

## Summary
- Total console statements: $(count_console_usage ".")
- Files affected: $(find_console_files "." | wc -l)

## Priority Files (Most console usage)
EOF

    # Add top 10 files with most console usage
    echo -e "\n### Top 10 Files\n" >> "$report_file"
    find_console_files "." | while read -r file; do
        local count=$(rg "console\.(log|error|warn|debug|info)" "$file" --type-add 'tsx:*.tsx' --type-add 'ts:*.ts' -t tsx -t ts | wc -l)
        echo "$count $file"
    done | sort -nr | head -10 | while read -r count file; do
        echo "- \`$file\` ($count instances)" >> "$report_file"
    done

    # Add files by feature area
    echo -e "\n### By Feature Area\n" >> "$report_file"
    
    # Group common feature areas
    local areas=(
        "apps/web/app/home"
        "apps/web/app/api"
        "apps/web/app/admin"
        "apps/web/lib"
        "packages/features"
        "packages/billing"
        "packages/shared"
    )
    
    for area in "${areas[@]}"; do
        if [ -d "$area" ]; then
            local area_count=$(count_console_usage "$area")
            if [ "$area_count" -gt 0 ]; then
                echo -e "\n#### $area ($area_count instances)" >> "$report_file"
                find_console_files "$area" | head -5 | while read -r file; do
                    local count=$(rg "console\.(log|error|warn|debug|info)" "$file" --type-add 'tsx:*.tsx' --type-add 'ts:*.ts' -t tsx -t ts | wc -l)
                    echo "- \`$file\` ($count)" >> "$report_file"
                done
            fi
        fi
    done
    
    echo -e "\n## Next Steps\n" >> "$report_file"
    echo "1. Start with files that have the most console usage" >> "$report_file"
    echo "2. Group related files by service/feature for consistency" >> "$report_file"
    echo "3. Run \`pnpm biome check\` after each migration" >> "$report_file"
    echo "4. Test functionality after migration" >> "$report_file"
    
    echo -e "\n${GREEN}✅ Report generated: $report_file${NC}\n"
}

# Show migration guide
show_guide() {
    if [ -f ".claude/scripts/migrate-console-logs.md" ]; then
        less ".claude/scripts/migrate-console-logs.md"
    else
        echo -e "${RED}Migration guide not found at .claude/scripts/migrate-console-logs.md${NC}"
    fi
}

# Check if ripgrep is installed
if ! command -v rg &> /dev/null; then
    echo -e "${RED}Error: ripgrep (rg) is not installed. Please install it first.${NC}"
    exit 1
fi

# Main loop
while true; do
    show_menu
    
    case $choice in
        1) show_stats ;;
        2) list_files ;;
        3) show_by_directory ;;
        4) generate_report ;;
        5) show_guide ;;
        6) 
            echo -e "\n${GREEN}👋 Happy migrating!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please try again.${NC}\n"
            ;;
    esac
    
    echo
    read -p "Press Enter to continue..."
    clear
done