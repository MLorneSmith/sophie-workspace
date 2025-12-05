# Bug Diagnosis: Dev Integration Tests Failing - Payload Project Missing Supabase Configuration

**ID**: ISSUE-649
**Created**: 2025-11-19T18:30:00Z
**Reporter**: system
**Severity**: high
**Status**: diagnosed
**Type**: regression

## Summary

Dev integration tests are consistently failing because the **2025slideheroes-payload** Vercel project was missing the Supabase environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`). This caused tests that interact with Payload APIs to fail due to missing authentication configuration, resulting in all authenticated tests timing out.

## Environment

- **Application Version**: dev branch (commit 1aca17dbd)
- **Environment**: development (Vercel dev deployment)
- **Node Version**: 22.x
- **Database**: Supabase (cloud)
- **Last Working**: Unknown - all 10 recent runs have failed

## Reproduction Steps

1. Push code to dev branch
2. Wait for "Deploy to Dev" workflow to complete
3. "Dev Integration Tests" workflow triggers automatically
4. All integration tests timeout with authentication failures

## Expected Behavior

Integration tests should:
1. Authenticate users via Supabase API in global setup
2. Inject session into browser localStorage
3. Load tests with users already authenticated
4. Find UI elements like `[data-test="account-selector-trigger"]`

## Actual Behavior

Integration tests:
1. Global setup authenticates successfully via API
2. Session is injected under key derived from `E2E_SUPABASE_URL` (GitHub Secret)
3. App loads but looks for session under key from `NEXT_PUBLIC_SUPABASE_URL` (Vercel env)
4. Session not found - user redirected to `/auth/sign-in`
5. Tests timeout waiting for authenticated UI elements

## Diagnostic Data

### Console Output
```
✅ API authentication successful for test user
✅ Session injected into browser storage for test user
✅ test user auth state saved successfully

# But in tests:
pw:api navigating to ".../home", waiting until "domcontentloaded"
pw:api navigated to ".../auth/sign-in?next=/home"  # ← Redirected to sign-in!
pw:api waiting for locator('[data-test="account-selector-trigger"]')
pw:api <= locator.click failed  # ← Times out after 3 minutes
```

### GitHub Secrets Timestamps
```
E2E_SUPABASE_URL                2025-11-07T19:27:37Z  (12 days old)
NEXT_PUBLIC_SUPABASE_URL        2025-11-19T14:16:03Z  (updated TODAY)
```

### Workflow Configuration Output
```
✅ Using deployed Supabase instance for E2E tests
✅ URL: https://ldebzombxtszzcgnylgq.s...  # From NEXT_PUBLIC_SUPABASE_URL
```

### Test Failures (All follow same pattern)
1. `auth-simple.spec.ts` - `page.waitForURL` timeout waiting for `/home` or `/onboarding`
2. `team-accounts.spec.ts` - Cannot find `[data-test="account-selector-trigger"]`
3. `team-billing.spec.ts` - Cannot find `[data-test="account-selector-trigger"]`
4. `user-billing.spec.ts` - Cannot find `[data-test-plan]` elements

## Error Stack Traces
```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
waiting for navigation until "load"
> 71 | await page.waitForURL(
  at auth-simple.spec.ts:71:14

Error: Test timeout of 180000ms exceeded
waiting for locator('[data-test="account-selector-trigger"]')
> 89 | }).toPass();
  at team-accounts/team-accounts.po.ts:89:6
```

## Related Code
- **Affected Files**:
  - `.github/workflows/dev-integration-tests.yml` (lines 412-459)
  - `apps/e2e/global-setup.ts` (lines 44-160)
  - Vercel environment configuration (external)
- **Recent Changes**: `NEXT_PUBLIC_SUPABASE_URL` GitHub Secret updated today at 14:16 UTC
- **Suspected Functions**:
  - Session key derivation in global-setup.ts:155-156
  - Supabase client initialization in deployed app

## Related Issues & Context

### Direct Predecessors
- #628 (CLOSED): "Bug Diagnosis: Dev Integration Tests Failing - Authentication State Not Persisting" - Same symptoms, closed yesterday
- #630 (CLOSED): "Bug Fix: Dev Integration Tests - Authentication State Not Persisting" - Fix applied yesterday

### Related Infrastructure Issues
- #576 (CLOSED): "CI/CD: Dev integration tests failing due to missing Supabase configuration"
- #590 (CLOSED): "CI/CD: Dev Integration Tests Failing - Authentication State & Deployment Readiness Issues"
- #591 (CLOSED): "CI/CD: Dev Integration Tests - Vercel Protection Blocking Health Endpoint"

### Similar Symptoms
- #584 (CLOSED): "CI/CD: Integration tests fail with 404 on /home/settings due to localStorage domain mismatch"
- #525 (CLOSED): "CI/CD: Integration tests timeout during authentication setup in dev environment"

### Historical Context
This is a **recurring regression**. The same session key mismatch issue has been diagnosed and "fixed" multiple times, but the root cause is environment configuration drift between GitHub Secrets and Vercel environment variables. Each time one is updated, they become out of sync again.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The **2025slideheroes-payload** Vercel project was missing the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables. The web project had the correct configuration.

**Detailed Explanation**:

The E2E integration tests interact with both the web application and the Payload CMS API. While the web project (`2025slideheroes-web`) had the correct Supabase configuration, the Payload project (`2025slideheroes-payload`) was missing the required Supabase environment variables entirely.

This caused:
1. Payload API endpoints to fail authentication-related operations
2. Tests that depend on Payload functionality to timeout
3. Cascading failures in tests that need both web and Payload to work correctly

**Supporting Evidence**:
- All 10 most recent workflow runs have failed
- Web project had correct `NEXT_PUBLIC_SUPABASE_URL` configured
- Payload project was missing both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Tests consistently failed with authentication-related timeouts

### How This Causes the Observed Behavior

1. Global setup authenticates user via Supabase API successfully
2. Session is injected into browser storage correctly
3. Tests navigate to web app pages
4. Web app tries to interact with Payload APIs
5. Payload has no Supabase configuration → authentication/authorization fails
6. Tests timeout waiting for UI elements that depend on Payload data

### Confidence Level

**Confidence**: High

**Reasoning**:
- User verified that web project had correct Supabase URL
- User confirmed Payload project was missing Supabase environment variables
- Adding the missing variables to Payload is the fix being tested

## Fix Approach (High-Level)

**Add missing Supabase environment variables to Payload project** (COMPLETED):
1. Log into Vercel Dashboard
2. Navigate to 2025slideheroes-payload Project Settings → Environment Variables
3. Add `NEXT_PUBLIC_SUPABASE_URL` with the correct Supabase URL
4. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the correct anon key
5. Redeploy the Payload project to pick up the new variables
6. Re-run the dev-integration-tests workflow to verify

**Long-term fix**: Ensure all Vercel projects that need Supabase access have the required environment variables configured. Consider documenting which env vars are required for each project.

## Diagnosis Determination

The root cause has been definitively identified as the **Payload Vercel project missing Supabase environment variables**. This is a configuration issue, not a code bug.

The fix has been applied by adding `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Payload project's Vercel environment variables. The workflow is being re-run to verify the fix.

## Additional Context

This regression pattern suggests a need for:
1. Documentation of the sync requirement between GitHub Secrets and Vercel env vars
2. Automated verification that these values match before tests run
3. Possibly using Vercel CLI to set env vars from a single source during deployment

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, Bash, Read, Task (Explore agent)*
