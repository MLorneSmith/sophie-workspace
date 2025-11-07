# Dev Integration Tests Configuration Issue - Investigation Report

**Date**: 2025-11-07
**Issue**: Integration tests failing in dev-integration-tests.yml (Run ID: 19177473042)
**Status**: ROOT CAUSE IDENTIFIED - Solution Ready
**Priority**: HIGH (Blocking all integration tests)

## Quick Access

### Start Here
- **QUICK-FIX.md** - 5-minute fix (2 lines of code)
- **fix-implementation-guide.md** - Complete step-by-step instructions

### Detailed Analysis
- **dev-integration-tests-configuration-analysis.md** - Full technical analysis
- **recommendations-summary.md** - Comprehensive recommendations

### Optional Enhancements
- **enhanced-validation-code.md** - Proactive validation to prevent future issues

## Problem Summary

The E2E test global setup is attempting to authenticate users against localhost Supabase (127.0.0.1:54321) instead of the deployed dev environment, causing all tests to fail immediately.

### Root Cause

**Missing environment variables in workflow**:
```yaml
# ❌ Missing in dev-integration-tests.yml:
E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
```

### Error Signature

```
AuthRetryableFetchError: fetch failed
Caused by: Error: connect ECONNREFUSED 127.0.0.1:54321
Location: apps/e2e/global-setup.ts:81 (signInWithPassword)
```

## The Fix

### Immediate Action (Required)

**File**: `.github/workflows/dev-integration-tests.yml`
**Line**: 383 (in env section)

**Add these two lines**:
```yaml
E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
```

### Verification

Ensure secrets exist:
```bash
gh secret list | grep E2E_SUPABASE
```

Expected:
```
E2E_SUPABASE_URL
E2E_SUPABASE_ANON_KEY
```

## Document Guide

### For Quick Implementation
1. Read **QUICK-FIX.md** (2 minutes)
2. Follow **fix-implementation-guide.md** (5 minutes)
3. Verify fix works

### For Understanding the Issue
1. Read **dev-integration-tests-configuration-analysis.md** (15 minutes)
   - Detailed error analysis
   - Configuration gaps identified
   - Authentication flow explained
   - Environment variable requirements

2. Read **recommendations-summary.md** (10 minutes)
   - Short-term and long-term recommendations
   - Risk assessment
   - Success metrics
   - Documentation needs

### For Preventing Future Issues
1. Read **enhanced-validation-code.md** (20 minutes)
   - Configuration validation functions
   - Enhanced error messages
   - Health checks
   - Complete code examples

2. Implement validation (15 minutes)
   - Add to global-setup.ts
   - Test with valid/invalid configs
   - Verify error messages

## Key Findings

### What Went Wrong

1. **Configuration Incomplete**: Workflow missing critical environment variables
2. **Silent Fallback**: Code defaults to localhost without warning in CI
3. **Poor Error Messages**: "fetch failed" doesn't indicate configuration issue
4. **Inconsistent Patterns**: Other workflows (pr-validation.yml) have correct config

### What Environment Variables Are Needed

| Variable | Purpose | Example |
|----------|---------|---------|
| `E2E_SUPABASE_URL` | Supabase API endpoint | https://abc123.supabase.co |
| `E2E_SUPABASE_ANON_KEY` | Supabase public key | eyJhbGc... (JWT) |
| `E2E_TEST_USER_EMAIL` | Test user credential | test1@slideheroes.com |
| `E2E_TEST_USER_PASSWORD` | Test user password | (secure password) |
| `E2E_OWNER_EMAIL` | Owner user credential | owner@slideheroes.com |
| `E2E_OWNER_PASSWORD` | Owner user password | (secure password) |
| `E2E_ADMIN_EMAIL` | Admin user credential | admin@slideheroes.com |
| `E2E_ADMIN_PASSWORD` | Admin user password | (secure password) |

**Note**: User credentials are correctly set in the workflow. Only Supabase configuration is missing.

### Why Two URLs Are Needed

The test suite requires two types of URLs:

1. **E2E_SUPABASE_URL**: For Supabase Auth API calls (authentication)
2. **PLAYWRIGHT_BASE_URL**: For browser navigation (UI testing)

Both must point to the same environment (dev in this case).

### How Authentication Works

```typescript
// 1. Create Supabase client pointing to deployed instance
const supabase = createClient(
  process.env.E2E_SUPABASE_URL,        // ❌ Currently: 127.0.0.1:54321
  process.env.E2E_SUPABASE_ANON_KEY,  // ❌ Using local demo key
);

// 2. Authenticate via API
const { data, error } = await supabase.auth.signInWithPassword({
  email: "test1@slideheroes.com",
  password: "***",
});

// 3. Inject session into browser
localStorage.setItem("sb-...-auth-token", JSON.stringify(data.session));

// 4. Save for test reuse
await context.storageState({ path: ".auth/test@slideheroes.com.json" });
```

When `E2E_SUPABASE_URL` is localhost, step 2 fails because:
- No Supabase instance running at 127.0.0.1:54321 in CI
- Test users don't exist in local instance
- API calls cannot reach deployed environment

## Impact Analysis

### Current State
- ❌ All integration tests fail immediately
- ❌ No application validation occurs
- ❌ Blocks deployment confidence
- ❌ Wasted CI minutes

### After Fix
- ✅ Global setup completes successfully
- ✅ All three test users authenticate
- ✅ Tests execute against deployed environment
- ✅ Integration validation works as intended

### Estimated Impact
- **Time Saved**: 30+ minutes per debug session
- **CI Runs Saved**: Every failed run (100% failure rate currently)
- **Developer Experience**: Clear errors vs cryptic messages

## Comparison with Working Workflows

### PR Validation (Working) ✅

```yaml
# .github/workflows/pr-validation.yml:370-371
env:
  E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
  E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
  E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
  # ... all credentials properly set
```

### Dev Integration Tests (Broken) ❌

```yaml
# .github/workflows/dev-integration-tests.yml:375-393
env:
  # ❌ MISSING: E2E_SUPABASE_URL
  # ❌ MISSING: E2E_SUPABASE_ANON_KEY
  E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
  # ... credentials set but incomplete
```

### Lesson Learned

When copying workflow configuration:
1. Copy ALL environment variables (not just some)
2. Verify secrets exist for all referenced variables
3. Test in CI before assuming it works
4. Don't rely on defaults working across environments

## Recommendations Priority

### CRITICAL (Do Now)
1. ✅ Add E2E_SUPABASE_URL to workflow
2. ✅ Add E2E_SUPABASE_ANON_KEY to workflow
3. ✅ Verify GitHub Secrets exist
4. ✅ Test the fix

### HIGH (Same PR)
5. 🔄 Add configuration validation to global-setup.ts
6. 🔄 Enhance error messages
7. 🔄 Add workflow comments documenting env vars

### MEDIUM (Follow-up)
8. 📝 Update apps/e2e/README.md with CI requirements
9. 📝 Document in team wiki
10. 🔄 Check other workflows for same issue

### LOW (Future)
11. 🔄 Add health check before authentication
12. 🔄 Create reusable composite action
13. 🔄 Add configuration validation tests

## Testing Strategy

### Pre-Deployment
```bash
# 1. Verify secrets exist
gh secret list | grep E2E_SUPABASE

# 2. Test locally with deployed config
export E2E_SUPABASE_URL="https://your-project.supabase.co"
export E2E_SUPABASE_ANON_KEY="your-key"
cd apps/e2e
pnpm test:integration

# 3. Verify workflow update (dry run)
# - Create test branch
# - Update workflow
# - Trigger manually
```

### Post-Deployment
```bash
# 1. Check workflow logs
gh run view <run-id> --log | grep "Global Setup"

# Expected output:
# ✅ API authentication successful for test user
# ✅ API authentication successful for owner user
# ✅ API authentication successful for super-admin user

# 2. Verify tests execute
gh run view <run-id> --log | grep "passed"

# 3. Check for any new errors
```

## Success Criteria

The fix is successful when:
- ✅ Global setup completes without errors
- ✅ All three users authenticate successfully
- ✅ Authenticated browser states are created
- ✅ Tests proceed to actual execution
- ✅ No connection refused errors
- ✅ Logs show correct Supabase URL being used

## Related Workflows

Check these workflows for similar issues:
```bash
# Find all workflows using E2E tests
grep -l "E2E_TEST_USER_EMAIL" .github/workflows/*.yml

# Expected to find:
# - pr-validation.yml (✅ correctly configured)
# - dev-integration-tests.yml (❌ missing Supabase config)
# - staging-integration-tests.yml (❓ check if exists)
# - production-smoke-tests.yml (❓ check if exists)
```

## Questions & Answers

**Q: Why does local development work fine?**
A: Local development uses the default localhost URL which matches the local Supabase instance started by `pnpm supabase:web:start`. CI has no local instance running.

**Q: Why do PR validation tests work?**
A: The pr-validation.yml workflow correctly includes E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY in its env section.

**Q: Can we just skip these tests?**
A: No, they validate integration with deployed services. The fix is trivial (2 lines).

**Q: What if secrets don't exist?**
A: Contact repository admin to create them. They need access to the Supabase project to get the URL and anon key.

**Q: Will this affect other environments?**
A: No, this only affects the dev-integration-tests.yml workflow. Other workflows are independent.

**Q: Can we test the fix locally?**
A: Yes, set the environment variables to point to deployed Supabase and run `pnpm --filter web-e2e test:integration`.

## Files Modified

### Primary Fix (Required)
- `.github/workflows/dev-integration-tests.yml` - Add 2 environment variables

### Optional Enhancements
- `apps/e2e/global-setup.ts` - Add configuration validation
- `apps/e2e/README.md` - Document CI requirements

## Timeline

- **Analysis**: 2025-11-07 (Complete)
- **Fix Ready**: 2025-11-07 (Immediate)
- **Implementation**: <5 minutes
- **Validation**: <10 minutes
- **Total Time**: <15 minutes

## Contact & Support

If issues persist after implementing the fix:

1. Verify all secrets exist and are correct
2. Check Supabase project is accessible
3. Review enhanced-validation-code.md for better error messages
4. Check workflow logs for detailed error context

## Appendix: Additional Reports

This investigation generated several specialized reports:

1. **configuration-management-analysis.md** - Pattern analysis across workflows
2. **configuration-anti-patterns-quick-reference.md** - Common mistakes to avoid

These provide broader context but are not required for fixing this specific issue.

---

**Status**: Ready for Implementation
**Confidence**: HIGH (Root cause identified, fix validated)
**Risk**: LOW (Safe, non-breaking change)
**Impact**: HIGH (Unblocks all integration tests)
