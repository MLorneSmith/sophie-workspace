# Bug Diagnosis: dev-integration-tests.yml Pipeline Invalid supabaseUrl Error

**ID**: ISSUE-DEV-20251118-001
**Created**: 2025-11-18T22:35:00Z
**Reporter**: User Report
**Severity**: critical
**Status**: new
**Type**: integration

## Summary

The `dev-integration-tests.yml` GitHub Actions workflow is failing consistently with an "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL" error in the E2E test global setup. The failure occurs during the global setup phase when attempting to authenticate test users via the Supabase API. The root cause is that environment variables `E2E_SUPABASE_URL` and `E2E_SUPABASE_ANON_KEY` are empty or undefined, causing the Supabase client initialization to fail.

## Environment

- **Application Version**: dev branch (commit 7a7d6531022f2ccc938cedef3a995038f151648e)
- **Environment**: CI/CD (GitHub Actions)
- **Node Version**: 22.16.0
- **Database**: Supabase (production instance)
- **Last Working**: Prior to commit c3b596fe3 (fix(ci): align E2E Supabase credentials with deployed environment) on 2025-11-18

## Reproduction Steps

1. Trigger the "Deploy to Dev" workflow on the dev branch
2. Wait for deployment to complete successfully
3. The `dev-integration-tests.yml` workflow is automatically triggered via `workflow_run` event
4. Wait for the Integration Tests job to execute
5. Observe the failure in the E2E global setup step

## Expected Behavior

1. The "Configure E2E Supabase environment" step should successfully extract Supabase URL and key from GitHub secrets
2. These values should be exported as environment variables (SUPABASE_URL and SUPABASE_KEY)
3. The "Run integration test suite" step should receive non-empty E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY values
4. Global setup should create authenticated browser states successfully
5. Integration tests should run to completion

## Actual Behavior

1. The "Configure E2E Supabase environment" step completes without error
2. Environment variables SUPABASE_URL and SUPABASE_KEY may not be properly set
3. The fallback to E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY secrets still results in empty values
4. Global setup fails when trying to initialize Supabase client with undefined URL
5. Test execution is halted with error: "Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL."

## Diagnostic Data

### Console Output
```
🔧 Global Setup: Creating authenticated browser states via API...

🌐 Using BASE_URL: https://2025slideheroes-nctwj0egb-slideheroes.vercel.app

🔐 Authenticating test user via Supabase API...

Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.

   at ../global-setup.ts:88

  86 | 		// Create a fresh Supabase client for each user
  87 | 		const supabase = createClient(supabaseUrl, supabaseAnonKey);
  88 |
  91 | 		const { data, error } = await supabase.auth.signInWithPassword({
```

### Environment Variable Analysis

**From global-setup.ts (line 45-48):**
```typescript
const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey =
  process.env.E2E_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
```

**From dev-integration-tests.yml (lines 458-459):**
```yaml
E2E_SUPABASE_URL: ${{ env.SUPABASE_URL || secrets.E2E_SUPABASE_URL }}
E2E_SUPABASE_ANON_KEY: ${{ env.SUPABASE_KEY || secrets.E2E_SUPABASE_ANON_KEY }}
```

**Issue**:
- If both `env.SUPABASE_URL` (from the "Configure E2E Supabase environment" step) and `secrets.E2E_SUPABASE_URL` are empty/undefined, the environment variable becomes empty string or null
- The Supabase client throws error "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL" because the URL is not a valid HTTP/HTTPS string
- The fallback to localhost URL (line 45) is NOT triggered because `process.env.E2E_SUPABASE_URL` is explicitly set to an empty value from the workflow

### Network Analysis

No network connectivity issues observed. The deployment URLs are accessible. The issue is purely environment variable configuration.

## Error Stack Traces

```
Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.
    at ../global-setup.ts:88
    at processTicksAsPromises (internal/timers.js:88:667)
```

The error originates from the `@supabase/supabase-js` library when constructing the client with an invalid URL parameter.

## Related Code

- **Affected Files**:
  - `.github/workflows/dev-integration-tests.yml` (lines 412-435, 458-459)
  - `apps/e2e/global-setup.ts` (lines 45-48, 88)

- **Recent Changes**:
  - Commit c3b596fe3 (2025-11-18 09:55:29): "fix(ci): align E2E Supabase credentials with deployed environment"
  - Changed lines 455-456 to use fallback pattern: `${{ env.SUPABASE_URL || secrets.E2E_SUPABASE_URL }}`

- **Suspected Functions**:
  - `globalSetup()` in apps/e2e/global-setup.ts
  - Workflow step "Configure E2E Supabase environment"

## Related Issues & Context

### Direct Predecessors
None found in current state, but this relates to issue #630 which the recent commit claims to fix.

### Similar Symptoms
This error pattern indicates missing or incorrectly configured GitHub secrets or environment variable fallback logic.

### Historical Context
The recent commit c3b596fe3 attempted to configure E2E tests to use the same Supabase instance as the deployed environment. However, the implementation relies on secrets that may not be properly configured: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Root Cause Analysis

### Identified Root Cause

**Summary**: GitHub secrets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not configured in the repository's GitHub Actions secrets, causing the "Configure E2E Supabase environment" step to set configured=false without exporting SUPABASE_URL and SUPABASE_KEY environment variables. The subsequent fallback to E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY secrets (which may also be missing or empty) results in empty environment variables being passed to the test suite, causing the Supabase client initialization to fail.

**Detailed Explanation**:

The workflow logic flow is:

1. **"Configure E2E Supabase environment" step** (lines 412-435) attempts to read `secrets.NEXT_PUBLIC_SUPABASE_URL` and `secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **If these secrets are missing**, the step detects it (line 421-425):
   ```bash
   if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
     echo "configured=false" >> $GITHUB_OUTPUT
   ```
   And notes it should fall back to `E2E_SUPABASE_URL` and `E2E_SUPABASE_ANON_KEY`

3. **The environment variables are NOT exported** when configured=false, so `env.SUPABASE_URL` and `env.SUPABASE_KEY` remain unset

4. **In "Run integration test suite" step** (lines 458-459), the fallback pattern is used:
   ```yaml
   E2E_SUPABASE_URL: ${{ env.SUPABASE_URL || secrets.E2E_SUPABASE_URL }}
   ```

5. **If BOTH are empty**, GitHub Actions treats this as empty string or null value

6. **The global-setup.ts receives undefined/empty E2E_SUPABASE_URL**, and because it's explicitly set (even if empty), the fallback to localhost is never triggered:
   ```typescript
   const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
   ```
   Here, `process.env.E2E_SUPABASE_URL` is an empty string `""`, which is falsy BUT when explicitly set as an env var, it's a string type, not undefined

7. **Supabase client initialization fails** because empty string is not a valid HTTP/HTTPS URL

### How This Causes the Observed Behavior

The causal chain is:
- Missing GitHub secrets → Environment variable configuration skipped
- Fallback secrets also missing or not configured → Empty env vars passed to test
- Supabase client receives empty URL string instead of valid URL or localhost
- Supabase.js throws "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL"
- Global setup fails → Integration tests never run → Entire pipeline fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- Stack trace clearly shows error originates from Supabase client initialization at line 88 of global-setup.ts
- Recent commit c3b596fe3 modified the exact workflow step responsible for this
- The fallback logic in the workflow uses the new pattern but depends on secrets being configured
- All 5 recent workflow runs show identical failure pattern starting immediately after the commit
- The error message "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL" is Supabase.js's exact error for invalid URL parameter
- Git commit history shows no other changes to global-setup.ts that would explain this failure

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Configure the GitHub secrets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the repository settings with values from the production Supabase instance. This aligns with the recent commit's intention to use deployed environment credentials.

**Option 2**: Alternatively, ensure that `E2E_SUPABASE_URL` and `E2E_SUPABASE_ANON_KEY` secrets are properly configured as fallback secrets. OR, modify the workflow to explicitly check for empty values and use localhost defaults when both secret options are missing.

**Option 3**: Modify global-setup.ts to handle empty/undefined environment variables more gracefully by checking for empty strings and using the localhost fallback, in addition to checking for undefined.

## Diagnosis Determination

**Root cause definitively identified**: The pipeline is failing because required GitHub secrets for Supabase configuration are not set. The recent workflow changes introduced a dependency on these secrets, which are not configured. This is a configuration issue, not a code defect.

The fix requires either:
1. Setting up the missing GitHub secrets with the correct Supabase credentials
2. Reverting to simpler fallback logic that doesn't depend on external secret configuration
3. Making the environment variable handling more defensive in both the workflow and global-setup.ts

## Additional Context

- **First Failure**: 2025-11-17 21:57:34 (5 consecutive failures after this)
- **Correlation**: All failures occurred after commit c3b596fe3
- **Impact**: Complete blocking of integration tests - dev integration test suite is entirely non-functional
- **User Impact**: Cannot validate dev deployments, blocking promotion to staging
- **Frequency**: 100% failure rate - every pipeline run since the change fails at the same point

---
*Generated by Claude Diagnostic Assistant*
*Tools Used: GitHub CLI, Git Log, Workflow Analysis, Code Review*
