# Bug Fix: Make Payload CMS Authentication Optional in Global Setup

**Related Diagnosis**: #985
**Severity**: high
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Global setup always attempts Payload authentication, even for test batches that don't include Payload-specific shards. When Payload server isn't running, the entire batch fails.
- **Fix Approach**: Wrap Payload authentication in try-catch block, log as warning instead of throwing, allow global setup to complete successfully
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The test infrastructure runs E2E tests in multiple batches/shards (1-12), with only shards 7-8 including Payload-specific tests. However, the global-setup.ts runs once per batch and unconditionally attempts to authenticate the "payload-admin" user to Payload CMS for every batch.

When the Payload server isn't running (batches 1, 3, and others):
1. `loginToPayloadViaAPI()` fails to get a response
2. Three retry attempts all fail (500ms → 1000ms → 2000ms backoff)
3. `loginToPayloadWithRetry()` throws an error at global-setup.ts:660
4. The entire test batch is marked as failed
5. All tests in that batch fail (24 total failures across batches 1 and 3)

Batches 7-8 succeed because their startup process automatically launches the Payload server.

**Fix Impact**: This fix allows non-Payload test batches to proceed even if Payload server isn't running, while Payload shards (7-8) still successfully authenticate when they auto-start Payload.

### Solution Approaches Considered

#### Option 1: Make Payload Authentication Optional with Graceful Failure ⭐ RECOMMENDED

**Description**: Wrap the Payload authentication block (global-setup.ts:582-661) in a try-catch that logs a warning instead of throwing an error. This allows global setup to complete successfully even if Payload isn't running.

**Pros**:
- Minimal code change (wrap existing block in try-catch)
- Clear separation of concerns: Payload-specific shards handle their own Payload setup
- No changes to test runner configuration needed
- Maintains existing error handling for Supabase authentication
- Non-Payload tests can run independently of Payload server state
- Zero impact on Payload-specific tests (they still authenticate successfully when server is running)

**Cons**:
- Payload-specific tests won't have pre-authenticated session if Payload auth fails silently
- Requires that Payload-specific tests handle auth failure gracefully

**Risk Assessment**: low - Payload tests only run when Payload server is auto-started, so failure is rare. Tests can handle missing auth state.

**Complexity**: simple - Single code block wrap, no new logic required.

#### Option 2: Skip Payload Authentication for Non-Payload Shards

**Description**: Detect which shard is running and only attempt Payload auth for shards 7-8. Would require passing shard info through global setup.

**Why Not Chosen**: Requires changes to playwright.config.ts, test runner orchestration, and environment setup. More complex. Current solution is cleaner - let each shard/batch manage its own Payload state.

#### Option 3: Always Start Payload Server

**Description**: Start Payload server at the beginning of every global setup, not just for specific shards.

**Why Not Chosen**: Unnecessary resource waste. Payload should only run for shards that use it. Current batch/shard orchestration is intentional for performance.

### Selected Solution: Graceful Failure with Try-Catch

**Justification**:
- Minimal, surgical fix that addresses root cause without over-engineering
- Aligns with test infrastructure design: each batch manages only what it needs
- Preserves all existing functionality for Payload-specific tests
- Non-Payload tests gain independence from Payload server state
- Low risk: only affects error path that isn't normally hit in CI

**Technical Approach**:
- Wrap existing Payload auth block (lines 582-661) in try-catch
- Log non-fatal warnings when Payload auth fails
- Continue global setup and let Payload-specific tests run anyway
- Tests that actually need Payload will fail naturally if server isn't running

**Architecture Changes**: None. Error handling pattern only.

**Migration Strategy**: No migration needed. Fix is backward compatible.

## Implementation Plan

### Affected Files

- `apps/e2e/global-setup.ts` - Wrap Payload auth section (lines 582-661) in try-catch with warning logging

### New Files

None - This is a pure code change.

### Step-by-Step Tasks

#### Step 1: Wrap Payload Authentication in Try-Catch Block

Modify the Payload auth section (global-setup.ts:582-661) to catch errors gracefully instead of rethrowing them.

**Specific changes**:
- Add try-catch around the entire Payload auth block
- Move the existing `try` (line 590) so it wraps from the beginning (line 582)
- In catch block, log warning instead of throwing error
- Continue with next phase of setup (line 664)

**Why this step first**: The entire section is currently thrown on any error - we need to catch at the top level to prevent batch failure.

#### Step 2: Update Error Logging

Replace the `throw error` (line 660) with a warning log that explains:
- Payload authentication failed
- This is expected if Payload server isn't running
- Payload-specific tests will fail if they need this auth
- Non-Payload tests should continue normally

**Logging format**:
```typescript
console.warn(
  `⚠️  Payload CMS authentication failed for ${authState.name}: ${error.message}. ` +
  `This is expected if Payload server is not running. ` +
  `Payload-specific tests will handle their own authentication.`
);
```

#### Step 3: Verify Global Setup Continues

After the catch block, ensure global setup continues with:
- Saving authenticated state (line 665)
- Closing context and browser (lines 676, 679)
- Printing completion message (line 682)

This is already in place; no changes needed.

#### Step 4: Add Debug Logging for Payload Failure

Add debug logs when Payload auth fails to help troubleshoot:
- Record the error message
- Record that this is expected behavior
- Include auth state name for context

#### Step 5: Validation

- Run tests on batches without Payload (should now pass)
- Run tests on batches with Payload (should still auth successfully)
- Verify both Supabase and non-Payload tests pass
- Check no regressions in Payload-specific tests

## Testing Strategy

### Unit Tests

Not applicable - this is error handling in global setup.

### Integration Tests

Test via E2E runner:
- ✅ Run shard 1 (smoke tests): Should pass even without Payload
- ✅ Run shard 2 (auth tests): Should pass even without Payload
- ✅ Run shard 7 (Payload CMS): Should pass WITH Payload auth
- ✅ Run shard 8 (seeding tests): Should pass WITH Payload auth
- ✅ Run all shards in batch: Verify no cross-batch interference

### E2E Tests

Existing test suite should now pass:
- **Before fix**: 24 test failures due to global setup crash
- **After fix**: 0 test failures (all 903 tests should pass)

### Manual Testing Checklist

Execute these steps to verify the fix:

- [ ] Start local test environment (Supabase running, Payload not running)
- [ ] Run test shard 1: `pnpm --filter web-e2e test:shard1` - Should PASS
- [ ] Run test shard 2: `pnpm --filter web-e2e test:shard2` - Should PASS
- [ ] Run test shards 3-6: `pnpm --filter web-e2e test:shard3` (etc) - Should PASS
- [ ] Start Payload server: `pnpm --filter payload dev`
- [ ] Run test shards 7-8: `pnpm --filter web-e2e test:shard7` - Should PASS with Payload auth
- [ ] Run full suite: `pnpm test:e2e` - All 903 tests should PASS
- [ ] Verify no console.error messages in global setup output
- [ ] Check that ⚠️ warnings appear for Payload when it's not running

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Payload tests without auth**: If Payload is required for a test but auth is skipped, test will fail
   - **Likelihood**: low - Payload shards auto-start Payload server
   - **Impact**: medium - Test fails but it's the right failure (test dependency)
   - **Mitigation**: Payload-specific tests run in shards 7-8 which auto-start server. If they fail, it's caught immediately.

2. **Silent auth failures**: Payload auth might fail silently when it should be checked
   - **Likelihood**: low - Only happens when Payload isn't running
   - **Impact**: medium - Tests that need Payload will fail with auth errors
   - **Mitigation**: Clear warning log explains the situation. Tests that need Payload will fail naturally.

3. **Unexpected behavior in CI**: CI environment might behave differently
   - **Likelihood**: low - Fix is straightforward error handling
   - **Impact**: medium - Could hide issues
   - **Mitigation**: Full test suite runs in CI - any issues surface immediately

**Rollback Plan**:

If this fix causes unexpected issues:
1. Revert the changes to global-setup.ts (restore try-catch around line 590 and rethrow)
2. This restores previous behavior (fail if Payload auth fails)
3. Redeploy test infrastructure
4. No data migration or cleanup needed

**Monitoring** (if needed):
- Monitor E2E test pass rate - should increase from 97.4% to 100%
- Watch for new Payload-specific test failures - would indicate dependency issues
- Check CI logs for ⚠️ warnings when Payload doesn't run

## Performance Impact

**Expected Impact**: minimal

This fix doesn't change performance - it only changes error handling. Global setup timing should be identical or slightly better (no 3-attempt retry when Payload isn't available).

## Security Considerations

**Security Impact**: none

- No changes to authentication mechanisms
- No changes to credential handling
- No changes to token management
- Error message doesn't expose sensitive information

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Stop Payload server (if running)
# Run batch without Payload
pnpm --filter web-e2e test:shard1

# Expected Result: FAILS with "Payload CMS login failed after 3 attempts"
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run shard 1 (without Payload)
pnpm --filter web-e2e test:shard1
# Expected Result: PASSES

# Run shard 7 (with Payload)
pnpm --filter web-e2e test:shard7
# Expected Result: PASSES

# Run full E2E suite
pnpm test:e2e
# Expected Result: All 903 tests PASS
```

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify global setup completes successfully
pnpm --filter web-e2e test:shard1 2>&1 | grep -E "(Global Setup|✅|❌)"
# Expected: "Global Setup Complete" message appears

# Verify no unexpected errors in global setup
pnpm --filter web-e2e test:shard1 2>&1 | grep -E "Error|Failed" | grep -v "Payload CMS auth"
# Expected: No unexpected errors (only Payload auth warning is expected)
```

## Dependencies

**No new dependencies required** - Using built-in Node.js error handling.

## Database Changes

**No database changes required** - This is error handling in test setup.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None. This is a test infrastructure change.

**Feature flags needed**: No

**Backwards compatibility**: Fully maintained - all existing functionality preserved.

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (test batches pass without Payload)
- [ ] All 903 E2E tests pass
- [ ] Zero regressions detected
- [ ] Shard 1 passes without Payload running
- [ ] Shard 7-8 pass with Payload running
- [ ] Global setup completes successfully with warning (not error) when Payload unavailable
- [ ] No unexpected console errors in global setup output

## Notes

### Implementation Details

The key code change is minimal - wrapping lines 582-661 in a try-catch:

```typescript
// BEFORE:
if (authState.navigateToPayload) {
  try {
    const payloadToken = await loginToPayloadWithRetry(...)
    // ... rest of Payload auth
  } catch (error) {
    console.error(...);
    throw error;  // ❌ Throws error, fails batch
  }
}

// AFTER:
if (authState.navigateToPayload) {
  try {
    try {
      const payloadToken = await loginToPayloadWithRetry(...)
      // ... rest of Payload auth
    } catch (error) {
      console.warn(...);  // ⚠️ Logs warning, continues
    }
  }
}
```

Actually, simpler approach: just change line 660 from `throw error` to `debugLog` + `console.warn`:

```typescript
catch (error) {
  // biome-ignore lint/suspicious/noConsole: Warning logging for Payload auth failure
  console.warn(
    `⚠️  Payload CMS authentication failed for ${authState.name}: ${(error as Error).message}. ` +
    `This is expected if Payload server is not running.`
  );
  debugLog("payload:auth_failed_non_fatal", {
    user: authState.name,
    error: (error as Error).message,
  });
  // Continue with global setup instead of throwing
}
```

This is surgical, minimal, and preserves all other behavior.

### Related Issues

- Diagnosis: #985 - "E2E Global Setup Crashes When Payload CMS Not Running"
- Tests affected: Shards 1, 2, 3-6 (all non-Payload batches)

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #985*
