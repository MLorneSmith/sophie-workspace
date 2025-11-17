# Dev Integration Test Infrastructure Fix

**Date**: 2025-11-07
**Workflow**: dev-integration-tests.yml
**Issue**: AuthApiError - Invalid login credentials
**Status**: Root cause identified, fix ready for implementation

## Executive Summary

Integration tests are failing with "Invalid login credentials" error during global setup authentication. The root cause is that **test users do not exist in the dev Supabase instance**. While the workflow correctly configures E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY (pointing to the deployed dev Supabase), there is no user provisioning step to create the required test accounts before authentication.

## Error Analysis

### Failure Point
```
Location: apps/e2e/global-setup.ts:81
Error: AuthApiError: Invalid login credentials
Operation: supabase.auth.signInWithPassword()
```

### Authentication Flow
1. **Global setup** creates Supabase client with dev environment credentials
2. Attempts to sign in test users via API: `signInWithPassword(email, password)`
3. **FAILS** because users don't exist in dev Supabase database
4. All tests blocked - cannot proceed without authenticated browser states

### Expected Test Users
```javascript
// From apps/e2e/scripts/setup-test-users.js
const TEST_USERS = [
  {
    email: E2E_TEST_USER_EMAIL,     // test1@slideheroes.com
    password: E2E_TEST_USER_PASSWORD,
    user_metadata: { name: "Test User One", onboarded: true }
  },
  {
    email: E2E_OWNER_EMAIL,          // test2@slideheroes.com
    password: E2E_OWNER_PASSWORD,
    user_metadata: { name: "Test User Two", onboarded: true }
  },
  {
    email: E2E_ADMIN_EMAIL,          // michael@slideheroes.com
    password: E2E_ADMIN_PASSWORD,
    user_metadata: { name: "Michael Smith", onboarded: true },
    app_metadata: { role: "super-admin" }
  }
];
```

## Root Cause

### Missing User Provisioning Step

The workflow configuration is correct:
- ✅ E2E_SUPABASE_URL points to dev Supabase
- ✅ E2E_SUPABASE_ANON_KEY is configured
- ✅ User credentials are set (E2E_TEST_USER_EMAIL, etc.)
- ❌ **No step to create users before authentication**

### Why This Works Locally

Local development works because:
1. Supabase runs with seed data
2. Test users are created during local Supabase setup
3. Users persist across test runs

### Why This Fails in CI

Deployed dev environment:
1. Supabase instance is clean/production-like
2. No seed data or test users pre-loaded
3. Each test run expects users to already exist
4. **Users must be provisioned before authentication**

## Solution: User Provisioning Step

### Option A: Pre-deployment User Creation (RECOMMENDED)

**When**: Once during dev environment setup
**How**: Manual or automated script
**Pros**:
- One-time setup
- Users persist across test runs
- No service role key exposure in CI
- Faster test execution

**Implementation**:
```bash
# Run once to set up dev environment test users
cd apps/e2e
node scripts/setup-test-users.js
```

**Environment Variables Required** (one-time setup):
```bash
E2E_SUPABASE_URL="https://your-dev-project.supabase.co"
E2E_SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
E2E_TEST_USER_EMAIL="test1@slideheroes.com"
E2E_TEST_USER_PASSWORD="<secure-password>"
E2E_OWNER_EMAIL="test2@slideheroes.com"
E2E_OWNER_PASSWORD="<secure-password>"
E2E_ADMIN_EMAIL="michael@slideheroes.com"
E2E_ADMIN_PASSWORD="<secure-password>"
```

**Verification**:
```bash
# Test authentication works
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.E2E_SUPABASE_URL,
  process.env.E2E_SUPABASE_ANON_KEY
);
supabase.auth.signInWithPassword({
  email: process.env.E2E_TEST_USER_EMAIL,
  password: process.env.E2E_TEST_USER_PASSWORD
}).then(r => console.log('Success:', r.data?.user?.email || r.error));
"
```

### Option B: CI User Provisioning Step

**When**: Before each test run
**How**: Add step to workflow
**Pros**:
- Guaranteed clean state
- Self-contained workflow
- No manual setup required

**Cons**:
- Requires service role key in GitHub Secrets (security risk)
- Slower (provisions users every run)
- More complex workflow

**Implementation** (add to workflow before "Run integration test suite"):

```yaml
- name: Provision test users
  env:
    E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
    E2E_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}
    E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
    E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
    E2E_OWNER_EMAIL: ${{ secrets.E2E_OWNER_EMAIL }}
    E2E_OWNER_PASSWORD: ${{ secrets.E2E_OWNER_PASSWORD }}
    E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
    E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
  run: |
    echo "🔧 Provisioning test users in dev Supabase..."
    cd apps/e2e
    node scripts/setup-test-users.js
    echo "✅ Test users provisioned successfully"
```

**Required GitHub Secret**:
```bash
gh secret set E2E_SUPABASE_SERVICE_ROLE_KEY --body "<service-role-key>"
```

### Option C: Hybrid Approach (BEST PRACTICE)

**Combine both approaches**:

1. **Pre-provision users** in dev environment (one-time)
2. **Add idempotent provisioning step** to workflow (handles edge cases)
3. Script checks if users exist before creating (no duplicates)

**Enhanced setup-test-users.js**:
```javascript
async function createUser(user) {
  // Try to sign in first to check if user exists
  const testClient = createClient(SUPABASE_URL, ANON_KEY);
  const { error: signInError } = await testClient.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (!signInError) {
    console.log(`✓ User ${user.email} already exists and credentials are valid`);
    return;
  }

  // User doesn't exist or password is wrong - create/update via admin API
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
    if (response.status === 409 || error.includes("already been registered")) {
      console.log(`⚠️ User ${user.email} exists but password may be incorrect`);
      console.log(`ℹ️ Consider updating password via admin API if needed`);
      return;
    }
    throw new Error(`Failed to create user ${user.email}: ${error}`);
  }

  console.log(`✓ Created user: ${user.email}`);
}
```

## Implementation Plan

### Phase 1: Immediate Fix (Manual Provisioning)

**Action**: Manually provision users in dev Supabase

1. **Connect to dev Supabase**:
   - Log in to Supabase dashboard
   - Navigate to dev project

2. **Run provisioning script locally**:
   ```bash
   cd apps/e2e

   # Set environment variables
   export E2E_SUPABASE_URL="https://your-dev-project.supabase.co"
   export E2E_SUPABASE_SERVICE_ROLE_KEY="<from-supabase-settings>"
   export E2E_TEST_USER_EMAIL="test1@slideheroes.com"
   export E2E_TEST_USER_PASSWORD="<choose-secure-password>"
   export E2E_OWNER_EMAIL="test2@slideheroes.com"
   export E2E_OWNER_PASSWORD="<choose-secure-password>"
   export E2E_ADMIN_EMAIL="michael@slideheroes.com"
   export E2E_ADMIN_PASSWORD="<choose-secure-password>"

   # Create users
   node scripts/setup-test-users.js
   ```

3. **Update GitHub Secrets** with actual passwords used:
   ```bash
   gh secret set E2E_TEST_USER_PASSWORD --body "<password-used>"
   gh secret set E2E_OWNER_PASSWORD --body "<password-used>"
   gh secret set E2E_ADMIN_PASSWORD --body "<password-used>"
   ```

4. **Verify authentication works**:
   ```bash
   # Test with actual credentials
   export E2E_SUPABASE_URL="https://your-dev-project.supabase.co"
   export E2E_SUPABASE_ANON_KEY="<from-supabase-settings>"
   export E2E_TEST_USER_EMAIL="test1@slideheroes.com"
   export E2E_TEST_USER_PASSWORD="<password-from-secrets>"

   node -e "
   const { createClient } = require('@supabase/supabase-js');
   const supabase = createClient(
     process.env.E2E_SUPABASE_URL,
     process.env.E2E_SUPABASE_ANON_KEY
   );
   supabase.auth.signInWithPassword({
     email: process.env.E2E_TEST_USER_EMAIL,
     password: process.env.E2E_TEST_USER_PASSWORD
   }).then(r => console.log('Auth result:', r.data?.user?.email || r.error));
   "
   ```

5. **Trigger workflow** and verify tests pass

**Timeline**: 15-30 minutes
**Risk**: Low
**Requires**: Access to Supabase dashboard and GitHub secrets

### Phase 2: Automated Provisioning (Follow-up PR)

**Action**: Add user provisioning to workflow

1. **Add service role key secret**:
   ```bash
   gh secret set E2E_SUPABASE_SERVICE_ROLE_KEY --body "<service-role-key>"
   ```

2. **Update workflow** (add before integration-tests step):
   ```yaml
   - name: Provision test users
     env:
       E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
       E2E_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}
       E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
       E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
       E2E_OWNER_EMAIL: ${{ secrets.E2E_OWNER_EMAIL }}
       E2E_OWNER_PASSWORD: ${{ secrets.E2E_OWNER_PASSWORD }}
       E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
       E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
     run: |
       echo "🔧 Ensuring test users exist in dev Supabase..."
       cd apps/e2e
       node scripts/setup-test-users.js || {
         echo "⚠️ User provisioning failed - users may already exist"
         echo "ℹ️ Continuing with tests..."
       }
   ```

3. **Make script idempotent** (update setup-test-users.js as shown in Option C)

4. **Test in PR** before merging

**Timeline**: 1-2 hours
**Risk**: Medium (requires service role key handling)
**Requires**: Enhanced error handling and idempotency

### Phase 3: Enhanced Error Handling (Optional)

**Action**: Improve global-setup.ts error messages

```typescript
// Add after line 85 in global-setup.ts
if (error || !data.session) {
  console.error(`❌ Failed to authenticate ${authState.name}`);
  console.error(`   Error: ${error?.message || "No session returned"}`);
  console.error(`   Supabase URL: ${supabaseUrl}`);
  console.error(`   Email: ${credentials.email}`);
  console.error("");

  // Enhanced diagnostics
  if (error?.message?.includes("Invalid login credentials")) {
    console.error("🔍 Diagnostic Information:");
    console.error("   ❌ Authentication failed - credentials are invalid");
    console.error("");
    console.error("💡 Possible Causes:");
    console.error("   1. Test user does not exist in Supabase instance");
    console.error("   2. Password in GitHub Secrets does not match Supabase");
    console.error("   3. User account is disabled or locked");
    console.error("");
    console.error("🔧 Resolution Steps:");
    console.error("   1. Verify test users exist in dev Supabase dashboard");
    console.error("   2. Run: cd apps/e2e && node scripts/setup-test-users.js");
    console.error("   3. Ensure GitHub Secrets match provisioned passwords");
    console.error("   4. Check E2E_SUPABASE_URL points to correct environment");
  }

  throw error || new Error("No session returned from Supabase");
}
```

## Validation Checklist

### Pre-Test Validation
- [ ] Dev Supabase instance is accessible
- [ ] Service role key is available (for provisioning)
- [ ] Test user credentials are decided and documented
- [ ] GitHub Secrets are updated with correct credentials

### Post-Provisioning Validation
- [ ] All three users created successfully in Supabase
- [ ] Users can authenticate via Supabase dashboard
- [ ] Email verification is bypassed (email_confirm: true)
- [ ] User metadata and app_metadata are set correctly
- [ ] Admin user has super-admin role in app_metadata

### Workflow Validation
- [ ] E2E_SUPABASE_URL points to dev Supabase
- [ ] E2E_SUPABASE_ANON_KEY is correct
- [ ] User email/password secrets match provisioned users
- [ ] Global setup completes without errors
- [ ] Authenticated browser states are created (.auth/*.json)
- [ ] Tests can proceed to actual validation

## Security Considerations

### Service Role Key Usage

**Risk**: Service role key has admin privileges
**Mitigation**:
1. Use separate "e2e-admin" service role if possible (scoped permissions)
2. Store as GitHub Secret (encrypted at rest)
3. Only use in user provisioning step (not in tests)
4. Rotate periodically (quarterly)
5. Monitor usage via Supabase logs

### Test User Credentials

**Best Practices**:
1. Use strong, unique passwords
2. Store in GitHub Secrets (not in code)
3. Limit to dev/staging environments only
4. Never use in production
5. Rotate if compromised

### Environment Isolation

**Ensure**:
1. Dev Supabase is separate from production
2. RLS policies protect real user data
3. Test users cannot access production resources
4. API keys are environment-specific

## Alternative Approaches (Considered but Not Recommended)

### 1. Email/Password Reset Flow
**Why not**: Requires email infrastructure in CI, adds complexity

### 2. OAuth/Social Login
**Why not**: Not suitable for headless CI environments

### 3. Magic Link Authentication
**Why not**: Requires email polling, unreliable in CI

### 4. Anonymous Authentication
**Why not**: Tests require authenticated user context with specific roles

### 5. Mock Supabase Client
**Why not**: Integration tests must use real authentication flow

## Comparison with Local Test Environment

| Aspect | Local Development | CI (Dev Integration) |
|--------|-------------------|---------------------|
| **Supabase** | Local (127.0.0.1:54321) | Deployed (dev.supabase.co) |
| **Test Users** | Created by seed data | Must be provisioned |
| **User Persistence** | Persists across runs | Persists (once created) |
| **Setup** | Automatic (supabase reset) | Manual/automated script |
| **Service Role Key** | Local default key | Production dev key |

## Success Criteria

### Immediate (Phase 1)
- ✅ Test users exist in dev Supabase
- ✅ Global setup authenticates successfully
- ✅ All three user browser states created
- ✅ Integration tests execute without auth errors
- ✅ Workflow completes successfully

### Long-term (Phase 2+)
- ✅ User provisioning is automated
- ✅ Workflow is self-contained and reliable
- ✅ Error messages are actionable
- ✅ Security best practices followed
- ✅ Documentation is comprehensive

## Related Issues

### Similar Patterns in Other Workflows

Check these workflows for same issue:
```bash
grep -r "E2E_TEST_USER_EMAIL" .github/workflows/*.yml | grep -v "E2E_SUPABASE_URL"
```

**Workflows to audit**:
- pr-validation.yml (likely OK - uses local Supabase)
- staging-integration-tests.yml (if exists)
- production-smoke-tests.yml (if exists)

### Common Pitfalls

1. **Forgetting email_confirm**: Users can't login until verified
2. **Mismatched passwords**: Secrets don't match Supabase
3. **Wrong Supabase URL**: Pointing to local instead of dev
4. **Missing service role key**: Can't provision users
5. **User already exists**: 409 conflict if running setup twice

## Documentation Updates Needed

### 1. Add User Provisioning Guide
**File**: apps/e2e/README.md
**Section**: "Setting Up Dev Environment"

### 2. Update CI/CD Documentation
**File**: docs/ci-cd.md or CONTRIBUTING.md
**Section**: "Integration Test Requirements"

### 3. Update Environment Variables Reference
**File**: apps/e2e/.env.example
**Add**:
```bash
# IMPORTANT: For deployed environments (dev/staging/production)
# Test users MUST be provisioned before running tests
# Run: cd apps/e2e && node scripts/setup-test-users.js
```

### 4. Add Troubleshooting Section
**File**: apps/e2e/README.md
**Add**: "Invalid login credentials" error resolution

## Next Steps

### Immediate Actions (Owner: DevOps/Test Engineer)
1. [ ] Provision test users in dev Supabase (15 min)
2. [ ] Update GitHub Secrets with passwords (5 min)
3. [ ] Test authentication manually (10 min)
4. [ ] Trigger workflow and verify success (5 min)

### Follow-up Actions (Owner: DevOps/Test Engineer)
5. [ ] Add automated provisioning to workflow (1 hour)
6. [ ] Make setup script idempotent (30 min)
7. [ ] Enhance error messages in global-setup.ts (30 min)
8. [ ] Update documentation (30 min)
9. [ ] Audit other workflows (30 min)

### Total Estimated Time
- **Phase 1 (Unblock tests)**: 30-45 minutes
- **Phase 2 (Automation)**: 2-3 hours
- **Phase 3 (Polish)**: 1-2 hours

## Conclusion

The root cause is clear: **test users don't exist in dev Supabase**. The fix is straightforward: **provision users before authentication**.

**Recommended Path**:
1. **Quick win**: Manually provision users (30 min) ✅
2. **Reliability**: Add automated provisioning (2 hours) ✅
3. **Quality**: Enhance error handling and docs (2 hours) ✅

This follows a pragmatic approach: unblock tests immediately, then improve the infrastructure incrementally.

---

**Report Generated**: 2025-11-07
**Author**: Testing Infrastructure Analysis
**Status**: Ready for Implementation
