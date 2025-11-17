# Git Aliases

**Purpose**: This document describes the custom Git aliases configured for the SlideHeroes project to streamline common Git operations and improve development workflow efficiency.

## Overview

Git aliases are shortcuts for frequently used Git commands. These aliases are configured for the SlideHeroes project to simplify common workflows including commits, branch management, and synchronization with upstream repositories.

## Configured Aliases

### gcmsg "message"

**Purpose**: Quick commit with message

**Equivalent Command**: `git commit -m "message"`

**Usage**:
```bash
gcmsg "fix: resolve authentication bug"
gcmsg "feat: add user profile page"
```

### gu

**Purpose**: Pull updates from Makerkit upstream

**Equivalent Command**: Custom command to pull from upstream Makerkit repository

**Usage**:
```bash
gu  # Pull latest changes from Makerkit
```

**Note**: This is used to sync with the Makerkit starter template repository that SlideHeroes is based on.

### gm

**Purpose**: Push to main branch on GitHub

**Equivalent Command**: `git push origin main`

**Usage**:
```bash
gm  # Push current commits to main branch
```

**Warning**: Use with caution. Ensure all changes are properly reviewed before pushing to main.

## Best Practices

1. **Use Conventional Commits**: When using `gcmsg`, follow the project's conventional commit format
2. **Review Before Push**: Always review changes before using `gm` to push to main
3. **Sync Regularly**: Use `gu` periodically to stay up-to-date with Makerkit updates
4. **Branch Strategy**: Consider using feature branches instead of pushing directly to main

## Related Files

- `.gitconfig` - Git configuration file (may contain alias definitions)
- `.git/config` - Repository-specific Git configuration
- `CLAUDE.md` - Project commit conventions

## See Also

- **CLI References**: `.claude/docs/tools/cli-references.md` - Complete CLI command reference
- **Git Workflows**: Project git workflow documentation
