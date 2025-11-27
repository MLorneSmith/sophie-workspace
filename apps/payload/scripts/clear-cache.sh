#!/usr/bin/env bash
# Clear Payload CMS build caches (Next.js/Turbopack)
#
# Usage: ./scripts/clear-cache.sh
#
# This script clears the .next and .turbo directories to force a fresh
# build. Use this when:
# - You've modified payload.config.ts and see stale behavior
# - You encounter "parseEditorState: type 'block' not found" errors
# - The Lexical editor fails to recognize configured block types
# - After upgrading Payload CMS or its dependencies

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOAD_DIR="$(dirname "$SCRIPT_DIR")"

echo "Clearing Payload CMS build caches..."

# Remove Next.js build cache
if [ -d "$PAYLOAD_DIR/.next" ]; then
  rm -rf "$PAYLOAD_DIR/.next"
  echo "  ✓ Removed .next directory"
else
  echo "  - .next directory not found (already clean)"
fi

# Remove Turbo cache
if [ -d "$PAYLOAD_DIR/.turbo" ]; then
  rm -rf "$PAYLOAD_DIR/.turbo"
  echo "  ✓ Removed .turbo directory"
else
  echo "  - .turbo directory not found (already clean)"
fi

echo ""
echo "Cache cleared successfully!"
echo "Run 'pnpm --filter payload dev' to start fresh."
