# Bug Fix: Alpha Orchestrator Lock Release on All Exit Paths

**Related Diagnosis**: #1480 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Missing comprehensive error handling that ensures lock release on ALL exit paths
- **Fix Approach**: Add try-finally wrapper to orchestrate() function + unhandledRejection handler + error boundary in work loop
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator exits prematurely (after ~14 minutes) without releasing its lock file, leaving features in `in_progress` state and blocking subsequent runs. The orchestrator has 5 possible exit paths, but only 2 release the lock:

- ✅ Normal completion → lock released
- ✅ SIGINT/SIGTERM signals → lock released
- ❌ **Unhandled exception** → lock NOT released
- ❌ **Work loop error** → lock NOT released
- ❌ **External kill** → lock NOT released

This causes stale locks to persist, preventing new orchestrator runs from starting and leaving the manifest in an inconsistent state.

For full details, see diagnosis issue #1480.

### Solution Approaches Considered

#### Option 1: Global Error Handlers + Try-Finally Wrapper ⭐ RECOMMENDED

**Description**: Add three layers of error handling:
1. `process.on('unhandledRejection')` handler at main entry point
2. Try-finally wrapper around entire `orchestrate()` function
3. Error boundary in work loop for Promise rejections

**Pros**:
- Comprehensive coverage for all exit paths
- Ensures lock ALWAYS released (try-finally guarantee)
- Catches unhandled promise rejections
- Non-invasive - doesn't change existing logic flow
- Provides better error logging/diagnostics
- Minimal performance impact
- Handles external kill attempts gracefully

**Cons**:
- Requires changes in 3 different places
- Need to ensure finally block doesn't interfere with normal flow
- Requires careful error message handling to avoid cascade errors

**Risk Assessment**: Medium - Low
- Risk is LOW because we're only adding error handling, not changing logic
- Changes are isolated and don't affect feature implementation
- Extensive testing can verify all paths work correctly

**Complexity**: Moderate
- Straightforward error handling patterns
- Good precedent in the codebase (already used for SIGINT/SIGTERM)

#### Option 2: Wrapper Function with Guaranteed Cleanup

**Description**: Create a wrapper function that orchestrate all operations with guaranteed cleanup, similar to resource acquisition patterns.

**Pros**:
- Single point of cleanup logic
- Easier to maintain
- Explicitly shows cleanup intent

**Cons**:
- More refactoring required
- Need to extract main orchestration logic
- Callbacks add complexity
- Overkill for this specific issue

**Why Not Chosen**: Option 1 is simpler and less invasive while achieving the same goal.

#### Option 3: Add Global Uncaught Exception Handler

**Description**: Only add `process.on('uncaughtException')` handler without try-finally.

**Pros**:
- Minimal code changes
- Quick fix

**Cons**:
- Doesn't catch async promise rejections
- Doesn't protect against structured errors escaping finally blocks
- Less reliable than try-finally guarantee
- Doesn't fix work loop errors

**Why Not Chosen**: Incomplete - misses async rejections and doesn't cover work loop.

### Selected Solution: Global Error Handlers + Try-Finally Wrapper

**Justification**: This approach is comprehensive, reliable, and minimally invasive. It addresses all 5 exit paths while maintaining code clarity. The try-finally pattern is the most reliable way to ensure lock release, and the global handlers catch edge cases that slip through. This is the standard practice for resource cleanup in Node.js applications.

**Technical Approach**:

1. **Main Entry Point** (`spec-orchestrator.ts:main()`):
   - Add `process.on('unhandledRejection')` handler BEFORE calling orchestrate()
   - Handler logs error, releases lock, and exits with code 1
   - Handles any async promise rejections that escape error boundaries

2. **Orchestrate Function** (`orchestrator.ts:orchestrate()`):
   - Wrap entire function body in try-finally
   - Finally block calls `releaseLock(options.ui)`
   - Ensures lock release even if error occurs
   - Preserves error re-throwing for main catch handler

3. **Work Loop** (`orchestrator.ts:runWorkLoop()`):
   - Wrap activeWork Map promise handling with .catch()
   - Prevent unhandled rejections in Promise.race()
   - Log errors but don't rethrow (let main catch handle)

**Architecture Changes**:

- No architectural changes - purely error handling
- Preserves existing execution flow
- Adds defensive layers without modifying core logic
- Improves observability with better error logging

**Migration Strategy**:

- Not needed - backward compatible
- No data changes
- No API changes
- Existing code unaffected

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/spec-orchestrator.ts` - Add unhandledRejection handler + ensure lock release
- `.ai/alpha/scripts/lib/orchestrator.ts` - Wrap orchestrate() in try-finally, add error boundary in work loop

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Global Unhandled Rejection Handler

Add a process handler BEFORE any async operations to catch unhandled promise rejections:

- Open `.ai/alpha/scripts/spec-orchestrator.ts`
- Find the main entry point function (around line 90)
- Add `process.on('unhandledRejection')` handler BEFORE `main()` call
- Handler should:
  - Log the rejection with stack trace
  - Call `releaseLock(false)`
  - Exit with code 1

**Why this step first**: Catches rejections from any async operation, including orchestrate() and its children.

#### Step 2: Wrap orchestrate() in Try-Finally

Modify the orchestrate() function to guarantee lock release:

- Open `.ai/alpha/scripts/lib/orchestrator.ts`
- Find the entire `orchestrate()` function body (starts line 761)
- Wrap all logic (from line 870 onwards) in a try-finally block:
  ```typescript
  async function orchestrate(options: OrchestratorOptions): Promise<void> {
      let uiManager: UIManager | null = null;
      // ... existing init code ...

      try {
          // ... all existing orchestrate logic ...
      } finally {
          // Always release lock, even if error occurs
          releaseLock(options.ui);
      }
  }
  ```
- Finally block should call `releaseLock(options.ui)` to release the lock

**Why this step**: Guarantees lock release regardless of errors during orchestration.

#### Step 3: Add Error Boundary in Work Loop

Prevent unhandled rejections in the Promise.race():

- Open `.ai/alpha/scripts/lib/orchestrator.ts`
- Find `runWorkLoop()` function (around line 355)
- Modify workPromise creation (lines 697-705) to handle rejection:
  ```typescript
  const workPromise = (async () => {
      try {
          await runFeatureImplementation(instance, manifest, feature, uiEnabled);
      } catch (error) {
          // Log error but don't rethrow - let main error handler deal with it
          log(`│   ❌ Feature implementation error: ${error instanceof Error ? error.message : String(error)}`);
          // Still mark sandbox as ready for next feature
          instance.status = "ready";
      } finally {
          activeWork.delete(instance.label);
      }
  })();
  ```
- Ensures Promise never rejects into Promise.race()

**Why this step**: Prevents Promise.race() from immediately rejecting and breaking the work loop.

#### Step 4: Add Logging for Debugging

Improve diagnostic information when errors occur:

- In unhandledRejection handler: Log rejection reason and stack trace
- In orchestrate() finally: Add log message that lock is being released
- In work loop catch: Log feature error with context

**Why this step**: Helps diagnose future issues and verify the fix is working.

#### Step 5: Test All Exit Paths

Create manual tests to verify lock release on all paths:

- Test normal completion (lock released) ✓
- Test SIGINT (lock released) ✓
- Test unhandled error in feature implementation
- Test unhandled error in sandbox operations
- Test work loop error
- Verify lock file cleaned up in all cases

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Unhandled rejection handler catches and exits
- ✅ orchestrate() finally block runs on normal completion
- ✅ orchestrate() finally block runs on error
- ✅ Work loop error boundary catches rejections
- ✅ Lock is released in all error scenarios

**Test files**:
- `.ai/alpha/scripts/__tests__/orchestrator.spec.ts` - Test orchestrate() error handling
- `.ai/alpha/scripts/__tests__/lock.spec.ts` - Test lock release logic

### Integration Tests

Test the full orchestrator lifecycle with error injection:

- Run orchestrator and verify normal lock release
- Inject errors at different points and verify lock is cleaned up
- Verify manifest is properly saved before exit
- Verify no stale lock files persist

**Test files**:
- `.ai/alpha/scripts/__tests__/orchestrator-integration.spec.ts`

### E2E Tests

Not applicable - this is infrastructure/tooling code.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator normally, verify it completes and releases lock
- [ ] Run orchestrator, kill with Ctrl+C, verify lock is released
- [ ] Run orchestrator, kill with kill -9, verify lock can be cleaned up
- [ ] Verify previous stale lock can be manually cleaned
- [ ] Run orchestrator with intentional error in feature, verify lock released
- [ ] Check that error messages are helpful for debugging
- [ ] Verify no new errors are introduced
- [ ] Run full orchestrator from start to completion

## Risk Assessment

**Overall Risk Level**: Medium (Low)

**Potential Risks**:

1. **Finally block interference**: Finally block could mask original error or cause new errors
   - **Likelihood**: Low
   - **Impact**: Medium
   - **Mitigation**: Finally block only calls releaseLock() - simple, proven pattern. Extensive testing.

2. **Recursive cleanup**: If releaseLock() throws, we might have issues
   - **Likelihood**: Low
   - **Impact**: High
   - **Mitigation**: Wrap releaseLock() in try-catch in finally block. Verify releaseLock() is robust.

3. **Error masking**: Errors in finally block could hide original error
   - **Likelihood**: Low
   - **Impact**: Medium
   - **Mitigation**: Use only in finally block. Keep releaseLock() simple and tested.

4. **Promise rejection handling**: work loop error boundary might be too aggressive
   - **Likelihood**: Low
   - **Impact**: Medium
   - **Mitigation**: Preserve error logging and state cleanup. Don't suppress all errors.

**Rollback Plan**:

If this fix causes issues:
1. Remove the try-finally wrapper from orchestrate()
2. Remove the work loop error boundary
3. Keep the global unhandledRejection handler (it's strictly additive)
4. Manually fix stale locks
5. Revert to previous commit

**Monitoring** (if deployed to production):
- Monitor lock file cleanup on orchestrator exit
- Alert if lock files persist after orchestrator completes
- Track unhandledRejection events
- Log orchestrator exit codes for analysis

## Performance Impact

**Expected Impact**: None (Negligible)

No measurable performance impact. Error handling code only executes in error cases, and cleanup happens in finally blocks which are very efficient.

## Security Considerations

**Security Impact**: Low - Positive

The lock file prevents concurrent orchestrator runs, which is a security control (prevents race conditions, data corruption). Properly releasing the lock is a security improvement.

- Ensures stale locks don't block future operations
- Improves system resilience
- Better error handling prevents information leakage

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check if stale lock exists
ls -la .ai/alpha/.orchestrator-lock 2>&1

# Manually kill orchestrator mid-run
# (starts orchestrator in one terminal, kill -9 in another)
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Check if lock was released
ls -la .ai/alpha/.orchestrator-lock
# Should still exist after kill -9 (this is the bug)
```

**Expected Result**: Lock file persists after process termination.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run orchestrator integration tests
pnpm test -- orchestrator.spec.ts
pnpm test -- orchestrator-integration.spec.ts

# Build
pnpm build

# Manual verification - normal exit
rm -f .ai/alpha/.orchestrator-lock
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --timeout 60
# Wait for completion
ls -la .ai/alpha/.orchestrator-lock
# Should NOT exist (lock released)

# Manual verification - Ctrl+C exit
rm -f .ai/alpha/.orchestrator-lock
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --timeout 300 &
sleep 10
kill $!
sleep 2
ls -la .ai/alpha/.orchestrator-lock
# Should NOT exist (lock released via signal)
```

**Expected Result**: All commands succeed, lock is properly released in all scenarios, no new errors introduced.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run linter and formatter
pnpm lint:fix
pnpm format:fix

# Type check
pnpm typecheck

# Build
pnpm build

# Verify orchestrator basic functionality
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --dry-run
```

## Dependencies

### New Dependencies

**No new dependencies required**

All changes use standard Node.js APIs and existing patterns already in the codebase.

## Database Changes

**No database changes required**

This is purely error handling logic - no schema or data changes.

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Fully maintained

This is a purely additive change to error handling. No existing code paths are modified, only new error handlers are added.

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Lock file is released in ALL exit scenarios (normal, signal, error)
- [ ] All tests pass (unit, integration, full suite)
- [ ] Zero regressions detected
- [ ] Stale locks don't accumulate
- [ ] Error messages are helpful and logged properly
- [ ] Code review approved
- [ ] Manual testing checklist complete

## Notes

### Key Implementation Details

1. **Try-Finally is guaranteed** - Even if an error is thrown inside the try block, the finally block ALWAYS executes before the error propagates.

2. **Order matters** - Register unhandledRejection handler BEFORE calling main(), so it catches rejections from orchestrate().

3. **Keep finally block simple** - Don't do complex operations in finally block. Just release lock and log.

4. **Test the edge cases** - Most bugs in error handling manifest in rare edge cases. Test kill -9, SIGKILL, timeout, etc.

5. **This is a common pattern** - Node.js best practices use try-finally for resource cleanup. See: https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/

### Similar Patterns in Codebase

The codebase already uses try-finally for cleanup in several places:
- Signal handlers (SIGINT, SIGTERM) - line 881-889
- Feature implementation cleanup (logStream) - line 521
- Sandbox keepalive cleanup - various locations

This fix just extends that pattern to the top level.

### Related Issues

- #1469: E2B stdout disconnect (different issue, PTY streaming)
- #1466: Exit condition fix (different issue, work loop logic)
- #1467: Exit condition edge case (different issue, same symptom)

This fix addresses the root cause that both #1466 and #1467 work around.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1480*
