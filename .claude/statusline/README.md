# Claude Statusline Enhancements

## Overview
Enhanced statusline for Claude Code that tracks build, test, and lint status in real-time.

## Status Indicators

### Build Status
- `⟳ building` - Build is currently running
- `✓ build (Xs ago)` - Last build succeeded
- `✗ build (X errors)` - Last build failed with X errors
- `─ build` - Build artifacts exist but no recent build info
- `─ no build` - No build artifacts found

### Test Status
- `⟳ test` - Tests are currently running
- `✓ test` - All tests passed
- `✗ test:X` - X tests failed
- No indicator - No recent test runs

### Lint Status
- `⟳ lint` - Linting is currently running
- `✓ lint` - No lint issues
- `✗ lint:X` - X lint errors
- `✗ lint:X/Y` - X errors, Y warnings
- No indicator - No recent lint runs

## Using the Wrappers

### Method 1: Direct Usage
```bash
# Run tests with tracking
.claude/statusline/test-wrapper.sh pnpm test

# Run linting with tracking
.claude/statusline/lint-wrapper.sh pnpm lint

# Run build with tracking
.claude/statusline/build-wrapper.sh pnpm build
```

### Method 2: Using Aliases
```bash
# Source the aliases file
source .claude/statusline/aliases.sh

# Use convenient aliases
ctest           # Run tests with wrapper
clint           # Run lint with wrapper
cbuild          # Run build with wrapper

# Or use specific commands
cpnpm-test      # pnpm test with wrapper
cpnpm-lint      # pnpm lint with wrapper
cpnpm-build     # pnpm build with wrapper
```

### Method 3: CI/CD Integration
In your CI/CD pipeline, use the wrappers directly:

```yaml
# GitHub Actions example
- name: Run tests
  run: .claude/statusline/test-wrapper.sh pnpm test

- name: Run linting
  run: .claude/statusline/lint-wrapper.sh pnpm lint
```

### Method 4: Package.json Scripts
Update your package.json to use wrappers:

```json
{
  "scripts": {
    "test:tracked": ".claude/statusline/test-wrapper.sh pnpm test",
    "lint:tracked": ".claude/statusline/lint-wrapper.sh pnpm lint",
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
claude-run lint
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
├── statusline.sh        # Main statusline script
├── build-wrapper.sh     # Build command wrapper
├── test-wrapper.sh      # Test command wrapper
├── lint-wrapper.sh      # Lint command wrapper
├── typecheck-wrapper.sh # TypeCheck wrapper
├── aliases.sh          # Shell aliases for convenience
└── README.md           # This file
```

## Troubleshooting

- **Status not updating**: Check if wrapper scripts are executable (`chmod +x`)
- **Old status showing**: Run `claude-clear-status` to reset
- **Commands not found**: Ensure `.claude/statusline/` is in your PATH or use full paths