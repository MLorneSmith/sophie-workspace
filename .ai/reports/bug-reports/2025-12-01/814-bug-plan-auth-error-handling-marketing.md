# Bug Fix: Add Error Handling for getUser() on Marketing Pages

**Related Diagnosis**: #813
**Severity**: medium
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `client.auth.getUser()` throws `AuthApiError` when refresh token validation fails; marketing layout lacks try/catch
- **Fix Approach**: Wrap `getUser()` calls in try/catch blocks to gracefully handle auth exceptions
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The marketing layout at `apps/web/app/(marketing)/layout.tsx` calls `client.auth.getUser()` without error handling. When users have stale/invalid auth cookies, Supabase attempts to refresh the token and throws an `AuthApiError` exception. This unhandled exception propagates to the console, creating error noise for users despite the page rendering successfully.

**Critical Discovery**: Unlike expected behavior, `getUser()` doesn't just return errors—it **throws** exceptions when token refresh fails. This is documented behavior in Supabase SSR, particularly when dealing with invalid refresh tokens.

For full details, see diagnosis issue #813.

### Solution Approaches Considered

#### Option 1: Wrap in try/catch ⭐ RECOMMENDED

**Description**: Add try/catch block around `getUser()` call to catch and silently handle `AuthApiError` exceptions

**Pros**:
- Minimal code change (4 lines added)
- Consistent with how public pages should handle auth failures
- No performance impact
- Aligns with Supabase SSR best practices
- Prevents console error pollution

**Cons**:
- None identified

**Risk Assessment**: Low - Try/catch is a standard pattern, error handling is explicit

**Complexity**: Simple - Single try/catch wrapper

#### Option 2: Use `requireUser()` with error fallback

**Description**: Use `requireUser()` and handle its error response instead of `getUser()`

**Why Not Chosen**: `requireUser()` is designed for protected routes and throws auth errors or redirects. For public pages, it's inappropriate to redirect on auth failure. Option 1 is cleaner.

#### Option 3: Client-side auth state checking

**Description**: Move auth state detection to client component with `useSupabase()` hook

**Why Not Chosen**: Adds complexity with hydration, delays auth detection until after SSR. Option 1 is simpler.

### Selected Solution: Try/Catch Error Handling

**Justification**: This is the simplest, most performant solution that aligns with Supabase SSR patterns. It treats the marketing page as a public page (no auth required) while gracefully handling auth failures when they occur.

**Technical Approach**:
- Wrap `client.auth.getUser()` in try/catch block
- Set `user = null` if any error occurs (treat as unauthenticated)
- Add brief comment explaining why catch is needed
- Apply same pattern to `not-found.tsx` which has the same vulnerability

**Architecture Changes**: None - this is a defensive error handling addition

**Migration Strategy**: No migration needed - this is a fix, not a data change

## Implementation Plan

### Affected Files

- `apps/web/app/(marketing)/layout.tsx` - Primary issue: missing try/catch around `getUser()`
- `apps/web/app/not-found.tsx` - Secondary issue: uses `requireUser()` without error handling (lower priority since it's on error pages)

### New Files

None - this is a fix, not a feature addition

### Step-by-Step Tasks

#### Step 1: Fix Marketing Layout

Wrap the `getUser()` call in try/catch to handle `AuthApiError` exceptions gracefully.

- Read current implementation of `apps/web/app/(marketing)/layout.tsx`
- Add try/catch wrapper around `client.auth.getUser()`
- Ensure `user` is set to `null` on auth errors
- Verify mapping logic remains unchanged when user is null

**Why this step first**: This is the primary affected file causing the issue

#### Step 2: Fix Not-Found Page

Add error handling to `not-found.tsx` which uses `requireUser()` without protection.

- Read current implementation of `apps/web/app/not-found.tsx`
- Add try/catch wrapper around `requireUser()` call
- Handle auth errors gracefully (treat as unauthenticated)
- Verify page still renders correctly without user data

#### Step 3: Add Tests

Create tests to verify error handling works correctly.

- Unit test: Verify try/catch prevents exceptions from propagating
- Integration test: Mock Supabase to throw `AuthApiError`
- Verify no console errors when invalid tokens present

#### Step 4: Validation

Run full test suite and verify the fix works in development.

- Run type checking to ensure no type errors
- Run linting to verify code quality
- Manual testing with stale cookies in browser
- Verify console is clean (no AuthApiError messages)

#### Step 5: Final Testing

Comprehensive testing to ensure no regressions.

- Test marketing pages with and without valid sessions
- Test not-found page in various scenarios
- Test form submissions and page navigation
- Verify no new errors introduced

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `getUser()` throws exception → caught and handled gracefully
- ✅ Valid user data → correctly mapped to JWTUserData
- ✅ `null` user → renders with unauthenticated state
- ✅ Regression: AuthApiError no longer thrown to console

**Test files**:
- `apps/web/app/(marketing)/__tests__/layout.spec.ts` - Test marketing layout error handling

### Integration Tests

- ✅ Mock Supabase client to throw `AuthApiError` with `refresh_token_not_found`
- ✅ Verify exception is caught at component level
- ✅ Verify no console errors appear

**Test files**:
- `apps/web/app/(marketing)/__tests__/layout.integration.spec.ts`

### E2E Tests

- ✅ Navigate to homepage with stale cookies → no console errors
- ✅ Verify marketing pages render correctly
- ✅ Verify unauthenticated header state appears

**Test files**:
- `apps/e2e/tests/public-pages.spec.ts` - Add test case for stale cookies

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Clear all browser cookies
- [ ] Start Supabase: `pnpm supabase:web:start`
- [ ] Run dev server: `pnpm dev`
- [ ] Navigate to `http://localhost:3000/`
- [ ] Open browser DevTools console
- [ ] Verify no `AuthApiError` messages appear
- [ ] Verify page renders correctly (header, footer, content)
- [ ] Verify SiteHeader shows unauthenticated state (no user menu)
- [ ] Navigate to a few marketing pages (about, docs) - no errors
- [ ] Test 404 page by visiting `/nonexistent` - no errors

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Error Masking**: Silently catching auth errors might hide real issues
   - **Likelihood**: Low
   - **Impact**: Medium - could hide unexpected failures
   - **Mitigation**: Add logging for debugging (optional, can be added if needed)

2. **Type Safety**: Error might not be `AuthApiError` type
   - **Likelihood**: Low
   - **Impact**: Low - using catch-all is intentional for public pages
   - **Mitigation**: Code comment explains why we catch all errors

3. **Behavior Change**: Users with valid sessions might see unauthenticated state
   - **Likelihood**: Very Low
   - **Impact**: Medium - user experience degradation
   - **Mitigation**: Only affects cases where `getUser()` throws, which shouldn't happen with valid tokens

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the try/catch wrapper: `git revert <commit-sha>`
2. Deploy reverted version
3. Investigate why exceptions are still occurring
4. Consider adding logging to understand error patterns

**Monitoring** (if needed):
- Monitor for unexpected auth state issues
- Check error logs for patterns after deployment
- No additional monitoring needed for simple fix

## Performance Impact

**Expected Impact**: None

This is a error handling addition with negligible performance cost. Try/catch blocks have minimal overhead in modern JavaScript engines.

## Security Considerations

**Security Impact**: None

This fix improves security by preventing error information leakage to the console. Silently handling auth failures on public pages is the correct security practice.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Commands to reproduce the bug before applying fix

# 1. Clear cookies to simulate stale/invalid state
# Open browser DevTools > Application > Cookies > delete all

# 2. Start services
pnpm supabase:web:start

# 3. Start dev server
pnpm dev

# 4. Navigate to homepage
# Visit http://localhost:3000/

# 5. Check console
# Expected: AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

**Expected Result**: AuthApiError appears in browser console

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm --filter web test:unit apps/web/app/\\(marketing\\)/layout

# E2E tests (if available)
pnpm --filter web test:e2e public-pages

# Manual verification (from console)
# Navigate to http://localhost:3000/
# Expected: Clean console, no AuthApiError messages
```

**Expected Result**: All commands succeed, bug is resolved, zero regressions

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify no new console warnings
# Visit multiple pages and check DevTools console

# Build and check for type errors
pnpm build
```

## Dependencies

### New Dependencies (if any)

None - this uses existing error handling patterns

**No new dependencies required**

## Database Changes

**No database changes required**

This is a client-side error handling fix with no database implications.

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**: None - standard deployment process

**Feature flags needed**: No

**Backwards compatibility**: Fully maintained

This is a bugfix that doesn't change any APIs or data structures.

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (console clean on homepage)
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero regressions detected
- [ ] No new console errors or warnings
- [ ] Marketing pages render correctly for unauthenticated users
- [ ] Manual testing checklist complete

## Notes

**Why Supabase `getUser()` Throws**:

The Supabase `@supabase/ssr` package's `getUser()` method can throw `AuthApiError` exceptions when:
1. A refresh token exists in cookies but is expired/revoked
2. The server attempts to refresh the token
3. The refresh request fails (typically HTTP 400)
4. Instead of returning `{ error }`, the method throws the exception

This is documented behavior and common in Supabase SSR patterns. The solution is to add try/catch around the call.

**Applicability**:

This pattern should be applied to any public pages that call `getUser()` without authentication requirements. Other pages using `requireUser()` should be audited similarly.

**Related Documentation**:
- Supabase SSR documentation: https://supabase.com/docs/guides/auth/server-side-rendering
- Authentication implementation: `.ai/ai_docs/context-docs/infrastructure/auth-implementation.md`
- Troubleshooting: `.ai/ai_docs/context-docs/infrastructure/auth-troubleshooting.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #813*
