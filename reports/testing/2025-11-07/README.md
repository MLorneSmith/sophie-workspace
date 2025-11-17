# Dev Integration Test Infrastructure Investigation - 2025-11-07

**Status**: ❌ FAILING - Root cause identified, fix ready for deployment
**Impact**: HIGH - Blocking all integration tests and staging promotions
**Time to Fix**: 30-45 minutes (immediate) + 2 hours (automation)

## Quick Links

### For Immediate Action (DevOps)

📄 [Implementation Guide](./implementation-guide-user-provisioning.md) - Step-by-step fix instructions (START HERE)

### For Understanding the Issue

📊 [Executive Summary](./dev-integration-test-failure-summary.md) - High-level overview and action items
📋 [Detailed Analysis](./dev-integration-test-infrastructure-fix.md) - Complete root cause analysis

### For Code Changes

💻 [Code Changes Ready to Apply](./code-changes-ready-to-apply.md) - Production-ready code with testing instructions

### Background

📄 [Configuration Analysis](./dev-integration-tests-configuration-analysis.md) - Previous analysis (Supabase URL issue - now fixed)

## Problem Statement

Integration tests fail with `AuthApiError: Invalid login credentials` during global setup authentication.

**Root Cause**: Test users don't exist in dev Supabase instance.

**Why**: Local development uses seeded data, but deployed dev environment has no test users pre-provisioned.

## Solution Summary

### Immediate Fix (30-45 min)

Manually provision test users in dev Supabase:

```bash
cd apps/e2e
node scripts/setup-test-users.js  # with correct env vars
gh secret set E2E_TEST_USER_PASSWORD --body "<password>"
```

### Automated Fix (2-3 hours)

Add user provisioning step to workflow:

- Enhanced `setup-test-users.js` with idempotency
- New workflow step to provision users before tests
- Improved error messages in global setup

## Key Files Involved

| File | Purpose | Change Required |
|------|---------|-----------------|
| `apps/e2e/scripts/setup-test-users.js` | User provisioning script | Enhancement (idempotency) |
| `.github/workflows/dev-integration-tests.yml` | CI workflow | Add provisioning step |
| `apps/e2e/global-setup.ts` | Test authentication setup | Better error messages |

## Action Items

### Immediate (Owner: DevOps - 45 min)

1. [ ] Get dev Supabase service role key
2. [ ] Run provisioning script locally
3. [ ] Update GitHub Secrets with passwords
4. [ ] Trigger workflow and verify

### Follow-up (Owner: DevOps - 2-3 hours)

1. [ ] Add service role key to GitHub Secrets
2. [ ] Apply code changes from this analysis
3. [ ] Test in PR before merging
4. [ ] Update documentation

## Expected Outcomes

### Before Fix

```text
❌ Failed to authenticate test user: Invalid login credentials
```

### After Fix

```text
✓ User test1@slideheroes.com exists and credentials are valid
✅ API authentication successful for test user
✅ Global Setup Complete: All auth states created via API
```

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Investigation | 2 hours | ✅ Complete |
| Manual provisioning | 30-45 min | ⏳ Pending |
| Automation | 2-3 hours | ⏳ Pending |
| Documentation | 1 hour | ✅ Complete |

## Success Criteria

- ✅ Test users exist in dev Supabase
- ✅ Global setup authenticates all users
- ✅ Integration tests execute successfully
- ✅ Workflow passes consistently
- ✅ Automated provisioning in place

## Risk Assessment

**Risk Level**: Low

- Changes are backward compatible
- Script is idempotent (safe to run multiple times)
- Includes rollback plan
- No impact on production

## Questions?

See the [FAQ section](./dev-integration-test-infrastructure-fix.md#questions) in the detailed analysis.

---

**Investigation Date**: 2025-11-07
**Next Review**: After automation implementation
**Owner**: Testing Infrastructure Team
