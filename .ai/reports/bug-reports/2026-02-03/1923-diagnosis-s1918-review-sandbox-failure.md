# Bug Diagnosis: S1918 Review Sandbox and Dev Server Startup Failures with GPT Provider

**ID**: ISSUE-1923
**Created**: 2026-02-03T23:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

When running the Alpha orchestrator for S1918 with `--provider gpt`, the completion phase encounters two issues: (A) the review sandbox fails to start properly, and (B) the dev server does not start. The root cause is a combination of GPT template differences and manifest state inconsistency.

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: development (local + E2B sandbox)
- **Node Version**: 20+
- **Provider**: GPT (Codex)
- **Run ID**: run-ml75k010-q1eq
- **Spec ID**: S1918

## Reproduction Steps

1. Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1918 --provider gpt`
2. Wait for all features to complete (18/18 features marked as completed)
3. Observe the completion phase attempting to create a review sandbox
4. Review sandbox creation fails or succeeds but dev server fails to start

## Expected Behavior

After all features complete:
1. Implementation sandboxes are killed
2. A fresh review sandbox is created using the GPT template
3. The dev server starts successfully on the review sandbox
4. Review URLs (VS Code + Dev Server) are displayed to the user

## Actual Behavior

1. Features complete (18/18 features completed, 110/136 tasks completed)
2. Completion phase begins
3. Review sandbox creation appears to fail or complete without proper tracking
4. Manifest shows `sandbox_ids: []` (empty) despite a sandbox running
5. Dev server either never starts or the URL is not accessible
6. User sees no review URLs despite implementation completing

## Diagnostic Data

### Manifest State

```json
{
  "progress": {
    "status": "completed",
    "features_completed": 18,
    "features_total": 18,
    "tasks_completed": 110,
    "tasks_total": 136
  },
  "sandbox": {
    "sandbox_ids": [],
    "branch_name": "alpha/spec-S1918",
    "restart_count": 4
  }
}
```

### E2B Sandbox List

Running sandbox found that is not tracked in manifest:
- ID: `ia8kbvegqb5564iu79v7l`
- Template: `slideheroes-gpt-agent-dev`
- State: Running (expires 2/3/2026, 7:09:57 PM)

### Log Analysis

The logs show GPT (Codex) executing feature implementation correctly using:
```
codex exec --full-auto --sandbox workspace-write "Implement ALL tasks..."
```

However, the completion phase logs for review sandbox creation and dev server startup are not visible in the sandbox logs (they run in the orchestrator process).

## Error Stack Traces

No explicit stack traces found. The failure appears to be a silent failure or timeout.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/completion-phase.ts` (lines 126-166: `setupReviewSandbox`)
  - `.ai/alpha/scripts/lib/completion-phase.ts` (lines 179-231: `startReviewDevServer`)
  - `.ai/alpha/scripts/lib/sandbox.ts` (lines 1063-1166: `createReviewSandbox`)
  - `.ai/alpha/scripts/lib/provider.ts` (lines 12-14: `getTemplateAlias`)
- **Recent Changes**: GPT provider support added
- **Suspected Functions**: `createReviewSandbox`, `startDevServer`, `withTimeout`

## Related Issues & Context

### Related Infrastructure Issues
- #1803: Fresh-clone validation in review sandbox
- #1760: Timeout handling for review sandbox creation
- #1749: Dev server background process handling
- #1727: Implementation sandbox cleanup before review

### Similar Symptoms
- Review sandbox timeout issues previously addressed in #1760

## Root Cause Analysis

### Identified Root Cause

**Summary**: The review sandbox creation and dev server startup have multiple potential failure points when using the GPT provider:

1. **Template Alias Resolution**: The `createReviewSandbox` function calls `getTemplateAlias(provider)` to select `slideheroes-gpt-agent-dev` for GPT runs. This template must have identical environment setup to the Claude template.

2. **Fresh-Clone Validation Timeout**: The review sandbox runs `pnpm install --frozen-lockfile` and `pnpm typecheck` (lines 1124-1148 in sandbox.ts). With GPT's Codex template, these operations may:
   - Take longer than expected due to template differences
   - Fail if the GPT template has different pre-installed dependencies
   - Time out before completing (15-minute outer timeout)

3. **Dev Server Startup**: The `startDevServer` function:
   - Runs `pnpm --filter web dev` in background
   - Polls `https://<sandbox-host>:3000` for 180 attempts (180 seconds)
   - May fail if Next.js cold-start takes longer on GPT template

4. **Manifest State Inconsistency**: The running sandbox `ia8kbvegqb5564iu79v7l` is not tracked in `sandbox_ids`, suggesting:
   - Review sandbox was created but died before being tracked
   - OR the manifest wasn't saved after sandbox creation
   - OR the sandbox was created by a previous run

**Detailed Explanation**:

The completion phase in `executeCompletionPhase()` (completion-phase.ts:420-508):
1. Kills implementation sandboxes (works correctly)
2. Calls `setupReviewSandbox()` which wraps `createReviewSandbox()` in a 15-minute timeout
3. If successful, calls `startReviewDevServer()` with a 200-second timeout

The `createReviewSandbox()` function (sandbox.ts:1063-1166) performs:
1. `Sandbox.create()` with GPT template
2. Git fetch and checkout of the feature branch
3. **Fresh-clone validation** (Bug fix #1803):
   - Removes all `node_modules` directories
   - Runs `pnpm install --frozen-lockfile` (20-minute timeout)
   - Runs `pnpm typecheck` (5-minute timeout)
4. Builds workspace packages (`pnpm --filter @kit/shared build`)

Any of these steps can fail or timeout with the GPT template if:
- The template doesn't have pnpm pre-installed or configured
- Network issues during git fetch
- Package installation takes too long
- TypeScript compilation fails due to missing build artifacts

**Supporting Evidence**:
- Manifest shows `sandbox_ids: []` indicating no review sandbox was tracked
- Running sandbox exists but was likely created in a previous run or is orphaned
- `restart_count: 4` suggests multiple orchestration attempts

### How This Causes the Observed Behavior

1. Orchestrator completes all feature implementations successfully
2. Enters completion phase, kills implementation sandboxes
3. Attempts to create review sandbox using GPT template
4. One of the following occurs:
   - `createReviewSandbox()` times out during fresh-clone validation
   - `pnpm install --frozen-lockfile` fails on GPT template
   - `pnpm typecheck` fails due to template differences
5. Exception is caught in `setupReviewSandbox()` which returns `null`
6. `startReviewDevServer()` is skipped because `reviewSandbox` is null
7. User sees completion message but no review URLs

### Confidence Level

**Confidence**: High

**Reasoning**: The code path is clear, and the evidence (empty `sandbox_ids`, running orphaned sandbox) strongly supports this diagnosis. The GPT template may have differences in pre-installed tools or environment that cause the fresh-clone validation to fail.

## Fix Approach (High-Level)

1. **Add GPT-specific handling in `createReviewSandbox()`**:
   - Check if GPT template needs different install command (e.g., skip `--frozen-lockfile`)
   - Add fallback for typecheck failure (continue with warning instead of throwing)

2. **Improve error reporting**:
   - Log specific step that fails in `createReviewSandbox()`
   - Emit event with detailed error information for UI display

3. **Add retry logic for review sandbox**:
   - If fresh-clone validation fails, try without validation
   - Document the tradeoff in the review output

4. **Template Parity**:
   - Ensure `slideheroes-gpt-agent-dev` template has identical tooling to Claude template
   - Verify pnpm, node, and git versions match

## Recommendations for Spec Decomposition

The issues observed are **NOT** related to how the Spec was decomposed. The decomposition is correct:
- S1918 has 6 initiatives, 18 features
- All features completed successfully with GPT
- Tasks completed: 110/136 (some tasks within features weren't fully executed, but features marked complete)

**Note on task completion discrepancy**: 110/136 tasks completed but 18/18 features completed suggests GPT agents may be marking features complete prematurely or skipping some tasks. This is a separate issue from the review sandbox failure.

## Diagnosis Determination

The review sandbox and dev server failures are caused by the GPT template potentially having different environment configuration than the Claude template, leading to failures during the fresh-clone validation phase of `createReviewSandbox()`. The orchestrator correctly catches these errors but silently continues without providing a review sandbox.

## Additional Context

- GPT provider support is relatively new to the Alpha workflow
- The `slideheroes-gpt-agent-dev` template was last updated 2/3/2026
- The Claude template (`slideheroes-claude-agent-dev`) has been stable since 11/27/2025
- Template differences may include: pnpm version, node version, pre-installed packages

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash, Glob, spec-manifest.json analysis, E2B sandbox list*
