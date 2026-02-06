# Feature: Phase support (--phase, --base-branch) for Alpha Spec Orchestrator

## Feature Description

Add phase-based execution to the Alpha Spec Orchestrator, allowing large specs to be split into smaller, sequential phases that each execute a subset of initiatives. This addresses the core sizing problem identified in the assessment: S1918 (18 features, 136 tasks) hit 33% completion before deadlocking because the spec was 2x too large for a single orchestration run.

The feature adds:
1. A `phases` definition in the spec manifest that groups initiatives into execution phases
2. A `--phase` CLI flag to run only a specific phase's features
3. A `--base-branch` CLI flag to start a phase from a previously completed phase's branch (branch chaining)
4. Pre-flight validation for phase limits (feature count, dependency depth)
5. Phase-aware branch naming (`alpha/spec-S1918-P1`, `alpha/spec-S1918-P2`)
6. Phase-aware dry-run output and completion summary

## User Story

As a developer running the Alpha orchestrator
I want to split a large spec into phases and run them sequentially
So that each phase has 7-8 features max, improving completion rates from ~33% to ~85-95%

## Problem Statement

The orchestrator currently treats all features in a spec as a single batch. For S1918 (18 features, 136 tasks across 6 initiatives), this caused:
- 33% completion rate (6/18 features) in 78 minutes before deadlock
- 3 sandbox restarts due to 60-minute max age (deep dependency chains = long critical paths)
- 12 features blocked by a single failure (high blast radius)
- Industry consensus (SWE-bench, Devin, Cursor, PARC) recommends 7-10 features max per execution unit

There is no mechanism to run a subset of initiatives, and no way to chain sequential runs where phase 2 starts from phase 1's branch.

## Solution Statement

Add a phase grouping system to the spec manifest and orchestrator CLI that:
1. Groups initiatives into phases (e.g., P1=I1+I2, P2=I3+I4+I5, P3=I6) defined in the spec manifest
2. Filters the feature queue to only include features from the selected phase's initiatives
3. Creates phase-specific branches (`alpha/spec-S1918-P1`) that subsequent phases chain from
4. Validates phase size limits (max 10 features, max 100 tasks, max depth 5) at pre-flight
5. Auto-generates sensible default phases via topological grouping when not explicitly defined

This enables the recommended workflow:
```bash
tsx spec-orchestrator.ts S1918 --phase P1           # Foundation (I1+I2, 7 features)
# Human reviews alpha/spec-S1918-P1
tsx spec-orchestrator.ts S1918 --phase P2 --base-branch alpha/spec-S1918-P1  # Widgets
# Human reviews alpha/spec-S1918-P2
tsx spec-orchestrator.ts S1918 --phase P3 --base-branch alpha/spec-S1918-P2  # Polish
```

## Relevant Files

### Existing Files to Modify

- `.ai/alpha/scripts/types/orchestrator.types.ts` (lines 127-220) - Add `PhaseDefinition` type to `SpecManifest`, add `phase` and `baseBranch` fields to `OrchestratorOptions`
- `.ai/alpha/scripts/cli/index.ts` (lines 26-101, 111-188) - Add `--phase` and `--base-branch` CLI flag parsing, update help text
- `.ai/alpha/scripts/config/constants.ts` - Add phase limit constants (`MAX_FEATURES_PER_PHASE`, `MAX_TASKS_PER_PHASE`, `MAX_DEPENDENCY_DEPTH`)
- `.ai/alpha/scripts/config/index.ts` - Export new constants
- `.ai/alpha/scripts/lib/manifest.ts` (line 481+) - Add phase definitions to manifest generation, add `filterManifestByPhase()` function
- `.ai/alpha/scripts/lib/orchestrator.ts` (lines 263-575) - Integrate phase filtering after manifest load, pass `baseBranch` to `createSandbox()`, phase-aware branch naming
- `.ai/alpha/scripts/lib/sandbox.ts` (lines 890-950) - Accept optional `baseBranch` parameter, use it instead of hardcoded `origin/dev`
- `.ai/alpha/scripts/lib/work-queue.ts` (line 65) - No changes needed -- phase filtering happens upstream in the manifest, so work-queue operates on the already-filtered feature queue

### New Files

- `.ai/alpha/scripts/lib/phase.ts` - Phase filtering, validation, auto-generation, and utility functions
- `.ai/alpha/scripts/lib/__tests__/phase.spec.ts` - Unit tests for phase logic
- `.ai/alpha/scripts/lib/__tests__/phase-integration.spec.ts` - Integration tests for phase filtering with manifest

## Impact Analysis

### Dependencies Affected

- `orchestrator.types.ts` - `SpecManifest` gains optional `phases` field; `OrchestratorOptions` gains optional `phase` and `baseBranch` fields. Both are additive (optional fields).
- `manifest.ts` - Manifest generation adds phase data. Existing manifests without phases continue to work (backward compatible).
- `sandbox.ts` - `createSandbox()` accepts optional `baseBranch`. Default behavior unchanged.
- `orchestrator.ts` - Phase filtering applied after manifest load, before work loop. Non-phase runs unaffected.
- No downstream packages depend on these internal types.

### Risk Assessment

**Medium Risk**:
- Touches 7 files in the orchestrator core
- Adds new CLI flags that must not break existing usage
- Branch naming change could affect reconnection logic
- Phase filtering must correctly handle cross-phase dependencies
- However: all changes are additive (optional fields/flags), existing non-phase runs are unaffected

### Backward Compatibility

- Fully backward compatible -- all new fields are optional
- Running without `--phase` works exactly as before (all features in one batch)
- Existing manifests without `phases` field are valid
- Branch naming without `--phase` remains `alpha/spec-{SPEC_ID}`
- No feature flags needed -- the feature is opt-in via CLI flag

### Performance Impact

- Minimal -- phase filtering is O(n) over the feature queue (typically <20 features)
- Phase validation is O(n*m) where n=features, m=max deps per feature (typically <5)
- No database changes, no bundle size changes, no new dependencies

### Security Considerations

- No authentication/authorization changes
- Branch names are sanitized (alphanumeric + hyphens)
- `--base-branch` input validated against branch naming pattern
- No external API calls introduced

## Pre-Feature Checklist

Before starting implementation:
- [x] Verify that you have read the recommended context documents
- [ ] Create feature branch: `feature/phase-support`
- [x] Review existing similar features for patterns (CLI flags, manifest structure, sandbox.ts branch handling)
- [x] Identify all integration points (7 files)
- [x] Define success metrics
- [x] Confirm feature doesn't duplicate existing functionality (no existing phase mechanism)
- [x] Verify all required dependencies are available (no new deps)
- [ ] Plan feature flag strategy: not needed (opt-in via CLI flag)

## Documentation Updates Required

- Update CLI help text in `cli/index.ts` with `--phase` and `--base-branch` examples
- Update `CLAUDE.md` Alpha Workflow Validation Checklist with phase-related checks
- Add phase examples to `spec-orchestrator.ts` usage examples
- Update comments in `constants.ts` with phase limit rationale
- No user-facing documentation changes (internal tooling)

## Rollback Plan

- Remove `--phase` and `--base-branch` from CLI parsing -- orchestrator falls back to full-spec execution
- Phase field in manifest is optional -- existing manifests unaffected
- `baseBranch` parameter in `createSandbox()` has default fallback to `origin/dev`
- No database migrations, no external service changes
- Monitoring: watch for sandbox creation failures (branch not found) if `--base-branch` is malformed

## Implementation Plan

### Phase 1: Foundation (Types, Constants, Phase Module)

Add the type definitions, constants, and core phase logic:
- `PhaseDefinition` type with initiative grouping
- Phase limit constants
- `phase.ts` module with filtering, validation, and auto-generation functions

### Phase 2: Core Implementation (CLI, Manifest, Orchestrator)

Wire the phase system into the orchestrator pipeline:
- CLI flag parsing for `--phase` and `--base-branch`
- Manifest generation with phase data
- Phase filtering in orchestrator before work loop
- Phase-aware branch naming

### Phase 3: Integration (Sandbox, Dry Run, Summary)

Complete the integration with sandbox creation and output:
- `baseBranch` parameter in `createSandbox()`
- Phase-aware dry-run output
- Phase-aware completion summary
- Unit and integration tests

## Step by Step Tasks

### Step 1: Add phase limit constants

- In `.ai/alpha/scripts/config/constants.ts`, add:
  ```typescript
  /** Maximum features per phase (recommended: 7-8, hard max: 10) */
  export const MAX_FEATURES_PER_PHASE = 10;
  /** Maximum tasks per phase */
  export const MAX_TASKS_PER_PHASE = 100;
  /** Maximum dependency depth within a phase */
  export const MAX_DEPENDENCY_DEPTH = 5;
  ```
- In `.ai/alpha/scripts/config/index.ts`, export the new constants

### Step 2: Add type definitions

- In `.ai/alpha/scripts/types/orchestrator.types.ts`:
  - Add `PhaseDefinition` interface:
    ```typescript
    export interface PhaseDefinition {
      id: string;                    // P1, P2, P3
      name: string;                  // "Foundation", "Widgets", "Polish"
      initiative_ids: string[];      // ["S1918.I1", "S1918.I2"]
      feature_count: number;         // Computed from initiative features
      task_count: number;            // Computed from initiative tasks
    }
    ```
  - Add optional `phases?: PhaseDefinition[]` field to `SpecManifest`
  - Add optional `phase?: string` and `baseBranch?: string` fields to `OrchestratorOptions`

### Step 3: Create phase module

- Create `.ai/alpha/scripts/lib/phase.ts` with:
  - `autoGeneratePhases(manifest: SpecManifest): PhaseDefinition[]` -- groups initiatives into phases of 7-8 features using topological sort respecting initiative dependencies
  - `filterManifestByPhase(manifest: SpecManifest, phaseId: string): SpecManifest` -- returns a copy of the manifest with `feature_queue` and `initiatives` filtered to only include the selected phase's initiatives. Updates `progress.features_total` and `progress.tasks_total` accordingly
  - `validatePhase(manifest: SpecManifest, phaseId: string): { valid: boolean; errors: string[] }` -- checks feature count <= MAX_FEATURES_PER_PHASE, task count <= MAX_TASKS_PER_PHASE, dependency depth <= MAX_DEPENDENCY_DEPTH, and that no features in this phase depend on features in a later phase
  - `getPhaseIds(manifest: SpecManifest): string[]` -- returns available phase IDs
  - `getPhaseBranchName(specId: string, phaseId: string): string` -- returns `alpha/spec-{specId}-{phaseId}`
  - `calculateDependencyDepth(featureQueue: FeatureEntry[]): number` -- BFS/DFS to find max dependency chain depth

### Step 4: Add CLI flag parsing

- In `.ai/alpha/scripts/cli/index.ts`:
  - Add default values: `phase: undefined, baseBranch: undefined` to `OrchestratorOptions` initialization
  - Add parsing for `--phase <id>` (e.g., `--phase P1`)
  - Add parsing for `--base-branch <branch>` (e.g., `--base-branch alpha/spec-S1918-P1`)
  - Add validation: `--base-branch` requires `--phase` (warn if used without)
  - Update `showHelp()` with new flags, examples, and phase workflow documentation

### Step 5: Integrate phase filtering into orchestrator

- In `.ai/alpha/scripts/lib/orchestrator.ts`, after manifest load (~line 319) and before pre-flight checks:
  1. If `options.phase` is set:
     - Auto-generate phases if `manifest.phases` is missing: call `autoGeneratePhases(manifest)` and save
     - Validate phase exists: check `options.phase` against `manifest.phases`
     - Validate phase limits: call `validatePhase(manifest, options.phase)`
     - Filter manifest: call `filterManifestByPhase(manifest, options.phase)`
     - Log phase info: feature count, task count, initiative names
  2. If `options.phase` is not set, no changes (existing behavior)

### Step 6: Add phase-aware branch naming to sandbox

- In `.ai/alpha/scripts/lib/sandbox.ts`:
  - Add optional `baseBranch?: string` parameter to `createSandbox()` function signature
  - Pass `baseBranch` from `OrchestratorOptions` through `orchestrator.ts` to `createSandbox()`
  - Change branch creation logic (lines 931-937):
    - If `options.phase` is set: use `getPhaseBranchName(specId, phase)` for branch name
    - If `options.baseBranch` is set: replace `origin/dev` with `origin/{baseBranch}` as the fork point
    - If neither is set: existing behavior (`alpha/spec-{specId}` from `origin/dev`)
  - Update the lockfile diff comparison (line 960-961) to use `baseBranch` instead of hardcoded `origin/dev`

### Step 7: Update manifest generation for phases

- In `.ai/alpha/scripts/lib/manifest.ts`:
  - After building the feature queue in `generateSpecManifest()`, call `autoGeneratePhases()` and include `phases` field in the returned manifest
  - This ensures phases are always available in newly generated manifests
  - Existing manifests loaded from disk will get phases auto-generated on first phase run (Step 5)

### Step 8: Update dry-run and summary output

- In `.ai/alpha/scripts/lib/orchestrator.ts`:
  - In `printDryRun()`: add phase info header showing which phase is being run, initiative names, and feature/task counts
  - In `printSummary()`: add phase completion info
  - In the pre-work-loop status log (lines 541-568): show phase context

### Step 9: Write unit tests

- Create `.ai/alpha/scripts/lib/__tests__/phase.spec.ts`:
  - Test `autoGeneratePhases()`:
    - 6 initiatives with dependencies → correct grouping into 2-3 phases
    - Single initiative → single phase
    - No dependencies → all initiatives in one phase (if under limit)
    - Initiatives exceeding feature limit → split into multiple phases
  - Test `filterManifestByPhase()`:
    - P1 filter → only I1+I2 features remain
    - P2 filter → only I3+I4+I5 features remain
    - Invalid phase → error
    - Cross-phase dependencies marked correctly (deps on earlier phase are treated as "satisfied" since that phase already ran)
  - Test `validatePhase()`:
    - Within limits → valid
    - Exceeds feature count → error
    - Exceeds task count → error
    - Exceeds dependency depth → error
    - Dependencies on later phase → error
  - Test `getPhaseBranchName()`:
    - Standard: `alpha/spec-S1918-P1`
    - Edge cases: numeric spec IDs
  - Test `calculateDependencyDepth()`:
    - Linear chain → depth = chain length
    - Diamond pattern → correct depth
    - No deps → depth = 0

### Step 10: Write integration tests

- Create `.ai/alpha/scripts/lib/__tests__/phase-integration.spec.ts`:
  - Test full pipeline: generate manifest → auto-generate phases → filter by phase → verify feature queue
  - Test CLI parsing: `--phase P1 --base-branch alpha/spec-S1918-P1` → correct OrchestratorOptions
  - Test backward compatibility: no `--phase` flag → manifest unchanged, full feature queue

### Step 11: Run validation commands

- Run all validation commands listed below to confirm zero regressions

## Testing Strategy

### Unit Tests

- `phase.spec.ts`: Test all 6 functions in the phase module independently with mock manifests
- Mock `SpecManifest` objects with varying initiative counts, dependency structures, and feature sizes
- Test edge cases: empty phases, single initiative, max-size phases, circular cross-phase deps

### Integration Tests

- `phase-integration.spec.ts`: Test phase filtering applied to real S1918-style manifest structures
- Test CLI argument parsing round-trip (args → options → phase filter → filtered manifest)
- Test that work-queue `getNextAvailableFeature()` respects filtered feature queue

### E2E Tests

- Not applicable -- this is internal tooling (orchestrator scripts), not user-facing
- Manual validation: run `--dry-run --phase P1` against S1918 and verify correct feature subset

### Edge Cases

- `--phase` without phases defined in manifest → auto-generate phases
- `--phase P99` (invalid phase) → clear error message
- `--base-branch` with non-existent branch → sandbox creation error (handled by existing retry logic)
- `--base-branch` without `--phase` → warning, use base-branch as fork point with standard branch naming
- Phase with 0 features (all completed in previous run) → skip to completion
- Cross-phase initiative dependencies → features in current phase that depend on previous-phase initiatives should have deps treated as "satisfied" (they were completed in the previous run)
- Reconnection with phase: existing sandbox has phase-specific branch → reconnect works
- Phase with requires_database features → serialization still works within phase

## Acceptance Criteria

1. `tsx spec-orchestrator.ts S1918 --phase P1 --dry-run` shows only P1's features (I1+I2)
2. `tsx spec-orchestrator.ts S1918 --phase P2 --base-branch alpha/spec-S1918-P1 --dry-run` shows P2's features (I3+I4+I5) forking from P1's branch
3. Running without `--phase` works exactly as before (full spec, single batch)
4. Auto-generated phases group initiatives into batches of 7-8 features max
5. Phase validation rejects phases with >10 features or >100 tasks
6. Phase branch naming follows `alpha/spec-{specId}-{phaseId}` pattern
7. All existing orchestrator tests pass without modification
8. TypeScript compiles with zero errors
9. New tests cover phase module at >90% branch coverage

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

```bash
# TypeScript compilation
cd .ai/alpha/scripts && npx tsc --noEmit

# Run all orchestrator unit tests
cd .ai/alpha/scripts && npx vitest run lib/__tests__/

# Run phase-specific tests
cd .ai/alpha/scripts && npx vitest run lib/__tests__/phase.spec.ts
cd .ai/alpha/scripts && npx vitest run lib/__tests__/phase-integration.spec.ts

# Verify new constants are exported
grep -n "MAX_FEATURES_PER_PHASE\|MAX_TASKS_PER_PHASE\|MAX_DEPENDENCY_DEPTH" .ai/alpha/scripts/config/constants.ts

# Verify new types exist
grep -n "PhaseDefinition\|phase?\|baseBranch?" .ai/alpha/scripts/types/orchestrator.types.ts

# Verify CLI flags are parsed
grep -n "phase\|base-branch\|baseBranch" .ai/alpha/scripts/cli/index.ts

# Verify phase module exists and exports
grep -n "export function" .ai/alpha/scripts/lib/phase.ts

# Verify sandbox accepts baseBranch
grep -n "baseBranch" .ai/alpha/scripts/lib/sandbox.ts

# Dry-run smoke test (if S1918 spec exists)
cd .ai/alpha/scripts && npx tsx spec-orchestrator.ts S1918 --dry-run --phase P1 2>&1 | head -30
```

## Notes

- **No new dependencies required** -- this feature uses only existing Node.js and TypeScript capabilities
- **Phase auto-generation algorithm**: Group initiatives in priority order, accumulating features until the next initiative would exceed `MAX_FEATURES_PER_PHASE`. This respects initiative boundaries (no splitting an initiative across phases) and dependency order (initiatives are already priority-sorted by their dependencies).
- **Cross-phase dependency handling**: When running phase P2 with `--base-branch alpha/spec-S1918-P1`, features in P2 that depend on P1 initiatives will have those dependencies pre-satisfied because P1's code is already in the base branch. The `filterManifestByPhase()` function marks previous-phase initiative dependencies as "satisfied" by adding them to the completed set.
- **Interaction with other chores**: This feature is independent of P1 (centralized state transitions), P2 (dead code removal), P3 (runtime status validation), and Q2 (stagger reduction). Can be implemented in parallel.
- **Expected reliability impact** (from assessment report): Completion rate improves from ~33% to ~85-95% per phase, sandbox restarts drop from 3/run to 0-1/phase, blast radius limited to single phase.
- **Future enhancement**: A `--auto-phase` flag that automatically runs all phases sequentially with branch chaining, creating a fully autonomous multi-phase execution.
