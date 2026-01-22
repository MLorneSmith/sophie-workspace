# Bug Fix: Alpha Orchestrator Progress Count Mismatch & UI Hang

**Related Diagnosis**: #1699 (REQUIRED)
**Severity**: high
**Bug Type**: bug, regression
**Risk Level**: medium
**Complexity**: complex

## Quick Reference

- **Root Cause**: Two independent issues: (1) Task count calculation only includes "busy" sandboxes, excluding completed features; (2) E2B PTY default 60-second timeout causes silent disconnection without error events
- **Fix Approach**: Implement E2B PTY timeout configuration and activity monitoring with client-side health checks, plus redesign task count calculation to use manifest as source-of-truth
- **Estimated Effort**: large
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator UI displays inconsistent task completion counts and experienced a UI update hang during S1692 feature development:

1. **Task Count Mismatch**: Sandbox sbx-b showed 4/4 tasks for S1692.I1.F3 complete, but Overall Progress showed only 3/104 tasks. Root cause: `useProgressPoller.ts` only counts tasks from "busy" sandboxes; when features complete, sandboxes change status and their task counts disappear from the sum.

2. **UI Hang**: PTY output stream for sbx-b stopped updating at ~14m 24s. The log file ends abruptly with "Running Claude Code with prompt: /alpha:implement S1692.I1.F4" with zero subsequent output. E2B SDK has a **60-second default PTY timeout** that silently disconnects without firing error events, causing the progress poller to receive stale data.

For complete diagnosis details, see issue #1699.

### Solution Approaches Considered

#### Option 1: E2B PTY Configuration + Robust Health Monitoring ⭐ RECOMMENDED

**Description**:
- Set `timeout: 0` on PTY creation to disable 60-second auto-disconnect
- Extend sandbox timeout to 24 hours: `await sandbox.setTimeout(24 * 60 * 60 * 1000)`
- Implement client-side 30-second activity polling using `sandbox.isRunning()` and `sandbox.commands.list()`
- Add reconnection strategy using `sandbox.commands.connect(pid)` when stream drops
- Redesign task count calculation to use manifest as source-of-truth instead of sandbox status

**Pros**:
- Addresses E2B's documented timeout issue (#727) directly at the source
- Client-side polling provides redundant health checks independent of PTY stream
- Reconnection logic allows recovery from transient network issues
- Manifest-based counting is mathematically correct and doesn't depend on sandbox state transitions
- Aligns with research findings from E2B community and GitHub issues

**Cons**:
- Requires significant refactoring of orchestrator execution engine
- Client-side polling adds ~30s overhead to stall detection
- Needs careful error handling for reconnection edge cases
- Adds operational complexity (more state to track)

**Risk Assessment**: medium - Changes are isolated to E2B integration and task counting logic, but PTY stream handling is critical infrastructure

**Complexity**: complex - Involves PTY configuration, activity monitoring, reconnection logic, and manifest-based counting

#### Option 2: Increase PTY Timeout Only

**Description**: Set `timeout: 0` but don't implement polling or reconnection. Rely on existing stream to continue.

**Pros**:
- Minimal code changes
- Simplest approach
- Quick implementation

**Cons**:
- Doesn't address network drops or E2B server issues
- No health monitoring = no early detection of problems
- No recovery mechanism if stream dies
- Won't work if E2B's timeout enforcement is server-side
- Diagnosis research showed this alone is insufficient

**Why Not Chosen**: Incomplete fix based on research. E2B GitHub issues indicate timeout config alone doesn't solve streaming issues without health checks.

#### Option 3: Polling-Only (No PTY Stream Fixes)

**Description**: Poll manifest periodically without fixing underlying PTY issues. Keep current streaming.

**Pros**:
- Doesn't touch PTY configuration
- Works around task count mismatch

**Cons**:
- Doesn't fix root cause of PTY stream stoppage
- UI hang will still occur when stream dies
- Creates false sense of progress if stale data is polled
- Misses opportunity to fix E2B configuration issue

**Why Not Chosen**: Treats symptom, not disease. Users will still experience UI hangs.

### Selected Solution: Option 1 - E2B PTY Configuration + Health Monitoring

**Justification**: This approach addresses both root causes identified in the diagnosis:

1. **E2B PTY Timeout Issue** (Known Issue #727): The research phase confirmed this is a known E2B limitation. Setting `timeout: 0` disables the default 60-second auto-disconnect, and extending sandbox timeout ensures long-running features don't hit session limits.

2. **Client-Side Health Monitoring**: E2B doesn't provide built-in keepalive, so implementing 30-second polling using `sandbox.isRunning()` and `sandbox.commands.list()` provides redundant health checks independent of the PTY stream.

3. **Reconnection Logic**: Using `sandbox.commands.connect(pid)` allows recovery if the stream drops, improving reliability.

4. **Task Count Fix**: Using the manifest as the source-of-truth for task counts eliminates dependency on sandbox state transitions, which are unreliable indicators of feature completion.

The risk is acceptable because changes are isolated to the orchestrator execution engine and E2B integration layer, with comprehensive testing to prevent regressions.

**Technical Approach**:

- **E2B PTY Configuration**:
  ```typescript
  const handle = await sandbox.pty.create({
    size: { cols: 120, rows: 40 },
    onData: (data) => processData(data),
    timeout: 0  // CRITICAL: Disable 60-second default timeout
  });
  ```

- **Sandbox Timeout Extension**:
  ```typescript
  await sandbox.setTimeout(24 * 60 * 60 * 1000); // 24 hours max
  ```

- **Activity Monitoring Loop** (runs every 30 seconds):
  ```typescript
  setInterval(async () => {
    const running = await sandbox.isRunning();
    const commands = await sandbox.commands.list();
    if (!running || commands.length === 0) {
      triggerStallDetection();
    }
  }, 30_000);
  ```

- **Reconnection Strategy**:
  ```typescript
  if (streamStalled && processId) {
    try {
      const handle = await sandbox.commands.connect(processId);
      // Resume onData handler
    } catch (e) {
      // Mark feature as failed, trigger retry
    }
  }
  ```

- **Manifest-Based Task Counting**:
  ```typescript
  // Calculate from manifest structure instead of sandbox status
  const tasksCompleted = manifest.features
    .filter(f => f.status === 'completed')
    .reduce((sum, f) => sum + f.tasks.length, 0);
  ```

**Architecture Changes**:

1. **New file**: `.ai/alpha/scripts/lib/pty-health-monitor.ts` - PTY health monitoring and reconnection logic
2. **Modified**: `.ai/alpha/scripts/lib/feature.ts` - PTY configuration and stall detection
3. **Modified**: `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` - Task count calculation logic
4. **Modified**: `.ai/alpha/scripts/lib/progress.ts` - Progress update to reflect manifest-based counts

**Migration Strategy**:

No data migration needed. The changes are purely execution and UI logic improvements.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/feature.ts` - PTY creation, timeout configuration, stall detection
- `.ai/alpha/scripts/lib/pty-health-monitor.ts` - New file for health monitoring and reconnection logic
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` - Task count calculation using manifest
- `.ai/alpha/scripts/lib/progress.ts` - Update progress calculation to use manifest
- `.ai/alpha/scripts/lib/manifest.ts` - Add helper to calculate completed task counts

### New Files

- `.ai/alpha/scripts/lib/pty-health-monitor.ts` - Health monitoring and reconnection strategies for E2B PTY streams

### Step-by-Step Tasks

#### Step 1: E2B PTY Configuration Foundation

Configure E2B PTY with proper timeout settings and sandbox lifecycle management.

- Read current PTY creation code in `feature.ts`
- Add `timeout: 0` to PTY creation options in `createPtyHandle()`
- Add `await sandbox.setTimeout(24 * 60 * 60 * 1000)` after sandbox spawn
- Add inline comments explaining the E2B issue (#727) and why these settings are critical
- Create helper function `configureEmbSandbox()` to encapsulate these settings

**Why this step first**: PTY configuration must be correct before implementing health monitoring. These changes are low-risk and foundational.

#### Step 2: Implement PTY Health Monitor

Create a new module for monitoring PTY stream health and implementing reconnection logic.

- Create `.ai/alpha/scripts/lib/pty-health-monitor.ts`
- Implement `PtyHealthMonitor` class with methods:
  - `startHealthCheck(sandbox, interval = 30_000)` - Periodically check `sandbox.isRunning()` and `sandbox.commands.list()`
  - `handleStallDetected(feature, sandbox)` - Trigger when no activity detected
  - `attemptReconnect(sandbox, originalProcessId)` - Try to reconnect using `sandbox.commands.connect(pid)`
  - `stop()` - Cleanup health check interval
- Add configuration constants at module top:
  ```typescript
  const HEALTH_CHECK_INTERVAL = 30_000; // 30 seconds
  const STALL_DETECTION_TIMEOUT = 60_000; // 60 seconds = 2 missed health checks
  ```
- Add error handling for disconnected sandboxes
- Add logging at INFO level for health check results, ERROR level for stalls

**Why this step second**: Builds on PTY configuration. Isolated logic that can be tested independently.

#### Step 3: Integrate Health Monitor into Feature Execution

Wire health monitoring into the feature execution pipeline.

- Modify `feature.ts` `executeFeature()` function
- Create `PtyHealthMonitor` instance when PTY is created
- Call `monitor.startHealthCheck(sandbox)` immediately after PTY creation
- Wire `handleStallDetected()` to existing stall detection callback
- Call `monitor.stop()` in finally block to cleanup health check interval
- Add error handler for reconnection failures that marks feature as failed

**Why this step third**: Integrates monitoring into execution flow. Order matters: config first, monitoring logic second, integration third.

#### Step 4: Fix Task Count Calculation

Update task counting to use manifest as source-of-truth instead of sandbox status.

- Read current task counting logic in `useProgressPoller.ts` (lines 875-915)
- Create helper function in `manifest.ts`: `calculateCompletedTasks(manifest)`
  ```typescript
  export function calculateCompletedTasks(manifest: FeatureManifest): number {
    return manifest.features
      .filter(f => f.status === 'completed')
      .reduce((sum, f) => sum + (f.tasks?.length ?? 0), 0);
  }
  ```
- Update `useProgressPoller.ts` to call this helper instead of summing sandbox statuses
- Update `progress.ts` `writeUIProgress()` to pass calculated counts to UI
- Add test for edge cases: empty features, features with 0 tasks, all features completed

**Why this step fourth**: Depends on understanding manifest structure. By step 4, you've already worked with feature execution, so manifest format is familiar.

#### Step 5: Add Comprehensive Tests

Create tests to prevent regressions and validate the fixes.

- **Unit tests** for `pty-health-monitor.ts`:
  - Test health check detects stalled streams (mock `sandbox.isRunning()` returning false)
  - Test reconnection attempt with valid process ID
  - Test cleanup when monitor stops
  - Test configuration constants are reasonable

- **Unit tests** for task counting:
  - Test empty manifest returns 0
  - Test manifest with multiple completed features sums correctly
  - Test filters out non-completed features
  - Test handles missing `tasks` array gracefully

- **Integration tests**:
  - Test E2B sandbox creation respects timeout configuration
  - Test health monitor triggers stall detection on stream drop
  - Test progress UI updates correctly with manifest-based counts

- **E2E tests** (optional if orchestrator is tested end-to-end):
  - Run a multi-feature implementation and verify:
    - All features complete successfully
    - Task counts update correctly
    - UI doesn't hang if simulated stream drops

**Test files**:
- `apps/e2e/tests/alpha/pty-health-monitor.spec.ts` - Unit/integration tests for health monitor
- `apps/e2e/tests/alpha/task-counting.spec.ts` - Unit tests for manifest-based counting

#### Step 6: Validation & Documentation

Validate fixes and update documentation.

- Run all validation commands (see Validation Commands section below)
- Verify zero regressions
- Test with actual E2B sandbox if possible
- Update inline comments in `feature.ts` to explain PTY configuration
- Update `.ai/ai_docs/context-docs/infrastructure/e2b-sandbox.md` with:
  - Section: "PTY Configuration and Health Monitoring"
  - Explanation of timeout issues
  - Configuration best practices
  - Health check interval rationale
- Document new `PtyHealthMonitor` class in module comments

**Why this step last**: Validation confirms the fix works before documenting it.

## Testing Strategy

### Unit Tests

Add unit tests for:
- ✅ `PtyHealthMonitor.startHealthCheck()` - Validates interval is set correctly
- ✅ Health check detects stalled PTY (mock `sandbox.isRunning()` returns false)
- ✅ Reconnection attempts with valid process ID
- ✅ Cleanup when monitor stops
- ✅ Task counting with empty manifest returns 0
- ✅ Task counting sums completed features correctly
- ✅ Task counting filters out non-completed features
- ✅ Task counting handles missing `tasks` array
- ✅ Health check interval respects configuration constant
- ✅ Stall detection triggers after missed health checks

**Test files**:
- `.ai/alpha/tests/pty-health-monitor.spec.ts` - Health monitoring logic
- `.ai/alpha/tests/task-counting.spec.ts` - Task count calculation

### Integration Tests

Test interactions between components:
- ✅ E2B sandbox is created with `timeout: 0`
- ✅ Sandbox timeout is extended to 24 hours
- ✅ Health monitor integrated into feature execution
- ✅ Stall detection properly triggers via health monitor
- ✅ Manifest-based counts flow to UI progress updates
- ✅ Feature completion updates manifest and task counts

**Test files**:
- `.ai/alpha/tests/orchestrator-integration.spec.ts`

### E2E Tests

Test end-to-end orchestrator behavior:
- ✅ Run multi-feature implementation (S1xxx.Ixx with 3+ features)
- ✅ Verify all features complete successfully
- ✅ Verify overall task count matches expected
- ✅ Verify UI updates continuously (no hangs)
- ✅ Simulate PTY stream drop and verify recovery
- ✅ Verify manifest reflects correct completion status

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Spawn E2B sandbox and verify PTY creation with `timeout: 0`
- [ ] Run 10-minute feature implementation and verify no stream stops at 60s mark
- [ ] Verify health monitor logs appear every 30 seconds during feature execution
- [ ] Stop simulated PTY stream and verify health check detects stall within 60 seconds
- [ ] Verify manifest-based task count matches actual completed features
- [ ] Run multi-feature implementation (S1692 or similar) and verify counts are consistent
- [ ] Verify UI progress updates throughout feature execution (no stalls)
- [ ] Check browser console for errors related to progress updates
- [ ] Verify logs show no PTY timeout errors

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **PTY Configuration Doesn't Solve E2B Issue**: E2B may have server-side timeout enforcement that ignores client `timeout: 0` setting.
   - **Likelihood**: medium (research confirmed E2B issue #727 is open; client-side fix may not fully resolve)
   - **Impact**: high (if PTY still stops, feature execution fails)
   - **Mitigation**: Health monitoring provides fallback detection via `sandbox.isRunning()`. If PTY fails despite config, health check will catch it within 30-60 seconds.

2. **Reconnection Logic Fails**: Calling `sandbox.commands.connect(pid)` after stream drop may not work reliably.
   - **Likelihood**: medium (depends on E2B SDK stability)
   - **Impact**: medium (feature still fails, but we tried recovery)
   - **Mitigation**: Add comprehensive error handling. If reconnection fails, mark feature as stalled and trigger manual retry workflow.

3. **Health Check Polling Overhead**: 30-second polling may consume significant resources with 3+ concurrent sandboxes.
   - **Likelihood**: low (30s interval is reasonable)
   - **Impact**: low (sandbox specs have 4 CPU, polling is lightweight)
   - **Mitigation**: If overhead becomes problematic, increase interval to 60s. Monitor CPU/memory usage.

4. **Task Counting Edge Cases**: Manifest structure may have edge cases not accounted for (e.g., nested features, partial completion).
   - **Likelihood**: low (manifest structure is well-defined)
   - **Impact**: low (affects UI display only, not execution)
   - **Mitigation**: Comprehensive unit tests cover all edge cases. Filter logic is defensive (checks for null/undefined).

5. **Regression in Existing Orchestrator**: Changes to core execution logic may break existing features.
   - **Likelihood**: medium (we're modifying core execution path)
   - **Impact**: high (all orchestrator features affected)
   - **Mitigation**: Comprehensive test coverage. Feature flag for health monitoring (disabled by default, enabled in testing).

**Rollback Plan**:

If this fix causes issues in production:

1. **Immediate**: Revert commits to `feature.ts` and `useProgressPoller.ts`
2. **PTY Config Rollback**: Remove `timeout: 0` and `setTimeout()` calls
3. **Health Monitor Disable**: Comment out health monitor initialization in feature execution
4. **Task Count Rollback**: Restore original sandbox-status-based counting logic
5. **Manifest Changes**: Revert progress calculation changes
6. **Restart**: Restart orchestrator UI and any running features
7. **Verify**: Confirm rollback restores previous behavior (with task count mismatch)

**Rollback Validation**:
```bash
# 1. Revert specific commits
git revert <commit-hash>

# 2. Verify no health monitor logs appear
grep -i "health.*check\|stall.*detected" .ai/alpha/logs/*.log

# 3. Verify task counting uses old logic (inspect logs)
# 4. Restart orchestrator and test basic feature run
# 5. Confirm task counts match previous behavior (3/104 in sbx-b scenario)
```

**Monitoring** (if deployed):

After deploying this fix, monitor for:
- PTY stream errors in `.ai/alpha/logs/`
- Health check interval consistency (should see entries every 30s)
- Feature execution completion rates (should improve with stall detection)
- UI responsiveness (should no longer hang at 60s mark)
- Manifest accuracy (verify completed tasks = UI task count)

## Performance Impact

**Expected Impact**: minimal

- **PTY Timeout Configuration**: No performance impact (just settings)
- **Health Check Polling**: ~1-2% CPU overhead per sandbox (lightweight `isRunning()` and `commands.list()` calls every 30s)
- **Task Count Calculation**: Faster than current approach (single manifest traversal vs. summing sandbox arrays)
- **Manifest Passing**: Negligible overhead (already computed, just passed to UI)

**Performance Testing**:

- Verify health checks add <100ms latency per poll
- Compare orchestrator execution time before/after (should be equivalent or faster)
- Monitor sandbox CPU/memory usage during 20-minute multi-feature run

## Security Considerations

**Security Impact**: none

No authentication, encryption, or data exposure changes. PTY configuration and health monitoring are internal orchestrator logic.

**Security Review Needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

To confirm the bugs exist before applying the fix:

```bash
# 1. Simulate long-running feature execution (will hang after ~60s)
# Run a feature implementation that takes >60 seconds
cd /home/msmith/projects/2025slideheroes
pnpm --filter web-e2e run test:alpha:orchestrator -- --feature-set S1692

# 2. Observe task count mismatch
# Check `.ai/alpha/ui/progress.json` and verify:
# - sbx-b shows "status": "busy", "tasksCompleted": 4
# - But overall "completedTasks": 3 (should be 7 after feature completes)

# 3. Observe PTY stream stoppage
# Check sbx-b.log:
tail -50 .ai/alpha/logs/sbx-b.log
# Should see output stops abruptly around line 70-80 after feature starts
```

**Expected Result**:

- Task counts don't match between sandbox progress and overall progress
- PTY log stops updating after ~60 seconds of feature execution
- UI progress stops updating (hangs)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (pty health monitor and task counting)
pnpm test:unit -- pty-health-monitor.spec.ts
pnpm test:unit -- task-counting.spec.ts

# Integration tests
pnpm test:integration -- orchestrator-integration.spec.ts

# E2E orchestrator test (if exists)
pnpm --filter web-e2e test:alpha:orchestrator

# Manual verification
# 1. Start orchestrator UI
pnpm --filter .ai start:orchestrator:ui

# 2. Run a feature implementation for 3-5 minutes
pnpm --filter web-e2e run test:alpha:orchestrator -- --feature-set S1692

# 3. Verify:
# - Task counts are consistent between sandbox and overall progress
# - UI updates continuously (no hangs)
# - PTY log shows continuous output (no 60s stop)
# - Health check logs appear every 30s in orchestrator logs
# - No errors in browser console

# Check orchestrator logs for health check entries
grep -i "health.*check\|stall.*detection" .ai/alpha/logs/*.log
# Should see entries like: "[INFO] Health check: running=true, commands=1"

# Verify no PTY timeout errors
grep -i "timeout\|e2b.*error" .ai/alpha/logs/*.log
# Should see none related to PTY 60s timeout

# Build (ensure no compilation issues)
pnpm build

# Regression test (run existing orchestrator features)
pnpm --filter web-e2e test:alpha:orchestrator -- --sanity-check
```

**Expected Result**:

All commands succeed, bug is resolved, zero regressions. Task counts are consistent, UI updates continuously, health checks appear in logs.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression checks: verify feature execution still works
# 1. Run a simple feature (should complete in <5 minutes)
pnpm --filter web-e2e run test:alpha:orchestrator -- --feature S1692.I1.F1

# 2. Run a complex feature (should complete without hangs)
pnpm --filter web-e2e run test:alpha:orchestrator -- --feature-set S1692

# 3. Verify no new errors in logs
grep -i "error\|fatal\|panic" .ai/alpha/logs/*.log | wc -l
# Should be same count as before (or lower if bugs were causing errors)
```

## Dependencies

### New Dependencies

None required. All changes use existing E2B SDK methods:
- `sandbox.pty.create()` - Already used
- `sandbox.setTimeout()` - Already in E2B SDK
- `sandbox.isRunning()` - Already in E2B SDK
- `sandbox.commands.list()` - Already in E2B SDK
- `sandbox.commands.connect()` - Already in E2B SDK

**No npm packages to install**

### Existing Dependencies Used

- `e2b` SDK (already included)
- TypeScript (for type safety)
- Lodash utilities (if using in helpers, already included)

## Database Changes

**No database changes required**

All changes are in-memory execution and UI logic. No schema modifications, migrations, or data updates needed.

## Deployment Considerations

**Deployment Risk**: low

- No database migrations
- No environment variable changes required
- No breaking API changes
- Health monitoring is non-breaking enhancement
- Can be deployed to existing orchestrator infrastructure

**Special Deployment Steps**: None

**Feature Flags Needed**: Consider adding:
- `ORCHESTRATOR_PTY_HEALTH_CHECK_ENABLED` (default: true) - Can disable health monitoring if it causes issues
- `ORCHESTRATOR_MANIFEST_BASED_COUNTING` (default: true) - Can disable manifest-based task counting if regression occurs

**Backwards Compatibility**: Fully maintained

- Old orchestrator code can coexist with new health monitoring
- Task count changes are UI-only (no API changes)
- PTY configuration is backward compatible

## Success Criteria

The fix is complete when:

- [ ] E2B PTY created with `timeout: 0` configuration
- [ ] Sandbox timeout extended to 24 hours
- [ ] Health monitor implemented and integrated
- [ ] Health checks run every 30 seconds
- [ ] Stall detection triggers on missing health checks
- [ ] Reconnection logic implemented and tested
- [ ] Task counting uses manifest as source-of-truth
- [ ] UI task counts match manifest completion status
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] E2E orchestrator tests pass
- [ ] Manual testing checklist complete
- [ ] Zero regressions in feature execution
- [ ] PTY streams continue beyond 60-second mark
- [ ] UI progress updates continuously (no hangs)
- [ ] Code review approved
- [ ] Deployment completed without issues

## Notes

### Research Findings

The diagnosis phase included community research on E2B PTY issues:

- **E2B GitHub Issue #727**: "Certain commands not streaming full output" (OPEN) - Describes exactly the behavior we're fixing
- **E2B GitHub Issue #879**: "Timeout not honored" (OPEN) - Confirms timeout configuration issues
- **E2B SDK Limitation**: No built-in keepalive or health checks for PTY streams

The selected fix directly addresses these known limitations.

### Related Documentation

- **E2B Sandbox Guide**: `.ai/ai_docs/context-docs/infrastructure/e2b-sandbox.md`
- **Similar Issues**: None (this appears to be first orchestrator stability incident)
- **E2B Community**: Monitoring issues #727, #879, #921 for upstream fixes

### Implementation Priority

1. **Critical**: E2B PTY configuration (steps 1-2)
2. **High**: Task count fix (step 4)
3. **Medium**: Health monitoring integration (step 3)
4. **High**: Testing (step 5)
5. **Low**: Documentation (step 6)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1699*
