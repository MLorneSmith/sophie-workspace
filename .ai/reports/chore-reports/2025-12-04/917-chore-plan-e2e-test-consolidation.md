# Chore: Consolidate Duplicate E2E Tests

## Chore Description

Remove duplicate and redundant E2E test files to reduce CI execution time and eliminate maintenance burden from having the same tests in multiple locations. This involves:

1. **Delete `auth.spec.ts`** - Entirely skipped file that duplicates functionality covered by `auth-simple.spec.ts`
2. **Delete `admin-workaround.spec.ts`** - Contains duplicate "non-admin get 404" test already in `admin.spec.ts`
3. **Merge `accessibility-hybrid-simple.spec.ts`** - Consolidate into `accessibility-hybrid.spec.ts` with proper test tags

## Relevant Files

Files to be **deleted**:
- `apps/e2e/tests/authentication/auth.spec.ts` - All 8 tests are skipped with `test.describe.skip()`, functionality fully covered by `auth-simple.spec.ts`
- `apps/e2e/tests/debug/admin-workaround.spec.ts` - Line 7 has exact duplicate of `admin.spec.ts` line 11 ("non-admin get 404" test)

Files to be **modified**:
- `apps/e2e/tests/accessibility/accessibility-hybrid.spec.ts` - Will receive consolidated tests from simple version
- `apps/e2e/tests/accessibility/accessibility-hybrid-simple.spec.ts` - Will be deleted after consolidation

Files for **reference**:
- `apps/e2e/tests/authentication/auth-simple.spec.ts` - Active auth tests (10 tests covering sign-in, sign-up, session, protected routes)
- `apps/e2e/tests/admin/admin.spec.ts` - Production admin tests (dashboard, account management, impersonation)
- `apps/e2e/playwright.config.ts` - Verify no special configuration references deleted files

## Impact Analysis

### Dependencies Affected

- **CI Pipeline**: Reduced test count will speed up E2E shards
- **Test Coverage Reports**: No actual coverage loss (tests are duplicates or skipped)
- **Page Objects**: `auth.po.ts` still used by `auth-simple.spec.ts`, no changes needed

### Risk Assessment

**Low Risk**:
- `auth.spec.ts` is already completely skipped - removing it has zero runtime impact
- `admin-workaround.spec.ts` duplicates exact functionality - removing causes no coverage loss
- Accessibility consolidation maintains all test coverage with better organization

### Backward Compatibility

No compatibility concerns - these are internal test files with no external consumers.

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/consolidate-e2e-tests`
- [ ] Verify `auth.spec.ts` tests are all skipped (confirmed: 3x `test.describe.skip`)
- [ ] Verify `admin-workaround.spec.ts` test duplicates `admin.spec.ts` (confirmed: both test "non-admin get 404")
- [ ] Review accessibility test coverage to ensure no loss during merge

## Documentation Updates Required

- No documentation updates needed - these are internal test files
- CHANGELOG.md entry for maintenance cleanup

## Rollback Plan

1. **Git revert**: Simple `git revert` of the consolidation commit
2. **No database changes**: No migrations or data changes
3. **Monitoring**: Run full E2E suite after merge to verify no regressions

## Step by Step Tasks

### Step 1: Delete Completely Skipped Auth Test File

Delete `apps/e2e/tests/authentication/auth.spec.ts`:
- File has 3x `test.describe.skip()` blocks (lines 6, 86, 113)
- Contains 8 tests that never run
- All functionality covered by `auth-simple.spec.ts` which has 10 active tests

```bash
rm apps/e2e/tests/authentication/auth.spec.ts
```

### Step 2: Delete Duplicate Admin Workaround Test File

Delete `apps/e2e/tests/debug/admin-workaround.spec.ts`:
- Line 7: `test("non-admin users get 404", ...)`
- Duplicates `admin.spec.ts` line 11: `test("will return a 404 for non-admin users", ...)`
- The `admin.spec.ts` version is the authoritative test (uses proper auth state setup)
- The workaround file also has a documentation-only test that provides no value

```bash
rm apps/e2e/tests/debug/admin-workaround.spec.ts
```

### Step 3: Consolidate Accessibility Tests

Merge `accessibility-hybrid-simple.spec.ts` into `accessibility-hybrid.spec.ts`:

1. Review both files for unique test coverage
2. The simple file has 6 tests across 3 describe blocks:
   - "Accessibility - Critical Issues Only" (3 tests)
   - "Accessibility - Contrast Tracking" (1 skipped test)
   - "Accessibility - Quick Validation" (2 tests: document structure, forms, keyboard)
3. The comprehensive file already covers homepage, auth pages, dashboard
4. Keep unique tests from simple file:
   - "Forms have proper labels" - unique, valuable
   - "Interactive elements are keyboard accessible" - unique, valuable
5. Add these as a new describe block in the comprehensive file: "Accessibility - Quick Validation"

After consolidation, delete:
```bash
rm apps/e2e/tests/accessibility/accessibility-hybrid-simple.spec.ts
```

### Step 4: Run Validation Commands

Execute all validation commands to ensure no regressions.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions:

```bash
# Verify deleted files no longer exist
test ! -f apps/e2e/tests/authentication/auth.spec.ts && echo "auth.spec.ts deleted"
test ! -f apps/e2e/tests/debug/admin-workaround.spec.ts && echo "admin-workaround.spec.ts deleted"
test ! -f apps/e2e/tests/accessibility/accessibility-hybrid-simple.spec.ts && echo "accessibility-hybrid-simple.spec.ts deleted"

# Verify remaining auth tests still exist and have coverage
grep -l "sign in\|sign up\|sign out" apps/e2e/tests/authentication/auth-simple.spec.ts

# Verify admin tests still exist
grep -l "non-admin\|404" apps/e2e/tests/admin/admin.spec.ts

# Verify accessibility tests consolidated properly
grep -l "Quick Validation\|Forms have proper labels" apps/e2e/tests/accessibility/accessibility-hybrid.spec.ts

# Run TypeScript check on e2e package
pnpm --filter web-e2e typecheck

# Run the E2E tests to verify no import errors or missing files
# Use quick smoke test first
pnpm --filter web-e2e test:shard1 --grep "smoke"

# Run auth-related E2E tests to verify no regressions
pnpm --filter web-e2e test --grep "sign in|sign up|Authentication"

# Run admin E2E tests
pnpm --filter web-e2e test --grep "Admin"

# Run accessibility E2E tests
pnpm --filter web-e2e test --grep "Accessibility"
```

## Notes

- The `auth.spec.ts` file was likely kept for reference or future use when email confirmation becomes available in tests, but it adds confusion and maintenance burden
- The `admin-workaround.spec.ts` file appears to be leftover from debugging sessions
- The accessibility split was likely done to have a "quick" vs "comprehensive" option, but this is better handled with test tags or grep filters
- Consider adding `@quick` and `@comprehensive` tags to accessibility tests for filtering if needed in the future
- Debug test files in `tests/debug/` folder should be reviewed periodically for cleanup
