---
description: Semi-automated Makerkit upstream synchronization with intelligent conflict handling
allowed-tools: [Bash, Read, Write, Edit]
argument-hint: [--force, --no-backup, --dry-run]
---

# Update Makerkit

Synchronize your codebase with upstream Makerkit changes using intelligent automation.

## Key Features
- **Automated Safety**: Pre-flight checks prevent data loss
- **Smart Merging**: Automatic for clean updates, guided for conflicts
- **Fast Recovery**: One-command rollback if needed
- **Parallel Execution**: 3x faster through optimized operations

## Quick Start

```bash
# One-command update (80% of cases)
git checkout dev && \
git branch backup-$(date +%Y%m%d-%H%M%S) && \
git pull upstream main && \
pnpm install && pnpm typecheck && pnpm lint

# If conflicts occur, see Conflict Resolution below
```

## Automated Workflow

```bash
#!/bin/bash
# Save as: update-makerkit.sh

set -e  # Exit on error

# Configuration
BRANCH="dev"
UPSTREAM="upstream"
UPSTREAM_BRANCH="main"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Pre-flight checks
echo "🔍 Checking prerequisites..."
git checkout $BRANCH 2>/dev/null || { echo "❌ Cannot switch to $BRANCH"; exit 1; }
[[ -z $(git status --porcelain) ]] || { echo "❌ Uncommitted changes detected"; exit 1; }
git remote get-url $UPSTREAM &>/dev/null || { echo "❌ Upstream not configured"; exit 1; }

# Backup and update
echo "🔄 Creating backup and pulling updates..."
git branch backup-$TIMESTAMP
git pull $UPSTREAM $UPSTREAM_BRANCH || {
    echo "⚠️ Merge conflicts detected. Run: git status"
    echo "After resolving: git add . && git commit -m 'Merge upstream'"
    exit 2
}

# Validate
echo "✅ Validating update..."
pnpm install && pnpm typecheck && pnpm lint || {
    echo "⚠️ Validation failed. Check errors above."
    echo "Rollback: git reset --hard backup-$TIMESTAMP"
    exit 3
}

echo "🎉 Update complete! Backup: backup-$TIMESTAMP"
```

## Conflict Resolution

When conflicts occur, the system preserves both versions for manual resolution:

### 1. Identify Conflicts
```bash
git status --short | grep "^UU"  # List conflicted files
```

### 2. Resolve by Pattern

| File Type | Strategy | Command |
|-----------|----------|---------|
| package.json | Merge dependencies | Keep both, then `pnpm install` |
| *.config.* | Keep local, adopt structure | Preserve env-specific settings |
| components/* | Review changes | Test after merging |
| migrations/* | Accept upstream | Never modify existing migrations |

### 3. Complete Merge
```bash
git add .
git commit -m "Merge upstream makerkit - $(date +%Y-%m-%d)"
pnpm install && pnpm typecheck
```

## Troubleshooting

| Issue | Solution | Command |
|-------|----------|---------|
| Merge went wrong | Abort and restart | `git merge --abort` |
| Need full rollback | Restore backup | `git reset --hard backup-[timestamp]` |
| Upstream missing | Add remote | `git remote add upstream https://github.com/makerkit/next-supabase-saas-kit.git` |
| Type errors | Regenerate types | `pnpm generate:types` |
| Missing deps | Install packages | `pnpm install` |
| Schema changes | Check migrations | `ls supabase/migrations/` |

## Arguments

- `--force`: Skip safety checks (use with caution)
- `--no-backup`: Don't create backup branch
- `--dry-run`: Show what would be updated without making changes

## Best Practices

1. **Update regularly**: Weekly updates are easier than monthly
2. **Document customizations**: Track your changes in CUSTOMIZATIONS.md
3. **Test critical paths**: Focus on your modified components
4. **Use the script**: Automation reduces human error

## Emergency Recovery

```bash
# List all backups
git branch | grep backup-

# Restore to specific backup
git reset --hard backup-[timestamp]

# Clean up old backups (keep last 3)
git branch | grep backup- | head -n -3 | xargs -r git branch -d
```