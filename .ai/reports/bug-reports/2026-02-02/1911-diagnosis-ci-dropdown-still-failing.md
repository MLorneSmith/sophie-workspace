# Bug Diagnosis: CI Dropdown Tests Still Failing After Fix

**ID**: ISSUE-pending
**Created**: 2026-02-02T16:30:00Z
**Reporter**: CI System
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The Dev Integration Tests workflow continues to fail after implementing issue #1910's fix (increasing wait times from 100ms to 350ms). Two tests are failing:
1. `dropdown email remains visible on fast interactions` (line 262)
2. `settings page shows user email` (line 213)

The root cause is different from what was diagnosed in #1909 - the issue is NOT about animation timing after closing, but about Radix UI's `DismissableLayer` blocking pointer events on the `<html>` element **when the dropdown is OPEN**.

## Environment

- **Application Version**: Commit 60c65b50d
- **Environment**: CI (GitHub Actions)
- **Browser**: Chromium (Playwright)
- **Node Version**: v20.10.0
- **Last Working**: Never (test was added in e2f85303a and has been failing since)

## Reproduction Steps

1. Push code to `dev` branch
2. CI triggers Dev Integration Tests workflow
3. Tests run against deployed Vercel preview
4. `dropdown email remains visible on fast interactions` fails at line 288

## Expected Behavior

The test should be able to click the dropdown trigger multiple times to open/close/open the dropdown.

## Actual Behavior

When the dropdown is open, clicking the trigger button to close it fails with:
```
<html lang="en" class="...">...</html> intercepts pointer events
```

The test times out after 180 seconds of retrying clicks.

## Diagnostic Data

### Console Output
```
locator resolved to <button type="button" data-state="open" aria-haspopup="menu" aria-expanded="true" ...>
attempting click action
  waiting for element to be visible, enabled and stable
  element is visible, enabled and stable
  scrolling into view if needed
  done scrolling
  <html lang="en" class="bg-background min-h-screen antialiased ...">...</html> intercepts pointer events
retrying click action
  waiting for element to be visible, enabled and stable
  (347 retries, all fail with same error)
```

### CI Run Details
- **Failed Run**: 21597746287
- **Workflow**: Dev Integration Tests
- **Timestamp**: 2026-02-02T16:10:41Z
- **Test Duration**: 9m 45s

## Error Stack Traces
```
Error: locator.click: Test timeout of 180000ms exceeded.
Call log:
  - waiting for locator('[data-testid="account-dropdown"]')
  - locator resolved to <button type="button" data-state="open" ...>
  - 2 × waiting for element to be visible, enabled and stable
  - 346 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <html lang="en" class="...">...</html> intercepts pointer events

    at apps/e2e/tests/account/account-simple.spec.ts:288:32
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/account/account-simple.spec.ts` (lines 262-309)
- **Recent Changes**:
  - 60c65b50d fix(e2e): increase dropdown animation wait times to 350ms
  - e2f85303a fix(e2e): resolve dropdown email visibility timing issue (added the test)
- **Component**: Radix UI DropdownMenu with DismissableLayer

## Related Issues & Context

### Direct Predecessors
- #1910 (CLOSED): "Bug Fix: Regression Test Fails - Rapid Dropdown Clicks Cause Pointer Intercept" - Fix was incomplete
- #1909 (CLOSED): "Bug Diagnosis: Regression Test Fails - Rapid Dropdown Clicks Cause Pointer Intercept" - Diagnosis was incorrect
- #1908 (CLOSED): Original issue about dropdown email visibility

### Historical Context
The regression test was added in e2f85303a to verify the fix for #1908. The test has never passed in CI - the fix in #1910 (increasing wait times) did not address the actual root cause.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The test attempts to click the dropdown trigger while the dropdown is open, but Radix UI's `DismissableLayer` component applies `pointer-events: none` to the `<html>` element when the dropdown menu is visible, blocking all clicks outside the menu.

**Detailed Explanation**:

When a Radix UI DropdownMenu is open, the `DismissableLayer` component:
1. Creates an invisible overlay that captures pointer events
2. Applies `pointer-events: none` to the `<html>` element
3. Only allows interactions within the menu content

This is **by design** to ensure clicks outside the menu close it via the dismissable layer, not by clicking through to elements behind it.

The test flow is:
1. Click trigger → dropdown opens (success)
2. Wait 350ms
3. Click trigger → **FAILS** because the trigger is "outside" the open menu, and the `<html>` element has `pointer-events: none`

**Supporting Evidence**:
- CI logs show `data-state="open"` when the click fails - dropdown IS open
- Error is `<html>` intercepts pointer events, not the dismissable layer itself
- The click succeeds in step 1 when dropdown is closed (`data-state="closed"`)
- 347 retries all fail identically - this is not a timing issue

### How This Causes the Observed Behavior

1. First click: Dropdown is closed → click succeeds → dropdown opens
2. 350ms wait: Irrelevant because the issue is structural, not timing-based
3. Second click: Dropdown is open → `DismissableLayer` has `pointer-events: none` on `<html>` → click is blocked → timeout

### Confidence Level

**Confidence**: High

**Reasoning**:
- The CI logs explicitly show `data-state="open"` when clicks fail
- The blocking element is `<html>`, which is where Radix applies `pointer-events: none`
- This matches Radix UI's documented DismissableLayer behavior
- The 350ms wait was irrelevant because the dropdown successfully opened (it's open when clicks fail)

## Why Previous Diagnosis Was Incorrect

The diagnosis in #1909 stated:
> "Radix UI's close animation duration and dismissable layer cleanup require ~200-300ms"

This was incorrect because:
1. The dropdown never CLOSES - it's OPEN when clicks fail
2. The issue isn't animation timing - it's the structural behavior of DismissableLayer
3. Waiting longer doesn't help because the pointer-events blocking persists while the dropdown is open

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Use `force: true` to bypass pointer-events blocking
```typescript
await accountDropdownTrigger.click({ force: true }); // Close
```

**Option 2**: Wait for menu to be hidden after clicking (menu click closes it)
```typescript
await accountDropdownTrigger.click(); // Open
await page.locator('[role="menu"]').click(); // Click menu to dismiss
await expect(page.locator('[role="menu"]')).toBeHidden();
await accountDropdownTrigger.click(); // Open again
```

**Option 3**: Remove the rapid-click regression test entirely
The original fix (#1908) verified email visibility works - the rapid-click test may be testing Radix UI behavior rather than our application code.

**Option 4**: Press Escape to close instead of clicking
```typescript
await accountDropdownTrigger.click(); // Open
await page.keyboard.press('Escape'); // Close via keyboard
await page.waitForTimeout(100); // Brief wait for close
await accountDropdownTrigger.click(); // Open again
```

## Diagnosis Determination

This is a **misdiagnosed issue**. The original diagnosis (#1909) focused on animation timing, but the actual problem is Radix UI's `DismissableLayer` design that prevents clicking the trigger to close an open dropdown. The fix in #1910 (increasing wait times) was ineffective because it addressed the wrong root cause.

The test needs to either:
1. Use `force: true` on clicks when the dropdown is open
2. Use a different method to close the dropdown (Escape key, clicking elsewhere)
3. Be removed as it tests Radix UI internals rather than application functionality

## Additional Context

The second failing test (`settings page shows user email`) is likely a cascading failure from the first test in the serial test suite, or it may have a similar root cause with dropdown interactions.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow logs), Read (test file), Grep (log analysis)*
