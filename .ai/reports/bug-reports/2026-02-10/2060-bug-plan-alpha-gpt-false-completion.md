# Bug Fix: Alpha Orchestrator False Completion with GPT

**Related Diagnosis**: #2059
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Three compounding issues: (1) GPT ignores mandatory rules, (2) 50% completion threshold too permissive, (3) brainstorming skill in GPT template
- **Fix Approach**: Raise completion threshold to 80% + add post-execution task audit + clear progress files on feature start
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha orchestrator running S2045 with GPT/Codex agent marked 14/14 features as "completed" but only 85/97 tasks were actually done (12 tasks silently dropped). The orchestrator accepted features with 50%+ task completion as "completed", allowing GPT's partial work to pass validation. Meanwhile, GPT ignored mandatory execution rules (used invalid "blocked" status, requested Docker commands, invoked brainstorming skill) and exited cleanly without completing work.

This is the third occurrence of this pattern across three spec runs (S1918, S2045 attempt 1, S2045 attempt 2), with escalating severity (visible deadlock → false completion).

For full details, see diagnosis issue #2059.

### Solution Approaches Considered

#### Option 1: Raise Completion Threshold Only

**Description**: Increase the threshold from 50% to 80% in `feature.ts:726`. This is the quickest, lowest-risk fix that addresses the most obvious validation gap.

**Pros**:
- Minimal code change (one line)
- No new dependencies or infrastructure
- Immediate deployment
- Prevents obviously incomplete features from passing

**Cons**:
- Doesn't address GPT non-compliance root cause
- Doesn't fix stale progress display issue
- GPT could still exit with invalid statuses that won't be detected
- May still allow features with 20%+ missing tasks to pass

**Why Not Primary**: Too narrow. This fixes the threshold symptom but doesn't prevent GPT from using invalid statuses or silence future stalls.

#### Option 2: Raise Threshold + Task Audit + Progress Reset ⭐ RECOMMENDED

**Description**: Combine three targeted fixes:
1. Raise completion threshold from 50% to 80% (catches obvious incomplete work)
2. Add GPT post-execution task audit that scans for "blocked"/"draft" statuses (catches invalid states)
3. Clear local progress files on feature start (prevents stale heartbeat display)

**Pros**:
- Addresses all three root causes with surgical precision
- No changes to template or task decomposition needed
- Portable: works regardless of agent provider
- Prevents invalid status slip-through
- Fixes UI stale heartbeat issue
- Medium complexity, reasonable scope

**Cons**:
- Requires changes to three files (`feature.ts`, `health.ts` or similar)
- May need new validation utilities
- Still doesn't fix brainstorming skill interference (but that's template-specific)

**Why Chosen**: Balances completeness with maintainability. Addresses orchestrator-level failures without being overengineered. Fixes can ship independently.

#### Option 3: Comprehensive Fix (All Orchestrator + Template + Task Changes)

**Description**: Implement all suggested fixes from diagnosis:
1. Raise threshold to 80%
2. Add post-execution task audit
3. Clear progress files
4. Remove brainstorming skill from GPT template
5. Retroactively fix S2045 task decompositions (remove Docker commands)
6. Add provider-aware task decomposition filtering

**Pros**:
- Completely eliminates all identified root causes
- Prevents both orchestrator AND template/task failures
- Provides long-term prevention

**Cons**:
- Requires coordinating template changes (E2B dependency)
- Requires retroactive task decomposition fixes
- Large scope, higher risk
- Slower to implement (~3-4 hours)
- Overkill for addressing immediate bug

**Why Not Chosen**: Too comprehensive for current need. Can be phased: implement Option 2 first (quick wins), then Option 3 incrementally.

### Selected Solution: Option 2 (Raise Threshold + Task Audit + Progress Reset)

**Justification**: This approach directly addresses all three root causes at the orchestrator level without requiring external dependencies. It's surgical — minimal code changes but maximum coverage. The task audit catches GPT's invalid status usage, the threshold raise prevents borderline-incomplete features from passing, and the progress reset fixes the UI stall display issue.

**Technical Approach**:
1. **Threshold Fix**: Change `Math.ceil(feature.task_count * 0.5)` to `Math.ceil(feature.task_count * 0.8)` in `feature.ts:726`. This requires 80% of tasks complete instead of 50%.

2. **Task Audit**: After GPT finishes and progress file shows "completed", scan the feature's tasks.json for tasks with status `"blocked"` or `"draft"`. Count these as incomplete and recalculate the completion percentage. If this recalculation drops below the 80% threshold, remap feature status to "failed" instead of "completed".

3. **Progress Reset**: When a new feature starts on a sandbox, explicitly clear the local progress file (call `writeIdleProgress()` with empty state) to prevent stale heartbeats from previous features showing in the UI.

**Architecture Changes** (if any):
- No architectural changes. All changes are within existing feature validation and progress file management.
- Task audit adds a new validation step in the feature completion flow, but follows existing pattern.

**Migration Strategy** (if needed):
- No data migration needed. These are logic-only fixes.
- Existing manifest.json files remain valid; they'll be re-evaluated with stricter logic on next orchestrator run.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/feature.ts` (lines 680-740: completion threshold logic, add task audit)
- `.ai/alpha/scripts/lib/progress-file.ts` (add task status remapping logic)
- `.ai/alpha/scripts/lib/health.ts` or `.ai/alpha/scripts/lib/work-loop.ts` (add progress file reset on feature start)

### New Files

- `.ai/alpha/scripts/lib/task-validator.ts` - New utility for post-execution task audit

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Read affected orchestrator files

Read the target files to understand current completion logic and progress file management.

- Read `.ai/alpha/scripts/lib/feature.ts` (focus on lines 680-740)
- Read `.ai/alpha/scripts/lib/progress-file.ts` (understand status types and validation)
- Read `.ai/alpha/scripts/lib/work-loop.ts` (understand feature start/end lifecycle)
- Identify where `featureStatus = "completed"` is set and where progress files are written

**Why this step first**: Understanding the existing code structure prevents breaking unrelated logic.

#### Step 2: Create task-validator utility

Create new file `.ai/alpha/scripts/lib/task-validator.ts` with a function that:
- Takes a feature's tasks.json content (parsed JSON)
- Scans for tasks with status `"blocked"` or `"draft"`
- Returns count of invalid tasks found
- Exports function signature: `detectInvalidTaskStatuses(tasksJson: Record<string, any>): { invalidCount: number, invalidTasks: Task[] }`

This validates GPT's invalid status usage without modifying the tasks themselves.

**Why this step**: Encapsulates the audit logic in a testable, reusable utility before integrating it into the feature flow.

#### Step 3: Update completion threshold in feature.ts

Locate line ~726 in `feature.ts` where the completion threshold is calculated:
```typescript
const completionThreshold = Math.ceil(feature.task_count * 0.5);
```

Change to:
```typescript
const completionThreshold = Math.ceil(feature.task_count * 0.8);
```

Add comment explaining why 80%:
```typescript
// 80% threshold: Requires substantial task completion
// 50% was too permissive, allowing features with half their work undone to pass
// Previously allowed S2045.I4.F1 (6/12) and S2045.I4.F3 (6/11) to pass as "completed"
```

**Why this step**: Directly addresses the "50% too permissive" root cause.

#### Step 4: Add task audit to feature completion logic

In `feature.ts`, locate where feature status is set to "completed" after GPT finishes. Before setting status = "completed", call the task validator:

```typescript
// Audit GPT-generated tasks for invalid statuses ("blocked", "draft")
const taskAudit = detectInvalidTaskStatuses(tasksJson);
if (taskAudit.invalidCount > 0) {
  // Recalculate completion with invalid tasks counted as incomplete
  const actualCompletedCount = tasks.filter(t => t.status === "completed").length - taskAudit.invalidCount;
  const completedPercentage = (actualCompletedCount / feature.task_count) * 100;

  if (completedPercentage < 80) {
    // Drop below threshold due to invalid statuses, mark feature as failed
    feature.status = "failed";
    logger.warn(`Feature ${feature.id}: Task audit found ${taskAudit.invalidCount} invalid statuses, completion dropped to ${completedPercentage}%. Marking as failed.`);
    return; // Exit without setting "completed"
  }
}
```

**Why this step**: Catches GPT's invalid status usage before it can inflate completion numbers.

#### Step 5: Add progress file reset on feature start

In `work-loop.ts` or wherever features are assigned to sandboxes, add a call to reset the local progress file when a new feature starts:

```typescript
// When starting new feature on sandbox:
writeIdleProgress(sandbox.id, {
  feature_id: null,
  task_id: null,
  status: "idle",
  timestamp: new Date().toISOString(),
  heartbeat: new Date().toISOString(),
});
```

This prevents stale progress from previous features showing up in the UI.

**Why this step**: Fixes the UI stale heartbeat issue where old features' progress was being displayed for extended periods.

#### Step 6: Add comprehensive test coverage

Add tests for all three fixes in appropriate test files:

- **Test 1**: Verify completion threshold requires 80% (unit test: `feature.spec.ts`)
- **Test 2**: Verify task audit detects "blocked" statuses and remaps completion (unit test: `task-validator.spec.ts`)
- **Test 3**: Verify progress file is reset on feature start (integration test)

**Test code examples**:
```typescript
// feature.spec.ts
test('should reject features with 75% task completion', () => {
  const feature = { id: 'F1', task_count: 12, completed_count: 9 }; // 75%
  const threshold = Math.ceil(feature.task_count * 0.8);
  expect(feature.completed_count).toBeLessThan(threshold); // Should fail
});

// task-validator.spec.ts
test('should detect "blocked" statuses as invalid', () => {
  const tasks = [
    { id: 'T1', status: 'completed' },
    { id: 'T2', status: 'blocked' }, // Invalid
    { id: 'T3', status: 'completed' },
  ];
  const audit = detectInvalidTaskStatuses(tasks);
  expect(audit.invalidCount).toBe(1);
});
```

#### Step 7: Validation and edge case testing

Before committing, test these scenarios:

- **Scenario 1**: Feature with exactly 80% completion should pass ✓
- **Scenario 2**: Feature with 79% completion should fail ✓
- **Scenario 3**: Feature with 8/10 tasks completed + 2 "blocked" = 60% actual → should fail ✓
- **Scenario 4**: Feature starting should have fresh progress file (no stale data) ✓
- **Scenario 5**: Existing features in manifest should be re-evaluated with 80% threshold ✓

#### Step 8: Code quality and documentation

- Run `pnpm typecheck` to ensure no type errors
- Run `pnpm lint` and fix any linting issues
- Add inline comments explaining the three fixes
- Update CLAUDE.md if needed to document the new validation logic
- Update any orchestrator documentation

#### Step 9: Commit changes

Create a commit following the project convention:

```bash
git add .
git commit -m "$(cat <<'EOF'
fix(tooling): raise Alpha completion threshold to 80% and add task audit validation

Addresses issue #2059 where GPT agent's false completion with invalid statuses
allowed 14/14 features to pass with only 85/97 tasks done.

Changes:
- Raise completion threshold from 50% to 80% (prevents borderline-incomplete features)
- Add post-execution task audit scanning for "blocked"/"draft" statuses (catches GPT non-compliance)
- Clear progress files on feature start (prevents stale heartbeat display)

Root cause fix for recurring pattern across S1918, S2045 attempt 1, S2045 attempt 2.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

## Testing Strategy

### Unit Tests

Add unit tests for:
- ✅ Completion percentage calculation with new 80% threshold
- ✅ Task audit detects "blocked" statuses
- ✅ Task audit detects "draft" statuses
- ✅ Task audit correctly recalculates completion percentage
- ✅ Features dropping below 80% are marked "failed" after audit
- ✅ Features staying above 80% are marked "completed" after audit

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/feature.spec.ts` - Completion threshold tests
- `.ai/alpha/scripts/lib/__tests__/task-validator.spec.ts` - Task audit tests

### Integration Tests

Scenarios to test with orchestrator:

- ✅ Run orchestrator with Claude agent (should work as before)
- ✅ Feature with 85% completion passes validation
- ✅ Feature with 75% completion fails validation
- ✅ Feature with invalid task statuses gets recalculated correctly
- ✅ Progress file resets when new feature starts on sandbox

**Test workflow**:
1. Create test spec with 5 features, mix of valid and edge-case completion levels
2. Run orchestrator in test mode
3. Verify correct feature status assignments

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator with Claude agent on S2045 (should behave normally)
- [ ] Run orchestrator with GPT agent on small test spec (should now reject incomplete features)
- [ ] Verify task audit finds "blocked" statuses in mock tasks.json
- [ ] Verify progress file is fresh when new feature starts
- [ ] Check manifest shows correct feature statuses after run
- [ ] Review console logs for audit warnings/failures
- [ ] Verify no regression in existing features with >80% completion

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Legitimate Features Failing Due to Strict Threshold**: If some agent providers legitimately struggle to reach 80% on complex features, they'll now fail. However, this is intentional — 80% is a reasonable bar for "completed" work.
   - **Likelihood**: low (80% is reasonable for completion)
   - **Impact**: medium (may require tuning threshold)
   - **Mitigation**: Monitor threshold effectiveness over 2-3 runs. If 80% proves too strict, can adjust to 75%. Add telemetry to track how many features hit different completion levels.

2. **Orchestrator Logic Regression**: Changes to feature validation could break existing completion flow for non-GPT agents.
   - **Likelihood**: low (changes are additive, threshold-only)
   - **Impact**: high (could deadlock orchestrator)
   - **Mitigation**: Comprehensive test coverage. Test with Claude agent before deploying. Feature flag the task audit if needed.

3. **Progress File Reset Causing Data Loss**: Resetting progress files could lose important state if timing is wrong.
   - **Likelihood**: very low (reset is on feature start, before any work)
   - **Impact**: medium (could lose progress display)
   - **Mitigation**: Only reset local progress file, not the shared manifest. Add guard to prevent mid-feature reset.

4. **False Negatives in Task Audit**: The task audit might miss invalid statuses or have false positives.
   - **Likelihood**: low (simple string matching)
   - **Impact**: low (audit is conservative, doesn't delete tasks)
   - **Mitigation**: Unit test all status remapping logic. Log all detected statuses for manual review.

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the three changes to `feature.ts`, `progress-file.ts`, and `work-loop.ts`
2. Restore threshold to `0.5`, remove task audit code, restore progress file behavior
3. Redeploy orchestrator
4. Investigate root cause of new issue

**Monitoring** (if needed):
- Monitor feature completion rates: % of features passing 80% threshold
- Monitor task audit detections: how many times invalid statuses are found
- Monitor orchestrator throughput: features/hour before and after fix
- Alert if >50% of features are failing (indicates threshold too strict)

## Performance Impact

**Expected Impact**: none to minimal

- Completion threshold change is O(1) arithmetic, negligible overhead
- Task audit is O(n) where n = number of tasks per feature (typically 10-20, <1ms)
- Progress file reset is O(1) file write, already happens frequently
- Total latency added per feature: <10ms

**Performance Testing**:
- Run orchestrator on full spec (S2045: 14 features, 97 tasks)
- Compare execution time before and after fix
- Verify no increase in sandbox startup/termination time

## Security Considerations

**Security Impact**: none

- No new external dependencies
- No changes to authentication or authorization
- No changes to data access patterns
- No security vulnerabilities introduced

**Security Review Needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator with GPT on test spec
tsx .ai/alpha/scripts/spec-orchestrator.ts S2045-test --provider gpt

# Expected Result: Features marked "completed" with <80% task completion (bug reproduces)
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run unit tests for new task validator
pnpm --filter @kit/alpha test -- task-validator.spec.ts

# Run feature tests
pnpm --filter @kit/alpha test -- feature.spec.ts

# Run orchestrator with test spec
tsx .ai/alpha/scripts/spec-orchestrator.ts S2045-test --provider gpt

# Expected Result:
# - Features with <80% completion marked "failed"
# - Task audit logs show detected "blocked" statuses
# - Progress files properly reset between features
```

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Run orchestrator with Claude agent (should work normally)
tsx .ai/alpha/scripts/spec-orchestrator.ts S2045-test --provider claude

# Verify Claude features with >80% still pass
```

## Dependencies

### New Dependencies (if any)

None — all changes use existing code patterns and utilities.

**No new dependencies required**

## Database Changes

**No database changes required**

The fixes are orchestrator logic-only and don't affect database schema or data structure.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- Deploy orchestrator code (`.ai/alpha/scripts/`) without special ceremony
- No database migrations needed
- No template changes needed (template fix is separate)
- Can be deployed to staging first for validation

**Feature flags needed**: no

**Backwards compatibility**: maintained

- Existing features in manifest.json remain valid
- New stricter validation applies on next orchestrator run
- Previous spec runs' manifests unaffected

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Task audit correctly detects "blocked" and "draft" statuses
- [ ] Completion threshold properly requires 80%
- [ ] Features with <80% completion marked "failed"
- [ ] Progress files reset on feature start (no stale data)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Zero regressions with Claude agent
- [ ] Console logs show audit results for GPT runs
- [ ] Code review approved

## Notes

**Future Improvements**:

1. **Phase 2 (Not in this fix)**: Remove brainstorming skill from GPT template (`slideheroes-gpt-agent-dev`)
   - Requires E2B template rebuild
   - Will prevent GPT from entering interactive mode
   - Estimated effort: 30 min, risk: low

2. **Phase 3 (Not in this fix)**: Retroactively fix S2045 task decompositions to remove Docker commands
   - Run #2058 guardrails against all S2045 tasks.json files
   - Remove verification commands referencing `127.0.0.1`, `localhost`, `supabase migration up`
   - Estimated effort: 1-2 hours, risk: low

3. **Phase 4 (Long-term)**: Add provider-aware task decomposition
   - When decomposing tasks for GPT, automatically filter verification commands that require Docker
   - Use `SUPABASE_SANDBOX_DB_URL` for remote database verification
   - Estimated effort: 3-4 hours, risk: medium

4. **Monitoring**: Track completion threshold effectiveness
   - Monitor % of features hitting different completion levels (50-60%, 60-70%, 70-80%, 80-90%, 90%+)
   - Adjust threshold if 80% proves too strict or lenient over 2-3 runs

**Related Documentation**:
- Diagnosis: #2059
- Previous fix: #2058 (S2045 impossible database tasks)
- Memory: `.claude/projects/-home-msmith-projects-2025slideheroes/memory/MEMORY.md` (S2045 deadlock patterns)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #2059*
