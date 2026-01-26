# Implementation Plan: Alpha Orchestrator Refactoring

**Issue**: #1816
**Created**: 2026-01-26
**Target**: `.ai/alpha/scripts/lib/orchestrator.ts` and related files

## Overview

This plan breaks down the refactoring of the Alpha Orchestrator system into atomic, testable steps. Each phase can be completed independently and validated before proceeding.

**Goal**: Reduce `orchestrator.ts` from 2,320 lines to ~600 lines by extracting 8 distinct responsibilities into focused modules.

---

## Prerequisites

### Before Starting

- [ ] Create feature branch: `git checkout -b refactor/alpha-orchestrator-1816`
- [ ] Verify all tests pass: `pnpm test:unit`
- [ ] Verify typecheck passes: `pnpm typecheck`
- [ ] Run dry-run validation: `npx tsx .ai/alpha/scripts/spec-orchestrator.ts 1692 --dry-run`
- [ ] Document current behavior with a test spec run (optional but recommended)

### Required Knowledge

- E2B SDK sandbox management
- Node.js child process and PTY handling
- TypeScript module patterns
- The Alpha workflow (spec → initiative → feature → task)

---

## Phase 1: Extract Event Server Module

**Priority**: HIGH
**Estimated Effort**: 2-3 hours
**Risk**: LOW (isolated functionality)

### Step 1.1: Create event-server.ts

**Create file**: `.ai/alpha/scripts/lib/event-server.ts`

```typescript
/**
 * Event Server Module
 *
 * Manages the Python WebSocket event server for real-time UI streaming.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { EVENT_SERVER_PORT } from "../config/index.js";
import { sleep } from "./utils.js";

// Module state
let eventServerProcess: ChildProcess | null = null;

export interface EventServerConfig {
  projectRoot: string;
  port?: number;
}

export interface EventServerResult {
  url: string | null;
  started: boolean;
}

/**
 * Start the event server for WebSocket streaming.
 */
export async function startEventServer(
  config: EventServerConfig,
  log: (...args: unknown[]) => void,
): Promise<string | null> {
  // ... extract from orchestrator.ts lines 129-203
}

/**
 * Stop the event server if running.
 */
export function stopEventServer(
  log: (...args: unknown[]) => void,
): void {
  // ... extract from orchestrator.ts lines 209-215
}

/**
 * Wait for UI to be ready to receive events.
 */
export async function waitForUIReady(
  maxWait?: number,
  pollInterval?: number,
  log?: (...args: unknown[]) => void,
): Promise<boolean> {
  // ... extract from orchestrator.ts lines 229-259
}

/**
 * Check if event server is currently running.
 */
export function isEventServerRunning(): boolean {
  return eventServerProcess !== null;
}
```

### Step 1.2: Extract Code from orchestrator.ts

**Lines to extract**: 117-259 (~142 lines)

1. Cut `eventServerProcess` variable declaration (line 120)
2. Cut `startEventServer()` function (lines 129-203)
3. Cut `stopEventServer()` function (lines 209-215)
4. Cut `waitForUIReady()` function (lines 229-259)

### Step 1.3: Update orchestrator.ts Imports

**Add import**:
```typescript
import {
  startEventServer,
  stopEventServer,
  waitForUIReady,
} from "./event-server.js";
```

**Remove**: The extracted code sections

### Step 1.4: Update index.ts Exports

**Add to** `.ai/alpha/scripts/lib/index.ts`:
```typescript
export * from "./event-server.js";
```

### Step 1.5: Validation

```bash
pnpm typecheck
pnpm lint:fix
npx tsx .ai/alpha/scripts/spec-orchestrator.ts 1692 --dry-run
```

### Step 1.6: Create Unit Tests

**Create file**: `.ai/alpha/scripts/lib/__tests__/event-server.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  startEventServer,
  stopEventServer,
  waitForUIReady,
  isEventServerRunning,
} from "../event-server.js";

describe("event-server", () => {
  describe("startEventServer", () => {
    it("should return null when startup fails", async () => {
      // Test with invalid project root
    });

    it("should return URL when startup succeeds", async () => {
      // Mock child_process.spawn
    });
  });

  describe("waitForUIReady", () => {
    it("should return true when UI responds with ready", async () => {
      // Mock fetch
    });

    it("should return false on timeout", async () => {
      // Test timeout behavior
    });
  });
});
```

### Step 1.7: Commit

```bash
git add .ai/alpha/scripts/lib/event-server.ts
git add .ai/alpha/scripts/lib/orchestrator.ts
git add .ai/alpha/scripts/lib/index.ts
git add .ai/alpha/scripts/lib/__tests__/event-server.test.ts
git commit -m "refactor(tooling): extract event-server module from orchestrator

- Create event-server.ts with startEventServer, stopEventServer, waitForUIReady
- Reduce orchestrator.ts by ~142 lines
- Add unit tests for event server functionality

Part of #1816

[agent: claude-opus]"
```

---

## Phase 2: Extract Deadlock Handler Module

**Priority**: HIGH
**Estimated Effort**: 3-4 hours
**Risk**: MEDIUM (core recovery logic)

### Step 2.1: Create deadlock-handler.ts

**Create file**: `.ai/alpha/scripts/lib/deadlock-handler.ts`

```typescript
/**
 * Deadlock Handler Module
 *
 * Detects and recovers from deadlock conditions in the orchestrator.
 * Handles phantom completion detection and failed feature retry logic.
 */

import type { SandboxInstance, SpecManifest } from "../types/index.js";
import { saveManifest } from "./manifest.js";
import { emitOrchestratorEvent } from "./event-emitter.js";
import {
  DEFAULT_MAX_RETRIES,
  getBlockingFailedFeatures,
  getNextAvailableFeature,
  getPhantomCompletedFeatures,
  resetFailedFeatureForRetry,
  shouldRetryFailedFeature,
} from "./work-queue.js";

export interface DeadlockResult {
  shouldExit: boolean;
  retriedCount: number;
  failedInitiatives: string[];
}

/**
 * Detect and handle deadlock conditions in the orchestrator.
 */
export function detectAndHandleDeadlock(
  instances: SandboxInstance[],
  manifest: SpecManifest,
  uiEnabled: boolean,
): DeadlockResult {
  // ... extract from orchestrator.ts lines 432-627
}

/**
 * Recover phantom-completed features.
 * These are features where tasks_completed >= task_count but status is still "in_progress"
 */
export function recoverPhantomCompletedFeatures(
  manifest: SpecManifest,
  busySandboxLabels: Set<string>,
  log: (...args: unknown[]) => void,
): number {
  // Extract the phantom completion logic from detectAndHandleDeadlock
  // This is also duplicated in runWorkLoop - consolidate here
}

/**
 * Handle failed features that are blocking the queue.
 */
export function handleBlockingFailedFeatures(
  manifest: SpecManifest,
  log: (...args: unknown[]) => void,
): { retriedCount: number; failedInitiatives: string[] } {
  // Extract retry logic from detectAndHandleDeadlock
}
```

### Step 2.2: Extract Code from orchestrator.ts

**Lines to extract**: 410-627 (~217 lines)

1. Cut `detectAndHandleDeadlock()` function
2. Refactor into smaller functions:
   - `recoverPhantomCompletedFeatures()`
   - `handleBlockingFailedFeatures()`

### Step 2.3: Consolidate Duplicate Phantom Logic

**Also extract from runWorkLoop** (lines 1294-1367):
- The phantom completion detection in the work loop should call `recoverPhantomCompletedFeatures()` instead of duplicating the logic

### Step 2.4: Update orchestrator.ts

**Add import**:
```typescript
import {
  detectAndHandleDeadlock,
  recoverPhantomCompletedFeatures,
} from "./deadlock-handler.js";
```

**Replace** the duplicated phantom completion logic in `runWorkLoop()` with a call to `recoverPhantomCompletedFeatures()`.

### Step 2.5: Validation

```bash
pnpm typecheck
pnpm lint:fix
npx tsx .ai/alpha/scripts/spec-orchestrator.ts 1692 --dry-run
```

### Step 2.6: Create Unit Tests

**Create file**: `.ai/alpha/scripts/lib/__tests__/deadlock-handler.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import {
  detectAndHandleDeadlock,
  recoverPhantomCompletedFeatures,
} from "../deadlock-handler.js";
import type { SandboxInstance, SpecManifest } from "../../types/index.js";

describe("deadlock-handler", () => {
  describe("detectAndHandleDeadlock", () => {
    it("should return shouldExit=false when sandboxes are busy", () => {
      // Test with busy sandbox
    });

    it("should return shouldExit=false when features are available", () => {
      // Test with available features
    });

    it("should detect deadlock when all sandboxes idle and no features available", () => {
      // Test deadlock detection
    });

    it("should retry failed features up to max retries", () => {
      // Test retry logic
    });

    it("should mark initiative as failed when max retries exceeded", () => {
      // Test failure handling
    });
  });

  describe("recoverPhantomCompletedFeatures", () => {
    it("should transition phantom-completed features to completed", () => {
      // Test phantom completion recovery
    });

    it("should update initiative status when all features complete", () => {
      // Test initiative completion
    });
  });
});
```

### Step 2.7: Commit

```bash
git add .ai/alpha/scripts/lib/deadlock-handler.ts
git add .ai/alpha/scripts/lib/orchestrator.ts
git add .ai/alpha/scripts/lib/__tests__/deadlock-handler.test.ts
git commit -m "refactor(tooling): extract deadlock-handler module from orchestrator

- Create deadlock-handler.ts with detectAndHandleDeadlock, recoverPhantomCompletedFeatures
- Consolidate duplicate phantom completion logic from runWorkLoop
- Reduce orchestrator.ts by ~290 lines (including duplicate removal)
- Add unit tests for deadlock detection and recovery

Part of #1816

[agent: claude-opus]"
```

---

## Phase 3: Extract Completion Phase Handler

**Priority**: HIGH
**Estimated Effort**: 4-5 hours
**Risk**: MEDIUM (critical path for spec completion)

### Step 3.1: Create completion-phase.ts

**Create file**: `.ai/alpha/scripts/lib/completion-phase.ts`

```typescript
/**
 * Completion Phase Module
 *
 * Handles the post-implementation completion phase including:
 * - Killing implementation sandboxes
 * - Creating review sandbox
 * - Starting dev server
 * - Documentation generation
 */

import type { Sandbox } from "@e2b/code-interpreter";
import type {
  ReviewUrl,
  SandboxInstance,
  SpecManifest,
} from "../types/index.js";
import { saveManifest } from "./manifest.js";
import { emitOrchestratorEvent } from "./event-emitter.js";
import {
  createReviewSandbox,
  getVSCodeUrl,
  startDevServer,
} from "./sandbox.js";
import { withTimeout } from "./utils.js";
import { speakCompletion } from "./tts.js";

export interface CompletionPhaseOptions {
  manifest: SpecManifest;
  instances: SandboxInstance[];
  timeout: number;
  uiEnabled: boolean;
  runId: string;
  document: boolean;
}

export interface CompletionPhaseResult {
  reviewUrls: ReviewUrl[];
  reviewSandbox: Sandbox | null;
  failedFeatureCount: number;
}

/**
 * Execute the completion phase after all features are implemented.
 */
export async function executeCompletionPhase(
  options: CompletionPhaseOptions,
  log: (...args: unknown[]) => void,
): Promise<CompletionPhaseResult> {
  // ... extract from orchestrator.ts lines 2059-2282
}

/**
 * Kill all implementation sandboxes and clean up manifest.
 */
export async function killImplementationSandboxes(
  instances: SandboxInstance[],
  manifest: SpecManifest,
  log: (...args: unknown[]) => void,
): Promise<string[]> {
  // Extract from lines 2098-2132
}

/**
 * Create and configure the review sandbox.
 */
export async function setupReviewSandbox(
  branchName: string,
  timeout: number,
  uiEnabled: boolean,
  log: (...args: unknown[]) => void,
): Promise<Sandbox | null> {
  // Extract from lines 2134-2173
}

/**
 * Start dev server on review sandbox and collect URLs.
 */
export async function startReviewDevServer(
  reviewSandbox: Sandbox,
  log: (...args: unknown[]) => void,
): Promise<ReviewUrl | null> {
  // Extract from lines 2176-2228
}

/**
 * Generate documentation if enabled and all features completed.
 */
export async function generateDocumentation(
  sandbox: Sandbox,
  manifest: SpecManifest,
  log: (...args: unknown[]) => void,
): Promise<boolean> {
  // Extract from lines 1974-2056
}

/**
 * Clean up orphaned sandbox IDs from manifest.
 */
export function cleanupOrphanedSandboxIds(
  manifest: SpecManifest,
  runningSandboxIds: Set<string>,
  log: (...args: unknown[]) => void,
): void {
  // Extract from lines 2231-2260
}
```

### Step 3.2: Extract Code from orchestrator.ts

**Lines to extract**: 1969-2282 (~313 lines)

Break into functions:
1. `executeCompletionPhase()` - main orchestration
2. `killImplementationSandboxes()` - sandbox cleanup
3. `setupReviewSandbox()` - review sandbox creation
4. `startReviewDevServer()` - dev server startup
5. `generateDocumentation()` - optional docs generation
6. `cleanupOrphanedSandboxIds()` - manifest cleanup

### Step 3.3: Update orchestrator.ts

**Add import**:
```typescript
import {
  executeCompletionPhase,
  type CompletionPhaseResult,
} from "./completion-phase.js";
```

**Replace** completion phase code with:
```typescript
// Execute completion phase
const completionResult = await executeCompletionPhase(
  {
    manifest,
    instances,
    timeout: options.timeout,
    uiEnabled: options.ui,
    runId,
    document: options.document,
  },
  log,
);

const { reviewUrls, failedFeatureCount } = completionResult;
```

### Step 3.4: Validation

```bash
pnpm typecheck
pnpm lint:fix
npx tsx .ai/alpha/scripts/spec-orchestrator.ts 1692 --dry-run
```

### Step 3.5: Create Unit Tests

**Create file**: `.ai/alpha/scripts/lib/__tests__/completion-phase.test.ts`

Test scenarios:
- Successful completion with review sandbox
- Completion when dev server fails to start
- Documentation generation success/failure
- Orphaned sandbox ID cleanup

### Step 3.6: Commit

```bash
git add .ai/alpha/scripts/lib/completion-phase.ts
git add .ai/alpha/scripts/lib/orchestrator.ts
git add .ai/alpha/scripts/lib/__tests__/completion-phase.test.ts
git commit -m "refactor(tooling): extract completion-phase module from orchestrator

- Create completion-phase.ts with executeCompletionPhase and helpers
- Separate sandbox cleanup, review setup, dev server, and documentation
- Reduce orchestrator.ts by ~313 lines
- Add unit tests for completion phase

Part of #1816

[agent: claude-opus]"
```

---

## Phase 4: Refactor Work Loop to Class

**Priority**: MEDIUM
**Estimated Effort**: 6-8 hours
**Risk**: MEDIUM-HIGH (core orchestration logic)

### Step 4.1: Create work-loop.ts

**Create file**: `.ai/alpha/scripts/lib/work-loop.ts`

```typescript
/**
 * Work Loop Module
 *
 * Manages the main orchestration loop that assigns features to sandboxes.
 * Handles health checks, keepalive, and stuck task detection.
 */

import type { SandboxInstance, SpecManifest } from "../types/index.js";
import { HEALTH_CHECK_INTERVAL_MS, SANDBOX_KEEPALIVE_INTERVAL_MS } from "../config/index.js";

export interface WorkLoopOptions {
  instances: SandboxInstance[];
  manifest: SpecManifest;
  uiEnabled: boolean;
  timeoutSeconds: number;
  runId?: string;
}

export class WorkLoop {
  private instances: SandboxInstance[];
  private manifest: SpecManifest;
  private uiEnabled: boolean;
  private timeoutSeconds: number;
  private runId?: string;

  private activeWork: Map<string, Promise<void>>;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private keepaliveInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;

  constructor(options: WorkLoopOptions) {
    this.instances = options.instances;
    this.manifest = options.manifest;
    this.uiEnabled = options.uiEnabled;
    this.timeoutSeconds = options.timeoutSeconds;
    this.runId = options.runId;
    this.activeWork = new Map();
  }

  /**
   * Run the main work loop until all features are complete.
   */
  async run(): Promise<void> {
    this.isRunning = true;
    this.startHealthChecks();
    this.startKeepalive();

    try {
      await this.mainLoop();
    } finally {
      this.cleanup();
    }
  }

  /**
   * Stop the work loop gracefully.
   */
  stop(): void {
    this.isRunning = false;
  }

  private async mainLoop(): Promise<void> {
    // ... extract from runWorkLoop() lines 996-1374
  }

  private startHealthChecks(): void {
    // ... extract health check interval setup from lines 658-738
  }

  private startKeepalive(): void {
    // ... extract keepalive interval setup from lines 742-994
  }

  private async handleSandboxRestart(instance: SandboxInstance): Promise<void> {
    // ... extract sandbox restart logic
  }

  private async detectStuckTasks(): Promise<void> {
    // ... extract stuck task detection from lines 1167-1292
  }

  private cleanup(): void {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.keepaliveInterval) clearInterval(this.keepaliveInterval);
  }
}

/**
 * Run the work loop (convenience function for backward compatibility).
 */
export async function runWorkLoop(
  instances: SandboxInstance[],
  manifest: SpecManifest,
  uiEnabled: boolean = false,
  timeoutSeconds: number = 7200,
  runId?: string,
): Promise<void> {
  const workLoop = new WorkLoop({
    instances,
    manifest,
    uiEnabled,
    timeoutSeconds,
    runId,
  });
  await workLoop.run();
}
```

### Step 4.2: Break Down Main Loop

Extract these distinct concerns from `runWorkLoop()`:

1. **Health Check Management** (~80 lines)
   - `startHealthChecks()`
   - `handleHealthCheckCycle()`
   - `restartFailedSandbox()`

2. **Keepalive Management** (~250 lines)
   - `startKeepalive()`
   - `handlePreemptiveRestart()`
   - `handleExpiredSandbox()`

3. **Work Assignment** (~90 lines)
   - `assignAvailableWork()`
   - `handleFeatureAssignment()`

4. **Stuck Task Detection** (~125 lines)
   - `detectStuckTasks()`
   - `handlePTYFallback()`
   - `resetStuckFeature()`

5. **Deadlock Handling** (~50 lines)
   - Call `detectAndHandleDeadlock()` from deadlock-handler.ts

6. **Phantom Completion** (~75 lines)
   - Call `recoverPhantomCompletedFeatures()` from deadlock-handler.ts

### Step 4.3: Update orchestrator.ts

**Replace** `runWorkLoop()` call with:
```typescript
import { WorkLoop } from "./work-loop.js";

// In orchestrate():
const workLoop = new WorkLoop({
  instances,
  manifest,
  uiEnabled: options.ui,
  timeoutSeconds: options.timeout,
  runId,
});
await workLoop.run();
```

### Step 4.4: Validation

```bash
pnpm typecheck
pnpm lint:fix
# Run a real test with a small spec:
npx tsx .ai/alpha/scripts/spec-orchestrator.ts <test-spec-id> --sandbox-count 1
```

### Step 4.5: Create Unit Tests

**Create file**: `.ai/alpha/scripts/lib/__tests__/work-loop.test.ts`

Test scenarios:
- Work assignment to idle sandboxes
- Health check failure handling
- Keepalive timeout handling
- Stuck task detection and recovery
- Graceful shutdown

### Step 4.6: Commit

```bash
git add .ai/alpha/scripts/lib/work-loop.ts
git add .ai/alpha/scripts/lib/orchestrator.ts
git add .ai/alpha/scripts/lib/__tests__/work-loop.test.ts
git commit -m "refactor(tooling): extract WorkLoop class from orchestrator

- Create work-loop.ts with WorkLoop class
- Separate health checks, keepalive, work assignment, stuck detection
- Maintain backward-compatible runWorkLoop() function
- Reduce orchestrator.ts by ~745 lines
- Add unit tests for work loop functionality

Part of #1816

[agent: claude-opus]"
```

---

## Phase 5: Extract Sandbox Lifecycle Module

**Priority**: MEDIUM
**Estimated Effort**: 3-4 hours
**Risk**: LOW-MEDIUM

### Step 5.1: Create sandbox-lifecycle.ts

**Create file**: `.ai/alpha/scripts/lib/sandbox-lifecycle.ts`

```typescript
/**
 * Sandbox Lifecycle Module
 *
 * Manages sandbox initialization, reconnection, and preemptive restart.
 * Separates lifecycle concerns from core sandbox operations.
 */

import type { SandboxInstance, SpecManifest } from "../types/index.js";
import {
  createSandbox,
  clearStaleSandboxData,
  isSandboxExpired,
  getSandboxAgeMinutes,
  reconnectToStoredSandboxes,
} from "./sandbox.js";
import { saveManifest } from "./manifest.js";

export interface SandboxInitOptions {
  manifest: SpecManifest;
  sandboxCount: number;
  timeout: number;
  uiEnabled: boolean;
  runId: string;
  needsDatabaseReset: boolean;
}

export interface SandboxInitResult {
  instances: SandboxInstance[];
  reconnectedCount: number;
  createdCount: number;
}

/**
 * Initialize sandboxes for orchestration.
 * Attempts reconnection first, then creates new sandboxes as needed.
 */
export async function initializeSandboxes(
  options: SandboxInitOptions,
  log: (...args: unknown[]) => void,
): Promise<SandboxInitResult> {
  // ... extract from orchestrate() lines 1701-1842
}

/**
 * Handle sandbox reconnection with expiration checking.
 */
export async function attemptSandboxReconnection(
  manifest: SpecManifest,
  uiEnabled: boolean,
  runId: string,
  log: (...args: unknown[]) => void,
): Promise<SandboxInstance[]> {
  // ... extract from lines 1718-1758
}

/**
 * Create new sandboxes with optional parallel DB reset.
 */
export async function createNewSandboxes(
  manifest: SpecManifest,
  startIndex: number,
  count: number,
  timeout: number,
  uiEnabled: boolean,
  runId: string,
  parallelDbReset: boolean,
  log: (...args: unknown[]) => void,
): Promise<SandboxInstance[]> {
  // ... extract from lines 1763-1842
}
```

### Step 5.2: Extract from orchestrator.ts

**Lines to extract**: 1699-1874 (~175 lines)

### Step 5.3: Validation & Commit

Follow same pattern as previous phases.

---

## Phase 6: Refactor feature.ts

**Priority**: MEDIUM
**Estimated Effort**: 5-6 hours
**Risk**: MEDIUM (PTY and retry logic is critical)

### Step 6.1: Create feature-runner.ts

**Create file**: `.ai/alpha/scripts/lib/feature-runner.ts`

```typescript
/**
 * Feature Runner Module
 *
 * Manages individual feature implementation execution.
 * Handles PTY session management and startup retry logic.
 */

import type { SandboxInstance, SpecManifest, FeatureEntry } from "../types/index.js";

export interface FeatureRunnerOptions {
  instance: SandboxInstance;
  manifest: SpecManifest;
  feature: FeatureEntry;
  uiEnabled: boolean;
}

export class FeatureRunner {
  private instance: SandboxInstance;
  private manifest: SpecManifest;
  private feature: FeatureEntry;
  private uiEnabled: boolean;

  constructor(options: FeatureRunnerOptions) {
    // ...
  }

  /**
   * Run the feature implementation.
   */
  async run(): Promise<FeatureImplementationResult> {
    await this.prepareGitState();
    return await this.executeWithRetry();
  }

  private async prepareGitState(): Promise<void> {
    // Extract git operations from lines 184-219
  }

  private async executeWithRetry(): Promise<FeatureImplementationResult> {
    // Extract retry loop from lines 369-616
  }

  private async createPTYSession(): Promise<PTYHandle> {
    // Extract PTY creation from lines 400-477
  }

  private async waitForCompletion(ptyHandle: PTYHandle): Promise<WaitResult> {
    // Extract PTY wait logic from lines 501-574
  }

  private async parseResults(): Promise<FeatureImplementationResult> {
    // Extract result parsing from lines 625-780
  }
}
```

### Step 6.2: Simplify feature.ts

Keep `runFeatureImplementation()` as a thin wrapper:

```typescript
export async function runFeatureImplementation(
  instance: SandboxInstance,
  manifest: SpecManifest,
  feature: FeatureEntry,
  uiEnabled: boolean = false,
): Promise<FeatureImplementationResult> {
  const runner = new FeatureRunner({
    instance,
    manifest,
    feature,
    uiEnabled,
  });
  return runner.run();
}
```

---

## Validation Checkpoints

### After Each Phase

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint:fix

# Unit tests (if applicable)
pnpm test:unit --filter=alpha

# Dry run validation
npx tsx .ai/alpha/scripts/spec-orchestrator.ts 1692 --dry-run
```

### After All Phases

```bash
# Full validation
pnpm typecheck && pnpm lint:fix && pnpm test:unit

# Integration test with real spec (use a small test spec)
npx tsx .ai/alpha/scripts/spec-orchestrator.ts <test-spec-id> --sandbox-count 1 --ui
```

---

## Rollback Strategy

Each phase is committed separately, so rollback is straightforward:

```bash
# Rollback single phase
git revert <commit-sha>

# Rollback multiple phases
git revert <commit-sha-1> <commit-sha-2> <commit-sha-3>

# Full rollback to before refactoring
git checkout main -- .ai/alpha/scripts/lib/
```

---

## Expected Final State

### File Size Comparison

| File | Before | After | Change |
|------|--------|-------|--------|
| `orchestrator.ts` | 2,320 | ~600 | -74% |
| `feature.ts` | 850 | ~400 | -53% |
| `sandbox.ts` | 958 | ~700 | -27% |
| **New Files** | | | |
| `event-server.ts` | - | ~150 | +150 |
| `deadlock-handler.ts` | - | ~200 | +200 |
| `completion-phase.ts` | - | ~350 | +350 |
| `work-loop.ts` | - | ~500 | +500 |
| `sandbox-lifecycle.ts` | - | ~200 | +200 |
| `feature-runner.ts` | - | ~300 | +300 |

### Module Dependency Graph (After)

```
orchestrator.ts
├── event-server.ts
├── deadlock-handler.ts
├── completion-phase.ts
│   ├── sandbox.ts
│   └── tts.ts
├── work-loop.ts
│   ├── feature.ts → feature-runner.ts
│   ├── deadlock-handler.ts
│   ├── sandbox.ts
│   └── progress.ts
├── sandbox-lifecycle.ts
│   └── sandbox.ts
└── manifest.ts
```

---

## Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Event Server | 2-3 hours | None |
| Phase 2: Deadlock Handler | 3-4 hours | Phase 1 |
| Phase 3: Completion Phase | 4-5 hours | Phase 2 |
| Phase 4: Work Loop | 6-8 hours | Phase 3 |
| Phase 5: Sandbox Lifecycle | 3-4 hours | Phase 4 |
| Phase 6: Feature Runner | 5-6 hours | Phase 5 |
| **Total** | **23-30 hours** | |

Recommended approach: Complete Phases 1-3 first (HIGH priority), which provides ~70% of the benefit with lower risk. Phases 4-6 can be done incrementally.

---

*Implementation plan for GitHub Issue #1816*
*Generated: 2026-01-26*
