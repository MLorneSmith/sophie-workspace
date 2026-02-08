# Bug Fix: Alpha Orchestrator Circular Dependency Hang

**Related Diagnosis**: #1914 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Feature S1890.I5.F2 has itself listed in its dependencies array, creating an unsatisfiable circular dependency that blocks execution
- **Fix Approach**: Add multi-layer cycle detection (manifest generation, orchestrator pre-flight, work queue runtime) to catch and prevent circular dependencies
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Spec Orchestrator hung indefinitely (25+ minutes) while implementing S1890 because feature S1890.I5.F2 contains a self-reference in its dependencies array:

```json
{
  "id": "S1890.I5.F2",
  "dependencies": [
    "S1890.I1.F1",
    "S1890.I2.F1",
    "S1890.I2.F2",
    "S1890.I5.F1",
    "S1890.I5.F2"  // ⛔ CIRCULAR: Feature depends on ITSELF!
  ]
}
```

This caused the work queue to mark the feature as "waiting on dependencies" indefinitely, preventing the feature from ever becoming available for processing. All 3 sandboxes became idle, and the orchestrator continued looping with no progress.

For full details, see diagnosis issue #1914.

### Solution Approaches Considered

#### Option 1: Add Cycle Detection at Manifest Generation ⭐ RECOMMENDED

**Description**: Validate dependency graph immediately after manifest generation (Pass 2) in `generate-spec-manifest.ts`. This catches invalid manifests before orchestration begins, preventing bad data from ever reaching the work queue.

**Pros**:
- **Fail-fast**: Catches errors at the source (manifest generation) before orchestration starts
- **Most preventive**: Stops invalid manifests from being created in the first place
- **Clearest feedback**: User immediately knows the manifest is invalid when generating it
- **Best DX**: Developers see the error during spec generation, not 25+ minutes into orchestration
- **Lowest overhead**: One validation pass during generation, not repeated during orchestration

**Cons**:
- Requires modifying the manifest generation script
- Slightly slower manifest generation (but negligible - validation is O(n²) on feature count)

**Risk Assessment**: low - Pure validation logic, no side effects

**Complexity**: moderate - Need to implement cycle detection algorithm (DFS or similar)

#### Option 2: Add Pre-Flight Check in Orchestrator

**Description**: Validate the entire dependency graph before starting feature orchestration in `spec-orchestrator.ts`.

**Pros**:
- Catches manifests with cycles before work begins
- Can provide detailed cycle analysis in output
- Orchestrator remains the single source of truth for validation

**Cons**:
- Error occurs after orchestration has started (less ideal DX)
- More expensive than checking at generation time
- Still doesn't prevent invalid manifests from being generated in the first place
- Users still have to regenerate the manifest after fixing the issue

**Why Not Chosen**: Option 1 is better because it catches the error earlier in the workflow. Ideally, we prevent invalid manifests from being generated at all.

#### Option 3: Add Runtime Guard in Work Queue Only

**Description**: Add a defensive check in `getNextAvailableFeature()` to skip features with self-references and log a warning.

**Pros**:
- Defense-in-depth: Catches any circular dependencies that slip through
- Minimal code change
- Prevents the hang even if earlier validations fail

**Cons**:
- Doesn't prevent the hang, just works around it (features still won't complete)
- No clear feedback to user about what's wrong
- Features silently get skipped, orphaning dependent features
- Doesn't fix the root issue (invalid manifest still gets created)

**Why Not Chosen**: This is a band-aid, not a fix. We need to prevent invalid manifests from being created in the first place.

### Selected Solution: Multi-Layer Approach

**Justification**: Implement all three approaches in order of effectiveness:

1. **Primary (Critical)**: Manifest generation cycle detection - Prevents bad data from being created
2. **Secondary (Preventive)**: Orchestrator pre-flight validation - Catches any edge cases missed by generation
3. **Tertiary (Runtime Guard)**: Work queue self-reference check - Defense-in-depth if somehow bad data gets through

This defense-in-depth approach ensures the bug can't occur through any code path, while catching the vast majority of cases at the earliest possible point.

**Technical Approach**:

1. **Manifest Generation Validation** (`generate-spec-manifest.ts:744`):
   - Add Pass 2b after dependency resolution
   - Check for self-references: `feature.dependencies.includes(feature.id)`
   - Check for direct cycles: `A → B → A` (bidirectional dependencies)
   - Check for multi-step cycles: `A → B → C → A` using DFS
   - If any cycles found, print detailed error and exit with code 1
   - Prevent manifest from being saved if validation fails

2. **Orchestrator Pre-Flight** (`spec-orchestrator.ts`):
   - Before entering work loop, validate entire dependency graph
   - Use same cycle detection algorithm as manifest generation
   - If cycles found, log detailed report and exit before creating sandboxes
   - Provides clear feedback: "Fix your feature.md files and regenerate manifest"

3. **Work Queue Runtime Guard** (`work-queue.ts:167`):
   - In `getNextAvailableFeature()`, add check for self-references
   - If found, skip feature and log warning (doesn't hang, just logs)
   - This is purely defensive - should never trigger if earlier checks work

**Architecture Changes**:

- Extract cycle detection logic into utility function: `lib/cycle-detector.ts`
- Both manifest generation and orchestrator will import and use this utility
- No changes to data structures or interfaces

## Implementation Plan

### Affected Files

- `scripts/generate-spec-manifest.ts` - Add Pass 2b cycle detection after line 744
- `scripts/spec-orchestrator.ts` - Add pre-flight validation before work loop
- `scripts/lib/work-queue.ts` - Add runtime guard in `getNextAvailableFeature()` at line 167
- `scripts/lib/cycle-detector.ts` - **NEW** - Shared cycle detection utility

### New Files

- `scripts/lib/cycle-detector.ts` - Cycle detection algorithm and utility functions
  - `detectSelfReferences(features)` - Find features that depend on themselves
  - `detectDirectCycles(features)` - Find A ↔ B bidirectional dependencies
  - `detectIndirectCycles(features)` - Find multi-step cycles using DFS
  - `formatCycleError(cycles)` - Format cycles for readable error messages

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Create Cycle Detection Utility

<describe what this step accomplishes>
Create reusable cycle detection functions that can be used by manifest generation, orchestrator, and work queue.

- Create `scripts/lib/cycle-detector.ts` with three detection functions
- Implement self-reference detection (simple array check)
- Implement direct cycle detection (compare bidirectional dependencies)
- Implement indirect cycle detection (DFS algorithm for multi-step cycles)
- Add comprehensive error formatting for clear user feedback
- Add unit tests for cycle detector

**Why this step first**: The cycle detection logic is the foundation for all other fixes. We need this utility available before adding it to other files.

#### Step 2: Add Validation to Manifest Generation

Add Pass 2b validation to `generate-spec-manifest.ts` immediately after dependency resolution (around line 744).

- Import cycle detector utility
- After Pass 2 (dependency resolution), add Pass 2b
- Run all three cycle detection checks
- If any cycles found, print detailed error report with cycle descriptions
- Exit process with code 1 (prevents manifest from being saved)
- Add console logging for successful validation: "✅ No circular dependencies found"
- Keep validation output visible to user

**Why this placement**: Right after dependencies are resolved, before manifest is finalized and saved to disk.

#### Step 3: Add Pre-Flight Check to Orchestrator

Add validation to `spec-orchestrator.ts` before entering the work loop.

- Import cycle detector utility
- At start of orchestrator main function (before creating sandboxes)
- Load spec manifest
- Run cycle detection on all features
- If cycles found, print detailed error and exit before creating any sandboxes
- Log: "❌ DEPENDENCY VALIDATION FAILED - Fix manifest and regenerate"
- Keep this check fast (users run orchestrator frequently)

**Why before work loop**: Prevents wasted resources (sandboxes, processing) if manifest is invalid.

#### Step 4: Add Runtime Guard to Work Queue

Add defensive check in `work-queue.ts` `getNextAvailableFeature()` function at line 167.

- After line 166 where feature is selected for processing
- Add check: `if (feature.dependencies.includes(feature.id)) { ... skip }`
- Log warning: "⚠️ SKIPPING {feature.id}: Self-referential dependency detected"
- Continue to next feature instead of returning this one
- This prevents the hang even if earlier checks fail

**Why this placement**: In the function that actually processes features, acts as final safety net.

#### Step 5: Add Tests for Cycle Detection

Create comprehensive tests for the cycle detector utility.

- Add unit tests for self-reference detection
- Add unit tests for direct cycle detection (A ↔ B)
- Add unit tests for indirect cycle detection (A → B → C → A)
- Add tests for valid dependency graphs (no cycles)
- Add tests for mixed scenarios (some cycles, some valid paths)
- Test error message formatting for clarity

**Test file**: `scripts/lib/__tests__/cycle-detector.test.ts`

#### Step 6: Manual Testing & Validation

Test that the fixes work correctly.

- Generate a test manifest with self-reference
- Verify manifest generation catches the error and exits
- Verify error message is clear and actionable
- Generate a valid manifest
- Verify manifest generation succeeds
- Run orchestrator on valid manifest, verify no issues
- Test work queue runtime guard (skip self-referencing features)

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Self-reference detection (`feature.id` in `feature.dependencies`)
- ✅ Direct cycle detection (bidirectional A ↔ B)
- ✅ Indirect cycle detection (A → B → C → A)
- ✅ Valid graph detection (no cycles) - should return empty result
- ✅ Mixed graph (some valid paths, some cycles) - should detect only the cycles
- ✅ Error message formatting - should be clear and actionable
- ✅ Edge case: empty dependencies array
- ✅ Edge case: feature references non-existent feature (should not be treated as cycle)
- ✅ Regression test: S1890.I5.F2 scenario should be caught

**Test files**:
- `scripts/lib/__tests__/cycle-detector.test.ts` - Cycle detection unit tests

### Integration Tests

Test that cycle detection is properly integrated into manifest generation and orchestrator.

- ✅ Manifest generation catches cycle and prevents manifest save
- ✅ Orchestrator catches cycle in pre-flight check
- ✅ Work queue skips self-referencing features
- ✅ Valid manifest generation succeeds without false positives

**Test scenarios**:
- Generate manifest with self-reference → should fail
- Generate manifest with direct cycle (A ↔ B) → should fail
- Generate manifest with indirect cycle → should fail
- Generate valid manifest → should succeed
- Run orchestrator on valid manifest → should proceed normally

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Manually create a test manifest with S1890.I5.F2 self-reference
- [ ] Run manifest generation - verify it fails with clear error message
- [ ] Fix the manifest (remove self-reference)
- [ ] Run manifest generation again - verify it succeeds
- [ ] Run orchestrator on valid manifest - verify no issues
- [ ] Regenerate S1890 manifest and run orchestrator - verify S1890.I5.F2 completes successfully (was blocked before)
- [ ] Verify error messages are clear and point to solution
- [ ] Check that all 22 features in S1890 complete without hang
- [ ] Verify orchestrator doesn't hang on any valid manifest

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Cycle Detection Algorithm Incorrectness**: Incorrectly detecting valid cycles or missing actual cycles
   - **Likelihood**: medium (algorithms are complex)
   - **Impact**: high (would block valid features or miss invalid ones)
   - **Mitigation**: Comprehensive unit tests with many edge cases, peer review of algorithm, test with real manifests from past specs

2. **Performance Impact**: Cycle detection on large manifests could be slow
   - **Likelihood**: low (manifests typically have <50 features)
   - **Impact**: low (detection is O(n²) at worst, acceptable for manifest size)
   - **Mitigation**: Profile cycle detection on largest existing manifest, optimize if needed

3. **False Positives**: Catching valid dependency patterns as cycles
   - **Likelihood**: low (algorithm only checks actual cycles)
   - **Impact**: high (would block valid work)
   - **Mitigation**: Extensive testing, especially with real manifests from S1690, S1891, S1892

4. **Silent Failures**: Work queue runtime guard silently skips features without clear feedback
   - **Likelihood**: very low (other checks should catch this first)
   - **Impact**: medium (orphans dependent features)
   - **Mitigation**: Log clear warning messages, never silently skip

**Rollback Plan**:

If cycle detection causes issues:
1. Revert `generate-spec-manifest.ts` changes (remove Pass 2b)
2. Revert `spec-orchestrator.ts` changes (remove pre-flight check)
3. Revert `work-queue.ts` changes (remove runtime guard)
4. Delete `scripts/lib/cycle-detector.ts`
5. Regenerate affected manifests
6. Resume orchestration

This is a safe rollback because we're only adding validation, not changing core logic.

## Performance Impact

**Expected Impact**: minimal

Cycle detection runs once:
- **During manifest generation**: ~10-50ms on manifests with <50 features
- **During orchestrator startup**: ~10-50ms (same algorithm)
- **During work queue processing**: <1ms per feature (simple array check)

Total overhead: negligible compared to sandbox creation and feature implementation.

## Security Considerations

**Security Impact**: none

This is pure validation logic with no security implications. No external input validation or data exposure involved.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Regenerate S1890 manifest with self-reference (restore S1890.I5.F2 to its own dependencies)
tsx .ai/alpha/scripts/generate-spec-manifest.ts 1890

# Run orchestrator - should hang at 25+ minutes
tsx .ai/alpha/scripts/spec-orchestrator.ts 1890
```

**Expected Result**: Orchestrator hangs indefinitely, all 3 sandboxes become idle

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run cycle detection unit tests
pnpm test scripts/lib/__tests__/cycle-detector.test.ts

# Generate S1890 manifest with self-reference in source
tsx .ai/alpha/scripts/generate-spec-manifest.ts 1890

# Verify manifest generation fails with clear error
# Expected: "❌ CIRCULAR DEPENDENCY DETECTED: S1890.I5.F2 depends on itself"
```

**Expected Result**:
- Manifest generation fails immediately with clear error message
- No manifest file is created
- User knows exactly what's wrong and how to fix it

### Regression Prevention

```bash
# Run all cycle detection tests
pnpm test scripts/lib/__tests__/cycle-detector.test.ts

# Generate valid S1890 manifest (self-reference removed)
tsx .ai/alpha/scripts/generate-spec-manifest.ts 1890

# Verify generation succeeds
# Expected: "✅ No circular dependencies found"

# Run orchestrator on valid manifest
tsx .ai/alpha/scripts/spec-orchestrator.ts 1890

# Verify orchestrator proceeds normally and completes all 22 features
# Expected: All features complete, no hang, orchestrator exits cleanly
```

## Dependencies

### New Dependencies

None - cycle detection uses only built-in TypeScript/JavaScript.

**No new dependencies required**

## Database Changes

**No database changes required**

This is purely a validation fix in the orchestrator logic. No schema or data changes needed.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a fix to internal orchestrator scripts, not user-facing code.

**Feature flags needed**: no

**Backwards compatibility**: maintained - fix only adds validation, doesn't change behavior of valid manifests

## Success Criteria

The fix is complete when:
- [ ] Cycle detection utility created and unit tested
- [ ] Manifest generation has Pass 2b cycle detection
- [ ] Orchestrator has pre-flight validation
- [ ] Work queue has runtime guard
- [ ] All validation commands pass
- [ ] Bug scenario (S1890.I5.F2 self-reference) no longer hangs
- [ ] Valid manifests proceed normally without false positives
- [ ] All S1890 features (22 total) complete successfully
- [ ] Error messages are clear and actionable
- [ ] Code review approved

## Notes

**Key Decisions**:
1. Multi-layer defense-in-depth approach catches cycles at three points
2. Fail-fast at manifest generation prevents bad data from being created
3. Cycle detection utility is reusable for future tooling needs

**Algorithm Choice**:
- Using DFS (Depth-First Search) for cycle detection
- Time complexity: O(V + E) where V = features, E = dependencies
- Space complexity: O(V) for visited set
- Suitable for typical manifest sizes (<50 features)

**Error Message Design**:
- Print specific cycle paths: "S1890.I5.F2 → (self-reference)"
- Include actionable guidance: "Remove '{feature}' from its own dependencies array"
- Highlight which file to edit: "Fix in feature.md and regenerate manifest"

**Related Documentation**:
- S1890 Diagnosis: #1914
- Alpha Orchestrator Architecture: `.ai/alpha/scripts/spec-orchestrator.ts`
- Work Queue Implementation: `.ai/alpha/scripts/lib/work-queue.ts`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1914*
