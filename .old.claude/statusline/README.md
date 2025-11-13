# Claude Statusline Enhancements

## Overview

Enhanced statusline for Claude Code that tracks build, test, lint, and CI/CD status in real-time.

### Requirements

- **CI/CD Status**: Requires `gh` CLI to be installed and authenticated (`gh auth login`)

## Status Indicators

### Freshness Indicators

All status indicators use emojis to show how recent the results are:

- `🟢` - Fresh (less than 30 minutes old)
- `🟡` - Recent (30 minutes to 2 hours old)
- `🔴` - Stale (more than 2 hours old) or Failed
- `⚪` - Not run yet
- `⟳` - Currently running

### Build Status

- `⟳ building` - Build is currently running
- `🟢 build (Xm)` - Build succeeded recently (< 30 min)
- `🟡 build (Xh)` - Build succeeded (30 min - 2 hours ago)
- `🔴 build (Xd)` - Build succeeded but stale (> 2 hours)
- `🔴 build:X (Xh)` - Build failed with X errors
- `⚪ build` - Build artifacts exist but hasn't been run
- `⚪ no build` - No build artifacts found

### Test Status

- `⟳ test` - Tests are currently running
- `🟢 test (Xm)` - Tests passed recently (< 30 min)
- `🟡 test (Xh)` - Tests passed (30 min - 2 hours ago)
- `🔴 test (Xd)` - Tests passed but stale (> 2 hours)
- `🔴 test:X (Xh)` - X tests failed
- `⚪ test` - Test configuration found but tests haven't been run
- `⚪ no test` - No test configuration found

### Codecheck Status (Combines Lint + TypeCheck)

- `⟳ codecheck` - Code checking is currently running
- `🟢 codecheck (Xm)` - Code check passed recently (< 30 min)
- `🟡 codecheck (Xh)` - Code check passed (30 min - 2 hours ago)
- `🔴 codecheck (Xd)` - Code check passed but stale (> 2 hours)
- `🔴 codecheck:X (Xh)` - X total errors found
- `🔴 codecheck:X/Y (Xh)` - X errors, Y warnings
- `⚪ codecheck` - Code check configuration found but hasn't been run
- `⚪ no codecheck` - No lint or TypeScript configuration found

### CI/CD Status (GitHub Actions)

- `⟳ CI` - Workflow is currently running or queued
- `🟢 CI (Xm)` - CI passed recently (< 30 min)
- `🟡 CI (Xh)` - CI passed (30 min - 2 hours ago)
- `🔴 CI (Xd)` - CI passed but stale (> 2 hours)
- `🔴 CI:fail (Xh)` - CI failed
- `⚪ CI:cancel (Xh)` - CI was cancelled
- No indicator - No GitHub Actions configured or gh CLI not available

## Using the Wrappers

### Method 1: Direct Usage

```bash
# Run tests with tracking
.claude/statusline/test-wrapper.sh pnpm test

# Run code checking (lint + typecheck) with tracking
.claude/statusline/codecheck-wrapper.sh pnpm code-check
.claude/statusline/codecheck-wrapper.sh pnpm lint
.claude/statusline/codecheck-wrapper.sh pnpm typecheck

# Run build with tracking
.claude/statusline/build-wrapper.sh pnpm build
```

### Method 2: Using Aliases

```bash
# Source the aliases file
source .claude/statusline/aliases.sh

# Use convenient aliases
ctest           # Run tests with wrapper
ccodecheck      # Run code-check with wrapper
ccode-check     # Alternate alias for code-check
cbuild          # Run build with wrapper

# Or use specific commands
cpnpm-test        # pnpm test with wrapper
cpnpm-codecheck   # pnpm code-check with wrapper
cpnpm-build       # pnpm build with wrapper
```

### Method 3: CI/CD Integration

In your CI/CD pipeline, use the wrappers directly:

```yaml
# GitHub Actions example
- name: Run tests
  run: .claude/statusline/test-wrapper.sh pnpm test

- name: Run code checks (lint + typecheck)
  run: .claude/statusline/codecheck-wrapper.sh pnpm code-check
```

### Method 4: Package.json Scripts

Update your package.json to use wrappers:

```json
{
  "scripts": {
    "test:tracked": ".claude/statusline/test-wrapper.sh pnpm test",
    "codecheck:tracked": ".claude/statusline/codecheck-wrapper.sh pnpm code-check",
    "build:tracked": ".claude/statusline/build-wrapper.sh pnpm build"
  }
}
```

## Utility Commands

```bash
# Clear all status files
claude-clear-status

# Run any command with appropriate wrapper
claude-run test
claude-run code-check
claude-run codecheck
claude-run build
```

## How It Works

1. **Wrapper Scripts**: Each wrapper script captures the exit code and output of the actual command
2. **Status Files**: Results are stored in `/tmp/.claude_*_status_*` files
3. **Statusline Reading**: The statusline script reads these files to display current status
4. **Real-time Updates**: Status updates immediately when commands start and finish

## File Structure

```
.claude/statusline/
├── statusline.sh          # Main statusline script
├── build-wrapper.sh       # Build command wrapper
├── test-wrapper.sh        # Test command wrapper
├── codecheck-wrapper.sh   # Combined lint+typecheck wrapper
├── lint-wrapper.sh        # Legacy lint wrapper (still works)
├── typecheck-wrapper.sh   # Legacy typecheck wrapper
├── aliases.sh            # Shell aliases for convenience
└── README.md             # This file
```

## Troubleshooting

- **Status not updating**: Check if wrapper scripts are executable (`chmod +x`)
- **Old status showing**: Run `claude-clear-status` to reset
- **Commands not found**: Ensure `.claude/statusline/` is in your PATH or use full paths
