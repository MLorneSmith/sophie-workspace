# Bug Fix: Orchestrator PTY Disconnect Causes Manifest Stall

**Related Diagnosis**: #1765
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: PTY `wait()` hangs indefinitely after sandbox completes feature, leaving manifest stale. Progress file shows completion but orchestrator manifest never updates.
- **Fix Approach**: Implement timeout-aware PTY handling with progress-file fallback detection to force manifest updates when sandbox completion is confirmed via progress file.
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Spec Orchestrator gets stuck when a PTY connection to an E2B sandbox disconnects or times out after the sandbox completes a feature. The sandbox writes `status: "completed"` to its progress file, but the orchestrator's `ptyHandle.wait()` never returns, leaving the manifest in `in_progress` state indefinitely. This blocks all dependent features from starting.

The core issue: **asynchronous disconnect between sandbox completion and manifest update**. The sandbox completes its work and signals via progress file, but the orchestrator's event loop is blocked waiting on a PTY that no longer communicates.

For full details, see diagnosis issue #1765.

### Solution Approaches Considered

#### Option 1: Dual-Channel Completion Detection with Timeout ⭐ RECOMMENDED

**Description**: Implement a timeout wrapper around `ptyHandle.wait()` that fires after N seconds. If timeout occurs, poll the progress file to check if sandbox actually completed. If progress file shows `status: "completed"`, treat as successful completion and force manifest update. Otherwise, escalate to stuck-detection logic.

**Pros**:
- Robust: Works even if PTY completely disconnects
- Non-invasive: Wraps existing `wait()` without major refactoring
- Clear signal path: Progress file is source of truth for completion
- Handles edge case: Timeout + actual completion = manifest update, not stall
- Testable: Can simulate PTY hangs and verify progress-file fallback

**Cons**:
- Adds complexity: Need timeout logic + fallback detection
- Timing sensitive: Must choose timeout value carefully (too short = false timeouts, too long = slow detection)
- Monitoring needed: Need to track how often fallback is triggered

**Risk Assessment**: medium - Timeout values need tuning, but fallback is explicit and verifiable.

**Complexity**: moderate - ~50 lines of wrapper code + progress-file polling.

#### Option 2: Keep-Alive Heartbeat on PTY Channel

**Description**: Start a background heartbeat task that reads from PTY periodically. If heartbeat fails N times, assume PTY is dead and check progress file.

**Pros**:
- Detects PTY death early
- Could provide debugging info about when PTY died

**Cons**:
- More complex: Need background task management
- Still requires progress-file fallback anyway
- Higher overhead: Continuous polling of PTY

**Why Not Chosen**: Option 1 is simpler and equally effective. Heartbeat adds complexity without clear benefit over timeout + fallback.

#### Option 3: Event-Based Progress Monitoring

**Description**: Independently monitor progress file changes on a timer (e.g., every 1 second). When progress file shows completion, update manifest regardless of PTY state.

**Pros**:
- Guaranteed to catch completions via progress file
- No dependency on PTY state

**Cons**:
- Decouples PTY from manifest updates (loses useful signal)
- More polling overhead
- Could mask actual PTY issues

**Why Not Chosen**: Option 1 provides the same fallback but keeps PTY as primary signal, only using progress file as failsafe.

### Selected Solution: Dual-Channel Completion Detection with Timeout

**Justification**: This approach combines reliability (progress file fallback), maintainability (minimal code changes), and debugging clarity (clear signal path: PTY → timeout → fallback). It directly addresses the root cause: PTY hangs are detected and recovered via progress file.

**Technical Approach**:

1. **Wrap `ptyHandle.wait()` with timeout**: Use `Promise.race([ptyHandle.wait(), setTimeout(timeout)])` to implement a timeout that fires after 30 seconds (configurable).

2. **On timeout, check progress file**: If timeout fires, poll the sandbox's progress file (e.g., `sbx-{sandbox-id}-progress.json`).

3. **Completion detection logic**:
   - If progress file shows `status: "completed"`: Treat as successful, update manifest, and log "PTY timeout but sandbox completed (recovered via progress file)"
   - If progress file shows `status: "in_progress"`: Escalate to existing stuck-detection logic (feature is genuinely stuck)
   - If progress file doesn't exist or is stale (>5min old): Treat as PTY error, trigger recovery

4. **Update manifest forcefully**: Call `saveManifest()` with `status: "completed"` to unblock dependent features.

5. **Log telemetry**: Track PTY timeouts and fallback triggers for monitoring and alerting.

**Architecture Changes**:

- No schema or database changes needed.
- Refactor feature completion handler in `feature.ts` to use timeout wrapper (extract to utility if needed).
- Add progress-file polling helper to `orchestrator.ts`.
- Add telemetry counters to track fallback triggers.

**Migration Strategy**: Not applicable - this is a runtime fix with no data migration needed.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/feature.ts:496` - `ptyHandle.wait()` that hangs; wrap with timeout
- `.ai/alpha/scripts/lib/orchestrator.ts:900-952` - Stuck detection logic; add fallback case
- `.ai/alpha/scripts/lib/progress-file.ts` (new) - Progress file polling utility
- `.ai/alpha/scripts/lib/config.ts` - Add PTY timeout constant (30 seconds default)

### New Files

- `.ai/alpha/scripts/lib/pty-wrapper.ts` - Timeout wrapper for `ptyHandle.wait()` with fallback detection
- `.ai/alpha/scripts/tests/pty-wrapper.spec.ts` - Unit tests for timeout + fallback logic

### Step-by-Step Tasks

#### Step 1: Add Configuration for PTY Timeout

Add a configurable timeout value and fallback retry logic to the config:

- Add `PTY_TIMEOUT_MS` constant (30000 ms default, overridable via env)
- Add `PROGRESS_FILE_POLL_INTERVAL_MS` (500 ms)
- Add `PROGRESS_FILE_STALE_THRESHOLD_MS` (5 minutes)

**Why this step first**: Configuration is required by all other steps and should be centralized.

#### Step 2: Create Progress File Polling Utility

Create `.ai/alpha/scripts/lib/progress-file.ts` with:

- `readProgressFile(sandboxId: string): Promise<ProgressFile | null>` - Read and parse progress file
- `isProgressFileStale(progressFile: ProgressFile): boolean` - Check if heartbeat is >5 minutes old
- Helper to calculate progress file path from sandbox ID

```typescript
interface ProgressFile {
  status: "in_progress" | "completed" | "failed";
  phase: string;
  completed_tasks: number;
  total_tasks: number;
  last_heartbeat: string;
}
```

**Why this step**: Utility is needed by PTY wrapper in next step, and by stuck-detection fallback.

#### Step 3: Create PTY Timeout Wrapper

Create `.ai/alpha/scripts/lib/pty-wrapper.ts` with:

- `waitWithTimeout(ptyHandle, sandboxId, timeoutMs): Promise<void>`
- Wraps `ptyHandle.wait()` with `Promise.race()` timeout
- On timeout:
  - Check progress file
  - If `status === "completed"`: Return successfully (treat as completion)
  - Otherwise: Throw `PTYTimeoutError` with sandbox ID and progress state
- Add telemetry: track timeout occurrences

```typescript
export async function waitWithTimeout(
  ptyHandle: PTYHandle,
  sandboxId: string,
  timeoutMs: number = PTY_TIMEOUT_MS,
): Promise<void> {
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    setTimeout(() => reject(new Error("PTY wait timeout")), timeoutMs);
  });

  try {
    await Promise.race([ptyHandle.wait(), timeoutPromise]);
  } catch (error) {
    if (error.message === "PTY wait timeout") {
      // Check progress file
      const progress = await readProgressFile(sandboxId);
      if (progress?.status === "completed") {
        telemetry.increment("pty_timeout_recovered_via_progress_file");
        return; // Treat as successful
      }
      throw error;
    }
    throw error;
  }
}
```

**Why this step**: This is the core fix. It adds timeout detection + fallback logic.

#### Step 4: Update Feature Completion Handler

Modify `.ai/alpha/scripts/lib/feature.ts` around line 496:

- Replace `await ptyHandle.wait()` with `await waitWithTimeout(ptyHandle, sandbox.id)`
- Add error handler for `PTYTimeoutError`:
  - Log warning with sandbox ID and progress state
  - Return error result to orchestrator (don't throw, let orchestrator decide)

```typescript
try {
  await waitWithTimeout(ptyHandle, sandbox.id);
  // Feature completed successfully
  return { success: true, data: result };
} catch (error) {
  if (error instanceof PTYTimeoutError) {
    logger.warn("PTY timeout during feature completion", {
      sandboxId: sandbox.id,
      progressState: error.progressState,
    });
    return { success: false, error: "PTY_TIMEOUT" };
  }
  throw error;
}
```

**Why this step**: Integrates timeout wrapper into actual feature execution flow.

#### Step 5: Update Stuck Detection and Fallback Logic

Modify `.ai/alpha/scripts/lib/orchestrator.ts` around line 928-952:

- When stuck detection fires and finds PTY timeout:
  - Explicitly check progress file one more time
  - If progress shows `status: "completed"`: Force update manifest and unblock dependents
  - Log "Orchestrator recovered stalled feature via progress-file fallback"
  - Return early (don't escalate to stuck alert)

```typescript
// In stuck detection loop (around line 928)
if (sandbox.status === "busy") {
  // Check if PTY timed out but progress file shows completion
  const progress = await readProgressFile(sandbox.id);
  if (progress?.status === "completed") {
    logger.info("Recovering stalled feature via progress file", {
      featureId: feature.id,
      sandboxId: sandbox.id,
    });

    await saveManifest({
      ...manifest,
      features: manifest.features.map(f =>
        f.id === feature.id ? { ...f, status: "completed" } : f
      ),
    });

    telemetry.increment("stuck_feature_recovered_via_progress_file");
    continue; // Check next feature
  }
}
```

**Why this step**: Provides explicit recovery path in the stuck-detection loop, ensuring no feature gets permanently stuck.

#### Step 6: Add Unit Tests

Create `.ai/alpha/scripts/tests/pty-wrapper.spec.ts`:

- **Test 1**: PTY completes normally (no timeout) → should complete successfully
- **Test 2**: PTY times out but progress file shows completed → should recover and return success
- **Test 3**: PTY times out and progress file shows in_progress → should throw error
- **Test 4**: PTY times out, progress file is stale → should throw error
- **Test 5**: PTY times out, progress file doesn't exist → should throw error

**Test files**:
- `.ai/alpha/scripts/tests/pty-wrapper.spec.ts` - PTY wrapper tests
- Update `.ai/alpha/scripts/tests/orchestrator.spec.ts` to test fallback recovery path

#### Step 7: Integration Testing

Before shipping, manually test the fix:

- Run spec orchestrator with multiple features across sandboxes
- Simulate PTY disconnect: Kill PTY connection mid-completion
- Verify:
  - Progress file shows `status: "completed"`
  - Orchestrator detects timeout
  - Orchestrator reads progress file and recovers
  - Manifest updates with completed feature
  - Dependent features unblock and proceed

#### Step 8: Validation

- Run all validation commands (see Validation Commands section below)
- Verify zero regressions in existing feature execution flow
- Confirm telemetry shows expected metrics

## Testing Strategy

### Unit Tests

Add/update unit tests for:

- ✅ **PTY timeout wrapper**: Normal completion (no timeout)
- ✅ **PTY timeout + progress file completed**: Recover successfully
- ✅ **PTY timeout + progress file in_progress**: Throw error (feature stuck)
- ✅ **PTY timeout + stale progress file**: Throw error (sandbox crashed)
- ✅ **PTY timeout + missing progress file**: Throw error (sandbox recovery needed)
- ✅ **Orchestrator stuck detection + progress file fallback**: Force manifest update
- ✅ **Dependent features unblock after recovery**: Feature I4.F2 starts after I4.F1 recovered

**Test files**:
- `.ai/alpha/scripts/tests/pty-wrapper.spec.ts` - PTY wrapper unit tests
- `.ai/alpha/scripts/tests/orchestrator.spec.ts` - Update existing stuck-detection tests

### Integration Tests

Test the full flow with real E2B sandboxes:

- Simulate feature execution through completion
- Kill PTY at completion → verify recovery
- Verify dependent features proceed without stalling

**Test scenario**:
1. Run spec orchestrator: `tsx spec-orchestrator.ts 1692`
2. Wait for S1692.I4.F1 to complete
3. Kill PTY connection: `pkill -f "pty.*sbx-b"`
4. Monitor manifest updates
5. Verify S1692.I4.F2 starts (wasn't blocked by stalled F1)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator with spec containing 5+ features across 2+ sandboxes
- [ ] Let features reach completion phase
- [ ] Simulate PTY disconnect: kill PTY connection while feature finishing
- [ ] Verify progress file shows `status: "completed"`
- [ ] Wait for timeout (30 seconds) and observe recovery
- [ ] Check manifest: feature should be marked `completed`
- [ ] Verify dependent features proceed (weren't blocked)
- [ ] Run with multiple features in parallel (E2B resource constraints)
- [ ] Verify telemetry shows recovery metrics
- [ ] Check logs for recovery messages (no error-level logs for recovered features)

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Timeout Value Tuning**: Choosing 30 seconds might be wrong
   - **Likelihood**: medium (depends on E2B sandbox performance)
   - **Impact**: low (recoverable via retry or manual restart)
   - **Mitigation**: Make timeout configurable via env var; start with 30s and adjust based on telemetry

2. **Progress File Stale Detection**: Heartbeat might be outdated when we check
   - **Likelihood**: low (heartbeat updates frequently)
   - **Impact**: low (we escalate to stuck detection if progress file stale)
   - **Mitigation**: Include heartbeat timestamp in recovery decision; log when assuming stale

3. **Race Condition**: Manifest update after timeout but before PTY actually completes
   - **Likelihood**: low (timeout is long enough that feature should complete)
   - **Impact**: medium (feature marked completed but code still running in sandbox)
   - **Mitigation**: Progress file must show completed; if not, we don't recover. Always check progress file as source of truth.

4. **False Recoveries**: Mark feature as completed when it actually failed
   - **Likelihood**: low (we check progress file status explicitly)
   - **Impact**: high (broken feature would remain invisible)
   - **Mitigation**: Only recover if progress file explicitly shows `status: "completed"`, not `in_progress` or `failed`. Add telemetry to track false recoveries.

**Rollback Plan**:

If the fix causes issues in production:

1. Revert changes to `.ai/alpha/scripts/lib/feature.ts` (remove timeout wrapper)
2. Revert changes to `.ai/alpha/scripts/lib/orchestrator.ts` (remove fallback detection)
3. Restart orchestrator process
4. Dependent features will remain blocked until manual intervention, but system won't hang indefinitely with bad data

## Performance Impact

**Expected Impact**: minimal

- Added timeout check: ~1-2ms per feature completion (negligible)
- Progress file polling on timeout: ~5-10ms (only on error path, rare)
- Overall throughput: unchanged (timeout is only recovery mechanism)

**Performance Testing**:

- Verify feature execution time unchanged (median + p99)
- Monitor timeout frequency (should be <1% of feature completions)
- Verify manifest update latency unchanged

## Security Considerations

**Security Impact**: none

- No new external inputs
- No credential exposure
- No elevated privileges needed
- Progress file reading is same as existing code

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator with multi-feature spec
cd /home/msmith/projects/2025slideheroes
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692

# In another terminal, after S1692.I4.F1 starts completing:
# Simulate PTY disconnect
pkill -f "pty.*sbx-b"

# Expected Result: Feature stays in_progress forever, manifest never updates
```

**Expected Observation**: Manifest remains stale, dependent features never start.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Run unit tests
pnpm --filter web test:unit -- pty-wrapper.spec.ts
pnpm --filter web test:unit -- orchestrator.spec.ts

# Run orchestrator test
cd /home/msmith/projects/2025slideheroes
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692

# Manual verification (same as before fix)
# Kill PTY mid-completion, verify recovery within 30 seconds
```

**Expected Result**: All commands succeed, orchestrator recovers from PTY timeout, manifest updates, dependent features proceed.

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Run specific orchestrator tests
pnpm --filter web test:unit -- orchestrator.spec.ts

# Verify existing feature execution still works
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692 --no-pty-fail

# Check telemetry for recovery metrics
# Alert if pty_timeout_recovered_via_progress_file > 10% of completions
```

## Dependencies

### New Dependencies

**No new dependencies required**. The fix uses existing Node.js APIs:
- `Promise.race()` for timeout
- `fs.readFileSync()` for progress file reading (already in use)
- Existing E2B SDK APIs

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- Deploy `.ai/alpha/scripts/` changes (no database migration needed)
- New env var (optional): `PTY_TIMEOUT_MS=30000` (defaults if not set)
- No service restart needed (orchestrator can pick up changes on next run)

**Feature flags needed**: no

**Backwards compatibility**: maintained (fix is transparent to existing code)

## Success Criteria

The fix is complete when:

- [ ] All validation commands pass
- [ ] PTY timeout recovery works in integration test
- [ ] Dependent features unblock after recovery
- [ ] Manual testing checklist complete
- [ ] Telemetry shows reasonable recovery rates (<5% of feature completions)
- [ ] Zero regressions in existing feature execution
- [ ] Code review approved
- [ ] Rollback plan documented and tested

## Notes

**Key Design Decisions**:

1. **Progress file as source of truth**: By checking progress file on timeout, we ensure we never mark a feature as completed unless the sandbox actually finished it. This is safer than guessing based on timeout alone.

2. **Timeout not escalation**: When PTY times out, we immediately check progress file rather than waiting for stuck-detection loop. This speeds recovery from 5-10 minutes to ~30 seconds.

3. **Configurable timeout**: 30 seconds is reasonable for most features, but E2B sandbox performance varies. Making it configurable allows tuning without code changes.

4. **Telemetry critical**: We must track how often the fallback is triggered to know if this is a chronic issue (needs architectural change) or edge case (this fix is appropriate).

**Related Issues**:
- #1699: PTY timeout issues (related)
- #1701: PTY timeout issues (related)
- #1688: Stuck feature detection (related)
- #1567: Sandbox recovery patterns (related)

**Future Improvements**:
1. Consider moving to event-based PTY handling instead of polling (bigger refactor)
2. Add WebSocket-based heartbeat between sandbox and orchestrator (replaces progress file polling)
3. Implement automatic sandbox recovery (restart + retry failed features)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1765*
