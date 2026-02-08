# GitHub-First Issue Management

## Overview

SlideHeroes now uses a **GitHub-first** approach for issue management:

- **GitHub issues** are the single source of truth
- **Local files** are auto-synced mirrors for search/grep functionality
- **No manual duplication** required
- **Automatic synchronization** handles caching transparently

## New Workflow

### 1. Creating Issues

```bash
# Default: Create GitHub issue only
/log-issue

# Local-only fallback (when GitHub unavailable)
/log-issue local
```

**Result**: GitHub issue created, no local file until debugging starts.

### 2. Debugging Issues

```bash
# Any of these formats trigger auto-sync:
/debug-issue 30                    # GitHub issue number
/debug-issue ISSUE-30              # ISSUE format
/debug-issue "#30"                 # Hash format
/debug-issue "https://github.com/slideheroes/2025slideheroes/issues/30"  # URL format

# Legacy local files still work:
/debug-issue 2025-06-13-ISSUE-30.md
```

**Auto-Sync Process**:

1. Detects GitHub issue reference
2. Checks local cache freshness (24-hour TTL)
3. Fetches from GitHub if needed
4. Creates/updates local cache file
5. Proceeds with debugging using local file

### 3. Search and Grep

Local cache files maintain full search functionality:

```bash
# Search across all cached issues
grep -r "performance" .claude/issues/

# Find specific patterns
rg "database.*error" .claude/issues/

# List issues by status
grep "Status: open" .claude/issues/*.md
```

## Technical Implementation

### GitHub CLI Integration

Issues are fetched directly using GitHub CLI (`gh`) commands:

```bash
# Fetch issue details
gh issue view [issue_number] --json number,title,body,state,labels

# View with comments
gh issue view [issue_number] --comments
```

### Authentication

Uses `GITHUB_TOKEN` environment variable for API access.

### Local File Format

Auto-synced files include:

```markdown
# Issue: [Title from GitHub]

**ID**: ISSUE-[number]
**Created**: [GitHub timestamp]
**Updated**: [GitHub timestamp]
**Reporter**: [GitHub username]
**Status**: [open/closed]
**Labels**: [GitHub labels]

## GitHub Issue Content

[Original GitHub issue body]

---

**Auto-Generated Local Cache**

- GitHub Issue: #[number]
- GitHub URL: [GitHub URL]
- Cached: [Sync timestamp]
- Status: auto-sync cache (read-only)
- Source: GitHub (authoritative)
```

### Cache Management

- **TTL**: 24 hours for cache freshness
- **Location**: `.claude/issues/YYYY-MM-DD-ISSUE-{number}.md`
- **Metadata**: `.claude/issues/sync-metadata.json`
- **Auto-cleanup**: Stale caches are refreshed automatically

## Benefits

### ✅ Advantages

1. **Single Source of Truth**: GitHub is authoritative
2. **Team Collaboration**: All discussion in GitHub
3. **Preserved Search**: Local files maintain grep functionality
4. **Reduced Overhead**: No manual duplication
5. **Better Integration**: Leverages GitHub's API ecosystem
6. **Automatic Caching**: Transparent sync process

### 🔄 Migration from Old System

- **Existing local files**: Continue to work with debug-issue
- **Legacy format support**: `ISSUE-timestamp-hash` format still functional
- **Gradual migration**: No immediate action required
- **Backward compatibility**: Old workflows remain functional

## Troubleshooting

### Common Issues

**GitHub fetch fails:**

```bash
# Check authentication
gh auth status

# Manual fetch test
gh issue view 30 --json number,title,body,state

# Fallback: Use direct local files
/debug-issue .claude/issues/2025-06-13-ISSUE-30.md
```

**GitHub API rate limits:**

- Auto-sync respects rate limits
- Local cache reduces API calls
- Fallback to existing cache when rate-limited

**Network connectivity:**

- Offline mode uses existing local cache
- Warning displayed when GitHub unavailable
- Debug workflow continues with cached data

### File Locations

```
.claude/
├── scripts/
│   └── package.json        # Dependencies
├── issues/
│   ├── sync-metadata.json  # Sync tracking
│   └── YYYY-MM-DD-ISSUE-*.md  # Cached issues
└── commands/
    ├── log-issue.md        # Updated: GitHub-first
    └── debug-issue.md      # Updated: Auto-sync integration
```

## Future Enhancements

### Planned Features

- **Webhook integration** for real-time sync
- **Bidirectional sync** for local → GitHub updates
- **Bulk sync commands** for team onboarding
- **Enhanced conflict resolution**
- **Performance optimizations**

### Configuration Options

Environment variables:

- `GITHUB_TOKEN` - Required for GitHub API access
- `FORCE_LOCAL_BACKUP` - Always create local files during issue creation
- `SYNC_TTL_HOURS` - Customize cache freshness (default: 24)

## Summary

The GitHub-first approach provides:

- **Simplified workflow** with automatic synchronization
- **Maintained functionality** for search and grep
- **Better team collaboration** through GitHub features
- **Reduced maintenance** overhead
- **Future-proof architecture** for enhanced integrations

All existing functionality is preserved while eliminating manual duplication and sync drift issues.
