# Bug Diagnosis: Orchestrator UI Shows Stale Progress Data Due to Multiple Processes

**ID**: ISSUE-1490
**Created**: 2026-01-15T17:58:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator UI dashboard displays stale "Waiting for work... Blocked: #1371, #1372" status for all sandboxes even when work is actively being processed. This is caused by multiple orchestrator processes running simultaneously due to the `--force-unlock` flag bypassing lock protection, with the older process overwriting progress files with stale data.

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: development
- **Node Version**: v22.16.0
- **Platform**: Linux (WSL2)
- **Last Working**: N/A (design issue)

## Reproduction Steps

1. Start the Alpha Orchestrator with `--force-unlock` flag for spec #1362
2. While it's running, start another orchestrator instance with `--force-unlock` for the same spec
3. Observe that both processes run simultaneously
4. The UI shows stale data from the older process, displaying "Waiting for work..." even when sandboxes are actively working

## Expected Behavior

1. Only one orchestrator process should run per spec at a time
2. The `--force-unlock` flag should kill/replace the existing process, not run alongside it
3. The UI should display real-time progress from the active sandboxes

## Actual Behavior

1. Multiple orchestrator processes run simultaneously when `--force-unlock` is used
2. The older process continues writing to progress files with stale sandbox IDs
3. The UI displays confusing "Blocked: #1371, #1372" status (semantic inversion - these are features that ARE blocked, not blocking features)
4. Overall progress updates correctly, but sandbox columns show stale idle status

## Diagnostic Data

### Process State
```
# Two orchestrator processes running simultaneously:
PID 262019 - Started 11:37 (OLD) - Writing stale progress with sandbox IDs: iltp3mrk64jl3i4fdmul3
PID 426307 - Started 12:47 (NEW) - Actual work happening with sandbox IDs: i01arklt2wxsub2dsx11t
```

### Progress File Mismatch
```json
// sbx-a-progress.json (STALE - from OLD process)
{
  "sandbox_id": "iltp3mrk64jl3i4fdmul3",  // OLD sandbox ID
  "runId": "run-mkfo21rg-3b2j",            // OLD run ID
  "status": "idle",
  "blocked_by": [1371, 1372]
}

// spec-manifest.json (CURRENT)
{
  "sandbox_ids": ["i01arklt2wxsub2dsx11t", "iq6iii8efsxp6x4m11btg", "icijku5hxzt7e6abqfcx9"]
}
```

### After Killing Old Process
```json
// sbx-a-progress.json (CORRECT - from NEW process)
{
  "sandbox_id": "i01arklt2wxsub2dsx11t",  // CORRECT sandbox ID
  "runId": "run-mkfqru6m-gaxb",            // CORRECT run ID
  "status": "in_progress",
  "feature": {"issue_number": 1367, "title": "Dashboard Page & Grid Layout"},
  "completed_tasks": ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9"]
}
```

## Error Stack Traces

N/A - No errors thrown, this is a race condition / design issue.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/spec-orchestrator.ts` (lines 843-845: archive only called conditionally)
  - `.ai/alpha/scripts/lib/lock.ts` (lock acquisition with force-unlock)
  - `.ai/alpha/scripts/lib/progress.ts` (writeIdleProgress function)
  - `.ai/alpha/scripts/lib/work-queue.ts` (getBlockedFeatures returns features that ARE blocked)
  - `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` (lines 220-225: displays blocked_by)

- **Recent Changes**: Lock file mechanism added in previous issues (#1487, #1489)

- **Suspected Functions**:
  - `acquireLock()` in lock.ts - doesn't kill existing process when force-unlock used
  - `getBlockedFeatures()` in work-queue.ts - semantic naming issue
  - `writeIdleProgress()` in progress.ts - writes blocked_by with inverted semantics

## Related Issues & Context

### Direct Predecessors
- #1487 (CLOSED): "Orchestrator completion race condition" - Added lock mechanism
- #1489 (CLOSED): "Orchestrator async race condition fix" - Improved error handling

### Similar Symptoms
- #1486: "Orchestrator stall with assigned sandbox" - Related timing issues

### Historical Context
The lock mechanism was added to prevent race conditions, but the `--force-unlock` flag provides an escape hatch that doesn't properly handle existing processes.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `--force-unlock` flag releases the lock file but does NOT terminate the existing orchestrator process, allowing multiple processes to run simultaneously and overwrite each other's progress files.

**Detailed Explanation**:

1. **Lock Bypass Without Process Termination**: When `--force-unlock` is passed:
   - The lock file is deleted/overwritten
   - But the OLD orchestrator process continues running
   - Both processes now write to the same progress files

2. **Progress File Overwriting**: Each orchestrator has its own sandbox instances with unique IDs:
   - OLD process writes: `sandbox_id: "iltp3mrk64jl3i4fdmul3"` (stale)
   - NEW process writes: `sandbox_id: "i01arklt2wxsub2dsx11t"` (current)
   - Whichever writes LAST "wins" - OLD process was writing more frequently

3. **Semantic Inversion in UI**: Secondary issue - `getBlockedFeatures()` returns features that ARE blocked (have unsatisfied dependencies), but the UI displays "Blocked: #1371, #1372" which implies the sandbox is waiting FOR those features. This is backwards - #1371 and #1372 are themselves blocked on initiative #1363.

**Supporting Evidence**:
- Process list showed two orchestrator processes (PID 262019 and 426307)
- Progress files had sandbox IDs not matching current manifest
- After killing old process (262019), progress files immediately showed correct data
- Code reference: `lock.ts` - force-unlock only removes lock file, doesn't signal/kill existing process

### How This Causes the Observed Behavior

1. User starts orchestrator with `--force-unlock` (maybe after a crash)
2. Previous orchestrator process was still running (zombie or legitimately active)
3. New orchestrator acquires lock, creates NEW sandboxes with NEW IDs
4. Both processes enter work loop, both write to `sbx-*-progress.json` files
5. Old process has no work (sandboxes may be dead), writes "idle" status continuously
6. UI reads progress files, sees stale "idle" + "blocked by" data
7. Overall progress updates correctly (single manifest file), but sandbox columns show stale data

### Confidence Level

**Confidence**: High

**Reasoning**:
- Directly observed two processes running with `ps aux`
- Progress files contained OLD run ID and OLD sandbox IDs not matching manifest
- Killing old process immediately fixed the UI display
- Code inspection confirms `--force-unlock` only removes lock file, no process termination

## Fix Approach (High-Level)

### Primary Fix: Process Termination on Force-Unlock

When `--force-unlock` is used, the orchestrator should:
1. Read the existing lock file to get the PID of the running process
2. Send SIGTERM to that process (graceful shutdown)
3. Wait briefly for termination
4. Send SIGKILL if still running
5. Then acquire the new lock

```typescript
// In lock.ts acquireLock() when forceUnlock=true:
if (existingLock?.pid) {
  process.kill(existingLock.pid, 'SIGTERM');
  await sleep(2000);
  try { process.kill(existingLock.pid, 'SIGKILL'); } catch {}
}
```

### Secondary Fix: UI Semantic Clarity

Change the "Blocked: #1371, #1372" display to be more accurate:

Option A: Change label to "Features awaiting deps: #1371, #1372"
Option B: Show what's BLOCKING, not what IS blocked: "Waiting for: #1363 (initiative)"
Option C: Remove the confusing blocked_by display entirely when idle

### Tertiary Fix: Progress File Validation

Before writing to progress files, validate that the sandbox ID in the file matches the current instance:
```typescript
// In writeUIProgress/writeIdleProgress:
const existing = readExistingProgress(filePath);
if (existing?.runId && existing.runId !== instance.runId) {
  // Stale file from different run - safe to overwrite
  // Or: log warning about potential conflict
}
```

## Diagnosis Determination

The root cause has been definitively identified through direct observation and process analysis. The issue is a design gap in the `--force-unlock` mechanism that allows multiple orchestrator processes to run simultaneously, with the older process overwriting progress files with stale data.

The fix requires enhancing the lock acquisition to terminate existing processes when force-unlock is used, not just remove the lock file.

## Additional Context

- The `--force-unlock` flag is commonly used after crashes or when debugging, making this a likely scenario
- The UI correctly showed overall progress (5/110 tasks) because the manifest file is authoritative and only updated by one process at a time
- The sandbox-specific progress files are written independently by each process, causing the conflict

---
*Generated by Claude Debug Assistant*
*Tools Used: ps, cat, ls, Read, Bash, process inspection*
