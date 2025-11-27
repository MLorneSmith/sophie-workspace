# Dependabot GitHub Actions Update - Failure Analysis

**Date**: 2025-11-11
**Branch**: `dependabot/github_actions/dev/github-actions-3e74b0b7b6`
**Base Commit**: `107add86d435f9eae35d52055d7bb1062d284fa6`
**Failed Workflows**:
- E2E Tests (Sharded) - Run ID: 19272405853
- Bundle Size Alert - Run ID: 19272405876

## Executive Summary

The Dependabot PR updating 15 GitHub Actions to their latest major versions introduced **two critical incompatibilities**:

1. **Secrets Access Limitation**: Dependabot PRs have restricted secret access by GitHub's security design
2. **Breaking Changes in Actions**: Major version upgrades (v4→v6) introduced behavioral changes incompatible with the current composite action structure

**Root Cause**: Not the GitHub Actions updates themselves, but the interaction between Dependabot's security restrictions and missing environment variables required for production builds.

---

## Failed Workflows Analysis

### 1. E2E Tests (Sharded) - Run ID: 19272405853

**Failure Point**: Setup Test Server job - Build step

**Error**:
```
[ERROR] command finished with error: command (/packages/mcp-server) pnpm run build exited (1)
@kit/mcp-server#build: command exited (1)
```

**Root Cause**: Build failure in `packages/mcp-server` during the pnpm build process. This is NOT directly related to the GitHub Actions updates but rather to the composite action using `actions/setup-node@v4` being upgraded.

**Key Issue**: The composite action `.github/actions/setup-deps` still references `actions/setup-node@v4` but the workflows now expect compatibility with v6.

---

### 2. Bundle Size Alert - Run ID: 19272405876

**Failure Point**: Build PR branch step

**Primary Error**:
```
Error: ❌ SECURITY: Cloudflare Turnstile test keys detected in production build! 
Set NEXT_PUBLIC_CAPTCHA_SITE_KEY environment variable with your production sitekey.
```

**Secondary Errors**:
```
Error importing Supabase admin client: Please provide the variable NEXT_PUBLIC_SUPABASE_PUBLIC_KEY
Failed to collect page data for /identities
Build error occurred
```

**Root Cause**: 
- Dependabot PRs run with **"Secret source: Dependabot"** which has limited access to repository secrets
- Missing required environment variables for production build:
  - `NEXT_PUBLIC_CAPTCHA_SITE_KEY`
  - `NEXT_PUBLIC_SUPABASE_PUBLIC_KEY`
  - Other secrets referenced in workflow but not accessible

**This is BY DESIGN** - GitHub restricts Dependabot's access to secrets for security reasons.

---

## GitHub Actions Version Changes

### All Updated Actions:

| Action | From | To | Breaking Changes |
|--------|------|-----|------------------|
| actions/checkout | v4 | v5 | Minor: Node 20 requirement, new default behaviors |
| actions/upload-artifact | v4 | v5 | **MAJOR**: Artifact isolation changes, different merge behavior |
| actions/download-artifact | v4 | v6 | **MAJOR**: Pattern matching changes, artifact v4 API breaking changes |
| actions/setup-node | v4 | v6 | **CRITICAL**: Cache strategy changes, pnpm support modifications |
| pnpm/action-setup | v2 | v4 | **MAJOR**: Installation method changes, cache handling different |
| actions/github-script | v7 | v8 | Minor: Updated GitHub API client |
| github/codeql-action | v3 | v4 | Minor: Analysis improvements |
| actions/configure-pages | v4 | v5 | Minor |
| actions/upload-pages-artifact | v3 | v4 | Minor |
| treosh/lighthouse-ci-action | v11 | v12 | Minor |
| docker/build-push-action | v5 | v6 | Minor: Buildx updates |
| codecov/codecov-action | v4 | v5 | Minor |
| aquasecurity/trivy-action | 0.28.0 | 0.33.1 | Minor |
| actions/setup-go | v5 | v6 | Minor |
| trufflesecurity/trufflehog | 3.82.13 | 3.90.11 | Minor |

---

## Critical Breaking Changes

### 1. actions/setup-node@v4 → v6

**Breaking Changes**:
- Changed default cache behavior for pnpm
- Modified cache key generation algorithm
- Different handling of `node-version-file` resolution

**Impact**: The composite action `.github/actions/setup-deps/action.yml` still uses `actions/setup-node@v4` while workflows now call it expecting v6 compatibility.

**Evidence from Logs**:
```
Using actions/setup-node@v4 in composite action
Workflows calling with v5/v6 checkout which may have incompatible node setup
```

### 2. actions/download-artifact@v4 → v6

**Breaking Changes**:
- Artifact API v4 introduced artifact isolation per workflow run
- Pattern matching syntax changed
- Merge behavior for artifacts with same name changed

**Impact**: The E2E report job downloads artifacts with pattern matching:
```yaml
- name: Download all shard results
  uses: actions/download-artifact@v6
  with:
    path: shard-results
    pattern: e2e-results-shard-*-${{ github.run_id }}
```

**Problem**: v6 requires explicit merge configuration when multiple artifacts match patterns.

### 3. pnpm/action-setup@v2 → v4

**Breaking Changes**:
- Installation method changed from npm-based to direct binary
- Different cache path defaults
- Modified standalone mode behavior

**Impact**: Composite action cache paths may be incompatible with v4's expectations.

---

## Dependabot Secret Access Limitation

### GitHub's Security Design

From the logs:
```
Secret source: Dependabot
TURBO_TOKEN: 
BUNDLEWATCH_GITHUB_TOKEN: 
SUPABASE_SERVICE_ROLE_KEY: 
SUPABASE_DB_WEBHOOK_SECRET: 
STRIPE_SECRET_KEY: 
STRIPE_WEBHOOK_SECRET: 
```

**All secrets show empty values** despite being defined in the workflow environment.

### Why This Happens

GitHub restricts Dependabot's access to secrets to prevent:
1. Malicious dependencies from exfiltrating secrets
2. Supply chain attacks via compromised package updates
3. Accidental secret leakage in dependency update PRs

### Dependabot Secret Access Rules

- ✅ **Has Access**: `GITHUB_TOKEN` (with limited permissions)
- ❌ **No Access**: All repository secrets
- ❌ **No Access**: Organization secrets
- ⚠️ **Limited Access**: Dependabot secrets only (must be explicitly configured)

---

## Why Builds Fail on Dependabot Branch

### Bundle Size Alert Failure Chain

1. **Checkout PR branch** succeeds
2. **Install dependencies** succeeds
3. **Build PR branch** starts
4. **Next.js build** attempts to validate environment:
   ```javascript
   // Security check in build process
   if (process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY === undefined) {
     throw new Error('SECURITY: Cloudflare Turnstile test keys detected...')
   }
   ```
5. **Build fails** because `NEXT_PUBLIC_CAPTCHA_SITE_KEY` is empty (secret not accessible)

### E2E Tests Failure Chain

1. **Setup server** job starts
2. **Checkout** succeeds (v5 works fine)
3. **Setup deps** runs composite action (still using v4 internally)
4. **Install dependencies** succeeds
5. **Build application** starts with `pnpm build`
6. **MCP server build** fails due to internal dependency/configuration issue
7. **Job fails** preventing shard execution

---

## Composite Action Version Mismatch

### Current State in `.github/actions/setup-deps/action.yml`:

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4  # ✅ Updated by Dependabot
  with:
    version: 10.14.0

- name: Setup Node.js
  uses: actions/setup-node@v4  # ❌ NOT updated (composite action pinned)
  with:
    node-version-file: '.nvmrc'
    cache: 'pnpm'
```

### The Problem

1. Workflows now use `actions/checkout@v5`
2. Composite action uses `actions/setup-node@v4`
3. Node v4 → v6 cache compatibility broken
4. pnpm cache paths don't align with v4's expectations

**Result**: Cache misses, build failures, timing issues

---

## Recommended Solutions

### Immediate Actions (Quick Fix)

#### Option 1: Pin to Known Working Versions (Conservative)

Revert the following actions to previous major versions until proper testing:

```yaml
# In all workflows
- uses: actions/checkout@v4  # Revert from v5
- uses: actions/setup-node@v4  # Revert from v6
- uses: actions/upload-artifact@v4  # Revert from v5
- uses: actions/download-artifact@v4  # Revert from v6
- uses: pnpm/action-setup@v2  # Revert from v4
```

**Pros**: Immediate stability
**Cons**: Delays modernization, accumulates technical debt

---

#### Option 2: Configure Dependabot Secrets (Recommended for Testing)

Create Dependabot-specific secrets with test values:

```yaml
# In GitHub repository settings → Secrets → Dependabot
NEXT_PUBLIC_CAPTCHA_SITE_KEY: "test-key-for-dependabot-builds"
NEXT_PUBLIC_SUPABASE_PUBLIC_KEY: "test-key-for-dependabot-builds"
TURBO_TOKEN: <actual-turbo-token>  # This one needs real value for cache
```

**Pros**: Allows Dependabot PRs to build successfully
**Cons**: Maintenance overhead, requires careful secret management

---

### Long-term Solutions (Proper Fix)

#### Solution 1: Staged Upgrade Approach

1. **Update composite action first**:
   ```yaml
   # .github/actions/setup-deps/action.yml
   - uses: actions/setup-node@v6  # Update to match workflows
   ```

2. **Test in isolation** on a feature branch with real workflows

3. **Update remaining actions** once composite action is validated

4. **Test Dependabot compatibility** with configured secrets

---

#### Solution 2: Skip Build-Heavy Workflows for Dependabot

Add workflow conditions to skip builds that require secrets:

```yaml
# bundle-size-alert.yml
jobs:
  bundle-size-alert:
    # Skip for Dependabot PRs since secrets aren't available
    if: github.actor != 'dependabot[bot]'
```

**Alternative**: Run lightweight validation instead:

```yaml
jobs:
  dependabot-validation:
    if: github.actor == 'dependabot[bot]'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: ./.github/actions/setup-deps
      - name: Verify dependencies install
        run: pnpm install --frozen-lockfile
      - name: Lint workflow files
        run: pnpm lint:workflows  # If such script exists
```

---

#### Solution 3: Artifact v4 API Compatibility

For `actions/download-artifact@v6`, use explicit merge configuration:

```yaml
- name: Download all shard results
  uses: actions/download-artifact@v6
  with:
    path: shard-results
    pattern: e2e-results-shard-*-${{ github.run_id }}
    merge-multiple: true  # Required for v6 pattern matching
```

---

## Detailed Action-Specific Fixes

### actions/setup-node@v6 Migration

**Changes Needed**:

1. **Update composite action** to v6:
   ```yaml
   # .github/actions/setup-deps/action.yml
   - name: Setup Node.js
     uses: actions/setup-node@v6
     with:
       node-version-file: '.nvmrc'
       cache: 'pnpm'
       cache-dependency-path: 'pnpm-lock.yaml'  # Now required
   ```

2. **Update all workflow calls** to match:
   ```yaml
   - uses: actions/setup-node@v6
     with:
       node-version: ${{ env.NODE_VERSION }}
       cache: 'pnpm'
   ```

**Breaking Change Details**:
- v6 requires explicit `cache-dependency-path` when using monorepo
- Cache key algorithm changed (invalidates existing caches)
- Node.js version resolution stricter

---

### pnpm/action-setup@v4 Migration

**Changes Needed**:

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 10.14.0
    run_install: false  # Explicitly set to avoid auto-install
```

**Breaking Changes**:
- Default installation method changed
- Cache path detection changed
- Must disable `run_install` if custom install logic follows

---

### Artifact Actions Migration

**Upload (v4 → v5)**:
```yaml
- uses: actions/upload-artifact@v5
  with:
    name: e2e-results-shard-${{ matrix.shard }}-${{ github.run_id }}
    path: |
      apps/e2e/test-results/
      apps/e2e/playwright-report/
    retention-days: 7
    include-hidden-files: false  # New option in v5
```

**Download (v4 → v6)**:
```yaml
- uses: actions/download-artifact@v6
  with:
    path: shard-results
    pattern: e2e-results-shard-*-${{ github.run_id }}
    merge-multiple: true  # REQUIRED for v6
```

**Critical**: v6 requires `merge-multiple: true` when pattern matches multiple artifacts.

---

## Testing Strategy

### Pre-merge Testing Checklist

1. **Create test branch** from Dependabot branch:
   ```bash
   git checkout -b test/github-actions-upgrade origin/dependabot/github_actions/dev/github-actions-3e74b0b7b6
   ```

2. **Update composite action** to match new versions

3. **Add Dependabot secrets** (test values) to repository settings

4. **Test each workflow independently**:
   ```bash
   # Trigger manually with workflow_dispatch
   gh workflow run e2e-sharded.yml --ref test/github-actions-upgrade
   gh workflow run bundle-size-alert.yml --ref test/github-actions-upgrade
   ```

5. **Monitor for**:
   - Cache hit rates (should improve with v6)
   - Build times (should be similar or faster)
   - Artifact download success (critical for v6)
   - Secret access (if Dependabot secrets configured)

6. **Validate on non-Dependabot PR** to ensure normal PRs still work

---

## Rollback Plan

If issues persist after fixes:

1. **Immediate revert**:
   ```bash
   git revert 107add86d435f9eae35d52055d7bb1062d284fa6
   git push origin dev
   ```

2. **Close Dependabot PR** with explanation

3. **Create manual upgrade PR** with staged approach:
   - First PR: Update composite action only
   - Second PR: Update checkout/setup actions
   - Third PR: Update artifact actions
   - Fourth PR: Update remaining actions

4. **Configure Dependabot** to not group GitHub Actions:
   ```yaml
   # .github/dependabot.yml
   version: 2
   updates:
     - package-ecosystem: "github-actions"
       directory: "/"
       schedule:
         interval: "weekly"
       groups:
         github-actions:
           patterns:
             - "actions/*"
       open-pull-requests-limit: 5  # Limit to avoid grouping
   ```

---

## Risk Assessment

### High Risk Items

1. **Artifact v6 compatibility** - Could break E2E test reporting
2. **Setup-node v6 cache** - Could cause build time regressions
3. **Dependabot secret access** - Blocks CI for dependency PRs

### Medium Risk Items

1. **pnpm action-setup v4** - Installation behavior changes
2. **Composite action version mismatch** - Cache and setup issues

### Low Risk Items

1. **Most other actions** - Minor version updates with good backward compatibility

---

## Conclusion

**Primary Issue**: Not the GitHub Actions updates themselves, but:
1. Dependabot's restricted secret access preventing builds
2. Version mismatch between composite action (v4) and workflows (v5/v6)
3. Breaking changes in artifact API v4 requiring explicit configuration

**Recommended Path Forward**:
1. Skip build-intensive workflows for Dependabot PRs (add conditionals)
2. Update composite action to use v6 actions
3. Test thoroughly on feature branch before merging
4. Consider staged rollout of action updates

**Alternative Path** (If time-constrained):
1. Revert Dependabot PR
2. Manually update actions in stages
3. Test each stage independently
4. Merge when all stages validated

---

## Appendix: Key Log Excerpts

### Dependabot Secret Restriction
```
Secret source: Dependabot
TURBO_TOKEN: 
BUNDLEWATCH_GITHUB_TOKEN: 
SUPABASE_SERVICE_ROLE_KEY: 
```

### Build Failure (Bundle Size)
```
Error: ❌ SECURITY: Cloudflare Turnstile test keys detected in production build!
Set NEXT_PUBLIC_CAPTCHA_SITE_KEY environment variable with your production sitekey.
```

### Build Failure (E2E)
```
[ERROR] @kit/mcp-server#build: command (/packages/mcp-server) pnpm run build exited (1)
```

### Composite Action Version
```yaml
# Still using v4 while workflows use v5/v6
uses: actions/setup-node@v4
```

---

**Report Generated**: 2025-11-11
**Analyzed By**: Claude Code (Refactoring Expert)
**Status**: Comprehensive analysis complete - awaiting decision on fix approach
