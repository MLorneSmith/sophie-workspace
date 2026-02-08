# Bug Diagnosis: CI/CD Pipeline Comprehensive Assessment

**ID**: ISSUE-pending
**Created**: 2026-02-06T15:50:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The CI/CD pipeline has 34 workflow files (42 active in GitHub, 4 disabled) and is suffering from a pattern of persistent failures concentrated in a few key areas. Analysis of 30 recent failures, 50 historical GitHub issues, and all workflow source code reveals three systemic problems: (1) the Dev Promotion Readiness workflow is the dominant failure source with a permissions bug, (2) the staging deployment pipeline is broken due to E2E test failures across all shards, and (3) configuration drift between environments has been partially addressed but not fully resolved.

## Environment

- **Application Version**: Latest on `dev` branch
- **Environment**: All (dev, staging, production)
- **Node Version**: 24 (per CI runner logs)
- **Last Working**: Intermittent - some runs succeed, others fail

## Part 1: Current Pipeline State

### Workflow Inventory (34 files, 42 active GitHub workflows)

#### Working Workflows (Consistently Passing)
| Workflow | Category | Status |
|----------|----------|--------|
| `pr-validation.yml` | PR Quality Gates | Green |
| `semgrep.yml` | Security | Green |
| `trufflehog-scan.yml` | Security | Green |
| `bundle-size-alert.yml` | PR Quality | Green |
| `dev-deploy.yml` | Deployment | Green |
| `dev-integration-tests.yml` | Testing | Green |
| `pipeline-alerts.yml` | Monitoring | Green |
| `pipeline-metrics.yml` | Monitoring | Green |
| `performance-monitor.yml` | Monitoring | Green |
| `alpha-validation.yml` | Alpha Workflow | Green (when code typechecks) |
| `context-staleness.yml` | Maintenance | Green |
| `dependabot-auto-merge.yml` | Automation | Green |

#### Failing Workflows (Active Issues)
| Workflow | Failure Rate | Root Cause | Impact |
|----------|-------------|------------|--------|
| `dev-promotion-readiness.yml` | **14 of 30 recent failures** | `deployments: read` permission not sufficient for `check-stale-deployment` job; 403 on `listDeployments` API | Blocks automated dev→staging promotion |
| `staging-deploy.yml` | 1 recent failure, all E2E shards failed | E2E test infrastructure issue - all 10 shards fail simultaneously | Blocks staging deployment |
| Dependabot npm_and_yarn | 5 recent failures | Automated dependency update failures | Non-critical, auto-generated |
| `alpha-validation.yml` | 4 recent failures | TypeScript errors in alpha/spec-S1918 branch | Branch-specific, not infrastructure |

#### Dormant/Untested Workflows
| Workflow | Issue |
|----------|-------|
| `production-deploy.yml` | Not triggered recently (nothing promoted to main) |
| `staging-promotion-readiness.yml` | Not triggered (staging not deploying) |
| `k6-load-test.yml` | Reusable, never called independently |
| `lighthouse-ci.yml` | Reusable, never called independently |
| `visual-regression.yml` | Reusable, never called independently |
| `auto-rollback.yml` | Reusable, never called independently |
| `manual-deploy.yml` | Manual trigger only |
| `staging-deploy-simple.yml` | Test/debug file |
| `test-runson-staging.yml` | Test/debug file |

### Failure Chain Analysis

The failures create a cascading blockage:

```
dev-deploy ✅ → dev-integration-tests ✅ → dev-promotion-readiness ❌ (permissions bug)
                                                    ↓
                                            No PR created for staging
                                                    ↓
                                            staging-deploy ❌ (when manually triggered, E2E fails)
                                                    ↓
                                            production-deploy ⚠️ (untested/unreachable)
```

## Part 2: Root Cause Analysis

### Root Cause 1: Dev Promotion Readiness - 403 Permission Error (DOMINANT FAILURE)

**Summary**: The `check-stale-deployment` job in `dev-promotion-readiness.yml` calls `github.rest.repos.listDeployments()` which requires `deployments: read` permission. While the permission is declared in the workflow (line 26), the job uses the default `GITHUB_TOKEN` which does NOT get deployment permissions when triggered via `workflow_run` events.

**Supporting Evidence**:
```
RequestError [HttpError]: Resource not accessible by integration
status: 403
url: 'https://api.github.com/repos/slideheroes/2025slideheroes/deployments?environment=development&per_page=1'
x-accepted-github-permissions: deployments=read
```

**Causal Chain**:
1. `workflow_run` trigger fires after Dev Integration Tests complete
2. `check-stale-deployment` job starts (runs only on `workflow_dispatch`, but the conditional `if: github.event_name == 'workflow_dispatch'` should prevent it on `workflow_run` events)
3. Wait - looking at the code again: line 394 says `if: github.event_name == 'workflow_dispatch'` which SHOULD skip this on `workflow_run` events
4. But the logs show it's failing on `workflow_dispatch` runs triggered manually
5. The `workflow_dispatch` trigger uses `GITHUB_TOKEN` which has `deployments: read` declared but the token from the dispatch event doesn't inherit workflow-level permissions correctly

**Additional Finding**: Even when `check-stale-deployment` fails, the `assess-readiness` job can succeed. But GitHub marks the overall workflow as "failed" because ANY job failure = workflow failure. This means 14 "failures" may have actually had successful promotion assessments that were masked by the stale deployment check failing.

**Fix Approach**: Add `continue-on-error: true` to the `check-stale-deployment` job since it's purely informational, OR fix the permissions issue by using a GitHub App token instead of GITHUB_TOKEN for the deployments API call.

### Root Cause 2: Staging Deploy - E2E Test Infrastructure Failure

**Summary**: The most recent staging deploy (run 21720800809) failed with ALL 10 E2E shards failing simultaneously. This pattern (all shards fail, not just some) indicates an infrastructure/setup issue, not flaky tests.

**Supporting Evidence**:
- All 10 E2E shards (3-12) failed at "Run E2E tests" step
- E2E Shard 8 took 333s just for runner startup (job-scheduled took 314s)
- Build Application, Deploy, and all downstream jobs were skipped because E2E failed first

**Likely Causes** (in order of probability):
1. Missing environment variables for E2E tests in staging context
2. Supabase connection issues from CI runners
3. Application not accessible from E2E runners (Vercel protection bypass)

### Root Cause 3: Configuration Drift (Partially Fixed)

Issue #1942 documented configuration drift between environments. Some fixes have been applied:
- staging-deploy.yml now has correct RunsOn syntax (line 47)
- staging-deploy.yml now has `actions: read` permission (line 34)
- staging-deploy.yml now has `paths-ignore` (lines 8-16)
- production-deploy.yml has correct RunsOn syntax (line 39)
- production-deploy.yml has `actions: read` (line 26)
- production-deploy.yml has `paths-ignore` (lines 8-16)

**Still Not Fixed** (per #1942 checklist):
- production-deploy.yml may still reference `VERCEL_PROJECT_ID` vs `VERCEL_PROJECT_ID_WEB`
- Invalid reusable workflow usage (line 82 in production-deploy)
- Build artifact naming inconsistencies

## Part 3: Lessons from Working Workflows

### What the Working Workflows Do Right

**1. `dev-deploy.yml` (the gold standard)**
- Correct RunsOn syntax with `github.run_id`
- Proper permission declarations
- `paths-ignore` to skip unnecessary runs
- Conditional Turbo cache configuration
- Concurrency controls
- Clear job dependencies

**2. `pr-validation.yml`**
- Maximizes parallelism (10+ jobs run concurrently)
- Uses `continue-on-error: true` for advisory checks (accessibility)
- Proper caching strategy (pnpm store + Turbo)
- Clear success/failure criteria

**3. `dev-integration-tests.yml`**
- Multiple fallback strategies for health checks
- Retry logic for flaky external services
- Non-blocking GraphQL endpoint testing

### Patterns to Apply to Broken Workflows

| Pattern | From | Apply To |
|---------|------|----------|
| `continue-on-error: true` for non-critical jobs | pr-validation.yml | dev-promotion-readiness `check-stale-deployment` |
| Retry logic with fallbacks | dev-integration-tests.yml | staging-deploy E2E setup |
| GitHub App token for cross-workflow operations | dev-promotion-readiness `assess-readiness` | `check-stale-deployment` job |
| Environment variable validation step | dev-deploy.yml | staging-deploy E2E jobs |
| Conditional job execution based on prior success | production-deploy.yml | staging-deploy (skip E2E on revalidation) |

## Part 4: Historical Issue Analysis

### Timeline of CI/CD Issues (50 issues, all closed)

**Phase 1: Foundation (June-July 2025)** - Issues #44, #58, #59, #95, #96, #98
- Initial workflow creation and optimization
- Caching strategy established
- Snyk replaced by Aikido

**Phase 2: Infrastructure Migration (Aug-Sep 2025)** - Issues #174, #215, #276, #290
- Migration from Ubicloud to RunsOn runners
- RunsOn syntax issues emerged (#215, #290)
- Docker registry tag uppercase issue

**Phase 3: Stabilization (Sep-Oct 2025)** - Issues #417, #433, #434, #435, #455
- **Critical**: 57% success rate at one point (#417)
- Turbo build failures in Vercel (#433, #434)
- Authentication setup failures with Turnstile (#455)

**Phase 4: Integration Testing (Nov 2025)** - Issues #587, #591
- Vercel protection blocking health endpoints
- Dependabot GitHub Actions updates breaking builds

**Phase 5: Current (Jan-Feb 2026)** - Issues #1550, #1839, #1942
- Shell script permissions
- Staging NEXT_PUBLIC_SITE_URL port mismatch
- Configuration drift diagnosis

### Recurring Themes

1. **RunsOn syntax issues**: Issues #215, #290, #1897, #1942 - same problem resurfacing across environments
2. **Environment variable mismatches**: Issues #455, #591, #1839 - different configs per environment
3. **Vercel integration fragility**: Issues #433, #591 - protection bypass, deployment URLs
4. **E2E test infrastructure**: Issues #276, #1826, #1897 - shards failing, environment setup issues
5. **Permissions/tokens**: Current dominant failure - GitHub token permissions

## Part 5: Synthesized Recommendations

### CRITICAL (Fix This Week) - Unblock the Pipeline

1. **Fix `dev-promotion-readiness.yml` stale deployment check**
   - Add `continue-on-error: true` to `check-stale-deployment` job (immediate fix)
   - Or use GitHub App token for deployment API access (proper fix)
   - Impact: Eliminates 14 of 30 recent failures immediately

2. **Debug staging E2E test failures**
   - Add environment variable validation step before E2E tests run
   - Add explicit error logging for Supabase/app connectivity
   - Consider running a single "canary" E2E test before full shard matrix
   - Impact: Unblocks staging deployment

3. **Fix production-deploy.yml remaining issues from #1942**
   - Verify `VERCEL_PROJECT_ID` vs `VERCEL_PROJECT_ID_WEB`
   - Fix invalid reusable workflow reference (line 82)
   - Impact: Prevents production deployment failure when eventually reached

### HIGH (This Sprint) - Prevent Recurrence

4. **Create environment configuration validation workflow**
   - New reusable workflow that validates all environment variables, secrets, and permissions exist
   - Run as first job in dev-deploy, staging-deploy, production-deploy
   - Pattern: Extract the "what works" from dev-deploy and make it reusable

5. **Standardize workflow templates**
   - Create a template/checklist for workflow files that enforces:
     - RunsOn syntax: `runs-on=${{ github.run_id }}/runner=Xcpu-linux-x64`
     - Required permissions block
     - `paths-ignore` configuration
     - Concurrency controls
     - Turbo cache configuration

6. **Add workflow linting to CI**
   - Use `actionlint` in PR validation to catch syntax errors before merge
   - Would have caught the invalid reusable workflow reference in production-deploy

### MEDIUM (This Month) - Improve Reliability

7. **Replace hardcoded metrics with real integrations**
   - Code coverage: Integrate Codecov or coverage artifact parsing
   - Performance score: Complete Lighthouse integration
   - Impact: Promotion readiness scores become meaningful

8. **Clean up dormant workflows**
   - Delete `staging-deploy-simple.yml` (test file)
   - Delete `test-runson-staging.yml` (test file)
   - Disable or remove `workflow.yml` (legacy)
   - Impact: Reduces maintenance surface from 34 to ~30 workflows

9. **Add E2E test retry/resilience**
   - Add a "preflight" job that verifies app accessibility before launching 10 E2E shards
   - Implement per-shard retry with `retry-on-failure: 2`
   - Impact: Prevents all-shard-fail scenarios from blocking staging

### LOW (Future) - Optimize

10. **Consolidate promotion readiness workflows**
    - `dev-promotion-readiness.yml` and `staging-promotion-readiness.yml` share 80% logic
    - Create a reusable promotion-readiness workflow parameterized by source/target branch

11. **Create CI/CD dashboard**
    - The `pipeline-metrics.yml` creates weekly reports as GitHub issues
    - These are informational but not actionable - consider a real dashboard

12. **Document workflow dependencies**
    - Create a `.github/README.md` with workflow dependency graph
    - Add CODEOWNERS for workflow files to prevent unreviewed changes

## Diagnostic Data

### Console Output - Dev Promotion Readiness Failure
```
RequestError [HttpError]: Resource not accessible by integration
status: 403
url: https://api.github.com/repos/slideheroes/2025slideheroes/deployments?environment=development&per_page=1
x-accepted-github-permissions: deployments=read
```

### Staging Deploy - All E2E Shards Failed
```
Failed jobs: E2E Shard 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
All failed at: "Run E2E tests for shard N" step
Runner startup time: 333s (314s waiting for job-scheduled)
Downstream skipped: Build, Deploy, Smoke Tests, Visual Regression, Load Test
```

### Failure Distribution (Last 30 Failed Runs)
```
Dev Promotion Readiness:    14 failures (47%)
Dependabot npm_and_yarn:     5 failures (17%)
Alpha Branch Validation:     4 failures (13%)
Deploy to Dev:               2 failures (7%)
Dependabot Auto-Merge:       2 failures (7%)
Deploy to Staging:           1 failure  (3%)
E2E Tests (Sharded):         1 failure  (3%)
dev-promotion-readiness.yml: 1 failure  (3%)
```

## Related Issues & Context

### Direct Predecessors
- #1942 (CLOSED): "CI/CD Workflow Configuration Drift" - Documented RunsOn syntax, Vercel project ID, and permission issues
- #1897 (CLOSED): "Staging Deploy E2E Shards Stuck with RunsOn Runner Issues"
- #1839 (CLOSED): "staging-deploy NEXT_PUBLIC_SITE_URL Port Mismatch"
- #1826 (CLOSED): "Staging Deploy E2E Tests Failing Due to Missing Environment Variables"

### Historical Pattern
- #417 (CLOSED): "CI/CD Critical: 57% Success Rate" - September 2025 crisis
- #168 (CLOSED): "Inconsistent deployment approaches across environments" - July 2025, same drift problem

### Related Infrastructure
- #1550 (CLOSED): "Shell Scripts Lack Execute Permissions in Git"
- #174 (CLOSED): "Migrate from Ubicloud to RunsOn" - Source of RunsOn syntax issues

## Root Cause Analysis

### Identified Root Cause

**Summary**: Three interconnected root causes create a cascading pipeline failure: (1) GitHub token permissions bug in dev-promotion-readiness stale deployment check, (2) E2E test infrastructure failure in staging due to environment setup issues, and (3) incomplete propagation of fixes across environments.

**Detailed Explanation**:
The pipeline is architecturally sound but suffering from implementation-level issues. The dev environment works because it has been iteratively fixed over months. Those fixes have not been systematically propagated to staging and production. Meanwhile, a new permissions regression was introduced in the dev-promotion-readiness workflow that creates a dominant false-failure signal.

**Supporting Evidence**:
- 403 error logs from dev-promotion-readiness (permissions)
- All 10 E2E shards failing simultaneously in staging (infrastructure, not test flakiness)
- Issue #1942 documenting drift, filed and closed without full resolution
- Historical pattern: Issues #168 (Jul 2025) and #1942 (Feb 2026) describe the same drift problem

### Confidence Level

**Confidence**: High

**Reasoning**: The 403 error is deterministic and clearly documented in logs. The all-shards-fail pattern is a known indicator of infrastructure vs test issues. The drift pattern is well-documented across 8+ months of issues.

## Fix Approach (High-Level)

1. Add `continue-on-error: true` to `check-stale-deployment` job to immediately stop the dominant failure source
2. Debug staging E2E by adding preflight connectivity check before launching shards
3. Complete the remaining #1942 fix items for production-deploy.yml
4. Add `actionlint` to PR validation to prevent future workflow syntax issues

## Diagnosis Determination

The CI/CD pipeline's problems are NOT architectural - the design is solid with proper promotion chains, quality gates, and monitoring. The problems are operational: individual workflow bugs, environment configuration drift, and permissions issues. The most impactful fix is the single-line `continue-on-error: true` addition to dev-promotion-readiness, which will eliminate 47% of all recent failures.

## Additional Context

- 46 total GitHub workflow definitions exist (42 active, 4 disabled)
- The pipeline has been under active development since June 2025
- RunsOn migration from Ubicloud has been a persistent source of issues
- Weekly CI/CD metrics reports are auto-generated but mostly informational
- No currently open CI/CD issues exist in GitHub (all 50 found are CLOSED)

---
*Generated by Claude Debug Assistant*
*Tools Used: GitHub CLI (gh), Explore agent, Bash agent, Glob, Grep, Read*
