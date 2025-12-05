# Bug Diagnosis: Shard 12 filter not working - runs all shards instead

**ID**: ISSUE-pending
**Created**: 2025-12-04T17:15:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

When running `/test 12` to execute only E2E shard 12 (Team Accounts tests), the test controller runs ALL 12 shards instead of just shard 12. This is caused by a hardcoded valid shard range of `1-11` in the argument parsing code, which excludes shard 12 from being recognized as valid.

## Environment

- **Application Version**: dev branch (dec1b61b5)
- **Environment**: development
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Never worked for shard 12

## Reproduction Steps

1. Run `/test 12` or `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 12`
2. Observe the output shows "Mode: E2E Shard(s) 12"
3. Notice the test controller logs "Configuration: Unit=true, E2E=true" (not shard-specific)
4. All 12 shards run instead of just shard 12

## Expected Behavior

Only shard 12 (Team Accounts tests) should run, with output like:
- "Configuration: E2E Shard(s) 12 only"
- Only 7-8 tests executed (Team Accounts shard)

## Actual Behavior

All 12 shards run, executing 200+ E2E tests plus unit tests, taking ~10 minutes instead of ~30 seconds.

## Diagnostic Data

### Console Output

```
Mode: E2E Shard(s) 12
Log: /tmp/test-output.log

Starting test execution...

[timestamp] INFO: Configuration: Unit=true, E2E=true  <-- Should say "E2E Shard(s) 12 only"
```

### Root Cause Code

File: `.ai/ai_scripts/testing/infrastructure/test-controller.cjs`

**Location 1 - Numeric argument parsing (lines 186-198)**:
```javascript
// Check for numeric argument (shard number)
if (/^\d+$/.test(arg)) {
    const shardNum = parseInt(arg, 10);
    if (shardNum >= 1 && shardNum <= 11) {  // BUG: Should be <= 12
        options.shard = options.shard || [];
        options.shard.push(shardNum);
        options.skipUnit = true;
    } else {
        logError(`Invalid shard number: ${shardNum}. Valid range is 1-11.`);
    }
    continue;
}
```

**Location 2 - --shard flag parsing (lines 207-215)**:
```javascript
for (const num of shardNums) {
    if (num >= 1 && num <= 11) {  // BUG: Should be <= 12
        options.shard.push(num);
    } else {
        logError(`Invalid shard number: ${num}. Valid range is 1-11.`);
    }
}
```

## Error Stack Traces

No stack trace - this is a silent logic bug. The error message "Invalid shard number: 12. Valid range is 1-11." is logged but may be filtered out by the safe-test-runner.sh output filter.

## Related Code

- **Affected Files**:
  - `.ai/ai_scripts/testing/infrastructure/test-controller.cjs` (lines 186-220)
- **Recent Changes**: Shard 12 was added in recent commits but the validation range was not updated
- **Suspected Functions**: `parseArguments()` method in TestController class

## Related Issues & Context

### Historical Context

The shard range validation was likely set to 1-11 when there were only 11 shards. When shard 12 (Team Accounts) was added, the validation logic was not updated to include the new shard.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Hardcoded shard validation range `1-11` excludes the newly added shard 12.

**Detailed Explanation**:
The `parseArguments()` method in `test-controller.cjs` validates shard numbers against a hardcoded range of 1-11. When shard 12 is requested:
1. The numeric check `shardNum >= 1 && shardNum <= 11` returns `false` for 12
2. The shard is not added to `options.shard`
3. An error is logged but may be filtered from output
4. Since `options.shard` remains `null`, no shard filter is applied
5. The E2E runner runs all shards by default

**Supporting Evidence**:
- Code reference: `.ai/ai_scripts/testing/infrastructure/test-controller.cjs:191`
- The loadTestGroups() method in e2e-test-runner.cjs correctly defines 12 shards
- The log "Configuration: Unit=true, E2E=true" confirms no shard filter was applied

### How This Causes the Observed Behavior

1. User requests shard 12: `/test 12`
2. safe-test-runner.sh correctly passes "12" to test-controller.cjs
3. parseArguments() rejects 12 as invalid (range is 1-11)
4. options.shard remains null
5. No shard filter is set on E2ETestRunner
6. E2ETestRunner.run() executes all testGroups (all 12 shards)

### Confidence Level

**Confidence**: High

**Reasoning**: Direct code analysis shows the exact validation logic that rejects shard 12. The e2e-test-runner.cjs confirms 12 shards exist. The mismatch between definition (12 shards) and validation (1-11 range) is the clear root cause.

## Fix Approach (High-Level)

Change the validation range from `1-11` to `1-12` in two locations:
1. Line 191: `if (shardNum >= 1 && shardNum <= 12)`
2. Line 210: `if (num >= 1 && num <= 12)`

Also update the error messages on lines 195 and 213 to say "Valid range is 1-12."

## Diagnosis Determination

Root cause confirmed: The shard validation logic uses a hardcoded range of 1-11, but 12 shards exist. This is a simple off-by-one configuration bug that requires updating two validation conditions and two error messages.

## Additional Context

The fix is straightforward - 4 character changes (11 -> 12) in two places, plus updating error message text. No architectural changes needed.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash (git log, git branch)*
