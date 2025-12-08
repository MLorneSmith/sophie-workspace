# Bug Diagnosis: Payload Auth Tests Fail - Admin User Locked Out

**ID**: ISSUE-pending
**Created**: 2025-12-08T16:35:00Z
**Reporter**: system
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Payload CMS authentication E2E tests fail because the admin user (`michael@slideheroes.com`) has been locked out due to too many failed login attempts. Payload's built-in brute-force protection prevents login even with correct credentials.

## Environment

- **Application Version**: dev branch
- **Environment**: development/test
- **Payload Version**: 3.66.0
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown (likely worked before lock accumulated)

## Reproduction Steps

1. Run Payload E2E authentication tests: `NODE_ENV=test PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 pnpm --filter web-e2e exec playwright test tests/payload/payload-auth.spec.ts`
2. Tests attempt login with `michael@slideheroes.com` credentials
3. Login fails with "user locked" error

Or manually:
```bash
curl -s -X POST http://localhost:3021/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"michael@slideheroes.com","password":"<password>"}'
```

## Expected Behavior

Login should succeed with valid credentials and tests should pass.

## Actual Behavior

Login fails with error: **"This user is locked due to having too many failed login attempts."**

All 3 auth tests fail:
- `should handle pre-seeded admin user correctly`
- `should login with existing user`
- `should maintain session across page refreshes`

## Diagnostic Data

### Console Output
```
Error: "This user is locked due to having too many failed login attempts."
LockedAuth: This user is locked due to having too many failed login attempts.
    at checkLoginPermission (payload/dist/auth/operations/login.js:48:15)
```

### Global Setup Warning
```
🔐 Authenticating payload-admin user via Supabase API...
✅ API authentication successful for payload-admin user
✅ Session injected into cookies and localStorage for payload-admin user
🔄 Authenticating to Payload CMS via API for payload-admin user...
❌ Payload API login failed for payload-admin user - no token received
```

### Test Failure Pattern
All failing tests timeout waiting for redirect from `/admin/login` to `/admin`:
```
Expected pattern: /.*\/admin(?!\/login)/
Received string:  "http://localhost:3021/admin/login"
```

## Error Stack Traces
```
LockedAuth: This user is locked due to having too many failed login attempts.
    at checkLoginPermission (payload/dist/auth/operations/login.js:48:15)
    at loginOperation (payload/dist/auth/operations/login.js:183:9)
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/payload/payload-auth.spec.ts` - Test file
  - `apps/e2e/tests/payload/helpers/test-data.ts` - Test credentials
  - `apps/e2e/global-setup.ts` - Pre-authentication setup
  - Payload CMS `users` collection in database
- **Recent Changes**: Multiple test runs with failed logins accumulated
- **Suspected Functions**: Payload's `checkLoginPermission()` in auth module

## Related Issues & Context

### Similar Issues
- #565 (CLOSED): "E2E Test Failures: Password Hash Mismatch Between Database and Environment Configuration" - Similar auth-related test failures
- #567 (CLOSED): "Authentication Flakiness" - Related auth test issues

### Historical Context
This appears to be a test infrastructure issue where failed login attempts from previous test runs or debugging sessions accumulated and eventually triggered Payload's account lockout protection.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Payload admin user `michael@slideheroes.com` has been locked out due to Payload's built-in brute-force protection being triggered by accumulated failed login attempts.

**Detailed Explanation**:
Payload CMS implements account lockout protection that locks a user after a configurable number of failed login attempts. The admin user used by E2E tests has exceeded this limit, likely due to:
1. Multiple test runs with wrong credentials (before credentials were properly configured)
2. Global setup attempting to authenticate but failing
3. Test retries attempting login repeatedly

The lockout persists in the database and prevents all subsequent logins, even with correct credentials.

**Supporting Evidence**:
- API Response: `"This user is locked due to having too many failed login attempts."`
- Stack trace points to `checkLoginPermission` in Payload auth module
- Global setup shows: `❌ Payload API login failed for payload-admin user - no token received`

### How This Causes the Observed Behavior

1. Test runs `payload-auth.spec.ts`
2. Test attempts to login with admin credentials via UI
3. Payload's auth system checks `lockUntil` field before allowing login
4. User is locked → login rejected → page stays on `/admin/login`
5. Test assertion `toHaveURL(/.*\/admin(?!\/login)/)` times out
6. Test fails

### Confidence Level

**Confidence**: High

**Reasoning**: The error message explicitly states the account is locked. This is a definitive error from Payload's auth system, not a symptom of another issue.

## Fix Approach (High-Level)

1. **Immediate fix**: Unlock the user in the Payload database by clearing the `lockUntil` field and resetting `loginAttempts` to 0 in the `users` collection
2. **Prevent recurrence**:
   - Add a test setup/teardown hook to unlock the user before auth tests
   - Or configure Payload to disable lockout in test environments
   - Or use a dedicated test user that gets reset between runs

Example SQL to unlock:
```sql
UPDATE payload_users
SET "lockUntil" = NULL, "loginAttempts" = 0
WHERE email = 'michael@slideheroes.com';
```

## Diagnosis Determination

The Payload admin user is locked out due to brute-force protection. This is a database state issue, not a code bug. The fix requires:
1. Unlocking the user in the database
2. Implementing test infrastructure to prevent recurrence

## Additional Context

- The lockout mechanism is working as designed - it's test infrastructure that needs to handle this
- Other Payload tests (collections, database) may also be affected since they depend on authenticated state
- The global setup already tries to pre-authenticate but fails silently (just logs warning)

---
*Generated by Claude Debug Assistant*
*Tools Used: curl (Payload API), Playwright test runner, GitHub CLI, file reads*
