# Bug Fix: E2E Local Test Regression After Vercel Preview Cookie Fixes

**Related Diagnosis**: #1107 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Cookie configuration changes (commits `9cdafcdc8` and `83f5dd813`) added `url` property to cookies for Vercel preview deployments, causing authentication session recognition failures in Docker-based E2E test environment
- **Fix Approach**: Make cookie URL configuration environment-aware (Vercel preview vs local Docker) to prevent domain mismatch
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The recent commits that fixed auth session issues in Vercel preview deployments introduced a regression in local Docker-based E2E tests. 12 test failures across 5 shards are caused by authenticated users being redirected to `/` (homepage) after navigation, indicating the middleware isn't recognizing authenticated sessions in Docker containers.

The issue is that the cookie `url` property now includes domain information suitable for Vercel preview deployments, but this configuration breaks local Docker testing where Supabase is accessed via `host.docker.internal:54521` but the test servers are on `localhost:3001`.

For full details, see diagnosis issue #1107.

### Solution Approaches Considered

#### Option 1: Environment-Aware Cookie Configuration ⭐ RECOMMENDED

**Description**: Conditionally set the cookie `url` property based on environment (Vercel preview, Vercel production, local development). In local/Docker environments, omit or adjust the `url` property to maintain compatibility with the existing test setup that relies on automatic cookie naming via hostname.

**Pros**:
- Maintains current Vercel preview fix without regression
- Minimal code changes required
- Works with existing test infrastructure
- No dependency changes
- Preserves security posture for both environments

**Cons**:
- Slightly more complex cookie initialization logic
- Must maintain separate paths for different environments
- Requires testing across all three environments (local, Vercel preview, Vercel production)

**Risk Assessment**: low - Cookie configuration is straightforward and well-tested logic

**Complexity**: simple - Only conditional logic in Supabase client initialization

#### Option 2: Revert Problematic Commits

**Description**: Roll back commits `9cdafcdc8` and `83f5dd813` completely, then redesign the Vercel preview cookie fix with environment awareness from the start.

**Pros**:
- Immediately fixes local test regression
- Simple rollback process
- No new code required

**Cons**:
- Reintroduces Vercel preview auth issues (defeats original fix purpose)
- Requires redesigning both fixes anyway
- More complex commit history
- Risk of losing context on original Vercel issue

**Why Not Chosen**: This approach fixes the local regression but reintroduces the Vercel preview problem. We need a solution that works in both environments, not just one.

#### Option 3: Docker-Only Cookie Override

**Description**: Use a Docker-specific environment variable that disables the `url` property when running test containers, overriding the default behavior only for test environment.

**Pros**:
- Doesn't affect local development or Vercel deployments
- Clear separation of concerns
- Easy to toggle for debugging

**Cons**:
- Adds another environment variable to manage
- Test container docker-compose would need update
- Less elegant than conditional environment detection

**Why Not Chosen**: Option 1 is cleaner because it auto-detects the environment rather than requiring manual configuration per container.

### Selected Solution: Environment-Aware Cookie Configuration

**Justification**: This approach elegantly solves both the Vercel preview auth issue AND the local Docker test regression. By making cookie configuration responsive to the environment, we support all three contexts (local development, Vercel preview, Vercel production) without regression. It leverages existing environment variables (`VERCEL`, `VERCEL_ENV`) already present in the codebase, making it maintainable and non-invasive.

**Technical Approach**:
1. Identify where cookie `url` property is set (likely in Supabase client initialization)
2. Add conditional logic that checks `process.env.VERCEL_ENV` or similar
3. For Vercel preview/production: Keep the `url` property (fixes original issue)
4. For local/Docker: Omit the `url` property (uses existing Docker cookie naming logic)
5. Ensure Supabase client initialization respects this across all environments

**Architecture Changes** (if any):
- No architectural changes - purely configuration-level adjustments
- Existing cookie infrastructure remains unchanged
- Only affects Supabase client initialization code

**Migration Strategy** (if needed):
- No data migration needed
- No database schema changes required
- Browser-side authentication cookies will be handled automatically by Supabase SDK

## Implementation Plan

### Affected Files

Identify the exact location of cookie configuration changes:
- `apps/web/app/*` or `apps/web/lib/*` - Likely where Supabase client is created and cookies configured
- `apps/web/middleware.ts` - May contain cookie handling logic
- `apps/e2e/global-setup.ts` - E2E test authentication setup (verify it's not causing issues)
- Docker test configuration files that may need environment variable updates

### New Files

- None required - only modifications to existing configuration files

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Locate and Analyze Cookie Configuration

<describe what this step accomplishes>

- Search for where `url` property is set on cookies in Supabase client initialization
- Check commits `9cdafcdc8` and `83f5dd813` to understand exact changes made
- Identify the Supabase client creation code and cookie configuration approach
- Document the current cookie setup structure and how it interacts with different environments

**Why this step first**: We need to understand the exact structure before modifying it, ensuring we don't break existing functionality

#### Step 2: Implement Environment-Aware Cookie Configuration

<describe what this step accomplishes>

- Modify Supabase client initialization to check environment variables
- For `VERCEL_ENV === 'preview'` or `VERCEL_ENV === 'production'`: Include the `url` property
- For local/Docker environments (default): Omit the `url` property
- Ensure the conditional logic is clear and maintainable with comments

**Key implementation pattern**:
```typescript
const cookies = process.env.VERCEL_ENV
  ? {
      // Vercel preview/production - need explicit URL for auth
      domain: 'appropriate-domain',
      url: 'supabase-url-with-domain'
    }
  : {
      // Local development/Docker - let Supabase auto-detect via hostname
      domain: 'localhost', // or appropriate local domain
      // url: omitted for local to use auto-detection
    }
```

#### Step 3: Test Cookie Configuration in All Environments

- Run E2E tests locally (should now pass after fix)
- Verify manual auth flow works in local dev (port 3000)
- Verify manual auth flow works in Docker test environment (port 3001)
- Verify Vercel preview deployments still work correctly with the `url` property

#### Step 4: Add Unit Tests for Environment Detection

- Create test cases that verify cookie configuration varies by environment
- Test that `VERCEL_ENV` detection works correctly
- Ensure fallback behavior is tested (when env var is undefined)

#### Step 5: Update E2E Global Setup (if needed)

- Review `apps/e2e/global-setup.ts` to ensure it's compatible with new cookie setup
- Verify cookie naming logic in global setup aligns with cookie configuration
- No changes likely needed, but confirm the dual-URL strategy still works

#### Step 6: Run Full E2E Test Suite

- Execute all E2E test shards to confirm regression is fixed:
  - Personal Accounts (shard 1)
  - Admin & Invitations (shard 4)
  - User Billing (shard 9)
  - Team Billing (shard 10)
  - Team Accounts (shard 12)
- Verify all 12 previously failing tests now pass
- Confirm no new failures in other shards

#### Step 7: Manual Regression Testing

- Test sign-in/sign-out flow locally (port 3000)
- Test sign-in/sign-out flow in Docker test environment (port 3001)
- Verify Vercel preview deployment auth works (if preview URL available)
- Test MFA/AAL2 flow if applicable

#### Step 8: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions in test suite
- Confirm code quality checks pass
- Review changes for maintainability and documentation

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Cookie configuration correctly identifies Vercel environment (`VERCEL_ENV === 'preview'`)
- ✅ Cookie configuration defaults to local mode when `VERCEL_ENV` is undefined
- ✅ `url` property is included for Vercel, excluded for local
- ✅ Cookie domain is appropriately set for each environment
- ✅ Supabase client initializes without errors in all environments

**Test files**:
- `apps/web/lib/__tests__/supabase-client-config.spec.ts` - New test for cookie configuration logic

### Integration Tests

- Verify Supabase client can authenticate users in local environment
- Verify Supabase client can authenticate users in Docker test environment
- Verify token refresh works in all environments

**Test files**:
- `apps/web/__tests__/integration/auth.integration.spec.ts` - Update to cover all environments

### E2E Tests

- ✅ All 12 previously failing tests should now pass (Personal Accounts, Admin & Invitations, User Billing, Team Billing, Team Accounts)
- ✅ No new failures in other test shards
- ✅ Authentication journey works end-to-end in Docker containers

**Test files**:
- `apps/e2e/tests/authentication/` - Verify all auth tests pass
- `apps/e2e/tests/account/` - Verify account tests pass
- `apps/e2e/tests/admin/` - Verify admin tests pass
- `apps/e2e/tests/team-billing/` - Verify team billing tests pass

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start Supabase locally: `cd apps/web && npx supabase start`
- [ ] Run dev server locally: `pnpm dev` (port 3000)
- [ ] Sign in and sign out successfully on localhost:3000
- [ ] Verify session persists across page refreshes
- [ ] Start Docker test containers: `docker-compose -f docker-compose.test.yml up -d`
- [ ] Verify test containers are healthy: `curl http://localhost:3001/api/health`
- [ ] Run E2E test shard 1: `pnpm test:shard1` (Personal Accounts - should pass)
- [ ] Run E2E test shard 4: `pnpm test:shard4` (Admin & Invitations - should pass)
- [ ] Run E2E test shard 9: `pnpm test:shard9` (User Billing - should pass)
- [ ] Run E2E test shard 10: `pnpm test:shard10` (Team Billing - should pass)
- [ ] Run E2E test shard 12: `pnpm test:shard12` (Team Accounts - should pass)
- [ ] Verify no console errors in test output
- [ ] Verify no new auth redirects to `/` homepage

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Environment Variable Detection Failure**: If `VERCEL_ENV` is not properly set in some deployment scenario
   - **Likelihood**: low
   - **Impact**: medium (would revert to local-only mode, breaking Vercel preview)
   - **Mitigation**: Thorough testing in all three environments (local, preview, production); fallback to safer default

2. **Cookie Domain Mismatch in Vercel Preview**: If the `url` property domain doesn't match actual deployment domain
   - **Likelihood**: low
   - **Impact**: high (would break Vercel preview auth again)
   - **Mitigation**: Verify domain configuration before deployment; test preview deployments thoroughly

3. **Docker Container Network Issues**: If `host.docker.internal` DNS resolution changes
   - **Likelihood**: very low
   - **Impact**: medium (E2E tests would fail)
   - **Mitigation**: This is orthogonal to our fix; existing Docker architecture handles this

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the cookie configuration changes: `git revert <commit-hash>`
2. Redeploy to Vercel: `vercel deploy --prod`
3. Verify Vercel production auth still works
4. Investigate specific failure case and try Option 2 (revert original commits entirely)
5. File follow-up issue for more comprehensive solution

**Monitoring** (if needed):
- Monitor E2E test pass rates after deployment (should be 100% for previously failing shards)
- Check production auth logs for any cookie-related errors
- Monitor Vercel preview deployment auth success rates

## Performance Impact

**Expected Impact**: none

No performance changes expected. Cookie configuration is evaluated at client initialization time (once per session), not on every request. The conditional logic adds negligible overhead.

## Security Considerations

**Security Impact**: none

- Same cookie security posture as before (httpOnly, secure flag, sameSite)
- No new security vulnerabilities introduced
- Cookie domain restrictions remain appropriate for each environment
- Supabase handles all credential encryption/validation

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start services
cd apps/web && npx supabase start
cd ../..
docker-compose -f docker-compose.test.yml up -d

# Run the failing tests (should fail with "navigated to /" errors)
pnpm test:shard1
pnpm test:shard4
pnpm test:shard9
pnpm test:shard10
pnpm test:shard12
```

**Expected Result**: 12 test failures with auth redirect errors showing users navigated to `/` homepage

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit --filter web

# E2E tests (the previously failing shards)
pnpm test:shard1    # Personal Accounts
pnpm test:shard4    # Admin & Invitations
pnpm test:shard9    # User Billing
pnpm test:shard10   # Team Billing
pnpm test:shard12   # Team Accounts

# Build
pnpm build

# Manual verification
# 1. Start dev server: pnpm dev
# 2. Navigate to http://localhost:3000
# 3. Sign in and verify session persists
# 4. Verify no auth redirects
```

**Expected Result**: All commands succeed, all previously failing tests now pass, zero regressions, authentication works in local dev environment.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run all E2E shards to verify comprehensive pass
pnpm test:shard1
pnpm test:shard2
pnpm test:shard3
pnpm test:shard4
pnpm test:shard5
pnpm test:shard6
pnpm test:shard7
pnpm test:shard8
pnpm test:shard9
pnpm test:shard10
pnpm test:shard11
pnpm test:shard12
```

## Dependencies

### New Dependencies (if any)

None required - this fix uses only existing Supabase SDK and environment variables.

### Existing Dependencies Used
- `@supabase/ssr` - Already used in project
- `process.env` - Built-in Node.js API
- No new packages needed

## Database Changes

**Migration needed**: no

No database schema or migration changes required. This is purely a client-side cookie configuration adjustment.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None required - standard deployment process applies
- Environment variables (`VERCEL_ENV`) are automatically set by Vercel

**Feature flags needed**: no

**Backwards compatibility**: maintained

No breaking changes. The fix is transparent to existing users and preserves authentication across all environments.

## Success Criteria

The fix is complete when:
- [ ] All 12 previously failing E2E tests pass (shards 1, 4, 9, 10, 12)
- [ ] Zero regressions in other E2E test shards
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Code formatting passes (`pnpm format`)
- [ ] Local authentication works correctly (port 3000)
- [ ] Docker test container authentication works correctly (port 3001)
- [ ] Manual testing checklist complete
- [ ] No new console errors or warnings
- [ ] Commit follows Conventional Commits format with [agent: name] traceability

## Notes

This regression highlights the importance of testing across all deployment environments (local, Docker, Vercel preview, Vercel production) when making authentication infrastructure changes. The original Vercel preview fix was necessary and valuable - this follow-up ensures we don't lose that benefit while fixing the local regression.

The root cause is that Supabase cookie naming depends on the hostname/URL, and we're accessing Supabase via different URLs in different environments:
- Local dev: `http://127.0.0.1:54521` → `sb-127-auth-token` cookie
- Docker test: `http://host.docker.internal:54521` → `sb-host-auth-token` cookie
- Vercel preview: `https://[preview-url]` → cookie with explicit domain

The solution respects these differences by making the cookie configuration conditional on the environment.

**Related documentation**:
- E2E Testing Fundamentals: Cookie naming and Docker test architecture
- Docker Setup: Hybrid Docker architecture for test containers
- Auth Troubleshooting: Session persistence and cookie configuration
- Vercel Deployment: Vercel preview deployment configuration

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1107*
