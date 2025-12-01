# Bug Diagnosis: Unit tests for impersonateUser fail due to stale test expectations

**ID**: ISSUE-pending
**Created**: 2025-12-01T15:55:00Z
**Reporter**: automated/unit-tests
**Severity**: low
**Status**: new
**Type**: regression

## Summary

Three unit tests in `admin-auth-user.service.test.ts` fail because they were written for an older implementation of the `impersonateUser` method that used `fetch()` to follow magic link redirects. The service was refactored on 2025-12-01 to use a simpler `hashed_token` + `verifyOtp()` approach, but the tests were not updated to match the new implementation.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Node Version**: 22.16.0
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Before commit b372354e1 (2025-12-01)

## Reproduction Steps

1. Run `pnpm --filter @kit/admin test`
2. Observe 3 test failures in `admin-auth-user.service.test.ts`

## Expected Behavior

All tests should pass, with mocks properly configured for the current `hashed_token` + `verifyOtp()` implementation.

## Actual Behavior

Three tests fail:
1. `should impersonate a user successfully` - Throws "hashed_token not found" because mock doesn't provide `properties.hashed_token`
2. `should throw error if location header not found` - Wrong error message expected (old implementation used Location header)
3. `should throw error if tokens not found in URL` - Wrong error message expected (old implementation parsed URL hash)

## Diagnostic Data

### Console Output
```
FAIL  src/lib/server/services/admin-auth-user.service.test.ts > AdminAuthUserService > impersonateUser > should impersonate a user successfully
Error: Error generating magic link: hashed_token not found in response

FAIL  src/lib/server/services/admin-auth-user.service.test.ts > AdminAuthUserService > impersonateUser > should throw error if location header not found
AssertionError: expected [Function] to throw error including 'Error generating magic link. Location header not found' but got 'Error generating magic link: hashed_token not found in response'

FAIL  src/lib/server/services/admin-auth-user.service.test.ts > AdminAuthUserService > impersonateUser > should throw error if tokens not found in URL
AssertionError: expected [Function] to throw error including 'Error generating magic link. Tokens not found in URL hash' but got 'Error generating magic link: hashed_token not found in response'
```

## Related Code

- **Affected Files**:
  - `packages/features/admin/src/lib/server/services/admin-auth-user.service.test.ts` (lines 240-347)
  - `packages/features/admin/src/lib/server/services/admin-auth-user.service.ts` (lines 66-126)
- **Recent Changes**:
  - b372354e1 (2025-12-01): "refactor(admin): simplify admin auth user service" - Changed implementation from fetch-based to verifyOtp-based
  - 6e08254f4 (2025-09-08): "test(admin): add comprehensive unit test suite" - Original tests created
- **Suspected Functions**:
  - Test mock `createMockAuthAdmin.generateLink` - Returns `action_link` but not `hashed_token`
  - Test expectations at lines 327-329 and 344-346 - Expect old error messages

## Root Cause Analysis

### Identified Root Cause

**Summary**: The tests mock `generateLink` to return `action_link` instead of `hashed_token`, and expect old error messages that no longer exist in the refactored implementation.

**Detailed Explanation**:
The old implementation (pre-b372354e1) worked like this:
1. Call `generateLink()` to get an `action_link` URL
2. Use `fetch()` to follow the URL and capture the `Location` header
3. Parse tokens from the URL hash in the Location header

The new implementation (post-b372354e1) works like this:
1. Call `generateLink()` to get `properties.hashed_token`
2. Call `client.auth.verifyOtp()` with the `token_hash` parameter
3. Return the session tokens directly

The test mocks return:
```javascript
generateLink: {
  data: {
    properties: {
      action_link: "https://example.com/auth/v1/verify"  // OLD field
      // MISSING: hashed_token  // NEW field required
    }
  }
}
```

And the test expects errors like:
- "Error generating magic link. Location header not found" (OLD)
- "Error generating magic link. Tokens not found in URL hash" (OLD)

But the service now throws:
- "Error generating magic link: hashed_token not found in response" (NEW)
- "Failed to verify magic link: ..." (NEW)

**Supporting Evidence**:
- Service code at line 99-105: `const hashedToken = data.properties?.hashed_token; if (!hashedToken) { throw new Error("Error generating magic link: hashed_token not found in response"); }`
- Test mock at lines 42-48: Only returns `action_link`, not `hashed_token`
- Git diff shows 68 lines removed, 25 added - major refactoring of the method

### How This Causes the Observed Behavior

1. Test calls `service.impersonateUser("user_123")`
2. Service calls `generateLink()` which returns mocked data with `action_link` but no `hashed_token`
3. Service extracts `data.properties?.hashed_token` which is `undefined`
4. Service throws "hashed_token not found in response" error
5. Test expects different error or success, causing assertion failure

### Confidence Level

**Confidence**: High

**Reasoning**: The code paths are clear and verifiable. The mock returns `action_link` (line 45-46 of test), but the service now requires `hashed_token` (line 99 of service). The error messages in the service match what the tests receive.

## Fix Approach (High-Level)

Update the test file to:
1. Change mock to return `properties.hashed_token` instead of/in addition to `action_link`
2. Add mock for `client.auth.verifyOtp()` to return a session
3. Update error message expectations to match new implementation
4. Remove or update tests for scenarios that no longer exist (Location header, URL hash parsing)

## Diagnosis Determination

The root cause is confirmed: **test-implementation mismatch after refactoring**. The service was refactored to use a simpler, more reliable approach (`hashed_token` + `verifyOtp`) but the unit tests were not updated to:
1. Mock the new API response shape (`properties.hashed_token`)
2. Mock the new `verifyOtp` call
3. Expect the new error messages

This is a common issue when implementation changes without corresponding test updates.

## Additional Context

- The new implementation is actually better (avoids fetch redirect issues, uses official Supabase API)
- The service functionality works correctly - only tests are broken
- This does not affect production as unit tests don't run in production

---
*Generated by Claude Debug Assistant*
*Tools Used: pnpm test, git log, file reads*
