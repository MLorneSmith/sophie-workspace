# Bug Fix: E2E Shard 4 Test Failures - Selector Standardization & Auth State Issues

**Related Diagnosis**: #731
**Severity**: high
**Bug Type**: test
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Two issues: (1) Mixed usage of `data-test` and `data-testid` attributes across codebase causing selector mismatches, (2) Authentication state not loading properly for invitation tests
- **Fix Approach**: Standardize all test selectors to Playwright default `data-testid` + verify/regenerate auth states
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E shard 4 (Admin & Invitations) shows 6 of 9 tests failing:

**Issue 1 - Selector Mismatch** (4 admin tests failing):
- Tests use `getByTestId()` which looks for `[data-testid="..."]` (Playwright default)
- Components use mixed attributes: 50 files use `data-test=`, 13 files use `data-testid=`
- Some files use BOTH attributes on the same element

**Issue 2 - Auth State Not Loading** (2 invitation tests failing):
- Tests show completely blank white pages
- Session tokens may be expired or invalid in stored auth state files

For full details, see diagnosis issue #731.

### Solution Approaches Considered

#### Option A: Add testIdAttribute Config

**Description**: Add `testIdAttribute: 'data-test'` to Playwright config

**Why Not Chosen**:
- Only supports ONE attribute value
- Doesn't fix the mixed attribute problem
- Non-standard - deviates from Playwright conventions
- New developers would be confused

#### Option B: Use CSS Selectors Instead

**Description**: Replace all `getByTestId()` with CSS selectors that match both attributes

**Why Not Chosen**:
- Ugly workaround: `[data-test="x"], [data-testid="x"]`
- Doesn't solve root cause
- Maintenance burden increases

#### Option C: Standardize to data-testid (Playwright Default) ⭐ RECOMMENDED

**Description**: Convert all `data-test=` attributes to `data-testid=` across the codebase

**Pros**:
- **Zero config needed** - Playwright works out of the box
- **Industry standard** - All tutorials, docs, examples use `data-testid`
- **Future-proof** - New developers won't be confused
- **Copy-paste friendly** - Code from Stack Overflow, docs, etc. just works
- **Consistent** - One attribute pattern across entire codebase

**Cons**:
- Requires changing 50 component files
- One-time migration effort

**Risk Assessment**: Low - Simple find-and-replace, no logic changes

**Complexity**: Moderate - Many files but mechanical changes

### Selected Solution: Option C - Standardize to data-testid

**Justification**:
Using the Playwright default (`data-testid`) is the pragmatic, future-proof choice. It eliminates configuration, follows industry standards, and ensures any code examples or AI-generated code work without modification. The migration is mechanical and low-risk.

**Technical Approach**:

1. **Convert all `data-test=` to `data-testid=`** in 50 component files
2. **Remove any duplicate attributes** where both exist on same element
3. **Verify auth state files** have valid, non-expired tokens
4. **Regenerate auth states** if needed via global setup
5. **Run full E2E suite** to verify fix

**Architecture Changes**:
- None - Pure attribute renaming
- No functional code modified
- No new dependencies

## Implementation Plan

### Affected Files

**Component Files (50 files)** - Convert `data-test=` to `data-testid=`:

```
packages/features/admin/src/components/
├── admin-account-page.tsx
├── admin-accounts-table.tsx
├── admin-ban-user-dialog.tsx
├── admin-create-user-dialog.tsx
├── admin-dashboard.tsx
├── admin-delete-user-dialog.tsx
├── admin-impersonate-user-dialog.tsx
└── admin-reactivate-user-dialog.tsx

packages/features/auth/src/components/
├── auth-error-alert.tsx
├── auth-provider-button.tsx
├── email-input.tsx
├── existing-account-hint.tsx
├── last-auth-method-hint.tsx
├── magic-link-auth-container.tsx
├── multi-factor-challenge-container.tsx
├── otp-sign-in-container.tsx
├── password-input.tsx
├── password-sign-in-form.tsx
├── password-sign-up-container.tsx
├── password-sign-up-form.tsx
└── resend-auth-link-form.tsx

packages/features/accounts/src/components/
├── account-selector.tsx
├── personal-account-dropdown.tsx
└── personal-account-settings/
    ├── account-danger-zone.tsx
    ├── email/update-email-form.tsx
    ├── password/update-password-form.tsx
    └── update-account-details-form.tsx

packages/features/team-accounts/src/components/
├── create-team-account-dialog.tsx
├── invitations/
│   ├── accept-invitation-container.tsx
│   ├── account-invitations-table.tsx
│   ├── delete-invitation-dialog.tsx
│   ├── renew-invitation-dialog.tsx
│   └── update-invitation-dialog.tsx
├── members/
│   ├── invite-members-dialog-container.tsx
│   ├── membership-role-selector.tsx
│   ├── remove-member-dialog.tsx
│   ├── role-badge.tsx
│   ├── transfer-ownership-dialog.tsx
│   └── update-member-role-dialog.tsx
└── settings/
    ├── team-account-danger-zone.tsx
    └── update-team-account-name-form.tsx

packages/billing/gateway/src/components/
├── billing-portal-card.tsx
├── billing-session-status.tsx
├── current-plan-badge.tsx
├── current-subscription-card.tsx
├── plan-picker.tsx
└── test-checkout.tsx

packages/otp/src/components/
└── verify-otp-form.tsx

apps/web/app/
├── admin/accounts/page.tsx
└── identities/page.tsx
```

**Auth State Files** (gitignored):
- `apps/e2e/.auth/test1@slideheroes.com.json`
- `apps/e2e/.auth/owner@slideheroes.com.json`
- `apps/e2e/.auth/super-admin@slideheroes.com.json`

### New Files

- None

### Step-by-Step Tasks

#### Step 1: Convert data-test to data-testid in Admin Components (8 files)

Convert all `data-test=` attributes to `data-testid=` in admin feature components:

```bash
# Files to update:
packages/features/admin/src/components/admin-account-page.tsx
packages/features/admin/src/components/admin-accounts-table.tsx
packages/features/admin/src/components/admin-ban-user-dialog.tsx
packages/features/admin/src/components/admin-create-user-dialog.tsx
packages/features/admin/src/components/admin-dashboard.tsx
packages/features/admin/src/components/admin-delete-user-dialog.tsx
packages/features/admin/src/components/admin-impersonate-user-dialog.tsx
packages/features/admin/src/components/admin-reactivate-user-dialog.tsx
```

**Why this step first**: These are the components causing the shard 4 admin test failures.

#### Step 2: Convert data-test to data-testid in Auth Components (12 files)

Convert auth feature components:

```bash
packages/features/auth/src/components/auth-error-alert.tsx
packages/features/auth/src/components/auth-provider-button.tsx
packages/features/auth/src/components/email-input.tsx
packages/features/auth/src/components/existing-account-hint.tsx
packages/features/auth/src/components/last-auth-method-hint.tsx
packages/features/auth/src/components/magic-link-auth-container.tsx
packages/features/auth/src/components/multi-factor-challenge-container.tsx
packages/features/auth/src/components/otp-sign-in-container.tsx
packages/features/auth/src/components/password-input.tsx
packages/features/auth/src/components/password-sign-in-form.tsx
packages/features/auth/src/components/password-sign-up-container.tsx
packages/features/auth/src/components/password-sign-up-form.tsx
packages/features/auth/src/components/resend-auth-link-form.tsx
```

**Note**: `email-input.tsx` and `password-input.tsx` have BOTH attributes - remove `data-test=` and keep `data-testid=`.

#### Step 3: Convert data-test to data-testid in Account Components (6 files)

```bash
packages/features/accounts/src/components/account-selector.tsx
packages/features/accounts/src/components/personal-account-dropdown.tsx
packages/features/accounts/src/components/personal-account-settings/account-danger-zone.tsx
packages/features/accounts/src/components/personal-account-settings/email/update-email-form.tsx
packages/features/accounts/src/components/personal-account-settings/password/update-password-form.tsx
packages/features/accounts/src/components/personal-account-settings/update-account-details-form.tsx
```

#### Step 4: Convert data-test to data-testid in Team Account Components (13 files)

```bash
packages/features/team-accounts/src/components/create-team-account-dialog.tsx
packages/features/team-accounts/src/components/invitations/accept-invitation-container.tsx
packages/features/team-accounts/src/components/invitations/account-invitations-table.tsx
packages/features/team-accounts/src/components/invitations/delete-invitation-dialog.tsx
packages/features/team-accounts/src/components/invitations/renew-invitation-dialog.tsx
packages/features/team-accounts/src/components/invitations/update-invitation-dialog.tsx
packages/features/team-accounts/src/components/members/invite-members-dialog-container.tsx
packages/features/team-accounts/src/components/members/membership-role-selector.tsx
packages/features/team-accounts/src/components/members/remove-member-dialog.tsx
packages/features/team-accounts/src/components/members/role-badge.tsx
packages/features/team-accounts/src/components/members/transfer-ownership-dialog.tsx
packages/features/team-accounts/src/components/members/update-member-role-dialog.tsx
packages/features/team-accounts/src/components/settings/team-account-danger-zone.tsx
packages/features/team-accounts/src/components/settings/update-team-account-name-form.tsx
```

#### Step 5: Convert data-test to data-testid in Billing Components (6 files)

```bash
packages/billing/gateway/src/components/billing-portal-card.tsx
packages/billing/gateway/src/components/billing-session-status.tsx
packages/billing/gateway/src/components/current-plan-badge.tsx
packages/billing/gateway/src/components/current-subscription-card.tsx
packages/billing/gateway/src/components/plan-picker.tsx
packages/billing/gateway/src/components/test-checkout.tsx
```

#### Step 6: Convert Remaining Files (5 files)

```bash
packages/otp/src/components/verify-otp-form.tsx
apps/web/app/admin/accounts/page.tsx
apps/web/app/identities/page.tsx
```

#### Step 7: Update Documentation

Update `apps/e2e/CLAUDE.md` and `apps/e2e/AGENTS.md` to reflect the standardized `data-testid` convention:

- Change examples from `data-test` to `data-testid`
- Note that project uses Playwright default attribute

#### Step 8: Verify/Regenerate Auth States

Check stored authentication state files and regenerate if needed:

```bash
# Run global setup to create fresh auth states
cd apps/e2e && npx playwright test --global-setup-only

# Or run tests which triggers global setup automatically
pnpm --filter web-e2e test:shard4
```

#### Step 9: Run Validation

Execute full validation:

```bash
# Type check
pnpm typecheck

# Lint and format
pnpm lint:fix
pnpm format:fix

# Run shard 4 tests
pnpm --filter web-e2e test:shard4

# Run all E2E tests
pnpm --filter web-e2e test:all
```

## Testing Strategy

### Unit Tests

No new unit tests needed - this is a mechanical attribute rename.

### E2E Tests

The existing shard 4 tests validate the fix:
- Admin: displays personal account details
- Admin: delete team account flow
- Invitations: users can delete invites
- Invitations: users can update invites
- Invitations: member of team again
- Invitations: let users accept invite

All other E2E shards should continue passing (regression check).

### Manual Testing Checklist

- [ ] Verify no `data-test=` attributes remain in component files
- [ ] Verify `data-testid=` is used consistently
- [ ] Run `pnpm --filter web-e2e test:shard4` - all 9 tests pass
- [ ] Run `pnpm --filter web-e2e test:all` - no regressions
- [ ] Check browser DevTools that elements have `data-testid` attributes

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Missed Attribute Conversion**: Some `data-test=` attributes not converted
   - **Likelihood**: Low (grep search is comprehensive)
   - **Impact**: Medium (affected tests fail)
   - **Mitigation**: Run grep after conversion to verify zero `data-test=` remain

2. **Dual Attribute Files**: Files with both attributes not cleaned up properly
   - **Likelihood**: Low (only 2 files identified)
   - **Impact**: Low (tests still work, just redundant attributes)
   - **Mitigation**: Manual review of email-input.tsx and password-input.tsx

**Rollback Plan**:

If this fix causes issues:
1. Revert the commit with attribute changes
2. Tests return to previous failing state
3. Investigate what was missed

## Performance Impact

**Expected Impact**: None

- Attribute names don't affect rendering performance
- No functional code changes

## Security Considerations

**Security Impact**: None

- Test attributes have no security implications
- No auth mechanism changes

## Validation Commands

### Before Fix

```bash
# Count data-test= usage (should be ~50 files)
grep -r "data-test=" --include="*.tsx" packages/ apps/web/ | wc -l

# Run shard 4 - expect failures
pnpm --filter web-e2e test:shard4
```

### After Fix

```bash
# Verify no data-test= remains (should be 0)
grep -r 'data-test="' --include="*.tsx" packages/ apps/web/ | wc -l

# Verify data-testid= is used
grep -r 'data-testid="' --include="*.tsx" packages/ apps/web/ | wc -l

# Type check
pnpm typecheck

# Lint
pnpm lint

# Run shard 4 - all should pass
pnpm --filter web-e2e test:shard4

# Run all E2E tests
pnpm --filter web-e2e test:all
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: None - Test infrastructure change only

## Success Criteria

The fix is complete when:

- [ ] Zero `data-test=` attributes in component files
- [ ] All components use `data-testid=` consistently
- [ ] Documentation updated to reflect standard
- [ ] All 9 shard 4 tests pass
- [ ] No regressions in other E2E shards
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes

## Notes

### Why data-testid is the Right Choice

1. **Playwright default** - No configuration needed
2. **React Testing Library default** - Same attribute works for unit tests
3. **Industry standard** - Used by Testing Library, Playwright docs, tutorials
4. **AI-friendly** - Generated code uses `data-testid` by default

### Files with Both Attributes

Two files currently have BOTH `data-test` and `data-testid`:
- `packages/features/auth/src/components/email-input.tsx`
- `packages/features/auth/src/components/password-input.tsx`

These need special attention - remove `data-test=` line and keep `data-testid=`.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #731*
