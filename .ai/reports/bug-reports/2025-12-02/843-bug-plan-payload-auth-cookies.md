# Bug Fix: Payload CMS E2E Tests Fail Due to Missing Auth Cookies

**Related Diagnosis**: #842
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Payload CMS uses independent authentication system with separate `payload-token` cookies; global setup saves only Supabase cookies
- **Fix Approach**: Replace Payload UI login with direct API login to capture and inject `payload-token` cookie
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Payload CMS E2E tests (shard 7) fail because:

1. Payload CMS uses its own independent authentication system separate from Supabase
2. Payload's auth stores users in its own `users` table with bcrypt passwords
3. Payload issues JWT tokens via `payload-token` cookies upon login
4. The current global setup saves storage state without the required `payload-token` cookie
5. Tests receive valid Supabase cookies but lack Payload authentication, causing them to get stuck on the login page

The UI login fallback (lines 446-465 in global-setup.ts) fails silently, leaving tests with incomplete authentication state.

For full details, see diagnosis issue #842.

### Solution Approaches Considered

#### Option 1: Use Payload Login API ⭐ RECOMMENDED

**Description**: Call Payload's `/api/users/login` endpoint directly to obtain a valid JWT token, then inject the `payload-token` cookie into the browser context.

**Pros**:
- Direct API call is more reliable than UI login fallback
- Bypasses all UI timing issues and selectors
- Payload-provided method for authentication (proper API usage)
- Fast - no waiting for page loads or form interactions
- Consistent with global setup's API-first philosophy
- Can capture and inspect the token response directly
- Works even if Payload UI changes

**Cons**:
- Requires network call to Payload API
- Payload server must be running and accessible

**Risk Assessment**: low - API endpoint is stable and documented, straightforward implementation

**Complexity**: moderate - Cookie manipulation in Playwright context, understanding token format

#### Option 2: Improve UI Login Fallback

**Description**: Enhance the existing UI login approach with better selectors, waiting strategies, and error handling.

**Pros**:
- Keeps existing pattern
- Tests UI login path

**Cons**:
- Fragile - depends on UI selectors that can change
- Slower than API approach
- Doesn't address the root issue (no `payload-token` cookie saved)
- UI changes break tests
- May have race conditions

**Why Not Chosen**: The diagnosis already showed this fails silently. Improving it doesn't solve the fundamental problem - the UI login doesn't save the token cookie to storage state.

#### Option 3: Merge Supabase and Payload Authentication

**Description**: Modify Payload CMS to use Supabase authentication instead of its own system.

**Pros**:
- Single auth system for entire app
- Reduces complexity long-term

**Cons**:
- Major architectural change
- Requires Payload CMS configuration changes
- Out of scope for a bug fix
- High risk of regressions

**Why Not Chosen**: This is a refactoring task, not a bug fix. Current architecture has separate systems and we should work within it.

### Selected Solution: Use Payload Login API

**Justification**: The Payload login API is the most reliable, maintainable approach that directly addresses the root cause. It's the standard Payload CMS authentication mechanism and leverages API-first authentication consistent with the global setup's philosophy.

**Technical Approach**:

1. When `navigateToPayload` is true, make an HTTP POST request to Payload's login endpoint
2. Send email and password credentials in the request body
3. Parse the response to extract the JWT token
4. Inject `payload-token` cookie into the browser context with proper settings:
   - `httpOnly: true` (prevents JavaScript access)
   - `sameSite: 'Lax'` (CSRF protection)
   - Expiration set to 2 hours (standard JWT lifetime)
5. Save storage state after cookie injection

**Architecture Changes**: None. This is a localized change to the Payload authentication block in global-setup.ts.

**Migration Strategy**: No migration needed - this is a setup-time operation that affects test initialization only.

## Implementation Plan

### Affected Files

- `apps/e2e/global-setup.ts` (lines 418-490) - Payload authentication logic
  - Replace UI login fallback with API-based authentication
  - Add token extraction from API response
  - Add cookie injection into browser context
  - Keep existing verification logic for debugging

### New Files

None required. Solution uses existing Playwright and fetch APIs.

### Step-by-Step Tasks

#### Step 1: Implement Payload API Login Function

Create a helper function that calls Payload's login API endpoint:

- Function name: `loginToPayloadViaAPI()`
- Parameters: `payloadUrl`, `email`, `password`
- Returns: Promise<string | null> (JWT token or null on failure)
- Uses native `fetch()` to POST to `${payloadUrl}/api/users/login`
- Handles JSON response parsing
- Includes error handling with helpful error messages

**Why this step first**: Isolates API logic for testability and clarity. Makes the main flow easier to understand.

#### Step 2: Replace UI Login with API Call

In the Payload authentication section (line 420-490):

- Remove the isOnLoginPage detection logic
- Replace with direct API call to loginToPayloadViaAPI()
- Check for successful token response
- Add logging for debugging

**Why after Step 1**: Builds on the isolated function, keeps main flow clean.

#### Step 3: Implement Cookie Injection

After successful API login:

- Use `context.addCookies()` to inject `payload-token` cookie
- Set proper cookie attributes:
  - `name: 'payload-token'`
  - `value: token` (from API response)
  - `domain: new URL(payloadUrl).hostname`
  - `path: '/'`
  - `httpOnly: true`
  - `sameSite: 'Lax'`
  - `expires: Math.floor(Date.now() / 1000) + 7200` (2 hours)

**Why after Step 2**: Cookie must be injected after obtaining token.

#### Step 4: Keep Verification Logic for Debugging

After cookie injection:

- Keep the existing admin nav verification (lines 468-482)
- This serves as proof that authentication worked
- Helpful for debugging if something goes wrong

**Why keep it**: Provides confidence that the token is valid and recognized.

#### Step 5: Update Error Handling

- Improve error messages to distinguish API failures from verification failures
- Add logging of token details (for DEBUG_E2E_AUTH)
- Continue with storage state save even if verification fails (tests reveal issues)

#### Step 6: Add Comprehensive Testing

Add tests to verify:

- ✅ Payload API login succeeds with valid credentials
- ✅ Token is correctly extracted from response
- ✅ `payload-token` cookie is present in storage state
- ✅ Cookie has correct attributes (httpOnly, sameSite, etc.)
- ✅ Stored state can be loaded in test and authenticates correctly
- ✅ Admin panel is accessible after loading stored state
- ✅ Fails gracefully with invalid credentials

#### Step 7: Validation

- Run shard 7 tests and verify they pass
- Run full test suite to ensure no regressions
- Check storage state file (`payload-admin.json`) contains `payload-token`

## Testing Strategy

### Unit Tests

Add unit tests for the new `loginToPayloadViaAPI()` function:

- ✅ Successful login returns token string
- ✅ Invalid credentials return null
- ✅ Network error is caught and logged
- ✅ Malformed response is handled gracefully
- ✅ Token format is valid JWT

**Test files**:
- `apps/e2e/tests/utils/payload-login.spec.ts` - Unit tests for API login function

### Integration Tests

Add integration tests for the global setup:

- ✅ Payload auth state file contains `payload-token` cookie
- ✅ Cookie attributes are correct (httpOnly, sameSite, expires)
- ✅ Stored state can be loaded and used in a test
- ✅ Test can navigate to admin panel using stored state

**Test files**:
- `apps/e2e/tests/global-setup.integration.spec.ts` - Integration tests

### E2E Tests

Verify shard 7 tests work correctly:

- ✅ Run `/test --shard 7` and verify all tests pass
- ✅ No tests hang on login page
- ✅ Admin-only pages are accessible

### Manual Testing Checklist

Execute these before considering the fix complete:

- [ ] Verify `payload-admin.json` storage state file contains `payload-token` cookie
- [ ] Check that the cookie has correct attributes (httpOnly=true, sameSite=Lax)
- [ ] Run shard 7 tests: `pnpm --filter web-e2e test --shard=7`
- [ ] Verify all tests complete without timeout
- [ ] Check global setup logs show "✅ Payload admin panel loaded for payload-admin user"
- [ ] Run full test suite: `pnpm test:e2e`
- [ ] Verify no regressions in other shards
- [ ] Test with DEBUG_E2E_AUTH=true to verify token capture works

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Payload API may change**: The `/api/users/login` endpoint is part of Payload's public API and unlikely to change without migration guides
   - **Likelihood**: low
   - **Impact**: medium (tests would fail)
   - **Mitigation**: Check Payload CMS changelog; keep endpoint URL configurable via env var if needed

2. **Network connectivity**: Payload server might be unreachable
   - **Likelihood**: low (should already be validated in pre-flight checks)
   - **Impact**: high (setup fails completely)
   - **Mitigation**: Pre-flight validation already checks Payload connectivity; clear error messages

3. **Token format changes**: Payload might change JWT token format
   - **Likelihood**: very low
   - **Impact**: low (just cookie storage format)
   - **Mitigation**: Code is flexible enough to handle any token value

4. **Cookie injection timing**: Cookie might be set after page reloads clear it
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: Inject cookie before any navigation to preserve it

**Rollback Plan**:

If this fix causes issues:

1. Revert changes to `apps/e2e/global-setup.ts` to previous version
2. Delete any new test files added
3. Run full test suite to confirm rollback successful
4. Investigate root cause and try alternative approach

**Monitoring** (if needed):

- Monitor shard 7 test pass rate
- Watch for timeout errors in global setup
- Alert if "Could not verify Payload admin access" appears in logs

## Performance Impact

**Expected Impact**: minimal

- API call to login endpoint: ~100-200ms (faster than UI login, which requires form filling and navigation)
- Cookie injection: <1ms
- Overall setup is still 3-5x faster than per-test UI authentication
- No performance regression expected

**Performance Testing**:

- Measure global setup time before and after
- Compare shard execution time (should be same or faster)

## Security Considerations

**Security Impact**: none (positive actually)

Why this is more secure than UI login:

- API endpoint is properly authenticated (POST to internal endpoint)
- Token is obtained directly, no intermediate steps
- Cookie attributes are properly set (`httpOnly=true` prevents XSS access)
- No credentials stored in UI or logs (cleared after use)
- Payload's native authentication mechanism is used correctly

**Security Review Needed**: no

**Penetration Testing Needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run shard 7 tests - they should fail/timeout
pnpm --filter web-e2e test --shard=7 2>&1 | head -100

# Check storage state file
cat .auth/payload-admin.json | jq '.cookies[] | select(.name == "payload-token")'
# Expected: empty (no payload-token cookie)
```

**Expected Result**: Tests hang on Payload login page; no `payload-token` cookie in storage state

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run shard 7 tests
pnpm --filter web-e2e test --shard=7

# Verify storage state contains payload-token
cat .auth/payload-admin.json | jq '.cookies[] | select(.name == "payload-token")'
# Expected: payload-token cookie with valid JWT

# Check cookie attributes
cat .auth/payload-admin.json | jq '.cookies[] | select(.name == "payload-token") | {name, httpOnly, sameSite}'

# Run full test suite
pnpm test:e2e

# Build to ensure no type errors
pnpm build
```

**Expected Result**: All commands succeed, shard 7 tests pass, storage state contains valid `payload-token` cookie, no regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test:e2e

# Run with debug logging to inspect auth flow
DEBUG_E2E_AUTH=true pnpm --filter web-e2e test --shard=7 2>&1 | grep -A 5 "payload"

# Spot check other shards
pnpm --filter web-e2e test --shard=1
pnpm --filter web-e2e test --shard=2
```

**Expected Result**: All tests pass, debug logging shows successful API login and cookie injection.

## Dependencies

### New Dependencies (if any)

None required. Solution uses:
- `fetch()` API (built-in to Node.js)
- Playwright's `context.addCookies()` (already available)
- Standard JSON parsing

**No new dependencies required**

## Database Changes

**Migration needed**: no

**Database reasoning**: This is purely a test setup/auth token issue. No database schema or data changes are needed.

## Deployment Considerations

**Deployment Risk**: none (this is test infrastructure only)

This change affects E2E test setup only and has no impact on production code or deployment.

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: maintained (internal test infrastructure)

## Success Criteria

The fix is complete when:

- [ ] Payload API login function is implemented and tested
- [ ] Cookie injection is properly implemented with correct attributes
- [ ] Shard 7 tests pass without timeout
- [ ] Storage state file contains valid `payload-token` cookie
- [ ] All other test shards pass (no regressions)
- [ ] Type checking passes
- [ ] Linting passes
- [ ] All validation commands pass
- [ ] Manual testing checklist complete

## Notes

### Key Implementation Details

1. **Endpoint URL**: Use `PAYLOAD_PUBLIC_SERVER_URL` environment variable for consistency with existing code
2. **Credentials**: The global setup already has a `credentials` object with email and password
3. **Token extraction**: The Payload login response should be `{ token: "eyJ..." }`
4. **Cookie domain**: Extract from the Payload URL using `new URL(payloadUrl).hostname`
5. **Error handling**: Don't throw on auth failure - let tests reveal the issue (consistent with current pattern)

### Related Documentation

- Payload CMS authentication: The `/api/users/login` endpoint is documented in Payload CMS docs
- Playwright cookies: https://playwright.dev/docs/api/class-browsercontext#browser-context-add-cookies
- JWT format: Token will be a standard JWT (header.payload.signature format)
- TOTP/MFA: Not needed for basic Payload login (only for Supabase MFA)

### Previous Attempts

The current UI login fallback (lines 446-465) fails because:
1. The UI login doesn't set the `payload-token` cookie
2. Only Supabase cookies are saved to storage state
3. Tests load storage state but lack Payload authentication
4. Silent failure in verification makes debugging difficult

This fix directly addresses the root cause by using Payload's own authentication API.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #842*
