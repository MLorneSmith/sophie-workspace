# Bug Diagnosis: Payload integration tests fail with self-signed certificate error

**ID**: ISSUE-963
**Created**: 2025-12-08T15:00:00Z
**Reporter**: system (observed during bug fix #962)
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

Six Payload integration test files fail with "self-signed certificate in certificate chain" errors when tests attempt to actually initialize Payload and connect to the database. This affects 82 tests across 6 test files. The root cause is a combination of: (1) missing `.env.test` file, (2) `.env.test.example` lacking `sslmode=disable`, and (3) module-level config caching that ignores environment variable changes in `beforeEach` hooks.

## Environment

- **Application Version**: Payload 3.66.0
- **Environment**: test (vitest)
- **Node Version**: 22.16.0
- **Database**: PostgreSQL 17 (local Supabase at localhost:54522)
- **Last Working**: Unknown (likely a longstanding issue)

## Reproduction Steps

1. Ensure no `.env.test` file exists in `apps/payload/` (only `.env.test.example`)
2. Run `pnpm --filter payload test`
3. Observe 82 test failures across 6 files with SSL certificate errors

## Expected Behavior

Tests should connect to local Supabase PostgreSQL without SSL verification since it uses self-signed certificates.

## Actual Behavior

Tests fail with error: `Error: cannot connect to Postgres. Details: self-signed certificate in certificate chain`

## Diagnostic Data

### Console Output
```
[09:56:02] ERROR: Error: cannot connect to Postgres. Details: self-signed certificate in certificate chain
    err: {
      "type": "Error",
      "message": "self-signed certificate in certificate chain",
      "stack":
          Error: self-signed certificate in certificate chain
              at pg-pool/index.js:45:11
              at connectWithReconnect (@payloadcms/db-postgres/dist/connect.js:7:18)
```

### Test Results
```
Test Files  6 failed | 28 passed (34)
     Tests  82 failed | 710 passed | 1 skipped (793)
    Errors  118 errors
```

### Affected Test Files
```
src/seed/seed-engine/__tests__/integration/full-workflow.test.ts
src/seed/seed-engine/__tests__/integration/error-scenarios.test.ts
src/seed/seed-engine/__tests__/integration/idempotency.test.ts
src/seed/seed-engine/__tests__/integration/collection-filtering.test.ts
src/seed/seed-engine/core/payload-initializer.test.ts (2 tests)
src/seed/seed-engine/index.test.ts
```

## Error Stack Traces
```
Error: self-signed certificate in certificate chain
    at pg-pool/index.js:45:11
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at connectWithReconnect (@payloadcms/db-postgres/dist/connect.js:7:18)
    at Object.connect (@payloadcms/db-postgres/dist/connect.js:46:13)
    at BasePayload.init (payload/dist/index.js:360:13)
    at getPayload (payload/dist/index.js:581:26)
    at initializePayload (payload-initializer.ts:143:23)
```

## Related Code
- **Affected Files**:
  - `apps/payload/src/payload.seeding.config.ts` - Reads DATABASE_URI at module load time
  - `apps/payload/vitest.setup.ts` - Sets fallback DATABASE_URI with sslmode=disable
  - `apps/payload/.env.test.example` - Missing sslmode=disable in DATABASE_URI
  - `apps/payload/src/seed/seed-engine/__tests__/integration/*.test.ts` - All integration tests
- **Recent Changes**: Long-standing issue (see #877, #561)
- **Suspected Functions**: `payload.seeding.config.ts` module-level config evaluation

## Related Issues & Context

### Direct Predecessors
- #877 (CLOSED): "Bug Diagnosis: Payload CMS database connection fails with self-signed certificate error" - Same SSL error, different context (development server)
- #561 (CLOSED): "Payload Package Tests: 86 Failures with 121 Unhandled Promise Rejections" - Exact same test failures

### Related Infrastructure Issues
- #881 (CLOSED): "Bug Diagnosis: NODE_ENV=production in Claude Code causes Payload CMS SSL connection errors"
- #882 (CLOSED): "Bug Fix: NODE_ENV=production in Claude Code causes Payload CMS SSL connection errors"
- #879 (CLOSED): "Bug Fix: Payload CMS database connection SSL certificate error"

### Historical Context
This is a recurring issue (#561 from 2025-11-05, #877 from 2025-12-03). Previous fixes addressed development server connections but not test environment specifically. The test failures have persisted because:
1. Tests that only validate logic (not connecting to DB) pass
2. Integration tests that actually connect fail
3. The 710 passing tests mask the 82 failing integration tests

## Root Cause Analysis

### Identified Root Cause

**Summary**: `payload.seeding.config.ts` reads `DATABASE_URI` at module evaluation time (before tests can set environment variables), and when `.env.test` doesn't exist or lacks `sslmode=disable`, node-postgres defaults to SSL verification which fails against local Supabase's self-signed certificate.

**Detailed Explanation**:

1. **Module-level config caching**: `payload.seeding.config.ts` lines 25-26 load `.env.test` and read `DATABASE_URI` at import time:
   ```typescript
   const envPath = path.resolve(_dirname, "../.env.test");
   loadEnv({ path: envPath, override: true });
   // ...
   const databaseURI = process.env.DATABASE_URI;  // Cached at module load
   ```

2. **Missing `.env.test` file**: The file doesn't exist (only `.env.test.example`), so dotenv loads nothing

3. **Fallback order problem**:
   - `vitest.setup.ts` sets `DATABASE_URI` with `sslmode=disable` as fallback
   - But `payload.seeding.config.ts` is imported AFTER `vitest.setup.ts` runs
   - The config module re-reads env vars at import, potentially getting different values

4. **Test beforeEach timing**: Tests set `process.env.DATABASE_URI` in `beforeEach`, but this is too late - the config module was already imported and cached

5. **SSL default behavior**: When `sslmode` is not specified, `pg` library defaults to attempting SSL, which fails against self-signed certs

**Supporting Evidence**:
- `.env.test.example` line 6: `DATABASE_URI=postgresql://postgres:postgres@localhost:54522/postgres` (NO sslmode)
- `vitest.setup.ts` line 22: Has correct `sslmode=disable`
- `payload.seeding.config.ts` line 26: Loads `.env.test` with `override: true`, potentially overwriting vitest.setup.ts values
- Error occurs only in tests that actually call `initializePayload()` which imports the config

### How This Causes the Observed Behavior

1. Vitest runs `vitest.setup.ts` first, setting `DATABASE_URI` with `sslmode=disable`
2. Test file imports `payload-initializer.ts`
3. `payload-initializer.ts` imports `payloadSeedingConfig` from `payload.seeding.config.ts`
4. `payload.seeding.config.ts` loads `.env.test` (which doesn't exist) or reads env vars without `sslmode`
5. The `postgresAdapter` is created with the cached `DATABASE_URI` (without sslmode)
6. When test calls `initializePayload()`, Payload tries to connect with SSL enabled
7. Local Supabase has self-signed cert → connection rejected

### Confidence Level

**Confidence**: High

**Reasoning**:
- Error message specifically mentions "self-signed certificate in certificate chain"
- Only integration tests that actually connect fail; unit tests pass
- `.env.test.example` demonstrably lacks `sslmode=disable`
- This matches the exact pattern from issues #877 and #561
- Stack trace shows `pg-pool` → `@payloadcms/db-postgres` → `payload-initializer.ts`

## Fix Approach (High-Level)

Two-part fix required:

1. **Add `sslmode=disable` to `.env.test.example`**: Update line 6 from:
   ```
   DATABASE_URI=postgresql://postgres:postgres@localhost:54522/postgres
   ```
   to:
   ```
   DATABASE_URI=postgresql://postgres:postgres@localhost:54522/postgres?sslmode=disable
   ```

2. **Create `.env.test` file**: Either:
   - Add a script to copy `.env.test.example` to `.env.test` during test setup
   - Or commit a `.env.test` file (safe since it only contains local dev credentials)

3. **Alternative**: Modify `payload.seeding.config.ts` to check for `sslmode` and add it if missing for non-production environments

## Diagnosis Determination

Root cause definitively identified: The DATABASE_URI used by Payload's postgres adapter lacks `sslmode=disable`, causing SSL verification to fail against local Supabase's self-signed certificate. The fix is straightforward - ensure `sslmode=disable` is present in the test environment's DATABASE_URI.

## Additional Context

This is the third time this SSL certificate issue has been diagnosed (see #877, #561). Previous fixes addressed the development server but not the test environment specifically. A comprehensive fix should address both:
- Development: `.env.development` (already has `sslmode=disable`)
- Test: `.env.test.example` and ensure `.env.test` exists (currently missing `sslmode=disable`)

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Bash (git, gh issue), vitest*
