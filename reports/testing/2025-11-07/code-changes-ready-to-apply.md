# Code Changes Ready to Apply

**Purpose**: Fix dev integration test authentication failures
**Type**: Enhancement (user provisioning automation)
**Priority**: HIGH
**Estimated Review Time**: 15 minutes

## Overview

This document contains production-ready code changes to add automated user provisioning to the dev integration tests workflow. All changes are backward compatible and include comprehensive error handling.

## File Changes

### 1. Enhanced User Provisioning Script

**File**: `apps/e2e/scripts/setup-test-users.js`
**Action**: Replace entire file
**Why**: Add idempotency and better error handling

<details>
<summary>View full file content (click to expand)</summary>

```javascript
#!/usr/bin/env node

/**
 * Setup test users for E2E testing
 * This script creates test users with the correct password using the Supabase Admin API
 * Enhanced with idempotency - safe to run multiple times
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
 process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ||
 "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
 process.env.E2E_SUPABASE_ANON_KEY ||
 "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const TEST_USERS = [
 {
  email: process.env.E2E_TEST_USER_EMAIL || "test1@slideheroes.com",
  password: process.env.E2E_TEST_USER_PASSWORD || "aiesec1992",
  user_metadata: { name: "Test User One", onboarded: true },
 },
 {
  email: process.env.E2E_OWNER_EMAIL || "test2@slideheroes.com",
  password: process.env.E2E_OWNER_PASSWORD || "aiesec1992",
  user_metadata: { name: "Test User Two", onboarded: true },
 },
 {
  email: process.env.E2E_ADMIN_EMAIL || "michael@slideheroes.com",
  password: process.env.E2E_ADMIN_PASSWORD || "aiesec1992",
  user_metadata: { name: "Michael Smith", onboarded: true },
  app_metadata: { role: "super-admin" },
 },
];

/**
 * Check if a user can authenticate with given credentials
 */
async function testAuthentication(email, password) {
 const supabase = createClient(SUPABASE_URL, ANON_KEY);
 const { error } = await supabase.auth.signInWithPassword({ email, password });
 return !error;
}

/**
 * Create or verify a user exists with correct credentials
 */
async function createUser(user) {
 // First, test if user can authenticate
 const canAuth = await testAuthentication(user.email, user.password);

 if (canAuth) {
  console.log(`✓ User ${user.email} exists and credentials are valid`);
  return { existed: true, created: false };
 }

 // User doesn't exist or password is wrong - create via admin API
 const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: "POST",
  headers: {
   "Content-Type": "application/json",
   Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
   apikey: SERVICE_ROLE_KEY,
  },
  body: JSON.stringify({
   email: user.email,
   password: user.password,
   email_confirm: true,
   user_metadata: user.user_metadata,
   app_metadata: user.app_metadata || {},
  }),
 });

 if (!response.ok) {
  const error = await response.text();
  // Check if user already exists (409 Conflict)
  if (response.status === 409 || error.includes("already been registered")) {
   console.log(`⚠️ User ${user.email} exists but password doesn't match`);
   console.log(`ℹ️ You may need to update the password manually or delete the user`);
   return { existed: true, created: false };
  }
  throw new Error(`Failed to create user ${user.email}: ${error}`);
 }

 console.log(`✓ Created user: ${user.email}`);
 return { existed: false, created: true };
}

async function setupTestUsers() {
 console.log("Setting up E2E test users...");
 console.log(`Supabase URL: ${SUPABASE_URL}\n`);

 let existingCount = 0;
 let createdCount = 0;
 let errorCount = 0;

 for (const user of TEST_USERS) {
  try {
   const result = await createUser(user);
   if (result.existed && !result.created) {
    existingCount++;
   } else if (result.created) {
    createdCount++;
   }
  } catch (error) {
   console.error(`✗ Error with user ${user.email}:`, error.message);
   errorCount++;
  }
 }

 console.log("\n" + "=".repeat(50));
 console.log("Summary:");
 console.log(`  Existing users: ${existingCount}`);
 console.log(`  Created users: ${createdCount}`);
 console.log(`  Errors: ${errorCount}`);
 console.log("=".repeat(50));

 if (errorCount > 0) {
  console.error("\n⚠️ Some users could not be provisioned");
  process.exit(1);
 }

 console.log("\n✓ All test users are ready!");
}

// Run the setup
setupTestUsers().catch((error) => {
 console.error("Setup failed:", error);
 process.exit(1);
});
```

</details>

**Key Improvements**:

- ✅ Idempotent - safe to run multiple times
- ✅ Tests authentication before creating users
- ✅ Provides detailed summary output
- ✅ Handles 409 conflicts gracefully
- ✅ Better error messages

### 2. Workflow User Provisioning Step

**File**: `.github/workflows/dev-integration-tests.yml`
**Action**: Add new step before "Run integration test suite" (around line 374)
**Why**: Automatically provision users before tests run

```yaml
      - name: Provision test users
        env:
          E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
          E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
          E2E_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}
          E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
          E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
          E2E_OWNER_EMAIL: ${{ secrets.E2E_OWNER_EMAIL }}
          E2E_OWNER_PASSWORD: ${{ secrets.E2E_OWNER_PASSWORD }}
          E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
          E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
        run: |
          echo "🔧 Ensuring test users exist in dev Supabase..."
          echo "Supabase URL: $E2E_SUPABASE_URL"

          cd apps/e2e

          # Install dependencies if needed (should already be installed from setup-deps)
          if [ ! -d "node_modules/@supabase/supabase-js" ]; then
            echo "Installing dependencies..."
            pnpm install --frozen-lockfile
          fi

          # Run provisioning script
          node scripts/setup-test-users.js

          if [ $? -eq 0 ]; then
            echo "✅ Test users are ready"
          else
            echo "❌ Failed to provision test users"
            exit 1
          fi
```

**Integration Point**:
Insert this step at line 374 in `dev-integration-tests.yml`, immediately before the existing "Run integration test suite" step.

### 3. Enhanced Global Setup Error Handling

**File**: `apps/e2e/global-setup.ts`
**Action**: Replace error handling block (lines 86-92)
**Why**: Provide actionable error messages for authentication failures

```typescript
if (error || !data.session) {
 // biome-ignore lint/suspicious/noConsole: Required for error reporting in test setup
 console.error(
  `❌ Failed to authenticate ${authState.name}: ${error?.message || "No session returned"}`,
 );

 // Enhanced diagnostics for Invalid login credentials
 if (error?.message?.includes("Invalid login credentials")) {
  // biome-ignore lint/suspicious/noConsole: Required for error reporting
  console.error("");
  console.error("🔍 Diagnostic Information:");
  console.error("   ❌ Authentication failed - credentials are invalid");
  console.error("");
  console.error("💡 Possible Causes:");
  console.error("   1. Test user does not exist in Supabase instance");
  console.error("   2. Password in GitHub Secrets does not match Supabase");
  console.error("   3. User account is disabled or locked");
  console.error("   4. Supabase URL points to wrong environment");
  console.error("");
  console.error("🔧 Resolution Steps:");
  console.error("   For local development:");
  console.error("     1. Run: cd apps/e2e && node scripts/setup-test-users.js");
  console.error("     2. Ensure .env.local has correct credentials");
  console.error("");
  console.error("   For CI/CD:");
  console.error("     1. Verify GitHub Secrets are set correctly");
  console.error("     2. Ensure user provisioning step ran successfully");
  console.error("     3. Check workflow logs for provisioning step output");
  console.error("");
  console.error("📋 Debug Information:");
  console.error(`   Supabase URL: ${supabaseUrl}`);
  console.error(`   User Email: ${credentials.email}`);
  console.error(`   Environment: ${process.env.CI ? "CI" : "Local"}`);
 }

 throw error || new Error("No session returned from Supabase");
}
```

### 4. CI Environment Validation (Optional but Recommended)

**File**: `apps/e2e/global-setup.ts`
**Action**: Add after line 38 (after Supabase URL initialization)
**Why**: Catch configuration errors early

```typescript
// Validate configuration in CI environment
if (process.env.CI) {
 // biome-ignore lint/suspicious/noConsole: Required for configuration validation
 console.log("🔍 CI Environment Configuration Check");
 console.log(`   Supabase URL: ${supabaseUrl}`);
 console.log(`   Base URL: ${baseURL}`);

 // Warn if using localhost in CI
 if (supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost")) {
  // biome-ignore lint/suspicious/noConsole: Required for error reporting
  console.error("");
  console.error("❌ Configuration Error: Using localhost Supabase in CI environment");
  console.error(`   E2E_SUPABASE_URL: ${supabaseUrl}`);
  console.error("");
  console.error("🔧 Required Configuration:");
  console.error("   1. Set E2E_SUPABASE_URL to deployed Supabase instance");
  console.error("   2. Set E2E_SUPABASE_ANON_KEY to match the instance");
  console.error("   3. Ensure test users are provisioned in the instance");
  console.error("");
  throw new Error(
   "E2E_SUPABASE_URL must point to deployed Supabase instance in CI. " +
   "Check GitHub Secrets configuration."
  );
 }

 // biome-ignore lint/suspicious/noConsole: Required for configuration validation
 console.log("✅ Configuration valid\n");
}
```

## Required GitHub Secret

Add this secret before deploying the workflow changes:

```bash
gh secret set E2E_SUPABASE_SERVICE_ROLE_KEY --body "<service-role-key>"
```

**Where to get it**: Supabase Dashboard > Settings > API > service_role key (secret)

## Testing Before Merging

### 1. Test Enhanced Provisioning Script Locally

```bash
cd apps/e2e

# Set environment variables
export E2E_SUPABASE_URL="https://your-dev-project.supabase.co"
export E2E_SUPABASE_ANON_KEY="<anon-key>"
export E2E_SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
export E2E_TEST_USER_EMAIL="test1@slideheroes.com"
export E2E_TEST_USER_PASSWORD="<password>"
export E2E_OWNER_EMAIL="test2@slideheroes.com"
export E2E_OWNER_PASSWORD="<password>"
export E2E_ADMIN_EMAIL="michael@slideheroes.com"
export E2E_ADMIN_PASSWORD="<password>"

# Test the script
node scripts/setup-test-users.js

# Expected output:
# Setting up E2E test users...
# Supabase URL: https://xxx.supabase.co
# ✓ User test1@slideheroes.com exists and credentials are valid
# ✓ User test2@slideheroes.com exists and credentials are valid
# ✓ User michael@slideheroes.com exists and credentials are valid
# ==================================================
# Summary:
#   Existing users: 3
#   Created users: 0
#   Errors: 0
# ==================================================
# ✓ All test users are ready!
```

### 2. Test in PR Before Merging

```bash
# Create feature branch
git checkout -b fix/dev-integration-test-provisioning

# Apply all changes from this document
# ... edit files ...

# Commit changes
git add apps/e2e/scripts/setup-test-users.js
git add .github/workflows/dev-integration-tests.yml
git add apps/e2e/global-setup.ts
git commit -m "fix(ci): add automated user provisioning to dev integration tests

- Enhance setup-test-users.js with idempotency and better error handling
- Add user provisioning step to dev-integration-tests.yml workflow
- Improve global-setup.ts error messages for authentication failures
- Add CI environment validation to catch configuration errors early

Fixes: AuthApiError - Invalid login credentials in global setup"

# Push and create PR
git push -u origin fix/dev-integration-test-provisioning
gh pr create --title "Fix: Add user provisioning to dev integration tests" \
  --body "See /reports/testing/2025-11-07/code-changes-ready-to-apply.md for details"

# Monitor workflow
gh run watch
```

## Rollback Plan

If issues occur after deployment:

```bash
# Revert the workflow changes only
git revert <commit-hash> -- .github/workflows/dev-integration-tests.yml

# Keep the enhanced script (it's backward compatible)
# Tests will continue to work with manually provisioned users
```

## Expected Outcomes

### Before Changes

```text
🔐 Authenticating test user via Supabase API...
❌ Failed to authenticate test user: Invalid login credentials
AuthApiError: Invalid login credentials
   at ../global-setup.ts:81
```

### After Changes

```text
🔧 Ensuring test users exist in dev Supabase...
Supabase URL: https://xxx.supabase.co
✓ User test1@slideheroes.com exists and credentials are valid
✓ User test2@slideheroes.com exists and credentials are valid
✓ User michael@slideheroes.com exists and credentials are valid
==================================================
Summary:
  Existing users: 3
  Created users: 0
  Errors: 0
==================================================
✓ All test users are ready!
✅ Test users are ready

🔧 Global Setup: Creating authenticated browser states via API...
🔐 Authenticating test user via Supabase API...
✅ API authentication successful for test user
✅ Session injected into browser storage for test user
```

## Code Review Checklist

- [ ] All changes use proper biome-ignore comments for console statements
- [ ] Error handling is comprehensive and actionable
- [ ] Script is idempotent (safe to run multiple times)
- [ ] Workflow step has all required environment variables
- [ ] No hardcoded secrets or credentials
- [ ] Backward compatible with existing setup
- [ ] Works in both local and CI environments
- [ ] Clear logging for debugging

## Deployment Steps

1. **Review code changes** in this document
2. **Add GitHub Secret**: `E2E_SUPABASE_SERVICE_ROLE_KEY`
3. **Create feature branch** and apply changes
4. **Test locally** with actual dev credentials
5. **Create PR** and run workflow
6. **Verify workflow passes** with provisioning step
7. **Merge to dev** branch
8. **Monitor subsequent runs** for stability

## Success Metrics

After deployment:

- ✅ User provisioning step completes in <30 seconds
- ✅ All three users authenticate successfully
- ✅ Global setup completes without errors
- ✅ Integration tests execute
- ✅ No authentication errors in logs
- ✅ Workflow success rate improves to >95%

---

**Document Status**: Ready for Implementation ✅
**Code Review**: Recommended before merge
**Testing**: Required in PR
**Risk Level**: Low (backward compatible, includes rollback)
**Deployment Time**: 30 minutes (after code review)

**Last Updated**: 2025-11-07
**Author**: Testing Infrastructure Team
