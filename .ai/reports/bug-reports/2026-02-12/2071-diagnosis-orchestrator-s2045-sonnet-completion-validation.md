# Bug Diagnosis: S2045 Sonnet Run — Completion Validation False Negative Causes Feature Re-execution and Sandbox Timeout

**ID**: ISSUE-2071
**Created**: 2026-02-12T17:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The S2045 orchestrator run with Sonnet completed 13/14 features but failed on the final feature (I4.F4) due to sandbox timeout. Root cause: the completion validation logic (feature.ts:910-930) rejects legitimately completed features when all tasks were "already implemented" by prior work, causing the same feature (I4.F3) to be re-executed 4 times across 3 sandboxes, wasting ~20 minutes and pushing the sandbox past its 60-minute E2B lifetime.

## Environment

- **Application Version**: dev branch, commit 07d998cd9
- **Environment**: development (local orchestrator + E2B sandboxes)
- **Node Version**: v22.x
- **Agent Model**: claude-sonnet-4-5 via Claude Code
- **Provider**: claude (OAuth/Max plan)
- **E2B Sandbox Timeout**: 60 minutes
- **Sandboxes**: 3 (sbx-a, sbx-b, sbx-c)
- **Spec**: S2045 (user dashboard) — 4 initiatives, 14 features, 97 tasks
- **Run ID**: run-mljmfr97-mf1y

## Reproduction Steps

1. Run `tsx spec-orchestrator.ts 2045` with 3 sandboxes
2. Wait for all Initiative 1-3 features to complete (~40 minutes)
3. Initiative 4 features start — F1 and F2 are assigned to sbx-a and sbx-b
4. F3 (Loading Skeletons & Suspense Boundaries) is assigned to sbx-c
5. **F3's tasks were already implemented** by prior I1-I3 work
6. Sonnet agent reports "completed" but with 0 newly-executed tasks in progress file
7. Orchestrator's 80% completion threshold rejects the completion → resets F3 to "pending"
8. F3 is re-assigned to sbx-b, then sbx-a (twice) — 4 total executions
9. Each execution reports the same: "all tasks already done"
10. F3 is finally accepted on the 4th attempt
11. By the time F4 starts, sbx-a has been alive 55 minutes
12. E2B kills the sandbox at 60 minutes → F4 fails after 3 retries

## Expected Behavior

- I4.F3 should be executed once, recognized as "already completed," and marked completed
- I4.F4 should have ample time to execute on a fresh sandbox
- All 14 features should complete successfully

## Actual Behavior

- I4.F3 executed 4 times (3 sandboxes, sbx-a ran it twice)
- I4.F4 failed: "Sandbox is probably not running anymore - max retries (3) exceeded"
- 13/14 features completed, status: "partial"
- Review sandbox creation failed: "exit status 1"
- Task count corruption: I4.F4 shows tasks_completed: 11 with task_count: 7

## Diagnostic Data

### Feature Execution Timeline

```
15:38 - sbx-a: I1.F1 (5 tasks, completed)
15:38 - sbx-b: I1.F2 (4 tasks, completed)
15:49 - sbx-a: I1.F3 (8 tasks, completed)
15:49 - sbx-b: I3.F2 (4 tasks, completed)
16:00 - sbx-a: I2.F1 (6 tasks, completed)
16:00 - sbx-b: I2.F2 (5 tasks, completed)
16:00 - sbx-c: I2.F3 (6 tasks, completed)        ← sbx-c first feature
16:04 - sbx-b: I3.F1 (5 tasks, completed)
16:06 - sbx-c: I3.F3 (7 tasks, completed)
16:07 - sbx-a: I3.F4 (8 tasks, completed)
16:15 - sbx-a: I4.F1 (12 tasks, completed)
16:15 - sbx-b: I4.F2 (9 tasks, completed)
16:15 - sbx-c: I4.F3 ← FIRST execution (all tasks already done)
16:24 - sbx-b: I4.F3 ← DUPLICATE #2 (already done)
16:26 - sbx-a: I4.F3 ← DUPLICATE #3 (already done)
16:29 - sbx-a: I4.F3 ← DUPLICATE #4 (finally accepted)
16:33 - sbx-a: I4.F4 ← Starts with only 7 minutes of sandbox life left
16:38 - sbx-a: SANDBOX DIES (60-minute E2B limit)
```

### I4.F3 Quad-Execution Evidence (from logs)

```
sbx-c (16:15:14): "Status: Already completed - All 11 tasks were implemented in prior commits"
sbx-b (16:24:52): "Status: Already completed - All 11 tasks were implemented in prior commits"
sbx-a (16:26:43): "Status: COMPLETED - All 11 tasks already implemented"
sbx-a (16:29:44): "Status: COMPLETE - All 11 tasks already implemented by prior initiatives"
```

All 4 executions found the same thing: every task was already done.

### I4.F4 Failure (from spec-manifest.json)

```json
{
  "id": "S2045.I4.F4",
  "status": "failed",
  "task_count": 7,
  "tasks_completed": 11,
  "error": "Implementation error: Sandbox is probably not running anymore - max retries (3) exceeded",
  "retry_count": 3
}
```

### Task Count Corruption

```
I4.F4: tasks_completed=11, task_count=7 (impossible: 11 > 7)
Overall: 97/97 tasks (capped) but only 13/14 features
```

### Review Sandbox Failure

```
review_error: "exit status 1"
completion_status: "failed"
```

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/feature.ts` (lines 910-930: completion validation)
  - `.ai/alpha/scripts/lib/manifest.ts` (lines 935-970: syncSandboxProgressToManifest)
  - `.ai/alpha/scripts/lib/work-queue.ts` (getNextAvailableFeature)
  - `.ai/alpha/scripts/lib/work-loop.ts` (assignWorkToIdleSandboxes)
- **Recent Changes**: Commits 07d998cd9 through 9e959627e (7 orchestrator fixes in 2 days)
- **Suspected Functions**:
  - `feature.ts:runFeatureImplementation()` — completion threshold validation
  - `manifest.ts:syncSandboxProgressToManifest()` — missing feature_id check

## Related Issues & Context

### Direct Predecessors
- #2060 (OPEN): "Bug Fix: Alpha Orchestrator False Completion with GPT -- Raise Threshold to 80% + Task Audit" — The 80% threshold was introduced to prevent false completions with GPT. It now causes false rejections of legitimate completions with Sonnet.
- #2063 (CLOSED): "Bug Fix: Alpha orchestrator stale progress file race" — Added 3-layer defense including feature_id validation, but only in `checkPTYFallbackRecovery()`, not in `syncSandboxProgressToManifest()`.

### Related Infrastructure Issues
- #2070 (CLOSED): "Bug Fix: S2045 GPT orchestrator cascade failure" — Same spec, GPT provider, 6 compounding issues
- #2069 (CLOSED): "Bug Diagnosis: S2045 GPT orchestrator cascade failure" — Diagnosed 6 issues
- #2068 (OPEN): "Orchestrator Zod validation rejects null progress fields"
- #2066 (CLOSED): "Add Zod runtime validation at orchestrator I/O boundaries"

### Similar Symptoms
- #2064 (CLOSED): "Alpha orchestrator infinite retry loop" — Features retrying indefinitely (similar symptom)
- #1938: Feature completion without evidence (the fix that introduced the 80% threshold)
- #1952: GPT agent "blocked" status bug (status validation pattern)

### Same Component
- #1955 (CLOSED): "Centralize feature status transitions" — `completed: []` terminal state
- #1782: Phantom completion detection
- #1786: Event-driven architecture refactor (still not implemented)

### Historical Context

The orchestrator has accumulated 30+ bug fixes since January 2026 (15/20 recent commits are orchestrator-related). Each fix addresses a specific edge case but introduces new interactions:
- #1938 added "require evidence for completion" → prevented false completions
- #2060 raised threshold from 50% to 80% → made the evidence requirement stricter
- The stricter threshold now rejects valid completions for "already done" features
- This is a classic "fix one edge, break another" pattern in the shared mutable state architecture

## Root Cause Analysis

### Identified Root Cause

**Summary**: The 80% completion threshold validation in `feature.ts:910-930` rejects features that are legitimately completed when all tasks were already implemented by prior work, because the agent reports 0 newly-executed tasks in the progress file even though the feature is done.

**Detailed Explanation**:

When the `/alpha:implement` command runs on a feature where all tasks were already implemented by prior initiatives, the Sonnet agent:
1. Validates each task exists and is correct
2. Reports `status: "completed"` in the progress file
3. Reports `completed_tasks: []` (empty) because no tasks were *newly executed*

The orchestrator reads this and hits the completion validation at `feature.ts:910-930`:

```typescript
const completionThreshold = Math.ceil(feature.task_count * 0.8);
// For I4.F3: Math.ceil(11 * 0.8) = 9

if (status === "completed" && tasksCompleted < completionThreshold) {
    // 0 < 9 → enters this block
    if (progressFileStatus === "completed" && tasksCompleted === 0) {
        status = "pending"; // FALSE NEGATIVE: feature is actually done
    }
}
```

This transitions the feature from "completed" back to "pending", which:
- Clears `assigned_sandbox` (via `transitionFeatureStatus` side effects)
- Makes the feature available in the work queue again
- Another idle sandbox picks it up → same result → cycle repeats

### Secondary Issue: Stale Progress File Cross-Pollination

`syncSandboxProgressToManifest()` in `manifest.ts:935-970` doesn't validate the `feature_id` field in the local progress file. When sbx-a switches from I4.F3 (11 tasks) to I4.F4 (7 tasks), there's a window where the local progress file still has I4.F3's data. The sync function applies 11 completed tasks to I4.F4, creating the impossible `tasks_completed: 11 > task_count: 7` state.

### Tertiary Issue: Sandbox Lifetime Exhaustion

The 4 redundant I4.F3 executions consumed ~20 minutes. sbx-a started at 15:38 and hit the 60-minute E2B limit at ~16:38, just 5 minutes after starting I4.F4. The sandbox died and all 3 retries failed on the dead sandbox.

**Supporting Evidence**:
- Log files: All 4 I4.F3 executions report "all tasks already implemented"
- Manifest: I4.F3 `assigned_sandbox: "sbx-a"`, `assigned_at: 1770913783379` (the 3rd assignment)
- Manifest: I4.F4 `tasks_completed: 11`, `task_count: 7` (impossible)
- Manifest: I4.F4 `error: "Sandbox is probably not running anymore - max retries (3) exceeded"`
- Code: `feature.ts:917` — `progressFileStatus === "completed" && tasksCompleted === 0` → sets "pending"

### How This Causes the Observed Behavior

1. I4.F3 completes on sbx-c → validation rejects → status reset to "pending"
2. sbx-b (now idle) picks up I4.F3 → same rejection → "pending" again
3. sbx-a picks up I4.F3 → same → "pending"
4. sbx-a picks up I4.F3 again → this time accepted (possibly different progress file state)
5. I4.F4 finally starts on sbx-a with only ~7 minutes of sandbox life remaining
6. E2B kills sandbox → F4 fails → 13/14 features → "partial" status
7. Completion phase tries review sandbox → also fails → no dev server for review

### Confidence Level

**Confidence**: High

**Reasoning**: The code path is deterministic. For any feature where all tasks are already done and the agent writes `completed_tasks: []`, the 80% threshold at `feature.ts:910-930` will ALWAYS downgrade "completed" to "pending". This is reproducible for any spec where later features overlap with earlier features' work.

## Fix Approach (High-Level)

### Fix 1: Completion validation — trust "already done" features (Critical, ~1 hour)

Modify `feature.ts:910-930` to handle the "all tasks already implemented" case. Options:
- **Option A**: If progress file says "completed" and the agent output contains "already implemented/completed", trust it
- **Option B**: Have `/alpha:implement` populate `completed_tasks` with task IDs even for verified-not-newly-executed tasks
- **Option C**: Add a separate `verified_tasks` field in the progress file that counts verified (not executed) tasks toward the threshold

Recommendation: **Option B** is simplest and most robust — the implement command should always list task IDs in completed_tasks whether tasks were freshly executed or just verified.

### Fix 2: Feature ID validation in syncSandboxProgressToManifest (Medium, ~30 min)

Add feature_id check in `manifest.ts:syncSandboxProgressToManifest()` to prevent stale progress data from being attributed to the wrong feature. The `checkPTYFallbackRecovery()` already has this check (#2063); replicate it here.

### Fix 3: Sandbox time budget awareness (Low priority, ~2 hours)

Before assigning a feature, check remaining sandbox lifetime. If <10 minutes remain, skip assignment and trigger a sandbox restart. This prevents the "start a feature that can't finish" scenario.

## Broader Assessment: Orchestrator Health

### Pattern: Defensive Fix Cascade

The orchestrator has entered a **defensive fix cascade** where each bug fix creates more restrictive validation that eventually causes false negatives:

| Fix | Problem Solved | New Problem Created |
|-----|---------------|-------------------|
| #1938 | False completions (exit code 0 but no work) | Introduced "evidence required" check |
| #2060 | GPT false completions at 50% | Raised to 80% threshold |
| This bug | — | 80% threshold rejects valid "already done" features |

### Architecture Concerns

1. **Shared mutable JSON state** (spec-manifest.json) remains the fundamental weakness. Multiple code paths read/write it without coordination. The centralized transitions (#1955) helped but couldn't fully solve the problem because progress data flows through 3 separate channels: sandbox progress files → local progress files → manifest.

2. **3 separate progress tracking systems** create race windows:
   - Sandbox progress file (on E2B, written by agent)
   - Local progress files (on orchestrator machine, polled from sandbox)
   - Manifest feature entries (in-memory + disk, synced from local files)

3. **Recovery mechanisms fight each other**: `checkPTYFallbackRecovery()` can mark a feature "completed" while `syncSandboxProgressToManifest()` applies stale data. The 3-layer defense from #2063 protects one path but not the other.

### Is Something Fundamentally Wrong?

**Qualified yes.** The core architecture (shared mutable JSON + multiple async recovery paths) creates an ever-expanding surface area for race conditions. Each fix patches one race but the interaction space grows combinatorially. However, the S2045 Sonnet run was remarkably close to success (13/14 features in ~58 minutes), which suggests the architecture is *workable* with targeted fixes. The specific fix needed here (Option B above) is small and well-defined.

The more fundamental issue is that the orchestrator needs a **spec design guardrail** for overlapping features. I4.F3 (Loading Skeletons & Suspense Boundaries) was entirely redundant because I1-I3 already implemented all its tasks. The spec decomposition should detect and remove such features, or at minimum flag them as `verify_only: true` so the orchestrator can handle them differently.

## Diagnosis Determination

Root cause identified with high confidence. Three compounding issues:
1. **Primary**: Completion validation false negative for "already done" features (feature.ts:910-930)
2. **Secondary**: Missing feature_id validation in syncSandboxProgressToManifest (manifest.ts:960-964)
3. **Tertiary**: Sandbox lifetime exhaustion from redundant executions

The primary fix is straightforward: have `/alpha:implement` always populate completed_tasks (even for verified tasks), or relax the validation when the agent explicitly reports "already completed." The secondary fix adds a 1-line feature_id check. The tertiary issue resolves itself once the primary fix eliminates redundant executions.

### Spec Design Recommendation

For future specs, the feature decomposition step should:
1. **Detect overlapping features**: If a later feature's tasks are a subset of earlier features' outputs, flag it
2. **Add `verify_only: true`** to features that exist purely for validation/polish of prior work
3. **Avoid features whose tasks duplicate earlier features** — merge them instead

## Additional Context

- This is the SECOND S2045 orchestrator run. The first (GPT, #2069/#2070) failed at 1/14 features due to 6 compounding issues
- The Sonnet run was dramatically more successful (13/14 vs 1/14), validating Sonnet as the better model for this workflow
- 3 open orchestrator issues remain: #2068 (Zod null fields), #2065 (UI truncate crash), #2060 (80% threshold — directly related to this diagnosis)
- The #2060 issue should be updated to note that the 80% threshold creates false negatives, not just false positives

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (git log, gh issue list), Task (Explore agent, Bash agent)*
