# Bug Diagnosis: Sign-in page missing email and password fields

**ID**: ISSUE-671
**Created**: 2025-11-21T00:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The sign-in page at `/auth/sign-in` displays only the heading and OAuth provider buttons, but is missing the email and password input fields. This prevents users from signing in with email/password authentication in the local development environment.

## Environment

- **Application Version**: commit 8bd1e925d
- **Environment**: development
- **Browser**: N/A (all browsers affected)
- **Node Version**: N/A
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown - likely never worked in local development

## Reproduction Steps

1. Start the development server with `pnpm dev`
2. Navigate to `http://localhost:3000/auth/sign-in`
3. Observe that only the heading and "Sign in with Google" button are displayed
4. Note that email and password input fields are missing

## Expected Behavior

The sign-in page should display:
- Email input field
- Password input field
- "Sign in with Email" button
- "Forgot password?" link
- OAuth provider buttons (e.g., Google)

## Actual Behavior

The sign-in page only displays:
- Heading "Sign In"
- Subheading
- Google OAuth button
- "Don't have an account yet?" link

The email/password form is completely absent.

## Diagnostic Data

### Configuration Analysis

**Current `.env` file contents (apps/web/.env):**
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_URL=http://localhost:39000
SUPABASE_ANON_KEY=[redacted]
SUPABASE_SERVICE_ROLE_KEY=[redacted]
DATABASE_URL=postgresql://postgres:postgres@localhost:39001/postgres
```

**Missing auth configuration variables:**
- `NEXT_PUBLIC_AUTH_PASSWORD=true` (CRITICAL - causes this bug)
- `NEXT_PUBLIC_AUTH_MAGIC_LINK=false`
- Other auth-related environment variables

**Upstream Makerkit template `.env` includes:**
```
NEXT_PUBLIC_AUTH_PASSWORD=true
NEXT_PUBLIC_AUTH_MAGIC_LINK=false
```

**Production `.env.production` includes:**
```
NEXT_PUBLIC_AUTH_PASSWORD=true
NEXT_PUBLIC_AUTH_MAGIC_LINK=true
```

### Code Flow Analysis

1. `apps/web/app/auth/sign-in/page.tsx` renders `SignInMethodsContainer` with `providers={authConfig.providers}`
2. `authConfig.providers.password` is evaluated from `process.env.NEXT_PUBLIC_AUTH_PASSWORD === "true"` (auth.config.ts:86)
3. Without the env variable, this evaluates to `undefined === "true"` which is `false`
4. `SignInMethodsContainer` uses conditional rendering: `<If condition={props.providers.password}>` (line 49)
5. Since `providers.password` is `false`, `PasswordSignInContainer` (containing the form) is not rendered

## Error Stack Traces

N/A - This is a configuration issue, not a runtime error.

## Related Code

- **Affected Files**:
  - `apps/web/.env` - Missing auth environment variables
  - `apps/web/config/auth.config.ts:86` - Reads env var to determine password auth
  - `packages/features/auth/src/components/sign-in-methods-container.tsx:49-54` - Conditionally renders password form

- **Recent Changes**: N/A - This appears to be a setup/configuration gap from initial project setup

- **Suspected Functions**:
  - `authConfig.providers.password` evaluation in `auth.config.ts`
  - `<If condition={props.providers.password}>` in `sign-in-methods-container.tsx`

## Related Issues & Context

### Direct Predecessors
None found - this appears to be a first-time report.

### Historical Context
The local development `.env` file was likely created with minimal configuration for Supabase connectivity, without the full auth configuration that exists in `.env.production` and the upstream Makerkit template.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `NEXT_PUBLIC_AUTH_PASSWORD` environment variable is missing from the local development `.env` file, causing the password sign-in form to not render.

**Detailed Explanation**:
The auth configuration in `apps/web/config/auth.config.ts` determines which authentication methods to display based on environment variables. Specifically, at line 86:

```typescript
password: process.env.NEXT_PUBLIC_AUTH_PASSWORD === "true",
```

When `NEXT_PUBLIC_AUTH_PASSWORD` is not set (undefined), the expression `undefined === "true"` evaluates to `false`. This value is passed to `SignInMethodsContainer` as `providers.password`.

In `sign-in-methods-container.tsx`, the `PasswordSignInContainer` component is conditionally rendered:

```typescript
<If condition={props.providers.password}>
  <PasswordSignInContainer ... />
</If>
```

Since `props.providers.password` is `false`, the entire password sign-in form (including email and password fields) is not rendered.

**Supporting Evidence**:
- `apps/web/.env` only contains 5 Supabase-related variables, missing all auth configuration
- Upstream Makerkit template `.env` includes `NEXT_PUBLIC_AUTH_PASSWORD=true` by default
- `apps/web/.env.production` has `NEXT_PUBLIC_AUTH_PASSWORD=true` and works correctly in production
- The conditional `<If condition={props.providers.password}>` at `sign-in-methods-container.tsx:49` controls form visibility

### How This Causes the Observed Behavior

1. User loads `/auth/sign-in` page
2. Page component imports `authConfig` from `~/config/auth.config`
3. `authConfig.providers.password` evaluates to `false` (missing env var)
4. `SignInMethodsContainer` receives `providers={{ password: false, ... }}`
5. The `<If condition={false}>` prevents `PasswordSignInContainer` from rendering
6. User sees only OAuth buttons, no email/password form

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct code path traced from env variable to conditional rendering
- Comparison with upstream template confirms missing configuration
- `.env.production` has correct values and production works
- The fix is straightforward (add env variable)

## Fix Approach (High-Level)

Add the missing authentication environment variables to `apps/web/.env`:

```
NEXT_PUBLIC_AUTH_PASSWORD=true
NEXT_PUBLIC_AUTH_MAGIC_LINK=false
```

This will cause `authConfig.providers.password` to evaluate to `true`, and the `PasswordSignInContainer` will be rendered, displaying the email and password input fields.

## Diagnosis Determination

The root cause is definitively identified as a missing environment variable in the local development configuration. The fix is straightforward and low-risk: add `NEXT_PUBLIC_AUTH_PASSWORD=true` to `apps/web/.env`.

This is a configuration gap between the local development setup and both the upstream Makerkit template and the production environment. The local `.env` file should be updated to include all necessary auth configuration variables to match the expected setup.

## Additional Context

- The `.env.production` file is correctly configured, so this issue only affects local development
- Other auth methods (magic link, OTP) are also controlled by similar env variables that may be missing
- Consider using the Makerkit dev-tool or generator to ensure all required env variables are present

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (git)*
