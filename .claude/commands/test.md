# /test Command

Runs tests using the deterministic test controller script directly, bypassing agent timeouts.

## Usage

```bash
# Run all tests (default)
/test

# Run quick smoke tests only (2-3 minutes)
/test --quick

# Run only unit tests
/test --unit

# Run only E2E tests  
/test --e2e

# Enable debug mode
/test --debug

# Continue on failures
/test --continue

# Combine flags for specific scenarios
/test --quick --debug  # Quick smoke tests with debug output
```

## Implementation

When the `/test` command is invoked, execute the test controller script directly with proper argument handling:

```bash
# Parse arguments from user request
# If --debug is specified, set DEBUG_TEST=true environment variable
# Then execute: node .claude/scripts/test/test-controller.cjs [args]
```

Example execution:
- `/test --quick` → `node .claude/scripts/test/test-controller.cjs --quick`
- `/test --debug` → `DEBUG_TEST=true node .claude/scripts/test/test-controller.cjs --debug`
- `/test --unit` → `node .claude/scripts/test/test-controller.cjs --unit`
- `/test --e2e --debug` → `DEBUG_TEST=true node .claude/scripts/test/test-controller.cjs --e2e --debug`
- `/test --quick --debug` → `DEBUG_TEST=true node .claude/scripts/test/test-controller.cjs --quick --debug`

This bypasses the 2-minute Bash timeout limitation that was causing the original `/test` command to fail.

## Arguments

- `--quick`: Run quick smoke tests only (2-3 minutes)
- `--unit`: Run only unit tests
- `--e2e`: Run only E2E tests  
- `--debug`: Enable debug mode (sets DEBUG_TEST=true)
- `--continue`: Continue on failures

## Benefits

- No 2-minute timeout restrictions
- Direct script execution (no agent delegation)
- Deterministic results
- Full test suite completion (15+ minutes)