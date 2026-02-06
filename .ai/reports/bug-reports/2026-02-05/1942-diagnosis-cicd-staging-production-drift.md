# Bug Diagnosis: CI/CD Workflow Configuration Drift Between Dev, Staging, and Production

**ID**: ISSUE-pending
**Created**: 2026-02-05T00:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The CI/CD pipeline has significant configuration drift between the working dev-deploy.yml workflow and the staging-deploy.yml/production-deploy.yml workflows. Many fixes applied to get the dev deployment working have NOT been propagated to staging and production workflows, causing a "whack-a-mole" debugging experience.

## Environment

- **Application Version**: Current dev branch
- **Environment**: CI/CD (GitHub Actions)
- **Node Version**: As per .nvmrc
- **Database**: PostgreSQL via Supabase
- **Last Working**: dev-deploy.yml is working; staging/production have not been successfully deployed recently

## Reproduction Steps

1. Push code to staging or main branch
2. Observe workflow failures or inconsistent behavior
3. Compare with successful dev-deploy.yml runs

## Expected Behavior

All deployment workflows (dev, staging, production) should use consistent, working configurations.

## Actual Behavior

Staging and production workflows have outdated configurations that cause various failures.

## Diagnostic Data

### CRITICAL ISSUE #1: RunsOn Runner Syntax Inconsistency

**Root Cause**: Three different RunsOn syntax formats are used across workflows

| Syntax Format | Used In | Status |
|--------------|---------|--------|
| `runs-on=${{ github.run_id }}/runner=2cpu-linux-x64` | dev-deploy.yml, production-deploy.yml, most workflows | **WORKING** |
| `"runs-on/runner=4cpu-linux-x64"` (quoted, no run_id) | staging-deploy.yml | **BROKEN** - causes startup_failure |
| `runs-on=${{ github.run_id }},runner=2cpu-linux-x64` (comma separator) | staging-deploy-simple.yml, test-runson-staging.yml | **UNTESTED** |

**Evidence from staging-deploy.yml (lines 35, 67, 121, etc.)**:
```yaml
runs-on: "runs-on/runner=4cpu-linux-x64"  # WRONG - missing run_id, uses quotes
```

**Correct format from dev-deploy.yml**:
```yaml
runs-on: runs-on=${{ github.run_id }}/runner=4cpu-linux-x64  # CORRECT
```

**Historical Context**: Issues #1896, #1897, #215 all document RunsOn syntax problems causing failures.

---

### CRITICAL ISSUE #2: Production Uses Wrong Vercel Project ID Secret

**Root Cause**: production-deploy.yml uses `VERCEL_PROJECT_ID` while dev uses `VERCEL_PROJECT_ID_WEB`

**Evidence from production-deploy.yml (line 131)**:
```yaml
project-id: ${{ secrets.VERCEL_PROJECT_ID }}  # INCONSISTENT with dev
```

**Correct format from dev-deploy.yml (line 166)**:
```yaml
project-id: ${{ secrets.VERCEL_PROJECT_ID_WEB }}  # CONSISTENT naming
```

**Impact**: If `VERCEL_PROJECT_ID` secret isn't set (or points to wrong project), deployment fails.

---

### CRITICAL ISSUE #3: Invalid Workflow Syntax in production-deploy.yml

**Root Cause**: Line 82 uses `uses:` syntax for reusable workflow inside a `steps:` block, which is invalid

**Evidence (production-deploy.yml lines 81-82)**:
```yaml
      - name: Run Weekly Security Scan
        uses: ./.github/workflows/security-weekly-scan.yml  # INVALID - can't use workflow as step
```

**Fix**: Either:
- Remove this step (security scan runs separately)
- Or convert to a script that triggers the workflow via gh CLI

---

### CRITICAL ISSUE #4: Missing Turbo Cache Configuration

**Root Cause**: Staging and production have hardcoded `TURBO_REMOTE_CACHE_ENABLED: true` while dev has conditional logic

**Dev-deploy.yml (working)**:
```yaml
TURBO_REMOTE_CACHE_ENABLED: ${{ secrets.TURBO_TOKEN != '' && 'true' || 'false' }}
TURBO_REMOTE_CACHE_SIGNATURE_KEY: ${{ secrets.TURBO_REMOTE_CACHE_SIGNATURE_KEY || '' }}
```

**Staging-deploy.yml / production-deploy.yml (fragile)**:
```yaml
TURBO_REMOTE_CACHE_ENABLED: true  # Hardcoded - fails if TURBO_TOKEN not set
```

---

### CRITICAL ISSUE #5: Missing `actions: read` Permission

**Root Cause**: Staging and production workflows lack `actions: read` permission that dev has

**Dev-deploy.yml (line 29)**:
```yaml
permissions:
  contents: read
  deployments: write
  pull-requests: write
  issues: write
  checks: write
  actions: read  # PRESENT
```

**Production-deploy.yml (lines 14-16)**:
```yaml
permissions:
  contents: read
  deployments: write
  # MISSING: actions: read
```

**Impact**: Cannot access GitHub Actions API for artifact management, workflow status checks.

---

### CRITICAL ISSUE #6: Missing `paths-ignore` Configuration

**Root Cause**: Staging and production don't ignore documentation changes, triggering unnecessary deployments

**Dev-deploy.yml (lines 7-16)**:
```yaml
paths-ignore:
  - '**.md'
  - '**.mdx'
  - 'docs/**'
  - '.github/**.md'
  - '.claude/**'
  - '.vscode/**'
  - 'LICENSE'
  - '.gitignore'
  - '.env.example'
```

**Staging-deploy.yml / production-deploy.yml**: No paths-ignore configured.

---

### CRITICAL ISSUE #7: Build Artifact Naming Inconsistency

**Root Cause**: Different artifact naming conventions cause download failures

| Workflow | Artifact Name Format |
|----------|---------------------|
| artifact-sharing.yml | `build-artifacts-${{ inputs.environment }}-${{ inputs.commit_sha }}` |
| staging-deploy.yml | `build-artifacts-staging-${{ github.sha }}` |
| production-deploy.yml | `build-artifacts-production` (NO SHA!) |
| reusable-build.yml | `build-artifacts-${{ inputs.environment }}` |

**Impact**: Production expects `build-artifacts-production` but reusable-build.yml produces `build-artifacts-production` without commit SHA, causing potential stale artifact reuse.

---

### CRITICAL ISSUE #8: Vercel CLI Version Inconsistency

**Root Cause**: Different Vercel CLI versions across workflows

| Workflow | Version |
|----------|---------|
| dev-deploy.yml | `vercel@48.8.0` (pinned) |
| manual-deploy.yml | `vercel@latest` |
| vercel-deploy action | `vercel@latest` |
| auto-rollback.yml | `vercel@latest` |

**Impact**: Version mismatches can cause deployment inconsistencies.

---

### CRITICAL ISSUE #9: Staging Uses Different Build Approach

**Root Cause**: Staging uses `artifact-sharing.yml` while production uses `reusable-build.yml`

**Staging-deploy.yml (lines 475-480)**:
```yaml
build:
  name: Build Application
  uses: ./.github/workflows/artifact-sharing.yml
  with:
    environment: staging
    commit_sha: ${{ github.sha }}
```

**Production-deploy.yml (lines 85-91)**:
```yaml
build:
  name: Build Application
  uses: ./.github/workflows/reusable-build.yml
  with:
    environment: production
```

**Impact**: Different build behaviors, caching strategies, and artifact outputs.

---

### ISSUE #10: Missing NEXT_PUBLIC_AUTH_* Environment Variables in Production Build

**Root Cause**: Auth method configuration needed at build time isn't set in production

**Staging test-setup (working)**:
```yaml
NEXT_PUBLIC_AUTH_PASSWORD: 'true'
NEXT_PUBLIC_AUTH_MAGIC_LINK: 'false'
NEXT_PUBLIC_AUTH_OTP: 'false'
```

**Production**: Not configured in build step.

---

### CRITICAL ISSUE #11: STRIPE_SECRET_KEY Empty in Staging E2E Tests (CONFIRMED)

**Root Cause**: staging-deploy.yml uses `${{ secrets.STRIPE_SECRET_KEY }}` but the secret is empty/not set, while the working e2e-sharded.yml uses a hardcoded dummy value.

**Evidence from Feb 4 run logs**:
```
Test Setup  STRIPE_SECRET_KEY:
```
(Empty value)

**Error in test execution**:
```json
{
  "error": {
    "message": "Stripe secret key must start with 'sk_' or 'rk_'"
  }
}
```

**Working e2e-sharded.yml (line 240)**:
```yaml
STRIPE_SECRET_KEY: 'sk_test_dummy'
```

**Broken staging-deploy.yml (lines 137, 226)**:
```yaml
STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

**Fix**: Either:
1. Set the `STRIPE_SECRET_KEY` secret in GitHub for staging environment
2. Or use a dummy test key like e2e-sharded.yml does: `STRIPE_SECRET_KEY: 'sk_test_dummy'`

---

## Related Issues & Context

### Direct Predecessors
- #1897 (CLOSED): "Bug Fix: Staging Deploy E2E Shards Stuck with RunsOn Runner Issues"
- #1896 (CLOSED): "Bug Diagnosis: Staging Deploy E2E Shards Stuck with RunsOn Runner Issues"
- #1826 (CLOSED): "Bug Fix: Staging Deploy E2E Tests Failing Due to Missing Environment Variables"
- #215 (CLOSED): "Staging deployment consistently fails with startup_failure despite correct RunsOn syntax"

### Historical Context
Multiple issues (#951, #952, #959, #961) documented RunsOn runner problems. Fixes were applied piecemeal, creating configuration drift.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Configuration drift between dev-deploy.yml and staging/production workflows due to incremental fixes not being propagated consistently.

**Detailed Explanation**:
The dev-deploy.yml workflow has been actively debugged and fixed over time, resulting in a working configuration. However, these fixes were not systematically applied to staging-deploy.yml and production-deploy.yml. Key differences include:

1. RunsOn syntax (most critical - causes immediate failures)
2. Permission scopes
3. Environment variable handling
4. Build artifact naming
5. Turbo cache configuration
6. Vercel CLI versioning

**Supporting Evidence**:
- staging-deploy.yml line 35: `"runs-on/runner=4cpu-linux-x64"` (wrong syntax)
- production-deploy.yml line 82: Invalid workflow-as-step syntax
- production-deploy.yml line 131: Wrong secret name `VERCEL_PROJECT_ID`

### How This Causes the Observed Behavior

1. User pushes to staging branch
2. staging-deploy.yml starts with broken RunsOn syntax
3. Jobs get `startup_failure` because runners can't be provisioned
4. Even if runners start, missing permissions cause API failures
5. Build inconsistencies cause artifact download failures
6. Deployment never completes

### Confidence Level

**Confidence**: High

**Reasoning**: Direct comparison of working dev-deploy.yml with non-working staging/production workflows reveals clear syntactic and configuration differences that explain observed failures. Historical issues confirm these patterns caused problems before.

## Fix Approach (High-Level)

Apply the following changes to staging-deploy.yml and production-deploy.yml:

1. **RunsOn Syntax** (CRITICAL): Replace all `"runs-on/runner=Xcpu-linux-x64"` with `runs-on=${{ github.run_id }}/runner=Xcpu-linux-x64`
2. **Permissions**: Add `actions: read` to permissions block
3. **Vercel Project ID**: Use `VERCEL_PROJECT_ID_WEB` consistently
4. **Remove Invalid Step**: Delete or fix line 82 in production-deploy.yml
5. **Turbo Cache**: Use conditional expression like dev-deploy.yml
6. **paths-ignore**: Add documentation exclusions to reduce unnecessary deployments
7. **Align Build Workflows**: Consider using same build approach across all environments
8. **Pin Vercel CLI**: Use consistent version across all workflows

## Checklist of Updates Needed

### staging-deploy.yml
- [ ] Fix RunsOn syntax (12 occurrences)
- [ ] Add `actions: read` permission
- [ ] Add `paths-ignore` configuration
- [ ] Use conditional Turbo cache config
- [ ] Pin Vercel CLI version

### production-deploy.yml
- [ ] Fix line 82 invalid workflow syntax
- [ ] Change `VERCEL_PROJECT_ID` to `VERCEL_PROJECT_ID_WEB`
- [ ] Add `actions: read` permission
- [ ] Add `paths-ignore` configuration
- [ ] Use conditional Turbo cache config
- [ ] Align artifact naming with staging
- [ ] Pin Vercel CLI version

### staging-deploy-simple.yml
- [ ] Fix RunsOn syntax (comma to slash separator)

### test-runson-staging.yml
- [ ] Fix RunsOn syntax (comma to slash separator)

## Additional Context

The "whack-a-mole" experience stems from fixing symptoms without addressing the root cause: configuration drift. This diagnosis provides a systematic checklist to align all deployment workflows with the proven working dev-deploy.yml configuration.

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Bash (gh issue list), GitHub CLI*
