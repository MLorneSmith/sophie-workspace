#!/bin/bash
# Type-check staged TypeScript files using project context
# This script is called by lint-staged to check TypeScript files

# Get the staged file path as the first argument
FILE_PATH="$1"

# If no file provided, exit
if [ -z "$FILE_PATH" ]; then
  echo "❌ No file path provided"
  exit 1
fi

echo "🔍 Type checking $FILE_PATH..."

# Determine which package/app the file belongs to
if [[ "$FILE_PATH" == apps/payload/* ]]; then
  # For Payload app files, use its tsconfig
  cd apps/payload && npx tsc --noEmit --skipLibCheck --project tsconfig.json
  exit_code=$?
elif [[ "$FILE_PATH" == apps/web/* ]]; then
  # For Web app files, use its tsconfig
  cd apps/web && npx tsc --noEmit --skipLibCheck --project tsconfig.json
  exit_code=$?
elif [[ "$FILE_PATH" == packages/* ]]; then
  # For package files, find the package directory and use its tsconfig
  PACKAGE_DIR=$(echo "$FILE_PATH" | cut -d'/' -f1-3)
  if [ -f "$PACKAGE_DIR/tsconfig.json" ]; then
    cd "$PACKAGE_DIR" && npx tsc --noEmit --skipLibCheck --project tsconfig.json
    exit_code=$?
  else
    # If no tsconfig in package, use root tsconfig
    npx tsc --noEmit --skipLibCheck --project tsconfig.json
    exit_code=$?
  fi
else
  # For other files, use root tsconfig
  npx tsc --noEmit --skipLibCheck --project tsconfig.json
  exit_code=$?
fi

# If type checking failed, show which file caused the issue
if [ $exit_code -ne 0 ]; then
  echo "❌ Type checking failed for $FILE_PATH"
  exit $exit_code
fi

echo "✅ Type checking passed for $FILE_PATH"
exit 0