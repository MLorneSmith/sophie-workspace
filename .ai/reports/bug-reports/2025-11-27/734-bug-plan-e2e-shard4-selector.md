# Bug Fix: E2E Shard 4 Tests Fail - Incomplete Selector Migration

**Related Diagnosis**: #733
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: E2E test files still use `[data-test="..."]` selectors while components were updated to `data-testid="..."` in PR #732
- **Fix Approach**: Replace all `[data-test=` with `[data-testid=` across all E2E test files and update documentation
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

PR #732 standardized component selectors from `data-test=` to `data-testid=`, but the update was incomplete. The component changes were applied across `packages/` (0 occurrences remaining), but **93 test selectors in `apps/e2e/` were never updated**. This causes shard 4 tests (Admin & Invitations) to fail with 6/9 test failures—tests are searching for selectors that no longer exist in the rendered components.

For full details, see diagnosis issue #733.

### Solution Approaches Considered

#### Option 1: Mechanical Find-and-Replace Across All Test Files ⭐ RECOMMENDED

**Description**: Use `sed` or the Edit tool to systematically replace all `[data-test="..."` with `[data-testid="..."` across all 20+ E2E test files in `apps/e2e/tests/`. This is a straightforward text replacement since the selector names themselves remain identical—only the attribute name changes.

**Pros**:
- Deterministic and mechanical—no logic changes required
- Instantly resolves all 93 selector mismatches
- Verifiable with grep (confirm 0 remaining `[data-test="` matches)
- Minimal risk of introducing new bugs
- Fast execution (all files in one command/loop)

**Cons**:
- Requires careful execution to avoid breaking syntax
- Need to verify all files still have valid Playwright syntax after replacement

**Risk Assessment**: low - It's a simple text replacement with clear verification strategy

**Complexity**: simple - Pure string replacement, no logic changes

#### Option 2: Manual Test File Review and Updates

**Description**: Manually review each test file, identify `data-test` usages, and update them one by one. Provides highest confidence but is time-consuming.

**Pros**:
- Allows review of test quality while updating
- Can fix other issues discovered during review
- Maximum visibility into what tests exist

**Cons**:
- Time-consuming (20+ files)
- Error-prone if focusing on content rather than selectors
- High maintenance cost
- Doesn't scale well

**Why Not Chosen**: The mechanical approach is faster, more reliable, and serves the immediate goal. Manual review can be done in follow-up pass if needed.

#### Option 3: Automated Test Migration Tool

**Description**: Build a custom script to parse test files and intelligently update selectors with AST analysis.

**Pros**:
- Reusable for future selector migrations
- Could validate selector existence in components

**Cons**:
- Over-engineered for a mechanical text replacement
- Adds complexity when simple grep/sed suffices
- Requires test environment setup

**Why Not Chosen**: The problem doesn't warrant a new tool. Straightforward text replacement solves it instantly.

### Selected Solution: Mechanical Find-and-Replace Across All Test Files

**Justification**: This is a simple, deterministic fix for an incomplete migration. The previous PR already did the work of updating components—we're just finishing the job. A mechanical find-and-replace is the most efficient, least error-prone approach. Verification is trivial: grep for remaining `[data-test="` (should be 0).

**Technical Approach**:
- Replace all occurrences of `[data-test="` with `[data-testid="` in `apps/e2e/tests/**/*.spec.ts`
- Use the Edit tool to update each file systematically (ensures code quality and readability)
- Verify replacement with grep (confirm 0 remaining mismatches)
- Update documentation files (`apps/e2e/CLAUDE.md` and `apps/e2e/AGENTS.md`) to reflect current selector standards

**Architecture Changes**: None—this is a pure selector name change, no architectural modifications

**Migration Strategy**: No data migration needed; this is a test code fix

## Implementation Plan

### Affected Files

**E2E Test Files** (20+ files requiring selector updates):
- `apps/e2e/tests/admin.spec.ts` - Admin account management tests (contains 15+ selector usages)
- `apps/e2e/tests/invitations.spec.ts` - Team invitation tests (contains 12+ selector usages)
- `apps/e2e/tests/settings.spec.ts` - Settings and configuration tests (contains 8+ selector usages)
- `apps/e2e/tests/billing.spec.ts` - Billing and payment tests (contains 6+ selector usages)
- `apps/e2e/tests/authentication.spec.ts` - Auth flow tests (contains 10+ selector usages)
- All other test files in `apps/e2e/tests/` subdirectories

**Documentation Files**:
- `apps/e2e/CLAUDE.md` - Update selector guidance
- `apps/e2e/AGENTS.md` - Update selector documentation

**Test Configuration**:
- `apps/e2e/playwright.config.ts` - No changes (already uses correct patterns)

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Identify All Test Files With data-test Selectors

Search across the entire E2E test directory to identify which files contain `data-test=` selectors and count occurrences.

- Use grep to find all `[data-test="` patterns in test files
- Document the count and affected files
- Create a list of files that need updates

**Why this step first**: Establishes baseline and prevents missed files during manual updates.

#### Step 2: Replace Selectors in E2E Test Files

For each test file containing `[data-test="` selectors:

- Replace all `[data-test="` with `[data-testid="`
- Verify syntax remains valid after replacement
- Ensure no unintended matches (e.g., in comments or strings)

**Files to update** (comprehensive list):
- `apps/e2e/tests/admin.spec.ts`
- `apps/e2e/tests/invitations.spec.ts`
- `apps/e2e/tests/settings.spec.ts`
- `apps/e2e/tests/billing.spec.ts`
- `apps/e2e/tests/auth/*.spec.ts`
- `apps/e2e/tests/account/*.spec.ts`
- `apps/e2e/tests/team-accounts/*.spec.ts`
- `apps/e2e/tests/accessibility/*.spec.ts`
- `apps/e2e/tests/helpers/*.ts`
- Any other files with selectors

#### Step 3: Verify All Replacements Are Complete

After all replacements:

- Run grep for remaining `[data-test="` patterns (should return 0 matches)
- Verify no accidental replacements in comments or documentation strings
- Ensure all test files have valid syntax (run formatter and linter)

#### Step 4: Update Documentation Files

Update selector guidance in documentation:

- `apps/e2e/CLAUDE.md`: Ensure selector standards are documented
- `apps/e2e/AGENTS.md`: Update any selector recommendations
- Add note about selector migration if needed

#### Step 5: Run E2E Shard 4 Tests

Execute the failing tests to verify they now pass:

```bash
pnpm --filter web-e2e test:shard4
```

Confirm:
- All 9 tests in shard 4 pass
- No selector-related failures remain
- No new failures introduced

#### Step 6: Run Full E2E Suite (All Shards)

Run complete E2E test suite to ensure no regressions in other shards:

```bash
pnpm test:e2e
```

Confirm:
- All shards pass (or at least maintain same pass rate as before)
- No new failures introduced by selector changes
- Overall test stability >95%

## Testing Strategy

### Unit Tests

No unit tests required—this is a test code fix, not application code.

### Integration Tests

No integration tests required.

### E2E Tests

**Shard 4 Regression Test**:
- ✅ Run shard 4 tests (`admin.spec.ts`, `invitations.spec.ts`) and verify all 9 tests pass
- ✅ Selector mismatch errors should be completely resolved
- ✅ No new E2E test failures should appear

**Full Suite Smoke Test**:
- ✅ Run all E2E shards to verify no regressions
- ✅ Existing passing tests should remain passing
- ✅ Test execution time should not increase significantly

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Confirm 0 remaining `[data-test="` patterns in `apps/e2e/tests/` (grep verification)
- [ ] Run `pnpm --filter web-e2e test:shard4` - All 9 tests pass
- [ ] Run `pnpm test:e2e` - All shards pass without regressions
- [ ] Code formatting and linting pass: `pnpm format && pnpm lint`
- [ ] Review admin and invitation test files to confirm replacements are clean
- [ ] Verify no breaking changes to test logic (replacements are text-only)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incomplete Replacements**: Some files might be missed, leaving orphaned `data-test=` selectors
   - **Likelihood**: low
   - **Impact**: medium (remaining tests still fail)
   - **Mitigation**: Use grep post-fix to verify 0 remaining `[data-test="` matches; automate search across all .spec.ts files

2. **Unintended String Replacements**: Replacing `[data-test="` in comments or strings incorrectly
   - **Likelihood**: low (the pattern is specific to selectors)
   - **Impact**: low (unlikely to affect test execution)
   - **Mitigation**: Review replacements carefully; use Edit tool for visibility; verify syntax with formatter

3. **Edge Cases in Selector Usage**: Selectors with newlines, special formatting, or template literals
   - **Likelihood**: low (straightforward HTML attributes)
   - **Impact**: low (syntax checking catches errors)
   - **Mitigation**: Run formatter and linter after all changes

4. **Regression in Other Shards**: Accidentally breaking other test files
   - **Likelihood**: very low (only modifying selector attribute names)
   - **Impact**: medium (test suite fails)
   - **Mitigation**: Run full E2E suite; compare pass rates before/after

**Rollback Plan**:

If tests continue to fail after fix or new failures appear:

1. Revert all changes: `git checkout apps/e2e/tests/`
2. Re-examine diagnosis issue #733 for missed information
3. Check if selectors exist in components: `grep -r "data-testid=" apps/web/`
4. Verify component changes from PR #732 were actually merged
5. If selectors differ from expectations, update tests to match component's actual attributes

**Monitoring** (if needed):

- Monitor E2E test pass rate in CI/CD pipeline post-fix
- Alert if shard 4 suddenly fails again in subsequent runs
- Watch for selector-related errors in test output

## Performance Impact

**Expected Impact**: none

E2E tests don't change in behavior, only in selector query strings. No performance impact expected.

## Security Considerations

**Security Impact**: none

This is purely a test code change with no impact on application security, authentication, or data handling.

## Validation Commands

### Before Fix (Tests Should Fail)

```bash
# Run shard 4 - should show 6/9 failures with selector errors
pnpm --filter web-e2e test:shard4

# Verify 93 remaining data-test selectors in tests
grep -r '\[data-test="' apps/e2e/tests/ | wc -l
# Expected output: 93 (or similar count)
```

**Expected Result**: Shard 4 tests fail with selector-related errors like:
```
Error: locator('[data-test="admin-accounts-table-filter-input"]') did not resolve
```

### After Fix (Tests Should Pass)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run shard 4 - all 9 tests should pass
pnpm --filter web-e2e test:shard4

# Verify NO remaining data-test selectors
grep -r '\[data-test="' apps/e2e/tests/
# Expected output: (empty - no matches)

# Run full E2E suite
pnpm test:e2e
```

**Expected Result**:
- All commands succeed without errors
- Shard 4: All 9 tests pass ✅
- All E2E shards: Pass (maintain existing stability >95%)
- 0 remaining `[data-test="` matches in test files

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify selector consistency in components
grep -r 'data-testid=' apps/web --include="*.tsx" --include="*.ts" | head -20
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

### Existing Tools Used

- `grep` - Verification of replacements
- Playwright - Test execution
- pnpm - Package management and test scripts

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: none

This is a test code fix with no impact on application deployment. Can be merged and deployed independently.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: N/A (test code only, no user-facing changes)

## Success Criteria

The fix is complete when:
- [ ] All 93 `[data-test="` selectors replaced with `[data-testid="`
- [ ] Grep verification shows 0 remaining `[data-test="` in test files
- [ ] Shard 4 tests: All 9 tests pass (`admin.spec.ts`, `invitations.spec.ts`)
- [ ] Full E2E suite: All shards pass without regressions
- [ ] Code formatting and linting passes
- [ ] Documentation updated with current selector standards
- [ ] No new test failures introduced

## Notes

**Related Context from Diagnosis**:
- PR #732 already updated components to use `data-testid=`
- This PR was incomplete—it missed updating the test files themselves
- 93 selector mismatches across 20+ test files in `apps/e2e/`
- This is the root cause of shard 4 test failures

**Selector Pattern Reference**:
From E2E Testing Fundamentals documentation:
- **Priority**: `data-testid` > ARIA roles > Labels > Text content
- **Standard Pattern**: Use `data-testid` for test selectors (confirmed in PR #732)
- **Selector Query**: `[data-testid="element-name"]` (what all tests should use)

**Why This Happened**:
The original PR #732 updated components but didn't include test file updates. This is a common issue in test migrations—easy to miss since tests are often lower priority in the PR review checklist. The fix is simple: complete the migration that was already started.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #733*
