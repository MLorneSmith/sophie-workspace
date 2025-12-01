# Bug Fix: Test Infrastructure pkill Promise Rejection

**Related Diagnosis**: #804
**Severity**: high
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Unhandled promise rejections from `execAsync()` calls for `pkill` and `fuser` commands when no matching processes exist
- **Fix Approach**: Wrap all unhandled `execAsync()` calls in try-catch blocks to gracefully handle process killing commands that may fail
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `/test 7` command fails because `setupPayloadServer()` and related functions contain unhandled promise rejections. When `pkill` or `fuser` commands return exit codes indicating "no matching process found" (exit code 144 = signal-based), Node.js rejects the promise despite the shell-level `|| true` operator. This causes shard 7 (Payload CMS tests) to fail entirely with "Payload CMS server failed to start", skipping all 31 tests.

For full details, see diagnosis issue #804.

### Solution Approaches Considered

#### Option 1: Wrap execAsync calls in try-catch ⭐ RECOMMENDED

**Description**: Add try-catch blocks around all unhandled `execAsync()` calls that are intentionally allowed to fail (process killing commands). This matches the existing pattern used successfully at lines 733-744.

**Pros**:
- Simple, minimal change (4 lines of code per occurrence)
- Matches existing established pattern in the same function (lines 733-744)
- Handles all edge cases (process exists, process doesn't exist, permission denied)
- Zero risk of breaking other functionality
- Easy to test and verify

**Cons**:
- None - this is the standard approach for this scenario

**Risk Assessment**: low - we're simply suppressing expected errors, not changing logic

**Complexity**: simple - pattern already exists in the codebase

#### Option 2: Use shell redirection variations

**Description**: Modify the shell command itself to use different redirection strategies (e.g., `set +e; pkill ...; set -e`)

**Why Not Chosen**: Less reliable than explicit try-catch. JavaScript async/await semantics mean the shell-level error handling alone isn't sufficient. The current code already has `|| true` in the shell command, which proves this approach doesn't work.

### Selected Solution: Wrap execAsync calls in try-catch

**Justification**: This approach is already used in the same function (lines 733-744) and proven to work. It's the idiomatic way to handle expected failures in async JavaScript code. The minimal changes reduce risk of introducing new bugs.

**Technical Approach**:
- Wrap each problematic `execAsync()` call with try-catch
- Use empty catch blocks with comments explaining why errors are ignored
- No changes to the actual commands or their behavior
- Consistent with existing code patterns in the file

**Architecture Changes**: None - this is pure error handling improvement

**Migration Strategy**: Not needed - this is a pure bug fix with no data or API changes

## Implementation Plan

### Affected Files

- `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs` - Wrap 4 unhandled `execAsync()` calls in try-catch blocks

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix setupPayloadServer() - pkill for payload processes

Wrap the unhandled `pkill` call at line 747.

- Locate: `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs:747`
- Current code: `await execAsync('pkill -f "payload.*dev" 2>/dev/null || true');`
- Change to: Wrap in try-catch block
- Pattern to follow: Lines 733-744 (existing working pattern)

**Why this step first**: This is the critical failure point that prevents shard 7 from starting (issue #804 directly)

#### Step 2: Fix stopNextDevServer() - pkill for Next.js processes

Wrap the unhandled `pkill` calls at lines 1068-1069.

- Locate: `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs:1068-1069`
- Current code:
  ```javascript
  await execAsync('pkill -f "next.*dev.*3000" 2>/dev/null || true');
  await execAsync('pkill -f "node.*next.*3000" 2>/dev/null || true');
  ```
- Change to: Wrap each in try-catch block
- Pattern to follow: Same as Step 1

**Why this order**: Prevents similar failures during server cleanup

#### Step 3: Fix stopNextDevServer() - fuser command

Wrap the unhandled `fuser` call at line 1093.

- Locate: `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs:1093`
- Current code: `await execAsync("fuser -k 3000/tcp 2>/dev/null || true");`
- Change to: Wrap in try-catch block
- Pattern to follow: Same as Steps 1-2

**Why this order**: Same type of issue, should be handled consistently

#### Step 4: Add regression tests

Ensure the shard 7 tests actually run and pass.

- Run `/test 7` command to verify Payload CMS server starts successfully
- Verify all 31 Payload tests execute (previously failing and skipped)
- Run `/test 8` to verify Next.js cleanup doesn't break other shards
- Spot-check `/test 1` to ensure no regressions in other test infrastructure

**Why this step after code changes**: Proves the fix works in practice

#### Step 5: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Confirm shard 7 tests execute and pass

## Testing Strategy

### Unit Tests

No new unit tests needed - this is error handling for subprocess calls that are tested implicitly by the test infrastructure itself.

### Integration Tests

**Implicit testing via test execution**:
- ✅ Shard 7 (Payload CMS tests) - Currently fails, should pass after fix
- ✅ Shard 8 (Payload Extended tests) - Depends on shard 7 cleanup
- ✅ Regression test: Run shard 1 to verify no regressions

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `/test 7` - should start Payload CMS server successfully
- [ ] Verify all 31 Payload tests execute (not skipped)
- [ ] Check that shard 7 tests pass without errors
- [ ] Run `/test 1` to verify no regressions in core test infrastructure
- [ ] Run `/test 8` to verify Payload Extended tests work
- [ ] Check console output for any promise rejections or unhandled errors
- [ ] Verify no zombie processes left after test completion

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Masking legitimate errors**: By catching and ignoring these errors, we might miss real problems
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: The commands are designed to fail gracefully (shell `|| true`). We're just handling the JavaScript promise rejection that occurs after the shell handles the error. The comments in the code make this clear.

2. **Processes not actually being killed**: If the catch block silently ignores real failures
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: The code already has fallback mechanisms (port checking, process verification). If pkill fails silently, the port checking at lines 733-744 and 1076-1089 will catch it.

**Rollback Plan**:

If this fix causes issues:
1. Revert the try-catch changes (git revert)
2. Restore the original unhandled execAsync calls
3. Tests will return to current failing state
4. No data or state changes to revert

**Monitoring**: None needed - this is a simple error handling fix

## Performance Impact

**Expected Impact**: none

No performance changes. The try-catch blocks have negligible overhead.

## Security Considerations

**Security Impact**: none

- No new code execution
- No new dependencies
- No changes to command execution
- Just adding error handling to existing commands

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run test shard 7 - should fail with "Payload CMS server failed to start"
/test 7
```

**Expected Result**:
- Shard 7 fails to initialize Payload server
- All 31 Payload tests are marked as failed/skipped
- Error message includes: "Failed to setup Payload server: Command failed: pkill..."

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint the infrastructure script
pnpm lint

# Run shard 7 specifically
/test 7

# Run shard 8 (depends on shard 7 cleanup)
/test 8

# Run shard 1 (regression check)
/test 1

# Full test suite (optional, comprehensive)
pnpm test:e2e
```

**Expected Result**:
- All commands succeed
- Shard 7 runs and executes all 31 Payload tests
- Shard 8 tests execute normally
- No promise rejections in console output
- Zero regressions in other test shards

### Regression Prevention

```bash
# Run all test shards to ensure nothing broke
/test

# Check for any lingering processes
ps aux | grep -E "payload|next" | grep -v grep
```

**Expected Result**: All test shards pass, no zombie processes

## Dependencies

**No new dependencies required**

The fix uses only existing Node.js async/await and try-catch functionality.

## Database Changes

**No database changes required**

This is a pure infrastructure/testing fix.

## Deployment Considerations

**Deployment Risk**: none

**Special deployment steps**: None

This fix only affects test infrastructure. It has zero impact on production code.

**Feature flags needed**: no

**Backwards compatibility**: maintained

The fix doesn't change any behavior - it just prevents the tests from crashing.

## Success Criteria

The fix is complete when:
- [ ] All 4 unhandled `execAsync()` calls are wrapped in try-catch blocks
- [ ] Try-catch blocks use the pattern from lines 733-744 (comment style, etc.)
- [ ] `/test 7` command runs without failures
- [ ] All 31 Payload tests execute (not skipped)
- [ ] `/test 1` and `/test 8` pass (regression check)
- [ ] Linting passes: `pnpm lint`
- [ ] Type checking passes: `pnpm typecheck`
- [ ] No promise rejection errors in test console output
- [ ] Manual testing checklist complete

## Notes

**Code Pattern to Follow:**

The existing code at lines 733-744 shows the exact pattern to replicate:

```javascript
try {
  const { stdout: pids } = await execAsync(
    `lsof -ti:${payloadPort} 2>/dev/null || echo ""`,
  );
  if (pids.trim()) {
    log(`  🧹 Clearing existing processes on port ${payloadPort}...`);
    await execAsync(`kill -9 ${pids.trim().split('\n').join(' ')} 2>/dev/null || true`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
} catch {
  // Port is likely free
}
```

The failing code follows a simpler pattern and should be updated to:

```javascript
try {
  await execAsync('pkill -f "payload.*dev" 2>/dev/null || true');
} catch {
  // Process might not exist - this is expected
}
```

**Locations requiring fixes:**
1. Line 747 - setupPayloadServer()
2. Lines 1068-1069 - stopNextDevServer() (two calls)
3. Line 1093 - stopNextDevServer()

**Why this is a simple fix:**
- Literally wrapping existing code with try-catch
- Using the established pattern from the same file
- No new logic or complexity
- Expected failures are already indicated by the `|| true` in commands

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #804*
