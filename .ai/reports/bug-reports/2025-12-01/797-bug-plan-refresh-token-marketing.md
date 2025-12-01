# Bug Fix: Console AuthApiError 'Refresh Token Not Found' on Marketing Pages

**Related Diagnosis**: #780 (REQUIRED)
**Severity**: medium
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Marketing layout calls `requireUser()` which triggers token refresh for ALL visitors, including unauthenticated users with stale cookies
- **Fix Approach**: Replace `requireUser()` with graceful `getUser()` pattern that returns null for unauthenticated users
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The marketing layout (`apps/web/app/(marketing)/layout.tsx:10`) unconditionally calls `requireUser()` which internally calls `client.auth.getClaims()`. For visitors with stale/invalid auth cookies, this triggers token refresh attempts that fail with 8 repeated `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` errors in the console.

For full details, see diagnosis issue #780.

### Solution Approaches Considered

#### Option 1: Replace `requireUser()` with graceful auth check in marketing layout

**Description**: Modify the marketing layout to use `client.auth.getUser()` directly, which returns `{ data: { user: null }, error: null }` for unauthenticated users instead of throwing errors. This avoids triggering token refresh for public pages.

**Pros**:
- Minimal code change (single file modification)
- Uses existing Supabase API method
- Maintains current behavior for authenticated users
- No new functions or abstractions needed
- SiteHeader already accepts `user?: JWTUserData | null`

**Cons**:
- Slightly different user data structure (User vs JWTUserData)
- Need to map Supabase User to JWTUserData format

**Risk Assessment**: low - Simple change to existing code, no new dependencies

**Complexity**: simple - Single file modification with straightforward logic

#### Option 2: Create `optionalUser()` helper function

**Description**: Create a new helper function in `packages/supabase/src/` that wraps `requireUser()` with try/catch and returns `null` instead of throwing on auth errors.

**Pros**:
- Reusable pattern for other public pages
- Clean abstraction
- Consistent with existing `requireUser()` pattern

**Cons**:
- Adds new code/abstraction for simple use case
- Over-engineering for single usage
- Need to maintain two user-fetching patterns

**Why Not Chosen**: Over-engineering for a single use case. The marketing layout is the only public page layout that needs conditional user data. Creating a new helper adds unnecessary complexity.

#### Option 3: Add marketing pages to middleware token refresh pattern

**Description**: Extend the middleware patterns in `proxy.ts` to include marketing pages (`/`, `/pricing`, etc.) for proper token refresh handling.

**Pros**:
- Consistent with other route handling
- Centralized auth logic

**Cons**:
- Marketing pages are public and shouldn't require middleware auth handling
- Adds complexity to middleware
- Doesn't solve the root cause (layout still calls `requireUser()`)
- Performance overhead for all marketing page requests

**Why Not Chosen**: Marketing pages are intentionally public. Adding them to middleware auth patterns is architecturally wrong - they should gracefully handle unauthenticated users without middleware intervention.

### Selected Solution: Option 1 - Replace `requireUser()` with graceful auth check

**Justification**: This is the simplest, most direct fix. The marketing layout needs to display different header UI for authenticated vs unauthenticated users, but it shouldn't throw errors for unauthenticated visitors. Using `client.auth.getUser()` directly achieves this with minimal code change.

**Technical Approach**:
- Replace `requireUser(client, { verifyMfa: false })` with `client.auth.getUser()`
- `getUser()` gracefully returns `{ data: { user: null }, error: null }` for no session
- Map the Supabase `User` object to `JWTUserData` format for `SiteHeader`
- Handle null case (unauthenticated) by passing `null` to `SiteHeader`

**Architecture Changes**: None - this is a localized fix within the marketing layout.

**Migration Strategy**: None needed - no data changes required.

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/web/app/(marketing)/layout.tsx` - Replace `requireUser()` call with graceful `getUser()` pattern

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Modify marketing layout

Replace the auth check in the marketing layout to use graceful pattern.

**Current code** (lines 9-10):
```typescript
const client = getSupabaseServerClient();
const user = await requireUser(client, { verifyMfa: false });
```

**New code**:
```typescript
const client = getSupabaseServerClient();
const { data } = await client.auth.getUser();

// Map Supabase User to JWTUserData format if authenticated
const user = data.user
  ? {
      id: data.user.id,
      email: data.user.email ?? '',
      phone: data.user.phone ?? '',
      app_metadata: data.user.app_metadata,
      user_metadata: data.user.user_metadata,
      aal: 'aal1' as const, // Marketing pages don't need MFA check
      is_anonymous: data.user.is_anonymous ?? false,
    }
  : null;
```

**Why this step first**: This is the only code change needed.

#### Step 2: Update imports

Remove unused `requireUser` import if no longer needed:

**Current imports**:
```typescript
import { requireUser } from "@kit/supabase/require-user";
```

**Remove this import** (no longer used after the change).

#### Step 3: Verify type compatibility

Ensure the mapped user object matches `JWTUserData` type expected by `SiteHeader`.

- `SiteHeader` expects `user?: JWTUserData | null`
- Our mapped object matches the `JWTUserData` interface

#### Step 4: Run validation commands

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test with stale cookies
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

No new unit tests required - this is a layout component change that doesn't add testable business logic.

### Integration Tests

Not applicable - auth behavior is tested at E2E level.

### E2E Tests

The existing E2E tests should continue to pass. Additionally, manual verification should confirm:

- [ ] Marketing pages load without console errors for unauthenticated users
- [ ] Marketing pages show correct header for authenticated users
- [ ] Sign-in/sign-out flow works correctly

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Clear browser cookies/storage completely
- [ ] Navigate to `http://localhost:3000/` - should load without console errors
- [ ] Navigate to `http://localhost:3000/pricing` - should load without console errors
- [ ] Set some stale Supabase cookies manually and verify no errors
- [ ] Sign in and verify header shows authenticated state
- [ ] Sign out and verify header shows unauthenticated state
- [ ] Verify no `AuthApiError` messages in console during any navigation

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Type mismatch between User and JWTUserData**:
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: TypeScript will catch any type mismatches at compile time. The mapped object explicitly matches JWTUserData interface.

2. **SiteHeader behavior change**:
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: SiteHeader already handles `user?: JWTUserData | null` - no behavior change expected.

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the single file change in `apps/web/app/(marketing)/layout.tsx`
2. Restore `requireUser()` call
3. Accept console noise until better fix found

**Monitoring**: Not needed - this is a client-side console error fix with no server-side impact.

## Performance Impact

**Expected Impact**: minimal (positive)

The change slightly improves performance by:
- Avoiding unnecessary token refresh attempts for unauthenticated users
- Reducing network requests (no refresh token API calls for public visitors)

**Performance Testing**: Not required - change is minimal and improves performance.

## Security Considerations

**Security Impact**: none

The change does not affect security:
- Marketing pages are public by design
- No auth bypass - protected routes still use middleware
- `getUser()` is the recommended Supabase method for optional auth

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start dev server
pnpm dev

# In browser, set some stale Supabase cookies or use incognito with leftover storage
# Navigate to http://localhost:3000/
# Observe console for 8x "AuthApiError: Invalid Refresh Token: Refresh Token Not Found"
```

**Expected Result**: Console shows repeated AuthApiError messages.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build
pnpm build

# Start dev server and manually verify
pnpm dev
# Navigate to http://localhost:3000/ with cleared cookies
# No AuthApiError messages should appear
```

**Expected Result**: All commands succeed, no console errors on marketing pages.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test:unit

# Run E2E tests for marketing pages
pnpm test:e2e
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - standard deployment process.

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (no AuthApiError on marketing pages)
- [ ] Marketing pages load successfully for unauthenticated users
- [ ] Authenticated users see correct header state
- [ ] Zero regressions detected
- [ ] Manual testing checklist complete

## Notes

The `SiteHeader` component already handles the null user case correctly (line 9):
```typescript
export function SiteHeader(props: { user?: JWTUserData | null }) {
```

And passes null-coalesced value to child component (line 14):
```typescript
actions={<SiteHeaderAccountSection user={props.user ?? null} />}
```

This means no changes are needed in the header components - they're already designed for optional authentication.

**Alternative consideration**: If this pattern is needed elsewhere in the future, consider creating a shared `getOptionalUser()` utility. For now, inline solution is simpler.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #780*
