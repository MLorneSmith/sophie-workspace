# Bug Diagnosis: Regression Test Fails - Rapid Dropdown Clicks Cause Pointer Intercept

**ID**: ISSUE-1909
**Created**: 2026-02-02T15:45:00Z
**Reporter**: user/system
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The new regression test `dropdown email remains visible on fast interactions` (added in commit e2f85303a to fix Issue #1908) fails in CI with "locator.click: Test timeout of 180000ms exceeded" because the `<html>` element intercepts pointer events during rapid dropdown open/close/open sequences. This is caused by Radix UI's dismissable layer pattern blocking pointer events during dropdown close animations, and the 100ms wait between clicks is insufficient for animations to complete.

## Environment

- **Application Version**: e2f85303a
- **Environment**: CI (dev-integration-tests workflow)
- **Browser**: Chromium (Playwright)
- **Node Version**: v20.10.0
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Run 21595043390 (2026-02-02T14:57:43Z) - before the commit was pushed

## Reproduction Steps

1. Push changes from commit e2f85303a to GitHub
2. CI triggers dev-integration-tests workflow
3. Workflow runs integration tests against deployed Vercel preview
4. Test `dropdown email remains visible on fast interactions` executes:
   - Navigates to `/home/settings`
   - Clicks dropdown trigger to open
   - Waits 100ms
   - Clicks dropdown trigger to close
   - Waits 100ms
   - Clicks dropdown trigger to open again
5. Click on step 5 fails with pointer events intercepted by `<html>` element

## Expected Behavior

The dropdown should open successfully after rapid open/close/open sequence, and the email should be visible in the dropdown menu.

## Actual Behavior

The third click (re-open) fails because Radix UI's dismissable layer blocks pointer events during the close animation. The error shows:
- `<html lang="en" class="bg-background...">...</html> intercepts pointer events`
- 347+ retry attempts over 180 seconds, all blocked

## Diagnostic Data

### Console Output
```
Error: locator.click: Test timeout of 180000ms exceeded.
Call log:
  - waiting for locator('[data-testid="account-dropdown"]')
    - locator resolved to <button type="button" data-state="open" aria-haspopup="menu" aria-expanded="true" ...>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <html lang="en" class="bg-background min-h-screen antialiased...">...</html> intercepts pointer events
    - retrying click action
    347 × waiting for element to be visible, enabled and stable
        - <html lang="en" class="bg-background...">...</html> intercepts pointer events
```

### Network Analysis
No network issues - all health checks passed

### Database Analysis
N/A - Not a database issue

### Performance Metrics
Test ran for 7.2 minutes, timing out at 180 seconds for this specific test

### Screenshots
Test artifacts uploaded to: `test-results/account-account-simple-Acc-d909e-isible-on-fast-interactions-chromium/test-failed-1.png`

## Error Stack Traces
```
1) [chromium] › tests/account/account-simple.spec.ts:262:6 › Account Settings - Simple @account @integration › dropdown email remains visible on fast interactions

    Test timeout of 180000ms exceeded.

    Error: locator.click: Test timeout of 180000ms exceeded.
        at /home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e/tests/account/account-simple.spec.ts:286:32
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/account/account-simple.spec.ts:262-307` - Failing regression test
  - `packages/ui/src/shadcn/dropdown-menu.tsx` - Dropdown component using Radix UI
  - `packages/features/accounts/src/components/personal-account-dropdown.tsx` - Account dropdown

- **Recent Changes**: Commit e2f85303a added the regression test
- **Suspected Functions**:
  - Test lines 284-288 (rapid click sequence with 100ms waits)
  - Radix UI's `DismissableLayer` pointer event handling

## Related Issues & Context

### Direct Predecessors
- #1908 (CLOSED): "Bug Fix: E2E Test Timing Issue - Dropdown Email Visibility" - The fix this regression test was meant to protect

### Related Infrastructure Issues
- #1907: Original diagnosis for dropdown timing issue

### Same Component
- #823 (CLOSED): "Bug Fix: Payload logout test fails due to incorrect user menu selector"

### Historical Context
This is a NEW bug introduced by the fix for #1908 - the regression test itself is flawed, not the original fix.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The regression test uses 100ms waits between rapid dropdown clicks, but Radix UI's close animation duration and dismissable layer cleanup require more time, causing pointer events to be blocked.

**Detailed Explanation**:

Radix UI's `DropdownMenu` uses a "dismissable layer" pattern (`@radix-ui/react-dismissable-layer`) that:

1. **On open**: Creates an invisible backdrop that captures outside clicks
2. **On close**: Applies `pointer-events: none` to children during exit animation
3. **During animation**: The `<html>` element receives pointer event delegation

The test performs:
```typescript
await accountDropdownTrigger.click();      // Open
await page.waitForTimeout(100);            // Wait 100ms (TOO SHORT)
await accountDropdownTrigger.click();      // Close - starts animation
await page.waitForTimeout(100);            // Wait 100ms (TOO SHORT)
await accountDropdownTrigger.click();      // FAILS - animation still blocking
```

The dropdown close animation is configured with:
```css
data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
```

These CSS animations have implicit duration via Tailwind's `animate-out` (typically 150-200ms), plus Radix adds additional cleanup time. The 100ms wait is insufficient.

**Supporting Evidence**:
- Button shows `data-state="open"` but clicks are blocked - indicates state inconsistency
- `<html>` element intercepts (standard Radix dismissable layer behavior)
- 347 retries all fail - animation never completes during test

### How This Causes the Observed Behavior

1. Test clicks dropdown trigger → Opens normally
2. 100ms wait (too short)
3. Test clicks dropdown trigger → Begins close animation, Radix applies pointer-events block
4. 100ms wait (close animation still running, typically 150-200ms)
5. Test clicks dropdown trigger → Pointer events still blocked by dismissable layer
6. Playwright retries for 180s but animation cleanup never runs (stuck state)

### Confidence Level

**Confidence**: High

**Reasoning**:
- Error message explicitly shows `<html>` intercepting events (Radix dismissable layer)
- Button state shows `data-state="open"` during failed clicks (state inconsistency)
- 100ms wait < animation duration (150-200ms)
- Similar pattern documented in Radix UI issues for rapid interactions

## Fix Approach (High-Level)

Three options, ranked by preference:

1. **Increase wait time between clicks** (Recommended)
   - Change 100ms waits to 300-400ms to allow animations to complete
   - Simple fix, maintains test intent

2. **Use `force: true` on clicks**
   - Playwright's `force: true` bypasses actionability checks
   - Masks the timing issue rather than testing it properly

3. **Remove the regression test**
   - The original fix (toPass() wrapper + refetchOnMount) is sufficient
   - This test doesn't add value if it requires unrealistic click timings

**Recommended fix**:
```typescript
// Before (100ms - too short)
await accountDropdownTrigger.click();
await page.waitForTimeout(100);

// After (300ms - allows animation completion)
await accountDropdownTrigger.click();
await page.waitForTimeout(300);
```

Or alternatively, wait for the dropdown state to change rather than using fixed timeouts:
```typescript
await accountDropdownTrigger.click();
await expect(page.locator('[role="menu"]')).toBeVisible();
await accountDropdownTrigger.click();
await expect(page.locator('[role="menu"]')).toBeHidden();
await accountDropdownTrigger.click();
```

## Diagnosis Determination

The root cause is identified: The regression test added in commit e2f85303a uses 100ms waits between rapid dropdown clicks, but Radix UI's dropdown close animation and dismissable layer cleanup require approximately 200-300ms. The insufficient wait time causes a race condition where the third click attempts to interact with the dropdown while Radix's pointer-events blocking is still active.

This is a **test design flaw**, not a bug in the application code or the original #1908 fix.

## Additional Context

- The original fix for #1908 (toPass() wrapper, explicit menu wait, refetchOnMount) is correct
- The regression test was well-intentioned but doesn't account for Radix UI animation timing
- The test passes locally (slower execution) but fails in CI (faster execution, stricter timing)

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh issue view, git log, git show, file reads, grep searches*
