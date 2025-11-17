# Dev Integration Tests Configuration Analysis

**Date**: 2025-11-07
**Workflow**: dev-integration-tests.yml
**Run ID**: 19177473042
**Status**: FAILED - Configuration Issue

## Executive Summary

The integration tests are failing because the E2E test suite is attempting to authenticate against a local Supabase instance (127.0.0.1:54321) instead of the deployed dev environment. The workflow does not configure the required E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY environment variables.

## Root Cause Analysis

### Error Details

**Error Message**:
```
AuthRetryableFetchError: fetch failed
Caused by: Error: connect ECONNREFUSED 127.0.0.1:54321
```

**Location**: `apps/e2e/global-setup.ts:81` (signInWithPassword call)

### Configuration Gap

**Current Configuration** (`global-setup.ts:35-38`):
```typescript
const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey =
  process.env.E2E_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Local Supabase demo key
```

**Workflow Environment Variables** (dev-integration-tests.yml:375-393):
```yaml
env:
  BASE_URL: ${{ needs.check-should-run.outputs.web_deployment_url }}
  SKIP_EMAIL_VERIFICATION: true
  CI: true
  PLAYWRIGHT_BASE_URL: ${{ needs.check-should-run.outputs.web_deployment_url }}
  PLAYWRIGHT_API_URL: ${{ needs.check-should-run.outputs.payload_deployment_url }}
  VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}
  # User credentials are set
  E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
  E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
  # ... other credentials

  # ❌ MISSING: E2E_SUPABASE_URL
  # ❌ MISSING: E2E_SUPABASE_ANON_KEY
```

### Impact

1. **Global Setup Fails**: Authentication cannot complete because Supabase client connects to localhost
2. **All Tests Blocked**: Since global-setup.ts creates authenticated browser states, all tests fail immediately
3. **Invalid Test Results**: Tests never reach actual application validation

## Required Environment Variables

### Primary Variables (CRITICAL)

| Variable | Purpose | Expected Value |
|----------|---------|----------------|
| `E2E_SUPABASE_URL` | Supabase project URL for auth API calls | Production Supabase URL (e.g., `https://abc123.supabase.co`) |
| `E2E_SUPABASE_ANON_KEY` | Supabase anon/public key for auth client | Production anon key (JWT token) |

### Current User Credentials (Already Set)

These are correctly configured:
- `E2E_TEST_USER_EMAIL` / `E2E_TEST_USER_PASSWORD`
- `E2E_OWNER_EMAIL` / `E2E_OWNER_PASSWORD`
- `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`

## Authentication Flow Analysis

### How Global Setup Works

```typescript
// 1. Create Supabase client with URL + anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Authenticate via Supabase Auth API
const { data, error } = await supabase.auth.signInWithPassword({
  email: credentials.email,
  password: credentials.password,
});

// 3. Inject session into browser storage
await page.evaluate((session) => {
  const key = `sb-${window.location.host.split(".")[0]}-auth-token`;
  localStorage.setItem(key, JSON.stringify(session));
}, data.session);

// 4. Save authenticated state for tests
await context.storageState({ path: authState.filePath });
```

### Why Both URLs Are Needed

| URL Type | Variable | Usage |
|----------|----------|-------|
| **Supabase Auth URL** | `E2E_SUPABASE_URL` | API authentication calls (createClient) |
| **Web Application URL** | `PLAYWRIGHT_BASE_URL` | Browser navigation and UI testing |

They must both point to the same environment (dev in this case).

## Comparison with PR Validation Workflow

The `pr-validation.yml` workflow correctly includes these variables:

```yaml
# pr-validation.yml (WORKING EXAMPLE)
env:
  E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
  E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
  E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
  # ... etc
```

## Recommendations

### 1. Add Required Environment Variables (IMMEDIATE FIX)

Add to `dev-integration-tests.yml` at line 393:

```yaml
env:
  BASE_URL: ${{ needs.check-should-run.outputs.web_deployment_url }}
  SKIP_EMAIL_VERIFICATION: true
  CI: true
  PLAYWRIGHT_BASE_URL: ${{ needs.check-should-run.outputs.web_deployment_url }}
  PLAYWRIGHT_API_URL: ${{ needs.check-should-run.outputs.payload_deployment_url }}
  VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}

  # ✅ ADD THESE LINES
  E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
  E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}

  # E2E test user credentials (already present)
  E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
  # ... rest of credentials
```

### 2. Verify GitHub Secrets Exist

Ensure these secrets are configured in repository settings:

```bash
gh secret list --repo MLorneSmith/2025slideheroes | grep E2E_SUPABASE
```

Expected output:
```
E2E_SUPABASE_URL        Updated 2025-XX-XX
E2E_SUPABASE_ANON_KEY   Updated 2025-XX-XX
```

If missing, set them:
```bash
gh secret set E2E_SUPABASE_URL --body "https://your-project.supabase.co"
gh secret set E2E_SUPABASE_ANON_KEY --body "eyJhbGc..."
```

### 3. Add Environment Validation (PROACTIVE)

Enhance `global-setup.ts` to detect this issue early:

```typescript
// Add before line 35 in global-setup.ts
async function globalSetup(config: FullConfig) {
  console.log("\n🔧 Global Setup: Creating authenticated browser states via API...\n");

  const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:3001";

  // ✅ ADD VALIDATION
  const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseAnonKey = process.env.E2E_SUPABASE_ANON_KEY || /* default key */;

  // Warn if using localhost in CI
  if (process.env.CI && supabaseUrl.includes("127.0.0.1")) {
    console.error("❌ Configuration Error: Using localhost Supabase in CI environment");
    console.error("   E2E_SUPABASE_URL:", supabaseUrl);
    console.error("   Expected: Production Supabase URL");
    console.error("   Required: Set E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY secrets");
    throw new Error(
      "E2E_SUPABASE_URL must point to deployed Supabase instance in CI. " +
      "Check GitHub Secrets configuration."
    );
  }

  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`🔗 Web App URL: ${baseURL}`);

  // Continue with existing setup...
}
```

### 4. Add Configuration Documentation Comment

Add to workflow file before env section:

```yaml
- name: Run integration test suite
  env:
    # Web Application URLs
    BASE_URL: ${{ needs.check-should-run.outputs.web_deployment_url }}
    PLAYWRIGHT_BASE_URL: ${{ needs.check-should-run.outputs.web_deployment_url }}
    PLAYWRIGHT_API_URL: ${{ needs.check-should-run.outputs.payload_deployment_url }}

    # Supabase Configuration (REQUIRED)
    # These must point to the same environment as the web deployment
    # The auth client uses these to authenticate test users via API
    E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
    E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}

    # Vercel Protection Bypass
    VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}

    # Test User Credentials
    E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
    # ...
```

### 5. Create Environment-Specific Test Accounts

Ensure test accounts exist in production Supabase:
- test1@slideheroes.com
- owner@slideheroes.com
- admin@slideheroes.com (with MFA configured)

These should match the credentials in GitHub Secrets.

## Additional Configuration Resilience

### 1. Graceful Fallback for Missing Anon Key

Currently uses a hardcoded local key. Consider:

```typescript
const supabaseAnonKey = process.env.E2E_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  const msg = process.env.CI
    ? "E2E_SUPABASE_ANON_KEY is required in CI environments"
    : "E2E_SUPABASE_ANON_KEY not set, using local demo key";

  if (process.env.CI) {
    throw new Error(msg);
  }
  console.warn(`⚠️ ${msg}`);
}
```

### 2. Add Health Check Before Authentication

```typescript
// Verify Supabase connectivity before attempting auth
try {
  const healthCheck = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: { apikey: supabaseAnonKey }
  });

  if (!healthCheck.ok) {
    console.error(`❌ Supabase health check failed: ${healthCheck.status}`);
    console.error(`   URL: ${supabaseUrl}`);
    throw new Error("Supabase instance is not accessible");
  }

  console.log("✅ Supabase connectivity verified");
} catch (error) {
  console.error("❌ Cannot reach Supabase instance:", error.message);
  throw error;
}
```

### 3. Better Error Messages

Enhance error handling in global-setup.ts:

```typescript
if (error || !data.session) {
  console.error(`❌ Failed to authenticate ${authState.name}`);
  console.error(`   Error: ${error?.message || "No session returned"}`);
  console.error(`   Supabase URL: ${supabaseUrl}`);
  console.error(`   Email: ${credentials.email}`);

  if (supabaseUrl.includes("127.0.0.1")) {
    console.error("");
    console.error("⚠️ Configuration Issue Detected:");
    console.error("   You are connecting to localhost Supabase");
    console.error("   In CI/deployed environments, set:");
    console.error("     E2E_SUPABASE_URL=https://your-project.supabase.co");
    console.error("     E2E_SUPABASE_ANON_KEY=<your-anon-key>");
  }

  throw error || new Error("No session returned from Supabase");
}
```

## Testing the Fix

### Local Verification

```bash
# Set environment variables
export E2E_SUPABASE_URL="https://your-dev-project.supabase.co"
export E2E_SUPABASE_ANON_KEY="eyJhbGc..."
export E2E_TEST_USER_EMAIL="test1@slideheroes.com"
export E2E_TEST_USER_PASSWORD="your-password"
export PLAYWRIGHT_BASE_URL="https://dev.slideheroes.com"

# Run tests
cd apps/e2e
pnpm test:integration
```

### CI Verification

After updating workflow:
1. Verify secrets are set
2. Trigger workflow manually
3. Check global setup logs for correct URLs
4. Verify authentication succeeds

## Related Issues

### Similar Patterns to Check

Search for other workflows that might have the same issue:

```bash
grep -r "E2E_TEST_USER_EMAIL" .github/workflows/*.yml | grep -v "E2E_SUPABASE_URL"
```

All workflows running E2E tests need these environment variables.

## Success Criteria

- ✅ Global setup connects to deployed Supabase instance
- ✅ All three test users authenticate successfully
- ✅ Authenticated browser states are created
- ✅ Tests can proceed to actual application validation
- ✅ Clear error messages if configuration is wrong

## Implementation Priority

1. **HIGH (Immediate)**: Add E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY to workflow
2. **HIGH (Immediate)**: Verify GitHub Secrets exist
3. **MEDIUM (Same PR)**: Add validation in global-setup.ts
4. **MEDIUM (Same PR)**: Improve error messages
5. **LOW (Follow-up)**: Add health check before auth

## References

- **Working Example**: `.github/workflows/pr-validation.yml` lines 370-371
- **Documentation**: `apps/e2e/README.md` lines 171-178
- **Environment Template**: `apps/e2e/.env.example` lines 5-6
- **Global Setup**: `apps/e2e/global-setup.ts` lines 35-38
