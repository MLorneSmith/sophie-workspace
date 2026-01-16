# Bug Diagnosis: E2B sandbox login shows only Google OAuth, missing email/password fields

**ID**: ISSUE-pending
**Created**: 2025-12-17T18:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

When accessing the E2B sandbox at `https://3000-ihzo0u1gqkh71cj4lxfrh.e2b.app`, the login screen only shows Google OAuth sign-in option. The email/password authentication fields are not displayed, preventing development/testing with local credentials.

## Environment

- **Application Version**: dev branch (commit a4262ae2f)
- **Environment**: E2B sandbox (development)
- **Browser**: N/A (all browsers)
- **Node Version**: 20.x
- **Database**: N/A (issue is client-side configuration)
- **Last Working**: Never worked in E2B (environment variable missing from inception)

## Reproduction Steps

1. Create an E2B sandbox using `slideheroes-claude-agent` template
2. Start the dev server: `pnpm --filter web dev`
3. Access the public URL: `https://3000-<sandbox-id>.e2b.app`
4. Navigate to the sign-in page
5. Observe: Only "Sign in with Google" button is displayed

## Expected Behavior

The login screen should display:
- Email input field
- Password input field
- "Sign in" button for email/password authentication
- "Sign in with Google" button for OAuth

## Actual Behavior

The login screen only displays:
- "Sign in with Google" button

No email/password form fields are shown.

## Diagnostic Data

### Environment Files Analysis

**E2B Sandbox `/home/user/project/apps/web/` contains:**
```
.env.development       (exists - missing auth config)
.env.local.example     (exists - has auth config template)
.env.production        (exists)
.env.test.locked       (exists)
```

**Missing file:** `.env.local` (in .gitignore, not cloned)

### Auth Configuration Analysis

**File**: `apps/web/config/auth.config.ts` (lines 85-89)

```typescript
providers: {
  password: process.env.NEXT_PUBLIC_AUTH_PASSWORD === "true",  // FALSE - env var not set
  magicLink: process.env.NEXT_PUBLIC_AUTH_MAGIC_LINK === "true",  // FALSE
  otp: process.env.NEXT_PUBLIC_AUTH_OTP === "true",  // FALSE
  oAuth: ["google"],  // Always enabled
},
```

**Root cause:** `NEXT_PUBLIC_AUTH_PASSWORD` environment variable is not set in any file that the E2B sandbox loads.

### File Comparison

**`.env.local.example` (line 4):**
```
NEXT_PUBLIC_AUTH_PASSWORD=true  # Enable email/password authentication
```

**`.env.development` (lines 1-39):**
- Contains Supabase config, Stripe, Payload, etc.
- **MISSING**: `NEXT_PUBLIC_AUTH_PASSWORD=true`

## Error Stack Traces

N/A - No runtime errors. Configuration results in intended behavior (OAuth only) but unintended user experience.

## Related Code

- **Affected Files**:
  - `apps/web/config/auth.config.ts` (reads env vars)
  - `apps/web/.env.development` (missing auth config)
  - `packages/e2b/e2b-template/template.ts` (clones repo without .env.local)

- **Recent Changes**: None - this is a configuration gap since E2B template creation
- **Suspected Functions**: `auth.config.ts` provider configuration

## Related Issues & Context

### Direct Predecessors
None found - first report of E2B auth configuration issue.

### Related Infrastructure Issues
- E2B template setup does not create `.env.local` file
- `.env.local` is gitignored (correctly) but needed for E2B development

### Historical Context
This is a configuration gap that has existed since the E2B template was created. The template clones the repository but `.env.local` (which contains `NEXT_PUBLIC_AUTH_PASSWORD=true`) is gitignored and not included.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `NEXT_PUBLIC_AUTH_PASSWORD` environment variable is missing from `.env.development`, and `.env.local` (which has this setting) is gitignored and not present in the E2B sandbox.

**Detailed Explanation**:

The authentication configuration in `apps/web/config/auth.config.ts` reads `process.env.NEXT_PUBLIC_AUTH_PASSWORD` to determine whether to enable email/password authentication (line 86). When this environment variable is not set or not equal to `"true"`, the password authentication is disabled.

In the E2B sandbox:
1. The template clones the repository from GitHub
2. `.env.local` is in `.gitignore`, so it's not cloned
3. `.env.development` exists but does NOT contain `NEXT_PUBLIC_AUTH_PASSWORD=true`
4. The setting only exists in `.env.local.example` (template file)
5. Result: `process.env.NEXT_PUBLIC_AUTH_PASSWORD === "true"` evaluates to `false`
6. Password authentication is disabled, showing only OAuth

**Supporting Evidence**:
- `.env.development` file examination: No `NEXT_PUBLIC_AUTH_PASSWORD` variable present
- `.env.local.example` line 4: `NEXT_PUBLIC_AUTH_PASSWORD=true` (template only)
- `auth.config.ts` line 86: `password: process.env.NEXT_PUBLIC_AUTH_PASSWORD === "true"`
- E2B sandbox file listing: `.env.local` is absent

### How This Causes the Observed Behavior

1. E2B template creates sandbox by cloning repo
2. `.env.local` is gitignored -> not cloned
3. Next.js loads `.env.development` for development mode
4. `.env.development` lacks `NEXT_PUBLIC_AUTH_PASSWORD=true`
5. `auth.config.ts` sets `password: false`
6. Auth UI renders without email/password fields
7. User sees only Google OAuth option

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct examination of environment files confirms the variable is missing
- Code path is deterministic (env var check)
- Local development works when `.env.local` exists with the setting
- E2B sandbox definitively lacks this file

## Fix Approach (High-Level)

Two options:

1. **Add auth config to `.env.development`** (Recommended)
   - Add `NEXT_PUBLIC_AUTH_PASSWORD=true` to `.env.development`
   - This file is committed and will be cloned to E2B
   - Most straightforward fix

2. **Update E2B template to create `.env.local`**
   - Modify `packages/e2b/e2b-template/template.ts` to copy `.env.local.example` to `.env.local`
   - More complex, requires template rebuild

## Diagnosis Determination

The root cause is definitively identified: the `NEXT_PUBLIC_AUTH_PASSWORD` environment variable is not set in any committed environment file that the E2B sandbox loads. The fix is to add `NEXT_PUBLIC_AUTH_PASSWORD=true` to `.env.development` so it's included when the repository is cloned.

## Additional Context

- This affects all E2B sandbox users, not just this specific sandbox instance
- The issue is consistent and reproducible in any new E2B sandbox
- Google OAuth is correctly configured and working as expected
- Local development is unaffected (users have `.env.local`)

---
*Generated by Claude Debug Assistant*
*Tools Used: sandbox exec, file reads, glob, environment analysis*
