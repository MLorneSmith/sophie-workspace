# Bug Fix: CI/CD Workflow Configuration Drift Between Dev, Staging, and Production

**Related Diagnosis**: #1942 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Configuration drift - fixes applied to dev-deploy.yml were not propagated to staging-deploy.yml and production-deploy.yml
- **Fix Approach**: Systematically align staging and production workflows with the proven working dev-deploy.yml configuration
- **Estimated Effort**: large (affects multiple files, requires careful validation)
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The CI/CD pipeline has significant configuration drift with 11 distinct configuration misalignments between dev-deploy.yml (working) and staging-deploy.yml/production-deploy.yml (broken). The most critical issues are:

1. **RunsOn syntax** - staging uses invalid `"runs-on/runner=..."` instead of `runs-on=${{ github.run_id }}/runner=...`
2. **Empty STRIPE_SECRET_KEY** - causes immediate test failures
3. **Invalid workflow syntax** - production line 82 uses `uses:` in a `steps:` block
4. **Vercel secret mismatch** - production uses wrong secret name
5. **Missing permissions** - missing `actions: read` permission

For full details, see diagnosis issue #1942.

### Solution Approaches Considered

#### Option 1: Full Workflow Consolidation ⭐ RECOMMENDED

**Description**: Create a unified workflow template and refactor all deploy workflows to use it as a reusable workflow, eliminating drift at the source.

**Pros**:
- Single source of truth - changes propagate automatically
- Prevents future drift
- Reduces code duplication by ~70%
- More maintainable long-term

**Cons**:
- Significant refactoring effort (~2-3 hours)
- Requires careful testing of reusable workflow pattern
- Could introduce new issues during migration
- Higher risk of breaking all deployments during implementation

**Risk Assessment**: medium - requires careful implementation but proven pattern

**Complexity**: complex - involves architectural change

#### Option 2: Targeted Fix to Align Staging/Production with Dev (SELECTED) ⭐

**Description**: Fix each identified issue in staging-deploy.yml, production-deploy.yml, and related files to match dev-deploy.yml configuration exactly.

**Pros**:
- Lower risk - surgical fixes to known issues
- Faster implementation (~30-45 minutes)
- Uses proven configuration from dev-deploy.yml
- Can be validated incrementally
- Easier rollback if needed

**Cons**:
- Doesn't prevent future drift
- Requires manual updates if dev-deploy.yml changes
- Will need follow-up consolidation eventually

**Risk Assessment**: low - applying known working config

**Complexity**: moderate - multiple changes but each is straightforward

#### Option 3: Minimal Emergency Fix (Empty STRIPE_SECRET_KEY Only)

**Description**: Only fix the STRIPE_SECRET_KEY issue to unblock staging deployments, defer other fixes.

**Pros**:
- Minimal risk
- Very fast implementation
- Can get staging working immediately

**Cons**:
- Leaves other critical issues unfixed
- staging-deploy.yml still broken (RunsOn syntax, missing permissions)
- Doesn't address production issues
- "Whack-a-mole" continues

**Why Not Chosen**: Doesn't solve the core problem; only a temporary patch

### Selected Solution: Targeted Fix to Align Staging/Production with Dev

**Justification**: Option 2 balances speed, safety, and effectiveness. We apply the proven working configuration from dev-deploy.yml to staging/production, unblocking deployments immediately while fixing all 11 identified issues. The risk is low because we're not introducing new patterns - just applying existing proven configurations. This can serve as a foundation for Option 1 (full consolidation) in a future chore task.

**Technical Approach**:
- Fix RunsOn syntax in all files (simple find-replace)
- Add missing permissions (copy from dev-deploy.yml)
- Add paths-ignore configuration (copy from dev-deploy.yml)
- Use conditional Turbo cache config (copy from dev-deploy.yml)
- Fix STRIPE_SECRET_KEY to use dummy value (like e2e-sharded.yml)
- Fix invalid workflow syntax in production-deploy.yml
- Align Vercel secret names
- Verify all changes with workflow validation

**Architecture Changes**: None - only configuration alignment

**Migration Strategy**: No data migration needed - pure configuration fix

## Implementation Plan

### Affected Files

- `.github/workflows/staging-deploy.yml` - Fix RunsOn syntax (12x), add permissions, add paths-ignore, fix STRIPE_SECRET_KEY, align Turbo cache
- `.github/workflows/production-deploy.yml` - Fix RunsOn syntax (5x), fix line 82 invalid syntax, add permissions, add paths-ignore, fix VERCEL_PROJECT_ID, align Turbo cache
- `.github/workflows/staging-deploy-simple.yml` - Fix RunsOn syntax (2x)
- `.github/workflows/test-runson-staging.yml` - Fix RunsOn syntax (1x)

### New Files

None required - configuration changes only

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix staging-deploy.yml RunsOn Syntax (12 occurrences)

**Objective**: Replace all invalid RunsOn syntax with correct format

Replace all instances of:
```yaml
runs-on: "runs-on/runner=4cpu-linux-x64"
```

With:
```yaml
runs-on: runs-on=${{ github.run_id }}/runner=4cpu-linux-x64
```

Replace all instances of:
```yaml
runs-on: "runs-on/runner=2cpu-linux-x64"
```

With:
```yaml
runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64
```

**Lines affected in staging-deploy.yml**: 35, 67, 121, 196, 412, 485, 558, 621, 702, 763, 799 (12 total)

**Why this step first**: RunsOn syntax is the most critical issue causing immediate failures. Fix it first to unblock other work.

#### Step 2: Add Missing Configuration to staging-deploy.yml

**Objective**: Add permissions, paths-ignore, and Turbo cache config to staging-deploy.yml

**Add `actions: read` permission** (after line 22, in permissions block):
```yaml
permissions:
  contents: write  # Existing
  deployments: write  # Existing
  pull-requests: write  # Existing
  issues: write  # Existing
  checks: write  # Existing
  security-events: write  # Existing
  actions: read  # ADD THIS LINE
```

**Add `paths-ignore` configuration** (in the `on.push` section after line 6):
```yaml
on:
  push:
    branches:
      - staging
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

**Fix Turbo cache config** (lines 28):
Replace:
```yaml
TURBO_REMOTE_CACHE_ENABLED: true
```

With:
```yaml
TURBO_REMOTE_CACHE_ENABLED: true
TURBO_REMOTE_CACHE_SIGNATURE_KEY: ${{ secrets.TURBO_REMOTE_CACHE_SIGNATURE_KEY || '' }}
```

**Fix STRIPE_SECRET_KEY** (line 137 and 226 in test environments):
Replace:
```yaml
STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

With:
```yaml
STRIPE_SECRET_KEY: 'sk_test_dummy'
```

**Why in this order**: These are foundational configurations that support the rest of the workflow.

#### Step 3: Fix production-deploy.yml Configuration Issues

**Objective**: Fix RunsOn syntax, permissions, invalid workflow syntax, and Vercel secret

**Fix all 5 RunsOn syntax instances**:

Replace:
```yaml
runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64
```

Keep as-is (already correct) at lines 27, 53, 96, 164, 228, 299

(They're already correct in production-deploy.yml - verify they match dev-deploy.yml format)

**Remove/fix invalid workflow syntax** (line 82):

Replace:
```yaml
      - name: Run Weekly Security Scan
        uses: ./.github/workflows/security-weekly-scan.yml
```

With (comment it out for now):
```yaml
      # Weekly security scan runs separately via security-weekly-scan.yml workflow
      # Cannot invoke reusable workflow from a step - must use it as a job directly
```

**Add `actions: read` permission** (after line 15, in permissions block):
```yaml
permissions:
  contents: read  # Existing
  deployments: write  # Existing
  actions: read  # ADD THIS LINE
```

**Add `paths-ignore` configuration** (in the `on.push` section):
```yaml
on:
  push:
    branches:
      - main
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

**Fix VERCEL_PROJECT_ID** (line 131):

Replace:
```yaml
project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

With:
```yaml
project-id: ${{ secrets.VERCEL_PROJECT_ID_WEB }}
```

**Fix Turbo cache config** (line 20):
Replace:
```yaml
TURBO_REMOTE_CACHE_ENABLED: true
```

With:
```yaml
TURBO_REMOTE_CACHE_ENABLED: true
TURBO_REMOTE_CACHE_SIGNATURE_KEY: ${{ secrets.TURBO_REMOTE_CACHE_SIGNATURE_KEY || '' }}
```

**Why this step third**: These fixes are isolated to production and don't depend on previous steps.

#### Step 4: Fix staging-deploy-simple.yml and test-runson-staging.yml

**Objective**: Fix RunsOn syntax in test workflows

**In staging-deploy-simple.yml (lines 25, 36)**:

Replace:
```yaml
runs-on: runs-on=${{ github.run_id }},runner=2cpu-linux-x64
```

With:
```yaml
runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64
```

**In test-runson-staging.yml (line 9)**:

Replace:
```yaml
runs-on: runs-on=${{ github.run_id }},runner=2cpu-linux-x64
```

With:
```yaml
runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64
```

**Why this step fourth**: These are lower priority test files but should be fixed for consistency.

#### Step 5: Validate and Test

**Objective**: Verify all changes are correct and workflows are valid

**Validate workflow syntax** (run locally):
```bash
# Install actionlint if not already installed
# brew install actionlint  (on macOS)
# Or download from https://github.com/rhysd/actionlint/releases

actionlint .github/workflows/staging-deploy.yml
actionlint .github/workflows/production-deploy.yml
actionlint .github/workflows/staging-deploy-simple.yml
actionlint .github/workflows/test-runson-staging.yml
```

**Verify YAML syntax** (run locally):
```bash
# Use pnpm to validate YAML
pnpm exec yaml-lint \
  .github/workflows/staging-deploy.yml \
  .github/workflows/production-deploy.yml \
  .github/workflows/staging-deploy-simple.yml \
  .github/workflows/test-runson-staging.yml
```

**Manual review checklist**:
- [ ] All RunsOn syntax uses `/` separator, not comma
- [ ] All RunsOn syntax includes `${{ github.run_id }}`
- [ ] No quoted RunsOn values (remove quotes)
- [ ] `actions: read` permission present in staging and production
- [ ] `paths-ignore` configuration present and consistent
- [ ] STRIPE_SECRET_KEY uses `'sk_test_dummy'` in test environments
- [ ] VERCEL_PROJECT_ID_WEB used consistently
- [ ] Turbo cache signature key configured
- [ ] Invalid workflow syntax on line 82 is removed/commented

## Testing Strategy

### Unit Tests

No unit tests needed - these are workflow configuration changes.

### Integration Tests

**Test files** - Use GitHub Actions workflow validation:
- `.github/workflows/staging-deploy.yml` - syntax validation
- `.github/workflows/production-deploy.yml` - syntax validation
- `.github/workflows/staging-deploy-simple.yml` - syntax validation
- `.github/workflows/test-runson-staging.yml` - syntax validation

### E2E Tests

Validate by running actual workflows:

1. **Trigger staging-deploy.yml**:
   - Push to staging branch
   - Verify all jobs start (no startup_failure)
   - Verify E2E shards don't get stuck in queued state
   - Verify STRIPE_SECRET_KEY is set correctly
   - Verify tests run (not all pass yet, but tests run)

2. **Verify production workflow structure**:
   - Review workflow in GitHub UI
   - Verify no syntax errors
   - Manually trigger via workflow_dispatch
   - Verify build completes

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Clone repository and verify workflow files locally
- [ ] Run `actionlint` on all modified workflow files (zero errors)
- [ ] Run `pnpm exec yaml-lint` on workflow files (zero errors)
- [ ] Review each file change manually for correctness
- [ ] Verify no accidental changes to other sections
- [ ] Ensure consistency across all four files
- [ ] Check that STRIPE_SECRET_KEY is 'sk_test_dummy' (not empty string)
- [ ] Verify VERCEL_PROJECT_ID is VERCEL_PROJECT_ID_WEB
- [ ] Test RunsOn syntax by viewing workflow in GitHub UI (no parse errors)
- [ ] Push to staging branch and observe first workflow run
- [ ] Verify all jobs get scheduled (RunsOn fix working)
- [ ] Verify STRIPE_SECRET_KEY error is gone from logs
- [ ] Check that E2E shards don't get stuck in queued state

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Workflow parsing errors**: Invalid YAML or syntax breaks workflow execution
   - **Likelihood**: low (careful manual editing)
   - **Impact**: high (all deployments blocked)
   - **Mitigation**: Use actionlint validation before committing, test in staging first

2. **Regression in existing functionality**: Changes to config break something that was working
   - **Likelihood**: low (only copying known working config)
   - **Impact**: medium (staging/production deployments fail)
   - **Mitigation**: Test staging first before production, use deployment protection rules

3. **Environment variable typos**: Mistyping variable names or values
   - **Likelihood**: medium (multiple edits)
   - **Impact**: high (tests/deployments fail)
   - **Mitigation**: Careful review of each change, validate against dev-deploy.yml exactly

4. **Incomplete fix**: Missing some instances of issues
   - **Likelihood**: medium (11 different issues to fix)
   - **Impact**: medium (some deployments still broken)
   - **Mitigation**: Use the systematic task list, verify all line numbers

**Rollback Plan**:

If this fix causes issues in production:

1. Revert the commits: `git revert <commit-hash>`
2. Push to main/staging branch
3. Workflows will use old (current broken) configuration
4. Investigate issue using GitHub Actions logs
5. Create new issue documenting the problem
6. Fix the specific issue and retry

**Monitoring** (after deployment):

- Monitor staging workflow runs for 2-3 runs to verify no regressions
- Watch for `startup_failure` errors (should be gone)
- Verify STRIPE_SECRET_KEY is no longer empty in logs
- Verify E2E shards complete without hanging in queued state
- Check that build artifacts are found and deployments complete

## Performance Impact

**Expected Impact**: Minimal (configuration changes only)

No performance impact expected. Changes are configuration-only, not algorithmic.

**Performance Testing**:

- Verify workflow execution time doesn't increase
- Compare staging workflow duration before/after
- Expected: no measurable difference

## Security Considerations

**Security Impact**: none (configuration alignment only)

No security implications:
- Using dummy test key 'sk_test_dummy' only for local testing (not production)
- No secrets are being added or exposed
- Permission changes only add necessary permissions, don't remove existing ones
- RunsOn syntax change is purely cosmetic (same runners, different syntax)

## Validation Commands

### Before Fix (Issues Should Be Visible)

```bash
# Show current RunsOn syntax in staging
grep -n "runs-on:" .github/workflows/staging-deploy.yml | head -5

# Expected: lines with "runs-on/runner=" and quoted values (wrong)
# Example: 35:    runs-on: "runs-on/runner=4cpu-linux-x64"

# Show current permissions in production
grep -A5 "^permissions:" .github/workflows/production-deploy.yml

# Expected: no "actions: read" line
```

### After Fix (Issues Should Be Resolved)

```bash
# Validate workflow syntax with actionlint
actionlint .github/workflows/staging-deploy.yml
actionlint .github/workflows/production-deploy.yml
actionlint .github/workflows/staging-deploy-simple.yml
actionlint .github/workflows/test-runson-staging.yml

# Expected: All checks pass (exit code 0)

# Validate YAML syntax
pnpm exec yaml-lint \
  .github/workflows/staging-deploy.yml \
  .github/workflows/production-deploy.yml

# Expected: No errors

# Verify RunsOn syntax is correct
grep -n "runs-on:" .github/workflows/staging-deploy.yml | head -5

# Expected: lines without quotes, with "${{ github.run_id }}"
# Example: 35:    runs-on: runs-on=${{ github.run_id }}/runner=4cpu-linux-x64

# Verify permissions include actions: read
grep -A10 "^permissions:" .github/workflows/production-deploy.yml | grep "actions:"

# Expected: "  actions: read"

# Verify STRIPE_SECRET_KEY is set correctly
grep "STRIPE_SECRET_KEY:" .github/workflows/staging-deploy.yml

# Expected: STRIPE_SECRET_KEY: 'sk_test_dummy' (not empty or ${{ secrets... }})

# Verify VERCEL_PROJECT_ID uses correct secret name
grep "VERCEL_PROJECT_ID_WEB" .github/workflows/production-deploy.yml

# Expected: at least one occurrence (the fix)
```

### Regression Prevention

```bash
# Run full YAML validation on all workflows
pnpm exec yaml-lint '.github/workflows/*.yml' --ignore='**/node_modules/**'

# Expected: No errors

# Verify no syntax errors in critical files
for file in \
  .github/workflows/dev-deploy.yml \
  .github/workflows/staging-deploy.yml \
  .github/workflows/production-deploy.yml; do
  echo "Validating $file..."
  actionlint "$file" || exit 1
done

# Expected: All files pass

# Compare staging-deploy.yml with dev-deploy.yml to verify alignment
diff -u <(grep "runs-on:" .github/workflows/dev-deploy.yml | sort) \
        <(grep "runs-on:" .github/workflows/staging-deploy.yml | sort)

# Expected: Same RunsOn syntax pattern (may have different CPU counts)
```

## Dependencies

### New Dependencies

No new dependencies required - this is a configuration fix only.

### Affected Dependencies

None - no code dependencies affected.

## Database Changes

No database changes required - workflow configuration only.

## Deployment Considerations

**Deployment Risk**: low (configuration changes only)

**Special deployment steps**:
- No special steps needed
- Changes are automatically used on next workflow trigger
- Test in staging before merging to main

**Feature flags needed**: no

**Backwards compatibility**: maintained (no breaking changes)

## Success Criteria

The fix is complete when:
- [ ] All RunsOn syntax is corrected in all four files
- [ ] All validation commands pass (actionlint, yaml-lint)
- [ ] STRIPE_SECRET_KEY is set to 'sk_test_dummy' in staging E2E tests
- [ ] VERCEL_PROJECT_ID uses correct secret name in production
- [ ] All permissions include `actions: read`
- [ ] All paths-ignore configurations are added and consistent
- [ ] Invalid workflow syntax on production line 82 is removed
- [ ] GitHub Actions doesn't report workflow parsing errors
- [ ] Manual testing checklist is complete
- [ ] Staging workflow runs successfully (E2E shards don't hang)
- [ ] Zero regressions detected in workflow behavior

## Notes

**Related Issues for Context**:
- #1897: Bug Fix: Staging Deploy E2E Shards Stuck with RunsOn Runner Issues
- #1896: Bug Diagnosis: Staging Deploy E2E Shards Stuck with RunsOn Runner Issues
- #1826: Bug Fix: Staging Deploy E2E Tests Failing Due to Missing Environment Variables
- #215: Staging deployment consistently fails with startup_failure

**Future Work**:
Consider consolidating all deployment workflows into a single reusable template to prevent future drift. This would be a good chore task for future sprint.

**Files for Reference**:
- `.github/workflows/dev-deploy.yml` - Use this as the reference for correct configuration
- `.github/workflows/e2e-sharded.yml` - Reference for STRIPE_SECRET_KEY dummy value

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1942*
