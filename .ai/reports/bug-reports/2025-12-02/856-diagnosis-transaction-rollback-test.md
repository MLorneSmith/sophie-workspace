# Bug Diagnosis: Payload E2E Transaction Rollback Test Fails Due to Text Selector Mismatch

**ID**: ISSUE-856
**Created**: 2025-12-02T20:15:00Z
**Reporter**: system (test execution)
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The E2E test `should handle transaction rollback on error` in Payload CMS shard 7 fails despite the expected error message being visible on screen. The test uses exact-match text selectors that don't account for Payload 3.x's actual error message formatting (trailing period).

## Environment

- **Application Version**: SlideHeroes (Payload CMS 3.65.0)
- **Environment**: development (localhost:3021)
- **Browser**: Chromium (Playwright)
- **Node Version**: 22.x
- **Database**: PostgreSQL via Supabase
- **Last Working**: Unknown (test may have never worked with Payload 3.x)

## Reproduction Steps

1. Run E2E shard 7: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 7`
2. Test `should handle transaction rollback on error` executes
3. Test creates a user with duplicate email (`michael@slideheroes.com`)
4. Payload displays error message: "A user with the given email is already registered."
5. Test looks for text without trailing period: `"A user with the given email is already registered"`
6. Selector fails to match, test fails

## Expected Behavior

Test should detect the visible error message and pass when validation correctly prevents duplicate user creation.

## Actual Behavior

Test fails with `expect(errorVisible).toBeTruthy()` receiving `false`, even though both error messages are clearly visible in the screenshot:
1. Inline error: "A user with the given email is already registered." (next to email field)
2. Toast notification: "The following field is invalid: email" (bottom right)

## Diagnostic Data

### Console Output
```
Error: expect(received).toBeTruthy()
Received: false

  188 |       }
  189 |     }
> 190 |     expect(errorVisible).toBeTruthy();
      |                          ^
  191 |
  192 |     // Verify the duplicate was not created
  193 |     await collectionsPage.navigateToCollection("users");
    at /home/msmith/projects/2025slideheroes/apps/e2e/tests/payload/payload-database.spec.ts:190:24
```

### Network Analysis
```
No network errors - the form submission completes and validation fires correctly.
The issue is purely in test selector matching.
```

### Database Analysis
```
N/A - Database is working correctly. The validation error is properly triggered
when attempting to create a duplicate email, which is expected behavior.
```

### Performance Metrics
```
Test executes in ~2-3 seconds before failing at assertion.
No performance issues detected.
```

### Screenshots
Screenshot shows both error messages clearly visible:
- Inline error next to email field with red background
- Toast notification at bottom right corner
- File: `apps/e2e/test-results/payload-payload-database-P-b65db-ansaction-rollback-on-error-payload/test-failed-1.png`

## Error Stack Traces
```
Error: expect(received).toBeTruthy()
Received: false
    at /home/msmith/projects/2025slideheroes/apps/e2e/tests/payload/payload-database.spec.ts:190:24
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/payload/payload-database.spec.ts` (lines 151-199)
- **Recent Changes**: Commit 82424cbc7 fixed related selector issues but didn't address this test
- **Suspected Functions**: Test error message detection logic (lines 177-189)

## Related Issues & Context

### Direct Predecessors
- #854 (CLOSED): "Bug Fix: Payload CMS E2E Tests - UI Selector Mismatches and API Endpoint Issues" - Fixed validation selectors in different tests but not this one

### Similar Symptoms
- #836 (CLOSED): "Bug Fix: Payload CMS E2E Save Button Selector Mismatch" - Same pattern of Payload 3.x UI mismatch
- #847 (CLOSED): "Bug Fix: Payload CMS E2E Save Button Selector Strict Mode Violations" - Similar selector issues

### Historical Context
This is part of an ongoing pattern of Payload 3.x compatibility issues with E2E tests. The upgrade to Payload 3.x changed many UI element structures and text formats that tests weren't updated for.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The test uses exact-match text selectors that require the error message without a trailing period, but Payload 3.x renders the error message WITH a trailing period.

**Detailed Explanation**:

The test code at `apps/e2e/tests/payload/payload-database.spec.ts:177-181` uses these selectors:
```typescript
const errorMessages = [
    page.locator('text="A user with the given email is already registered"'),  // Missing period
    page.locator('text="The following field is invalid: email"'),
    page.locator('[class*="error"]'),
];
```

However, Payload 3.x renders the error message as:
- "A user with the given email is already registered**.**" (WITH trailing period)

The Playwright `text=` locator with exact quotes performs an exact string match, so "already registered" does NOT match "already registered."

**Supporting Evidence**:
- Screenshot clearly shows: "A user with the given email is already registered." with period
- Test fails because none of the three locators match:
  1. First locator: String mismatch (missing period)
  2. Second locator: This text IS on screen but may be in toast that disappears quickly
  3. Third locator: `[class*="error"]` should work but timeout is only 1000ms and toast may have dismissed

### How This Causes the Observed Behavior

1. Test creates duplicate user form submission
2. Payload validates and displays error message (with trailing period)
3. Test iterates through locators with 1000ms timeout each
4. First locator fails (exact string mismatch due to period)
5. Second locator may fail (toast already dismissed after 1000ms)
6. Third locator may fail (no matching class attribute in time)
7. All three fail -> `errorVisible = false`
8. Assertion `expect(errorVisible).toBeTruthy()` fails

### Confidence Level

**Confidence**: High

**Reasoning**: The screenshot provides irrefutable evidence that:
1. The error message IS displayed
2. The displayed text includes a trailing period
3. The test selector expects text WITHOUT the period
4. This is a simple string matching failure, not a timing or UI issue

## Fix Approach (High-Level)

1. Change first selector from exact match to partial/regex match:
   ```typescript
   page.locator('text=/A user with the given email is already registered/')
   ```
   OR add the period:
   ```typescript
   page.locator('text="A user with the given email is already registered."')
   ```

2. Consider using a more robust selector like `getByText()` with substring matching:
   ```typescript
   page.getByText('already registered', { exact: false })
   ```

3. Increase timeout from 1000ms to allow for toast animation timing

## Diagnosis Determination

The root cause is a **text selector mismatch** - the test expects the error message without a trailing period, but Payload 3.x includes the period. This is a straightforward test fix requiring updated selectors.

This is part of an ongoing pattern of Payload 3.x compatibility issues that have been addressed piecemeal. Consider a systematic audit of all Payload E2E text selectors.

## Additional Context

- 42 out of 43 tests in shard 7 pass, indicating the overall Payload E2E infrastructure is working well
- This is the only failing test, isolated to a single selector issue
- The fix is low-risk and localized to the test file only

---
*Generated by Claude Debug Assistant*
*Tools Used: safe-test-runner.sh, Read (test file, screenshot), Bash (git log, gh issue list)*
