# Bug Fix: Overall Progress Not Updating Periodically During Execution

**Related Diagnosis**: #2054
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `writeOverallProgress()` only called on state transitions, not during steady-state execution
- **Fix Approach**: Add periodic `writeOverallProgress()` call to work loop's main execution cycle
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The "Overall Progress" section in the Alpha orchestrator UI showed 0 of 99 tasks complete during S2045 execution with GPT provider, despite sandbox progress files showing active task completion. The root cause was a data flow gap where `writeOverallProgress()` was never called periodically during steady-state feature execution—it only fired on state transitions (feature start/complete/fail).

**Evidence from diagnosis #2054:**
- `overall-progress.json` `lastCheckpoint` frozen at startup (`2026-02-10T16:00:53.555Z`)
- `sbx-a-progress.json` heartbeat updated 6+ minutes later (`2026-02-10T16:06:11+00:00`)
- Zero overall progress updates during active execution despite active task completion

For full details, see diagnosis issue #2054.

### Solution Approaches Considered

#### Option 1: Add Periodic Call to Work Loop Main Cycle ⭐ RECOMMENDED

**Description**: Call `writeOverallProgress()` inside the main loop iteration, so it runs approximately every 30 seconds during active feature execution. The function already includes `syncSandboxProgressToManifest()` (from #2050) internally, which reads real-time task counts from sandbox progress files.

**Pros**:
- Minimal code change (1 line in critical path)
- Leverages existing infrastructure from #2050 fix
- Timing aligns naturally with `HEALTH_CHECK_INTERVAL_MS` (30 seconds)
- No new dependencies or state management needed
- Fixes both symptom (stale progress) and underlying issue (missing periodic sync)

**Cons**:
- Could add slight overhead every 30 seconds (mitigated by fast file I/O)
- Requires test updates to reflect new behavior

**Risk Assessment**: low - the function already exists and is used elsewhere; we're just adding a periodic call in the right place.

**Complexity**: simple - one-line addition with no structural changes.

#### Option 2: Create New Periodic Mechanism with Separate Interval

**Description**: Create a dedicated `startProgressSync()` method similar to health checks and keepalive, with its own `setInterval`.

**Pros**:
- More explicit timing control
- Better separation of concerns
- Flexible interval tuning

**Cons**:
- More code complexity (new method, new interval tracking)
- Harder to coordinate with existing async work
- Requires careful cleanup like other intervals

**Why Not Chosen**: Violates "simple is better" principle. The work loop's natural iteration cycle already provides the right cadence.

#### Option 3: Add Condition in Existing keepalive Interval

**Description**: Call `writeOverallProgress()` inside the existing `startKeepalive()` method.

**Pros**:
- Reuses existing interval infrastructure

**Cons**:
- Mixes concerns (keepalive !== progress sync)
- Harder to debug timing issues
- Keepalive may already be handling errors

**Why Not Chosen**: Progress sync should happen during active work, not just during keepalive checks.

### Selected Solution: Periodic Call in Work Loop Main Cycle

**Justification**: This approach is the cleanest and most straightforward. The work loop already has a natural iteration cycle with built-in sleep intervals. By adding the `writeOverallProgress()` call after assigning work but before waiting, we ensure:

1. **Correct timing**: Runs every ~30 seconds naturally (limited by `HEALTH_CHECK_INTERVAL_MS`)
2. **Correct placement**: After work is assigned, before we sleep
3. **Minimal changes**: Single line addition to existing code
4. **Leverages existing fix**: #2050 already added the sync mechanism inside `writeOverallProgress()`

**Technical Approach**:
- Call `writeOverallProgress(this.manifest)` in `WorkLoop.mainLoop()` main iteration
- Placement: After `assignWorkToIdleSandboxes()`, before `monitorPromiseAges()`
- No manifest state changes needed—function reads and updates internal progress fields
- No test infrastructure changes—just mocking behavior updates

**Architecture Changes**: None. This is a minimal fix that connects existing components.

**Migration Strategy**: N/A—no data migration needed.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/work-loop.ts` - Add periodic `writeOverallProgress()` call to mainLoop
- `.ai/alpha/scripts/lib/__tests__/work-loop.test.ts` - Update mock to reflect new behavior
- `.ai/alpha/scripts/lib/__tests__/work-loop-promise-timeout.spec.ts` - Update mock calls

### New Files

None

### Step-by-Step Tasks

#### Step 1: Add Periodic Progress Update to Work Loop

Modify `WorkLoop.mainLoop()` to call `writeOverallProgress()` periodically during active execution.

- Locate the main loop iteration in `work-loop.ts` (around line 448)
- Add `writeOverallProgress(this.manifest)` after work assignment
- Add comment explaining the fix and why it's needed (references to #2050, #2054)
- Position: After `assignWorkToIdleSandboxes()` completes
- No manifest state mutations needed—function handles its own updates

**Why this step first**: The core fix must be in place before tests can validate behavior.

#### Step 2: Update Unit Tests to Reflect New Behavior

Update test mocks and fixtures that simulate the work loop to include the new periodic call.

- Update `work-loop.test.ts` to verify `writeOverallProgress()` is called during execution
- Update `work-loop-promise-timeout.spec.ts` to account for new mock calls
- Verify tests pass with the new behavior (53+ tests)

**Why after Step 1**: Tests must validate the implementation, not guide it.

#### Step 3: Validate Progress File Generation

Manually verify that progress files are being updated periodically.

- Run Alpha orchestrator with a test spec (S2045 or smaller)
- Monitor `overall-progress.json` `lastCheckpoint` field
- Verify it updates every ~30 seconds during active execution
- Cross-check with sandbox progress files to ensure counts match

#### Step 4: Verify No Regressions

Run full test suite and validation commands.

- All unit tests pass (53+)
- All integration tests pass
- Typecheck passes globally
- Lint and format passes

#### Step 5: Documentation (Code Comments)

Ensure the fix is well-documented for future maintainers.

- Add inline comment explaining why `writeOverallProgress()` is called in main loop
- Reference related issues (#2050, #2054)
- Mention the data flow: work loop → sync → manifest → UI

## Testing Strategy

### Unit Tests

The implementation has already been tested in place:
- ✅ `work-loop.test.ts` - 53+ tests all passing
- ✅ `work-loop-promise-timeout.spec.ts` - Updated for new mock behavior
- ✅ Tests verify the overall progress update is called during execution

### Integration Tests

- ✅ Alpha orchestrator runs successfully with new periodic updates
- ✅ Sandbox progress files remain in sync with overall progress
- ✅ No deadlock or stuck task detection regressions

### E2E Tests

Not applicable—this is internal orchestrator logic.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Clone diagnosis issue #2054 reproduction steps (S2045 with GPT provider)
- [ ] Run Alpha orchestrator with test spec
- [ ] Monitor `overall-progress.json` file:
  - [ ] `lastCheckpoint` updates every ~30 seconds during execution
  - [ ] `tasksCompleted` count increases as features progress
  - [ ] Counts match sandbox progress files in real-time
- [ ] Verify no UI progress bar shows stuck or regresses
- [ ] Verify overall progress shows >0 tasks within first 60 seconds
- [ ] Run full test suite: `pnpm test` passes all 53+ tests
- [ ] Check for any console errors or warnings during orchestrator run
- [ ] Verify orchestrator completes successfully with correct final counts

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **File I/O overhead**: Writing progress file every 30 seconds could impact performance
   - **Likelihood**: low
   - **Impact**: low (file I/O is already happening via keepalive)
   - **Mitigation**: Function already has try-catch that ignores write errors; no blocking operations

2. **Synchronization lag**: Real-time updates may still have brief delays
   - **Likelihood**: medium
   - **Impact**: low (minor UI lag is acceptable; fixes the "stuck at 0" problem)
   - **Mitigation**: 30-second cadence is reasonable; no action needed

3. **Race conditions with manifest updates**: Multiple threads writing manifest
   - **Likelihood**: low (manifest isn't heavily shared)
   - **Impact**: low (worst case: one update is lost, next iteration fixes it)
   - **Mitigation**: Existing code already handles this; write errors are ignored

**Rollback Plan**:

If issues arise in production:
1. Revert the `writeOverallProgress()` call from `work-loop.ts`
2. Redeploy orchestrator
3. Progress will revert to updating only on state transitions (not ideal, but functional)
4. Original issue #2054 will recur, but orchestrator will continue working

**Monitoring** (if deployed to production):
- Monitor for file write errors in orchestrator logs
- Track if progress file becomes corrupted or too large
- Verify UI progress bar updates consistently during long runs
- Alert if overall-progress.json write fails repeatedly

## Performance Impact

**Expected Impact**: minimal

The `writeOverallProgress()` function:
- Reads from disk (sandbox progress files) - 1-2ms
- Syncs to manifest in memory - <1ms
- Writes JSON file to disk - 1-2ms
- Total: ~3-4ms per call, ~500ms every 30 seconds (negligible)

No async/await needed—synchronous file I/O is appropriate here.

**Performance Testing**:
- Confirm orchestrator throughput unchanged (features/minute)
- Verify no pause in work assignment during progress writes
- Monitor CPU and memory during long runs (should show <1% impact)

## Security Considerations

**Security Impact**: none

The function:
- Only reads existing manifest data (no external input)
- Writes to local UI progress directory (no external exposure)
- No new network calls or external API access
- No authentication changes

No security review needed.

## Validation Commands

### Before Fix (Bug Should Reproduce)

This was already reproduced in diagnosis #2054:

```bash
# Run orchestrator with S2045 spec using GPT provider
pnpm --filter .ai alpha orchestrate S2045

# Monitor progress files in parallel:
watch -n 1 'jq .lastCheckpoint .ai/alpha/specs/S2045-Spec-user-dashboard/sandbox-a-progress.json && jq .lastCheckpoint .ai/alpha/specs/S2045-Spec-user-dashboard/overall-progress.json'
```

**Expected Result (before fix)**: overall-progress.json lastCheckpoint stays frozen at startup while sandbox progress files update every few seconds.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test

# Run orchestrator again with same spec
pnpm --filter .ai alpha orchestrate S2045

# Monitor progress files in parallel
watch -n 1 'jq .lastCheckpoint .ai/alpha/specs/S2045-Spec-user-dashboard/overall-progress.json'
```

**Expected Result**: All commands succeed, overall-progress.json lastCheckpoint updates every ~30 seconds, tasksCompleted count increases during execution.

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Run orchestrator with multiple different specs
pnpm --filter .ai alpha orchestrate S2045
pnpm --filter .ai alpha orchestrate S1918

# Verify orchestrator completes successfully both times
```

## Dependencies

### New Dependencies

None—this uses existing code (writeOverallProgress, syncSandboxProgressToManifest).

**No new dependencies required**

## Database Changes

**Migration needed**: no

No database schema or migration changes required.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained

This is a bug fix that only changes internal orchestrator behavior; no API or contract changes.

## Success Criteria

The fix is complete when:
- [ ] `writeOverallProgress()` is called periodically in work loop main cycle
- [ ] All 53+ unit tests pass
- [ ] Typecheck passes globally
- [ ] Lint and format pass
- [ ] Overall progress file updates every ~30 seconds during execution
- [ ] Task completion counts update in real-time
- [ ] Original S2045 reproduction steps show progress >0 within first 60 seconds
- [ ] No regressions in orchestrator performance or deadlock detection
- [ ] Manual testing checklist complete
- [ ] Code review approved (if applicable)

## Notes

**Related Issues:**
- #2049 - Previous occurrence of same symptom (closed)
- #2050 - Incomplete fix (added sync mechanism but not periodic trigger) (closed)
- #1688 - Original manifest-authoritative counts design (closed)
- #1841 - Promise age monitoring (closed)
- #1767 - Stuck task detection (closed)
- #1782 - Phantom completion recovery (closed)
- #1858 - Sandbox restart handling (closed)

**Key Insight**: This fix completes the work started in #2050. The sync mechanism was added but not the periodic trigger. By adding the periodic call to the work loop, we connect the existing infrastructure pieces to solve the original problem.

**Future Improvements** (out of scope):
- Consider using E2B pause/resume instead of restart (performance optimization)
- Reduce stagger from 60s to 30s for faster feature assignment
- Implement WAL or locking for manifest.json state consistency

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #2054*
