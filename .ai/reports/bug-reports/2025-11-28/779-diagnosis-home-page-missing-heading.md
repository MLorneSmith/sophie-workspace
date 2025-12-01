# Bug Diagnosis: Home page missing h1/h2 heading element fails accessibility test

**ID**: ISSUE-779
**Created**: 2025-11-28T23:30:00Z
**Reporter**: automated test (shard 5 - accessibility)
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The accessibility test "All pages have proper document structure" fails because the `/home` dashboard page does not render any heading elements (`<h1>` or `<h2>`). The `HomeLayoutPageHeader` component receives a `title` prop but does not pass it to the underlying `PageHeader` component, which means the `<h1>` element is never rendered.

## Environment

- **Application Version**: dev branch
- **Environment**: development (local E2E tests)
- **Browser**: Chromium (Playwright)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown (may have always been broken)

## Reproduction Steps

1. Run E2E shard 5: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh --shard 5`
2. Observe test "All pages have proper document structure" fails
3. Or manually: Login to the app and navigate to `/home` - inspect the DOM to confirm no `<h1>` or `<h2>` elements exist

## Expected Behavior

The home page should render a heading element (`<h1>`) with the title "Home" (from `common:routes.home` translation key), providing proper document structure for accessibility and SEO.

## Actual Behavior

The home page only displays "Welcome to your home page" as a description in a `<div>` element. No heading (`<h1>` or `<h2>`) is rendered, causing the accessibility test to fail with:
```
Error: expect(received).toBeTruthy()
Received: false
```

## Diagnostic Data

### Console Output
```
[2025-11-28T23:23:35] INFO: ❌ Accessibility  17 passed, 1 failed, 2 skipped
Error at accessibility-hybrid-simple.spec.ts:144:23
expect(hasHeading).toBeTruthy();
```

### Network Analysis
N/A - not a network issue

### Database Analysis
N/A - not a database issue

### Performance Metrics
N/A

### Screenshots
- Test failure screenshot: `apps/e2e/test-results/accessibility-accessibilit-cb7d2-e-proper-document-structure-chromium-retry1/test-failed-1.png`
- Shows `/home` page with sidebar navigation and "Welcome to your home page" text but no visible heading

## Error Stack Traces
```
Error: expect(received).toBeTruthy()
Received: false

  142 | // At least have some content structure
  143 | expect(hasContentArea).toBeGreaterThan(0);
> 144 | expect(hasHeading).toBeTruthy();
      |                    ^
  145 | }

at /home/msmith/projects/2025slideheroes/apps/e2e/tests/accessibility/accessibility-hybrid-simple.spec.ts:144:23
```

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/_components/home-page-header.tsx` (primary bug location)
  - `apps/web/app/home/(user)/page.tsx` (page using the component)
  - `packages/ui/src/makerkit/page.tsx` (PageHeader component that correctly handles title)
  - `apps/e2e/tests/accessibility/accessibility-hybrid-simple.spec.ts` (failing test)

- **Recent Changes**: No recent changes to these files
- **Suspected Functions**: `HomeLayoutPageHeader` function in `home-page-header.tsx`

## Related Issues & Context

### Direct Predecessors
None found - this appears to be a new discovery

### Related Infrastructure Issues
None

### Similar Symptoms
None found

### Same Component
None found

### Historical Context
This may have been an issue since the component was created.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `HomeLayoutPageHeader` wrapper component receives a `title` prop but fails to pass it to the underlying `PageHeader` component, resulting in no `<h1>` element being rendered.

**Detailed Explanation**:

The bug is in `apps/web/app/home/(user)/_components/home-page-header.tsx`:

```tsx
export function HomeLayoutPageHeader(
  props: React.PropsWithChildren<{
    title: string | React.ReactNode;      // <-- title is accepted
    description: string | React.ReactNode;
  }>,
) {
  return (
    <PageHeader description={props.description}>  // <-- title is NOT passed!
      {props.children}
    </PageHeader>
  );
}
```

The `PageHeader` component in `packages/ui/src/makerkit/page.tsx` correctly handles the `title` prop:

```tsx
export function PageHeader({ children, title, description, ... }) {
  return (
    <div ...>
      ...
      <If condition={title}>
        <PageTitle>{title}</PageTitle>  // <-- Renders <h1> when title is provided
      </If>
    </div>
  );
}
```

But since `HomeLayoutPageHeader` never passes `title` to `PageHeader`, the `<h1>` is never rendered.

**Supporting Evidence**:
- Screenshot shows page with only "Welcome to your home page" description (no heading)
- Error context shows page structure has `generic` elements but no `heading` role elements
- Test failure at line 144 confirms `hasHeading` is `false`
- Code review confirms `title` prop is not forwarded

### How This Causes the Observed Behavior

1. User navigates to `/home` (or `/` which redirects to `/home` for authenticated users)
2. `UserHomePage` renders `HomeLayoutPageHeader` with `title={<Trans i18nKey="common:routes.home" />}`
3. `HomeLayoutPageHeader` receives `title` but only passes `description` and `children` to `PageHeader`
4. `PageHeader` has `title=undefined` so the `<If condition={title}>` block doesn't render
5. No `<h1>` element appears in the DOM
6. Accessibility test searches for `h1` and `h2` elements, finds none, test fails

### Confidence Level

**Confidence**: High

**Reasoning**: Direct code inspection shows the missing prop forwarding. The component signature accepts `title` but the implementation ignores it completely. This is a clear prop-forwarding omission, not a conditional or runtime issue.

## Fix Approach (High-Level)

Add `title` prop forwarding in `HomeLayoutPageHeader`:

```tsx
return (
  <PageHeader title={props.title} description={props.description}>
    {props.children}
  </PageHeader>
);
```

This is a one-line fix that will make the `<h1>` element render on all pages using `HomeLayoutPageHeader`.

## Diagnosis Determination

Root cause definitively identified: The `HomeLayoutPageHeader` component has a prop-forwarding bug where it accepts a `title` prop in its interface but does not pass it to the underlying `PageHeader` component. This causes no heading element to be rendered, failing the accessibility document structure test.

## Additional Context

- The test iterates through `/`, `/auth/sign-in`, `/auth/sign-up` but uses pre-authenticated storage state
- For authenticated users, `/` redirects to `/home`, which is why the failure screenshot shows the dashboard
- The auth pages (`/auth/sign-in`, `/auth/sign-up`) may also lack headings and should be verified after fixing `/home`
- This accessibility issue also impacts SEO since search engines expect proper heading hierarchy

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash, screenshot analysis*
