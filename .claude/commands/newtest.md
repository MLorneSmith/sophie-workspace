# /newtest Command

Runs tests using the deterministic test controller script directly, bypassing agent timeouts.

## Usage

```bash
# Run all tests (default)
/newtest

# Run only unit tests
/newtest --unit

# Run only E2E tests  
/newtest --e2e

# Enable debug mode
/newtest --debug

# Continue on failures
/newtest --continue
```

## Implementation

When the `/newtest` command is invoked, execute the test controller script directly with proper argument handling:

```bash
# Parse arguments from user request
# If --debug is specified, set DEBUG_TEST=true environment variable
# Then execute: node .claude/scripts/test-controller.cjs [args]
```

Example execution:
- `/newtest --debug` → `DEBUG_TEST=true node .claude/scripts/test-controller.cjs --debug`
- `/newtest --unit` → `node .claude/scripts/test-controller.cjs --unit`
- `/newtest --e2e --debug` → `DEBUG_TEST=true node .claude/scripts/test-controller.cjs --e2e --debug`

This bypasses the 2-minute Bash timeout limitation that was causing the original `/test` command to fail.

## Arguments

- `--unit`: Run only unit tests
- `--e2e`: Run only E2E tests  
- `--debug`: Enable debug mode (sets DEBUG_TEST=true)
- `--continue`: Continue on failures

## Benefits

- No 2-minute timeout restrictions
- Direct script execution (no agent delegation)
- Deterministic results
- Full test suite completion (15+ minutes)