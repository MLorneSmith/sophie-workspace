# Bug Diagnosis: pnpm install fails in E2B sandbox with ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY

**ID**: ISSUE-2087
**Created**: 2026-02-13T21:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Spec Orchestrator crashes during sandbox creation when resuming S2086 implementation. `pnpm install` fails in the headless E2B sandbox because the `CI` environment variable is not set, causing pnpm to abort when it needs to remove/modify `node_modules` directories without an interactive TTY. This blocks all 3 remaining features in S2086.I6 (Responsive Accessibility Polish).

## Environment

- **Application Version**: dev branch (commit 22ca3cf45)
- **Environment**: development (E2B sandbox)
- **Node Version**: 22.x (E2B template)
- **pnpm Version**: 10.x
- **E2B SDK**: 2.10.4
- **Last Working**: S2086 initial run (completed 16/19 features before hang)

## Reproduction Steps

1. Have an in-progress spec (S2086) at 92% completion (16/19 features, 123/134 tasks)
2. Have recent commits on `dev` branch that modify `pnpm-lock.yaml` (e.g., PostHog SDK update `22ca3cf45`)
3. Resume the orchestrator with: `tsx .ai/alpha/scripts/spec-orchestrator.ts 2086 --model sonnet --document --force-unlock`
4. Orchestrator creates E2B sandbox, checks out branch `alpha/spec-S2086`
5. Detects lockfile changes between `alpha/spec-S2086` and `origin/dev`
6. Runs `pnpm install` without `--frozen-lockfile` (sandbox.ts:987)
7. pnpm tries to remove module directories for reconciliation
8. Fails immediately with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`

## Expected Behavior

`pnpm install` should complete successfully in the E2B sandbox, reconciling any lockfile differences between the template's cached `node_modules` and the spec branch's lockfile.

## Actual Behavior

`pnpm install` immediately aborts with exit code 1 and the error:

```
Scope: all 45 workspace projects
ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY  Aborted removal of modules directory due to no TTY

If you are running pnpm in CI, set the CI environment variable to "true".
```

The orchestrator catches this as a `CommandExitError` and crashes, preventing the remaining 3 features from being implemented.

## Diagnostic Data

### Console Output

```
❌ Orchestrator error: CommandExitError: exit status 1
    at CommandHandle.wait (/home/msmith/projects/2025slideheroes/node_modules/.pnpm/e2b@2.10.4/node_modules/e2b/src/sandbox/commands/commandHandle.ts:161:13)
    at async createSandbox (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/lib/sandbox.ts:987:3)
    at async createSandboxWithRetry (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/lib/orchestrator.ts:293:11)
    at async orchestrate (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/lib/orchestrator.ts:850:24)
    at async main (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/spec-orchestrator.ts:149:2) {
  result: {
    exitCode: 1,
    error: 'exit status 1',
    stdout: 'Scope: all 45 workspace projects\n' +
      ' ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY  Aborted removal of modules directory due to no TTY\n' +
      '\n' +
      'If you are running pnpm in CI, set the CI environment variable to "true".\n',
    stderr: ''
  }
}
```

### Progress at Time of Failure

```json
{
  "specId": "S2086",
  "specName": "homepage redesign",
  "status": "in_progress",
  "initiativesCompleted": 5,
  "initiativesTotal": 6,
  "featuresCompleted": 16,
  "featuresTotal": 19,
  "tasksCompleted": 123,
  "tasksTotal": 134
}
```

Remaining features (all in I6 - Responsive Accessibility Polish):
- S2086.I6.F1: Responsive Layout Adaptations (pending)
- S2086.I6.F2: Accessibility Compliance (pending)
- S2086.I6.F3: Performance Optimization & Audit (pending)

## Error Stack Traces

```
CommandExitError: exit status 1
    at CommandHandle.wait (e2b/src/sandbox/commands/commandHandle.ts:161:13)
    at async createSandbox (.ai/alpha/scripts/lib/sandbox.ts:987:3)
    at async createSandboxWithRetry (.ai/alpha/scripts/lib/orchestrator.ts:293:11)
    at async orchestrate (.ai/alpha/scripts/lib/orchestrator.ts:850:24)
    at async main (.ai/alpha/scripts/spec-orchestrator.ts:149:2)
```

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/environment.ts` (line 426-559: `getAllEnvVars()` - missing `CI=true`)
  - `.ai/alpha/scripts/lib/sandbox.ts` (line 987: raw `pnpm install` without CI)
  - `.ai/alpha/scripts/lib/sandbox.ts` (lines 973, 978, 1499: other `pnpm install` calls also missing CI)

- **Recent Changes**: Commit `22ca3cf45` updated PostHog SDK packages, modifying `pnpm-lock.yaml`. This causes `hasLockfileChanges = true` when sandbox checks out `alpha/spec-S2086` branch.

- **Suspected Functions**:
  - `createSandbox()` in `sandbox.ts:832` - the main sandbox creation function
  - `getAllEnvVars()` in `environment.ts:426` - sandbox environment variables (missing CI)

## Related Issues & Context

### Direct Predecessors

- #1846 (CLOSED): "Bug Diagnosis: Alpha Orchestrator Crashes with E2B Timeout During pnpm install" - Previous pnpm install failure, but caused by **timeout** (10 min insufficient), not TTY issues. Fix was increasing timeout to 20 min (#1847).
- #1803 (CLOSED): "Chore: Add Alpha Workflow Validation Safeguards" - Added `hasLockfileChanges` detection and non-frozen-lockfile install path. This is the code path that now triggers the TTY error.

### Related Infrastructure Issues

- #1924 (CLOSED): "Bug Fix: GPT Provider Review Sandbox and Dev Server Failures" - Created the `executeInstallWithRetry()` helper and `getProviderInstallConfig()` for robust installs, but these are only used in specific code paths, not in the main `createSandbox()` flow.
- #2053 (CLOSED): "Bug Fix: Alpha validation CI fails - pnpm/action-setup@v4 dual version rejection" - CI/pnpm version issue in GitHub Actions, unrelated but same pnpm ecosystem.

### Same Component

- #1537 (CLOSED): "E2B Sandbox Template Git Branch Divergence Causes Orchestrator Failure" - Sandbox git state issues during creation
- #1520 (CLOSED): "Alpha Orchestrator E2B Sandbox Build Step Missing" - Missing build step in sandbox creation
- #1597 (CLOSED): "Review Sandbox Dev Server - Dependencies Not Installed After Branch Checkout" - Similar deps sync issue in review sandbox

### Historical Context

This is the **third** `pnpm install` failure mode in E2B sandboxes:
1. **#1846**: Timeout (10min insufficient) - Fixed by increasing to 20min
2. **#1924**: GPT provider frozen-lockfile failure - Fixed by `executeInstallWithRetry()` with provider-specific flags
3. **This issue**: Missing CI=true - pnpm requires TTY for module directory removal

Each fix has been targeted at one code path, leaving the underlying issue (E2B sandboxes not configured as CI environments) unaddressed. The `getAllEnvVars()` function sets `IS_SANDBOX=1` but not `CI=true`.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `CI` environment variable is not set in E2B sandbox environments, causing `pnpm install` to require an interactive TTY for module directory removal confirmation, which is unavailable in headless E2B sandboxes.

**Detailed Explanation**:

1. **Environment gap**: The `getAllEnvVars()` function in `environment.ts:426-559` configures ~30 environment variables for E2B sandboxes (auth, Supabase, Payload, R2, etc.) and sets `IS_SANDBOX=1`, but does NOT set `CI=true`.

2. **pnpm behavior**: When pnpm needs to remove or recreate `node_modules` directories (e.g., to reconcile lockfile changes), it prompts for user confirmation via TTY. If no TTY is available and `CI` is not set, pnpm aborts with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`.

3. **Trigger condition**: The `createSandbox()` function (sandbox.ts:950-991) detects lockfile changes between the spec branch and dev, then runs `pnpm install` without `--frozen-lockfile` (line 987). The recent PostHog SDK update (commit 22ca3cf45) modified `pnpm-lock.yaml`, triggering this code path.

4. **Code path analysis**: There are 4 locations in sandbox.ts where `pnpm install` runs inside E2B:
   - Line 973: `pnpm install --frozen-lockfile` (fresh install)
   - Line 978: `pnpm install` (fallback)
   - Line 987: `pnpm install` (lockfile changed) **<-- crash location**
   - Line 1499: `pnpm install --frozen-lockfile` (review sandbox)

   None of these have `CI=true` set.

**Supporting Evidence**:
- Stack trace points to `sandbox.ts:987` - the `pnpm install` call in the `hasLockfileChanges` branch
- Error message explicitly states: "If you are running pnpm in CI, set the CI environment variable to 'true'"
- `getAllEnvVars()` has `IS_SANDBOX=1` but NOT `CI=true` (environment.ts:557)
- Commit 22ca3cf45 modified `pnpm-lock.yaml`, causing `hasLockfileChanges = true`

### How This Causes the Observed Behavior

1. User resumes orchestrator for S2086 (92% complete)
2. `createSandbox()` creates E2B sandbox with env vars from `getAllEnvVars()` (no CI=true)
3. Sandbox checks out branch `alpha/spec-S2086`
4. `git diff origin/dev -- pnpm-lock.yaml` detects changes -> `hasLockfileChanges = true`
5. Code takes the `hasLockfileChanges` branch (line 986-989) and runs `pnpm install`
6. pnpm attempts to reconcile template's `node_modules` with branch's lockfile
7. pnpm needs to remove some module directories, prompts for TTY confirmation
8. No TTY available, `CI` not set -> `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`
9. `sandbox.commands.run()` throws `CommandExitError` (exit code 1)
10. Error propagates up through `createSandboxWithRetry()` -> `orchestrate()` -> `main()`
11. Orchestrator crashes, 3 remaining features in S2086.I6 are never implemented

### Confidence Level

**Confidence**: High

**Reasoning**: The error message explicitly identifies the root cause ("set the CI environment variable to true"), the stack trace points to the exact `pnpm install` line, and code review confirms `CI=true` is absent from all sandbox environment variables. This is not a symptom - it IS the root cause. The fix is deterministic (add CI=true) and the pnpm documentation confirms this behavior.

## Fix Approach (High-Level)

Add `envs.CI = "true"` to the `getAllEnvVars()` function in `environment.ts:557` (right after the `IS_SANDBOX=1` line). This single-line change tells pnpm (and other CI-aware tools) that the E2B sandbox is a non-interactive environment, which:

1. Prevents the `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` error
2. Makes pnpm skip all interactive prompts
3. Is the correct semantic declaration for headless E2B sandboxes
4. Fixes all 4 `pnpm install` code paths at once (no per-command prefixing needed)

## Diagnosis Determination

The root cause is definitively identified: missing `CI=true` in E2B sandbox environment variables. This is a configuration gap in `getAllEnvVars()` that has been latent since the sandbox system was built but only manifests when `pnpm install` needs to perform destructive `node_modules` operations (triggered by lockfile differences between the E2B template's cached state and the spec branch).

The fix is a single-line addition to `environment.ts` that will prevent this entire class of pnpm TTY errors in E2B sandboxes.

## Additional Context

- S2086 was at 92% completion (16/19 features, 123/134 tasks) when this occurred
- The remaining 3 features are all UI polish tasks (responsive, accessibility, performance) in I6
- The initial orchestrator run likely succeeded because the lockfile hadn't diverged yet
- This bug will recur on ANY future orchestrator resume where `dev` has had dependency updates since the spec branch was created
- Setting `CI=true` is industry standard for headless/automated environments (GitHub Actions, Docker, etc.)

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (git log, gh issue list, gh issue view)*
