#!/bin/bash

# Verify the database was properly reset by checking for absence of application tables
LOG_FILE="./verify_reset.log"
SCHEMA="public"

echo "[$(date)] Starting verification of database reset..." | tee -a "$LOG_FILE"

# Check for existence of application tables in 'public' schema
TABLE_COUNT=$(psql -d "$DATABASE_URL" -Atc "SELECT COUNT(*) FROM pg_tables WHERE schemaname = '$SCHEMA' AND tablename NOT IN ('auth', 'storage', 'extensions');")

if [ "$TABLE_COUNT" -ne 0 ]; then
  echo "[$(date)] ERROR: Found $TABLE_COUNT application tables remaining in schema '$SCHEMA'." | tee -a "$LOG_FILE"
  exit 1
fi

# Check for existence of tables in 'payload' schema
PAYLOAD_TABLE_COUNT=$(psql -d "$DATABASE_URL" -Atc "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'payload';")

if [ "$PAYLOAD_TABLE_COUNT" -ne 0 ]; then
  echo "[$(date)] ERROR: Found $PAYLOAD_TABLE_COUNT tables remaining in 'payload' schema." | tee -a "$LOG_FILE"
  exit 1
fi

echo "[$(date)] Database reset verification passed." | tee -a "$LOG_FILE"
exit 0