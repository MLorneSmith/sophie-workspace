# QUICK FIX: Dev Integration Tests Configuration

**Issue**: Tests connecting to localhost instead of deployed Supabase
**Fix Time**: 5 minutes
**Files Changed**: 1

## The Problem

```
Error: connect ECONNREFUSED 127.0.0.1:54321
```

Global setup tries to authenticate against localhost Supabase, but should use deployed instance.

## The Solution

**File**: `.github/workflows/dev-integration-tests.yml`
**Line**: 383 (after `VERCEL_AUTOMATION_BYPASS_SECRET_PAYLOAD`)

### Add These Two Lines

```yaml
# Supabase configuration (REQUIRED for API-based authentication)
E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
```

### Full Context

```yaml
- name: Run integration test suite
  env:
    BASE_URL: ${{ needs.check-should-run.outputs.web_deployment_url }}
    SKIP_EMAIL_VERIFICATION: true
    CI: true
    PLAYWRIGHT_BASE_URL: ${{ needs.check-should-run.outputs.web_deployment_url }}
    PLAYWRIGHT_API_URL: ${{ needs.check-should-run.outputs.payload_deployment_url }}
    VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}
    VERCEL_AUTOMATION_BYPASS_SECRET_PAYLOAD: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET_PAYLOAD }}

    # ADD THESE TWO LINES 👇
    E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
    E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}

    ENABLE_BILLING_TESTS: true
    ENABLE_TEAM_ACCOUNT_TESTS: true
    E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
    # ... rest of config
```

## Verify Secrets Exist

```bash
gh secret list | grep E2E_SUPABASE
```

Should show:
```
E2E_SUPABASE_URL
E2E_SUPABASE_ANON_KEY
```

If missing, contact team lead to set these secrets.

## Test the Fix

1. Commit and push the change
2. Trigger workflow (manual or automatic)
3. Check logs for:

```
✅ API authentication successful for test user
✅ API authentication successful for owner user
✅ API authentication successful for super-admin user
```

## Expected Before/After

### Before (Failing)

```
🔧 Global Setup: Creating authenticated browser states via API...
🔐 Authenticating test user via Supabase API...
❌ Failed to authenticate test user: fetch failed
Error: connect ECONNREFUSED 127.0.0.1:54321
```

### After (Working)

```
🔧 Global Setup: Creating authenticated browser states via API...
🔗 Supabase URL: https://abc123.supabase.co
🔗 Web App URL: https://dev.slideheroes.com

🔐 Authenticating test user via Supabase API...
✅ API authentication successful for test user
✅ Session injected into browser storage for test user
✅ test user auth state saved successfully
```

## Why This Happens

- Local tests: Use default `http://127.0.0.1:54321` (works with local Supabase)
- CI tests: Need deployed Supabase URL (no local instance available)
- Fix: Explicitly set environment variables in workflow

## Other Files That Use This Pattern

Working example in: `.github/workflows/pr-validation.yml:370-371`

```yaml
E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
```

## Need Help?

See detailed documentation:
- `dev-integration-tests-configuration-analysis.md` - Full analysis
- `fix-implementation-guide.md` - Step-by-step guide
- `recommendations-summary.md` - Recommendations
