# Bug Diagnosis: payload#test runs in CI despite --filter=!payload exclusion

**ID**: ISSUE-pending
**Created**: 2026-02-13T17:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The PR Validation CI workflow's Unit Tests job fails because `payload#test` runs despite being explicitly excluded by `--filter=!payload` in the pnpm command. The root cause is that `pnpm -r run test` executes the **root workspace's** `test` script, which internally invokes `turbo test --filter=!web-e2e` — a command that does NOT exclude payload. This causes turbo to run payload's 829 tests, 83 of which fail because they require a Postgres database on `localhost:54522` that isn't provisioned in CI.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI/CD (GitHub Actions)
- **Node Version**: 22
- **pnpm Version**: 10.29.2
- **Database**: PostgreSQL (required on port 54522, not available in CI)
- **Last Working**: Unit tests have been skipped on all `dev` branch PR runs (never detected)

## Reproduction Steps

1. Create a PR targeting `dev` branch with TypeScript file changes
2. PR Validation workflow triggers, `Detect Changes` outputs `typescript: true`
3. Unit Tests job runs: `pnpm -r --parallel --if-present --filter=!web-e2e --filter=!payload --filter=!@slideheroes/alpha-scripts --filter=!@slideheroes/orchestrator-ui run test`
4. Observe turbo output showing `payload` in scope and `payload#test` failing

## Expected Behavior

`payload#test` should not run in CI since the CI command explicitly excludes it with `--filter=!payload`.

## Actual Behavior

`payload#test` runs via turbo (invoked by the root package's test script) and fails with `Error: connect ECONNREFUSED ::1:54522` because no Postgres is available.

## Diagnostic Data

### Execution Chain Analysis

```
CI Command:
  pnpm -r --parallel --if-present \
    --filter=!web-e2e --filter=!payload \
    --filter=!@slideheroes/alpha-scripts --filter=!@slideheroes/orchestrator-ui \
    run test

pnpm resolves these packages to run `test`:
  . (root: slideheroes@2.13.1) -> test: "turbo test --cache-dir=.turbo --filter=!web-e2e"
  apps/web                     -> test: "vitest run"
  packages/features/accounts   -> test: "vitest run"
  packages/features/admin      -> test: "vitest run"
  packages/features/auth       -> test: "vitest run"
  packages/features/team-accounts -> test: "vitest run"
  packages/monitoring/newrelic -> test: "vitest run"
  packages/next                -> test: "vitest run"
  packages/shared              -> test: "vitest run"
  packages/supabase            -> test: "vitest run"

Root's turbo command resolves to ALL packages with test scripts (only excludes web-e2e):
  Packages in scope: ... payload, web, @kit/*, @slideheroes/*  (40+ packages)

Result: payload#test runs TWICE-indirectly via turbo, despite pnpm filter excluding it.
```

### CI Log Evidence

```
# Root package invokes turbo (note: . = root workspace)
. test$ turbo test --cache-dir=.turbo --filter=!web-e2e

# Turbo includes payload in scope
. test: Packages in scope: ... payload ...

# Payload tests fail - no Postgres
. test: Error: cannot connect to Postgres:
. test: Error: connect ECONNREFUSED ::1:54522

# 83 of 829 payload tests fail (integration tests needing DB)
. test: Tests 83 failed | 745 passed | 1 skipped (829)
. test: Failed: payload#test

# Root script failure propagates
ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  slideheroes@2.13.1 test
```

### Why This Was Never Detected on `dev`

```
# All recent dev PR validation runs SKIPPED unit tests
Run 21837720638: skipped
Run 21830614570: skipped
Run 21830519379: skipped
Run 21830154232: skipped
Run 21801704625: skipped

# The Detect Changes filter finds no TypeScript changes in dev-to-dev
# promotion PRs, so Unit Tests never run on dev
```

### Confirmed on Multiple Branches

- `alpha/spec-S2072` (run 21994346194): FAILED - same error
- `staging` (run 21837778936, Feb 9): FAILED - same error
- `dev`: SKIPPED (never tested)

## Error Stack Traces

```
Error: cannot connect to Postgres. Details:
AggregateError:
  Error: connect ECONNREFUSED ::1:54522
  Error: connect ECONNREFUSED 127.0.0.1:54522
  code: "ECONNREFUSED"
```

## Related Code

- **Affected Files**:
  - `.github/workflows/pr-validation.yml:262` - CI test command with pnpm filters
  - `package.json:26` - Root test script: `turbo test --cache-dir=.turbo --filter=!web-e2e`
  - `apps/payload/vitest.setup.ts:20-22` - Default DATABASE_URI fallback to localhost:54522
  - `apps/payload/src/seed/seed-engine/__tests__/integration/` - Tests requiring Postgres
- **Recent Changes**: Root test script and CI workflow unchanged since at least Feb 9
- **Suspected Functions**: Root `package.json` test script filter mismatch

## Related Issues & Context

### Same Component

- #1813 (CLOSED): "E2E Payload Shards Fail - Missing Payload CMS Migrations in CI"
- #705 (CLOSED): "Payload CMS Database Port Mismatch Causes /home/course Page Failure"
- #706 (CLOSED): "Supabase Port Configuration Drift After Hyper-V Fix"

### Similar Symptoms

- #1594 (CLOSED): "E2E Sharded Workflow Supabase Connection Failures" - same ECONNREFUSED pattern
- #1791 (CLOSED): "E2E Shard 7 Fails - Next.js Overrides NODE_ENV Breaking Payload SSL Config"

### Historical Context

Payload CI failures are a recurring theme. Previous issues (#705, #706, #1594, #1791, #1813) all involved Postgres connectivity or configuration drift. The current issue is a new variant: filter mismatch between pnpm and turbo causing unintended test execution.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The root `package.json` test script uses `turbo test --filter=!web-e2e` which does NOT exclude `payload`, creating a filter mismatch with the CI command's `--filter=!payload`.

**Detailed Explanation**:

The CI workflow runs:
```bash
pnpm -r --parallel --if-present --filter=!web-e2e --filter=!payload ... run test
```

In pnpm 10, `-r` (recursive) includes the workspace root if it has a matching script. The root `slideheroes@2.13.1` package has:
```json
"test": "turbo test --cache-dir=.turbo --filter=!web-e2e"
```

The pnpm filter `--filter=!payload` correctly excludes `apps/payload` from pnpm's scope. But it does NOT exclude the root package (`slideheroes`), which has a different name. The root's test script then invokes turbo, which has its own independent filter (`--filter=!web-e2e`) that DOES include payload.

This creates a **filter bypass**: pnpm excludes payload directly, but the root's turbo re-includes it indirectly.

Additionally, this causes **duplicate execution** of web and package tests — once via pnpm's direct invocation, and once via turbo from the root package.

**Supporting Evidence**:
- CI log: `. test$ turbo test --cache-dir=.turbo --filter=!web-e2e` (root runs turbo)
- CI log: `Packages in scope: ... payload ...` (turbo includes payload)
- CI log: `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL slideheroes@2.13.1 test` (root package fails)
- Code: `package.json:26` — `"test": "turbo test --cache-dir=.turbo --filter=!web-e2e"`

### How This Causes the Observed Behavior

1. CI command runs `pnpm -r run test` with payload excluded
2. pnpm includes root workspace (`slideheroes@2.13.1`) — not filtered
3. Root's test script runs `turbo test --filter=!web-e2e` — only excludes web-e2e
4. Turbo picks up `payload#test` since it's not in turbo's exclusion list
5. Payload integration tests try to connect to Postgres on localhost:54522
6. No Postgres in CI -> 83 tests fail -> turbo exits 1 -> pnpm exits 1

### Confidence Level

**Confidence**: High

**Reasoning**: The CI logs directly show the execution chain: pnpm runs root's test script, root's turbo command includes payload in scope, payload tests fail with ECONNREFUSED. The filter mismatch between pnpm (`--filter=!payload`) and turbo (`--filter=!web-e2e`) is visible in the code.

## Fix Approach (High-Level)

Two issues need fixing:

**Issue 1 — Filter bypass (primary)**: Update the CI test command to exclude the root workspace, preventing the turbo re-invocation entirely. Change the CI command to:
```bash
pnpm -r --parallel --if-present \
  --filter=!web-e2e --filter=!payload \
  --filter=!@slideheroes/alpha-scripts --filter=!@slideheroes/orchestrator-ui \
  --filter=!slideheroes \
  run test
```
Adding `--filter=!slideheroes` excludes the root package, eliminating the turbo double-invocation and the filter bypass.

**Issue 2 — Root test script alignment (secondary)**: Update the root `package.json` test script to match CI exclusions, preventing future drift:
```json
"test": "turbo test --cache-dir=.turbo --filter=!web-e2e --filter=!payload"
```

**Issue 3 — Duplicate execution (bonus)**: With Issue 1 fixed, tests only run via pnpm's direct package invocations (no turbo double-run), which is actually more efficient and eliminates the duplication.

## Diagnosis Determination

Root cause conclusively identified: pnpm recursive includes the root workspace whose test script re-invokes turbo without the payload exclusion filter. This has been silently present since at least Feb 9 (staging failure) but never detected on dev because unit tests are always skipped on dev promotion PRs (no TypeScript file changes in the diff).

## Additional Context

- 745 of 829 payload tests pass without Postgres (pure unit tests with mocks)
- Only 83 tests fail — the seed-engine integration tests that call `initializePayload()` which connects to Postgres
- A longer-term fix could also add a `vitest.workspace` ignore for integration tests when `CI=true` and no database is available, but the filter fix is simpler and more correct

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (PR checks, CI logs, issue search), git (branch comparison), Read (workflow, package.json, vitest config, test files)*
