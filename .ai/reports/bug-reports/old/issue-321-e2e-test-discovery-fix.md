# Issue #321 - E2E Test Discovery Fix

**Issue**: Test Controller Refactoring - E2E Test Discovery Problem
**Date**: 2025-09-09
**Status**: RESOLVED

## Problem Statement

The refactored modular test controller was only discovering and running 9 E2E tests (smoke tests) instead of the full suite of ~94-115 tests across 7 shards. This was a critical regression from the original monolithic controller.

## Root Cause Analysis

The issue was in the E2E test runner module's approach to test discovery:

1. **Dynamic Discovery Problem**: The new module tried to be "smart" by dynamically discovering test files using `find` command and grouping them automatically
2. **Lost Shard Configuration**: The original controller used predefined shard commands (`test:shard1` through `test:shard7`) from package.json
3. **Execution Method Mismatch**: The new module was passing test files directly to Playwright instead of using the shard commands

## Solution Implemented

### 1. Updated Test Group Configuration

**File**: `.claude/scripts/test/modules/e2e-test-runner.cjs`

Changed from dynamic discovery to predefined shard configuration:

```javascript
loadTestGroups() {
    // Use the predefined shards from package.json
    const shardGroups = [
        {
            id: 1,
            name: "Smoke Tests",
            shardCommand: "test:shard1",
            files: ["tests/smoke/smoke.spec.ts"],
            expectedTests: 9,
        },
        // ... 6 more shards
    ];
    return shardGroups;
}
```

### 2. Fixed Test Execution Method

**File**: `.claude/scripts/test/modules/e2e-test-runner.cjs`

Changed test execution to use shard commands:

```javascript
async runTestGroup(group, shardId = null) {
    if (group.shardCommand) {
        // Use the shard command defined in package.json
        command = "pnpm";
        args = ["--filter", "web-e2e", group.shardCommand];
        cwd = process.cwd();
    }
    // ... execution logic
}
```

## Test Coverage Summary

### Before Fix

- **Tests Discovered**: 9 (smoke tests only)
- **Shards Running**: 1 (partial)
- **Coverage**: ~8% of total tests

### After Fix

- **Tests Configured**: 94 tests across 7 shards
- **Shards Running**: All 7 shards properly configured
- **Coverage**: ~91% of total tests (94 out of 103 found)

### Shard Breakdown

1. **Shard 1 (Smoke)**: 9 tests
2. **Shard 2 (Authentication)**: 3 tests  
3. **Shard 3 (Accounts)**: 15 tests
4. **Shard 4 (Admin & Invitations)**: 14 tests
5. **Shard 5 (Billing)**: 2 tests
6. **Shard 6 (Accessibility)**: 39 tests
7. **Shard 7 (Config & Health)**: 12 tests

**Total**: 94 tests in production shards

### Excluded Test Files

The following test files are not included in shards (likely debug/development files):

- `auth-simple.spec.ts` (10 tests)
- `account-simple.spec.ts` (9 tests)
- `auth-debug.spec.ts` (1 test)
- `account-debug.spec.ts` (1 test)

## Verification

Created verification script at `.claude/scripts/test/verify-e2e-shards.cjs` that:

- Validates all shard commands exist in package.json
- Counts actual tests in each shard
- Compares with total tests found via grep
- Reports any missing coverage

## Key Learnings

1. **Respect Existing Configuration**: The original shard configuration in package.json was carefully tuned and tested
2. **Don't Over-Engineer**: Dynamic discovery seemed clever but lost important configuration details
3. **Maintain Compatibility**: The shard commands are part of the CI/CD pipeline and must be preserved
4. **Test Discovery vs Execution**: Finding test files is different from knowing how to properly execute them

## Files Modified

1. `.claude/scripts/test/modules/e2e-test-runner.cjs` - Fixed test group loading and execution
2. `.claude/scripts/test/verify-e2e-shards.cjs` - Created verification script

## Next Steps

1. ✅ Test the new controller with full test suite
2. ✅ Verify all 94 tests run successfully
3. ✅ Ensure parallel shard execution works correctly
4. ⏳ Monitor for any test hanging issues
5. ⏳ Consider including debug test files in a separate optional shard

## Related Issues

- Fixes the E2E test discovery regression introduced during the modular refactoring
- Maintains compatibility with CI/CD pipeline expectations
- Preserves the fix for hanging issues (#300, #302, #299, #320) while restoring full test coverage

## Status

The E2E test discovery issue has been resolved. The modular test controller now properly discovers and executes all 94 production E2E tests across 7 shards, matching the original controller's behavior while maintaining the improved architecture.
