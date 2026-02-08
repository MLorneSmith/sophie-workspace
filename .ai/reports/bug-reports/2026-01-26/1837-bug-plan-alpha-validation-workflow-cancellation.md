# Bug Fix: Alpha validation workflow cancellation during orchestration

**Related Diagnosis**: #1836 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: GitHub Actions workflow `cancel-in-progress: true` conflicts with orchestrator's pattern of frequent git pushes from parallel sandboxes
- **Fix Approach**: Change `cancel-in-progress: false` to allow validation runs to queue naturally
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The GitHub Actions `alpha-validation` workflow on `alpha/spec-*` branches keeps getting cancelled during Alpha spec orchestration. When multiple E2B sandboxes (working in parallel) complete features and push to the same branch, each push triggers a new workflow run. The workflow's `cancel-in-progress: true` setting causes newer pushes to cancel older running validation jobs, preventing successful validation from completing. With features completing every 2-5 minutes and validation taking ~4 minutes, most runs are cancelled before finishing.

For full details, see diagnosis issue #1836.

### Solution Approaches Considered

#### Option 1: Disable Cancel-In-Progress ⭐ RECOMMENDED

**Description**: Change the workflow's concurrency configuration from `cancel-in-progress: true` to `cancel-in-progress: false`. This allows multiple workflow runs to queue and execute sequentially rather than cancelling each other. The final successful validation on the complete code is what matters most.

**Pros**:
- Minimal change (1 line in YAML)
- No impact on orchestrator code
- Allows all feature completions to be validated
- Zero risk of breaking orchestrator functionality
- Final state of branch is still validated
- Matches GitHub Actions best practices for CI pipelines

**Cons**:
- Uses more GitHub Actions compute minutes during orchestration
- More verbose GitHub Actions UI showing many queued runs
- Slightly slower feedback (validation runs queue instead of cancel)

**Risk Assessment**: low - This is a workflow configuration change only. No code changes. No breaking changes to any systems.

**Complexity**: simple - Single YAML configuration change

#### Option 2: Batch Pushes at Initiative Completion

**Description**: Modify the orchestrator to only push after each initiative completes instead of after every feature. This would reduce push frequency from ~every 3 minutes to ~every 15-20 minutes, below the validation duration.

**Pros**:
- Fewer GitHub Actions runs
- Better compliance with "cancel-in-progress" intent
- More intentional git history

**Cons**:
- Requires significant orchestrator code changes (feature.ts, manifest updates)
- Breaks the intended "progress synchronization" between parallel sandboxes
- Delays sharing completed work with other sandboxes
- Higher complexity and risk of unintended side effects
- May cause issues if one sandbox needs to see another's progress

**Why Not Chosen**: While this would address the root interaction, it requires risky orchestrator changes. The workflow configuration change is simpler, safer, and aligns with how most CI/CD systems handle parallel development workflows.

#### Option 3: Add Skip-CI Markers to Intermediate Commits

**Description**: Add `[skip ci]` to feature completion commit messages, only removing it for the final push. This prevents workflow triggers during implementation but still validates the final code.

**Pros**:
- Reduces GitHub Actions runs
- Maintains `cancel-in-progress` behavior
- Clean git history conceptually

**Cons**:
- Breaks progress visibility - other sandboxes can't see completed features
- No intermediate validation - only final code is validated
- Requires orchestrator changes to track when to skip CI
- Defeats the purpose of CI/CD (continuous validation)

**Why Not Chosen**: This removes the ability to detect integration issues early. CI/CD is meant to validate constantly, not just at the end. This approach is counterproductive.

### Selected Solution: Disable Cancel-In-Progress

**Justification**: This is the simplest, lowest-risk solution that aligns with how modern CI/CD systems handle parallel development. The `cancel-in-progress` setting is typically useful for PR branches where you only care about the latest code. For the Alpha orchestrator's work queue model, allowing runs to queue naturally ensures all feature completions are validated while minimizing code changes and risk.

**Technical Approach**:
- Change `.github/workflows/alpha-validation.yml` line 10 from `cancel-in-progress: true` to `cancel-in-progress: false`
- GitHub Actions will automatically queue runs instead of cancelling them
- Older runs will complete in FIFO order
- No changes needed to orchestrator code
- No changes needed to any application logic

**Architecture Changes**: None. This is a workflow configuration change only.

**Migration Strategy**: Not applicable - no data migration needed.

## Implementation Plan

### Affected Files

- `.github/workflows/alpha-validation.yml` - Change `cancel-in-progress: true` to `cancel-in-progress: false` (line 10)

### New Files

None required.

### Step-by-Step Tasks

#### Step 1: Modify workflow configuration

Edit `.github/workflows/alpha-validation.yml` and change the concurrency block:

```yaml
# BEFORE
concurrency:
  group: alpha-validation-${{ github.ref }}
  cancel-in-progress: true

# AFTER
concurrency:
  group: alpha-validation-${{ github.ref }}
  cancel-in-progress: false
```

**Why this step first**: This is the entire fix. The change is minimal and safe.

**Specific subtasks**:
1. Open `.github/workflows/alpha-validation.yml`
2. Locate the `concurrency:` block (currently at lines 8-10)
3. Change `cancel-in-progress: true` to `cancel-in-progress: false`
4. Save the file

#### Step 2: Verify the fix

Test that the fix resolves the issue:

1. Commit the change to the dev branch
2. Run the orchestrator on a test spec: `tsx spec-orchestrator.ts 1823` (or another spec)
3. Push several features to the alpha branch
4. Check GitHub Actions - observe that runs now queue instead of cancel
5. Let at least one run complete successfully
6. Verify in the UI that the validation completed

**Verification commands**:
```bash
# Check the workflow file was modified correctly
git diff .github/workflows/alpha-validation.yml

# Run a quick orchestrator test (stop after a few features)
tsx .ai/alpha/scripts/spec-orchestrator.ts 1823 --sandboxes 1 --timeout 300
```

#### Step 3: Monitor and validate

After deployment, monitor that:
- Workflow runs queue instead of cancel
- Validation completes successfully even with frequent pushes
- No new errors appear in workflow runs
- Branch validation confirms code quality

**Validation approach**:
- Run orchestrator on a real spec
- Watch GitHub Actions to confirm runs queue
- Verify final branch validation succeeds
- Check for any new workflow failures

## Testing Strategy

### Unit Tests

Not applicable - this is a workflow configuration change.

### Integration Tests

Not applicable - this is a GitHub Actions configuration.

### Workflow Integration Testing

**Test approach**:
1. Run orchestrator on a spec with multiple features
2. Observe GitHub Actions behavior:
   - Runs should queue instead of cancel
   - All runs should appear in the Actions history (not greyed out)
   - The final run should complete successfully
3. Verify git push success messages in orchestrator logs
4. Confirm no error messages about cancelled runs

### Manual Testing Checklist

Execute these manual tests to verify the fix:

- [ ] Run orchestrator with at least 2 features
- [ ] Verify GitHub Actions shows multiple queued runs (not cancelled)
- [ ] Wait for the workflow queue to clear
- [ ] Confirm at least one validation run completed successfully
- [ ] Check git log for all feature commits (none should be missing)
- [ ] Verify orchestrator final push succeeded
- [ ] Confirm branch code is valid (typecheck, build passed in final run)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Increased GitHub Actions usage**: More minutes used if running orchestrator frequently
   - **Likelihood**: high
   - **Impact**: low (GitHub provides generous free minutes; only matters if heavily exceeding limits)
   - **Mitigation**: This is acceptable trade-off. CI/CD should always validate everything. If minutes become issue, implement batching approach later.

2. **GitHub Actions queue overload**: Hundreds of concurrent runs from multiple orchestrations
   - **Likelihood**: low (unlikely to run orchestrator on dozens of specs simultaneously)
   - **Impact**: medium (Could hit rate limits)
   - **Mitigation**: Current usage patterns don't suggest this risk. If it occurs, add concurrency limits or workflow-level skip conditions.

3. **Workflow failures masking**: More runs means more chances to miss failure patterns
   - **Likelihood**: low (validation logic unchanged)
   - **Impact**: low (Final run still validates complete code)
   - **Mitigation**: Monitor workflow history for patterns. Use GitHub Actions insights.

**Rollback Plan**:

If this change causes unexpected issues:

1. Revert the change in `.github/workflows/alpha-validation.yml` (change `false` back to `true`)
2. Push the revert commit to dev branch
3. New orchestrator runs will immediately start cancelling again
4. No running infrastructure is affected - workflows just behave differently

**Monitoring** (if needed):
- Monitor GitHub Actions minute usage for next 2 weeks
- Check for any workflow execution failures
- Watch for rate limiting errors in orchestrator logs

## Performance Impact

**Expected Impact**: minimal (workflow execution unchanged)

The change doesn't affect:
- Workflow execution time (~4 minutes per run)
- Validation logic (typecheck, lint, build)
- Resource consumption per run
- Orchestrator performance

Only affects:
- Queue behavior (runs wait instead of cancel)
- GitHub Actions UI visibility (more runs shown)
- Total CI minutes used during orchestration (increased)

## Security Considerations

**Security Impact**: none

No security implications. This is a workflow behavior change only. No code is modified, no credentials touched, no permissions changed.

## Validation Commands

### Before Fix (Bug Should Reproduce)

Trigger multiple pushes to an `alpha/spec-*` branch and observe:

```bash
# Start orchestrator - it will push frequently
tsx .ai/alpha/scripts/spec-orchestrator.ts 1823

# In another terminal, watch GitHub Actions
gh run list --workflow alpha-validation.yml --limit 20
# Look for status: cancelled entries
```

**Expected Result**: Most runs show `cancelled` status before completing

### After Fix (Bug Should Be Resolved)

```bash
# Start orchestrator - same as before, but now validation should work
tsx .ai/alpha/scripts/spec-orchestrator.ts 1823

# In another terminal, watch GitHub Actions
gh run list --workflow alpha-validation.yml --limit 20
# Look for status: in_progress or completed entries
```

**Expected Result**: Runs queue naturally, no cancellations, final runs complete successfully

### Regression Prevention

```bash
# Type check (catch any workflow syntax issues)
pnpm typecheck .github/workflows/alpha-validation.yml

# Lint GitHub Actions workflows (if linter available)
# No standard linter, but validate YAML syntax:
cat .github/workflows/alpha-validation.yml | grep -A5 "concurrency:"

# Verify the change was applied
grep "cancel-in-progress: false" .github/workflows/alpha-validation.yml
```

## Dependencies

**No new dependencies required**

This change modifies only a GitHub Actions workflow configuration file. No code dependencies, no package dependencies, no external services affected.

## Database Changes

**No database changes required**

This is a workflow configuration change with no database impact.

## Deployment Considerations

**Deployment Risk**: minimal

**Special deployment steps**: None

1. Merge the workflow change to the dev branch
2. The change takes effect immediately on next push to `alpha/spec-*` branch
3. No special deploy process needed
4. No feature flags or gradual rollout needed

**Feature flags needed**: no

**Backwards compatibility**: maintained

The change is backwards compatible. It only affects how GitHub Actions behaves when multiple runs queue. Older code running on `alpha/` branches will work unchanged.

## Success Criteria

The fix is complete when:

- [ ] `.github/workflows/alpha-validation.yml` has `cancel-in-progress: false`
- [ ] Orchestrator is run on a test spec
- [ ] GitHub Actions shows queued runs (not cancelled)
- [ ] At least one validation run completes successfully
- [ ] Git commits from all features are present on branch
- [ ] Orchestrator logs show no validation-related errors
- [ ] Final branch code passes validation (typecheck, lint, build)
- [ ] Zero regressions (all other workflows still work)

## Notes

- This is a configuration-only fix with zero code changes
- The change aligns with standard CI/CD practices for parallel development
- If GitHub Actions minute usage becomes a concern later, the orchestrator can be modified to batch pushes instead
- This fix enables all feature completions to be validated, improving code quality visibility
- The "queue instead of cancel" behavior is exactly what most development teams want for CI/CD

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1836*
