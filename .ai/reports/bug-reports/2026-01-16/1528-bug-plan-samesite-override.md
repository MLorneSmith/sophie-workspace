# Bug Fix: E2E Cookie sameSite Override Ignored

**Related Diagnosis**: #1527 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `normalizeSameSite()` uses `cookieConfig.sameSite` as fallback default, but @supabase/ssr always provides `sameSite: 'lax'`, so the "None" override is never applied
- **Fix Approach**: Force `sameSite: "None"` for Vercel preview deployments, ignoring @supabase/ssr's value
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The fix in commit 1eff86ef3 (Issue #1524) correctly sets `cookieConfig.sameSite = "None"` for Vercel preview deployments, but `normalizeSameSite()` only uses this as a fallback when no value is provided. Since @supabase/ssr always provides `sameSite: 'lax'`, the override is ignored and cookies are set with `sameSite: Lax`, causing cross-site cookie transmission failures.

For full details, see diagnosis issue #1527.

### Solution Approaches Considered

#### Option 1: Force sameSite for Vercel Preview ⭐ RECOMMENDED

**Description**: Modify the cookie setting logic to force `sameSite: "None"` for Vercel preview deployments, completely bypassing the `normalizeSameSite()` function for that case.

```typescript
sameSite: cookieConfig.isVercelPreview
  ? "None"  // Force None for cross-site compatibility
  : normalizeSameSite(c.options.sameSite as string, cookieConfig.sameSite),
```

**Pros**:
- Minimal code change (2-3 lines)
- Clear intent - explicitly forces the value for Vercel preview
- No changes to `normalizeSameSite()` function logic
- Maintains backward compatibility for non-Vercel environments
- Easy to understand and maintain

**Cons**:
- Hardcodes "None" instead of using `cookieConfig.sameSite`

**Risk Assessment**: low - Simple conditional that only affects Vercel preview deployments

**Complexity**: simple - Single line change with clear logic

#### Option 2: Add Override Parameter to normalizeSameSite

**Description**: Modify `normalizeSameSite()` to accept an optional `forceOverride` parameter that takes precedence over the input value.

```typescript
const normalizeSameSite = (
  value?: string,
  defaultValue: "Lax" | "Strict" | "None" = "Lax",
  forceOverride?: "Lax" | "Strict" | "None",
): "Lax" | "Strict" | "None" => {
  if (forceOverride) return forceOverride;
  if (!value) return defaultValue;
  // ... existing logic
};
```

**Pros**:
- More flexible API
- Reusable pattern for future needs

**Cons**:
- More complex change to function signature
- Adds cognitive overhead understanding when to use override vs default
- Over-engineering for a specific use case

**Why Not Chosen**: Unnecessarily complex for a simple problem. The current issue is specific to Vercel preview deployments.

#### Option 3: Use cookieConfig.sameSite Directly

**Description**: Use `cookieConfig.sameSite` directly when `isVercelPreview` is true, keeping the ternary but referencing the config value.

```typescript
sameSite: cookieConfig.isVercelPreview
  ? cookieConfig.sameSite  // Use config value for Vercel preview
  : normalizeSameSite(c.options.sameSite as string, cookieConfig.sameSite),
```

**Pros**:
- References config value instead of hardcoding
- Slightly more flexible if config value changes

**Cons**:
- Config value for Vercel preview is already always "None"
- Marginal benefit over Option 1
- Adds indirection that could be confusing

**Why Not Chosen**: Equivalent to Option 1 but with unnecessary indirection. The "None" value is semantically tied to Vercel preview requirements.

### Selected Solution: Force sameSite for Vercel Preview

**Justification**: This is the simplest, lowest-risk fix that directly addresses the root cause. The change is minimal (2-3 lines), clearly expresses intent, and doesn't modify existing function behavior for other environments.

**Technical Approach**:
- Add a conditional check for `cookieConfig.isVercelPreview` before calling `normalizeSameSite()`
- When true, force `"None"` for cross-site cookie compatibility
- When false, use existing `normalizeSameSite()` logic
- Update comments to explain the Vercel preview override

**Architecture Changes**: None - this is a targeted bug fix with no architectural impact.

## Implementation Plan

### Affected Files

- `apps/e2e/global-setup.ts` (lines 954-959) - Modify sameSite assignment to force "None" for Vercel preview

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Cookie sameSite Logic

Modify the `sameSite` assignment in the cookie mapping logic to force "None" for Vercel preview deployments.

**Location**: `apps/e2e/global-setup.ts`, lines 954-959

**Current code**:
```typescript
// Use domain-specific sameSite default (important for Vercel preview deployments)
// Vercel requires Lax or None, we default to Lax for security
sameSite: normalizeSameSite(
  c.options.sameSite as string,
  cookieConfig.sameSite,
),
```

**New code**:
```typescript
// Use domain-specific sameSite for cookie security
// CRITICAL: Vercel preview deployments REQUIRE sameSite=None for cross-site cookie transmission
// The @supabase/ssr library always sets sameSite='lax', so we must force override for Vercel preview
// See: Issue #1527 - normalizeSameSite() default was being ignored
sameSite: cookieConfig.isVercelPreview
  ? "None" // Force None for Vercel preview cross-site compatibility
  : normalizeSameSite(c.options.sameSite as string, cookieConfig.sameSite),
```

**Why this step first**: This is the core fix - all other steps validate it.

#### Step 2: Add Debug Logging for Verification

Add debug logging to confirm the sameSite override is being applied correctly.

**Location**: After the `cookiesToSet` mapping, enhance the existing debug log at line 994.

- Add `sameSite: c.sameSite` to the cookie log output
- This will help verify the fix in CI logs

#### Step 3: Run Local Validation

- Run `pnpm typecheck` to verify no type errors
- Run `pnpm lint` to verify code style
- Run `pnpm format:fix` to ensure formatting

#### Step 4: Test Fix Locally (if possible)

If local Vercel preview testing is available:
- Set `DEBUG_E2E_AUTH=true`
- Run E2E tests against a Vercel preview URL
- Verify logs show `SameSite: None` for cookies
- Verify no `sameSite is Lax, expected None` warnings

#### Step 5: Push and Verify CI

- Commit the fix with proper message
- Push to trigger CI workflow
- Monitor dev-integration-tests workflow
- Verify all 27 tests pass

## Testing Strategy

### Unit Tests

No unit tests needed - this is internal E2E setup logic. The verification is done through:
- Cookie attribute verification in global-setup.ts (already exists)
- CI integration test pass/fail

### Integration Tests

The existing dev-integration-tests CI workflow serves as the integration test:
- ✅ 27 E2E tests that require authenticated sessions
- ✅ Cookie attribute verification logging
- ✅ Auth redirect detection

**Test validation**:
- If fix works: All 27 tests pass, no sameSite warnings
- If fix fails: Tests redirect to `/auth/sign-in`, timeout waiting for `team-selector`

### E2E Tests

No new E2E tests needed - the existing team-accounts tests serve as regression tests.

**Existing coverage**:
- `tests/team-accounts/team-accounts.spec.ts:112` - user can update their team name
- `tests/team-accounts/team-accounts.spec.ts:129` - cannot create Team account using reserved names

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Push fix to dev branch
- [ ] Monitor dev-integration-tests workflow
- [ ] Verify cookie setup logs show `SameSite: None` for Vercel preview
- [ ] Verify NO warning: `sameSite is Lax, expected None`
- [ ] Verify all 27 integration tests pass
- [ ] Verify tests navigate to `/home` without redirect to `/auth/sign-in`

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Cookie not sent due to secure context**:
   - **Likelihood**: low - Vercel preview is always HTTPS
   - **Impact**: high - Tests would fail
   - **Mitigation**: Verify `secure: true` is already set for HTTPS URLs

2. **Browser rejects sameSite=None without Secure**:
   - **Likelihood**: very low - `secure: true` is already set for HTTPS
   - **Impact**: high - Cookies would be rejected
   - **Mitigation**: The code at line 953 already sets `secure: baseURL.startsWith("https")`

**Rollback Plan**:

If this fix causes issues:
1. Revert the single commit
2. The previous behavior (Lax cookies) will be restored
3. No data migration or cleanup needed

**Monitoring**:
- Monitor CI logs for cookie attribute warnings
- Watch for auth redirect patterns in test failures

## Performance Impact

**Expected Impact**: none

This is a simple conditional check evaluated once per cookie during test setup. No runtime or production code is affected.

## Security Considerations

**Security Impact**: none for production

This change only affects E2E test setup code (`global-setup.ts`). The `sameSite=None` cookies are:
- Only created in test environments
- Used for Vercel preview deployments (not production)
- Already require `secure: true` (HTTPS only)
- Standard practice for cross-site cookie testing

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Push to dev and wait for CI
git push origin dev

# Check workflow status
gh run list --limit 5 --json name,status,conclusion | jq '.[] | select(.name == "Dev Integration Tests")'

# Expected: conclusion: "failure"
# Expected in logs: "sameSite is Lax, expected None"
```

**Expected Result**: Integration tests fail with auth redirects

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format:fix

# Build (ensure no compilation errors)
pnpm build

# Commit and push
git add apps/e2e/global-setup.ts
git commit -m "fix(e2e): force sameSite=None for Vercel preview cookies

Override @supabase/ssr's default sameSite=Lax for Vercel preview
deployments. The normalizeSameSite() function was treating the config
value as a fallback default, but @supabase/ssr always provides a value.

This ensures cookies are transmitted cross-site for CI E2E tests.

Fixes #1527

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

git push origin dev

# Monitor CI
gh run watch
```

**Expected Result**: All 27 integration tests pass, no sameSite warnings.

### Regression Prevention

```bash
# The CI workflow itself prevents regression
# Any future change that breaks cookie sameSite will cause:
# 1. Cookie attribute verification warning
# 2. All team account tests to fail
# 3. CI to block the change
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: none

This change only affects E2E test setup code. No production code is modified.

**Feature flags needed**: no

**Backwards compatibility**: maintained - only affects Vercel preview test setup

## Success Criteria

The fix is complete when:
- [ ] Code change applied to `apps/e2e/global-setup.ts`
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] CI dev-integration-tests workflow passes
- [ ] All 27 integration tests pass
- [ ] No `sameSite is Lax, expected None` warnings in logs
- [ ] Tests navigate to `/home` without auth redirects

## Notes

**Key insight**: The issue wasn't with the cookie domain configuration (that was fixed in #1494) or URL validation (fixed in #1518). The issue was specifically that `@supabase/ssr` provides its own `sameSite` value, preventing our override from being applied.

**Related issues in the cookie handling saga**:
- #1096: Auth session lost in Vercel preview (domain handling)
- #1494: Cookie domain mismatch (explicit domain fix)
- #1518: URL validation (healthcheck validation)
- #1524: sameSite=None attempt (incomplete fix)
- #1527: This diagnosis (root cause identified)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1527*
