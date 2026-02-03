# Bug Fix: Alpha Orchestrator Stream Crash & Workflow Cancellation

**Related Diagnosis**: #1843
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**:
  - Bug A: Race condition where E2B SDK delivers buffered PTY data after log stream is closed
  - Bug B: GitHub concurrency model cancels pending jobs when newer pushes arrive
- **Fix Approach**:
  - Bug A: Add stream state guard before writing
  - Bug B: Use commit-based concurrency group to prevent cancellation
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Two separate but related bugs in the Alpha Implementation System:

1. **Bug A - Stream Write After End**: Orchestrator crashes with `ERR_STREAM_WRITE_AFTER_END` when PTY `onData` callback tries to write to a closed log stream after feature completion. Root cause is a race condition where E2B SDK's `CommandHandle.handleEvents()` delivers buffered data after cleanup has closed the stream.

2. **Bug B - Workflow Cancellation**: GitHub Actions cancels pending validation runs during orchestration. Despite a previous incomplete fix (#1837), GitHub's concurrency model enforces "at most one pending job per group" - newer pushes still cancel older pending jobs. The `cancel-in-progress: false` flag only protects running jobs, not pending ones.

For full details, see diagnosis issue #1843.

### Solution Approaches Considered

#### Option 1: Stream State Guard + Commit-Based Concurrency ⭐ RECOMMENDED

**Description**:
- Bug A: Check `logStream.writableEnded` before writing in the `onData` callback to prevent writes to closed streams
- Bug B: Use commit SHA as concurrency group key instead of branch name, allowing multiple pending runs per branch without interference

**Pros**:
- Bug A: Minimal change (1-line guard), zero performance impact
- Bug B: Prevents accidental cancellation while preserving concurrency control per unique commit
- Both fixes are defensive (don't change orchestration logic)
- Bug B fix allows parallel orchestrations on the same branch without conflicts
- Both can be deployed independently without coordination

**Cons**:
- None identified for this approach

**Risk Assessment**: low - Both are defensive changes that add guards without altering core logic

**Complexity**: simple - One-line stream guard and simple config change

#### Option 2: Remove Concurrency Group Entirely (Bug B Only)

**Description**: Delete the concurrency section from `alpha-validation.yml` to allow unlimited parallel runs

**Pros**:
- Simplest possible fix (just delete 2 lines)
- Allows full parallelization of orchestrations

**Cons**:
- Loses concurrency control entirely - could cause resource exhaustion
- Doesn't address the underlying issue
- Less production-ready

**Why Not Chosen**: Removes necessary safety guardrails without addressing root cause

#### Option 3: Delay Before Writing (Bug A Only)

**Description**: Add a small timeout before writing to stream to let cleanup complete

**Pros**:
- Might work in practice

**Cons**:
- Unreliable (timing-dependent)
- Could mask other issues
- Less maintainable than explicit state check

**Why Not Chosen**: State guards are more reliable and explicit

### Selected Solution: Stream State Guard + Commit-Based Concurrency

**Justification**: This approach is minimal, defensive, and addresses the root causes without adding unnecessary complexity. The stream guard prevents writes to closed streams regardless of timing. The commit-based concurrency group prevents GitHub's "at most one pending job" limitation from interfering with legitimate parallel orchestrations. Both fixes are low-risk and can be deployed independently.

**Technical Approach**:
- **Bug A**: Add `!logStream.writableEnded` check in `onData` callback before calling `logStream.write()`
- **Bug B**: Change concurrency group from `alpha-validation-${{ github.ref }}` to `alpha-validation-${{ github.sha }}`

**Architecture Changes**: None - both are defensive additions

**Migration Strategy**: Not needed - pure fixes without breaking changes

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/feature.ts` - Add stream state guard (Bug A)
- `.github/workflows/alpha-validation.yml` - Update concurrency group (Bug B)

### New Files

None required

### Step-by-Step Tasks

#### Step 1: Fix Stream Write Race Condition (Bug A)

Add stream state guard to prevent writes after stream closure.

- Locate `onData` callback in `.ai/alpha/scripts/lib/feature.ts` around line 434
- Add `!logStream.writableEnded` guard before `logStream.write(data)`
- Ensure captured output is still stored in `capturedStdout` variable for recovery
- Verify PTY output is still logged even if stream is closed

**Why this step first**: This is the more critical fix - it prevents runtime crashes during orchestration

#### Step 2: Fix Workflow Cancellation (Bug B)

Update GitHub Actions concurrency group to use commit SHA instead of branch reference.

- Open `.github/workflows/alpha-validation.yml`
- Change concurrency group from `alpha-validation-${{ github.ref }}` to `alpha-validation-${{ github.sha }}`
- Keep `cancel-in-progress: false` (no change needed)
- Verify syntax is correct

**Why this step second**: This is simpler and complements the stream fix

#### Step 3: Add/Update Tests

Test the stream guard behavior and verify workflow concurrency.

- Add unit test for stream guard: Test that `onData` callback handles closed stream gracefully
- Add test case: Verify `capturedStdout` captures data even when stream is closed
- Verify workflow syntax: Run `gh workflow list` and check alpha-validation.yml status
- Add integration test: Simulate orchestration with feature completion to ensure no crash

#### Step 4: Validation

- Run existing alpha orchestration suite to ensure no regressions
- Verify stream state is properly tracked throughout feature execution
- Check GitHub Actions UI confirms workflow runs proceed without unexpected cancellations
- Monitor one full orchestration run from start to finish

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Stream guard allows writes when stream is open
- ✅ Stream guard prevents writes when stream is closed
- ✅ `capturedStdout` captures output regardless of stream state
- ✅ Edge case: Multiple `onData` calls after stream closure
- ✅ Regression test: Original crash scenario should not occur

**Test files**:
- `.ai/alpha/scripts/lib/feature.spec.ts` - Stream guard tests

### Integration Tests

- ✅ Full orchestration run (feature completion through all phases)
- ✅ Verify PTY output is properly logged to file
- ✅ Verify no crash occurs during feature completion cleanup
- ✅ Verify output recovery works if needed

**Test files**:
- `.ai/alpha/scripts/integration.spec.ts` - Orchestration integration tests

### E2E Tests

Not applicable for infrastructure fixes

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run full S1823 orchestration on alpha branch
- [ ] Verify all features execute without stream crashes
- [ ] Check log files are properly written with complete output
- [ ] Submit new orchestration while previous one is pending (tests concurrency)
- [ ] Verify GitHub Actions shows all pending runs proceed without cancellation
- [ ] Check alpha-validation.yml workflow shows green status
- [ ] Monitor orchestration logs for any write errors
- [ ] Verify no ERR_STREAM_WRITE_AFTER_END errors in logs
- [ ] Test fallback log recovery mechanism (if implemented)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Stream Guard Logic**: Stream state might change between check and write
   - **Likelihood**: low
   - **Impact**: low (gracefully handled by guard)
   - **Mitigation**: Guard is defensive - worst case skips write, doesn't crash

2. **Concurrency Group Change**: Existing runs might behave unexpectedly
   - **Likelihood**: low
   - **Impact**: medium (could affect running orchestrations)
   - **Mitigation**: Change is backward compatible - new runs use new group, old runs complete normally

3. **Output Loss**: If stream is closed early, some output might not be written to log file
   - **Likelihood**: low (only happens in error case already)
   - **Impact**: low (output captured in memory via `capturedStdout`)
   - **Mitigation**: Output is captured in multiple places (stream and memory variable)

**Rollback Plan**:

If issues occur after deployment:

1. Revert `.github/workflows/alpha-validation.yml` to use `github.ref` in concurrency group
2. Revert stream guard in `.ai/alpha/scripts/lib/feature.ts`
3. No database changes or migrations to roll back
4. Redeploy via GitHub Actions

**Monitoring** (if needed):

- Monitor orchestration logs for any write errors
- Check for ERR_STREAM_WRITE_AFTER_END messages
- Track workflow cancellation rate in GitHub Actions
- Monitor feature completion success rate

## Performance Impact

**Expected Impact**: none

No performance changes expected. The stream guard is a simple conditional check that adds negligible overhead. The concurrency group change only affects GitHub Actions scheduling logic, not runtime performance.

## Security Considerations

None identified. Both changes are defensive improvements to existing code without introducing new attack surfaces.

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Trigger orchestration that causes stream crash
# This would require running actual orchestration (S1823 or similar)
# Expected: Error [ERR_STREAM_WRITE_AFTER_END] appears in logs
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run unit tests (add test file)
pnpm test:unit feature

# Verify workflow syntax
gh workflow list --repo slideheroes/2025slideheroes

# Integration tests (if created)
pnpm test:integration orchestration

# Build
pnpm build
```

**Expected Result**: All commands succeed, no ERR_STREAM_WRITE_AFTER_END errors, workflow validation passes

### Regression Prevention

```bash
# Run full orchestration test suite
pnpm test

# Verify GitHub Actions workflow
gh workflow view alpha-validation.yml --repo slideheroes/2025slideheroes

# Check no unintended job cancellations
# (Monitor GitHub Actions UI during next orchestration run)
```

## Dependencies

### New Dependencies (if any)

No new dependencies required

**Dependencies added**: None

## Database Changes

**Migration needed**: no

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

- Changes are backward compatible
- No feature flags needed
- Can be deployed immediately
- No coordination needed with other teams

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:

- [ ] All validation commands pass
- [ ] No ERR_STREAM_WRITE_AFTER_END errors occur
- [ ] All tests pass (unit, integration)
- [ ] Zero regressions detected in orchestration
- [ ] GitHub Actions workflow validation passes
- [ ] Multiple concurrent orchestration runs proceed without cancellation
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

**Important Context**:
- Bug A is critical for orchestration stability - prevents runtime crashes
- Bug B affects CI/CD reliability during development - prevents unexpected workflow cancellations
- Both fixes are complementary and low-risk
- Stream guard should be defensive - doesn't change orchestration behavior, just prevents crashes
- Concurrency group change allows multiple pending runs without cancellation conflicts

**Related Issues**:
- #1837: Previous incomplete workflow cancellation fix
- #1699, #1701: PTY timeout issues (related to stream handling)
- #1767, #1786: PTY recovery monitoring

**References**:
- Node.js Writable streams: https://nodejs.org/api/stream.html#stream_class_stream_writable
- GitHub Actions concurrency: https://docs.github.com/en/actions/using-jobs/using-concurrency
- E2B SDK CommandHandle: https://github.com/e2b-dev/E2B-CLI

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1843*
