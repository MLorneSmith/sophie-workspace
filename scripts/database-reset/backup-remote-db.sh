#!/bin/bash

# Backup script for remote Supabase database
# Creates a full schema and data dump, with error handling and logging

LOG_FILE="./backup.log"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="./backups"
DUMP_FILE="$BACKUP_DIR/supabase_backup_$DATE.sql"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting full database dump..." | tee -a "$LOG_FILE"

supabase db dump --linked > "$DUMP_FILE" 2>>"$LOG_FILE"
if [ $? -ne 0 ]; then
  echo "[$(date)] ERROR: Database dump failed." | tee -a "$LOG_FILE"
  exit 1
fi

echo "[$(date)] Backup completed successfully: $DUMP_FILE" | tee -a "$LOG_FILE"
exit 0