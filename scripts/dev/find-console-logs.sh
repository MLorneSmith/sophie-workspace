#!/bin/bash

# Script to find all TypeScript/JavaScript files containing console statements
# Excludes node_modules, dist, build, and test files

echo "Finding files with console.log/error/warn/debug/info statements..."
echo "================================================"

# Find files, excluding common directories
find . \
  -type f \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -not -path "*/.next/*" \
  -not -path "*/playwright-report/*" \
  -not -path "*/coverage/*" \
  -not -path "*/.turbo/*" \
  -exec grep -l "console\.\(log\|error\|warn\|debug\|info\)" {} \; \
  | sort > console-files.txt

# Count the files
FILE_COUNT=$(wc -l < console-files.txt)

echo "Found $FILE_COUNT files with console statements"
echo "Results saved to: console-files.txt"
echo ""
echo "To migrate all files at once, run:"
echo "  node scripts/migrate-to-logger.js --from-file console-files.txt"
echo ""
echo "To migrate specific files, run:"
echo "  node scripts/migrate-to-logger.js path/to/file1.ts path/to/file2.ts"
echo ""
echo "Preview of files found:"
head -20 console-files.txt