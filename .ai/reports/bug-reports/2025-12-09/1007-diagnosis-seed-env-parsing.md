# Bug Diagnosis: Seed engine --env flag parsing only accepts equals format

**ID**: ISSUE-1007
**Created**: 2025-12-09T10:50:00Z
**Reporter**: system (during /supabase-seed-remote execution)
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The seed engine's `--env` flag parsing only accepts the `--env=value` format (with equals sign) but not the `--env value` format (space-separated). This causes the seed engine to silently fall back to `.env.test` when invoked with space-separated arguments, connecting to the wrong database and causing seeding failures.

## Environment

- **Application Version**: Payload 3.66.0
- **Environment**: production (attempting to seed remote database)
- **Node Version**: v22.x
- **Database**: PostgreSQL 17.6 (Supabase remote)
- **Last Working**: N/A (design flaw from implementation)

## Reproduction Steps

1. Run `pnpm run seed:run --env production` (space-separated format)
2. Observe the log output shows `Loading environment from: .env.test` (wrong environment)
3. Seeding connects to local database instead of production

**Alternative (correct) invocation:**
- `pnpm run seed:run --env=production` (equals format - works correctly)
- `pnpm run seed:run:remote` (dedicated script - works correctly)

## Expected Behavior

Both `--env production` and `--env=production` should be parsed correctly and load `.env.production`.

## Actual Behavior

Only `--env=production` format is recognized. The space-separated `--env production` format fails to match and defaults to loading `.env.test`.

## Diagnostic Data

### Console Output
```
[payload.seeding.config] Loading environment from: .env.test    # WRONG!
[seed-engine] Loading environment from: .env.test               # WRONG!
```

### Command Invoked
```bash
pnpm run seed:run --env .env.production
# Actually parsed as: --env not found, default to "test"
# Additional note: ".env.production" passed as filename, but function expects just "production"
```

## Error Stack Traces

No stack trace - silent failure (defaults to test environment without warning for space-separated format).

## Related Code

- **Affected Files**:
  - `apps/payload/src/seed/seed-engine/index.ts:38-49`
- **Recent Changes**: None (design issue from initial implementation)
- **Suspected Functions**: `getEnvNameFromArgs()`

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `getEnvNameFromArgs()` function uses a regex/string match that only recognizes `--env=<value>` format, not `--env <value>` format.

**Detailed Explanation**:

The problematic code at `apps/payload/src/seed/seed-engine/index.ts:38-49`:

```typescript
function getEnvNameFromArgs(): string {
  const envFlagIndex = process.argv.findIndex(arg => arg.startsWith('--env='));
  if (envFlagIndex !== -1) {
    const envValue = process.argv[envFlagIndex].split('=')[1];
    // ...
  }
  return 'test'; // Default for backwards compatibility
}
```

The function ONLY looks for arguments starting with `--env=`. When `--env production` is passed:
- `process.argv` contains `['--env', 'production']` (two separate elements)
- `arg.startsWith('--env=')` returns `false` for `'--env'`
- Function defaults to `'test'`

Additionally, there's a **dual-parsing issue**:
1. **Early parsing** (lines 38-49): Manual argv parsing before Commander runs - only accepts `--env=value`
2. **Commander parsing** (lines 102-106): Supports `--env <value>` but runs AFTER environment is already loaded

The early parsing was intentionally placed before Commander because environment variables must be loaded before Payload initializes. However, this creates an inconsistency where Commander accepts both formats but the early parser only accepts one.

**Supporting Evidence**:
```
Line 39: const envFlagIndex = process.argv.findIndex(arg => arg.startsWith('--env='));
```
This line explicitly requires the equals sign format.

### How This Causes the Observed Behavior

1. User invokes `pnpm run seed:run --env production` or `--env .env.production`
2. `getEnvNameFromArgs()` searches for `--env=` prefix in argv
3. No match found (because argv contains `['--env', 'production']` not `['--env=production']`)
4. Function returns default `'test'`
5. `.env.test` is loaded instead of `.env.production`
6. Seeding uses local database credentials
7. Validation errors occur due to duplicate records (local DB already seeded)

### Confidence Level

**Confidence**: High

**Reasoning**: Direct code analysis shows the parsing logic explicitly requires `--env=` format. The log output confirms `.env.test` was loaded. The behavior is deterministic and reproducible.

## Fix Approach (High-Level)

Update `getEnvNameFromArgs()` to handle both formats:

1. Check for `--env=value` format (current behavior)
2. Also check for `--env value` format by looking at the next argv element
3. Ensure the value is just the environment name (`production`) not the full filename (`.env.production`)

Alternative: Add input validation/warning when unrecognized format is detected instead of silently defaulting.

## Diagnosis Determination

Root cause definitively identified: The `getEnvNameFromArgs()` function's string matching logic (`arg.startsWith('--env=')`) does not account for the space-separated argument format that Commander.js and shell conventions support.

The immediate workaround is to use the correct `--env=production` format (with equals sign) or use the `pnpm run seed:run:remote` script which already uses the correct format.

## Additional Context

- The `seed:run:remote` script in package.json already uses the correct format: `--env=production`
- The Commander option definition suggests `--env <environment>` format in help text, creating user confusion
- This is a usability bug rather than a functional bug - the correct format works fine

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash (argument parsing test), grep*
