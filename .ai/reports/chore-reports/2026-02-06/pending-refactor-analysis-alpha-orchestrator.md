# Refactoring Analysis: Alpha Spec Orchestrator (`lib/`)

**Generated**: 2026-02-06
**Target**: `.ai/alpha/scripts/lib/` (35+ source files, ~15,600 lines)
**Analyst**: Claude Refactoring Specialist

## Executive Summary

The Alpha Spec Orchestrator is a complex TypeScript system that manages E2B cloud sandboxes for autonomous feature implementation. It has grown organically through bug fixes (40+ referenced issues) into a codebase with **critical structural problems** that cause recurring state management bugs.

The three systemic issues are:

1. **Feature status is managed as raw strings mutated directly across 8 files with no centralized control**, despite a `FeatureStateMachine` class existing (438 lines) that is **never imported or used** by any runtime code.

2. **Five recovery/monitoring mechanisms** (`health.ts`, `heartbeat-monitor.ts`, `recovery-manager.ts`, `promise-age-tracker.ts`, `startup-monitor.ts`) were built to solve specific bugs but **three are completely dead code** (heartbeat-monitor, recovery-manager, state-machine -- zero runtime imports). The two that are used (health.ts, promise-age-tracker.ts) overlap with ad-hoc recovery logic in `work-loop.ts` and `feature.ts`.

3. **The `createLogger(uiEnabled)` function is copy-pasted identically in 9 files**, and **initiative status update logic is duplicated in 5 files** -- both are textbook extract-and-share candidates.

**Risk Level**: HIGH -- the current architecture makes every bug fix likely to introduce new state inconsistencies.

## Directory Overview

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Total source files | 35 | - | - |
| Total test files | 25 | - | - |
| Files >400 lines | 9 | 0 | CRITICAL |
| Files >800 lines | 5 | 0 | CRITICAL |
| Dead code files (unused) | 3 | 0 | CRITICAL |
| `createLogger` duplicates | 9 | 1 | HIGH |
| Status mutation sites | 26 | 1-2 | CRITICAL |
| Initiative update duplicates | 5 | 1 | HIGH |

### File Size Summary (Source Files Only, Sorted by Size)

| File | Lines | Classification | Priority |
|------|-------|----------------|----------|
| `sandbox.ts` | 1524 | Infrastructure | CRITICAL |
| `manifest.ts` | 1192 | State Management | CRITICAL |
| `work-loop.ts` | 1127 | Core Loop | CRITICAL |
| `feature.ts` | 932 | Core Loop | CRITICAL |
| `orchestrator.ts` | 932 | Entry Point | HIGH |
| `completion-phase.ts` | 630 | Infrastructure | MEDIUM |
| `work-queue.ts` | 573 | Core Loop | HIGH |
| `deadlock-handler.ts` | 486 | Recovery | HIGH |
| `heartbeat-monitor.ts` | 453 | **DEAD CODE** | REMOVE |
| `state-machine.ts` | 438 | **DEAD CODE** | INTEGRATE |
| `recovery-manager.ts` | 414 | **DEAD CODE** | INTEGRATE |
| `health.ts` | 350 | Recovery | MEDIUM |
| `promise-age-tracker.ts` | 282 | Recovery | LOW |
| `startup-monitor.ts` | 259 | Recovery | LOW |

---

## Code Smell Analysis

### CS-1: Shotgun Surgery -- Feature Status Mutations (CRITICAL)

**Problem**: `feature.status = "<string>"` appears in **26 locations across 8 files**. Every status transition is a raw string assignment with no validation, no guard checks, and no centralized event emission. This is the root cause of the recurring state management bugs referenced in the issue tracker.

**Files with direct status mutations**:

| File | Mutation Count | Statuses Set |
|------|---------------|--------------|
| `work-loop.ts` | 5 | pending, failed, completed |
| `feature.ts` | 2 | in_progress, failed |
| `health.ts` | 2 | pending, failed |
| `deadlock-handler.ts` | 4 | completed, pending, failed |
| `work-queue.ts` | 4 | failed, in_progress, pending |
| `orchestrator.ts` | 1 | completed |
| `recovery-manager.ts` | 2 | failed, pending |

**Impact**: Any file can set any status at any time without checking whether that transition is valid. For example, a feature can go from `completed` back to `pending` with no safeguard. The `state-machine.ts` file defines valid transitions but is completely unused.

**Evidence from bug history**: Issues #1777, #1782, #1786, #1841, #1858, #1938, #1948 all trace back to features ending up in inconsistent states because different recovery paths set status independently.

### CS-2: Duplicated Code -- `createLogger` (HIGH)

**Problem**: The exact same function is copy-pasted in 9 files:

```
orchestrator.ts, work-queue.ts, feature.ts, deadlock-handler.ts,
health.ts, sandbox.ts, database.ts, lock.ts, progress.ts
```

Each copy is 8-12 lines with identical logic: suppress console.log when UI is enabled, always allow console.error. This is a textbook "extract to shared module" candidate.

### CS-3: Duplicated Code -- Initiative Status Update (HIGH)

**Problem**: The pattern "count completed features in initiative, update `features_completed`, check if all are done, set initiative status" is implemented independently in **5 files**:

1. `work-loop.ts:1053-1071` (updateInitiativeStatus method)
2. `feature.ts:777-795` (inline in runFeatureImplementation)
3. `deadlock-handler.ts:107-127` (inline in recoverPhantomCompletedFeatures)
4. `orchestrator.ts:818-829` (inline in skip-to-completion debug mode)
5. `work-queue.ts:334-354` (inline in cleanupStaleState)

Each copy has slightly different logic, creating subtle inconsistencies. The work-loop.ts version checks `every(f => f.status === "completed")` while the work-queue.ts version uses a more nuanced three-way check including "pending".

### CS-4: Dead Code -- Three Unused Modules (CRITICAL)

Three modules totaling **1,305 lines** were created as part of bug fix #1786 ("event-driven architecture refactor") but were never integrated into the runtime code:

| Module | Lines | Purpose | Imports |
|--------|-------|---------|---------|
| `state-machine.ts` | 438 | Valid feature state transitions with guards | Only test + index.ts re-export |
| `heartbeat-monitor.ts` | 453 | Unified heartbeat-based feature health | Only test + index.ts re-export |
| `recovery-manager.ts` | 414 | Atomic recovery with process cleanup | Only test + index.ts re-export |

These were designed to replace the distributed state management but the migration was never completed. The old ad-hoc patterns remain in `work-loop.ts`, `health.ts`, and `feature.ts`.

### CS-5: God Function -- `runFeatureImplementation` (HIGH)

**Problem**: `feature.ts` exports a single function `runFeatureImplementation` at 932 lines. This function handles:

1. Git pull and branch sync (lines 196-218)
2. Progress file initialization (lines 220-252)
3. PTY creation and I/O handling (lines 438-518)
4. Startup hang detection with retry loop (lines 392-657)
5. Stall detection interval management (lines 312-329)
6. Progress parsing and completion validation (lines 666-758)
7. Initiative status update (lines 777-795)
8. Git push after completion (lines 799-806)
9. Migration sync (lines 811-819)
10. UI progress writing (lines 829-847)
11. Error handling and recovery (lines 867-931)

This function has **at least 6 nested try/catch blocks**, **5 setInterval timers**, and manages **13 mutable state variables** in its closure. It is virtually impossible to test in isolation.

### CS-6: God File -- `sandbox.ts` (MEDIUM)

`sandbox.ts` at 1524 lines handles at least **5 distinct responsibilities**:

1. **Provider install configuration** (lines 52-157): Config for pnpm install per provider
2. **Sandbox validation** (lines 152-258): Environment validation before install
3. **Install execution** (lines 259-420): pnpm install with retry logic
4. **Sandbox lifecycle** (lines 467-705): Create, connect, reconnect, clear stale data
5. **Git/branch management** (lines 721-846): Git credentials, branch setup
6. **Dev server and review** (lines 1107-1524): Dev server, VS Code URLs, review sandbox, keepalive

---

## Coupling Analysis

### Tight Coupling: manifest.ts <-> Every Module

`saveManifest()` is called from 7 different files, often immediately after a status mutation. The manifest acts as a shared mutable database passed by reference. When multiple files mutate features and call `saveManifest()`, there is no coordination:

```
work-loop.ts      -> saveManifest (10+ call sites)
feature.ts        -> saveManifest (3 call sites)
health.ts         -> saveManifest (2 call sites)
deadlock-handler.ts -> saveManifest (3 call sites)
work-queue.ts     -> saveManifest (1 call site, via assignFeatureToSandbox)
orchestrator.ts   -> saveManifest (5 call sites)
```

**Risk**: Concurrent saves from different async paths can overwrite each other. The file-based "atomic" save is not atomic under concurrent async operations within a single Node.js process.

### Tight Coupling: Feature Status -> Initiative Status -> Overall Progress

Every file that sets `feature.status = "completed"` must also:
1. Find the initiative for that feature
2. Count completed features in that initiative
3. Update `initiative.features_completed`
4. Check if all features are done
5. Update `initiative.status`
6. Call `saveManifest()` which updates `writeOverallProgress()`

Missing any of these steps causes the UI to show stale data, triggers false deadlock detection, or breaks dependency resolution. This multi-step update is duplicated in 5 files (see CS-3).

### Loose Coupling (Good): `startup-monitor.ts`, `promise-age-tracker.ts`

These modules have clean interfaces -- they track data and return results without mutating external state. They represent the model other modules should follow.

---

## Cohesion Assessment

| Module | Cohesion | Assessment |
|--------|----------|------------|
| `work-loop.ts` | LOW | Class mixes health checks, keepalive, work assignment, stuck detection, phantom recovery, promise monitoring |
| `feature.ts` | LOW | Single function handles PTY, git, progress, UI, startup, stall, retry |
| `sandbox.ts` | LOW | Handles lifecycle, install, git, dev server, review, keepalive |
| `manifest.ts` | MEDIUM | Manifest CRUD is cohesive; archive/cleanup logic should be separate |
| `work-queue.ts` | MEDIUM | Feature selection + stale cleanup + deadlock helpers + phantom detection |
| `deadlock-handler.ts` | HIGH | Focused on deadlock detection and recovery |
| `promise-age-tracker.ts` | HIGH | Single responsibility: track promise ages |
| `startup-monitor.ts` | HIGH | Single responsibility: detect startup hangs |
| `health.ts` | MEDIUM | Health checks + process killing (should split) |

---

## Specific Refactoring Opportunities

### Opportunity 1: Enforce State Machine for All Feature Transitions

**Current state**: 26 raw `feature.status = "string"` mutations scattered across 8 files.

**Target state**: All status transitions go through a centralized function that validates the transition and triggers side effects (initiative update, manifest save, event emission).

**Approach**: Adapt the existing `state-machine.ts` into a simpler transition function that:
- Validates `from -> to` transitions
- Updates initiative status atomically
- Calls `saveManifest()` once
- Emits events for UI

**Estimated impact**:
- Eliminates the root cause of 8+ state-related bugs
- Reduces status mutation sites from 26 to 1
- Makes invalid transitions impossible at runtime
- Centralizes initiative update logic (eliminates 5 copies)

**Risk**: MEDIUM -- requires touching all 8 files but each change is mechanical (replace direct mutation with function call). Type system will catch missing updates.

**Effort**: 3-4 hours

### Opportunity 2: Extract Shared Logger Module

**Current state**: 9 identical copies of `createLogger(uiEnabled)`.

**Target state**: Single `logger.ts` module exporting `createLogger()`.

**Estimated impact**:
- Removes ~100 lines of duplicated code
- Makes future logging changes (e.g., adding file logging) possible in one place

**Risk**: LOW -- purely mechanical extraction with no behavior change.

**Effort**: 30 minutes

### Opportunity 3: Remove Dead Code Modules

**Current state**: `state-machine.ts` (438 lines), `heartbeat-monitor.ts` (453 lines), and `recovery-manager.ts` (414 lines) are exported from `index.ts` but have zero runtime consumers.

**Target state**: Absorb the useful design from `state-machine.ts` into the transition function (Opportunity 1). Delete `heartbeat-monitor.ts` and `recovery-manager.ts` entirely along with their tests.

**Estimated impact**:
- Removes 1,305 lines of dead code
- Reduces cognitive overhead for developers
- Eliminates 3 test files that test code nobody uses

**Risk**: LOW -- these modules are provably unused (grep confirms zero imports). The test files for them can be removed.

**Effort**: 1 hour

### Opportunity 4: Decompose `feature.ts` God Function

**Current state**: Single 932-line `runFeatureImplementation()` function.

**Target state**: Extract into focused functions/modules:

```
feature/
  run-feature.ts          # Top-level orchestration (~100 lines)
  git-sync.ts             # Git pull, push, migration sync (~80 lines)
  pty-session.ts           # PTY creation, I/O, wait loop (~200 lines)
  startup-retry.ts         # Startup hang detection + retry loop (~150 lines)
  completion-parser.ts     # Progress file parsing + validation (~150 lines)
  log-stream.ts            # Log file management (~50 lines)
```

**Estimated impact**:
- Each module becomes independently testable
- Startup retry logic can be unit tested without PTY mocking
- Completion parsing can be tested with fixture data
- Reduces cognitive load from 932 lines to ~100-200 per file

**Risk**: MEDIUM -- the function has deeply interleaved concerns (closure variables shared across retry loop, PTY callbacks, and timers). Requires careful extraction to avoid breaking the timing dependencies.

**Effort**: 6-8 hours

### Opportunity 5: Split `sandbox.ts`

**Current state**: 1524-line file with 20+ exported functions spanning 5 responsibilities.

**Target state**:

```
sandbox/
  lifecycle.ts         # create, connect, reconnect, kill (~400 lines)
  install.ts           # Provider config, validation, install with retry (~300 lines)
  git-setup.ts         # Git credentials, branch management (~200 lines)
  review.ts            # Review sandbox, dev server, VS Code URL (~250 lines)
  keepalive.ts         # Keepalive, age checks, restart detection (~200 lines)
```

**Estimated impact**:
- Each module has single responsibility
- Install logic (complex retry) can be tested independently
- Review sandbox logic (currently at bottom of file) becomes discoverable

**Risk**: LOW -- functions are already well-separated by comment blocks. This is mostly file splitting, not logic refactoring.

**Effort**: 2-3 hours

### Opportunity 6: Consolidate Recovery Mechanisms

**Current state**: 5 systems address different recovery scenarios independently:

| System | File | Trigger | Action |
|--------|------|---------|--------|
| Health checks | `health.ts` | No progress file, stale heartbeat | Kill process, reset to pending |
| Promise timeout | `promise-age-tracker.ts` + `work-loop.ts` | Promise age + heartbeat age thresholds | Reset to pending or mark failed |
| Stuck task detection | `work-loop.ts:713-767` | Sandbox not busy + tasks remaining | Reset to pending |
| PTY fallback | `work-loop.ts:879-924` | PTY stuck but progress file shows complete | Mark completed |
| Phantom completion | `work-queue.ts` + `deadlock-handler.ts` | tasks_completed >= task_count but status in_progress | Mark completed |

**Target state**: A unified recovery coordinator that:
- Runs on a single timer
- Checks health, heartbeat, promise age, progress file in one pass
- Applies the most appropriate recovery action
- Routes through the centralized status transition function (Opportunity 1)

**Estimated impact**:
- Eliminates conflicting recovery actions
- Makes recovery behavior predictable and testable
- Reduces `work-loop.ts` from 1127 lines by ~400 lines

**Risk**: HIGH -- recovery logic is critical path. Requires extensive testing to ensure no regression. The existing 5 systems cover different edge cases that must all be preserved.

**Effort**: 8-12 hours

---

## Risk Assessment

| Refactoring | Impact | Risk | Priority | Estimated Hours |
|-------------|--------|------|----------|-----------------|
| 1. State machine enforcement | CRITICAL | MEDIUM | 1 | 3-4 |
| 2. Extract shared logger | LOW | LOW | 2 | 0.5 |
| 3. Remove dead code | MEDIUM | LOW | 2 | 1 |
| 4. Decompose feature.ts | HIGH | MEDIUM | 3 | 6-8 |
| 5. Split sandbox.ts | MEDIUM | LOW | 3 | 2-3 |
| 6. Consolidate recovery | HIGH | HIGH | 4 | 8-12 |

### Recommended Execution Order

**Phase 1 (Foundation)**: Opportunities 2, 3 -- Low risk mechanical changes that reduce noise and remove dead code. Do these first as they make all subsequent work cleaner.

**Phase 2 (Critical Fix)**: Opportunity 1 -- Enforce centralized state transitions. This is the highest-value change and the root cause fix for recurring bugs. Must be done before any recovery consolidation, as it provides the foundation.

**Phase 3 (Structural)**: Opportunities 4, 5 -- Decompose the god function and god file. These reduce cognitive load and enable better testing but do not fix bugs directly.

**Phase 4 (Consolidation)**: Opportunity 6 -- Consolidate recovery mechanisms. This depends on Phase 2 (state machine) being complete. It is the highest risk change and should be done last, with comprehensive integration testing.

---

## Specific Analysis: Should the State Machine Be Enforced?

**Yes, emphatically.** The existing `state-machine.ts` defines these valid transitions:

```
queued -> assigning -> initializing -> executing -> completing -> completed
                  \         |              |            |
                   retrying <--------------+------------+
                      |
                   failed (after max retries)
```

Currently, status is a union type `"pending" | "in_progress" | "completed" | "failed" | "blocked"` that allows any transition. The state machine uses a richer set of states (queued, assigning, initializing, executing, completing, retrying) that more precisely model the lifecycle.

**Recommendation**: Adopt a simplified version. The full 8-state model from `state-machine.ts` is more complex than needed. A practical approach:

1. Keep the existing 5 status values (they are persisted in manifest files and changing them would be a migration).
2. Create a `transitionFeatureStatus(feature, manifest, newStatus, context)` function that:
   - Validates the transition (e.g., `completed -> pending` is not valid)
   - Updates `feature.status`, `feature.assigned_sandbox`, `feature.assigned_at`
   - Updates the parent initiative status
   - Calls `saveManifest()` once
   - Emits an orchestrator event
3. Make the existing `FeatureEntry.status` type narrower at each call site via the function signature.

This captures 80% of the state machine's value with 20% of the implementation complexity.

## Specific Analysis: Should the 5 Recovery Mechanisms Be Consolidated?

**Yes, but incrementally.** Full consolidation in one step is too risky. Recommended approach:

1. **Phase 2**: Route all recovery actions through the centralized state transition function. This alone eliminates conflicting state mutations.
2. **Phase 4**: Merge the health check, stuck task detection, and promise timeout into a single periodic check. Keep PTY fallback in feature.ts (it runs during PTY execution, not from the work loop). Keep phantom completion as a fast path in the deadlock handler.

The key insight is that consolidation depends on centralized transitions (Phase 2). Without that, combining recovery mechanisms just moves the state inconsistency from 5 files to 1 file.

## Specific Analysis: Should `feature.ts` Be Decomposed?

**Yes.** At 932 lines with a single exported function, this is the hardest file to modify safely. The decomposition outlined in Opportunity 4 would make each concern testable. The main risk is the deeply interleaved timer and closure state. A staged approach:

1. Extract `createLogStream` (already a separate function, just move to own file)
2. Extract progress parsing and completion validation (pure function, easy to test)
3. Extract git sync operations (independent side effects)
4. Extract PTY session creation (the most complex extraction)
5. What remains is a clean orchestration function

## Specific Analysis: Should `sandbox.ts` Be Split?

**Yes, and it is the easiest refactoring.** The file is already organized into well-labeled sections with clear comment-block boundaries. Functions do not share private state. Splitting along the existing section boundaries is nearly zero risk.

---

## Test Coverage Assessment

### Current Test Files

| Test File | Tests Module | Line Count |
|-----------|-------------|------------|
| `state-machine.spec.ts` | state-machine.ts | Tests dead code |
| `heartbeat-monitor.spec.ts` | heartbeat-monitor.ts | Tests dead code |
| `recovery-manager.spec.ts` | recovery-manager.ts | Tests dead code |
| `work-queue.spec.ts` | work-queue.ts | Active |
| `work-loop.test.ts` | work-loop.ts | Active |
| `work-loop-promise-timeout.spec.ts` | work-loop.ts (promise timeout) | Active |
| `startup-monitor.spec.ts` | startup-monitor.ts | Active |
| `promise-age-tracker.spec.ts` | promise-age-tracker.ts | Active |
| `manifest.spec.ts` | manifest.ts | Active |

### Missing Tests

- `feature.ts` -- No direct unit tests (only integration via `work-loop.test.ts`)
- `health.ts:runHealthChecks` -- No dedicated tests
- Status transition validation -- No tests for invalid transitions (because no validation exists)
- Initiative status update consistency -- No tests verifying all 5 copies produce same results

### Tests That Should Be Removed

- `state-machine.spec.ts` -- Tests dead code (unless integrated per Opportunity 1)
- `heartbeat-monitor.spec.ts` -- Tests dead code
- `recovery-manager.spec.ts` -- Tests dead code

---

## Refactoring Plan

### Phase 1: Foundation (2 hours, LOW risk)

**Tasks:**
1. Extract `createLogger` to `lib/logger.ts`, update all 9 importing files
2. Delete `heartbeat-monitor.ts` and `recovery-manager.ts` (dead code) plus their test files
3. Keep `state-machine.ts` temporarily (reference for Phase 2 design)

**Validation:**
- `pnpm typecheck` passes
- All existing tests pass
- Zero import of deleted modules outside test/index files

### Phase 2: Centralized State Transitions (4 hours, MEDIUM risk)

**Tasks:**
1. Create `lib/feature-transitions.ts` with:
   - `transitionFeatureStatus(feature, manifest, newStatus, options)` function
   - Valid transition map (e.g., `pending -> in_progress`, not `completed -> pending`)
   - Built-in initiative status update
   - Built-in `saveManifest()` call
   - Event emission
2. Replace all 26 `feature.status = "..."` sites with calls to `transitionFeatureStatus()`
3. Delete or archive `state-machine.ts` (its design is now absorbed)
4. Add unit tests for valid/invalid transitions

**Validation:**
- `pnpm typecheck` passes
- All existing tests pass (after updating mocks)
- New tests verify that invalid transitions throw or log errors

### Phase 3: Structural Decomposition (8 hours, MEDIUM risk)

**Tasks:**
1. Split `sandbox.ts` into `sandbox/lifecycle.ts`, `sandbox/install.ts`, `sandbox/git-setup.ts`, `sandbox/review.ts`, `sandbox/keepalive.ts`
2. Create barrel `sandbox/index.ts` re-exporting all public APIs
3. Decompose `feature.ts` into `feature/run-feature.ts`, `feature/pty-session.ts`, `feature/completion-parser.ts`, `feature/git-sync.ts`, `feature/log-stream.ts`
4. Create barrel `feature/index.ts`
5. Extract manifest archiving logic from `manifest.ts` into `manifest/archive.ts`

**Validation:**
- `pnpm typecheck` passes
- All existing tests pass
- No behavior changes (pure structural refactoring)

### Phase 4: Recovery Consolidation (10 hours, HIGH risk)

**Tasks:**
1. Create `lib/recovery-coordinator.ts` that runs a single periodic check combining:
   - Health check (from `health.ts`)
   - Promise timeout (from `promise-age-tracker.ts`)
   - Stuck task detection (from `work-loop.ts`)
   - Phantom completion (from `work-queue.ts`)
2. Each check produces a `RecoveryAction` enum value: `NONE | RESET_TO_PENDING | MARK_COMPLETED | MARK_FAILED | RESTART_SANDBOX`
3. The coordinator applies the action through `transitionFeatureStatus()` (from Phase 2)
4. Remove recovery logic from `work-loop.ts` (simplifying its mainLoop significantly)
5. Add comprehensive integration tests simulating all known failure scenarios

**Validation:**
- `pnpm typecheck` passes
- All existing tests pass
- New integration tests cover: startup hang, PTY timeout, stale heartbeat, phantom completion, deadlock with retry, deadlock without retry, sandbox death during feature

---

## Implementation Checklist

```json
[
  {"content": "Create backup branch before starting refactoring", "priority": "high"},
  {"content": "Extract createLogger to lib/logger.ts (9 files)", "priority": "high"},
  {"content": "Remove dead code: heartbeat-monitor.ts, recovery-manager.ts + tests", "priority": "high"},
  {"content": "Create transitionFeatureStatus in lib/feature-transitions.ts", "priority": "high"},
  {"content": "Replace all 26 feature.status mutation sites", "priority": "high"},
  {"content": "Centralize initiative status update (eliminate 5 copies)", "priority": "high"},
  {"content": "Split sandbox.ts into sandbox/ directory", "priority": "medium"},
  {"content": "Decompose feature.ts into feature/ directory", "priority": "medium"},
  {"content": "Extract manifest archive logic", "priority": "low"},
  {"content": "Create recovery-coordinator.ts", "priority": "low"},
  {"content": "Add transition validation tests", "priority": "high"},
  {"content": "Add recovery integration tests", "priority": "medium"}
]
```

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
# Run orchestrator-specific tests:
pnpm vitest run .ai/alpha/scripts/lib/__tests__/
```

## Notes

- The orchestrator code is in `.ai/alpha/scripts/lib/`, not in the main application. It is tooling infrastructure, not production user-facing code. However, its reliability directly impacts development velocity since failed orchestration runs waste E2B credits and developer time.

- The `FeatureEntry.status` type is persisted in `spec-manifest.json` files. Any change to the status enum values would require migration of existing manifest files. The recommended approach (keeping existing 5 values but routing through a transition function) avoids this problem.

- The `SandboxInstance.status` field (`"ready" | "busy" | "completed" | "failed"`) has a similar problem but is not persisted, so it is less critical. It could benefit from a similar transition function in Phase 4.

- Several bug fix references in comments (e.g., #1786, #1858, #1938) indicate that the heartbeat-monitor and recovery-manager were designed as part of a planned architectural refactor that was never completed. The dead code represents an incomplete migration. The recommended approach is to absorb the useful design principles (centralized transitions, atomic recovery) without using the specific classes.

---
*Generated by Claude Refactoring Analyst*
