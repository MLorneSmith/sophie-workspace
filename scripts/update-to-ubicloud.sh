#!/bin/bash

# Update all GitHub Actions workflows to use Ubicloud runners
# This script replaces ubuntu-latest with ubicloud-standard-2

set -e

echo "🚀 Updating GitHub Actions workflows to use Ubicloud runners..."

# Find and update all workflow files
updated_count=0
for file in .github/workflows/*.yml .github/workflows/*.yaml; do
    if [ -f "$file" ] && grep -q "runs-on: ubuntu-latest" "$file"; then
        echo "📝 Updating: $file"
        sed -i 's/runs-on: ubuntu-latest/runs-on: ubicloud-standard-2/g' "$file"
        ((updated_count++))
    fi
done

echo ""
echo "✅ Updated $updated_count workflow files"
echo ""

# Show the changes
echo "📋 Summary of changes:"
git diff --stat .github/workflows/

echo ""
echo "✨ Done! Review the changes and commit when ready."