#!/bin/bash

# Verify the latest backup exists and is non-empty
LOG_FILE="./verify_backup.log"
BACKUP_DIR="./backups"

LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/supabase_backup_*.sql | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "[$(date)] ERROR: No backup file found." | tee -a "$LOG_FILE"
  exit 1
fi

if [ ! -s "$LATEST_BACKUP" ]; then
  echo "[$(date)] ERROR: Backup file is empty: $LATEST_BACKUP" | tee -a "$LOG_FILE"
  exit 1
fi

echo "[$(date)] Backup verification passed: $LATEST_BACKUP" | tee -a "$LOG_FILE"
exit 0