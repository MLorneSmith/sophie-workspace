#!/bin/bash

# Find all TypeScript/TSX files with console usage
# Excludes node_modules, dist, build, and other generated directories

echo "Finding all files with console statements..."

# Create output file
OUTPUT_FILE="console-files-to-migrate.txt"

# Find files and save to output
find . \
  -type f \
  \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -not -path "*/.ignored_*/*" \
  -not -path "*/coverage/*" \
  -not -path "*/test-results/*" \
  -not -path "*/playwright-report/*" \
  -not -path "*/temp-*/*" \
  -not -path "*/z.docs/*" \
  -not -path "*/z.old/*" \
  -not -path "*/z.test/*" \
  -not -path "*/.turbo/*" \
  -not -name "*.d.ts" \
  -exec grep -l "console\." {} \; | sort > "$OUTPUT_FILE"

# Count files
FILE_COUNT=$(wc -l < "$OUTPUT_FILE")

echo "Found $FILE_COUNT files with console statements"
echo "Results saved to: $OUTPUT_FILE"
echo ""
echo "To migrate these files, run:"
echo "node .claude/scripts/migrate-to-logger.js --from-file $OUTPUT_FILE"