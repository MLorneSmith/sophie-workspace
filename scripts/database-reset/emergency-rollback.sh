#!/bin/bash

# Emergency rollback script to restore the database from the latest backup
LOG_FILE="./rollback.log"
BACKUP_DIR="./backups"

LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/supabase_backup_*.sql | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "[$(date)] ERROR: No backup file found for rollback." | tee -a "$LOG_FILE"
  exit 1
fi

echo "[$(date)] Starting emergency rollback from backup: $LATEST_BACKUP" | tee -a "$LOG_FILE"

psql -d "$DATABASE_URL" -f "$LATEST_BACKUP" 2>>"$LOG_FILE"
if [ $? -ne 0 ]; then
  echo "[$(date)] ERROR: Rollback failed during restore." | tee -a "$LOG_FILE"
  exit 1
fi

echo "[$(date)] Rollback completed successfully." | tee -a "$LOG_FILE"
exit 0