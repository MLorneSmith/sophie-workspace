# Bug Diagnosis: Alpha orchestrator marks features completed from stale progress files, causing concurrent sandbox execution and partial task completion

**ID**: ISSUE-2062
**Created**: 2026-02-11T16:00:00Z
**Reporter**: user/system
**Severity**: critical
**Status**: new
**Type**: bug

## Summary

The Alpha orchestrator's `checkPTYFallbackRecovery()` in the work loop reads the sandbox progress file immediately after assigning a new feature, before `runFeatureImplementation()` has cleared the stale progress file from the previous feature. This causes the new feature to be incorrectly marked as "completed" based on the old feature's data, which cascades into: (1) the sandbox being freed and assigned yet another feature, creating multiple concurrent Claude processes on the same sandbox, (2) OOM kills (exit 137), (3) features marked "completed" with only 50-65% of tasks actually done, and (4) initiative-level dependencies being prematurely satisfied.

## Environment

- **Application Version**: dev branch (commit 97875b051)
- **Environment**: development (E2B sandboxes)
- **Node Version**: 22.x
- **Spec**: S2045 (user dashboard) with Sonnet model
- **Orchestrator**: `.ai/alpha/scripts/spec-orchestrator.ts`
- **Last Working**: Unknown (first run with Sonnet on post-refactoring code)

## Reproduction Steps

1. Run `tsx spec-orchestrator.ts 2045` with Sonnet as the model
2. Wait for Initiative I1 features (F1, F2) to complete
3. Observe that I1.F3 is assigned to sbx-a, and within 34 seconds, I2.F1 is also assigned to sbx-a
4. Observe interleaved PTY iteration logs from two features on the same sandbox
5. Observe features marked "completed" with incomplete tasks (80/97 total)

## Expected Behavior

- Each sandbox runs exactly ONE feature at a time
- Features are only marked "completed" when the current feature's progress file confirms completion
- Features with incomplete tasks are marked for retry, not completed
- Initiative dependencies are only satisfied when all constituent features genuinely complete

## Actual Behavior

- Multiple features run concurrently on the same sandbox
- Features are marked "completed" based on stale progress files from PREVIOUS features
- 80/97 tasks completed but all 14 features show "completed"
- OOM kills (exit 137) from concurrent Claude processes
- 3 sandbox restarts due to resource exhaustion

## Diagnostic Data

### Console Output

```
[sbx-a.log] Lines 86-131 show S2045.I1.F3 (14:28:03) and S2045.I2.F1 (14:28:36) running concurrently:

# Interleaved iteration lines from TWO features on same sandbox:
[PTY] Feature still running with recent heartbeat, continuing wait (iteration 1)
[PTY] Feature still running with recent heartbeat, continuing wait (iteration 1)  # Different feature!
[PTY] Feature still running with recent heartbeat, continuing wait (iteration 2)
[PTY] Feature still running with recent heartbeat, continuing wait (iteration 2)  # Different feature!
...13 pairs of interleaved iterations
```

### Timing Evidence

From spec-manifest.json `assigned_at` timestamps:

| Feature | Sandbox | Assigned At | Gap |
|---------|---------|-------------|-----|
| S2045.I1.F3 | sbx-a | 14:28:01 | - |
| S2045.I2.F1 | sbx-a | 14:28:35 | **34s** (concurrent!) |
| S2045.I2.F2 | sbx-b | 14:28:35 | - |
| S2045.I2.F3 | sbx-c | 14:28:35 | - |
| S2045.I3.F1 | sbx-b | 14:29:09 | **34s** (concurrent!) |
| S2045.I4.F1 | sbx-a | 14:41:40 | - |
| S2045.I4.F4 | sbx-a | 14:42:14 | **34s** (concurrent!) |

### Task Completion Evidence

| Feature | Tasks Done | Tasks Total | Pct | Status |
|---------|-----------|-------------|-----|--------|
| S2045.I1.F3 | 6 | 8 | 75% | completed |
| S2045.I3.F3 | 5 | 7 | 71% | completed |
| S2045.I3.F4 | 5 | 8 | 63% | completed |
| S2045.I4.F1 | 8 | 12 | 67% | completed |
| S2045.I4.F2 | 8 | 9 | 89% | completed |
| S2045.I4.F3 | 6 | 11 | 55% | completed |
| **Total** | **80** | **97** | **82%** | all "completed" |

### OOM Evidence

```
# S2045.I4.F1 on sbx-a (concurrent with S2045.I4.F4):
error: "Implementation error: exit status 137 (attempt 1/3)"
# Exit 137 = SIGKILL (OOM killer)
```

### BashTool Pre-flight Warnings

```
# Sonnet-specific: 40+ warnings across sbx-a.log
⚠️  [BashTool] Pre-flight check is taking longer than expected.
Run with ANTHROPIC_LOG=debug to check for failed or slow API requests.
```

## Error Stack Traces

No stack traces — the bug is a logical race condition, not a crash.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/work-loop.ts` (lines 448-501: mainLoop, lines 721-775: detectAndRecoverStuckTasks, lines 885-926: checkPTYFallbackRecovery)
  - `.ai/alpha/scripts/lib/feature.ts` (lines 209-241: progress file clear/init, lines 726-740: 50% completion threshold)
  - `.ai/alpha/scripts/lib/progress-file.ts` (no feature ID validation)
- **Recent Changes**: Issues #1955 (centralized transitions), #1956, #1957, #1959, #1961, #1962
- **Suspected Functions**: `checkPTYFallbackRecovery()`, `detectAndRecoverStuckTasks()`, `mainLoop()`

## Related Issues & Context

### Direct Predecessors
- #1767 (CLOSED): "PTY timeout with progress file fallback" — Introduced the `checkPTYFallbackRecovery` mechanism. The mechanism itself is correct but lacks a guard against stale progress files from previous features.
- #1786 (CLOSED): "stillRunning loop for healthy features" — Extended PTY recovery with a loop. Increased the window for the race condition.

### Related Infrastructure Issues
- #1955 (CLOSED): "Centralize feature status transitions" — The centralized transitions work correctly; the bug is upstream (wrong data fed into correct transitions).
- #1957 (CLOSED): "Runtime validation for progress file status" — Validates status strings but not feature identity.
- #1938 (CLOSED): "Completion validation" — Added the 50% threshold, which is too lenient.

### Same Component
- #1841 (CLOSED): "Promise timeout detection" — Another work loop recovery mechanism that doesn't have the stale-data vulnerability.
- #1782 (CLOSED): "Phantom completion recovery" — Uses `tasks_completed >= task_count` which is safe.
- #1858 (CLOSED): "Reset feature for retry on sandbox death" — Correct retry logic, not implicated.

### Historical Context

The `checkPTYFallbackRecovery` mechanism was introduced in #1767 to solve a real problem (PTY disconnects after completion). The stale progress file race was not present initially because features were assigned one-at-a-time. The batch assignment optimization (#1820) and the tight main loop timing made this race condition exploitable. Sonnet's slower execution amplifies the problem because every feature hits PTY timeout recovery.

## Root Cause Analysis

### Identified Root Cause

**Summary**: `checkPTYFallbackRecovery()` reads the sandbox progress file in the same event loop iteration as `assignWorkToIdleSandboxes()`, before the newly assigned feature has time to clear the stale progress file from the previous feature. This causes the new feature to be marked "completed" using the old feature's data.

**Detailed Explanation**:

The main loop in `work-loop.ts` (line 448) executes these steps sequentially within a single iteration:

1. **`assignWorkToIdleSandboxes()`** (line 466): Assigns Feature B to sandbox X. Sets `status = "busy"`. Starts `runFeatureWork()` as an async promise. The promise's first operation (`runFeatureImplementation`) begins with a git pull (network I/O), which yields control back to the event loop.

2. **`detectAndRecoverStuckTasks()`** (line 488): Iterates over all `in_progress` features. Finds Feature B (just assigned, status "in_progress", sandbox "busy"). Calls `checkPTYFallbackRecovery(FeatureB, sandboxX)`.

3. **`checkPTYFallbackRecovery()`** (line 885): Reads the progress file from sandbox X via `readProgressFile()`. At this point, Feature B's `runFeatureImplementation` is still in its git pull step — it hasn't executed the `rm -f .initiative-progress.json` (feature.ts line 213) or the progress file re-initialization (feature.ts line 222) yet. The progress file on disk still contains **Feature A's** data with `status: "completed"`.

4. The function checks `!isProgressFileStale(progressData)` — Feature A completed ~2-4 minutes ago, which is within the 5-minute staleness threshold, so this check **passes**.

5. The function checks `isFeatureCompleted(progressData)` — Feature A's progress file says `status: "completed"`, so this check **passes**.

6. **Feature B is incorrectly marked as "completed"**. The function sets `feature.tasks_completed`, transitions the feature to "completed" (cascading initiative status), and marks the sandbox as "ready".

7. The old promise for Feature B continues running in the background (untracked), while a NEW feature (C) is assigned to the now-"ready" sandbox.

8. **Two Claude Code processes now run on the same sandbox**, competing for CPU, RAM, and the progress file. This causes OOM kills (exit 137), corrupted progress data, and partial task completion.

**There is no feature ID in the progress file**, so there is no way to verify the progress file belongs to the current feature.

**Supporting Evidence**:
- sbx-a.log lines 106-130: Interleaved iteration logs from two features on the same sandbox
- spec-manifest.json: 34-second gaps between assignments to the same sandbox (14:28:01 → 14:28:35)
- spec-manifest.json: `exit status 137` (OOM kill) on features with concurrent execution
- spec-manifest.json: 80/97 tasks completed but all 14 features show "completed"
- Progress file: No `feature_id` field to validate ownership

### How This Causes the Observed Behavior

1. **"Multiple sandboxes seemed to hang"**: Two Claude processes compete for resources, each appearing to make slow progress
2. **"Unclear if successful"**: 80/97 tasks done, all features "completed" — partially complete with false success signals
3. **"BashTool Pre-flight" warnings**: Resource contention from concurrent processes plus Sonnet's inherent slowness
4. **OOM kills**: Two Claude Code + pnpm typecheck processes exceed 4GB RAM
5. **3 sandbox restarts**: Cascading resource exhaustion

### Confidence Level

**Confidence**: High

**Reasoning**: The interleaved log lines prove concurrent execution. The 34-second assignment gaps match the 30-second `HEALTH_CHECK_INTERVAL_MS` sleep. The race condition is mechanically reproducible from the code — `assignWorkToIdleSandboxes()` and `detectAndRecoverStuckTasks()` run in sequence within a single loop iteration with no time guard. The progress file lacks a feature ID field, making stale data indistinguishable from current data.

## Fix Approach (High-Level)

### Fix 1 (Critical): Add time-based guard to `checkPTYFallbackRecovery`

In `detectAndRecoverStuckTasks()`, skip features that were assigned less than 90 seconds ago. The progress file can't be trusted until the agent has had time to clear and re-initialize it:

```typescript
// In detectAndRecoverStuckTasks(), before checkPTYFallbackRecovery:
const assignedDuration = feature.assigned_at ? Date.now() - feature.assigned_at : 0;
if (assignedDuration < 90_000) continue; // 90s grace period
```

### Fix 2 (Critical): Add feature ID to progress file

Write the feature ID into the progress file during initialization in `runFeatureImplementation()`. Verify the feature ID matches in `checkPTYFallbackRecovery()`:

```typescript
// In feature.ts progress file init:
progress = { feature_id: feature.id, status: "in_progress", ... }

// In checkPTYFallbackRecovery:
if (progressResult.data.feature_id !== feature.id) return false;
```

### Fix 3 (Medium): Raise completion threshold from 50% to 80%

The 50% threshold in feature.ts line 726 is too lenient. Raise to 80% to prevent partially completed features from being marked as done:

```typescript
const completionThreshold = Math.ceil(feature.task_count * 0.8);
```

### Fix 4 (Low): Prevent activeWork overwrite

In `assignWorkToIdleSandboxes()`, check that the sandbox doesn't already have an entry in `activeWork` before assigning:

```typescript
if (this.activeWork.has(instance.label)) continue;
```

## Diagnosis Determination

The root cause is a race condition between `assignWorkToIdleSandboxes()` and `detectAndRecoverStuckTasks()` in the main work loop. The `checkPTYFallbackRecovery()` function reads stale progress files from previous features and incorrectly marks newly assigned features as completed. This cascades into concurrent sandbox execution, OOM kills, and partial task completion. The bug is exacerbated by Sonnet's slower execution speed (every feature hits PTY timeout recovery) but is fundamentally a code-level race condition that exists regardless of model choice.

## Additional Context

- **Model-specific impact**: Sonnet is significantly slower than Opus in E2B sandboxes, manifesting as frequent "BashTool Pre-flight check" warnings and every feature entering the PTY timeout recovery path. With Opus, features complete faster and the race condition window is smaller.
- **Spec design**: S2045 has 4 initiatives, 14 features, and 97 tasks — within the recommended limits (max 10 features per phase, max 12 tasks per feature). The spec design is not a contributing factor.
- **Post-refactoring**: The centralized transitions (#1955) and status validation (#1957) work correctly. The bug is upstream of the transitions — wrong data is fed into correct code.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (spec-manifest.json, logs, progress files, source code), Bash (ls, gh issue view), Grep (function searches), Glob (file discovery)*
