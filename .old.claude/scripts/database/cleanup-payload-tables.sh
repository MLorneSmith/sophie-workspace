#!/bin/bash
# Clean all Payload tables before seeding
# Prevents duplicate data from multiple seeding runs

set -e

PROJECT_ROOT="/home/msmith/projects/2025slideheroes"
PAYLOAD_DIR="$PROJECT_ROOT/apps/payload"
WEB_DIR="$PROJECT_ROOT/apps/web"

echo "🧹 Cleaning Payload tables before seeding..."

# Get DATABASE_URI from .env.test or Supabase status
if [ -f "$PAYLOAD_DIR/.env.test" ]; then
  DATABASE_URI=$(grep "^DATABASE_URI=" "$PAYLOAD_DIR/.env.test" 2>/dev/null | cut -d'=' -f2)
fi

if [[ -z "$DATABASE_URI" ]]; then
  cd "$WEB_DIR"
  DATABASE_URI=$(npx supabase status 2>/dev/null | grep "DB URL" | awk '{print $3}')
fi

if [[ -z "$DATABASE_URI" ]]; then
  echo "❌ ERROR: Could not determine DATABASE_URI"
  exit 1
fi

echo "✅ Using database: ${DATABASE_URI%%@*}@..." # Show without password

# Check if cleanup needed
echo "🔍 Checking for existing payload data..."

TOTAL_RECORDS=$(psql "$DATABASE_URI" -t -c "
  SELECT COALESCE(SUM(n_live_tup), 0)
  FROM pg_stat_user_tables
  WHERE schemaname = 'payload'
  AND relname <> 'payload_migrations'
" | tr -d ' ')

if [ "$TOTAL_RECORDS" -gt 0 ]; then
  echo "⚠️  Found $TOTAL_RECORDS existing records in payload tables"
  echo "🧹 Cleaning existing data to prevent duplicates..."
else
  echo "✅ Payload tables are empty - ready for seeding"
  exit 0
fi

# Get all payload tables except migrations table
PAYLOAD_TABLES=$(psql "$DATABASE_URI" -t -c "
  SELECT tablename
  FROM pg_tables
  WHERE schemaname = 'payload'
  AND tablename != 'payload_migrations'
" | tr '\n' ',' | sed 's/,$//' | tr -d ' ')

# Truncate all tables with CASCADE to handle foreign keys
if [ -n "$PAYLOAD_TABLES" ]; then
  # Convert comma-separated list to qualified table names
  QUALIFIED_TABLES=$(echo "$PAYLOAD_TABLES" | sed 's/,/, payload./g' | sed 's/^/payload./')

  psql "$DATABASE_URI" -c "TRUNCATE TABLE $QUALIFIED_TABLES RESTART IDENTITY CASCADE;" 2>/dev/null

  if [ $? -eq 0 ]; then
    echo "✅ Truncated all payload tables (preserved migrations)"
  else
    echo "⚠️  Some tables failed to truncate (may not exist yet)"
  fi
else
  echo "⚠️  No payload tables found to truncate"
fi

# Verify cleanup success
REMAINING_RECORDS=$(psql "$DATABASE_URI" -t -c "
  SELECT COALESCE(SUM(n_live_tup), 0)
  FROM pg_stat_user_tables
  WHERE schemaname = 'payload'
  AND relname != 'payload_migrations'
" | tr -d ' ')

if [ "$REMAINING_RECORDS" -eq 0 ]; then
  echo "✅ All payload tables empty - ready for seeding"
else
  echo "⚠️  WARNING: Found $REMAINING_RECORDS remaining records after cleanup"
  echo "Proceeding with seeding (may create duplicates)"
fi
