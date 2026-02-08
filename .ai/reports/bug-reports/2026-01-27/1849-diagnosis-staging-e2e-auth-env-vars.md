# Bug Diagnosis: Staging E2E Tests Fail - Missing NEXT_PUBLIC_AUTH_PASSWORD Environment Variable

**ID**: ISSUE-1849
**Created**: 2026-01-27T15:33:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The staging-deploy workflow's E2E tests are failing because the auth form fields (email/password inputs) are not rendered. The root cause is that `NEXT_PUBLIC_AUTH_PASSWORD` environment variable is missing from the test-setup job's build step, causing the password authentication provider to be disabled at build time. Since `NEXT_PUBLIC_*` variables are baked into the client bundle during build, the sign-in/sign-up pages only show OAuth buttons without email/password form fields.

## Environment

- **Application Version**: dev branch (commit 4eac898ea)
- **Environment**: staging CI (GitHub Actions)
- **Browser**: Chromium (Playwright 1.57.0)
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown - this may have been a regression from recent CI config changes

## Reproduction Steps

1. Push to staging branch to trigger staging-deploy workflow
2. Wait for test-setup job to complete (builds application)
3. Observe E2E test shards 1-6 fail with element not found errors
4. Check Playwright trace - sign-in/sign-up pages show "Or continue with" Google button but NO email/password form fields

## Expected Behavior

The sign-in and sign-up pages should display:
- Email input field (`data-testid="sign-in-email"` / `data-testid="sign-up-email"`)
- Password input field
- Submit button
- OAuth buttons (Google)

## Actual Behavior

The sign-in and sign-up pages only display:
- "Sign in to your account" / "Create an account" heading
- "Or continue with" text
- Google sign-in button
- Link to switch between sign-in/sign-up

**NO email/password form fields are rendered.**

## Diagnostic Data

### Console Output
```
Playwright Trace (shard 1):
{
  "type": "after",
  "callId": "call@12",
  "error": {
    "name": "Expect",
    "message": "Expect failed"
  },
  "result": {
    "matches": false,
    "log": [
      "  - Expect \"toBeVisible\" with timeout 10000ms",
      "  - waiting for locator('[data-testid=\"sign-up-email\"]'"
    ],
    "errorMessage": "Error: element(s) not found",
    "timedOut": true
  }
}
```

### Page Snapshot from Failing Test
```yaml
- generic [active]:
  - generic:
    - link "Home Page":
      - img "SlideHeroes Logo"
    - generic:
      - heading "Create an account" [level=1]
      - paragraph: Fill the form below to create an account.
      - generic: Or continue with
      - button "google logo Sign in with Google":
        - img "google logo"
      - link "Already have an account?"
```

Note: NO input fields present - form elements are completely missing.

### Configuration Analysis
```typescript
// apps/web/config/auth.config.ts:85-88
providers: {
  password: process.env.NEXT_PUBLIC_AUTH_PASSWORD === "true",  // EVALUATES TO FALSE
  magicLink: process.env.NEXT_PUBLIC_AUTH_MAGIC_LINK === "true",
  otp: process.env.NEXT_PUBLIC_AUTH_OTP === "true",
  oAuth: ["google"],
}
```

The `password` provider is disabled because `NEXT_PUBLIC_AUTH_PASSWORD` is undefined at build time.

### Workflow Environment Variables (Missing)
```yaml
# staging-deploy.yml test-setup job env block (lines 131-139)
env:
  NEXT_PUBLIC_SITE_URL: http://localhost:3001
  NEXT_PUBLIC_PRODUCT_NAME: SlideHeroes
  NEXT_PUBLIC_CI: true
  EMAIL_SENDER: noreply@slideheroes.com
  # ... other vars
  # MISSING: NEXT_PUBLIC_AUTH_PASSWORD: true
  # MISSING: NEXT_PUBLIC_AUTH_MAGIC_LINK: false
  # MISSING: NEXT_PUBLIC_AUTH_OTP: false
```

### Screenshots
Playwright screenshots show sign-in page with only Google OAuth button, no email form.

## Error Stack Traces
```
Error: element(s) not found
  at expectation
  - waiting for locator('[data-testid="sign-up-email"]')
  - Expect "toBeVisible" with timeout 10000ms
```

## Related Code
- **Affected Files**:
  - `.github/workflows/staging-deploy.yml` (missing env vars in test-setup job)
  - `.github/workflows/e2e-sharded.yml` (same issue - also missing env vars)
  - `apps/web/config/auth.config.ts` (reads NEXT_PUBLIC_AUTH_PASSWORD)
  - `packages/features/auth/src/components/sign-in-methods-container.tsx` (conditional rendering)
  - `packages/features/auth/src/components/sign-up-methods-container.tsx` (conditional rendering)
- **Recent Changes**: Multiple staging-deploy fixes in past 2 days (#1838, #1839, #1826, #1832)
- **Suspected Functions**:
  - Auth config parsing at build time
  - Conditional rendering of form fields based on `providers.password`

## Related Issues & Context

### Direct Predecessors
- #1839 (CLOSED): "Bug Fix: staging-deploy NEXT_PUBLIC_SITE_URL Port Mismatch" - Fixed port but not auth env vars
- #1826 (CLOSED): "Bug Fix: Staging Deploy E2E Tests Failing Due to Missing Environment Variables" - Addressed other env vars but not auth-specific ones
- #1838 (CLOSED): "Bug Diagnosis: staging-deploy E2E Test Shard Failures Due to NEXT_PUBLIC_SITE_URL Mismatch"

### Infrastructure Issues
- #1781 (CLOSED): "Bug Fix: Staging E2E Tests Port Mismatch (3001 vs 3000)"
- #1832 (CLOSED): "Bug Fix: Staging E2E Tests Fail - Port 3001 Already in Use"

### Similar Symptoms
- Same error pattern: "element not found" for `[data-testid="sign-in-email"]`
- Auth form elements missing from rendered page
- Both e2e-sharded.yml AND staging-deploy.yml affected

### Same Component
Multiple recent fixes to staging-deploy.yml workflow

### Historical Context
This is a **recurring pattern** of missing environment variables in CI workflows. The team has fixed multiple env var issues (#1826, #1839) but missed the authentication-specific variables (`NEXT_PUBLIC_AUTH_PASSWORD`, etc.).

The `.env.test` file (which contains the correct values) is gitignored, so CI environments cannot access it. Each required environment variable must be explicitly set in the workflow files.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `NEXT_PUBLIC_AUTH_PASSWORD` environment variable is not set during the build step in staging-deploy.yml (and e2e-sharded.yml), causing password authentication to be disabled at build time.

**Detailed Explanation**:

1. **Environment Variable Configuration**: The auth config (`apps/web/config/auth.config.ts`) reads `process.env.NEXT_PUBLIC_AUTH_PASSWORD` at build time to determine if password authentication should be enabled.

2. **Build-Time vs Runtime**: Since `NEXT_PUBLIC_*` variables are baked into the client bundle at build time by Next.js, the value must be set when `pnpm turbo build:test` runs.

3. **Missing in Workflow**: The `test-setup` job in `staging-deploy.yml` does not include `NEXT_PUBLIC_AUTH_PASSWORD: true` in its `env` block (lines 131-139).

4. **Gitignored .env.test**: The `.env.test` file contains `NEXT_PUBLIC_AUTH_PASSWORD=true` but it's gitignored, so it's not available in CI.

5. **Conditional Rendering**: When `authConfig.providers.password` is `false`, the `sign-in-methods-container.tsx` and `sign-up-methods-container.tsx` components skip rendering the password form entirely:
   ```tsx
   <If condition={props.providers.password}>
     <PasswordSignInContainer ... />  // NOT RENDERED
   </If>
   ```

6. **Test Failure**: E2E tests expect to find `[data-testid="sign-up-email"]` but the element doesn't exist because the entire form was not rendered.

**Supporting Evidence**:
- Playwright trace shows "element(s) not found" for `[data-testid="sign-up-email"]`
- Page snapshot confirms NO input fields rendered
- Workflow file analysis confirms missing `NEXT_PUBLIC_AUTH_PASSWORD` env var
- Same issue exists in e2e-sharded.yml (also failing for the same reason)

### How This Causes the Observed Behavior

1. CI workflow starts → test-setup job runs
2. Build step executes without `NEXT_PUBLIC_AUTH_PASSWORD` set
3. `auth.config.ts` evaluates `process.env.NEXT_PUBLIC_AUTH_PASSWORD === "true"` → `undefined === "true"` → `false`
4. Password provider disabled in compiled bundle
5. Sign-in/sign-up pages render without email/password form (only OAuth)
6. E2E tests look for `[data-testid="sign-up-email"]` → not found → test fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence from Playwright trace showing element not found
- Page snapshot confirms form fields missing
- Code analysis proves conditional rendering based on `NEXT_PUBLIC_AUTH_PASSWORD`
- Workflow file clearly shows missing environment variable
- Pattern matches similar fixes (#1826, #1839) where missing env vars caused test failures

## Fix Approach (High-Level)

Add the following environment variables to the `test-setup` job's `env` block in `staging-deploy.yml`:

```yaml
env:
  # ... existing vars ...
  NEXT_PUBLIC_AUTH_PASSWORD: 'true'
  NEXT_PUBLIC_AUTH_MAGIC_LINK: 'false'
  NEXT_PUBLIC_AUTH_OTP: 'false'
```

The same fix should be applied to `e2e-sharded.yml` in the `setup-server` job's build step environment (or in the job-level env block).

## Diagnosis Determination

The root cause has been conclusively identified:

**Missing `NEXT_PUBLIC_AUTH_PASSWORD=true` environment variable in the staging-deploy.yml and e2e-sharded.yml workflow build steps.**

This causes the password authentication provider to be disabled at build time, resulting in sign-in/sign-up pages that only show OAuth buttons without email/password form fields. E2E tests then fail because they cannot find the expected form elements.

## Additional Context

### Why This Wasn't Caught Earlier

1. The `.env.test` file is gitignored for security reasons
2. Previous fixes focused on other env vars (SITE_URL, billing, Stripe) but missed auth config
3. Local development works because `.env.test` is present locally
4. The e2e-sharded workflow was also failing but for the same reason

### Affected Workflows

Both workflows need the fix:
- `.github/workflows/staging-deploy.yml` - test-setup job (line ~131)
- `.github/workflows/e2e-sharded.yml` - setup-server job (build step at ~169)

### Related Documentation

- Auth config: `apps/web/config/auth.config.ts`
- Test env template: `apps/web/.env.test.locked` (contains the correct values as a reference)

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh run download, Grep, Read, Bash, Task (Explore agent)*
