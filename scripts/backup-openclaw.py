#!/usr/bin/env python3
"""
Daily OpenClaw Backup

Creates a backup of OpenClaw configuration, database, and workspace files.
No LLM calls - just deterministic backup and reporting.

Exit codes:
0 = Success
1 = Backup completed with errors
2 = Critical failure
"""

import glob
import gzip
import os
import shutil
import subprocess
import sys
import tarfile
from datetime import datetime
from pathlib import Path

# Configuration
BACKUP_DIR = Path.home() / "clawd" / "backups"
OPENCLAW_DIR = Path.home() / ".openclaw"
WORKSPACE_DIR = Path.home() / "clawd"
RETENTION_DAYS = 7
DISCORD_CHANNEL = "1468015498330308621"  # #inbox-sophie


def ensure_backup_dir():
    """Create backup directory if needed."""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    (BACKUP_DIR / "openclaw").mkdir(exist_ok=True)
    (BACKUP_DIR / "workspace").mkdir(exist_ok=True)


def get_backup_filename(prefix: str) -> str:
    """Generate timestamped backup filename."""
    date_str = datetime.now().strftime("%Y-%m-%d")
    return f"{prefix}-{date_str}.tar.gz"


def backup_openclaw_config() -> tuple[bool, str]:
    """Backup OpenClaw configuration directory."""
    backup_file = BACKUP_DIR / "openclaw" / get_backup_filename("openclaw-config")
    
    try:
        with tarfile.open(backup_file, "w:gz") as tar:
                tar.add(OPENCLAW_DIR / "openclaw.json", arcname="openclaw.json")
                tar.add(OPENCLAW_DIR / "cron" / "jobs.json", arcname="cron/jobs.json")
        
        return True, f"Config: {backup_file.name}"
    except Exception as e:
        return False, f"Config backup failed: {e}"


def backup_sqlite_databases() -> tuple[bool, list[str]]:
    """Backup SQLite databases from OpenClaw and workspace."""
    backups = []
    success = True
    
    # Find all SQLite databases
    db_patterns = [
        OPENCLAW_DIR / "*.db",
        OPENCLAW_DIR / "**/*.db",
        WORKSPACE_DIR / "**/*.db",
    ]
    
    db_files = set()
    for pattern in db_patterns:
        db_files.update(glob.glob(str(pattern), recursive=True))
    
    for db_file in db_files:
        if "backup" in db_file.lower():
            continue  # Skip backup files
        
        db_path = Path(db_file)
        backup_file = BACKUP_DIR / "openclaw" / f"{db_path.name}-{datetime.now().strftime('%Y-%m-%d')}.db"
        
        try:
            shutil.copy2(db_path, backup_file)
            backups.append(f"{db_path.name}: {backup_file.stat().st_size // 1024}KB")
        except Exception as e:
            success = False
            backups.append(f"{db_path.name}: FAILED - {e}")
    
    return success, backups


def backup_workspace() -> tuple[bool, str]:
    """Backup critical workspace files."""
    backup_file = BACKUP_DIR / "workspace" / get_backup_filename("workspace")
    
    # Files to backup
    files_to_backup = [
        WORKSPACE_DIR / "MEMORY.md",
        WORKSPACE_DIR / "AGENTS.md",
        WORKSPACE_DIR / "USER.md",
        WORKSPACE_DIR / "HEARTBEAT.md",
        WORKSPACE_DIR / "TOOLS.md",
        WORKSPACE_DIR / "state" / "current.md",
    ]
    
    try:
        with tarfile.open(backup_file, "w:gz") as tar:
                for file in files_to_backup:
                    if file.exists():
                        tar.add(file, arcname=str(file.relative_to(WORKSPACE_DIR)))
        
        return True, f"Workspace: {backup_file.name} ({backup_file.stat().st_size // 1024}KB)"
    except Exception as e:
        return False, f"Workspace backup failed: {e}"


def cleanup_old_backups():
    """Remove backups older than retention period."""
    removed = 0
    cutoff = datetime.now().timestamp() - (RETENTION_DAYS * 86400)
    
    for backup_type in ["openclaw", "workspace"]:
        backup_path = BACKUP_DIR / backup_type
        if not backup_path.exists():
            continue
        
        for file in backup_path.glob("*.tar.gz"):
            if file.stat().st_mtime < cutoff:
                file.unlink()
                removed += 1
    
    return removed


def notify_discord(message: str) -> bool:
    """Send notification to Discord."""
    try:
        result = subprocess.run(
            ["openclaw", "message", "send",
             "--channel", "discord",
             "--target", DISCORD_CHANNEL,
             "--message", message],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0
    except subprocess.SubprocessError:
        return False


def main():
    print("=== OpenClaw Daily Backup ===")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    ensure_backup_dir()
    
    results = []
    errors = []
    
    # Backup OpenClaw config
    success, msg = backup_openclaw_config()
    results.append(msg)
    if not success:
        errors.append("Config backup failed")
    
    # Backup SQLite databases
    success, db_backups = backup_sqlite_databases()
    results.extend(db_backups)
    if not success:
        errors.append("Database backup had failures")
    
    # Backup workspace
    success, msg = backup_workspace()
    results.append(msg)
    if not success:
        errors.append("Workspace backup failed")
    
    # Cleanup old backups
    removed = cleanup_old_backups()
    if removed > 0:
        results.append(f"Cleaned up {removed} old backup(s)")
    
    # Report
    print()
    print("=== Results ===")
    for r in results:
        print(f"  • {r}")
    
    # Notify on success
    if not errors:
        msg = f"✅ **Daily Backup Complete**\n\n" + "\n".join(f"• {r}" for r in results)
        notify_discord(msg)
        print(f"\nBackup completed successfully!")
        sys.exit(0)
    else:
        msg = f"⚠️ **Daily Backup Completed with Errors**\n\n"
        msg += "\n".join(f"• {r}" for r in results)
        msg += f"\n\n**Errors:**\n"
        msg += "\n".join(f"• {e}" for e in errors)
        notify_discord(msg)
        print(f"\nBackup completed with {len(errors)} error(s)")
        sys.exit(1)


if __name__ == "__main__":
    main()
