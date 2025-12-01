# Bug Fix: Invalid Refresh Token race condition between middleware and server components

**Related Diagnosis**: #826
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Race condition where middleware's `getSession()` and server component's `getUser()` both attempt token refresh simultaneously, with middleware consuming the refresh token before the server component can use it
- **Fix Approach**: Remove redundant `getUser()` call from marketing layout and rely on middleware's pre-validated auth state passed via context or cookie
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Users encounter `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` when navigating to the marketing home page (`/`) with an expired or near-expiry access token. This is caused by a race condition between:

1. **Middleware** (`proxy.ts:75`) calling `getSession()` → triggers Supabase token refresh → consumes refresh token
2. **Server Component** (`(marketing)/layout.tsx:14`) calling `getUser()` → attempts token refresh with already-consumed token → fails

For full details, see diagnosis issue #826.

### Solution Approaches Considered

#### Option 1: Remove redundant `getUser()` call ⭐ RECOMMENDED

**Description**: The middleware already validates auth state via `getSession()` and `getClaims()`. The marketing layout's `getUser()` call is redundant. Remove it and pass user state through a different mechanism (context provider or skip user data on public marketing pages).

**Pros**:
- Eliminates the race condition entirely (only one token refresh per request)
- Simplest fix - single line deletion + graceful fallback
- No architectural changes needed
- Preserves middleware's role as single source of auth truth
- Performance improvement - reduces auth API calls per request
- Maintains existing middleware behavior that's working correctly

**Cons**:
- Marketing pages may not display user-specific content
- Requires minimal UI adjustments

**Risk Assessment**: low - middleware is already working, we're just removing a redundant call

**Complexity**: simple - 1-line change + error handling already in place

#### Option 2: Sequence auth calls in middleware

**Description**: Move the marketing layout's `getUser()` call into the middleware so both calls happen sequentially (not concurrently), preventing race condition.

**Pros**:
- Still retrieves user data for marketing pages
- Maintains current behavior

**Cons**:
- More complex - requires middleware refactoring
- Harder to maintain - spreads layout-specific logic into middleware
- Still 2 auth calls per request (not optimal)
- Doesn't match Next.js best practices (middleware should be minimal)

**Why Not Chosen**: Option 1 is simpler and follows the principle that middleware should authenticate, not fetch layout-specific data.

#### Option 3: Use context provider for user state

**Description**: Create a client-side context provider that reads validated auth state from middleware cookies without making additional API calls.

**Pros**:
- Can share user state across multiple layouts/pages
- Follows React patterns

**Cons**:
- Over-engineering for a simple case
- Adds unnecessary abstraction
- Still requires removing the problematic `getUser()` call first

**Why Not Chosen**: Option 1 solves the problem directly without added complexity. If future requirements need user context across many pages, this can be added later.

### Selected Solution: Remove redundant `getUser()` call

**Justification**: The middleware (`proxy.ts`) already calls `getSession()` to validate authentication and refresh tokens if needed. The marketing layout then makes a redundant `getUser()` call, creating a race condition. Since the marketing layout is a public page that doesn't require authentication (catch-all error handling), we can safely remove the user data fetching and rely on client-side context if needed in future.

**Technical Approach**:
- Remove the `getUser()` call and async logic from marketing layout
- Keep the error handling (silently fail on auth errors - already in place)
- Marketing page displays without user data initially (graceful degradation)
- If user context is needed in future, use client-side `useUser()` hook or pass user state from authenticated routes

**Architecture Changes**:
- None. Middleware remains single source of auth truth.
- Server components continue to rely on middleware's validated auth state via cookies.

**Migration Strategy**:
- No data migration needed - purely a code change.
- Graceful fallback - pages continue to work without user data.

## Implementation Plan

### Affected Files

- `apps/web/app/(marketing)/layout.tsx:8-31` - Remove redundant auth call; keep error handling structure
- `apps/web/app/(marketing)/_components/site-header.tsx` (if it uses user data) - Update to handle null user gracefully

### New Files

None - this is a removal-based fix.

### Step-by-Step Tasks

#### Step 1: Validate the race condition

Execute these steps to confirm the bug exists before applying the fix:

- Navigate to home page (`/`) with valid session
- Wait for access token to expire (or use browser DevTools to clear it)
- Reload the page
- Observe error in console: `AuthApiError: Invalid Refresh Token: Refresh Token Not Found`

**Why this step first**: Confirms the bug is reproducible with current code before making changes.

#### Step 2: Remove redundant `getUser()` call from marketing layout

Simplify `apps/web/app/(marketing)/layout.tsx`:

- Delete lines 13-31 (the entire try/catch block that calls `getUser()`)
- Set `user` to `null` directly: `const user: JWTUserData | null = null;`
- Keep the JSX that renders `<SiteHeader user={user} />` unchanged
- SiteHeader already handles `user={null}` gracefully (no user display when null)

**Result**: Marketing layout no longer makes auth API calls, eliminating race condition.

#### Step 3: Verify SiteHeader handles null user

Check `apps/web/app/(marketing)/_components/site-header.tsx`:

- Confirm it safely renders when `user` is `null`
- If user data is displayed, verify null/undefined checks exist
- If not, add conditional rendering for user sections (optional - may already be correct)

**Why this step**: Ensures UI doesn't break with null user.

#### Step 4: Test the fix

Execute validation commands:

- Run typecheck: `pnpm typecheck` (should pass with no user type errors)
- Run linter: `pnpm lint` (should pass)
- Start dev server: `pnpm dev`
- Test race condition scenario:
  - Sign in to application
  - Navigate to home page (`/`)
  - Wait for token to expire (or trigger manually)
  - Reload page - should NOT see `AuthApiError: Invalid Refresh Token` error
  - Verify marketing page loads successfully with null user (no errors)

#### Step 5: Run full test suite

- Run unit tests: `pnpm test:unit`
- Run E2E tests: `pnpm test:e2e` (focus on marketing page navigation tests)
- Verify zero regressions in auth-related tests

## Testing Strategy

### Unit Tests

Add/update tests for:
- ✅ Marketing layout renders with null user without throwing
- ✅ SiteHeader component handles null user gracefully
- ✅ No auth API calls made during marketing layout render (spy on Supabase client calls)
- ✅ Regression test: Verify marketing page doesn't trigger redundant token refresh

**Test files**:
- `apps/web/app/(marketing)/__tests__/layout.spec.ts` - New test for layout component
- `apps/web/app/(marketing)/_components/__tests__/site-header.spec.ts` - Verify null user handling

### Integration Tests

- ✅ Middleware auth validation still works correctly on protected routes
- ✅ Marketing page load doesn't trigger "Refresh Token Not Found" error
- ✅ Authenticated users can navigate from marketing to home without auth errors

**Test files**:
- `apps/e2e/tests/marketing.spec.ts` - Full page loading and auth flow

### E2E Tests

- ✅ User with expired token can access marketing home page without error
- ✅ User can navigate `/` → sign in → dashboard without race condition errors
- ✅ Marketing page displays correctly (header visible, no auth errors in console)

**Test files**:
- `apps/e2e/tests/marketing-auth.spec.ts` - Auth race condition scenario

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug (should fail before fix with "Refresh Token Not Found")
- [ ] Apply fix (remove getUser call)
- [ ] Start dev server: `pnpm dev`
- [ ] Sign in with test account
- [ ] Navigate to home page (`/`)
- [ ] No console errors - especially no "Refresh Token Not Found"
- [ ] Header displays correctly (nav visible, no user data but no errors)
- [ ] Refresh page multiple times - no auth errors
- [ ] Sign out and verify auth flow still works
- [ ] Test on slow/throttled network (simulate slow token refresh)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Users relying on header to show logged-in state**: Users won't see their user data in the header on marketing pages until they navigate to authenticated routes
   - **Likelihood**: medium (some users may expect to see profile on marketing pages)
   - **Impact**: low (they'll still be logged in, just not visible in header)
   - **Mitigation**: Add a note to UI that user data loads after navigation to dashboard. SiteHeader can display skeleton/loading state while on marketing pages.

2. **Missing required user context in future features**: If future marketing features need user data, we'll need to refactor to get it
   - **Likelihood**: low (marketing pages are typically static/public)
   - **Impact**: medium (would require refactoring)
   - **Mitigation**: Document the decision in code. If needed later, implement client-side context provider using `useUser()` hook instead of server-side auth call.

**Rollback Plan**:

If this fix causes issues in production:
1. Revert commit: `git revert <commit-hash>`
2. Restore the original `getUser()` call in marketing layout
3. Monitor for "Refresh Token Not Found" errors again
4. Consider Option 2 (middleware sequencing) if rollback happens

**Monitoring** (if needed):
- Monitor error logs for "Refresh Token Not Found" - should drop to zero after fix
- Monitor marketing page performance - should improve slightly (fewer API calls)
- Watch for support tickets about missing user display on marketing pages

## Performance Impact

**Expected Impact**: minimal improvement

- **Before fix**: 2 concurrent auth API calls per marketing page request (middleware + layout)
- **After fix**: 1 auth API call per marketing page request (middleware only)
- **Performance gain**: ~10-20% reduction in auth API calls for public pages

No negative performance impact expected.

## Security Considerations

**Security Impact**: none

The middleware already validates authentication securely. Removing a redundant call doesn't reduce security - it actually improves it by reducing token refresh attempts.

**Security review needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start dev server
pnpm dev

# In browser:
# 1. Sign in (any account)
# 2. Open DevTools → Console
# 3. Navigate to home page (/)
# 4. Wait or trigger token expiry
# 5. Reload page
# Expected: See "AuthApiError: Invalid Refresh Token: Refresh Token Not Found"
```

**Expected Result**: Error appears in console when accessing marketing page with expired token.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit

# E2E tests (if applicable)
pnpm test:e2e

# Build
pnpm build

# Manual verification
pnpm dev
# Then repeat browser test above - should NOT see "Refresh Token Not Found" error
```

**Expected Result**: All commands succeed, bug is resolved, zero regressions, marketing page loads without auth errors.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression checks
pnpm test:e2e --grep "marketing|auth|home"
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

### Existing Dependencies Used

- `@kit/supabase/server-client` - Already in use by middleware
- `@kit/supabase/types` - Already imported for JWTUserData type

## Database Changes

**No database changes required**

This is a purely application-level fix (removing redundant API call).

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

**Feature flags needed**: No

**Backwards compatibility**: Maintained

Marketing pages will continue to work exactly as before, just without displaying user data in the header (graceful degradation).

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (no "Refresh Token Not Found" on marketing page with expired token)
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero regressions detected
- [ ] Manual testing checklist complete
- [ ] Performance acceptable (no degradation)
- [ ] Code review approved (if applicable)

## Notes

**Key Decision**: We chose to remove the redundant `getUser()` call rather than sequence it in middleware because:
1. Marketing pages are public and don't require user data
2. Middleware already handles auth validation
3. Future user context needs can be met with client-side `useUser()` hook if required
4. This follows the principle of minimal, focused middleware
5. Simplest, safest fix with lowest risk

**Related Issues**:
- GitHub #18981 (supabase/supabase) - Race condition with multiple layouts using serverClient
- GitHub #68 (supabase/ssr) - Refresh Token Not Found after 24 hours

**References**:
- See `infrastructure/auth-troubleshooting.md` for similar token refresh issues
- See `infrastructure/auth-implementation.md` for alternative auth patterns
- See `infrastructure/auth-overview.md` for auth architecture overview

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #826*
