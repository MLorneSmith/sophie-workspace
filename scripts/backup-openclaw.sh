#!/bin/bash
# Backup OpenClaw config, credentials, and workspace essentials
BACKUP_DIR=~/backups/openclaw
DATE=$(date +%Y-%m-%d)
mkdir -p "$BACKUP_DIR"

tar czf "$BACKUP_DIR/openclaw-$DATE.tar.gz" \
  ~/.openclaw/openclaw.json \
  ~/clawd/AGENTS.md \
  ~/clawd/SOUL.md \
  ~/clawd/USER.md \
  ~/clawd/IDENTITY.md \
  ~/clawd/TOOLS.md \
  ~/clawd/HEARTBEAT.md \
  ~/clawd/MEMORY.md \
  ~/clawd/config/ \
  ~/clawd/.ai/agents/ \
  ~/clawd/.ai/contexts/ \
  ~/.clawdbot/.env \
  2>/dev/null

# Keep 7 days of backups
find "$BACKUP_DIR" -name "openclaw-*.tar.gz" -mtime +7 -delete

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): Backup completed - openclaw-$DATE.tar.gz ($(du -h "$BACKUP_DIR/openclaw-$DATE.tar.gz" | cut -f1))" >> "$BACKUP_DIR/backup.log"
