# Bug Fix: Alpha Orchestrator Seeding Error Message Hidden

**Related Diagnosis**: #1515
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Error catch block converts `CommandExitError` to string using `${err}`, which only shows error type and exit code, not the actual `stderr` content
- **Fix Approach**: Improve error handling to extract and log `stderr` from E2B `CommandExitError` exceptions
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When database seeding fails in the Alpha Spec Orchestrator, the error message only shows `CommandExitError: exit status 1` without displaying the actual underlying error details. This makes debugging seeding failures extremely difficult because the real error message (typically from Payload migrations) is hidden.

For example, if a Payload migration fails with "Collection not found: courses", the user sees only `❌ Seeding failed: CommandExitError: exit status 1` and has no idea what went wrong.

Full details in diagnosis issue #1515.

### Solution Approaches Considered

#### Option 1: Enhanced Error Object Extraction ⭐ RECOMMENDED

**Description**: Type-guard the caught error to check if it's a `CommandExitError` with `stderr` property, then extract and log both `stderr` and `stdout` if available. This approach mirrors the better error handling patterns already used in `syncFeatureMigrations()`.

**Pros**:
- Directly addresses the root cause by extracting stderr content
- Mirrors existing error handling patterns in the same file (lines 386-391)
- Minimal code changes - only modifies the catch block
- Provides both stderr and stdout for maximum debugging info
- Defensive against different error types (uses type guards)

**Cons**:
- Requires knowledge of E2B's error object structure
- Multiple console.error calls (but this is acceptable for critical errors)

**Risk Assessment**: low - Only improves error logging, doesn't change functionality. The catch block already exits early, so we're just improving diagnostics.

**Complexity**: simple - Single catch block modification

#### Option 2: Error Message Wrapper

**Description**: Create a helper function `formatCommandError()` that accepts an error and returns a formatted string with proper stderr extraction. Call this from the catch block.

**Pros**:
- Reusable error formatting logic
- Could be extracted to a shared utility

**Cons**:
- Overkill for a single usage location
- Over-engineering for a simple fix (violates CLAUDE.md principles)
- Adds an extra abstraction layer

**Why Not Chosen**: The diagnosis suggests a straightforward fix, and the existing code pattern (lines 386-391) shows inline error handling is acceptable. A single, focused change is better than creating unnecessary abstractions.

#### Option 3: Structured Logging

**Description**: Implement structured error logging with JSON output for machine-parseable diagnostics.

**Pros**:
- Enables better log aggregation
- Better for production monitoring

**Cons**:
- Unnecessary complexity for current needs
- Overkill for a local development tool
- Changes output format which may break scripts

**Why Not Chosen**: The orchestrator is a local development tool, not production infrastructure. Users need readable error messages, not structured JSON logs.

### Selected Solution: Enhanced Error Object Extraction

**Justification**: This approach directly fixes the root cause (hidden stderr) with minimal code changes, follows existing patterns in the file, and requires no new abstractions. It's the most pragmatic solution that aligns with the project's philosophy of avoiding over-engineering.

**Technical Approach**:
1. In the `seedSandboxDatabase()` catch block (line 264-267), check if the error has an `stderr` property
2. If it does, log the stderr (and stdout if available)
3. Otherwise, fall back to logging the error as a string
4. Use proper type guards to avoid runtime errors

**Architecture Changes**: None - purely internal error handling improvement

**Migration Strategy**: Not applicable - this is a bug fix with no data or API changes

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/database.ts` - Update error handling in `seedSandboxDatabase()` function (line 264-267)

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Update seedSandboxDatabase catch block

Update the error handling in `seedSandboxDatabase()` to properly extract and log stderr from CommandExitError:

- Check if the caught error has an `stderr` property
- Log the stderr content if available
- Log stdout if available
- Keep the existing console.error call for other error types
- Return false (existing behavior)

**Why this step first**: This is the entire fix. No other changes needed.

#### Step 2: Add regression test

Create a test that verifies:
- When seeding fails with E2B error, stderr is logged
- When other exceptions occur, they're logged as strings
- The function returns false in both cases
- Test file: `.ai/alpha/scripts/lib/__tests__/database-seed-error-handling.spec.ts`

#### Step 3: Verify with real scenario

Run the orchestrator with a simulated failure:
- Create a test that causes Payload migration to fail
- Verify the actual error message (not just "exit status 1") is displayed
- Confirm it matches the format shown in the diagnosis

#### Step 4: Code quality

- Run `pnpm lint:fix` to ensure formatting is correct
- Run `pnpm typecheck` to ensure no type errors
- Verify no regressions in other database module functions

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Error extraction when CommandExitError has stderr
- ✅ Error logging when CommandExitError has stdout
- ✅ Fallback to string conversion for other error types
- ✅ Function returns false in all error cases
- ✅ Regression test: Original "exit status 1" message is no longer shown

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/database-seed-error-handling.spec.ts` - New test file with comprehensive error handling tests

### Integration Tests

No additional integration tests needed. The existing orchestrator flow will exercise this code path.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator with known Payload migration issue
- [ ] Verify detailed error message is displayed (not just "exit status 1")
- [ ] Confirm stderr content includes the actual migration error
- [ ] Check that both stderr and stdout are logged when available
- [ ] Run full orchestrator flow to ensure no regressions
- [ ] Verify normal seeding success path still works correctly

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Unintended error object structure**: E2B might return different error structures in edge cases
   - **Likelihood**: low
   - **Impact**: medium (error logging fails, but original error is still caught)
   - **Mitigation**: Use defensive type checking (`typeof err === 'object' && 'stderr' in err`) to handle unexpected structures

2. **Circular error references**: Error object might have circular references causing logging issues
   - **Likelihood**: low
   - **Impact**: low (would just print "[object Object]")
   - **Mitigation**: Use safe string conversion with proper error handling

3. **Performance impact**: Extracting error properties might be slow
   - **Likelihood**: very low
   - **Impact**: none (error handling only runs on failure)
   - **Mitigation**: N/A - only executes in error path

**Rollback Plan**:

If this change causes issues:
1. Revert the catch block to original code (lines 264-267)
2. Run tests to verify original behavior
3. No deployment necessary (local development tool)

**Monitoring**: Not applicable for local development tool

## Performance Impact

**Expected Impact**: none

Error extraction only occurs when seeding fails, which is rare. No impact on normal execution paths.

## Security Considerations

**Security Impact**: none

This change only improves error message visibility, no security implications.

## Validation Commands

### Before Fix (Bug Should Be Reproducible)

```bash
# Run orchestrator with known seeding failure
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --force-unlock
```

**Expected Result**: Error message shows only `CommandExitError: exit status 1` without revealing the actual Payload migration error.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Run tests (if unit tests added)
pnpm --filter @kit/alpha test database-seed-error-handling.spec

# Manual verification
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --force-unlock
```

**Expected Result**:
- All commands succeed
- Error message now includes detailed stderr from Payload migration
- Example: `❌ Seeding failed (exit code 1): stderr: Error: Collection not found: courses`
- Unit tests pass (if added)

### Regression Prevention

```bash
# Run full alpha module tests
pnpm --filter @kit/alpha test

# Run orchestrator with successful seeding scenario
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
```

**Expected**: All tests pass, successful seeding still works normally.

## Dependencies

**No new dependencies required**

All error handling uses built-in Node.js and E2B types.

## Database Changes

**No database changes required**

This is a client-side error handling improvement.

## Deployment Considerations

**Deployment Risk**: none

This is a local development tool. Changes only affect error message visibility.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained - Still returns false on error, just with better error messages

## Success Criteria

The fix is complete when:
- [ ] Catch block properly extracts stderr from CommandExitError
- [ ] Error messages include actual failure details (not just exit code)
- [ ] Fallback to string conversion works for other error types
- [ ] Unit tests verify error extraction logic (if added)
- [ ] All existing tests pass
- [ ] No regressions in other database operations
- [ ] Manual testing confirms fix resolves the issue
- [ ] Code review approved (if applicable)

## Notes

**Code Pattern Reference**: The fix should follow the error handling pattern already used in `syncFeatureMigrations()` (lines 386-391 in the same file), which demonstrates how to properly handle and log error details:

```typescript
} catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    warn(`   ⚠️ Migration sync failed (non-blocking): ${errorMessage}`);
    return true;
}
```

This pattern can be adapted to extract `stderr` from E2B's CommandExitError objects.

**Related Documentation**:
- E2B sandbox error handling patterns
- Error extraction from subprocess execution (see existing code at lines 215-227 and 232-244)
- Similar error handling in `syncFeatureMigrations()` (lines 386-391)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1515*
