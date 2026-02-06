# Bug Diagnosis: PR Validation Aikido and Accessibility Test Infrastructure Failures

**ID**: ISSUE-pending
**Created**: 2026-02-06T15:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: integration

## Summary

PR #1963 (`chore/centralized-state-transitions`) shows two failed checks in the PR validation workflow: Aikido Security Scan (400 API error) and Accessibility Tests (E2E database setup failure). Both are infrastructure issues unrelated to code changes. Neither blocks merge (only "PR Status Check" is a required check), but they create visual noise and mask legitimate failures. The accessibility test failure has a code-level root cause (missing `--ignore-health-check` flag) while the Aikido failure is a transient external API issue.

## Environment

- **Application Version**: commit 3594ec97e
- **Environment**: CI/CD (GitHub Actions)
- **Runner**: RunsOn 2cpu-linux-x64
- **Node Version**: 20
- **Workflow Run**: https://github.com/slideheroes/2025slideheroes/actions/runs/21755486192
- **PR**: #1963
- **Last Working**: Aikido last successful Jan 29 (run 21485945764); Accessibility tests have `continue-on-error: true` since #1759 fix

## Reproduction Steps

1. Push any PR with TypeScript changes to trigger PR validation
2. Observe Aikido Security Scan job fails at "Run Aikido Security Scan" step
3. Observe Accessibility Tests job fails at "Set up E2E database for accessibility tests" step

## Expected Behavior

Both jobs should either pass or fail gracefully without showing as red X in the PR checks tab.

## Actual Behavior

Both jobs show as failed (red X) in PR checks despite `continue-on-error: true` at job level. The PR Status Check aggregation job still passes because `needs.*.result` reports "success" for continue-on-error jobs, so merge is not blocked.

## Diagnostic Data

### Failure 1: Aikido Security Scan

**Error annotation**:
```
start scan failed: {"status_code":400,"reason_phrase":"read"}
```

**Analysis**:
- This is a **new error pattern** — distinct from the previous 402 "paid plan" error (fixed in #1744)
- HTTP 400 "read" suggests an Aikido API service issue (malformed request or API change)
- Aikido last succeeded on Jan 29 2026 (dependabot/next-16.1.5 PR, run 21485945764)
- No PRs with Aikido-eligible changes ran between Jan 29 and Feb 6 (all intervening runs were promotion PRs that skipped Aikido)
- The action version `AikidoSec/github-actions-workflow@v1.0.13` has not been updated
- **Root cause**: Transient Aikido API issue OR breaking change in their API between Jan 29 - Feb 6

### Failure 2: Accessibility Tests — E2E Database Setup

**Error**: Process exit code 1 at `supabase start` step (step 8 of accessibility-test job)

**Root cause identified**: The accessibility test uses `supabase start` WITHOUT the `--ignore-health-check` flag.

**Evidence**:
```yaml
# pr-validation.yml line 425 (BROKEN)
supabase start

# e2e-sharded.yml line 117 (WORKING)
supabase start --ignore-health-check

# e2e-smart.yml line 152 (WORKING)
supabase start --ignore-health-check
```

All three E2E-related workflows start Supabase, but only the accessibility test omits `--ignore-health-check`. This flag was added to E2E workflows as part of previous fixes (#1594, #1595, #1632) but was never applied to the accessibility test job.

**Additional factor**: The accessibility test runs on RunsOn custom runners (`2cpu-linux-x64`) while E2E sharded tests use `ubuntu-latest`. RunsOn runners may have different Docker/container behavior, making the health check more likely to timeout.

### Console Output

**Aikido annotation**:
```
start scan failed: {"status_code":400,"reason_phrase":"read"}
```

**Accessibility annotation**:
```
No files were found with the provided path: apps/e2e/accessibility-report/. No artifacts will be uploaded.
Process completed with exit code 1.
```

## Related Code

- **Affected Files**:
  - `.github/workflows/pr-validation.yml` (lines 295-317: Aikido job, lines 374-485: accessibility job)
- **Recent Changes**: No changes to this workflow in the current PR
- **Suspected Functions**: `supabase start` without `--ignore-health-check` (line 425)

## Related Issues & Context

### Direct Predecessors
- #1758 (CLOSED): "Bug Diagnosis: PR Validation Workflow Multiple Failures (Timeout, Aikido, E2E Database)" — Same three-failure pattern. Root cause was wrong working directory (`apps/e2e` instead of `apps/web`), all scans disabled on Aikido, and unit test timeout. All three were fixed.
- #1759 (CLOSED): "Bug Fix: PR Validation Workflow Multiple Failures" — Implemented fixes for #1758
- #1741 (CLOSED): "Aikido Security Scan Fails with 402 - Paid Plan Required" — Different error (402 vs 400)
- #1744 (CLOSED): "Bug Fix: Aikido Security Scan Fails with 402" — Fixed the 402 by disabling paid features

### Related Infrastructure Issues
- #1594 (CLOSED): "E2E Sharded Workflow Supabase Connection Failures" — Added `--ignore-health-check` to E2E sharded
- #1595 (CLOSED): "Bug Fix: E2E Sharded Workflow Supabase Health Check and Startup" — First introduction of `--ignore-health-check`
- #1632 (CLOSED): "Bug Fix: E2E Sharded Workflow Supabase Health Check Variable Timing" — Refined health check handling
- #1749 (CLOSED): "Bug Diagnosis: PR Validation Workflow Multiple Failures After Bug Fixes" — Cascading CI issues
- #1942 (CLOSED): "CI/CD Workflow Configuration Drift Between Dev, Staging, and Production" — Workflow drift issue

### Historical Context

This project has a recurring pattern of CI/CD infrastructure issues (18+ SLO violation alerts, 10+ closed PR validation bug reports). The `--ignore-health-check` flag was a key fix applied to E2E workflows (#1594-#1632) but was never applied to the accessibility test job — a classic configuration drift problem. The Aikido 400 error is new and unrelated to previous 402 issues.

## Root Cause Analysis

### Identified Root Causes

**Root Cause 1 — Accessibility Tests (Code Fix Available)**:

**Summary**: `supabase start` in the accessibility test job is missing the `--ignore-health-check` flag that all other E2E workflows use, causing intermittent database setup failures on RunsOn runners.

**Detailed Explanation**: When `supabase start` runs without `--ignore-health-check`, it waits for all Supabase containers to pass health checks. On RunsOn custom runners (2cpu-linux-x64), container startup timing is less predictable than on `ubuntu-latest` runners. If any container's health check exceeds the timeout, `supabase start` exits with code 1, failing the entire job. The E2E sharded and smart workflows already handle this with `--ignore-health-check` followed by explicit readiness waits, but the accessibility test was never updated.

**Supporting Evidence**:
- `pr-validation.yml:425`: `supabase start` (no flag)
- `e2e-sharded.yml:117`: `supabase start --ignore-health-check` (with flag)
- `e2e-smart.yml:152`: `supabase start --ignore-health-check` (with flag)
- Issues #1594, #1595, #1632 all addressed this exact problem for E2E sharded tests

---

**Root Cause 2 — Aikido Security Scan (External/Transient)**:

**Summary**: Aikido's API returned an unexpected HTTP 400 "read" error, which is an external service issue outside our control.

**Detailed Explanation**: The error `{"status_code":400,"reason_phrase":"read"}` is not a configuration issue on our side. The workflow configuration is correct (validated by successful run on Jan 29). The 400 status code with "read" reason is an Aikido API-side issue — either a transient service disruption or an undocumented API behavior change. This is distinct from the previous 402 "paid plan" error (#1741).

**Supporting Evidence**:
- Aikido succeeded on Jan 29 with identical configuration
- No changes to workflow file or Aikido action version since last success
- Error message is from Aikido's API, not from GitHub Actions
- 400 "read" is not documented in AikidoSec's GitHub Action docs

### How This Causes the Observed Behavior

1. PR validation triggers Aikido and accessibility jobs
2. Aikido immediately fails on API call (12s runtime)
3. Accessibility test builds app successfully, but `supabase start` health check times out on RunsOn runner → exit code 1
4. Both jobs report `conclusion: "failure"` in GitHub API
5. GitHub shows red X on both checks in PR tab
6. However, `continue-on-error: true` means `needs.*.result` = "success" for downstream `pr-status` job
7. `pr-status` (the only required check) will pass → merge is not blocked

### Confidence Level

**Confidence**: High (Accessibility), Medium (Aikido)

**Reasoning**:
- **Accessibility**: The missing `--ignore-health-check` flag is a clear code-level discrepancy vs. working workflows. This is the same root cause fixed in #1594/#1595 but never applied here.
- **Aikido**: Without access to Aikido's API logs, we can't confirm whether this is transient or a breaking change. The identical config worked 8 days ago, suggesting transient.

## Fix Approach (High-Level)

### Fix 1 — Accessibility Tests (Recommended)
Add `--ignore-health-check` flag to `supabase start` in the accessibility test job (line 425 of pr-validation.yml), matching the pattern used by E2E sharded and smart workflows. Optionally add a health check wait loop after startup.

### Fix 2 — Aikido Security Scan (Monitor)
1. **Immediate**: Re-run the workflow to see if Aikido error persists (transient test)
2. **If persistent**: Check for Aikido action updates (`@v1.0.13` → latest), review Aikido status page, or open a support ticket
3. **If still failing**: Consider upgrading the action version or temporarily disabling the scan

### Fix 3 — Reduce Visual Noise (Optional Enhancement)
Consider whether the `pr-status` job check on `needs.aikido-security.result` (line 577) should be removed since Aikido is already non-blocking via `continue-on-error: true`. Currently it's redundant — `needs.aikido-security.result` will always be "success" due to `continue-on-error`, so the check never triggers. This dead code could cause confusion during future maintenance.

## Diagnosis Determination

Two independent infrastructure failures are occurring:

1. **Accessibility Tests**: Root cause is a **configuration drift** — the `--ignore-health-check` flag was added to E2E sharded/smart workflows in Jan 2026 fixes but was never applied to the accessibility test job in pr-validation.yml. This is a code fix.

2. **Aikido Security Scan**: Root cause is an **external API issue** — Aikido's API returns a 400 "read" error not seen before. The configuration is correct (worked Jan 29). This needs monitoring and potentially re-running.

Neither failure blocks merge because only "PR Status Check" is a required branch protection check, and it correctly aggregates results considering `continue-on-error` semantics.

## Additional Context

- Branch protection on both `dev` and `main` only requires "PR Status Check" — individual job failures don't block merge
- The project has experienced 18+ SLO violation alerts related to CI/CD since Jan 2026
- All previous PR validation issues (#1737-#1759, #1796-#1797, #1817-#1822) are closed
- The `continue-on-error: true` + `needs.*.result` check pattern in `pr-status` is technically dead code for Aikido (line 577) since `continue-on-error` always reports "success" to downstream jobs

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (issue search, workflow runs, job API, annotations API, branch protection), file reads (pr-validation.yml, e2e-sharded.yml), grep (supabase start patterns), perplexity (continue-on-error semantics)*
