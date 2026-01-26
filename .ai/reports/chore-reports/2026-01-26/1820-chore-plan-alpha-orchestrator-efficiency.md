# Chore: Optimize Alpha Orchestrator for Feature-Level Dependencies and Parallel Execution

## Chore Description

The Alpha Orchestrator has significant efficiency bottlenecks that cause sandboxes to sit idle unnecessarily. Analysis of S1815 (user dashboard) shows that 2 of 3 sandboxes are blocked while waiting for dependencies, reducing parallel throughput and extending spec implementation time.

**Root Cause:** The decomposition system currently creates initiative-level dependencies (e.g., features must wait for entire `S1815.I1` to complete) instead of feature-level dependencies. This prevents parallelization even when earlier features in an initiative are already complete.

**Example:** In S1815, features in I2/I3/I4 depend on `S1815.I1` (the entire initiative), but they should only depend on specific features like `S1815.I1.F3` (Responsive Grid Layout). This artificial blocking delays 6+ features that could start immediately after F3 completes.

### Three Improvements

1. **HIGH PRIORITY:** Implement feature-level dependency resolution throughout the decomposition and orchestration system
2. **MEDIUM PRIORITY:** Review intra-initiative dependencies for unnecessary serialization
3. **MEDIUM PRIORITY:** Optimize batch feature assignment when multiple features become available simultaneously

---

## Relevant Files

### Orchestrator Core System
- `.ai/alpha/scripts/spec-orchestrator.ts` - Main orchestrator entry point that orchestrates sandboxes
  - Reviews sandwich initialization, work loop orchestration, completion phases
  - Key bottleneck: Relies on `getNextAvailableFeature()` which respects manifest dependencies

- `.ai/alpha/scripts/lib/work-queue.ts` - Feature queue management and dependency checking
  - **Critical file for this chore:** Contains `getNextAvailableFeature()` at line 59 that checks dependencies
  - Current logic correctly handles feature-level and initiative-level dependencies
  - The problem is manifests are generated with initiative-level deps, not features using them incorrectly

- `.ai/alpha/scripts/lib/work-loop.ts` - Main work loop that assigns features to sandboxes
  - `assignWorkToIdleSandboxes()` function iterates sequentially through instances
  - Currently loops: `for (const instance of instances)` - could batch-assign when multiple features available

- `.ai/alpha/scripts/lib/orchestrator.ts` - Entry point and summary generation
  - Initializes sandboxes, runs work loop, handles completion phase

- `.ai/alpha/scripts/lib/feature.ts` - Feature implementation in sandboxes
  - Runs `/alpha:implement` for each feature
  - Tracks progress and completion

### Manifest & Decomposition System
- `.ai/alpha/specs/S1815-Spec-user-dashboard/spec-manifest.json` - Current manifest showing the blocking pattern
  - Line 203-208: `S1815.I2.F1` depends on `["S1815.I1"]` (entire initiative)
  - This should be `["S1815.I1.F1", "S1815.I1.F3"]` (specific features needed)

- `.claude/commands/alpha/feature-decompose.md` - Feature decomposition command
  - Generates feature entries and dependencies
  - **Where the fix needs to happen:** When outputting feature dependencies, should reference specific features, not entire initiatives

### Supporting Infrastructure
- `.ai/alpha/scripts/lib/manifest.ts` - Manifest loading/saving
  - `generateSpecManifest()` creates manifest from feature directories
  - Validates and persists feature state

- `.github/workflows/alpha-validation.yml` - GitHub CI/CD workflow for branch validation
  - Currently efficient; uses `cancel-in-progress: true`
  - No changes needed here

### Logging & Diagnostics
- `.ai/alpha/logs/` - Orchestrator execution logs showing sandbox behavior
- `.ai/alpha/progress/` - Progress tracking files (overall-progress.json, sbx-a/b/c-progress.json)

### New Files to Create
- `.ai/alpha/specs/<SPEC-ID>/dependency-analysis.md` - Document feature-level dependencies for each spec
  - Will help decomposition command understand which features actually depend on others

---

## Impact Analysis

### Current State (S1815 Analysis)

**Setup:**
- 17 total features across 5 initiatives
- 3 features completed (I1.F1, F2, F3)
- 1 feature in progress (I1.F4 on sbx-a)
- 14 features blocked, waiting for dependencies
- 3 available sandboxes: sbx-a (busy), sbx-b (IDLE), sbx-c (IDLE)

**Problem:** Features in I2/I3/I4 all depend on `S1815.I1` (entire initiative), so they can't start until `S1815.I1.F4` (skeleton loading) finishes. Meanwhile, 2 sandboxes wait idle.

**Estimated Impact:** If dependencies were feature-level:
- 6+ features could start NOW (I2.F1, I2.F2, I3.F1, I3.F2, I3.F4, I4.F1)
- With 3 parallel sandboxes, spec completion would be 2-3x faster
- Estimated from manifest: 127 total tasks → potential 30-40% reduction in wall-clock time

### Scope of Changes

| Component | Scope | Impact |
|-----------|-------|--------|
| Feature Decomposition | Analyze cross-initiative dependencies | High - generates manifests correctly |
| Work Queue | No breaking changes - already supports feature-level deps | Low - just need better input data |
| Feature Assignment | Minor optimization for batch assignment | Medium - improves throughput |
| Manifests | Need regeneration with corrected dependencies | Medium - one-time per spec |

### Dependencies Affected

**Direct Dependencies:**
- `.claude/commands/alpha/feature-decompose.md` - Controls how dependencies are output
- `.ai/alpha/scripts/lib/manifest.ts` - Validates and loads manifests
- `.ai/alpha/scripts/lib/work-queue.ts` - Already supports feature-level dependencies (no change needed)

**Indirect Dependencies:**
- All specs that use Alpha workflow will benefit from this change
- GitHub workflow for alpha-validation should continue working unchanged

### Risk Assessment

**Risk Level: MEDIUM**

**Why Medium, not Low:**
- Changes to dependency resolution affect all specs going forward
- Must ensure backward compatibility with existing manifests
- Feature-level dependencies are more granular and must be carefully analyzed per spec

**Why Medium, not High:**
- Work queue code already supports feature-level dependencies
- Changes are additive, not breaking existing functionality
- Can validate with dry-run mode before executing

**Mitigation:**
- Add comprehensive logging to dependency resolution
- Test with S1815 first before rolling out to other specs
- Add validation in manifest generator to catch circular dependencies
- Preserve ability to handle initiative-level dependencies for simple specs

---

## Backward Compatibility

**Current Situation:**
- Existing manifests use initiative-level dependencies exclusively
- Work queue correctly handles both types (features and initiatives)
- No breaking changes needed

**Migration Path:**
1. Enhance feature decomposition to output feature-level dependencies
2. Add validation to manifest generator
3. Regenerate manifests for existing specs (one-time operation)
4. Add logging to show which specs benefit from finer-grained dependencies

**Deprecation Approach:**
- Initiative-level dependencies remain supported indefinitely
- New specs will use feature-level dependencies by default
- Existing specs can opt-in to regeneration for better parallelism

---

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/alpha-orchestrator-feature-deps`
- [ ] Review orchestrator code for all dependency checks
- [ ] Analyze S1815 manifest to identify which cross-initiative dependencies can be refined
- [ ] Design dependency analyzer that recommends feature-level dependencies
- [ ] Test with S1815 in dry-run mode
- [ ] Create validation tests for circular dependency detection

---

## Documentation Updates Required

- **Technical Docs:**
  - `.ai/alpha/docs/alpha-implementation-system.md` - Update dependency resolution section
  - `.claude/commands/alpha/feature-decompose.md` - Document feature-level dependency output
  - CLAUDE.md - Add notes about Alpha orchestrator optimization

- **Code Comments:**
  - Add comments to `getNextAvailableFeature()` explaining feature vs initiative dependencies
  - Update `getBlockedFeatures()` documentation
  - Add dependency resolution examples to work-queue.ts

- **Architecture Docs:**
  - Create `.ai/alpha/docs/dependency-resolution.md` - Comprehensive guide to how dependencies work

---

## Rollback Plan

**If optimization causes issues:**

1. **Revert to initiative-level dependencies:**
   - Restore `.ai/alpha/specs/S1815-Spec-user-dashboard/spec-manifest.json` from backup
   - Run orchestrator with original manifest
   - Spec will work but at original pace

2. **Disable optimization per-spec:**
   - Add `--use-initiative-deps` flag to orchestrator
   - Allows gradual rollout to new specs only

3. **Monitoring:**
   - Track average feature completion time per sandbox
   - Alert if >30% slowdown compared to baseline
   - Log dependency resolution decisions for debugging

---

## Step by Step Tasks

### Task 1: Analyze Current Dependency Pattern

**Objective:** Document why current approach uses initiative-level dependencies and identify patterns

**Steps:**
- [ ] Read feature decomposition command to understand current logic
- [ ] Review S1815 manifest to map out all feature dependencies
- [ ] Create dependency graph showing initiative vs feature-level opportunities
- [ ] Identify which features have true vs artificial dependencies
- [ ] Document findings in `.ai/alpha/docs/dependency-analysis-S1815.md`

**Output:** Analysis document showing opportunities for 6+ features to parallelize

### Task 2: Design Feature-Level Dependency Analyzer

**Objective:** Create a system to analyze feature code and recommend feature-level dependencies

**Steps:**
- [ ] Design algorithm to analyze feature tasks and identify required imports/types
- [ ] Create `dependency-analyzer.ts` in `.ai/alpha/scripts/lib/`
- [ ] Implement analysis for:
  - TypeScript types/interfaces used by feature
  - Database migrations required
  - External library integrations
  - Component dependencies
- [ ] Add rules to recommend specific features (e.g., if feature uses types from F1, depend on F1)
- [ ] Create unit tests for analyzer

**Output:** Reusable analyzer module with comprehensive test coverage

### Task 3: Enhance Feature Decomposition Command

**Objective:** Update `/alpha:feature-decompose` to output feature-level dependencies

**Steps:**
- [ ] Update `.claude/commands/alpha/feature-decompose.md` to use analyzer
- [ ] Modify feature dependency output to reference specific features
- [ ] Add analysis context to show reasoning (e.g., "depends on F1 for TypeScript types")
- [ ] Maintain backward compatibility with initiative-level fallback
- [ ] Test with S1815 features

**Output:** Feature decomposition generates feature-level dependencies

### Task 4: Enhance Manifest Validator

**Objective:** Ensure manifests with feature-level dependencies are valid

**Steps:**
- [ ] Update manifest validator in `manifest.ts` to:
  - Accept cross-initiative feature references
  - Validate feature references exist before cross-initiative boundaries
  - Detect circular dependencies
  - Calculate correct initiative completion based on feature completion
- [ ] Add comprehensive logging for dependency resolution
- [ ] Create test cases for valid/invalid dependency chains

**Output:** Robust validation that handles feature-level dependencies

### Task 5: Optimize Work Queue Assignment

**Objective:** Batch-assign multiple features when they become available simultaneously

**Steps:**
- [ ] Review `assignWorkToIdleSandboxes()` in work-loop.ts
- [ ] Modify to collect all available features, not just first one
- [ ] Sort available features by priority (global_priority field)
- [ ] Assign to multiple sandboxes in single operation when possible
- [ ] Add metrics to track assignment batching frequency

**Output:** Work loop assigns multiple features in parallel when available

### Task 6: Test with S1815 Dry-Run

**Objective:** Validate optimization without executing full implementation

**Steps:**
- [ ] Regenerate S1815 manifest with feature-level dependencies
- [ ] Run orchestrator with `--dry-run` flag
- [ ] Verify dependency graph shows improved parallelism
- [ ] Compare before/after execution plans
- [ ] Document findings and estimated speedup

**Output:** Before/after comparison showing 2-3x speedup potential

### Task 7: Add Comprehensive Logging

**Objective:** Enable diagnostics and monitoring of dependency resolution

**Steps:**
- [ ] Add structured logging to:
  - `getNextAvailableFeature()` - log why features are available/blocked
  - `assignWorkToIdleSandboxes()` - log feature assignments
  - Dependency analyzer - log analysis decisions
- [ ] Create logs for:
  - Feature assignment history per sandbox
  - Dependency resolution decisions
  - Idle vs busy time per sandbox
- [ ] Add `--debug-deps` flag to orchestrator for detailed logging

**Output:** Rich logging for debugging and monitoring

### Task 8: Create Validation Commands

**Objective:** Ensure optimization is correct with zero regressions

**Steps:**
- [ ] Create test spec (simple 5-feature setup) to validate dependency resolution
- [ ] Test cases:
  - Feature-level dependencies work correctly
  - Initiative-level dependencies still work (backward compat)
  - Circular dependencies are detected
  - Cross-initiative references work
  - Manifest validation is strict
- [ ] Run all validation commands without errors

**Output:** Comprehensive test suite passes

---

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# 1. Verify orchestrator code compiles and types check
pnpm typecheck

# 2. Run linter to catch any code quality issues
pnpm lint:fix

# 3. Test manifest generation with new dependency logic
pnpm --filter @kit/alpha test

# 4. Dry-run orchestrator on S1815 to verify dependency resolution
pnpm --filter @kit/alpha run spec-orchestrator --spec-id S1815 --dry-run --debug-deps > /tmp/s1815-deps.log 2>&1
grep -i "blocked\|available\|assigned" /tmp/s1815-deps.log | head -20

# 5. Verify no features are indefinitely blocked (deadlock detection)
grep "⚠️ No features available" /tmp/s1815-deps.log && echo "ERROR: Deadlock detected" || echo "✓ No deadlock"

# 6. Count feature assignments to verify parallelism improvement
grep -c "assigned to" /tmp/s1815-deps.log

# 7. Format code
pnpm format:fix

# 8. Quick sanity check - ensure old manifests still load
pnpm --filter @kit/alpha run spec-orchestrator --spec-id S1815 --dry-run | grep "Feature Queue" > /dev/null && echo "✓ Manifest loads"

# 9. Verify no TypeScript errors in all modified files
pnpm typecheck -- --noEmit

# 10. Final validation: all changes committed and ready
git status --short
```

---

## Notes

### Why This Matters

The Alpha Orchestrator is the core system for autonomous spec implementation. Current limitations cause:
- **Wasted compute:** 2 of 3 sandboxes idle while waiting for dependencies
- **Slower specs:** 30-40% longer implementation time than theoretical optimum
- **User frustration:** Longer wait for specs to complete

This chore fixes that inefficiency with minimal risk.

### Why Feature-Level Dependencies?

Initiative-level dependencies are a convenience for simplicity, but they're too coarse:
- They block features that don't actually depend on each other
- They create artificial serialization within initiatives
- They ignore cross-cutting concerns (e.g., types can be used across initiatives)

Feature-level dependencies allow more precise scheduling:
- Only block on actual dependencies
- Enable parallel work across initiative boundaries
- Better utilization of available sandboxes

### Optimization Opportunities

After feature-level deps are implemented, consider:
1. **Cost optimization:** Run fewer sandboxes for small specs
2. **Time optimization:** Estimate feature completion time and balance load
3. **Resource optimization:** Monitor CPU/memory and scale dynamically

### Related Issues

- #1815 - S1815 (user dashboard) takes longer than necessary to implement
- Orchestrator efficiency bottlenecks when running multi-initiative specs

### Testing Strategy

The validation is comprehensive because dependency resolution is critical:
- Test forward compatibility (new feature-level deps work)
- Test backward compatibility (old initiative-level deps still work)
- Test edge cases (circular deps, missing features, cross-initiative refs)
- Test performance (no degradation in other use cases)

---

**Prepared by:** Alpha Orchestrator Analysis
**Date:** 2026-01-26
**Spec:** S1815 (user dashboard - 17 features, 5 initiatives)
**Current Status:** 3/17 features complete, 2/3 sandboxes idle
