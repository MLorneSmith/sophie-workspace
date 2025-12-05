# Implementation Guide: Configure GitHub Actions Secrets for E2E Integration Tests

**GitHub Issue**: #637
**Severity**: Critical
**Status**: Ready for Manual Configuration
**Last Updated**: 2025-11-19

## Overview

The `dev-integration-tests.yml` GitHub Actions workflow requires two secrets to be configured in the GitHub repository settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

These secrets are referenced in the workflow but are currently not configured, causing E2E integration tests to fail with "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL" error.

## Step-by-Step Implementation

### Step 1: Obtain Supabase Credentials

**Action Required**: You need to determine which Supabase project should be used for integration testing.

**Options**:
1. **Production Environment**: Use the Supabase project that powers the production deployment
2. **Staging Environment**: Use a separate staging Supabase project
3. **Dev Environment**: Use the development/demo Supabase project

**How to Get Credentials**:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL**: This is your `SUPABASE_URL` (e.g., `https://abc123xyz.supabase.co`)
   - **Anon Public Key**: This is your `SUPABASE_ANON_KEY` (a long JWT-like string starting with `eyJ...`)

**Important Notes**:
- The Anon Key should be publicly visible - it's designed for client-side use
- Do NOT use the Service Role Key (that's for server-side only)
- The URL should be the full HTTPS URL with the `.supabase.co` domain

### Step 2: Configure GitHub Actions Secrets

**Via GitHub Web UI** (Recommended for most users):

1. Go to your GitHub repository: https://github.com/MLorneSmith/2025slideheroes
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click the **New repository secret** button
5. Create first secret:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://your-project-id.supabase.co` (paste the Supabase URL from Step 1)
   - Click **Add secret**
6. Create second secret:
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: `eyJ0eXAiOiJKV1QiLCJhbGc...` (paste the Anon Key from Step 1)
   - Click **Add secret**

**Via GitHub CLI** (For automation):

```bash
# Set your Supabase credentials as environment variables first
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_ANON_KEY="eyJ0eXAiOiJKV1QiLCJhbGc..."

# Create secrets using gh CLI
gh secret set NEXT_PUBLIC_SUPABASE_URL --body "$SUPABASE_URL" \
  --repo MLorneSmith/2025slideheroes

gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --body "$SUPABASE_ANON_KEY" \
  --repo MLorneSmith/2025slideheroes
```

**Verification**:
- After creating the secrets, navigate back to **Secrets and variables** → **Actions**
- Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` should appear in the list
- Values will be masked (shown as `***`) for security

### Step 3: Verify Workflow Configuration

The workflow is already correctly configured. The `.github/workflows/dev-integration-tests.yml` file:
- ✅ References the secrets correctly (lines 419-420)
- ✅ Checks if secrets are configured (lines 422-425)
- ✅ Exports environment variables (lines 432-433)
- ✅ Passes them to E2E tests (lines 458-459)

**No code changes needed** - the workflow is ready.

### Step 4: Test the Configuration

**Option A: Manually Trigger the Workflow**

1. Go to GitHub repository: https://github.com/MLorneSmith/2025slideheroes
2. Click **Actions** tab
3. Select **Dev Integration Tests** workflow from the left sidebar
4. Click **Run workflow** button
5. Select branch: `dev`
6. Click **Run workflow** button

**Option B: Push a Change to `dev` Branch**

Any commit to the `dev` branch will trigger the workflow automatically if it comes after a successful `Deploy to Dev` workflow run.

**Expected Results**:
- Workflow should complete without "Invalid supabaseUrl" errors
- E2E tests should execute (not be skipped)
- Integration tests should run against the deployed environment

## Verification Checklist

- [ ] GitHub Actions secrets are configured in repository settings
- [ ] `NEXT_PUBLIC_SUPABASE_URL` secret is visible in Settings → Secrets and variables → Actions
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` secret is visible in Settings → Secrets and variables → Actions
- [ ] Secrets are not visible in workflow logs (GitHub masks them automatically)
- [ ] Workflow step "Configure E2E Supabase environment" shows "✅ Using deployed Supabase instance for E2E tests"
- [ ] E2E tests execute (not skipped due to missing configuration)
- [ ] Integration tests complete without "Invalid supabaseUrl" errors
- [ ] At least one E2E test runs and passes

## How the Workflow Uses These Secrets

```
GitHub Actions Secrets
  ↓
env variables (lines 419-420)
  ↓
Conditional export (lines 432-433)
  ↓
E2E environment variables (lines 458-459)
  ↓
E2E tests read via environment variables (apps/e2e/global-setup.ts)
  ↓
Supabase client initialization
  ↓
Test user authentication
  ↓
Integration tests run
```

## Environment Variable Flow

The secrets flow through the workflow as follows:

```yaml
# In workflow file (.github/workflows/dev-integration-tests.yml):
SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
SUPABASE_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

# Then exported:
echo "SUPABASE_URL=$SUPABASE_URL" >> $GITHUB_ENV
echo "SUPABASE_KEY=$SUPABASE_KEY" >> $GITHUB_ENV

# Then used in E2E tests:
E2E_SUPABASE_URL: ${{ env.SUPABASE_URL || secrets.E2E_SUPABASE_URL }}
E2E_SUPABASE_ANON_KEY: ${{ env.SUPABASE_KEY || secrets.E2E_SUPABASE_ANON_KEY }}

# Then read by global-setup.ts:
const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey = process.env.E2E_SUPABASE_ANON_KEY || "eyJ...";
```

## Troubleshooting

### Workflow Step Says "⚠️ NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not configured"

**Cause**: The secrets aren't set in GitHub repository settings.

**Solution**:
1. Verify secrets are created in Settings → Secrets and variables → Actions
2. Check spelling: exactly `NEXT_PUBLIC_SUPABASE_URL` (not `SUPABASE_URL`)
3. Verify you're in the correct repository (MLorneSmith/2025slideheroes)

### Tests Fail with "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL"

**Possible Causes**:
1. Secrets not configured (see above)
2. Supabase URL is invalid (not HTTPS, missing domain)
3. URL has extra whitespace

**Solution**:
1. Double-check the Supabase URL format: `https://xxxxx.supabase.co`
2. Verify no extra spaces before/after the URL in the secret
3. Ensure it's the full URL, not just the project ID

### Tests Fail with Authentication Error

**Possible Causes**:
1. Wrong Supabase project (credentials mismatch with deployed app)
2. Anon Key is invalid or expired
3. Supabase project doesn't have the required test users

**Solution**:
1. Verify the Supabase credentials match the deployed environment
2. Check the Anon Key hasn't expired or been rotated
3. Ensure test users exist in the Supabase Auth system:
   - `test@slideheroes.com`
   - `owner@slideheroes.com`
   - `super-admin@slideheroes.com`

## Related Files

| File | Purpose | Relevant Lines |
|------|---------|-----------------|
| `.github/workflows/dev-integration-tests.yml` | Workflow definition | 419-434, 458-459 |
| `apps/e2e/global-setup.ts` | E2E setup, reads environment vars | 45-48 |
| `apps/e2e/tests/utils/credential-validator.ts` | Validates test user credentials | - |

## Security Considerations

✅ **What's Secure About This Setup**:
- Secrets are stored encrypted in GitHub's secure vault
- Secrets are never printed in workflow logs (GitHub masks them)
- Anon Key is designed for client-side use (limited permissions)
- Secrets can only be used by workflows in this repository

⚠️ **What to Be Careful About**:
- Don't use the Service Role Key (that's for server-side only)
- Don't print secrets in logs or artifacts
- Rotate keys regularly if they're compromised
- Only grant necessary permissions to test users

## Next Steps After Configuration

1. Trigger the workflow and wait for completion
2. Review test results in GitHub Actions
3. If tests pass, the fix is complete
4. If tests fail, check the troubleshooting section above

## Related Documentation

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Client Setup](https://supabase.com/docs/reference/javascript/initializing)
- [Playwright E2E Testing](https://playwright.dev/)
- Issue #635: Diagnosis of this bug
- `.github/workflows/dev-integration-tests.yml`: The workflow file

---

**Implementation completed by Claude**
**Issue**: #637
**Status**: Manual Configuration Required
