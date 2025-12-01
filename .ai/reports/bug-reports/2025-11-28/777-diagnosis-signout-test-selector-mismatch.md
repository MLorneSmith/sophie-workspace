# Bug Diagnosis: Sign-out test fails due to selector mismatch after data-test standardization

**ID**: ISSUE-777
**Created**: 2025-11-28T22:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: regression

## Summary

The E2E test "sign out clears session" in `auth-simple.spec.ts` fails because the `signOut()` method in `AuthPageObject` uses the selector `[data-testid="account-dropdown-trigger"]` which no longer exists. The component `personal-account-dropdown.tsx` was updated on Nov 27 (commit `93bb87a32`) to change the `data-testid` from `"account-dropdown-trigger"` to `"account-dropdown"`, but the corresponding test selectors were not updated.

## Environment

- **Application Version**: Current dev branch (commit 69d66c588)
- **Environment**: development (local E2E tests)
- **Browser**: Chromium (Playwright)
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Before Nov 27, 2025 (pre-commit 93bb87a32)

## Reproduction Steps

1. Run E2E shard 2: `pnpm --filter web-e2e test:shard2`
2. Observe the test "sign out clears session" fails
3. The failure occurs at `auth.po.ts:49` waiting for `[data-testid="account-dropdown-trigger"]`

## Expected Behavior

The `signOut()` method should find the account dropdown trigger element and click it to open the dropdown menu, then click the sign-out option.

## Actual Behavior

The test times out after 15 seconds waiting for element `[data-testid="account-dropdown-trigger"]` because that selector no longer exists. The element now uses `data-testid="account-dropdown"`.

## Diagnostic Data

### Console Output
```
[Phase 1] ❌ Auth API timeout after 45000ms
Error: expect(locator).toBeVisible() failed
    at AuthPageObject.signOut (/home/msmith/projects/2025slideheroes/apps/e2e/tests/authentication/auth.po.ts:49:33)
    at /home/msmith/projects/2025slideheroes/apps/e2e/tests/authentication/auth-simple.spec.ts:112:14
```

### Stack Trace
```
Error: expect(locator).toBeVisible() failed
    at AuthPageObject.signOut (auth.po.ts:49:33)
    at auth-simple.spec.ts:112:14

Test timeout of 30000ms exceeded.
```

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/authentication/auth.po.ts:47` - Uses incorrect selector
  - `apps/e2e/tests/account/account-simple.spec.ts:176` - Uses incorrect selector
  - `apps/e2e/AGENTS.md:20` - Documentation has incorrect selector
  - `apps/e2e/CLAUDE.md:20` - Documentation has incorrect selector
- **Component File**: `packages/features/accounts/src/components/personal-account-dropdown.tsx:85`
- **Recent Changes**: Commit `93bb87a32` on Nov 27, 2025 changed `data-test="account-dropdown-trigger"` to `data-testid="account-dropdown"`
- **Suspected Functions**: `AuthPageObject.signOut()` at `auth.po.ts:42-53`

## Related Issues & Context

### Direct Predecessors
- #732 (CLOSED): "fix(e2e): standardize test selectors from data-test to data-testid" - This commit caused the regression by changing the component selector without updating all test files

### Same Component
- The dropdown component change was part of a broader standardization effort that updated 51 component files

## Root Cause Analysis

### Identified Root Cause

**Summary**: Commit `93bb87a32` renamed the dropdown trigger's `data-testid` from `"account-dropdown-trigger"` to `"account-dropdown"`, but forgot to update the corresponding selectors in 4 test-related files.

**Detailed Explanation**:
The commit `93bb87a32` on Nov 27, 2025 (PR #732) was intended to standardize all `data-test` attributes to `data-testid`. However, it also removed the `-trigger` suffix from the dropdown trigger element:

**Before** (in `personal-account-dropdown.tsx`):
```tsx
<DropdownMenuTrigger
  data-test="account-dropdown-trigger"
  data-testid="account-dropdown"
```

**After** (commit 93bb87a32):
```tsx
<DropdownMenuTrigger
  data-testid="account-dropdown"  // Only this remains, -trigger suffix removed
```

The test files were not updated to reflect this change:
1. `auth.po.ts:47` still uses `[data-testid="account-dropdown-trigger"]`
2. `account-simple.spec.ts:176` still uses `[data-testid="account-dropdown-trigger"]`
3. `AGENTS.md:20` (documentation) has outdated example
4. `CLAUDE.md:20` (documentation) has outdated example

**Supporting Evidence**:
- Git diff from commit `93bb87a32` shows the line `-data-test={"account-dropdown-trigger"}` was removed
- Current component has `data-testid="account-dropdown"` at line 85
- Test file has `'[data-testid="account-dropdown-trigger"]'` at line 47

### How This Causes the Observed Behavior

1. User signs in successfully via `loginAsUser()`
2. Test navigates to `/home` or `/onboarding`
3. Test calls `auth.signOut()` which tries to find `[data-testid="account-dropdown-trigger"]`
4. Element doesn't exist (actual selector is `[data-testid="account-dropdown"]`)
5. Playwright's `toBeVisible()` assertion times out after 15 seconds
6. Test fails with timeout error

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct git history evidence shows the exact commit that changed the selector
- Current component source code confirms the new selector
- Test file grep confirms the old selector is still in use
- The test failure message matches exactly - it's looking for an element that doesn't exist

## Fix Approach (High-Level)

Update all occurrences of `account-dropdown-trigger` to `account-dropdown` in the following files:

1. `apps/e2e/tests/authentication/auth.po.ts:47` - Change selector in `signOut()` method
2. `apps/e2e/tests/account/account-simple.spec.ts:176` - Change selector in test
3. `apps/e2e/AGENTS.md:20` - Update documentation example
4. `apps/e2e/CLAUDE.md:20` - Update documentation example

This is a simple find-and-replace fix requiring no logic changes.

## Diagnosis Determination

Root cause definitively identified: **Selector name mismatch introduced by commit 93bb87a32**. The commit changed the component's `data-testid` from `"account-dropdown-trigger"` to `"account-dropdown"` but did not update the corresponding E2E test selectors. This is a straightforward regression that requires updating 4 files to use the correct selector.

## Additional Context

- This is part of a larger selector standardization effort (PR #732) that touched 51 component files
- Other selectors in the same commit may also have similar issues (worth auditing)
- The fix is low-risk and should be quick to implement

---
*Generated by Claude Debug Assistant*
*Tools Used: git log, git show, grep, file reads*
