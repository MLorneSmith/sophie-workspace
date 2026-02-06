# Chore: Centralize feature status transitions in Alpha orchestrator

## Chore Description

Refactor 20 direct `feature.status = "string"` mutations across 7 files and 11 `initiative.status = "string"` mutations across 5 files into a single centralized `transitionFeatureStatus()` function with validation, initiative status cascade, and atomic manifest persistence.

This is the **P1 root cause fix** identified in the [comprehensive assessment](.ai/reports/research-reports/2026-02-06/alpha-orchestrator-comprehensive-assessment.md). The current distributed state management is the root cause of 8+ recurring bugs (#1777, #1782, #1786, #1841, #1858, #1938, #1948, #1952) where features end up in inconsistent or unrecoverable states.

A `FeatureStateMachine` class (438 lines in `state-machine.ts`) was designed as part of bug fix #1786 but was **never integrated** -- zero runtime imports. The existing code uses raw `feature.status = "pending"` assignments scattered across 7 files with no validation.

### Key Problem

```
feature.ts:761      feature.status = status;        // dynamic value, could be anything
work-loop.ts:825    feature.status = "pending";      // no check if transition is valid
health.ts:305       feature.status = "pending";      // competing with work-loop
deadlock-handler.ts:102  feature.status = "completed"; // competing with feature.ts
```

Each recovery system independently mutates status without coordination, creating race conditions and invalid state transitions (e.g., `completed -> pending`).

## Relevant Files

### Files with direct `feature.status` mutations (must be modified)

- `.ai/alpha/scripts/lib/feature.ts` (932 lines) - 3 mutations: `in_progress` (line 178), dynamic (line 761), `failed` (line 899). Also 2 initiative status mutations.
- `.ai/alpha/scripts/lib/work-loop.ts` (1127 lines) - 6 mutations: `pending` (lines 825, 1001, 1027), `failed` (lines 836, 1037), `completed` (line 896). Also 2 initiative status mutations.
- `.ai/alpha/scripts/lib/work-queue.ts` (573 lines) - 4 mutations: `failed` (line 114), `in_progress` (line 245), `pending` (lines 304, 517). Also 3 initiative status mutations.
- `.ai/alpha/scripts/lib/health.ts` (350 lines) - 2 mutations: `pending` (line 305), `failed` (line 333).
- `.ai/alpha/scripts/lib/deadlock-handler.ts` (486 lines) - 3 mutations: `completed` (line 102), `pending` (line 345), `failed` (line 366). Also 3 initiative status mutations.
- `.ai/alpha/scripts/lib/orchestrator.ts` (932 lines) - 1 mutation: `completed` (line 800). Also 1 initiative status mutation.
- `.ai/alpha/scripts/lib/recovery-manager.ts` (414 lines) - 2 mutations: `failed` (line 190), `pending` (line 217). **Note**: This is dead code but still has mutations to address.

### Type definitions (must be modified)

- `.ai/alpha/scripts/types/orchestrator.types.ts` - `FeatureEntry.status` type (line 86): `"pending" | "in_progress" | "completed" | "failed" | "blocked"`. `InitiativeEntry.status` type (line 110): `"pending" | "in_progress" | "completed" | "failed" | "partial"`.

### Reference/design files (read-only)

- `.ai/alpha/scripts/lib/state-machine.ts` (438 lines) - Existing unused state machine. Use as design reference for transition guards, then delete after absorbing design.
- `.ai/alpha/scripts/lib/manifest.ts` (1192 lines) - `saveManifest()` function called after mutations. The new transition function should internalize this call.
- `.ai/alpha/scripts/lib/index.ts` - Barrel exports. Must add new exports and remove state-machine exports after migration.

### Test files (must be modified/created)

- `.ai/alpha/scripts/lib/__tests__/state-machine.spec.ts` - Existing tests for dead code. Repurpose for new transition function tests.
- `.ai/alpha/scripts/lib/__tests__/work-loop.test.ts` - Active tests that mock `saveManifest`. May need updates for new transition function.
- `.ai/alpha/scripts/lib/__tests__/work-loop-promise-timeout.spec.ts` - Active tests with `saveManifest` mocks.
- `.ai/alpha/scripts/lib/__tests__/work-queue.spec.ts` - Active tests with `saveManifest` mocks.
- `.ai/alpha/scripts/lib/__tests__/orchestrator-stall-prevention.spec.ts` - Direct `feature.status = "failed"` in tests.
- `.ai/alpha/scripts/lib/__tests__/orchestrator-error-handler.spec.ts` - Multiple direct `feature.status = "failed"` in tests.
- `.ai/alpha/scripts/lib/__tests__/recovery-manager.spec.ts` - Tests dead code. Delete along with module.

### New Files

- `.ai/alpha/scripts/lib/feature-transitions.ts` - New centralized transition function with validation, initiative cascade, and manifest persistence.
- `.ai/alpha/scripts/lib/__tests__/feature-transitions.spec.ts` - Unit tests for valid/invalid transitions.

## Impact Analysis

### Dependencies Affected

- **All 7 files with status mutations** will change from `feature.status = "x"` to `transitionFeatureStatus(feature, manifest, "x", { reason: "..." })`. This is a mechanical replacement at each call site.
- **Test files** (7 files) that mock `saveManifest` or directly set `feature.status` in test fixtures will need updates.
- **`index.ts` barrel** needs new exports added and old state-machine exports updated.
- **No external consumers** -- this is internal tooling. No packages, scripts, or CI depend on the internal status mutation pattern.

### Risk Assessment

**MEDIUM Risk** -- Touches 7+ source files in core orchestrator path, but each change is mechanical (replace direct assignment with function call). The TypeScript compiler will catch any missed mutation sites through type narrowing. The biggest risk is subtle timing changes from consolidating `saveManifest()` calls.

### Backward Compatibility

- **`spec-manifest.json` format**: No change. Status values remain `"pending" | "in_progress" | "completed" | "failed" | "blocked"`. No migration needed.
- **Runtime behavior**: Identical to current behavior for valid transitions. Invalid transitions (which currently succeed silently and cause bugs) will be logged as warnings and prevented.
- **`"blocked"` status**: Currently can be written by external agents (GPT bug #1952). The transition function will remap `"blocked"` to `"failed"` with a warning log.

## Pre-Chore Checklist

- [ ] Create feature branch: `chore/centralized-state-transitions`
- [ ] Verify all existing tests pass: `pnpm vitest run .ai/alpha/scripts/lib/__tests__/`
- [ ] Verify typecheck passes: `pnpm typecheck`
- [ ] Confirm exact line numbers of all 20 feature.status mutations (may shift from recent commits)
- [ ] Confirm exact line numbers of all 11 initiative.status mutations

## Documentation Updates Required

- **MEMORY.md**: Update "26 direct mutations" to reflect the new centralized approach after completion
- **Alpha orchestrator assessment**: Reference this chore as completed in the unified recommendations
- No user-facing documentation changes (internal tooling)
- Code comments in `feature-transitions.ts` documenting the valid transition map and rationale

## Rollback Plan

- **Git revert**: All changes are in a single branch. `git revert` the merge commit to restore previous behavior.
- **No database migrations**: No data schema changes.
- **No config changes**: No environment variables or infrastructure changes.
- **Monitoring**: Run a test spec (small, 2-3 features) through the orchestrator after merging. Watch for:
  - Features stuck in `in_progress` (transition validation too strict)
  - Features not progressing (missing transition path)
  - Excessive warning logs (transition rejections that should be allowed)

## Step by Step Tasks

### Step 1: Create `feature-transitions.ts` with centralized transition logic

- Create `.ai/alpha/scripts/lib/feature-transitions.ts`
- Define valid transition map as a constant:
  ```typescript
  const VALID_FEATURE_TRANSITIONS: Record<FeatureStatus, FeatureStatus[]> = {
    pending: ["in_progress", "failed"],
    in_progress: ["pending", "completed", "failed"],
    completed: [],  // terminal state -- no transitions out
    failed: ["pending"],  // retry path only
    blocked: ["failed", "pending"],  // remap path for agent-written status
  };
  ```
- Export `FeatureStatus` type: `"pending" | "in_progress" | "completed" | "failed" | "blocked"` (same as existing `FeatureEntry.status`)
- Implement `transitionFeatureStatus(feature, manifest, newStatus, options)`:
  - **Validate** the transition against `VALID_FEATURE_TRANSITIONS`
  - If invalid: log warning with `from -> to` context, feature ID, and caller reason. **Do not throw** -- return `false` to avoid breaking the orchestrator. Log enough detail to diagnose.
  - If valid: set `feature.status = newStatus`
  - Handle side effects based on new status:
    - If `"pending"`: clear `feature.assigned_sandbox`, clear `feature.assigned_at`, clear `feature.error`
    - If `"in_progress"`: set `feature.assigned_at = Date.now()` (if not already set by caller)
    - If `"failed"`: increment `feature.retry_count` (if not already incremented by caller)
  - **Update initiative status**: Find the parent initiative, count completed/failed/pending features, update `initiative.status` and `initiative.features_completed`. This replaces the 5 duplicate implementations.
  - **Call `saveManifest(manifest)`** once after all mutations
  - Return `{ success: boolean, previousStatus: string, newStatus: string }`
- Export `transitionInitiativeStatus(initiative, manifest, newStatus, options)` for the few cases where initiative status is set independently (deadlock-handler line 222 sets `initiative.status = "failed"` directly)
- Export `updateInitiativeStatusFromFeatures(initiative, features, manifest)` as the centralized version of the 5 duplicated initiative-update patterns

### Step 2: Update `feature.ts` to use centralized transitions

- **Line 178**: Replace `feature.status = "in_progress"; saveManifest(manifest);` with `transitionFeatureStatus(feature, manifest, "in_progress", { reason: "feature execution starting" })`
- **Lines 688-761**: The `finalizeFeatureCompletion` block computes a `status` variable from progress file analysis, then sets `feature.status = status` at line 761 followed by initiative update logic. Replace the entire block from `feature.status = status` through `saveManifest(manifest)` with a single `transitionFeatureStatus(feature, manifest, status, { reason: "feature completion finalization" })` call. This also replaces the initiative status update at lines 791/794.
- **Line 899**: Replace `feature.status = "failed"; saveManifest(manifest);` with `transitionFeatureStatus(feature, manifest, "failed", { reason: "unhandled exception in feature execution" })`
- Remove `import { saveManifest }` if it's no longer used directly in this file
- Remove the inline initiative status update code (lines ~777-795) -- now handled by `transitionFeatureStatus`

### Step 3: Update `work-loop.ts` to use centralized transitions

- **Line 825**: `feature.status = "pending"` (promise timeout retry) -> `transitionFeatureStatus(feature, this.manifest, "pending", { reason: "promise timeout retry" })`
- **Line 836**: `feature.status = "failed"` (promise timeout max retries) -> `transitionFeatureStatus(feature, this.manifest, "failed", { reason: "promise timeout max retries exceeded" })`
- **Line 896**: `feature.status = "completed"` (PTY fallback) -> `transitionFeatureStatus(feature, this.manifest, "completed", { reason: "PTY fallback - progress file shows completed" })`
- **Line 1001**: `feature.status = "pending"` (reset for reassignment) -> `transitionFeatureStatus(feature, this.manifest, "pending", { reason: "reset for reassignment after error" })`
- **Line 1027**: `feature.status = "pending"` (retry on sandbox death) -> `transitionFeatureStatus(feature, this.manifest, "pending", { reason: "retry after sandbox death" })`
- **Line 1037**: `feature.status = "failed"` (sandbox death max retries) -> `transitionFeatureStatus(feature, this.manifest, "failed", { reason: "sandbox death max retries exceeded" })`
- Remove the `updateInitiativeStatus()` method (lines ~1053-1071) -- replaced by cascade in `transitionFeatureStatus`
- Remove associated `saveManifest` calls that immediately follow status mutations (they are now inside the transition function)

### Step 4: Update `work-queue.ts` to use centralized transitions

- **Line 114**: `feature.status = "failed"` (stale in_progress with error) -> `transitionFeatureStatus(feature, manifest, "failed", { reason: "stale in_progress with error for >60s" })`
- **Line 245**: `feature.status = "in_progress"` (claim feature) -> `transitionFeatureStatus(feature, manifest, "in_progress", { reason: "feature claimed by sandbox" })`. **Note**: This call site also sets `feature.assigned_sandbox` and `feature.assigned_at` -- ensure these are set before calling transition, or let the transition function handle them.
- **Line 304**: `feature.status = "pending"` (cleanup stale) -> `transitionFeatureStatus(feature, manifest, "pending", { reason: "cleanup stale assignment" })`
- **Line 517**: `feature.status = "pending"` (reset failed for retry) -> `transitionFeatureStatus(feature, manifest, "pending", { reason: "reset failed feature for retry" })`
- Remove the initiative status update block in `cleanupStaleState` (lines ~334-354) -- replaced by cascade
- Remove associated `saveManifest` calls

### Step 5: Update `health.ts` to use centralized transitions

- **Line 305**: `feature.status = "pending"` (health check recovery) -> `transitionFeatureStatus(feature, manifest, "pending", { reason: "health check recovery - retrying" })`
- **Line 333**: `feature.status = "failed"` (health check max retries) -> `transitionFeatureStatus(feature, manifest, "failed", { reason: "health check failed - max retries exceeded" })`
- Remove associated `saveManifest` calls

### Step 6: Update `deadlock-handler.ts` to use centralized transitions

- **Line 102**: `feature.status = "completed"` (phantom completion) -> `transitionFeatureStatus(feature, manifest, "completed", { reason: "phantom completion detected - tasks_completed >= task_count" })`
- **Line 345**: `feature.status = "pending"` (orphaned in_progress) -> `transitionFeatureStatus(feature, manifest, "pending", { reason: "orphaned in_progress feature reset" })`
- **Line 366**: `feature.status = "failed"` (orphaned max retries) -> `transitionFeatureStatus(feature, manifest, "failed", { reason: "orphaned feature max retries exceeded" })`
- Remove the initiative status update blocks (lines ~107-127, ~222) -- replaced by cascade
- Remove associated `saveManifest` calls
- **Line 222**: `initiative.status = "failed"` -- use `transitionInitiativeStatus(initiative, manifest, "failed", { reason: "deadlock recovery: max retries exceeded" })`

### Step 7: Update `orchestrator.ts` to use centralized transitions

- **Line 800**: `feature.status = "completed"` (emergency fast-fail debug mode) -> `transitionFeatureStatus(feature, manifest, "completed", { reason: "ALL_FEATURES_FAST_FAIL debug mode" })`
- Remove initiative status update at line ~824
- Remove associated `saveManifest` call

### Step 8: Handle dead code in `recovery-manager.ts`

- **Option A (recommended)**: Delete `recovery-manager.ts` entirely. It is dead code with zero runtime imports. Also delete `__tests__/recovery-manager.spec.ts`.
- **Option B**: If keeping for reference, at minimum replace its 2 mutations (lines 190, 217) with the centralized function. But deletion is preferred since we're building the proper replacement.

### Step 9: Clean up `state-machine.ts`

- Delete `state-machine.ts` -- its design has been absorbed into `feature-transitions.ts`
- Delete `__tests__/state-machine.spec.ts`
- Delete `heartbeat-monitor.ts` (dead code, zero runtime imports)
- Delete `__tests__/heartbeat-monitor.spec.ts`
- Update `index.ts`:
  - Remove exports from `state-machine.js` (lines 185-201)
  - Remove exports from `heartbeat-monitor.js` and `recovery-manager.js` if present
  - Add exports from `feature-transitions.js`: `transitionFeatureStatus`, `updateInitiativeStatusFromFeatures`, `VALID_FEATURE_TRANSITIONS`, `FeatureStatus`

### Step 10: Update test files

- **Repurpose `state-machine.spec.ts`** into `feature-transitions.spec.ts`:
  - Test all valid transitions: `pending -> in_progress`, `in_progress -> completed`, `in_progress -> failed`, `in_progress -> pending`, `failed -> pending`, `blocked -> failed`
  - Test all invalid transitions: `completed -> pending`, `completed -> in_progress`, `pending -> completed` (must go through `in_progress` first)
  - Test initiative cascade: when feature transitions to `completed`, verify initiative status is updated correctly
  - Test `saveManifest` is called exactly once per transition
  - Test warning log for invalid transitions (returns false, does not throw)
  - Test `"blocked"` remapping: `blocked -> failed` with warning
  - Test side effects: `assigned_sandbox` cleared on `pending`, `retry_count` incremented on `failed`
- **Update `work-loop.test.ts`**: Replace `saveManifest` mocks with `transitionFeatureStatus` mocks where applicable
- **Update `work-loop-promise-timeout.spec.ts`**: Similar mock updates
- **Update `work-queue.spec.ts`**: Similar mock updates
- **Update `orchestrator-stall-prevention.spec.ts`**: Replace direct `feature.status = "failed"` with proper mock setup
- **Update `orchestrator-error-handler.spec.ts`**: Replace direct `feature.status = "failed"` with proper mock setup
- **Delete `recovery-manager.spec.ts`**: Dead code tests
- **Delete `heartbeat-monitor.spec.ts`**: Dead code tests

### Step 11: Run validation commands

- Run full validation suite (see Validation Commands below)
- Verify zero `feature.status =` assignments remain outside of `feature-transitions.ts`
- Verify zero `initiative.status =` assignments remain outside of `feature-transitions.ts`
- Verify all tests pass with no regressions

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# 1. Type safety
pnpm typecheck

# 2. Linting
pnpm lint:fix

# 3. Formatting
pnpm format:fix

# 4. Run orchestrator-specific tests
pnpm vitest run .ai/alpha/scripts/lib/__tests__/

# 5. Verify no direct feature.status mutations remain outside transition function
# Should return ONLY feature-transitions.ts (and test fixtures if any)
grep -rn 'feature\.status\s*=' .ai/alpha/scripts/lib/ --include='*.ts' | grep -v '__tests__' | grep -v 'feature-transitions.ts'
# Expected: NO output (all mutations should be through centralized function)

# 6. Verify no direct initiative.status mutations remain outside transition function
grep -rn 'initiative\.status\s*=' .ai/alpha/scripts/lib/ --include='*.ts' | grep -v '__tests__' | grep -v 'feature-transitions.ts'
# Expected: NO output

# 7. Verify dead code files are removed
test ! -f .ai/alpha/scripts/lib/state-machine.ts && echo "PASS: state-machine.ts deleted"
test ! -f .ai/alpha/scripts/lib/heartbeat-monitor.ts && echo "PASS: heartbeat-monitor.ts deleted"
test ! -f .ai/alpha/scripts/lib/recovery-manager.ts && echo "PASS: recovery-manager.ts deleted"

# 8. Verify new transition function exists and is exported
grep -q 'transitionFeatureStatus' .ai/alpha/scripts/lib/feature-transitions.ts && echo "PASS: transition function exists"
grep -q 'transitionFeatureStatus' .ai/alpha/scripts/lib/index.ts && echo "PASS: transition function exported"
```

## Notes

- **Do not use the `FeatureStateMachine` class directly.** The existing class maintains its own `Map<string, FeatureState>` which duplicates state already stored in the manifest's `FeatureEntry` objects. A simpler function-based approach that validates transitions against the existing `feature.status` field avoids dual-state synchronization bugs.

- **`saveManifest()` consolidation is a subtle change.** Currently some code paths call `saveManifest()` multiple times in sequence (e.g., set feature status, save, then set initiative status, save again). The new transition function should call `saveManifest()` exactly once after all mutations are complete. This is a behavioral improvement but should be tested carefully -- some code may rely on intermediate saves being visible to concurrent async operations within the same process.

- **The `"blocked"` status value** should remain in the `FeatureEntry.status` type for backward compatibility with existing manifest files, but `transitionFeatureStatus` should reject transitions TO `"blocked"` (only allow transitions FROM `"blocked"` to `"failed"` or `"pending"`). This prevents the #1952 bug where a GPT agent wrote `"blocked"` as a status.

- **Test fixtures** in `__tests__/` files that set `feature.status` directly for test setup are acceptable and do not need to go through the transition function. The grep validation in Step 11 excludes `__tests__/` for this reason.

- **`recovery-manager.ts` deletion**: This is dead code with zero runtime imports. Its tests pass but test unused code. Removing it reduces cognitive overhead and eliminates 414 lines + ~200 lines of tests. The useful design principles (atomic recovery, process cleanup before retry) are absorbed into the transition function's side effects.

- **Estimated effort**: 3-4 hours for the mechanical replacement + 1-2 hours for test updates = 4-6 hours total.
