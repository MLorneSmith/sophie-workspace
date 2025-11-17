# Claude Statusline - Enhanced Edition

Enhanced statusline for Claude Code that provides reliable, real-time tracking of build, test, lint, and CI/CD status.

## What's New in This Version

### Key Improvements

1. **Reliable Status Updates** ✅
   - Atomic file writes prevent corruption
   - PID-based process detection (no more fragile `pgrep` patterns)
   - Consistent path generation using `GIT_ROOT`
   - Proper validation and error handling

2. **Better Architecture** 🏗️
   - Shared library for all status operations
   - Standardized wrapper pattern (no more indirection)
   - Clean separation of concerns
   - Comprehensive debug logging

3. **Enhanced Debugging** 🔍
   - Debug mode with detailed logging
   - Status file validation tools
   - Clear error messages
   - Troubleshooting utilities

4. **Performance Optimized** ⚡
   - Reduced subprocess calls
   - Efficient caching strategies
   - Fast status file operations
   - Background refresh for expensive checks

## Status Indicators

All status indicators use emojis to show current state:

- `🟢` - Success, fresh (< 30 minutes for dev checks, < 4 hours for CI)
- `🟡` - Success but stale, OR currently running/pending
- `🔴` - Error/failure (regardless of age)
- `⚪` - Not run yet, cancelled, or unknown
- `⟳` - Currently running (detected via PID files)

### Build Status

- `⟳ building` - Build currently running
- `🟢 build (5m)` - Build succeeded recently
- `🟡 build (2h)` - Build succeeded but getting old
- `🔴 build:12 (1h)` - Build failed with 12 errors
- `⚪ build` - Build artifacts exist but not recently run
- `⚪ no build` - No build configuration found

### Test Status

- `⟳ test` - Tests currently running
- `🟢 test (10m)` - Tests passed recently
- `🟡 test (45m)` - Tests passed but getting old
- `🔴 test:5 (20m)` - 5 tests failed
- `⚪ test` - Test configuration exists but not run
- `⚪ no test` - No test configuration found

### Codecheck Status

Combines linting and type checking results:

- `⟳ codecheck` - Code check currently running
- `🟢 codecheck (5m)` - All checks passed recently
- `🟡 codecheck (1h)` - Checks passed but getting old
- `🔴 codecheck:8 (15m)` - 8 errors found
- `🔴 codecheck:8/3 (15m)` - 8 errors, 3 warnings
- `⚪ codecheck` - Config exists but not run
- `⚪ no codecheck` - No lint/typecheck config found

### CI/CD Status

GitHub Actions workflow status:

- `🟡 cicd:running (2m)` - Workflow currently running
- `🟢 cicd (5m)` - CI passed recently
- `🔴 cicd:fail (10m)` - CI failed
- `⚪ cicd:cancel (1h)` - Workflow was cancelled

### PR Status

Pull request status for current branch:

- `📝 pr:draft #123` - Draft PR
- `👀 pr:review #123` - Awaiting review
- `✅ pr:approved #123` - Approved and ready to merge
- `🔄 pr:changes #123` - Changes requested
- `🔍 pr:2 need review` - You have 2 PRs to review

### Docker Status

Container health monitoring:

- `🟢 docker (3/3)` - All containers healthy
- `🟡 docker (2/3)` - Some containers in unknown state
- `🔴 docker (2/3)` - Some containers unhealthy
- `🔴 docker:off` - Docker not running
- `⟳ docker` - Checking Docker status

## Installation & Usage

### Quick Start

```bash
# Source aliases in your shell
source .claude/statusline/aliases.sh

# Or add to your shell profile
echo "source $(pwd)/.claude/statusline/aliases.sh" >> ~/.bashrc
```

### Method 1: Using Aliases

Most convenient for interactive use:

```bash
# Run tests with tracking
ctest

# Run full codecheck (lint + typecheck)
ccodecheck

# Run build
cbuild

# Specific commands
cpnpm-test          # pnpm test
cvitest             # pnpm vitest
cpnpm-lint          # pnpm lint
ctypecheck          # pnpm typecheck
cpnpm-build         # pnpm build
```

### Method 2: Direct Wrapper Usage

Direct invocation of wrapper scripts:

```bash
# Tests
.claude/statusline/test-wrapper.sh pnpm test
.claude/statusline/test-wrapper.sh npm run test:unit

# Codecheck (can combine commands)
.claude/statusline/codecheck-wrapper.sh "pnpm typecheck && pnpm lint"
.claude/statusline/codecheck-wrapper.sh pnpm biome check

# Build
.claude/statusline/build-wrapper.sh pnpm build
.claude/statusline/build-wrapper.sh npm run build
```

### Method 3: Auto-Detection Helper

Use `claude-run` to automatically detect the right wrapper:

```bash
claude-run pnpm test         # Uses test-wrapper
claude-run pnpm lint         # Uses codecheck-wrapper
claude-run pnpm build        # Uses build-wrapper
claude-run pnpm typecheck    # Uses codecheck-wrapper
```

### Method 4: CI/CD Integration

In GitHub Actions or other CI:

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: .claude/statusline/test-wrapper.sh pnpm test

- name: Run code checks
  run: .claude/statusline/codecheck-wrapper.sh "pnpm typecheck && pnpm lint"

- name: Build
  run: .claude/statusline/build-wrapper.sh pnpm build
```

### Method 5: Package.json Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "test:tracked": ".claude/statusline/test-wrapper.sh pnpm test",
    "codecheck:tracked": ".claude/statusline/codecheck-wrapper.sh 'pnpm typecheck && pnpm lint'",
    "build:tracked": ".claude/statusline/build-wrapper.sh pnpm build"
  }
}
```

## Utility Commands

### Status Management

```bash
# Clear all status files (useful for fresh start)
claude-clear-status

# Validate current status files (debugging)
claude-validate-status
```

### Debug Mode

```bash
# Enable debug logging
claude-debug-on

# View debug logs
claude-debug-view        # Last 50 lines
claude-debug-view 100    # Last 100 lines

# Follow debug logs in real-time
tail -f /tmp/.claude_statusline_debug.log

# Clear debug logs
claude-debug-clear

# Disable debug logging
claude-debug-off
```

### Help

```bash
# Show help message
claude-statusline-help
```

## Architecture

### File Structure

```
.claude/statusline/
├── lib/
│   └── status-common.sh          # Shared library for all operations
├── build-wrapper.sh              # Build command wrapper
├── test-wrapper.sh               # Test command wrapper
├── codecheck-wrapper.sh          # Lint/typecheck wrapper
├── statusline.sh                 # Main statusline script
├── aliases.sh                    # Shell aliases and utilities
├── README.md                     # This file
└── REFACTORING_PLAN.md          # Technical details
```

### Status Files

Status files are stored in `/tmp` with repository-specific names:

```
/tmp/.claude_build_status_${GIT_ROOT//\//_}
/tmp/.claude_test_status_${GIT_ROOT//\//_}
/tmp/.claude_codecheck_status_${GIT_ROOT//\//_}
/tmp/.claude_*_running_${GIT_ROOT//\//_}.pid  # PID files for running processes
```

### Status File Format

Pipe-delimited format:

```bash
# Build: result|timestamp|error_count
success|1699900000|0

# Test: result|timestamp|passed|failed|total
failed|1699900000|10|2|12

# Codecheck: result|timestamp|errors|warnings|type_errors
failed|1699900000|5|3|2
```

### Process Detection

Uses PID files instead of fragile `pgrep` patterns:

1. Wrapper starts: Creates PID file with current process ID
2. Statusline checks: Verifies PID file exists AND process is actually running
3. Wrapper completes: Removes PID file
4. Stale detection: If PID doesn't exist, removes stale PID file

This provides reliable "running" status without false positives.

## How It Works

### Atomic Status Updates

All status updates use atomic writes to prevent corruption:

```bash
1. Write to temporary file: /tmp/.claude_build_status_XXX.tmp.$$
2. Verify temp file written successfully
3. Atomic move: mv temp_file status_file
4. Verify final file matches expected content
```

### Consistent Path Generation

All components use the shared library to generate paths:

```bash
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
status_file="/tmp/.claude_build_status_${GIT_ROOT//\//_}"
```

This ensures wrappers and statusline always agree on file locations.

### Validation & Error Handling

Every status file read includes validation:

- File exists and is readable
- Contains required fields
- Timestamp is numeric and reasonable
- Not too old (< 30 days)
- Correct number of fields for status type

Invalid files are cleaned up automatically.

## Troubleshooting

### Status Not Updating

```bash
# 1. Enable debug mode
claude-debug-on

# 2. Run your command
ctest

# 3. View debug logs
claude-debug-view

# 4. Validate status files
claude-validate-status

# 5. Common issues:
# - PID file stuck: claude-clear-status
# - Corrupted status file: claude-clear-status
# - Wrong GIT_ROOT: Check you're in git repo
```

### Commands Not Found

```bash
# Make sure scripts are executable
chmod +x .claude/statusline/*.sh
chmod +x .claude/statusline/lib/*.sh

# Source aliases again
source .claude/statusline/aliases.sh
```

### Status Shows "⚪ no build/test/codecheck"

This means no configuration files were detected:

- **Build**: No `dist/`, `.next/`, or `build/` directory
- **Test**: No test config (vitest.config.ts, jest.config.js, etc.)
- **Codecheck**: No lint/typecheck config (tsconfig.json, biome.json, etc.)

Run the wrapper manually once to create initial status.

### PID File Stuck

If "⟳ running" shows but nothing is running:

```bash
# Clear all status including PID files
claude-clear-status

# Or manually remove specific PID file
rm /tmp/.claude_test_running_*.pid
```

### Debug Logs Too Large

```bash
# Clear debug logs
claude-debug-clear

# Or disable debug mode
claude-debug-off
```

## Supported Tools

### Test Frameworks

- ✅ Vitest
- ✅ Jest
- ✅ Playwright
- ✅ Mocha
- ✅ Other frameworks with standard output patterns

### Linters

- ✅ ESLint
- ✅ Biome
- ✅ Prettier
- ✅ TSLint (legacy)
- ✅ Ruff (Python)
- ✅ Pylint (Python)

### Build Tools

- ✅ Next.js
- ✅ Vite
- ✅ Webpack
- ✅ Turbo
- ✅ ESBuild
- ✅ Rollup

### Type Checkers

- ✅ TypeScript (tsc)
- ✅ Type checking via build tools

## Performance

### Optimizations

1. **Atomic writes**: Single system call per update
2. **PID-based detection**: No expensive `pgrep` scanning
3. **Efficient caching**: CI/CD and PR status cached appropriately
4. **Single jq call**: Docker status parsed in one operation
5. **Background refresh**: Expensive checks don't block statusline

### Cache Times

- **Dev checks** (build/test/codecheck): No cache, always current
- **CI/CD status**: 30s for running, 60s for completed
- **PR status**: 2 minutes
- **Docker status**: 5 minutes

## Differences from Old Version

### Fixed Issues

1. ✅ **Inconsistent paths**: Now uses `GIT_ROOT` everywhere
2. ✅ **Race conditions**: Atomic writes with optional locking
3. ✅ **Fragile detection**: PID files instead of `pgrep`
4. ✅ **No validation**: Comprehensive validation and cleanup
5. ✅ **Indirection**: All wrappers write directly
6. ✅ **Brittle parsing**: Multiple fallback strategies

### New Features

1. 🎉 **Debug mode**: Detailed logging for troubleshooting
2. 🎉 **Validation tools**: Check status file integrity
3. 🎉 **Better utilities**: Clear, validate, debug commands
4. 🎉 **Shared library**: Reusable functions for consistency
5. 🎉 **Enhanced docs**: Comprehensive README and plan

## Migration from Old Version

The new version is backward compatible:

1. ✅ Same status file format (pipe-delimited)
2. ✅ Same file locations (`/tmp/.claude_*_status_*`)
3. ✅ Same cache strategies
4. ✅ Same aliases (with additions)

To migrate:

```bash
# 1. Clear old status files
rm /tmp/.claude_*_status_*

# 2. Update shell profile to use new location
# Change: source .old.claude/statusline/aliases.sh
# To:     source .claude/statusline/aliases.sh

# 3. Source new aliases
source .claude/statusline/aliases.sh

# 4. Test with a simple command
ctest
```

## Requirements

### Required

- **Bash** 4.0+
- **Git** (for repository root detection)
- **Standard Unix tools**: `cat`, `mv`, `rm`, `stat`, `ps`, `date`

### Optional

- **jq**: For JSON parsing (CI/CD, PR, Docker status)
- **gh CLI**: For GitHub Actions and PR status
- **docker**: For Docker health monitoring

Without optional tools, those status components will be skipped gracefully.

## Contributing

Issues and improvements welcome! See `.claude/statusline/REFACTORING_PLAN.md` for technical details.

## License

MIT
