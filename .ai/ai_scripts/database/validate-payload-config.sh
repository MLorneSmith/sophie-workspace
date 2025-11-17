#!/bin/bash
# Pre-flight validation for Payload CMS configuration
# Validates seeding config, push settings, and migration files

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "/home/msmith/projects/2025slideheroes")"
PAYLOAD_DIR="$PROJECT_ROOT/apps/payload"

echo "🔍 Validating Payload configuration..."

# Check seeding config has all collections
SEEDING_CONFIG="$PAYLOAD_DIR/src/payload.seeding.config.ts"
if [[ ! -f "$SEEDING_CONFIG" ]]; then
  echo "❌ ERROR: Seeding config not found: $SEEDING_CONFIG"
  exit 1
fi

# Count collections in seeding config (exclude commented lines)
SEEDING_COLLECTIONS=$(grep -A 20 "collections:" "$SEEDING_CONFIG" | grep -v "^[[:space:]]*//")
COLLECTION_COUNT=$(echo "$SEEDING_COLLECTIONS" | grep -c "^[[:space:]]*[A-Z]" || echo "0")

# Expected: 12 collections
EXPECTED_COUNT=12
if [ "$COLLECTION_COUNT" -lt "$EXPECTED_COUNT" ]; then
  echo "❌ ERROR: Seeding config has only $COLLECTION_COUNT collections"
  echo "Expected: $EXPECTED_COUNT collections"
  echo ""
  echo "Required collections:"
  echo "  Users, Media, Downloads, Posts, Courses, CourseLessons,"
  echo "  CourseQuizzes, QuizQuestions, SurveyQuestions, Surveys,"
  echo "  Documentation, Private"
  echo ""
  echo "Fix: Edit $SEEDING_CONFIG"
  echo "  1. Uncomment all collection imports"
  echo "  2. Uncomment all collections in collections array"
  exit 1
fi

echo "✅ Seeding config: $COLLECTION_COUNT/$EXPECTED_COUNT collections"

# Validate push settings consistency
MAIN_CONFIG="$PAYLOAD_DIR/src/lib/database-adapter-singleton.ts"
MAIN_PUSH=$(grep "push:" "$MAIN_CONFIG" | grep -o "push: [^,]*" | head -1 || echo "")
SEED_PUSH=$(grep "push:" "$SEEDING_CONFIG" | grep -o "push: [^,]*" | head -1 || echo "")

if [[ "$MAIN_PUSH" != "push: false" ]] || [[ "$SEED_PUSH" != "push: false" ]]; then
  echo "❌ ERROR: Inconsistent 'push' settings detected"
  echo "Main config: $MAIN_PUSH"
  echo "Seed config: $SEED_PUSH"
  echo ""
  echo "Both should be: push: false"
  echo ""
  echo "Fix:"
  echo "  1. $MAIN_CONFIG (line ~213)"
  echo "  2. $SEEDING_CONFIG (line ~81)"
  exit 1
fi

echo "✅ Push settings: both set to false"

# Validate migration files exist
MIGRATIONS_DIR="$PAYLOAD_DIR/src/migrations"
MIGRATION_COUNT=$(ls "$MIGRATIONS_DIR"/*.ts 2>/dev/null | grep -v "index.ts" | wc -l)

if [ "$MIGRATION_COUNT" -eq 0 ]; then
  echo "❌ ERROR: No Payload migration files found"
  echo ""
  echo "Generate migrations:"
  echo "  cd $PAYLOAD_DIR"
  echo "  pnpm run payload migrate:create --forceAcceptWarning"
  echo ""
  echo "Or use: --regenerate-payload-migrations flag"
  exit 1
fi

echo "✅ Found $MIGRATION_COUNT Payload migration(s)"

# Check migrations index validity
if ! grep -q "export const migrations" "$MIGRATIONS_DIR/index.ts"; then
  echo "❌ ERROR: migrations/index.ts missing exports"
  echo "Ensure index.ts exports migration array"
  exit 1
fi

echo "✅ Migrations index is valid"

echo ""
echo "✅ All Payload configuration checks passed"
