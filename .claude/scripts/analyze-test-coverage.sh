#!/bin/bash
# Analyzes test coverage and updates statistics in the unit test checklist
# Run this script to get current test coverage status

echo "=== Unit Test Coverage Analysis ==="
echo "Analyzing codebase for test files..."

# Count total TypeScript files in priority areas (excluding test files, configs, and UI components)
TOTAL_FILES=$(find apps/web/app/home/\(user\)/ai apps/web/app/home/\(user\)/course apps/payload/src/collections apps/payload/src/lib apps/payload/src/blocks apps/web/app/api apps/web/app/home/\(user\)/kanban -name "*.ts" -o -name "*.tsx" 2>/dev/null | \
  grep -v -E "(test|spec|config|\.d\.ts|node_modules|_components|layout|page|loading|error)" | \
  grep -E "(_actions|_lib/utils|_lib/services|_lib/server|collections|blocks|lib|api|route\.ts)" | \
  sort -u | \
  wc -l)

# Count files with corresponding test files
FILES_WITH_TESTS=0
TEST_FILES=""

echo ""
echo "Checking for test files..."

# Priority 1: AI Canvas/Editor System
for file in $(find apps/web/app/home/\(user\)/ai/canvas -name "*.ts" 2>/dev/null | grep -E "(_actions|_lib/utils|_lib/services)" | grep -v -E "(test|spec)"); do
  base=$(basename "$file" .ts)
  dir=$(dirname "$file")
  
  # Check for test file in same directory or __tests__ subdirectory
  if [ -f "$dir/${base}.test.ts" ] || [ -f "$dir/${base}.spec.ts" ] || \
     [ -f "$dir/__tests__/${base}.test.ts" ] || [ -f "$dir/__tests__/${base}.spec.ts" ]; then
    FILES_WITH_TESTS=$((FILES_WITH_TESTS + 1))
    TEST_FILES="$TEST_FILES\n✓ $file"
  fi
done

# Priority 1: Storyboard System
for file in $(find apps/web/app/home/\(user\)/ai/storyboard -name "*.ts" 2>/dev/null | grep -E "(_lib/services|_actions)" | grep -v -E "(test|spec)"); do
  base=$(basename "$file" .ts)
  dir=$(dirname "$file")
  
  if [ -f "$dir/${base}.test.ts" ] || [ -f "$dir/${base}.spec.ts" ] || \
     [ -f "$dir/__tests__/${base}.test.ts" ] || [ -f "$dir/__tests__/${base}.spec.ts" ]; then
    FILES_WITH_TESTS=$((FILES_WITH_TESTS + 1))
    TEST_FILES="$TEST_FILES\n✓ $file"
  fi
done

# Priority 2: Payload Collections and Libraries
for file in $(find apps/payload/src/collections apps/payload/src/lib -name "*.ts" 2>/dev/null | grep -v -E "(test|spec|\.d\.ts)"); do
  base=$(basename "$file" .ts)
  dir=$(dirname "$file")
  
  if [ -f "$dir/${base}.test.ts" ] || [ -f "$dir/${base}.spec.ts" ]; then
    FILES_WITH_TESTS=$((FILES_WITH_TESTS + 1))
    TEST_FILES="$TEST_FILES\n✓ $file"
  fi
done

# Calculate coverage percentage
if [ $TOTAL_FILES -gt 0 ]; then
  COVERAGE=$(awk "BEGIN {printf \"%.1f\", ($FILES_WITH_TESTS / $TOTAL_FILES) * 100}")
else
  COVERAGE="0.0"
fi

echo ""
echo "=== Summary ==="
echo "Total testable files: $TOTAL_FILES"
echo "Files with tests: $FILES_WITH_TESTS"
echo "Coverage: $COVERAGE%"

if [ -n "$TEST_FILES" ]; then
  echo ""
  echo "Files with tests:"
  echo -e "$TEST_FILES"
fi

echo ""
echo "=== High Priority Files Without Tests ==="

# List high priority files without tests
echo ""
echo "AI Canvas/Editor System:"
find apps/web/app/home/\(user\)/ai/canvas/_actions -name "*.ts" 2>/dev/null | while read -r file; do
  base=$(basename "$file" .ts)
  dir=$(dirname "$file")
  if ! [ -f "$dir/${base}.test.ts" ] && ! [ -f "$dir/${base}.spec.ts" ] && \
     ! [ -f "$dir/__tests__/${base}.test.ts" ] && ! [ -f "$dir/__tests__/${base}.spec.ts" ]; then
    echo "  ❌ $file"
  fi
done

echo ""
echo "Storyboard System:"
find apps/web/app/home/\(user\)/ai/storyboard/_lib/services -name "*.ts" 2>/dev/null | while read -r file; do
  base=$(basename "$file" .ts)
  dir=$(dirname "$file")
  if ! [ -f "$dir/${base}.test.ts" ] && ! [ -f "$dir/${base}.spec.ts" ]; then
    echo "  ❌ $file"
  fi
done

echo ""
echo "To update the checklist, run:"
echo "  Update 'Total Files' to: $TOTAL_FILES"
echo "  Update 'Files with Tests' to: $FILES_WITH_TESTS"
echo "  Update 'Coverage' to: $COVERAGE%"
echo "  Update 'Last Updated' to: $(date +%Y-%m-%d)"