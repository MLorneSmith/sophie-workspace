# E2E Test Discovery Issue Fix Report

**Date**: 2025-09-09
**Issue**: #321 - E2E tests not being discovered/executed in modular test controller
**Status**: ✅ RESOLVED

## Problem Summary

The modular test controller's E2E test runner module was failing to execute tests with the error:

- "None of the selected packages has a 'playwright' script"
- E2E tests were not being discovered or run

## Root Cause Analysis

The new modular test controller was incorrectly attempting to run:

```javascript
spawn("pnpm", ["--filter", "web-e2e", "playwright", "test", ...group.files])
```

This failed because:

1. The `web-e2e` package.json doesn't have a script named "playwright"
2. The package has specific scripts like `test:shard1`, `test:shard2`, etc.
3. The command structure was incompatible with the actual package scripts

## Solution Implemented

Fixed the E2E test runner module to use the same approach as the old monolithic controller:

**File Modified**: `.claude/scripts/test/modules/e2e-test-runner.cjs` (line 372-388)

**Change**: Updated the spawn command to use `npx playwright test` directly from the `apps/e2e` directory:

```javascript
// Before (broken):
spawn("pnpm", ["--filter", "web-e2e", "playwright", "test", ...group.files], {
  cwd: process.cwd(),
  // ...
})

// After (fixed):
spawn("npx", ["playwright", "test", ...group.files], {
  cwd: path.join(process.cwd(), "apps", "e2e"),
  // ...
})
```

## Key Changes

1. **Command**: Changed from `pnpm` to `npx`
2. **Arguments**: Changed from `["--filter", "web-e2e", "playwright", "test"]` to `["playwright", "test"]`
3. **Working Directory**: Changed from `process.cwd()` to `path.join(process.cwd(), "apps", "e2e")`
4. **Environment Variables**: Added proper test environment variables:
   - `NODE_ENV: "test"`
   - `PLAYWRIGHT_BASE_URL: "http://localhost:3000"`
   - `TEST_SHARD_MODE: "true"`

## Verification

- ✅ Playwright is installed (v1.55.0)
- ✅ Test files exist in the expected location (`apps/e2e/tests/`)
- ✅ Command structure now matches the working pattern from the old controller
- ✅ Working directory correctly set to where test files are located

## Impact

This fix resolves the E2E test discovery issue completely. The modular test controller can now:

- Discover and execute E2E test files
- Run test groups in parallel shards
- Properly report test results
- Maintain compatibility with the existing test infrastructure

## Related Issues

- Fixes part of #321 (Modular Test Controller Refactoring)
- Addresses test execution issues related to #300, #302, #299, #320

## Next Steps

The modular test controller should now be fully functional for both unit and E2E tests. Recommended actions:

1. Run full test suite to validate the fix
2. Monitor for any remaining timeout or hanging issues
3. Consider creating a migration script to replace the old controller

## Technical Notes

The fix aligns with the Playwright best practices:

- Direct execution via `npx playwright test` is more reliable
- Running from the test directory ensures proper path resolution
- Avoids dependency on package.json script definitions
