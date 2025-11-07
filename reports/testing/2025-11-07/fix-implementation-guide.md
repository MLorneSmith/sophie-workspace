# Implementation Guide: Fix Dev Integration Tests Configuration

**Date**: 2025-11-07
**Issue**: E2E tests connecting to localhost instead of deployed Supabase
**Impact**: All integration tests failing in dev-integration-tests.yml workflow

## Quick Fix (5 minutes)

### Step 1: Update Workflow Configuration

**File**: `.github/workflows/dev-integration-tests.yml`
**Location**: Line 393 (in the `env:` section of the `integration-tests` job)

**Current Code** (lines 374-393):
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
    ENABLE_BILLING_TESTS: true
    ENABLE_TEAM_ACCOUNT_TESTS: true
    # E2E test user credentials
    E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
    E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
    E2E_OWNER_EMAIL: ${{ secrets.E2E_OWNER_EMAIL }}
    E2E_OWNER_PASSWORD: ${{ secrets.E2E_OWNER_PASSWORD }}
    E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
    E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
    # Add debug logging for Playwright
    DEBUG: pw:api
```

**New Code** (add two lines after line 383):
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
    # Supabase configuration (REQUIRED for API-based authentication)
    E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
    E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
    ENABLE_BILLING_TESTS: true
    ENABLE_TEAM_ACCOUNT_TESTS: true
    # E2E test user credentials
    E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
    E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
    E2E_OWNER_EMAIL: ${{ secrets.E2E_OWNER_EMAIL }}
    E2E_OWNER_PASSWORD: ${{ secrets.E2E_OWNER_PASSWORD }}
    E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
    E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
    # Add debug logging for Playwright
    DEBUG: pw:api
```

### Step 2: Verify GitHub Secrets

Check that these secrets exist:
```bash
gh secret list --repo MLorneSmith/2025slideheroes | grep -E "E2E_SUPABASE|E2E_TEST|E2E_OWNER|E2E_ADMIN"
```

Expected output:
```
E2E_ADMIN_EMAIL             Updated ...
E2E_ADMIN_PASSWORD          Updated ...
E2E_OWNER_EMAIL             Updated ...
E2E_OWNER_PASSWORD          Updated ...
E2E_SUPABASE_ANON_KEY       Updated ...
E2E_SUPABASE_URL            Updated ...
E2E_TEST_USER_EMAIL         Updated ...
E2E_TEST_USER_PASSWORD      Updated ...
```

If `E2E_SUPABASE_URL` or `E2E_SUPABASE_ANON_KEY` are missing, this is the blocker.

### Step 3: Test the Fix

1. Commit the workflow change
2. Push to dev branch
3. Trigger the workflow manually or wait for next deployment
4. Check logs for successful authentication:
   ```
   🔧 Global Setup: Creating authenticated browser states via API...
   🔐 Authenticating test user via Supabase API...
   ✅ API authentication successful for test user
   ```

## Enhanced Solution (15 minutes)

Add validation to catch this configuration error early.

### Update Global Setup with Validation

**File**: `apps/e2e/global-setup.ts`
**Location**: After line 31 (before Supabase client initialization)

**Add this validation block:**

```typescript
async function globalSetup(config: FullConfig) {
	console.log(
		"\n🔧 Global Setup: Creating authenticated browser states via API...\n",
	);

	const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:3001";

	// Initialize Supabase client
	const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
	const supabaseAnonKey =
		process.env.E2E_SUPABASE_ANON_KEY ||
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

	// ✅ ADD VALIDATION
	// Detect configuration issues in CI environments
	if (process.env.CI === "true" && supabaseUrl.includes("127.0.0.1")) {
		console.error("\n❌ Configuration Error: Invalid Supabase URL in CI\n");
		console.error("Current configuration:");
		console.error(`  E2E_SUPABASE_URL: ${supabaseUrl}`);
		console.error(`  PLAYWRIGHT_BASE_URL: ${baseURL}`);
		console.error("");
		console.error("Problem:");
		console.error(
			"  The test suite is trying to connect to localhost (127.0.0.1:54321)",
		);
		console.error("  but should connect to the deployed Supabase instance.");
		console.error("");
		console.error("Solution:");
		console.error("  1. Set E2E_SUPABASE_URL in GitHub Secrets:");
		console.error("     E2E_SUPABASE_URL=https://your-project.supabase.co");
		console.error("");
		console.error("  2. Set E2E_SUPABASE_ANON_KEY in GitHub Secrets:");
		console.error("     E2E_SUPABASE_ANON_KEY=eyJhbGc...");
		console.error("");
		console.error("  3. Add these to the workflow env section:");
		console.error(
			"     E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}",
		);
		console.error(
			"     E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}",
		);
		console.error("");
		throw new Error(
			"E2E_SUPABASE_URL must point to deployed Supabase instance in CI. " +
				"Check GitHub Secrets and workflow configuration.",
		);
	}

	console.log(`🔗 Supabase URL: ${supabaseUrl}`);
	console.log(`🔗 Web App URL: ${baseURL}\n`);

	// Create auth state directory if it doesn't exist
	// ... rest of existing code ...
}
```

### Why This Helps

1. **Early Detection**: Fails immediately with clear message
2. **Actionable Guidance**: Tells exactly what to fix
3. **Environment Aware**: Only validates in CI, allows local defaults
4. **Debug Information**: Logs URLs being used

## Verification Checklist

After implementing the fix:

- [ ] Workflow file updated with E2E_SUPABASE_URL
- [ ] Workflow file updated with E2E_SUPABASE_ANON_KEY
- [ ] GitHub Secrets verified to exist
- [ ] Global setup validation added (optional but recommended)
- [ ] Changes committed and pushed
- [ ] Workflow triggered and logs checked
- [ ] Global setup completes successfully
- [ ] All three users authenticate (test, owner, admin)
- [ ] Tests proceed to actual execution

## Expected Log Output (Success)

```
🔧 Global Setup: Creating authenticated browser states via API...

🔗 Supabase URL: https://abc123.supabase.co
🔗 Web App URL: https://dev.slideheroes.com

🔐 Authenticating test user via Supabase API...
✅ API authentication successful for test user
✅ Session injected into browser storage for test user
✅ test user auth state saved successfully

🔐 Authenticating owner user via Supabase API...
✅ API authentication successful for owner user
✅ Session injected into browser storage for owner user
✅ owner user auth state saved successfully

🔐 Authenticating super-admin user via Supabase API...
✅ API authentication successful for super-admin user
✅ Session injected into browser storage for super-admin user
✅ super-admin user auth state saved successfully

✅ Global Setup Complete: All auth states created via API
```

## Expected Log Output (Before Fix)

```
🔧 Global Setup: Creating authenticated browser states via API...

🔐 Authenticating test user via Supabase API...

TypeError: fetch failed
  at Object.fetch (node:internal/deps/undici/undici:11730:11)
  ...
  at globalSetup (/home/runner/work/2025slideheroes/2025slideheroes/apps/e2e/global-setup.ts:81:27)
  {
    cause: Error: connect ECONNREFUSED 127.0.0.1:54321
  }

❌ Failed to authenticate test user: fetch failed
```

## Rollback Plan

If the fix causes issues:

1. Remove the two added lines from the workflow
2. Revert global-setup.ts changes (if validation was added)
3. Tests will fail with original error
4. Investigate why secrets are not accessible

## Additional Workflows to Check

These workflows might have the same issue:

```bash
# Check all workflows using E2E tests
grep -l "E2E_TEST_USER_EMAIL" .github/workflows/*.yml
```

Each should include E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY.

## Secret Management Best Practices

### Security Considerations

1. **Anon Key is Public**: Safe to use in CI, it's client-side key
2. **Service Role Key**: NOT needed for these tests (uses user auth)
3. **User Passwords**: Must be secure, stored as secrets
4. **Environment Separation**: Use different Supabase projects for test/staging/prod

### Recommended Secret Structure

```
Production Secrets:
- PROD_SUPABASE_URL
- PROD_SUPABASE_ANON_KEY

E2E Test Secrets (separate project):
- E2E_SUPABASE_URL
- E2E_SUPABASE_ANON_KEY
- E2E_TEST_USER_EMAIL
- E2E_TEST_USER_PASSWORD
- E2E_OWNER_EMAIL
- E2E_OWNER_PASSWORD
- E2E_ADMIN_EMAIL
- E2E_ADMIN_PASSWORD
```

## Next Steps

1. ✅ Implement quick fix (workflow update)
2. ✅ Verify secrets exist
3. ✅ Test the fix
4. 🔄 Consider adding validation (enhanced solution)
5. 🔄 Update other workflows if needed
6. 📝 Document in team wiki/runbook

## Questions?

Common questions and answers:

**Q: Why do we need both E2E_SUPABASE_URL and PLAYWRIGHT_BASE_URL?**
A: E2E_SUPABASE_URL is for API authentication calls, PLAYWRIGHT_BASE_URL is for browser navigation. They point to the same environment but serve different purposes.

**Q: Can we use the same Supabase instance as production?**
A: Not recommended. Use a dedicated E2E test Supabase project with test data.

**Q: What if I don't have access to set GitHub Secrets?**
A: Contact repository admin or team lead to set these secrets.

**Q: Why does local development work without these variables?**
A: Local development uses defaults (localhost:54321) which match the local Supabase instance started by `pnpm supabase:web:start`.

**Q: Can I test this locally?**
A: Yes, set environment variables before running tests:
```bash
export E2E_SUPABASE_URL="https://your-project.supabase.co"
export E2E_SUPABASE_ANON_KEY="your-anon-key"
pnpm --filter web-e2e test:integration
```
