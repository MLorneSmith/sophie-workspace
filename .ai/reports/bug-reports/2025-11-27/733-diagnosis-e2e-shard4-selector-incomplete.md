# Bug Diagnosis: E2E Shard 4 Tests Fail - Incomplete Selector Migration (Tests Not Updated)

**ID**: ISSUE-733
**Created**: 2025-11-27T16:20:00Z
**Reporter**: user (via /test 4 command)
**Severity**: high
**Status**: new
**Type**: regression

## Summary

E2E shard 4 (Admin & Invitations) tests are failing with 6/9 test failures due to selector mismatches. The previous fix (#732) standardized component selectors from `data-test=` to `data-testid=`, but the E2E test files themselves were NOT updated. Tests are now looking for `[data-test="..."]` selectors that no longer exist in components.

## Environment

- **Application Version**: dev branch (commit bbd4df98d)
- **Environment**: development (local)
- **Node Version**: As configured in project
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Before commit 93bb87a32 (selector standardization)

## Reproduction Steps

1. Run `/test 4` or `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh --shard 4`
2. Observe 6 test failures with timeout errors
3. Check error logs showing `locator('[data-test="..."]')` waiting indefinitely

## Expected Behavior

All 9 tests in shard 4 (Admin & Invitations) should pass.

## Actual Behavior

- **3 tests pass**, **6 tests fail** (33% pass rate)
- Tests timeout waiting for selectors that don't exist
- Error: `locator.fill: Test timeout of 120000ms exceeded` waiting for `[data-test="admin-accounts-table-filter-input"]`

## Diagnostic Data

### Console Output
```
[Phase 1] ❌ Auth API timeout after 15000ms
Error: locator.fill: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('[data-test="admin-accounts-table-filter-input"]').first()
```

### Selector Mismatch Evidence

**Component (uses `data-testid`):**
```typescript
// packages/features/admin/src/components/admin-accounts-table.tsx:147
data-testid={"admin-accounts-table-filter-input"}
```

**Test (uses `data-test`):**
```typescript
// apps/e2e/tests/admin/admin.spec.ts:352
.locator('[data-test="admin-accounts-table-filter-input"]')
```

### Affected Files Count

| Location | `data-test=` Count | Status |
|----------|-------------------|--------|
| `apps/e2e/` | **93 occurrences** | NOT UPDATED |
| `packages/` | 0 occurrences | Updated in #732 |

### Key Test Files Still Using `data-test=`

1. `apps/e2e/tests/admin/admin.spec.ts` (3 occurrences)
2. `apps/e2e/tests/invitations/invitations.po.ts` (14 occurrences)
3. `apps/e2e/tests/invitations/invitations.spec.ts` (1 occurrence)
4. `apps/e2e/tests/team-accounts/team-accounts.po.ts` (18 occurrences)
5. `apps/e2e/tests/authentication/auth.po.ts` (8 occurrences)
6. Plus 15 more test files

## Error Stack Traces
```
Test timeout of 120000ms exceeded while running "beforeEach" hook.

Error: locator.fill: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('[data-test="admin-accounts-table-filter-input"]').first()

    at filterAccounts (/home/msmith/projects/2025slideheroes/apps/e2e/tests/admin/admin.spec.ts:354:4)
    at /home/msmith/projects/2025slideheroes/apps/e2e/tests/admin/admin.spec.ts:73:10
```

## Related Code

- **Affected Files**:
  - `apps/e2e/tests/admin/admin.spec.ts`
  - `apps/e2e/tests/invitations/invitations.spec.ts`
  - `apps/e2e/tests/invitations/invitations.po.ts`
  - Plus 17 more E2E test files (93 total occurrences)
- **Recent Changes**: Commit `93bb87a32` updated components but not tests
- **Suspected Functions**: All selectors using `[data-test="..."]` pattern

## Related Issues & Context

### Direct Predecessors
- #732 (CLOSED): "Bug Fix: E2E Shard 4 Test Failures - Standardize to data-testid" - **Incomplete fix: only updated components, not tests**
- #731 (CLOSED): "Bug Diagnosis: E2E Shard 4 Test Failures Due to Selector Mismatch and Auth State Issues" - Original diagnosis

### Same Component
- #729 (CLOSED): "Bug Diagnosis: E2E Shard 4 Admin Tests Fail - Global Setup Missing MFA Verification"
- #720 (CLOSED): "Bug Fix: E2E Shard 4 Tests Fail Due to Redundant Login Attempts Against Pre-Authenticated Sessions"

### Historical Context

This is a regression introduced by fix #732. The fix correctly identified the problem (mixed selectors) and correctly updated the **components** to use `data-testid`, but the E2E **test files** were not updated to match. The tests continue to look for the old `data-test` attribute.

## Root Cause Analysis

### Identified Root Cause

**Summary**: E2E test files still use `data-test=` selectors while components were updated to use `data-testid=` in PR #732.

**Detailed Explanation**:

The fix in PR #732 (commit `93bb87a32`) was incomplete. It updated 51 component files to use `data-testid=` but failed to update the 20+ E2E test files that reference these selectors. The test files contain 93 occurrences of `[data-test="..."]` selectors that now have no matching elements in the DOM.

When tests run:
1. Test navigates to page successfully
2. Test tries to find element with `[data-test="selector-name"]`
3. Component has `data-testid="selector-name"` (different attribute!)
4. Playwright waits up to 120 seconds for element that will never appear
5. Test times out

**Supporting Evidence**:
- Component: `packages/features/admin/src/components/admin-accounts-table.tsx:147` uses `data-testid={"admin-accounts-table-filter-input"}`
- Test: `apps/e2e/tests/admin/admin.spec.ts:352` uses `.locator('[data-test="admin-accounts-table-filter-input"]')`
- Grep shows 93 occurrences of `data-test=` in E2E tests, 0 in packages

### How This Causes the Observed Behavior

1. `filterAccounts()` function calls `.locator('[data-test="admin-accounts-table-filter-input"]')`
2. Component renders with `data-testid="admin-accounts-table-filter-input"`
3. Selector mismatch: `data-test` ≠ `data-testid`
4. Playwright waits indefinitely (up to 120s timeout)
5. Test fails with "Test timeout exceeded"

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence of selector mismatch between test files and components
- Git history shows components were updated but tests were not
- Error logs explicitly show Playwright waiting for non-existent selectors
- Counting occurrences confirms 93 `data-test=` in tests vs 0 in components

## Fix Approach (High-Level)

Replace all `data-test=` selectors with `data-testid=` equivalents across the 20 E2E test files. This is a mechanical find-and-replace operation:

1. In `.spec.ts` and `.po.ts` files, replace:
   - `[data-test="name"]` → `[data-testid="name"]`
   - `data-test=` → `data-testid=`
2. Update documentation in `apps/e2e/CLAUDE.md` and `apps/e2e/AGENTS.md`
3. Run shard 4 tests to verify fix

## Diagnosis Determination

The root cause is definitively identified: **incomplete migration in PR #732**. The fix updated component selectors but missed the E2E test files. This is a straightforward find-and-replace fix with low risk.

## Additional Context

- The CLAUDE.md in `apps/e2e/` still references `data-test` convention, which may have contributed to the oversight
- Total effort estimate: 30-60 minutes for mechanical replacement across 20 files

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (grep, git log, gh issue), Read, Grep*
