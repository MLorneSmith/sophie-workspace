# Bug Diagnosis: PR Validation Workflow Multiple Failures After Implementing #1748, #1750, #1756

**ID**: ISSUE-1758
**Created**: 2026-01-23T15:05:00Z
**Reporter**: User
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The PR Validation workflow (run #21290028575) on the `dev` branch for PR #1556 is failing with three distinct issues despite implementing fixes in issues #1748, #1750, and #1756. The workflow shows: Unit Tests timing out after 15 minutes, Accessibility Tests failing on E2E database setup, and Aikido Security Scan failing with "must enable at least one of the scans" error.

## Environment

- **Application Version**: 2.13.1
- **Environment**: GitHub Actions CI
- **Node Version**: 20
- **Workflow Run**: https://github.com/MLorneSmith/2025slideheroes/actions/runs/21290028575
- **Branch**: dev (PR #1556)
- **Last Working**: Unknown - unit tests have been skipped in recent successful runs

## Reproduction Steps

1. Push changes to `dev` branch
2. PR Validation workflow triggers
3. Unit Tests job runs for 15+ minutes and times out
4. Accessibility Tests fail on "Set up E2E database" step
5. Aikido Security Scan fails with "must enable at least one of the scans"

## Expected Behavior

- Unit Tests should complete within 15-minute timeout
- Accessibility Tests should set up E2E database successfully
- Aikido Security Scan should execute without configuration errors

## Actual Behavior

- Unit Tests exceed 15-minute timeout and are cancelled
- Accessibility Tests fail at E2E database setup (supabase start in apps/e2e)
- Aikido Security Scan exits with error "You must enable at least one of the scans"

## Diagnostic Data

### Workflow Run Summary
```
Run ID: 21290028575
Trigger: pull_request
Branch: dev
PR: #1556

Job Results:
✓ Check Skip Conditions - 5s
✓ Detect Changes - 13s
✓ Lint & Format - 1m43s
✗ Unit Tests - 15m15s (TIMEOUT)
✓ Markdown Lint - 1m41s
✓ TypeScript Check - 3m48s
✓ YAML Lint - 1m42s
✗ Accessibility Tests - 4m56s (E2E DATABASE SETUP FAILED)
✓ Docker Security Scan - 25s
✓ Bundle Size Check - 4m41s
✗ Aikido Security Scan - 8s (CONFIG ERROR)
✗ PR Status Check - 3s
```

### Error Annotations
```
Unit Tests: "The job has exceeded the maximum execution time of 15m0s"
Unit Tests: "The operation was canceled."

Accessibility Tests: "No files were found with the provided path: apps/e2e/accessibility-report/"
Accessibility Tests: "Process completed with exit code 1." (Step: Set up E2E database)

Aikido Security Scan: "You must enable at least one of the scans."
```

### Aikido Configuration (Current)
```yaml
- name: Run Aikido Security Scan
  uses: AikidoSec/github-actions-workflow@v1.0.13
  with:
    secret-key: ${{ secrets.AIKIDO_SECRET_KEY }}
    fail-on-timeout: true
    fail-on-dependency-scan: false  # Disabled
    fail-on-sast-scan: false        # Disabled (paid plan only)
    fail-on-iac-scan: false         # Disabled (paid plan only)
    minimum-severity: 'HIGH'
```

### Accessibility Test E2E Database Setup Step
```yaml
- name: Set up E2E database for accessibility tests
  run: |
    cd apps/e2e
    supabase start              # <-- FAILS HERE: No supabase config in apps/e2e
    sleep 5
    supabase db reset --linked=false
    supabase db seed
```

## Error Stack Traces

### Unit Tests Timeout
No stack trace - job was cancelled after exceeding 15-minute timeout.

### Accessibility Tests
The `supabase start` command fails because there is no Supabase configuration (`config.toml`) in `apps/e2e` directory. The Supabase configuration exists in `apps/web/supabase/` instead.

### Aikido Security Scan
The action requires at least one scan type to be enabled via `fail-on-*` parameters. Currently all three are set to `false`:
- `fail-on-dependency-scan: false`
- `fail-on-sast-scan: false`
- `fail-on-iac-scan: false`

## Related Code
- **Affected Files**:
  - `.github/workflows/pr-validation.yml` (lines 216-255 for Unit Tests, 289-310 for Aikido, 367-478 for Accessibility)
  - `vitest.config.mts` (root config)
  - `turbo.json` (test:coverage task definition)
- **Recent Changes**:
  - `86da7f45f` fix(ci): resolve PR validation workflow multiple failures
  - `7254e6447` fix(ci): add PAYLOAD_SECRET env vars
  - `8b8e4d8d7` fix(ci): disable Aikido IaC scan

## Related Issues & Context

### Direct Predecessors
- #1750 (CLOSED): "Bug Fix: PR Validation Workflow Multiple Failures" - Partially addressed issues but Aikido fix was incomplete
- #1748 (CLOSED): "Bug Fix: PR Validation Fails on Dependabot PRs Due to Stale Workflow Files" - Added auto-rebase for Dependabot
- #1756 (CLOSED): "Bug Fix: Dependabot PR #1751 Breaking Dependency Updates" - Fixed react-resizable-panels imports

### Related Infrastructure Issues
- #1745: Original diagnosis of PR validation failures
- #1744: Aikido IaC scan 402 error fix

### Historical Context
The fixes in #1750 disabled all three Aikido scan types (`fail-on-dependency-scan`, `fail-on-sast-scan`, `fail-on-iac-scan`) to avoid 60+ HIGH severity vulnerabilities from transitive dependencies. However, this created a new failure mode where the Aikido action requires at least ONE scan to be enabled.

## Root Cause Analysis

### Identified Root Causes

**1. Unit Tests Timeout (15+ minutes)**

**Summary**: Tests are running without Turbo remote cache hits, causing full re-execution of all test suites across 10+ packages.

**Detailed Explanation**:
The `test:coverage` command runs `turbo test:coverage --cache-dir=.turbo --filter=!web-e2e` which executes coverage tests across all packages. The workflow annotation shows tests started at 14:45:43Z and timed out at 15:00:58Z. The dry-run shows 120 test:coverage tasks need to run. Without cache hits (new SHA, cache miss), all tests must run sequentially with coverage instrumentation, which is significantly slower than cached runs.

Key factors:
- Root `vitest.config.mts` includes 11 projects (apps/web, apps/payload, packages/*, .ai/alpha/scripts)
- Coverage adds ~2-3x overhead per test file
- 147 total test files across all packages
- 15-minute timeout is insufficient for uncached full coverage run

**Evidence**:
- Annotation: "The job has exceeded the maximum execution time of 15m0s"
- Test step started at 14:45:43Z, cancelled at 15:00:58Z (15m15s)
- turbo.json shows `test:coverage` has `cache: true` but global hash changed

---

**2. Aikido Security Scan Configuration Error**

**Summary**: All three `fail-on-*` scan parameters are set to `false`, but the action requires at least one scan type enabled.

**Detailed Explanation**:
The fix in commit `86da7f45f` disabled `fail-on-dependency-scan: false` to work around 60+ HIGH vulnerabilities in transitive dependencies. Combined with already-disabled SAST and IaC scans (paid features), this leaves zero enabled scans, triggering the action's validation error.

**Evidence**:
- Annotation: "You must enable at least one of the scans."
- Workflow file lines 302-305 show all three `fail-on-*` options are `false`
- Aikido documentation confirms at least one scan must be enabled

---

**3. Accessibility Tests E2E Database Setup Failure**

**Summary**: The workflow runs `supabase start` in `apps/e2e` directory which has no Supabase configuration.

**Detailed Explanation**:
The accessibility test step attempts to start Supabase from the `apps/e2e` directory (`cd apps/e2e && supabase start`), but there is no `supabase/config.toml` in that directory. The Supabase configuration exists in `apps/web/supabase/` instead. This is a configuration path error in the workflow.

**Evidence**:
- `ls apps/e2e/` shows no supabase directory
- `apps/web/supabase/config.toml` exists with full Supabase configuration
- Workflow step explicitly runs `cd apps/e2e` before `supabase start`

### Confidence Level

**Confidence**: High

**Reasoning**:
- All three failures have clear, reproducible error messages
- Configuration issues are evident from direct code inspection
- Aikido error is documented behavior when all scans disabled
- Timeout is clearly due to 15-minute limit vs uncached test execution time

## Fix Approach (High-Level)

### Issue 1: Unit Tests Timeout
Two options:
1. **Increase timeout**: Change `timeout-minutes: 15` to `timeout-minutes: 30` for uncached runs
2. **Optimize test execution**:
   - Run tests in parallel (Turbo already supports this)
   - Consider running without coverage in PR validation (coverage in separate job)
   - Investigate why remote cache isn't hitting

### Issue 2: Aikido Security Scan
Change `fail-on-dependency-scan: true` but keep it non-blocking using `continue-on-error: true` at the job level. This enables the scan to run and report findings without failing the workflow.

Alternatively, if dependency scan must remain disabled:
- Remove Aikido job entirely, OR
- Enable one of the scans but make it non-blocking

### Issue 3: Accessibility Tests E2E Database
Change the working directory from `apps/e2e` to `apps/web` for Supabase commands, or copy/link the Supabase config to the e2e directory:
```yaml
- name: Set up E2E database for accessibility tests
  run: |
    cd apps/web  # Changed from apps/e2e
    npx supabase start
    sleep 5
    npx supabase db reset --linked=false
    npx supabase db seed
```

## Diagnosis Determination

Three independent root causes identified:

1. **Unit Tests Timeout**: 15-minute job limit is insufficient for uncached test:coverage execution across the full monorepo (147 test files, 11 projects). This is a timeout configuration issue, not a test failure.

2. **Aikido Security Scan**: Configuration error from setting all three `fail-on-*` parameters to `false`. The Aikido action requires at least one scan type to be enabled.

3. **Accessibility Tests**: Wrong working directory for Supabase commands. The workflow runs Supabase CLI from `apps/e2e` which has no Supabase configuration, when it should run from `apps/web` where the configuration exists.

All issues are configuration problems in `.github/workflows/pr-validation.yml` and can be fixed with targeted changes to the workflow file.

## Additional Context

The issues #1748, #1750, and #1756 addressed different problems (Dependabot auto-rebase, PAYLOAD_SECRET env vars, react-resizable-panels imports) but introduced or failed to catch these new configuration issues:
- #1750 introduced the Aikido all-scans-disabled problem
- The E2E database path issue appears to be a pre-existing bug that wasn't caught
- The unit test timeout may be new or was masked by previous runs hitting cache

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, git, grep, find, WebFetch, Read*
