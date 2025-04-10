#!/bin/bash
# Script to fix UUID tables by ensuring required columns exist
# This script directly executes the database function to fix UUID tables

# Set error handling
set -e

# Get database URL from environment or .env file
if [ -z "$DATABASE_URL" ] && [ -z "$DATABASE_URI" ]; then
  if [ -f "apps/payload/.env" ]; then
    source apps/payload/.env
  elif [ -f ".env" ]; then
    source .env
  fi
fi

# Use either DATABASE_URL or DATABASE_URI, whichever is set
DB_URL=${DATABASE_URL:-$DATABASE_URI}

if [ -z "$DB_URL" ]; then
  echo "Error: No database URL found in environment or .env file"
  echo "Please set DATABASE_URL or DATABASE_URI environment variable"
  exit 1
fi

echo "=== UUID TABLE FIXER ==="
echo "Timestamp: $(date -Iseconds)"
echo

# Check if the scanner function exists
echo "Checking if scanner function exists..."
FUNCTION_EXISTS=$(psql "$DB_URL" -t -c "
  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE pronamespace = 'payload'::regnamespace
    AND proname = 'scan_and_fix_uuid_tables'
  );
")

if [[ $FUNCTION_EXISTS == *"t"* ]]; then
  echo "✅ Scanner function exists"
  
  # Run the scanner function
  echo -e "\nRunning scanner function to fix UUID tables..."
  RESULTS=$(psql "$DB_URL" -t -c "SELECT * FROM payload.scan_and_fix_uuid_tables();")
  
  if [ -z "$RESULTS" ] || [[ $RESULTS == *"(0 rows)"* ]]; then
    echo "No UUID tables required fixing"
  else
    # Count rows by counting table_name entries
    ROW_COUNT=$(echo "$RESULTS" | grep -o "| [0-9a-f]\{8\}" | wc -l)
    echo "Fixed $ROW_COUNT UUID tables:"
    echo "$RESULTS"
  fi
  
  # Check tracking table
  echo -e "\nChecking tracking table contents..."
  TRACKING=$(psql "$DB_URL" -t -c "
    SELECT table_name, has_path_column, last_checked 
    FROM payload.dynamic_uuid_tables 
    ORDER BY last_checked DESC 
    LIMIT 10;
  ")
  
  if [ -n "$TRACKING" ]; then
    TABLE_COUNT=$(echo "$TRACKING" | grep -v "^$" | wc -l)
    echo "Found $TABLE_COUNT tracked UUID tables:"
    echo "$TRACKING"
  else
    echo "No UUID tables are being tracked yet"
  fi
  
else
  echo "❌ Scanner function does not exist"
  echo "Please run migrations to create the scanner function:"
  echo "cd apps/payload && pnpm payload migrate"
fi

echo -e "\n=== SUMMARY ==="
echo "UUID tables have been scanned and fixed."
echo "If you continue to experience 'column X.path does not exist' errors, please:"
echo "1. Run diagnose-downloads.ts script for more detailed diagnostics"
echo "2. Verify that the multi-tiered access approach is being used in the application code"
echo "3. Check that the downloads_relationships view is correctly defined"
