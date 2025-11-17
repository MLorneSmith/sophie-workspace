# Claude Code Statusline - Test Status Integration

## Quick Fix for Test Indicator

When you run `/test` and see failures but the indicator stays white (⚪), update it manually:

```bash
# After test failures (e.g., 2 accessibility test failures)
.claude/statusline/update-test-status.sh failed 0 2

# After successful tests
.claude/statusline/update-test-status.sh success 10 0
```

The indicator will then show:

- 🔴 test:2 (1s ago) - for failures
- 🟢 test (1s ago) - for success

## Automated Options

### Run tests with wrapper

```bash
.claude/statusline/test-wrapper.sh pnpm --filter web test:e2e
```

### Run E2E tests with status tracking

```bash
.claude/statusline/run-e2e-tests.sh
```

### Parse existing output

```bash
echo "test output with failures" | .claude/statusline/parse-test-output.sh
```

## Why This Happens

The `/test` command runs tests in a way that doesn't trigger the statusline wrapper scripts. The wrapper needs to intercept the test output to update the status file that the statusline reads.
