#!/bin/bash
# Regenerate Payload CMS migrations from scratch
# Use when: schema changes, collection additions, migration errors

set -e

PROJECT_ROOT="/home/msmith/projects/2025slideheroes"
PAYLOAD_DIR="$PROJECT_ROOT/apps/payload"
WEB_DIR="$PROJECT_ROOT/apps/web"

echo "🔄 Regenerating Payload migrations..."

# Get database URL from Supabase
cd "$WEB_DIR"
DATABASE_URL=$(npx supabase status 2>/dev/null | grep "DB URL" | awk '{print $3}')

if [[ -z "$DATABASE_URL" ]]; then
  echo "❌ ERROR: Could not get DATABASE_URL from Supabase"
  echo "Ensure Supabase is running: pnpm supabase:web:start"
  exit 1
fi

echo "✅ Database URL: ${DATABASE_URL%%@*}@..." # Show without password

# Drop and recreate payload schema
echo "🗑️  Dropping existing payload schema..."
psql "$DATABASE_URL" -c "DROP SCHEMA IF EXISTS payload CASCADE;" >/dev/null 2>&1

echo "📦 Creating fresh payload schema..."
psql "$DATABASE_URL" -c "CREATE SCHEMA payload;" >/dev/null 2>&1

# Navigate to payload app
cd "$PAYLOAD_DIR"

# Backup existing migrations (optional)
if ls src/migrations/*.ts 1>/dev/null 2>&1; then
  BACKUP_DIR=".migrations-backup/$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  cp src/migrations/*.ts "$BACKUP_DIR/" 2>/dev/null || true
  cp src/migrations/*.json "$BACKUP_DIR/" 2>/dev/null || true
  echo "💾 Backed up old migrations to $BACKUP_DIR"
fi

# Delete old migration files
echo "🧹 Cleaning old migrations..."
rm src/migrations/*.ts 2>/dev/null || true
rm src/migrations/*.json 2>/dev/null || true

# Reset migrations index
echo 'export const migrations = [];' > src/migrations/index.ts

# Generate fresh base migration
echo "🔨 Generating fresh migration..."
pnpm run payload migrate:create --forceAcceptWarning

# Extract migration filename
MIGRATION_FILE=$(ls src/migrations/*.ts | grep -v index.ts | head -1)
if [[ -z "$MIGRATION_FILE" ]]; then
  echo "❌ ERROR: Migration file not created"
  exit 1
fi

MIGRATION_NAME=$(basename "$MIGRATION_FILE" .ts)
echo "✅ Created migration: $MIGRATION_NAME"

# Update index.ts to import new migration
cat > src/migrations/index.ts <<EOF
import * as migration_${MIGRATION_NAME} from './${MIGRATION_NAME}';

export const migrations = [
  migration_${MIGRATION_NAME},
];
EOF

echo "✅ Updated migrations index"

# Apply new migration
echo "⚡ Applying migration..."
pnpm run payload migrate --forceAcceptWarning

# Verify migration success
TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='payload';")
TABLE_COUNT=$(echo "$TABLE_COUNT" | tr -d ' ')

EXPECTED_MIN=40
if [ "$TABLE_COUNT" -lt "$EXPECTED_MIN" ]; then
  echo "⚠️  WARNING: Expected $EXPECTED_MIN+ tables, found only $TABLE_COUNT"
  echo "This may indicate incomplete migrations"
else
  echo "✅ Payload schema has $TABLE_COUNT tables"
fi

echo ""
echo "✅ Payload migrations regenerated successfully"
