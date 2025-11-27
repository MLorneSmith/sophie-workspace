# Root Cause Analysis: Test Controller Hanging Issue #302

## Issue ID

ISSUE-302

## Investigation Date

2025-09-05

## Summary

The test controller hanging issue at `team-accounts.spec.ts` was not actually an infinite hang but rather a
consistent timeout failure across all tests due to a missing UI element.

## Root Cause Identified

### Primary Issue

All tests in `team-accounts.spec.ts` fail with timeout at line 78 of `team-accounts.po.ts` when waiting for
`[data-test="account-selector-content"]` element to appear after clicking the account selector trigger.

### Specific Problem

```typescript
openAccountsSelector() {
    return expect(async () => {
        await this.page.click('[data-test="account-selector-trigger"]');
        
        return expect(
            this.page.locator('[data-test="account-selector-content"]'),
        ).toBeVisible();
    }).toPass(); // This times out - element never appears
}
```

## Evidence

### Test Execution Results

- All 6 tests timeout at exactly the same line
- Tests complete (don't hang infinitely) but fail after timeout
- Error: "Test timeout of 10000ms exceeded" (or 30000ms with fix)
- The account selector content never becomes visible

### Pattern Analysis

1. **Setup phase**: User signs up successfully
2. **Onboarding**: Completes successfully  
3. **Account creation**: Attempts to open account selector
4. **Failure point**: Account selector content never appears

## Contributing Factors

### 1. Shared Page Context Issue (Fixed)

The test used `beforeAll` hook creating a shared page between tests:

```typescript
// PROBLEMATIC CODE
test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    teamAccounts = new TeamAccountsPageObject(page);
});
```

**Fix Applied**: Each test now gets its own page context:

```typescript
// FIXED CODE
test("user can update their team name (and slug)", async ({ page }) => {
    const teamAccounts = new TeamAccountsPageObject(page);
    await teamAccounts.setup();
```

### 2. Missing Timeout Configuration (Fixed)

The `toPass()` method had no explicit timeout:

```typescript
// FIXED: Added explicit timeout
}).toPass({ timeout: 30000 });
```

### 3. Potential UI Component Issue (Needs Investigation)

The `[data-test="account-selector-content"]` element may:

- Have a different data-test attribute now
- Be conditionally rendered based on different criteria
- Require additional wait conditions or interactions

## Fixes Applied

### Immediate Fixes

1. ✅ Removed shared page context from `beforeAll` hook
2. ✅ Added explicit timeout to `toPass()` methods
3. ✅ File-level timeout wrapper in test controller (workaround)

### Pending Fixes

1. 🔍 Verify the account selector UI component implementation
2. 🔍 Check if data-test attributes are present in production code
3. 🔍 Review onboarding flow completion requirements
4. 🔍 Consider adding wait for navigation after onboarding

## Test Controller Timeout Mechanism

The test controller now includes a file-level timeout that prevents infinite hanging:

```javascript
// CONFIG.fileTimeout: 3 minutes per file
const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
        reject(new Error(
            `File ${file} timed out after ${CONFIG.fileTimeout / 1000}s`
        ));
    }, CONFIG.fileTimeout);
});

fileResult = await Promise.race([filePromise, timeoutPromise]);
```

## Recommendations

### Short-term

1. ✅ Keep the timeout workaround in place
2. 🔧 Investigate why account selector content doesn't appear
3. 🔧 Add debug logging to understand UI state when selector is clicked
4. 🔧 Consider using more resilient selectors (text-based or aria-label)

### Long-term

1. 📋 Refactor tests to use more reliable page object patterns
2. 📋 Add visual regression testing to catch UI changes
3. 📋 Implement better test data cleanup between tests
4. 📋 Consider using Playwright's test fixtures for better isolation

## Verification Steps

### To Verify the Issue

```bash
# Run the test with debug output
cd apps/e2e
npx playwright test tests/team-accounts/team-accounts.spec.ts --debug

# Check if the account selector appears in the UI
# Look for [data-test="account-selector-content"] in browser
```

### To Check UI Implementation

```bash
# Search for the data-test attribute in code
grep -r "account-selector-content" apps/web
grep -r "account-selector-trigger" apps/web
```

## Status

- **Workaround**: ✅ Implemented (timeout mechanism)
- **Root Fix**: ⏳ In Progress (UI element investigation needed)
- **Issue State**: Should remain OPEN until UI element issue is resolved

## Next Steps

1. Investigate the account selector UI component implementation
2. Verify data-test attributes are correctly applied
3. Review recent changes to the account selector component
4. Consider alternative selectors if data-test attributes are missing
5. Add proper test data cleanup between tests

## Related Issues

- #300: Previous occurrence of same issue
- #296: Similar hanging during test discovery
- #299: Test controller integration issues

---
*Generated: 2025-09-05T17:48:00Z*
