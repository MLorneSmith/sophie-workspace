# Bug Diagnosis: Alpha Validation Workflow Keeps Getting Cancelled

**ID**: ISSUE-1836
**Created**: 2026-01-26T22:40:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The GitHub Actions `alpha-validation` workflow is continuously cancelled during Alpha spec orchestration. When multiple E2B sandboxes complete features and push to the same branch (`alpha/spec-S1823`), each push triggers a new workflow run. Due to the workflow's `cancel-in-progress: true` concurrency setting, newer pushes cancel older running validation jobs, preventing successful validation from completing.

## Environment

- **Application Version**: dev branch
- **Environment**: development/CI
- **Node Version**: 22
- **pnpm Version**: 10.14.0
- **GitHub Actions**: Using `runs-on` with custom runners
- **Last Working**: N/A (design issue, not regression)

## Reproduction Steps

1. Run the spec orchestrator: `tsx spec-orchestrator.ts 1823`
2. The orchestrator creates 3 E2B sandboxes that work in parallel
3. Each sandbox completes a feature and pushes to `alpha/spec-S1823`
4. Observe in GitHub Actions that most workflow runs are cancelled

## Expected Behavior

Each feature's validation should complete successfully, allowing the team to verify that each incremental change builds and type-checks correctly.

## Actual Behavior

The workflow runs keep getting cancelled with the message:
```
Canceling since a higher priority waiting request for alpha-validation-refs/heads/alpha/spec-S1823 exists
```

From the GitHub Actions history on `alpha/spec-S1823`:
- Most runs show status: `cancelled` (within 30-60 seconds)
- Only occasional runs complete (when there's a pause between pushes)

## Diagnostic Data

### GitHub Actions Run History

```
in_progress  - fix(web): resolve merge conflicts (59s)
failure      - feat(web): add loadUserState (2m40s)
cancelled    - feat(web): add spider chart assessment widget (36s)
cancelled    - feat(web): implement CourseProgressWidget (2m42s)
cancelled    - feat(web): add Cal.com foundation (2m55s)
cancelled    - feat(web): wire DashboardSkeleton (37s)
cancelled    - feat(web): implement responsive DashboardGrid (4m2s)
cancelled    - feat(web): add kanban summary widget (3m31s)
cancelled    - feat(web): implement dashboard page shell (1m21s)
cancelled    - feat(web): add unified loadDashboardData (2m50s)
```

### Workflow Configuration

```yaml
# .github/workflows/alpha-validation.yml
concurrency:
  group: alpha-validation-${{ github.ref }}
  cancel-in-progress: true
```

This configuration means:
- All pushes to the same branch share the same concurrency group
- When a new push comes in, any running job in that group is cancelled

### Orchestrator Push Pattern

The orchestrator pushes after each feature completion (`feature.ts:726`):
```typescript
// CRITICAL: Push after completing feature
await instance.sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && git push origin "${manifest.sandbox.branch_name}"`,
  { timeoutMs: 120000 },
);
```

With 3 sandboxes completing features at staggered intervals (roughly 2-5 minutes per feature), pushes happen frequently, causing constant cancellations.

### Progress Data

Current run progress (`overall-progress.json`):
- Spec: S1823 (user dashboard)
- Status: in_progress
- Features completed: 14/17
- Tasks completed: 77/117

## Related Issues & Context

### Similar Symptoms
- This is a newly identified issue with the Alpha orchestrator parallel execution model
- Previous similar issues with workflow concurrency on other branches

### Historical Context
- The `cancel-in-progress: true` setting is typically useful for PR branches where you only care about the latest code
- For the Alpha workflow where multiple sandboxes push sequentially, this becomes problematic

## Root Cause Analysis

### Identified Root Cause

**Summary**: The GitHub Actions workflow's `cancel-in-progress: true` concurrency setting conflicts with the orchestrator's parallel execution model where multiple sandboxes push to the same branch at different times.

**Detailed Explanation**:

1. **The orchestrator creates 3 parallel sandboxes** that all work on the same git branch (`alpha/spec-S1823`)

2. **Each feature completion triggers a git push** (see `feature.ts:726`) to share progress with other sandboxes and persist work

3. **The GitHub workflow `alpha-validation.yml`** uses:
   ```yaml
   concurrency:
     group: alpha-validation-${{ github.ref }}
     cancel-in-progress: true
   ```

4. **The concurrency group** is based on `github.ref` (the branch), so all pushes to `alpha/spec-S1823` share the same concurrency group

5. **When `cancel-in-progress: true`**, any new push to the branch automatically cancels the currently running workflow for that group

6. **Result**: With features completing every 2-5 minutes across 3 sandboxes, most validation runs are cancelled before they can complete the ~4 minute validation (install + typecheck + build)

**Supporting Evidence**:
- GitHub Actions history shows 8/10 recent runs cancelled
- Cancelled runs show message: "Canceling since a higher priority waiting request for alpha-validation-refs/heads/alpha/spec-S1823 exists"
- `feature.ts:726` shows push happens after every feature completion
- `alpha-validation.yml:8-10` shows the concurrency configuration

### How This Causes the Observed Behavior

```
Timeline:
[00:00] Sandbox A completes F1, pushes → Workflow Run #1 starts
[02:30] Sandbox B completes F2, pushes → Run #1 CANCELLED, Run #2 starts
[03:15] Sandbox C completes F3, pushes → Run #2 CANCELLED, Run #3 starts
[05:00] Sandbox A completes F4, pushes → Run #3 CANCELLED, Run #4 starts
... continues indefinitely
```

Each ~2-5 minute feature completion triggers a push before the ~4 minute validation can finish.

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The GitHub Actions logs explicitly state the cancellation reason
2. The workflow configuration clearly shows `cancel-in-progress: true`
3. The orchestrator code shows pushes happen after every feature
4. The timing analysis shows push frequency exceeds validation duration

## Fix Approach (High-Level)

Several possible approaches:

1. **Change to `cancel-in-progress: false`** - Let all runs complete in parallel. Cons: Uses more GitHub Actions minutes.

2. **Add unique run identifier to concurrency group** - Use `alpha-validation-${{ github.ref }}-${{ github.sha }}` so each commit gets its own group. Cons: Many parallel runs.

3. **Batch pushes at initiative completion** - Only push when an initiative completes instead of per-feature. Cons: Delays progress sharing between sandboxes, requires significant orchestrator changes.

4. **Skip workflow trigger on intermediate commits** - Add `[skip ci]` to commit messages during implementation, run validation only at end. Cons: No intermediate validation.

5. **Queue-based validation** - Remove `cancel-in-progress: true` and let runs queue. Only latest matters for final validation.

**Recommended**: Option 5 (queue-based validation) - Change `cancel-in-progress: false` to let runs queue naturally. The final validation on the complete code is what matters most. GitHub Actions will naturally queue and run all pushes, with the final state being validated by the last successful run.

## Diagnosis Determination

The root cause is definitively identified: the `cancel-in-progress: true` setting in the workflow's concurrency configuration conflicts with the orchestrator's pattern of frequent git pushes from parallel sandboxes. This is a configuration issue, not a code bug, and can be resolved by adjusting the workflow's concurrency behavior.

## Additional Context

- The Alpha orchestrator is designed for maximum parallelism (3 sandboxes)
- Features complete at irregular intervals (2-10 minutes depending on task count)
- The validation workflow takes ~4 minutes when it completes successfully
- The push-after-feature pattern is intentional to enable sandbox coordination and progress persistence

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view, Grep, Read*
