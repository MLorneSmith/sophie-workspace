# Bug Fix: Sign-in page missing email and password fields

**Related Diagnosis**: #671
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Missing `NEXT_PUBLIC_AUTH_PASSWORD` environment variable in local development configuration
- **Fix Approach**: Add missing authentication environment variables to `.env.local` and `.env.example` files
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The sign-in page at `/auth/sign-in` displays only the heading and OAuth provider buttons, but the email and password input fields are missing. This prevents users from testing email/password authentication in the local development environment.

The issue is caused by the `NEXT_PUBLIC_AUTH_PASSWORD` environment variable being missing from the local development environment. When this variable is not set (undefined), the auth configuration evaluates it as `false`, causing the `SignInMethodsContainer` component to skip rendering the password form.

For full details, see diagnosis issue #671.

### Solution Approaches Considered

#### Option 1: Add environment variables to configuration ⭐ RECOMMENDED

**Description**: Add the missing `NEXT_PUBLIC_AUTH_PASSWORD` and `NEXT_PUBLIC_AUTH_MAGIC_LINK` environment variables to the local development environment configuration files (`.env.local` and `.env.example`).

**Pros**:
- Minimal change required (2-4 lines added)
- Aligns with upstream Makerkit template default configuration
- Enables email/password authentication for local development
- No code changes needed
- Easy to implement and verify

**Cons**:
- Requires developer to be aware of the env var requirement (mitigated by `.env.example`)
- No documentation update (can be mitigated with instructions)

**Risk Assessment**: low - This is simply enabling an existing feature that's already implemented in the codebase

**Complexity**: simple - Adding environment variables

#### Option 2: Make password authentication enabled by default in code

**Description**: Modify the auth config to default `password` to `true` if the env var is undefined, instead of defaulting to `false`.

**Why Not Chosen**:
- Would require code changes to the auth config
- Makes local development behavior different from production (where explicit configuration is required)
- Does not align with the upstream Makerkit template pattern
- Less transparent - developers wouldn't know password auth is enabled without reading code

#### Option 3: Auto-generate `.env.local` from `.env.example`

**Description**: Create a setup script that automatically copies `.env.example` to `.env.local` during project setup.

**Why Not Chosen**:
- Over-engineering for this specific issue
- Would require changes to project setup/onboarding
- The simple solution of adding env vars to both files is sufficient

### Selected Solution: Add environment variables to configuration

**Justification**: This approach is the simplest, most transparent, and aligns with the upstream Makerkit template pattern. It requires no code changes, makes the configuration explicit and discoverable in `.env.example`, and enables the already-implemented feature. Developers will immediately see that password authentication is available by reviewing the example environment file.

**Technical Approach**:
- Add `NEXT_PUBLIC_AUTH_PASSWORD=true` to enable password-based authentication
- Add `NEXT_PUBLIC_AUTH_MAGIC_LINK=false` to disable magic link authentication (optional but recommended for clarity)
- Update both `.env.local` (developer's working environment) and `.env.example` (project default)
- The Next.js application will pick up these variables at startup and make the password form available

**Architecture Changes**: None - this leverages existing authentication configuration system

**Migration Strategy**: No migration needed - this is purely additive configuration

## Implementation Plan

### Affected Files

- `.env.local` - Developer's local environment file
- `.env.example` - Project default environment template
- `apps/web/config/auth.config.ts:86` - Reads `NEXT_PUBLIC_AUTH_PASSWORD` env var (no changes needed)
- `packages/features/auth/src/components/sign-in-methods-container.tsx:49-54` - Conditionally renders password form (no changes needed)

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Verify current configuration

Understand the current state of environment files and auth configuration.

- Read `.env.local` to see what variables are currently set
- Read `.env.example` to understand the template structure
- Verify that `NEXT_PUBLIC_AUTH_PASSWORD` and `NEXT_PUBLIC_AUTH_MAGIC_LINK` are absent from both files
- Confirm the sign-in issue can be reproduced with current configuration

**Why this step first**: Need to understand the current state before making changes

#### Step 2: Add authentication variables to `.env.example`

Update the project's environment template to include authentication configuration variables.

- Locate the "Authentication" section in `.env.example` (or create if missing)
- Add `NEXT_PUBLIC_AUTH_PASSWORD=true` to enable password-based authentication
- Add `NEXT_PUBLIC_AUTH_MAGIC_LINK=false` to document magic link setting
- Keep the file organized with clear section headers

**Rationale**: `.env.example` serves as the source of truth for what environment variables the project needs. Every developer setting up the project should be able to discover these variables by reviewing the example file.

#### Step 3: Add authentication variables to `.env.local`

Update the developer's local environment file to enable the feature.

- If `.env.local` does not exist, note that it will be created when the dev server starts
- Add or update `NEXT_PUBLIC_AUTH_PASSWORD=true`
- Add or update `NEXT_PUBLIC_AUTH_MAGIC_LINK=false`
- Keep existing variables intact

**Rationale**: The `.env.local` file is what the Next.js application actually reads. This is where the feature is actually enabled for the developer.

#### Step 4: Verify the fix works

Test that the sign-in page now displays the email and password input fields.

- Start the development server with `pnpm dev` (or restart if already running)
- Navigate to `http://localhost:3000/auth/sign-in`
- Verify that the password form is now displayed
- Verify that email and password input fields are visible and functional
- Test that the form can be interacted with

**Why this step required**: Must confirm the fix resolves the original problem before considering the task complete

#### Step 5: Validation

Run all validation commands to ensure no regressions.

- Run `pnpm typecheck` - verify no type errors
- Run `pnpm lint` - verify code quality (env var changes typically don't require linting)
- Run any existing authentication E2E tests to ensure nothing broke

## Testing Strategy

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Development server starts successfully with new env vars
- [ ] Navigate to `/auth/sign-in` in the browser
- [ ] Verify email input field is visible and can receive focus
- [ ] Verify password input field is visible and can receive focus
- [ ] Verify "Sign in with Google" button is still visible
- [ ] Verify form labels are correct (e.g., "Email", "Password")
- [ ] Test that form submission works (will fail with invalid credentials, but form should process)
- [ ] Verify no console errors appear in browser developer tools
- [ ] Test with new browser tab/incognito to ensure no caching issues

### Regression Testing

- [ ] Verify other authentication methods still work (OAuth buttons)
- [ ] Verify sign-up page still works correctly
- [ ] Verify other pages of the application still load correctly
- [ ] Verify no type errors or build warnings with new env vars

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Developer forgets to add env var to their environment**:
   - **Likelihood**: medium (even with `.env.example`, some developers may miss it)
   - **Impact**: low (results in password form being hidden, same as original bug)
   - **Mitigation**: Clear documentation in `.env.example` and potential setup script in future

2. **Environment variable name typo**:
   - **Likelihood**: low (copy-paste from `.env.example`)
   - **Impact**: low (feature just won't work, no breakage)
   - **Mitigation**: Use exact names from `.env.example`, verify with `console.log` in auth.config.ts during testing

3. **Conflicting environment setup in Docker**:
   - **Likelihood**: low (local development typically uses `.env.local`)
   - **Impact**: low (Docker environment can be configured separately)
   - **Mitigation**: Document separately in Docker setup guide if needed

**Rollback Plan**:

If this fix causes issues:
1. Remove the `NEXT_PUBLIC_AUTH_PASSWORD=true` line from `.env.local`
2. Restart the development server
3. Password form will be hidden again (back to previous state)

No code rollback is required as this is purely configuration.

**Monitoring** (if needed): None - this is a configuration fix, not a code change

## Performance Impact

**Expected Impact**: none

No performance implications - this is simply enabling an already-implemented authentication method.

## Security Considerations

**Security Impact**: none

Enabling password-based authentication in development is standard practice. This is an optional authentication method controlled by environment variables. The authentication provider (Supabase) handles all security concerns related to password hashing, validation, and session management.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# 1. Start the development server
pnpm dev

# 2. In another terminal, check current env var (should be undefined)
echo $NEXT_PUBLIC_AUTH_PASSWORD

# 3. Open browser and navigate to sign-in page
# http://localhost:3000/auth/sign-in
# Should show only heading and OAuth button
# Should NOT show email/password form
```

**Expected Result**: Sign-in page displays without email/password input fields, only OAuth buttons visible

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format check
pnpm format

# Build (optional but recommended)
pnpm build

# Manual verification
# 1. Restart dev server: pnpm dev
# 2. Navigate to http://localhost:3000/auth/sign-in
# 3. Verify email and password input fields are visible
```

**Expected Result**: All commands succeed, sign-in page displays email and password input fields, zero regressions.

### Regression Prevention

```bash
# Run any existing authentication tests
pnpm test:unit -- auth

# Run E2E tests for sign-in if they exist
pnpm test:e2e -- --grep "sign-in|signin|login"
```

## Dependencies

No new dependencies required.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: none

**Special deployment steps**: None required

This is a configuration-only change. The environment variables in this fix are "NEXT_PUBLIC" prefixed, meaning they're included in the client-side bundle. No server-side deployment configuration changes are needed.

**Feature flags needed**: no

**Backwards compatibility**: maintained (this is purely additive configuration)

## Success Criteria

The fix is complete when:
- [ ] `.env.example` includes `NEXT_PUBLIC_AUTH_PASSWORD=true` and `NEXT_PUBLIC_AUTH_MAGIC_LINK=false`
- [ ] `.env.local` includes the same environment variables set to the same values
- [ ] Development server starts successfully with new env vars
- [ ] Sign-in page at `/auth/sign-in` displays email and password input fields
- [ ] Email and password fields are functional and accept user input
- [ ] OAuth provider buttons still display and work correctly
- [ ] All validation commands pass (typecheck, lint, format)
- [ ] No console errors in browser
- [ ] No regressions to other authentication-related pages
- [ ] Manual testing checklist is complete

## Notes

- This fix aligns with the default configuration from the upstream Makerkit template, which includes `NEXT_PUBLIC_AUTH_PASSWORD=true` by default
- The problem only occurs in local development where developers manually configure their environment - production environments already have this variable configured correctly
- The `.env.local` file is typically not committed to git (it should be in `.gitignore`), so each developer needs to have this in their local environment
- `.env.example` is committed to the repository and serves as the source of truth for what variables developers need
- In the future, consider adding setup documentation or a setup script that automatically configures this for new developers

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #671*
