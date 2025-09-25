#!/bin/bash

# Script to fix orphaned closing braces/parentheses in TypeScript files
# These were created during previous sessions when logger calls were commented out incorrectly

# Pattern 1: Fix orphaned ); after commented logger calls
echo "Fixing orphaned closing parentheses..."

# Find and fix lines that are just ); on their own after comment blocks
sed -i 's/^\(\s*\));$/\1\/\/ );/g' \
  "apps/web/app/home/(user)/ai/canvas/_components/action-toolbar.tsx" \
  "apps/web/app/home/(user)/ai/canvas/_components/error-boundary.tsx" \
  "apps/web/app/home/(user)/ai/canvas/actions/generate-improvements.ts" \
  "apps/web/app/home/(user)/assessment/_lib/server/server-actions.ts" \
  "apps/web/app/home/(user)/kanban/_lib/server/image-actions.ts" \
  "apps/web/app/sitemap.xml/route.ts" \
  2>/dev/null

# Pattern 2: Fix orphaned }); after commented logger calls  
echo "Fixing orphaned closing braces..."

# Find and fix lines that are just }); on their own
sed -i 's/^\(\s*\)});$/\1\/\/ });/g' \
  "apps/web/app/home/(user)/ai/blocks/_components/BlocksFormErrorBoundary.tsx" \
  "apps/web/app/home/(user)/ai/canvas/_lib/contexts/cost-tracking-context.tsx" \
  2>/dev/null

echo "Parse error fixes applied. Run 'pnpm biome check --reporter=summary' to verify."