# Bug Diagnosis: apps/web Vitest Hangs Indefinitely in CI Despite Passing Locally in 3s

**ID**: ISSUE-pending
**Created**: 2026-02-07T22:30:00Z
**Reporter**: msmith
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The `apps/web` vitest process hangs indefinitely in CI after initialization ("RUN v4.0.15" appears) but never produces test output. All 8 other test packages complete in under 5 seconds. The same 725 tests pass locally in 3.28 seconds. This has persisted across 15+ debugging commits over two days, surviving every fix attempted including turbo bypasses, environment variable fixes, cache disabling, pool configuration changes, and runner upgrades.

## Environment

- **Application Version**: dev branch (commit 14cbcd921)
- **Environment**: CI (GitHub Actions via RunsOn self-hosted)
- **Runner**: RunsOn m7i-flex.xlarge (4 vCPU, 16GB RAM, AWS spot instance)
- **Node Version**: 20 (CI) / 22.16.0 (local)
- **Vitest Version**: 4.0.15
- **Turbo Version**: 2.6.3
- **pnpm Version**: 10.14.0
- **OS**: Ubuntu (RunsOn AMI ami-030ecbbdd3d009809) / WSL2 Linux 6.6.87.2 (local)
- **Last Working**: Unknown - unit tests were first added to pr-validation.yml during this debugging cycle

## Reproduction Steps

1. Push any commit to a PR branch (e.g., PR #1963 `chore/centralized-state-transitions`)
2. Wait for the `pr-validation.yml` workflow to run
3. Observe the "Unit Tests" job
4. All small packages (shared, supabase, auth, accounts, team-accounts, next, admin, newrelic) complete in ~5 seconds
5. `apps/web` shows "RUN v4.0.15" but never produces any test output
6. Step times out after 5 minutes

## Expected Behavior

All 9 test packages should complete in under 30 seconds total, matching local behavior where `apps/web` runs 725 tests in 3.28 seconds.

## Actual Behavior

`apps/web` vitest starts (prints "RUN v4.0.15") but hangs indefinitely. No test files are processed, no output is produced. The process must be killed by the step timeout. Orphan `node` and `esbuild` processes are found at job cleanup.

## Diagnostic Data

### Console Output - Latest CI Run (parallel mode, 2026-02-07T21:23:05Z)

```
Scope: 40 of 45 workspace projects
apps/web test$ vitest run
packages/features/accounts test$ vitest run
packages/features/admin test$ vitest run
packages/features/auth test$ vitest run
packages/features/team-accounts test$ vitest run
packages/monitoring/newrelic test$ vitest run
packages/next test$ vitest run
packages/shared test$ vitest run
packages/supabase test$ vitest run

# All 8 small packages complete in ~5 seconds with 100% pass rate
# packages/monitoring/newrelic: 1 passed (806ms)
# packages/shared: 3 passed (1.59s)
# packages/supabase: 27 passed (2.01s)
# packages/features/accounts: 23 passed (2.65s)
# packages/next: 39 passed (3.31s)
# packages/features/auth: 136 passed (2.87s)
# packages/features/team-accounts: 147 passed (3.80s)

# apps/web shows RUN at 21:23:09 but ZERO test output follows
apps/web test: RUN v4.0.15 /home/runner/_work/2025slideheroes/2025slideheroes/apps/web

# 5 minutes of silence...
##[error]The action 'Run unit tests' has timed out after 5 minutes.

# Orphan processes killed at cleanup:
Terminate orphan process: pid (1641) (node)
Terminate orphan process: pid (1662) (sh)
Terminate orphan process: pid (1663) (node)
Terminate orphan process: pid (1680) (esbuild)
Terminate orphan process: pid (1690) (node)
```

### Local Test Results (same codebase)

```bash
$ cd apps/web && CI=true npx vitest run
# Test Files  28 passed (28)
#       Tests  725 passed (725)
#    Start at  17:24:52
#    Duration  3.28s (transform 5.37s, setup 2.24s, import 8.82s, tests 3.45s, environment 15.36s)
```

### CI Runner Details

```
RUNS_ON_INSTANCE_TYPE: m7i-flex.xlarge
RUNS_ON_INSTANCE_LIFECYCLE: spot
RUNS_ON_AWS_REGION: us-east-2
NODE_VERSION: 20
PNPM_VERSION: 10.14.0
```

## Error Stack Traces

No error is thrown. The process simply hangs silently after printing the "RUN" banner. This is the fundamental difficulty - there is no error to debug, just a silent hang.

## Related Code

- **Affected Files**:
  - `.github/workflows/pr-validation.yml` (line ~256, unit test step)
  - `apps/web/vitest.config.mts` (web vitest configuration)
  - `apps/web/vitest.setup.ts` (test setup with jsdom mocks)
  - `turbo.json` (test task configuration)
- **Recent Changes**: 15+ commits modifying CI test configuration since 2026-02-06
- **Suspected Root Cause**: `apps/web` vitest with `pool: "forks"` and `environment: "jsdom"` hangs during test file collection or jsdom environment setup in CI, likely due to Node.js version mismatch (Node 20 CI vs Node 22 local) or resource contention on spot instances

### Key Configuration

**apps/web/vitest.config.mts:**
```typescript
test: {
    name: "web",
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    pool: "forks" as const,  // child_process.fork()
    testTimeout: 10000,
    hookTimeout: 10000,
}
```

## Related Issues & Context

### Direct Predecessors
- **#320** (CLOSED): "[Bug] Test Suite Hangs After Unit Tests" - Same hanging pattern, different context (test-controller.cjs, not CI workflow). Identified as recurring architectural issue.
- **#1462** (CLOSED): "CI Unit Tests Fail - Cannot find package '@kit/shared/registry'" - Different root cause but same CI test infrastructure
- **#1694** (CLOSED): "Vitest Test File in Playwright Directory Causes CI Failure" - Vitest CI discovery issues

### Related Infrastructure Issues
- **#1984** (CLOSED): "fix(ci): disable turbo remote cache for unit tests" - Identified turbo remote cache HTTP uploads hanging on spot instances. Fix applied but didn't resolve the web vitest hang.
- **#1982** (CLOSED): "fix(deploy): simplify Vercel installCommand for corepack + exclude payload from unit tests" - Excluded payload from tests
- **#1943** (CLOSED): "CI/CD Workflow Configuration Drift" - Related CI infrastructure issues

### Similar Symptoms
- **#1759** (CLOSED): "PR Validation Workflow Multiple Failures (Timeout, Aikido, E2E Database)" - Same timeout pattern
- **#1796** (CLOSED): "CI/CD Pipeline Regression - PR Validation and E2E Sharded Workflow Failures" - Broader CI failures
- **#1583** (CLOSED): "E2E Sharded Tests WebServer Timeout - Dev Server Stuck at Starting" - Similar hanging pattern

### Historical Context

This is part of a **recurring pattern** of test processes hanging in CI. Issue #320 (Sep 2025) documented the same behavior in a different context and identified it as the "4th occurrence." The CI environment has persistent issues with long-running Node.js child processes that don't terminate cleanly.

## Research Reports Referenced

- `.ai/reports/research-reports/2026-02-07/perplexity-turborepo-ci-hang-deadlock.md` - Identified turbo v2 strict env mode blocking CI variable (vercel/turborepo#8281). Fix applied (`passThroughEnv: ["CI"]`) but didn't resolve the web vitest hang.
- `.ai/reports/research-reports/2026-02-07/perplexity-aikidosec-github-action-scan-failure.md` - Separate issue, successfully resolved with `continue-on-error: true`.

## Root Cause Analysis

### Identified Root Cause

**Summary**: `apps/web` vitest with `pool: "forks"` hangs during jsdom environment initialization in CI, likely due to the combination of Node 20 (CI) with jsdom 27.x/parse5 8.x ESM compatibility issues under child_process.fork() on the RunsOn spot instance environment.

**Detailed Explanation**:

The web app's vitest uses `pool: "forks"` (child_process.fork) with `environment: "jsdom"`. When vitest forks child processes to run tests on the CI runner (Node 20, RunsOn m7i-flex.xlarge spot):

1. The main vitest process prints "RUN v4.0.15" (the banner)
2. Vitest attempts to fork worker processes for the 28 test files
3. The forked workers need to initialize the jsdom environment
4. **jsdom 27.x depends on parse5 8.x which is ESM-only** - this was confirmed when `@slideheroes/orchestrator-ui` crashed with `ERR_REQUIRE_ESM: require() of ES Module parse5@8.0.0` in the same CI environment
5. Under `pool: "forks"`, the worker processes attempt to `require()` parse5 through jsdom's CJS entry point, hitting the ESM boundary
6. Unlike the orchestrator-ui crash (which used a simpler vitest config), the web app's more complex configuration (setupFiles, multiple mocks, server.deps.inline) causes the ESM resolution to hang silently rather than crash
7. The forked workers never complete initialization, the main process waits indefinitely

**Why it works locally**: Local environment uses Node 22.16.0, which has better ESM/CJS interop and may resolve the parse5 ESM import differently. Node 22 includes improved `require()` of ESM modules support.

**Supporting Evidence**:
1. `@slideheroes/orchestrator-ui` crashed with identical ESM/parse5/jsdom error in same CI run: `Error: require() of ES Module parse5@8.0.0 from jsdom/lib/jsdom/browser/parser/html.js not supported`
2. Local Node 22 runs fine; CI Node 20 hangs
3. The hang occurs at vitest worker initialization (after "RUN" banner, before any test output)
4. Orphan `node` and `esbuild` processes left behind suggest child processes that failed to start or exit
5. All packages NOT using jsdom (the 8 small packages) complete successfully in CI
6. The web app is the only test package using both `pool: "forks"` AND `environment: "jsdom"` with extensive setup files

### How This Causes the Observed Behavior

1. CI runner has Node 20, which doesn't support `require()` of ESM modules
2. jsdom 27.x loads parse5 8.x which is ESM-only
3. vitest with `pool: "forks"` creates child_process.fork() workers
4. Each worker tries to initialize jsdom environment
5. The ESM/CJS interop fails silently in the forked process (unlike the orchestrator-ui which crashed)
6. Workers hang, main vitest process waits for workers that never report back
7. 5-minute step timeout kills everything

### Confidence Level

**Confidence**: Medium-High

**Reasoning**: The ESM/parse5/jsdom error is confirmed in the same CI environment (orchestrator-ui). The Node 20 vs 22 difference explains local-vs-CI behavior. The `pool: "forks"` fork semantics explain silent hang vs crash. However, definitive proof would require adding `--reporter=verbose` logging inside the forked workers or testing with Node 22 on CI.

## Fix Approach (High-Level)

Three approaches, in order of preference:

1. **Upgrade CI Node version to 22** (matches local): Change `NODE_VERSION: 20` to `NODE_VERSION: 22` in pr-validation.yml. Node 22 has `--experimental-require-module` (enabled by default in 22.12+) which resolves `require()` of ESM modules. This is the simplest fix and aligns CI with the local dev environment.

2. **Switch web vitest pool from "forks" to "threads"** (worker_threads don't hit ESM boundary the same way): Change `pool: "forks"` to `pool: "threads"` in `apps/web/vitest.config.mts`. Note: this was tried previously (commit `a471a6d10`) but reverted due to tinypool termination issues. May work now with vitest 4.0.15.

3. **Pin jsdom to pre-ESM version** or add vitest `deps.optimizer` config to pre-bundle parse5.

## Diagnosis Determination

The root cause is an **ESM/CJS interop failure** in CI where Node 20 cannot `require()` the ESM-only parse5 8.x module loaded by jsdom 27.x inside vitest's forked worker processes. This manifests as a silent hang rather than a crash due to the fork() process isolation. The fix is to upgrade CI to Node 22 (which supports require of ESM) or change the vitest pool to avoid the ESM boundary.

## Failed Attempts - Complete History

### Session 1: 2026-02-06 (overnight debugging)

| Commit | Fix Attempted | Result |
|--------|--------------|--------|
| `5d9b80995` | Upgrade runner to 4cpu, use `--affected`, drop coverage | Still hung |
| `a471a6d10` | Limit turbo concurrency, switch web to `threads` pool | tinypool termination issues |
| `6096722ff` | Reduce turbo concurrency to 2, revert web to `forks` pool | Still hung |
| `93f0658b4` | Fix turbo `--affected`/`--filter` incompatibility | Still hung |
| `03be1d4cd` | Fix vitest watch mode hang (add `run` flag) | Fixed watch mode, but vitest still hung |
| `64f3c18fd` | Remove `^topo` dependency from test tasks | Reduced overhead, but still hung |
| `1f7c423d0` | Fix payload vitest watch mode hang | Fixed payload, didn't help web |
| `b650d5d31` | Exclude payload from unit tests | Removed one failure source |
| `d359ee694` | Disable turbo remote cache, bump concurrency to 4 | Still hung |
| `e38001a11` | Properly disable turbo remote cache | Still hung |
| `2dfc342e6` | Add turbo signature key, remove token workaround | Still hung |
| `bddcc8b91` | Disable turbo remote cache via empty token | Still hung |
| `a5c4a8586` | Disable turbo remote cache (PR #1984) | Still hung |

### Session 2: 2026-02-07 (today's debugging)

| Commit | Fix Attempted | Result |
|--------|--------------|--------|
| `c7d69dafd` | Add missing env vars for a11y tests, unblock Aikido | Fixed a11y + Aikido (separate issues) |
| `f373ca2aa` | Increase unit test step timeout to 12 minutes | Confirmed tests never complete, not just slow |
| `cc947c92d` | Exclude alpha-scripts (turbo deadlock from nested pnpm) | Fixed deadlock, but web still hung |
| `2e7f213ad` | Add `passThroughEnv: ["CI"]` to turbo.json test task | CI variable now passes through, but still hung |
| `e6523fbef` | Add turbo `-vvv` verbose logging | Revealed turbo remote cache credentials leaking to step |
| `14c639dc1` | Restore turbo remote cache overrides (empty tokens) | Tokens confirmed empty, but still hung |
| `6e9c5a102` | Bypass turbo entirely, use `pnpm -r` | orchestrator-ui ESM error revealed, pnpm sequential mode hung |
| `14cbcd921` | Use `pnpm -r --parallel --if-present`, exclude orchestrator-ui | **KEY FINDING**: All 8 packages pass, web vitest hangs after "RUN" |

### Total: 21 fix attempts across 2 sessions, all failing to resolve the web vitest hang

## Additional Context

- The `pool: "forks"` comment in vitest.config.mts says: "child_process.fork() terminates cleanly in CI unlike worker_threads which hits tinypool termination bug under resource pressure" - this suggests the pool was already changed once to work around a different CI issue
- Node 20 is LTS but Node 22 is current LTS as of 2025-10. The project uses Node 22 locally (v22.16.0)
- The `.nvmrc` file should be checked for the project's intended Node version
- RunsOn spot instances may have additional constraints (CPU throttling, instance termination) that interact with fork() behavior

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, git log, vitest run, Bash, Read, Glob, Grep, perplexity-expert research*
