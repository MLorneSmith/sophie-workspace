#!/bin/bash
# Validate seeding configuration before running seed
# Checks collection consistency, imports, and environment

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "/home/msmith/projects/2025slideheroes")"
PAYLOAD_DIR="$PROJECT_ROOT/apps/payload"

echo "🔍 Validating seeding configuration..."

# Extract collections from both configs
MAIN_CONFIG="$PAYLOAD_DIR/src/payload.config.ts"
SEED_CONFIG="$PAYLOAD_DIR/src/payload.seeding.config.ts"

MAIN_COLLECTIONS=$(grep -A 30 "collections:" "$MAIN_CONFIG" | grep -E "^\s+[A-Z]" | tr -d ',' | awk '{print $1}')
SEED_COLLECTIONS=$(grep -A 30 "collections:" "$SEED_CONFIG" | grep -E "^\s+[A-Z]" | tr -d ',' | awk '{print $1}')

# Compare counts
MAIN_COUNT=$(echo "$MAIN_COLLECTIONS" | wc -l)
SEED_COUNT=$(echo "$SEED_COLLECTIONS" | wc -l)

if [ "$MAIN_COUNT" -ne "$SEED_COUNT" ]; then
  echo "❌ ERROR: Collection count mismatch!"
  echo "Main config: $MAIN_COUNT collections"
  echo "Seed config: $SEED_COUNT collections"
  echo ""
  echo "Missing collections in seeding config:"
  comm -23 <(echo "$MAIN_COLLECTIONS" | sort) <(echo "$SEED_COLLECTIONS" | sort)
  echo ""
  echo "Fix: Update $SEED_CONFIG to include all collections"
  exit 1
fi

echo "✅ Seeding config has all $SEED_COUNT collections"

# Verify imports match collections
for collection in $SEED_COLLECTIONS; do
  if ! grep -q "import.*$collection.*from.*collections" "$SEED_CONFIG"; then
    echo "⚠️  WARNING: $collection is used but not imported"
    echo "Add: import { $collection } from './collections/${collection}.js';"
  fi
done

# Check .env.test file exists
ENV_FILE="$PAYLOAD_DIR/.env.test"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ ERROR: .env.test file missing"
  echo "Seeding requires $ENV_FILE with DATABASE_URI"
  echo ""
  echo "Copy from example: cp $PAYLOAD_DIR/.env.example $ENV_FILE"
  exit 1
fi

# Verify DATABASE_URI is set
if ! grep -q "^DATABASE_URI=" "$ENV_FILE"; then
  echo "❌ ERROR: DATABASE_URI not set in .env.test"
  exit 1
fi

echo "✅ Environment configuration valid"

echo ""
echo "✅ All seeding configuration checks passed"
