#!/bin/bash

# Fix executable permissions for Claude scripts
# This addresses the recurring issue of scripts losing their executable bit

CLAUDE_DIR="$(dirname "$(dirname "$(readlink -f "$0")")")"

echo "Fixing permissions for Claude scripts..."

# Fix all shell scripts
find "$CLAUDE_DIR" -name "*.sh" -type f -exec chmod +x {} \; 2>/dev/null
echo "✓ Fixed .sh files"

# Fix JavaScript executables
chmod +x "$CLAUDE_DIR/scripts/test-controller.cjs" 2>/dev/null
echo "✓ Fixed .js/.cjs executables"

# Ensure statusline components are executable
find "$CLAUDE_DIR/statusline" -name "*.sh" -type f -exec chmod +x {} \; 2>/dev/null
echo "✓ Fixed statusline components"

# Count fixed files
FIXED_COUNT=$(find "$CLAUDE_DIR" \( -name "*.sh" -o -name "*.js" -o -name "*.cjs" \) -type f -executable | wc -l)
echo "Total executable scripts: $FIXED_COUNT"

echo "Permission fix complete!"