# Refactoring Analysis: Alpha Orchestrator Event-Driven Architecture

**Generated**: 2026-01-23
**Target**: `.ai/alpha/scripts/lib/` (orchestrator modules)
**Analyst**: Claude Refactoring Specialist

## Executive Summary

The Alpha Orchestrator has accumulated **42+ stability-related issues** in 8 days (Jan 16-23, 2026), revealing a fundamental architectural problem: **6 competing detection systems** operate independently without coordination, leading to cascading failures and "whack-a-mole" bug fixing.

This analysis recommends a complete architectural refactoring from the current polling/timeout-based approach to an **event-driven architecture** with:
- Progress file heartbeats as the **single source of truth**
- A **unified state machine** with explicit transitions
- **Explicit process cleanup** before retries
- Elimination of competing detection systems

## Target Overview

| Attribute | Value |
|-----------|-------|
| **Primary Files** | `orchestrator.ts` (2186 lines), `feature.ts` (804 lines), `pty-wrapper.ts` (251 lines), `progress.ts` (492 lines), `work-queue.ts` (538 lines), `health.ts` (346 lines), `startup-monitor.ts` (260 lines), `sandbox.ts` (934 lines) |
| **Total Lines** | ~5,800+ lines across 8 core modules |
| **Risk Level** | **CRITICAL** - Core orchestration infrastructure |
| **Complexity** | **HIGH** - Distributed state across multiple systems |

## Root Cause Analysis

### The Core Problem: 6 Competing Detection Systems

The orchestrator has evolved through incremental fixes, resulting in 6 independent detection/monitoring systems that don't coordinate:

| System | Location | Timeout | Purpose | Conflict |
|--------|----------|---------|---------|----------|
| **Startup Hang** | `startup-monitor.ts`, `feature.ts:309-353` | 60s | Detect Claude CLI hung on startup | Triggers kill + retry while PTY is still working |
| **PTY Wait Timeout** | `pty-wrapper.ts:132-167` | 30s | Detect PTY disconnection | 30s incompatible with features taking minutes/hours |
| **Stall Detection** | `progress.ts:440-491`, `feature.ts:277-291` | 5 min | Detect no heartbeat progress | Fires during normal operation gaps |
| **Progress Polling** | `progress.ts:306-421` | 5s interval | Poll sandbox for progress updates | Can write stale data after feature completion |
| **Deadlock Detection** | `work-queue.ts:388-446`, `orchestrator.ts:403-618` | N/A | Detect queue blocked by failed features | Recovery triggers retries without cleanup |
| **Phantom Completion** | `work-queue.ts:509-537`, `orchestrator.ts:1285-1358` | N/A | Detect tasks done but status not updated | Duplicates PTY fallback functionality |

### Evidence of Cascading Failures

From the analyzed log files, the failure cascade follows this pattern:

```
1. PTY timeout fires after 30s (PTY_WAIT_TIMEOUT_MS = 30000)
   ↓
2. Progress file check finds status: "in_progress"
   ↓
3. PTYTimeoutError thrown: "Feature status is in_progress - not completed"
   ↓
4. Feature marked as failed, sandbox marked as ready
   ↓
5. Retry logic creates NEW Claude Code process without killing old one
   ↓
6. PIDs accumulate: 610 → 1234 → 3456 → 7890 → 9438 (13 retries)
   ↓
7. Sandbox hits resource limits: "deadline_exceeded"
   ↓
8. UI hangs showing stale progress data
```

### Conflicting Timeout Values

| Constant | Value | Source | Problem |
|----------|-------|--------|---------|
| `PTY_WAIT_TIMEOUT_MS` | 30s | `constants.ts:171` | Way too short for feature execution |
| `FEATURE_TIMEOUT_MS` | 30 min | `constants.ts:100` | 60x longer than PTY timeout |
| `STARTUP_TIMEOUT_MS` | 60s | `constants.ts:138` | 2x the PTY timeout |
| `STALL_TIMEOUT_MS` | 5 min | `constants.ts:29` | Different from all others |
| `HEALTH_CHECK_INTERVAL_MS` | 30s | `constants.ts:71` | Matches PTY timeout |

## Current Architecture Issues

### Issue 1: Distributed State with No Consistency

State is scattered across 4+ locations with no synchronization:

```typescript
// Location 1: Local manifest file
manifest.feature_queue[n].status  // "pending" | "in_progress" | "completed" | "failed"

// Location 2: Sandbox progress file
.initiative-progress.json { status, last_heartbeat, completed_tasks }

// Location 3: SandboxInstance object
instance.status  // "ready" | "busy" | "completed" | "failed"
instance.currentFeature
instance.featureStartedAt
instance.lastHeartbeat

// Location 4: PTY stream state
ptyHandle.pid (may be stale)
capturedStdout (local buffer)
```

### Issue 2: No Clear State Machine

The current code has implicit states with ambiguous transitions:

```typescript
// feature.ts - 15+ different status combinations possible
if (feature.status === "in_progress" && feature.error) {
  // What state is this? Partially failed? Retrying?
}

// orchestrator.ts - status can change in multiple places
instance.status = "busy";  // Set in work loop
// ... later in feature.ts ...
instance.status = "ready";  // Set after completion
// ... but also in health.ts ...
instance.status = "failed";  // Set on health check failure
```

### Issue 3: Race Conditions in Retry Logic

```typescript
// pty-wrapper.ts:231-238 - The root cause of zombie processes
// Case 4: Feature is still in progress - genuinely stuck
ptyTelemetry.recoveryFailed++;
throw new PTYTimeoutError(
  sandboxId,
  progressData,
  timeoutMs,
  `Feature status is "${progressData.status}" - not completed`  // BUG: in_progress != stuck
);
```

The code incorrectly assumes `status: "in_progress"` means "genuinely stuck" when it actually means "working normally."

### Issue 4: No Process Cleanup Before Retry

```typescript
// feature.ts:549-567 - Retry loop doesn't kill old process
} catch (retryError) {
  if (startupHangDetected && attemptNumber < MAX_STARTUP_RETRIES) {
    // BUG: No killClaudeProcess() call before retry
    const retryDelay = getRetryDelay(attemptNumber);
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
    continue; // Retry WITHOUT killing old process
  }
}
```

## Proposed Architecture: Event-Driven State Machine

### Core Design Principles

1. **Single Source of Truth**: Progress file heartbeat is the ONLY source of feature state
2. **Explicit State Machine**: Clear states with explicit transitions and guards
3. **Event-Driven Updates**: React to heartbeat changes, not polling timeouts
4. **Atomic State Transitions**: No partial updates possible
5. **Cleanup Before Retry**: Always kill processes before creating new ones

### State Machine Definition

```typescript
// New: orchestrator-state-machine.ts

export type FeatureState =
  | "queued"        // In queue, not yet assigned
  | "assigning"     // Being assigned to sandbox (atomic)
  | "initializing"  // Sandbox preparing, Claude CLI starting
  | "executing"     // Claude CLI running, heartbeats active
  | "completing"    // Tasks done, waiting for final commit
  | "completed"     // Successfully finished
  | "failed"        // Failed with error
  | "retrying";     // Cleaning up for retry

export type StateTransition = {
  from: FeatureState[];
  to: FeatureState;
  guard: (context: FeatureContext) => boolean;
  action: (context: FeatureContext) => Promise<void>;
};

export const STATE_TRANSITIONS: StateTransition[] = [
  {
    from: ["queued"],
    to: "assigning",
    guard: (ctx) => ctx.sandbox.status === "idle" && ctx.dependencies.allCompleted,
    action: async (ctx) => { /* atomic assignment */ }
  },
  {
    from: ["assigning"],
    to: "initializing",
    guard: (ctx) => ctx.sandbox.assigned && ctx.progressFile.exists,
    action: async (ctx) => { /* start Claude CLI */ }
  },
  {
    from: ["initializing"],
    to: "executing",
    guard: (ctx) => ctx.heartbeat.isRecent && ctx.heartbeat.tasksStarted,
    action: async (ctx) => { /* update UI */ }
  },
  {
    from: ["executing"],
    to: "completing",
    guard: (ctx) => ctx.heartbeat.status === "completed",
    action: async (ctx) => { /* push commits */ }
  },
  {
    from: ["completing"],
    to: "completed",
    guard: (ctx) => ctx.gitPush.success,
    action: async (ctx) => { /* update manifest, unblock dependents */ }
  },
  {
    from: ["initializing", "executing"],
    to: "retrying",
    guard: (ctx) => ctx.heartbeat.isStale || ctx.error,
    action: async (ctx) => {
      await ctx.killClaude();  // CRITICAL: Always cleanup first
      await ctx.clearProgressFile();
    }
  },
  {
    from: ["retrying"],
    to: "queued",
    guard: (ctx) => ctx.retryCount < MAX_RETRIES && ctx.processKilled,
    action: async (ctx) => { /* reset for retry */ }
  },
  {
    from: ["retrying"],
    to: "failed",
    guard: (ctx) => ctx.retryCount >= MAX_RETRIES,
    action: async (ctx) => { /* mark as permanently failed */ }
  }
];
```

### Heartbeat-Based Monitoring (Single System)

Replace all 6 detection systems with ONE heartbeat monitor:

```typescript
// New: heartbeat-monitor.ts

export interface HeartbeatConfig {
  /** How often to check heartbeat (ms) */
  checkInterval: 5000;

  /** Max age of heartbeat before considering stale (ms) */
  staleThreshold: 60000;  // 60 seconds

  /** Grace period for startup (no heartbeat expected) */
  startupGracePeriod: 30000;  // 30 seconds

  /** Number of stale heartbeats before triggering recovery */
  staleCountThreshold: 3;
}

export class HeartbeatMonitor {
  private staleCount = 0;

  async checkHeartbeat(sandbox: Sandbox): Promise<HeartbeatStatus> {
    const progress = await readProgressFile(sandbox);

    if (!progress.success) {
      return { status: "unavailable", reason: "progress file missing" };
    }

    const heartbeatAge = Date.now() - new Date(progress.data.last_heartbeat).getTime();

    if (heartbeatAge < this.config.staleThreshold) {
      this.staleCount = 0;  // Reset on valid heartbeat
      return {
        status: "healthy",
        heartbeatAge,
        featureStatus: progress.data.status,
        tasksCompleted: progress.data.completed_tasks?.length ?? 0
      };
    }

    this.staleCount++;

    if (this.staleCount >= this.config.staleCountThreshold) {
      return {
        status: "stale",
        heartbeatAge,
        staleCount: this.staleCount,
        needsRecovery: true
      };
    }

    return { status: "warning", heartbeatAge, staleCount: this.staleCount };
  }
}
```

### Atomic Recovery with Cleanup

```typescript
// New: recovery-manager.ts

export class RecoveryManager {
  async recoverFeature(
    feature: FeatureEntry,
    sandbox: SandboxInstance,
    manifest: SpecManifest
  ): Promise<RecoveryResult> {

    // STEP 1: Always kill existing processes FIRST
    await this.killAllClaudeProcesses(sandbox);

    // STEP 2: Wait for processes to fully terminate
    await this.waitForProcessTermination(sandbox);

    // STEP 3: Clear stale progress file
    await this.clearProgressFile(sandbox);

    // STEP 4: Reset feature state atomically
    await this.resetFeatureState(feature, manifest);

    // STEP 5: Check retry count
    if (feature.retry_count >= MAX_RETRIES) {
      return { success: false, reason: "max_retries_exceeded" };
    }

    // STEP 6: Queue for reassignment
    feature.status = "queued";
    feature.retry_count = (feature.retry_count ?? 0) + 1;
    await saveManifest(manifest);

    return { success: true, willRetry: true };
  }

  private async killAllClaudeProcesses(sandbox: SandboxInstance): Promise<void> {
    // Kill by name, not PID (catches all instances)
    await sandbox.commands.run(
      "pkill -9 -f 'claude|run-claude' 2>/dev/null || true",
      { timeoutMs: 10000 }
    );

    // Also kill any stuck node processes
    await sandbox.commands.run(
      "pkill -9 -f 'node.*claude' 2>/dev/null || true",
      { timeoutMs: 10000 }
    );
  }

  private async waitForProcessTermination(sandbox: SandboxInstance): Promise<void> {
    // Wait up to 10 seconds for processes to terminate
    for (let i = 0; i < 10; i++) {
      const result = await sandbox.commands.run(
        "pgrep -f 'claude|run-claude' | wc -l",
        { timeoutMs: 5000 }
      );

      if (parseInt(result.stdout.trim()) === 0) {
        return;  // All processes terminated
      }

      await sleep(1000);
    }

    // Force kill any remaining processes
    await sandbox.commands.run(
      "pkill -9 -f 'claude|run-claude' 2>/dev/null || true",
      { timeoutMs: 5000 }
    );
  }
}
```

## Implementation Plan

### Phase 1: Immediate Stabilization (Critical - Do First)

**Priority**: CRITICAL
**Risk**: MEDIUM (targeted fix to root cause)

#### Task 1.1: Fix PTY Timeout Misinterpretation

Fix the immediate bug causing cascading failures:

**File**: `.ai/alpha/scripts/lib/pty-wrapper.ts`

```typescript
// BEFORE (line 231-238):
// Case 4: Feature is still in progress - genuinely stuck
ptyTelemetry.recoveryFailed++;
throw new PTYTimeoutError(
  sandboxId,
  progressData,
  timeoutMs,
  `Feature status is "${progressData.status}" - not completed`
);

// AFTER:
// Case 4: Feature is still in progress with recent heartbeat - NOT stuck, extend wait
if (!isProgressFileStale(progressData)) {
  // Heartbeat is recent - Claude is still working, don't interrupt
  return {
    exitCode: -1,  // Signal "still running"
    normalCompletion: false,
    recoveredViaProgressFile: false,
    progressData,
    stillRunning: true
  };
}

// Only throw if heartbeat is actually stale (>5 minutes old)
ptyTelemetry.recoveryFailed++;
throw new PTYTimeoutError(
  sandboxId,
  progressData,
  timeoutMs,
  `Feature appears stuck: heartbeat is ${getHeartbeatAge(progressData)}s old`
);
```

#### Task 1.2: Add Process Cleanup Before Retry

**File**: `.ai/alpha/scripts/lib/feature.ts`

```typescript
// BEFORE (line 549-567):
} catch (retryError) {
  if (startupHangDetected && attemptNumber < MAX_STARTUP_RETRIES) {
    const retryDelay = getRetryDelay(attemptNumber);
    if (retryDelay !== null) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
    continue; // Retry
  }
}

// AFTER:
} catch (retryError) {
  if (startupHangDetected && attemptNumber < MAX_STARTUP_RETRIES) {
    // CRITICAL: Kill ALL Claude processes before retry
    log(`   │   🔪 Killing Claude processes before retry...`);
    await killAllClaudeProcesses(instance.sandbox);
    await clearProgressFile(instance.sandbox);

    const retryDelay = getRetryDelay(attemptNumber);
    if (retryDelay !== null) {
      log(`   │   ⏳ Waiting ${retryDelay / 1000}s before retry...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
    continue; // Retry with clean slate
  }
}
```

### Phase 2: State Machine Foundation (High Priority)

**Priority**: HIGH
**Risk**: MEDIUM (new module, doesn't break existing code)

#### Task 2.1: Create State Machine Module

Create new file: `.ai/alpha/scripts/lib/state-machine.ts`

- Define `FeatureState` type with all valid states
- Define `StateTransition` interface with guards and actions
- Create `StateMachine` class with transition validation
- Add logging for all state transitions
- Add metrics for state transition timing

#### Task 2.2: Create Heartbeat Monitor Module

Create new file: `.ai/alpha/scripts/lib/heartbeat-monitor.ts`

- Replace 6 detection systems with ONE heartbeat monitor
- Configure stale threshold, check interval, grace periods
- Add `HeartbeatStatus` type with health information
- Implement stale count tracking before triggering recovery

#### Task 2.3: Create Recovery Manager Module

Create new file: `.ai/alpha/scripts/lib/recovery-manager.ts`

- Implement atomic recovery sequence (kill → wait → clear → reset)
- Add `waitForProcessTermination` with timeout
- Track retry counts per feature
- Emit events for recovery actions

### Phase 3: Integration (Medium Priority)

**Priority**: MEDIUM
**Risk**: HIGH (modifies core orchestrator)

#### Task 3.1: Refactor Work Loop to Use State Machine

**File**: `.ai/alpha/scripts/lib/orchestrator.ts`

- Replace inline state management with state machine transitions
- Remove `detectAndHandleDeadlock` (replaced by state machine)
- Remove inline phantom completion detection (replaced by heartbeat monitor)
- Update logging to show state transitions

#### Task 3.2: Refactor Feature Implementation

**File**: `.ai/alpha/scripts/lib/feature.ts`

- Remove startup hang detection (replaced by heartbeat monitor)
- Remove stall detection interval (replaced by heartbeat monitor)
- Use state machine for status transitions
- Simplify PTY handling to just run + monitor heartbeat

#### Task 3.3: Deprecate Legacy Detection Systems

- Mark old detection functions as `@deprecated`
- Add migration comments pointing to new systems
- Remove dead code paths after verification

### Phase 4: Consolidation (Lower Priority)

**Priority**: LOW
**Risk**: LOW (cleanup only)

#### Task 4.1: Remove Deprecated Code

- Delete `startup-monitor.ts` (functionality in heartbeat-monitor.ts)
- Delete deadlock detection code from `orchestrator.ts`
- Delete phantom completion detection from `orchestrator.ts`
- Delete stall detection from `progress.ts`
- Consolidate timeout constants

#### Task 4.2: Update Configuration

**File**: `.ai/alpha/scripts/config/constants.ts`

- Remove conflicting timeout values
- Add state machine configuration
- Add heartbeat monitor configuration
- Document all remaining timeouts

## Testing Strategy

### Unit Tests

Add/update unit tests for:

- ✅ State machine transition guards
- ✅ State machine action execution
- ✅ Heartbeat monitor stale detection
- ✅ Recovery manager process cleanup
- ✅ Atomic manifest updates
- ✅ Regression: PTY timeout should not kill healthy features

**Test files**:
- `.ai/alpha/scripts/__tests__/state-machine.test.ts`
- `.ai/alpha/scripts/__tests__/heartbeat-monitor.test.ts`
- `.ai/alpha/scripts/__tests__/recovery-manager.test.ts`

### Integration Tests

- Full orchestration cycle with simulated failures
- Recovery from stuck feature
- Multi-sandbox coordination
- State synchronization across restarts

### Manual Testing Checklist

- [ ] Run spec with 3 sandboxes, verify no zombie processes
- [ ] Simulate network partition, verify heartbeat detection
- [ ] Kill Claude process manually, verify recovery
- [ ] Restart orchestrator mid-run, verify state consistency
- [ ] Monitor PID count during 30+ minute run

## Risk Assessment

**Overall Risk Level**: HIGH

### Potential Risks

1. **Breaking existing orchestration during refactor**
   - **Likelihood**: MEDIUM
   - **Impact**: HIGH
   - **Mitigation**: Phase 1 is additive; only Phase 3+ modifies core code

2. **State machine complexity vs. current simplicity**
   - **Likelihood**: LOW
   - **Impact**: MEDIUM
   - **Mitigation**: Clear state diagrams, comprehensive tests

3. **Race conditions in state transitions**
   - **Likelihood**: MEDIUM
   - **Impact**: HIGH
   - **Mitigation**: Atomic transitions with locks/guards

### Rollback Plan

If refactoring causes issues:
1. Revert to tagged version `pre-event-driven-refactor`
2. Apply only Phase 1 fixes as hotfixes
3. Retry refactor with more gradual integration

## Metrics & Success Criteria

### Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Issues per week | 6+ | <1 |
| Zombie processes per run | 5-15 | 0 |
| False positive stall detections | ~30% | <5% |
| Successful feature retries | ~50% | >90% |
| Time to detect actual stuck feature | Varies (30s-5min) | <60s |

### The Fix is Complete When

- [ ] Zero zombie Claude processes after 1-hour orchestration
- [ ] No cascading failures from timeout misfires
- [ ] State is consistent across manifest, progress file, and instance
- [ ] All state transitions are logged and auditable
- [ ] Retry logic always cleans up before starting new process

## File Structure After Refactoring

```
.ai/alpha/scripts/lib/
├── state-machine.ts         # NEW: Core state machine implementation
├── heartbeat-monitor.ts     # NEW: Single heartbeat monitoring system
├── recovery-manager.ts      # NEW: Atomic recovery with cleanup
├── orchestrator.ts          # MODIFIED: Use state machine, remove detection systems
├── feature.ts               # MODIFIED: Simplified, delegate to state machine
├── work-queue.ts            # MODIFIED: Remove deadlock/phantom detection
├── progress.ts              # MODIFIED: Remove stall detection
├── sandbox.ts               # MINIMAL CHANGES
├── manifest.ts              # MINIMAL CHANGES
├── pty-wrapper.ts           # MODIFIED: Fix timeout interpretation
├── health.ts                # DEPRECATED: Replaced by heartbeat-monitor.ts
├── startup-monitor.ts       # DEPRECATED: Replaced by heartbeat-monitor.ts
└── progress-file.ts         # UNCHANGED
```

## Validation Commands

### After Fix

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Build orchestrator
pnpm --filter @slideheroes/alpha-scripts build

# Run unit tests (if available)
pnpm --filter @slideheroes/alpha-scripts test

# Manual validation - run short spec
pnpm alpha:orchestrate --spec 1692 --sandbox-count 2 --timeout 1800

# Monitor for zombie processes during run
watch -n 5 "ps aux | grep -E 'claude|run-claude' | grep -v grep | wc -l"
```

## Dependencies

**No new dependencies required**

The refactoring uses standard TypeScript patterns and existing E2B SDK.

## Notes

### Why Not Just Fix the PTY Timeout?

Fixing only the PTY timeout (Phase 1) addresses the immediate symptom but leaves the underlying architectural issues:

1. Multiple detection systems still exist and can conflict
2. State is still distributed without consistency guarantees
3. Recovery logic is scattered across modules
4. No clear audit trail for state changes

The full event-driven architecture solves the root cause and prevents future "whack-a-mole" fixes.

### Comparison: Current vs. Proposed

| Aspect | Current | Proposed |
|--------|---------|----------|
| State Sources | 4+ (manifest, progress file, instance, PTY) | 1 (progress file as source of truth) |
| Detection Systems | 6 independent | 1 heartbeat monitor |
| Timeout Values | 5+ conflicting | 2 (heartbeat stale, startup grace) |
| Recovery Logic | Scattered across 5 files | Centralized in recovery-manager |
| Process Cleanup | Often skipped | Always performed before retry |
| State Transitions | Implicit, undocumented | Explicit state machine with guards |

### Related Issues

This refactoring addresses the root cause of these issues:
- #1777: Deadlock detection causing retries
- #1782: Phantom completion detection
- #1767: PTY timeout misinterpretation
- #1699, #1701: PTY timeout configuration
- #1688: Stuck task detection
- And 35+ other orchestrator stability issues

---
*Generated by Claude Refactoring Analyst*
