# Implementation Guide: User Provisioning for Dev Integration Tests

**Objective**: Fix "Invalid login credentials" error by ensuring test users exist in dev Supabase
**Estimated Time**: 30-45 minutes (immediate fix) + 2 hours (automation)
**Priority**: HIGH - Blocking all integration tests

## Quick Start (Immediate Fix)

### Step 1: Provision Users Locally (15 minutes)

```bash
# 1. Navigate to e2e directory
cd /home/msmith/projects/2025slideheroes/apps/e2e

# 2. Get Supabase credentials from dev environment
# You'll need:
# - E2E_SUPABASE_URL (from Supabase dashboard)
# - E2E_SUPABASE_SERVICE_ROLE_KEY (from Supabase Settings > API)

# 3. Set environment variables
export E2E_SUPABASE_URL="https://<your-dev-project>.supabase.co"
export E2E_SUPABASE_SERVICE_ROLE_KEY="<service-role-key-from-supabase>"

# 4. Set user credentials (choose strong passwords)
export E2E_TEST_USER_EMAIL="test1@slideheroes.com"
export E2E_TEST_USER_PASSWORD="<choose-strong-password-1>"
export E2E_OWNER_EMAIL="test2@slideheroes.com"
export E2E_OWNER_PASSWORD="<choose-strong-password-2>"
export E2E_ADMIN_EMAIL="michael@slideheroes.com"
export E2E_ADMIN_PASSWORD="<choose-strong-password-3>"

# 5. Run provisioning script
node scripts/setup-test-users.js

# Expected output:
# Setting up E2E test users...
# ✓ Created user: test1@slideheroes.com
# ✓ Created user: test2@slideheroes.com
# ✓ Created user: michael@slideheroes.com
# ✓ All test users set up successfully!
```

### Step 2: Update GitHub Secrets (5 minutes)

```bash
# Update the passwords you used in Step 1
gh secret set E2E_TEST_USER_PASSWORD --body "<password-from-step-1>"
gh secret set E2E_OWNER_PASSWORD --body "<password-from-step-1>"
gh secret set E2E_ADMIN_PASSWORD --body "<password-from-step-1>"

# Verify secrets are set
gh secret list | grep E2E
```

Expected output:
```
E2E_ADMIN_EMAIL          Updated 2025-XX-XX
E2E_ADMIN_PASSWORD       Updated 2025-11-07
E2E_OWNER_EMAIL          Updated 2025-XX-XX
E2E_OWNER_PASSWORD       Updated 2025-11-07
E2E_SUPABASE_ANON_KEY    Updated 2025-XX-XX
E2E_SUPABASE_URL         Updated 2025-XX-XX
E2E_TEST_USER_EMAIL      Updated 2025-XX-XX
E2E_TEST_USER_PASSWORD   Updated 2025-11-07
```

### Step 3: Verify Authentication (10 minutes)

```bash
# Test authentication with actual credentials
cd /home/msmith/projects/2025slideheroes/apps/e2e

# Create a test script
cat > test-auth.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.E2E_SUPABASE_URL;
const supabaseAnonKey = process.env.E2E_SUPABASE_ANON_KEY;
const email = process.env.E2E_TEST_USER_EMAIL;
const password = process.env.E2E_TEST_USER_PASSWORD;

console.log('Testing authentication...');
console.log('Supabase URL:', supabaseUrl);
console.log('Email:', email);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

supabase.auth.signInWithPassword({ email, password })
  .then(result => {
    if (result.error) {
      console.error('❌ Authentication failed:', result.error.message);
      process.exit(1);
    }
    console.log('✅ Authentication successful!');
    console.log('User ID:', result.data.user.id);
    console.log('Email:', result.data.user.email);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
EOF

# Set environment variables (from GitHub Secrets)
export E2E_SUPABASE_URL="<from-github-secrets>"
export E2E_SUPABASE_ANON_KEY="<from-github-secrets>"
export E2E_TEST_USER_EMAIL="test1@slideheroes.com"
export E2E_TEST_USER_PASSWORD="<password-you-set>"

# Run test
node test-auth.js

# Expected output:
# Testing authentication...
# Supabase URL: https://xxx.supabase.co
# Email: test1@slideheroes.com
# ✅ Authentication successful!
# User ID: xxx-xxx-xxx
# Email: test1@slideheroes.com

# Clean up test script
rm test-auth.js
```

### Step 4: Trigger Workflow (5 minutes)

```bash
# Manually trigger the dev integration tests workflow
gh workflow run dev-integration-tests.yml

# Monitor the run
gh run watch

# Or view in browser
gh run list --workflow=dev-integration-tests.yml --limit 1
```

**Success Indicators**:
- ✅ Global setup completes without errors
- ✅ "🔐 Authenticating test user via Supabase API..."
- ✅ "✅ API authentication successful for test user"
- ✅ All three users authenticate successfully
- ✅ Integration tests execute

## Automated Provisioning (Follow-up Implementation)

### Step 1: Enhance setup-test-users.js for Idempotency

**File**: `apps/e2e/scripts/setup-test-users.js`

Replace the entire file with:

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

### Step 2: Add Workflow Provisioning Step

**File**: `.github/workflows/dev-integration-tests.yml`

Add this step **before** the "Run integration test suite" step (around line 374):

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

          # Install dependencies if needed
          if [ ! -d "node_modules/@supabase/supabase-js" ]; then
            echo "Installing dependencies..."
            pnpm install
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

### Step 3: Add Service Role Key Secret

```bash
# Get service role key from Supabase dashboard
# Settings > API > service_role key

gh secret set E2E_SUPABASE_SERVICE_ROLE_KEY --body "<service-role-key>"

# Verify it was set
gh secret list | grep SERVICE_ROLE
```

### Step 4: Enhanced Error Handling in Global Setup

**File**: `apps/e2e/global-setup.ts`

Replace lines 86-92 with:

```typescript
if (error || !data.session) {
	// biome-ignore lint/suspicious/noConsole: Required for error reporting in test setup
	console.error(
		`❌ Failed to authenticate ${authState.name}: ${error?.message || "No session returned"}`,
	);

	// Enhanced diagnostics
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
		console.error("     2. Run user provisioning script in workflow");
		console.error("     3. Check workflow logs for provisioning step");
		console.error("");
		console.error("📋 Debug Information:");
		console.error(`   Supabase URL: ${supabaseUrl}`);
		console.error(`   User Email: ${credentials.email}`);
		console.error(`   Environment: ${process.env.CI ? "CI" : "Local"}`);
	}

	throw error || new Error("No session returned from Supabase");
}
```

### Step 5: Add CI Environment Validation

**File**: `apps/e2e/global-setup.ts`

Add this after line 38 (after initializing Supabase URL):

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

## Testing the Implementation

### Local Testing

```bash
cd /home/msmith/projects/2025slideheroes/apps/e2e

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

# Test provisioning script
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

# Test global setup
pnpm test:integration --grep "no tests" || echo "Global setup completed successfully"
```

### CI Testing

```bash
# Push changes to branch
git checkout -b fix/dev-integration-test-provisioning
git add .
git commit -m "fix(ci): add user provisioning to dev integration tests"
git push -u origin fix/dev-integration-test-provisioning

# Create PR
gh pr create --title "Fix dev integration tests user provisioning" \
  --body "Adds automated user provisioning to fix 'Invalid login credentials' error"

# Monitor workflow
gh run watch
```

## Rollback Plan

If the automated provisioning causes issues:

```bash
# Revert workflow changes
git revert <commit-hash>

# Fall back to manual provisioning
cd apps/e2e
node scripts/setup-test-users.js

# Update GitHub Secrets if needed
gh secret set E2E_TEST_USER_PASSWORD --body "<password>"
```

## Success Metrics

After implementation, verify:

1. **Provisioning Script**:
   - ✅ Runs without errors
   - ✅ Handles existing users gracefully
   - ✅ Creates missing users successfully
   - ✅ Provides clear summary output

2. **Workflow Execution**:
   - ✅ Provisioning step completes in <30 seconds
   - ✅ Global setup authenticates all users
   - ✅ Integration tests execute successfully
   - ✅ No authentication errors in logs

3. **Error Handling**:
   - ✅ Clear error messages for common issues
   - ✅ Actionable resolution steps provided
   - ✅ Configuration validation in CI

## Maintenance

### Regular Tasks

1. **Quarterly**: Rotate service role key
2. **As needed**: Update test user passwords
3. **After Supabase changes**: Verify provisioning still works

### Monitoring

Add to runbook:
- Monitor workflow success rate
- Check for provisioning failures
- Verify user provisioning step duration

---

**Document Version**: 1.0
**Last Updated**: 2025-11-07
**Status**: Ready for Implementation
