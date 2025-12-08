# Bug Diagnosis: Payload Seed Engine Unit Tests Failing - Missing SEED_USER_PASSWORD

**ID**: ISSUE-960
**Created**: 2025-12-08T14:35:00Z
**Reporter**: system (test suite)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

85 unit tests in the Payload seed-engine are failing due to a missing environment variable requirement (`SEED_USER_PASSWORD`) that was added to `validateEnvironment()` without corresponding updates to the test setup files. Additionally, integration tests that attempt real database connections fail with SSL certificate errors because `.env.test` file doesn't exist.

## Environment

- **Application Version**: dev branch, commit 5885661d4
- **Environment**: development/test (local)
- **Node Version**: 20.x
- **Database**: PostgreSQL (local Supabase on port 54522)
- **Last Working**: Before commit d1c99013a (Oct 1, 2025)

## Reproduction Steps

1. Run `pnpm test:unit` from project root
2. Observe 85 failures in payload package tests
3. All failures are in `apps/payload/src/seed/seed-engine/` directory

## Expected Behavior

All 535 unit tests should pass when the test environment is properly configured.

## Actual Behavior

85 tests fail with two categories of errors:
1. **Validation failures**: `validateEnvironment()` returns `{ valid: false }` because `SEED_USER_PASSWORD` is not set
2. **Database connection errors**: "self-signed certificate in certificate chain" when tests try to connect to Postgres

## Diagnostic Data

### Console Output

```
FAIL payload src/seed/seed-engine/core/payload-initializer.test.ts > payload-initializer > validateEnvironment > should pass validation with all required variables
AssertionError: expected false to be true // Object.is equality

FAIL payload src/seed/seed-engine/core/payload-initializer.test.ts > payload-initializer > validateEnvironment > should list all missing variables
AssertionError: expected [ 'DATABASE_URI', …(2) ] to have a length of 2 but got 3

FAIL payload src/seed/seed-engine/__tests__/integration/collection-filtering.test.ts
Error: cannot connect to Postgres: self-signed certificate in certificate chain
```

### Test Summary

```json
{
  "unit": {
    "total": 535,
    "passed": 446,
    "failed": 85
  }
}
```

### Failed Test Files

| File | Failed Tests | Root Cause |
|------|-------------|------------|
| `payload-initializer.test.ts` | 5 | Missing SEED_USER_PASSWORD |
| `seed-orchestrator.test.ts` | 21 | Database connection SSL error |
| `collection-filtering.test.ts` | 21 | Database connection SSL error |
| `error-scenarios.test.ts` | Multiple | Database connection SSL error |
| `full-workflow.test.ts` | Multiple | Database connection SSL error |
| `idempotency.test.ts` | Multiple | Database connection SSL error |

## Error Stack Traces

### Validation Error

```
AssertionError: expected [ 'DATABASE_URI', …(2) ] to have a length of 2 but got 3
  ❯ src/seed/seed-engine/core/payload-initializer.test.ts:77:30
   75|
   76|     expect(result.valid).toBe(false);
   77|     expect(result.missing).toHaveLength(2);
      |                            ^
   78|     expect(result.missing).toContain('DATABASE_URI');
   79|     expect(result.missing).toContain('PAYLOAD_SECRET');
```

### SSL Certificate Error

```
Error: cannot connect to Postgres. Details: self-signed certificate in certificate chain
  at postgresAdapter
  at payload-initializer.ts:143 (getPayload)
  Payload initialization failed: Error: cannot connect to Postgres: self-signed certificate in certificate chain
```

## Related Code

- **Affected Files**:
  - `apps/payload/vitest.setup.ts` - Missing `SEED_USER_PASSWORD` fallback
  - `apps/payload/src/seed/seed-engine/core/payload-initializer.ts` - Added SEED_USER_PASSWORD requirement
  - `apps/payload/src/seed/seed-engine/core/payload-initializer.test.ts` - Missing env var in beforeEach
  - `apps/payload/src/seed/seed-engine/config.ts` - Defines ENV_VARS.SEED_USER_PASSWORD
  - `apps/payload/.env.test` - **FILE DOES NOT EXIST** (only `.env.test.example`)

- **Recent Changes**:
  - Commit `d1c99013a` (Oct 1, 2025) added `SEED_USER_PASSWORD` to `validateEnvironment()` but did not update tests

- **Suspected Functions**:
  - `validateEnvironment()` in `payload-initializer.ts:50-70`
  - `initializePayload()` in `payload-initializer.ts:106-152`

## Related Issues & Context

### Direct Predecessors

No directly related closed issues found.

### Historical Context

This is a new regression introduced when the seeding infrastructure was enhanced. The `SEED_USER_PASSWORD` environment variable was added as a requirement for user seeding but test fixtures weren't updated accordingly.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `validateEnvironment()` function was modified to require `SEED_USER_PASSWORD` environment variable, but test setup files were not updated to provide this variable.

**Detailed Explanation**:

In commit `d1c99013a`, the following change was made to `payload-initializer.ts`:

```typescript
// Added at lines 62-64
if (!process.env[ENV_VARS.SEED_USER_PASSWORD]) {
  missing.push(ENV_VARS.SEED_USER_PASSWORD);
}
```

However, the corresponding test files were not updated:

1. **`vitest.setup.ts`**: Sets `DATABASE_URI` and `PAYLOAD_SECRET` as fallbacks (lines 20-26) but does NOT set `SEED_USER_PASSWORD`

2. **`payload-initializer.test.ts`**: The `beforeEach` hook (lines 24-33) sets only:
   - `process.env.DATABASE_URI`
   - `process.env.PAYLOAD_SECRET`
   - `process.env.NODE_ENV`

3. **`.env.test` file**: Does not exist. Only `.env.test.example` exists with the required variables.

Additionally, integration tests that call `initializePayload()` → `getPayload()` attempt real database connections. When the seeding config (`payload.seeding.config.ts`) is loaded:
- It tries to load `.env.test` which doesn't exist
- It falls back to vitest.setup.ts values
- Database connection attempts fail with SSL errors because `sslmode=disable` isn't being properly applied to the Postgres adapter

**Supporting Evidence**:

1. Test output shows 3 missing variables instead of expected 2:
   ```
   expected [ 'DATABASE_URI', …(2) ] to have a length of 2 but got 3
   ```

2. The config.ts file defines `SEED_USER_PASSWORD` as required:
   ```typescript
   export const ENV_VARS = {
     DATABASE_URI: 'DATABASE_URI',
     PAYLOAD_SECRET: 'PAYLOAD_SECRET',
     NODE_ENV: 'NODE_ENV',
     SEED_USER_PASSWORD: 'SEED_USER_PASSWORD',  // <-- Added
   } as const;
   ```

3. `.env.test` file doesn't exist:
   ```bash
   $ test -f apps/payload/.env.test
   # Returns false - file does not exist
   ```

### How This Causes the Observed Behavior

1. Vitest loads `vitest.setup.ts` which sets `DATABASE_URI` and `PAYLOAD_SECRET` but NOT `SEED_USER_PASSWORD`
2. Tests import `payload-initializer.ts` which imports `payload.seeding.config.ts`
3. `payload.seeding.config.ts` tries to load `.env.test` (doesn't exist) - silently fails
4. Tests call `validateEnvironment()` which checks for 3 required variables
5. `SEED_USER_PASSWORD` is undefined → validation returns `{ valid: false, missing: ['SEED_USER_PASSWORD'] }`
6. Integration tests that proceed to `initializePayload()` hit SSL errors when connecting to database

### Confidence Level

**Confidence**: High

**Reasoning**:
- The test assertion error explicitly shows 3 missing variables instead of 2
- The git diff clearly shows `SEED_USER_PASSWORD` was added as a requirement
- Direct inspection of test files confirms they don't set this variable
- The `.env.test` file definitively does not exist (only `.env.test.example`)

## Fix Approach (High-Level)

Two fixes needed:

1. **Create `.env.test` file**: Copy `.env.test.example` to `.env.test` (or symlink it), ensuring `SEED_USER_PASSWORD` is set

2. **Update test setup files**:
   - Add `SEED_USER_PASSWORD` to `vitest.setup.ts` fallbacks:
     ```typescript
     if (!process.env.SEED_USER_PASSWORD) {
       process.env.SEED_USER_PASSWORD = 'test-password';
     }
     ```
   - Add `SEED_USER_PASSWORD` to `payload-initializer.test.ts` `beforeEach`:
     ```typescript
     process.env.SEED_USER_PASSWORD = 'test-password';
     ```

3. **Update test assertions** in `payload-initializer.test.ts`:
   - Test "should list all missing variables" expects 2 but should expect 3 (or needs SEED_USER_PASSWORD excluded)

## Diagnosis Determination

Root cause conclusively identified: Missing `SEED_USER_PASSWORD` environment variable in test setup after it was added as a requirement in `validateEnvironment()`. The fix is straightforward - update test setup files to include the missing variable.

## Additional Context

- 85 tests fail (all in payload package)
- 593 occurrences of "self-signed certificate" error in test output
- The issue only affects unit tests - E2E tests are separate
- This is a test infrastructure issue, not a production bug

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (grep, test, git log, git diff), Read, Glob*
