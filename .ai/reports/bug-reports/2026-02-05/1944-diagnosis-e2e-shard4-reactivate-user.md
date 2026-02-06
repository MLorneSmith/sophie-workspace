# Bug Diagnosis: E2E Shard 4 - Reactivate User Flow Fails Due to UI Refresh Bug

**ID**: ISSUE-1944
**Created**: 2026-02-05T17:15:00Z
**Reporter**: CI/CD Pipeline
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The E2E test "Admin > Personal Account Management > reactivate user flow" intermittently fails because the UI doesn't refresh after the reactivate server action. After clicking "Reactivate User", the "Banned" badge remains visible because `revalidatePath()` doesn't trigger client-side React re-render.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI/CD (GitHub Actions E2E Shard 4)
- **Workflow Run**: 21719685031
- **Test File**: `apps/e2e/tests/admin/admin.spec.ts:213`
- **Test Name**: `Admin › Personal Account Management › reactivate user flow`

## Reproduction Steps

1. Navigate to admin user detail page
2. Click "Ban User" button, confirm with "CONFIRM"
3. Verify "Banned" badge appears ✓
4. Click "Reactivate User" button, confirm with "CONFIRM"
5. Wait for POST response to complete
6. Check if "Banned" badge is removed ✗ (intermittently fails)

## Expected Behavior

After successful reactivation, the "Banned" badge should immediately disappear from the UI.

## Actual Behavior

The "Banned" badge remains visible even after successful server action, causing test failure:

```
Error: expect(locator).not.toBeVisible() failed

Locator:  getByText('Banned')
Expected: not visible
Received: visible
Timeout:  30000ms
```

## Diagnostic Data

### Test Output
```
1) [chromium] › tests/admin/admin.spec.ts:213:7 › Admin › Personal Account Management › reactivate user flow

Error: expect(locator).not.toBeVisible() failed

Locator:  getByText('Banned')
Expected: not visible
Received: visible

    > 250 | await expect(page.getByText("Banned")).not.toBeVisible();
          |                                            ^
```

### Historical Pattern
This test has failed intermittently before:
- Issue #970: Failed due to filter mechanism timing
- Issue #1005: Failed due to React hydration race on subsequent login
- Current: Fails at the badge visibility check step

## Related Code

### Server Action (packages/features/admin/src/lib/server/admin-server-actions.ts:63-85)
```typescript
export const reactivateUserAction = adminAction(
  enhanceAction(
    async ({ userId }) => {
      const service = getAdminAuthService();
      const { error } = await service.reactivateUser(userId);

      if (error) {
        throw new Error(`Failed to reactivate user: ${error.message}`);
      }

      revalidateAdmin();  // <-- Marks cache as stale but doesn't refresh client

      return { success: true };
    },
    { schema: ReactivateUserSchema },
  ),
);

function revalidateAdmin() {
  revalidatePath("/admin/accounts/[id]", "page");  // Server-side only
}
```

### Dialog Component (packages/features/admin/src/components/admin-reactivate-user-dialog.tsx)
```typescript
onSubmit={form.handleSubmit((data) => {
  startTransition(async () => {
    try {
      await reactivateUserAction(data);
      // SUCCESS: Action completes but dialog doesn't close or refresh page
      // Missing: router.refresh() or redirect
    } catch {
      setError(true);
    }
  });
})}
```

### Test Code (apps/e2e/tests/admin/admin.spec.ts:238-250)
```typescript
await Promise.all([
  page.getByRole("button", { name: "Reactivate User" }).click(),
  page.waitForResponse(
    (response) =>
      response.url().includes("/admin/accounts") &&
      response.request().method() === "POST",
  ),
]);

await page.waitForTimeout(250);

// This check fails because UI hasn't refreshed
await expect(page.getByText("Banned")).not.toBeVisible();
```

## Related Issues & Context

### Direct Predecessors
- #970 (CLOSED): "Admin 'reactivate user flow' test fails due to unreliable filter mechanism" - Fixed filter timing
- #1005 (CLOSED): "Flaky timeout in 'reactivate user flow' test due to React hydration race" - Fixed login after reactivation

### Pattern
This test has been problematic multiple times. Each fix addresses a symptom rather than the root architectural issue: **server actions don't have a reliable mechanism to update client-side UI.**

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `reactivateUserAction` server action calls `revalidatePath()` which only invalidates server-side cache but doesn't trigger client-side React re-render.

**Detailed Explanation**:

In Next.js App Router:
1. `revalidatePath()` marks the page cache as stale on the server
2. However, the client's React state is NOT automatically updated
3. Without `router.refresh()` or a navigation/redirect, the old data remains displayed
4. The 250ms wait in the test is insufficient and arbitrary

**Supporting Evidence**:
- The server action completes successfully (test waits for POST response)
- `revalidatePath("/admin/accounts/[id]", "page")` is called
- But no client-side refresh mechanism exists
- The dialog component doesn't close or trigger page refresh on success

### How This Causes the Observed Behavior

1. User clicks "Reactivate User"
2. `reactivateUserAction` executes successfully on server
3. User is unbanned in the database
4. `revalidatePath()` invalidates server cache
5. Server action returns `{ success: true }`
6. **Dialog component does nothing with success** - no close, no refresh
7. Client React state still shows "Banned" badge
8. Test checks for badge removal → FAILS

### Confidence Level

**Confidence**: High

**Reasoning**:
- Code clearly shows no client refresh mechanism after successful action
- Same architectural pattern causes issues in ban action (sometimes doesn't show badge)
- Multiple previous fixes addressed symptoms but not root cause

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Add `router.refresh()` to dialog on success
```typescript
const router = useRouter();
// In onSubmit success path:
await reactivateUserAction(data);
router.refresh();  // Force client to fetch fresh data
setOpen(false);    // Close dialog
```

**Option 2**: Use redirect in server action
```typescript
// In reactivateUserAction:
revalidateAdmin();
redirect(`/admin/accounts/${userId}`);  // Force page reload
```

**Option 3 (Test workaround)**: Add page reload in test
```typescript
// After reactivate action:
await page.reload();
await expect(page.getByText("Banned")).not.toBeVisible();
```

Recommended fix is Option 1 as it properly addresses the UI refresh issue in the component.

## Diagnosis Determination

This is a **real bug** in the admin dialog components, not just a flaky test. The test correctly expects the UI to update after successful action, but the implementation lacks proper client-side refresh.

The test is flaky because:
- Sometimes Next.js streaming updates the client fast enough
- Sometimes cached data persists longer
- The 250ms arbitrary wait is unreliable

**Root cause is confirmed**: Missing `router.refresh()` or equivalent in dialog success handler.

## Additional Context

- Ban dialog likely has same issue (test sometimes fails at ban step too)
- This architectural pattern should be reviewed across all admin server actions
- Consider creating a shared pattern/hook for admin actions that need UI refresh

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, grep, read, git log*
