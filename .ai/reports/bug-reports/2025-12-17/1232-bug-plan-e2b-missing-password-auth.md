# Bug Fix: E2B Sandbox Missing Email/Password Authentication

**Related Diagnosis**: #1230 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `NEXT_PUBLIC_AUTH_PASSWORD` environment variable missing from E2B template, preventing password authentication from being enabled in sandbox
- **Fix Approach**: Add `NEXT_PUBLIC_AUTH_PASSWORD=true` to the E2B template configuration so it includes password auth configuration when repositories are cloned
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When developers create an E2B sandbox, the login page only shows a "Sign in with Google" button. The email/password authentication fields are not displayed, preventing local development and testing with credentials. This occurs because the `NEXT_PUBLIC_AUTH_PASSWORD` configuration variable is missing from the E2B template's environment configuration, causing the auth config to evaluate `password: false`.

The local development setup in `.env.local.example` correctly sets `NEXT_PUBLIC_AUTH_PASSWORD=true`, but this file is gitignored and not automatically included when the repository is cloned into the E2B sandbox.

For full details, see diagnosis issue #1230.

### Solution Approaches Considered

#### Option 1: Add to E2B Template `.env` ⭐ RECOMMENDED

**Description**: Add `NEXT_PUBLIC_AUTH_PASSWORD=true` to the `packages/e2b/e2b-template/.env` file. This configuration will be baked into the E2B template during the build process, ensuring all sandboxes created from this template include password authentication by default.

**Pros**:
- Simple one-line fix requiring minimal changes
- Configuration is committed to the repository and includes all future sandboxes automatically
- Aligns with documented local development setup (`.env.local.example`)
- No schema changes, database changes, or complex rollout needed
- Consistent with password auth being enabled in production (`apps/web/.env.production`)

**Cons**:
- None identified for this use case

**Risk Assessment**: low - Adding a configuration variable that enables a standard authentication method has minimal impact. Password auth is already supported by Supabase and enabled in production environments.

**Complexity**: simple - Single line change to an environment configuration file

#### Option 2: Document Workaround

**Description**: Update E2B sandbox documentation to instruct developers to manually add the variable after cloning the sandbox environment.

**Why Not Chosen**: Requires manual steps for every sandbox creation, is error-prone, and creates unnecessary friction. The better solution is to bake the configuration into the template itself.

#### Option 3: Add to Build Script

**Description**: Modify the E2B template build script to inject the variable during the build process.

**Why Not Chosen**: Adds unnecessary complexity when the variable can simply be included in the existing `.env` file that's already part of the template.

### Selected Solution: Add to E2B Template `.env`

**Justification**: This is the minimal, most maintainable approach. The configuration variable belongs in the template's `.env` file where all other development defaults are configured. Since password authentication is:
- Already supported by Supabase
- Enabled in local development (`NEXT_PUBLIC_AUTH_PASSWORD=true` in `.env.local.example`)
- Enabled in production (`apps/web/.env.production`)

There's no reason it should be disabled in E2B sandboxes. This fix ensures consistency across all development environments.

**Technical Approach**:
- Add `NEXT_PUBLIC_AUTH_PASSWORD=true` to `packages/e2b/e2b-template/.env`
- Verify the variable doesn't conflict with existing configuration
- Rebuild the E2B template to include the new configuration
- Test in a newly created sandbox to confirm password auth appears on login screen

**Architecture Changes**: None - this is purely a configuration update.

**Migration Strategy**: Not applicable - this is a configuration-only change that doesn't affect existing data or code.

## Implementation Plan

### Affected Files

- `packages/e2b/e2b-template/.env` - Add `NEXT_PUBLIC_AUTH_PASSWORD=true` configuration variable

### New Files

None - this is a configuration-only fix.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Configuration Variable

Add the `NEXT_PUBLIC_AUTH_PASSWORD=true` line to the E2B template's environment file.

- Open `packages/e2b/e2b-template/.env`
- Add line: `NEXT_PUBLIC_AUTH_PASSWORD=true` in the authentication configuration section
- This enables password authentication to be evaluated as `true` when the auth config loads

**Why this step first**: The configuration variable must be in place before testing, as it directly controls whether the auth system includes password authentication methods.

#### Step 2: Rebuild E2B Template

Rebuild the E2B template to include the new configuration in the sandbox image.

- Run the template builder script: `tsx .claude/skills/e2b-sandbox/scripts/build-template.ts`
- Wait for the build to complete successfully
- This bakes the configuration into the template so new sandboxes include it automatically

**Why after step 1**: The new configuration must be committed to the file before building, otherwise the build will use the old version.

#### Step 3: Create Test Sandbox

Create a new E2B sandbox from the rebuilt template to verify the fix works.

- Create a new sandbox using the template: `e2b sandbox -t slideheroes-claude-agent`
- Start the dev server in the sandbox
- Navigate to the login page (public URL on port 3000)
- Verify that both the "Sign in with Google" button AND email/password fields are now visible

**Why after step 2**: The template must be rebuilt before creating a test sandbox, otherwise the new sandbox will still use the old template.

#### Step 4: Validate No Regressions

Ensure the fix doesn't break existing authentication flows.

- Test Google OAuth sign-in still works
- Test email/password sign-in works (create new account or use test credentials)
- Verify the auth config loads without errors
- Check browser console for any auth-related errors

**Why after step 3**: Regressions must be checked after the fix is deployed and functional.

## Testing Strategy

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Create new E2B sandbox from rebuilt template
- [ ] Start dev server on new sandbox
- [ ] Access login page in browser
- [ ] Verify email/password input fields are visible
- [ ] Verify "Sign in with Google" button is still visible
- [ ] Test email/password sign-up flow (create test account)
- [ ] Test email/password sign-in flow (login with test account)
- [ ] Test Google OAuth sign-in flow
- [ ] Check browser console for no auth errors
- [ ] Verify no other authentication methods are affected

### Regression Prevention

```bash
# Build the project to ensure no type/lint errors
pnpm build

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Run auth-related tests if available
pnpm test --grep "auth"
```

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Configuration doesn't persist in sandbox**:
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Verified by testing newly created sandbox and checking env vars are loaded correctly

2. **Template build fails**:
   - **Likelihood**: low
   - **Impact**: medium (prevents sandbox creation)
   - **Mitigation**: Run build script directly to see error output; check E2B API connectivity

3. **OAuth or other auth methods break**:
   - **Likelihood**: very low (only enabling another method, not changing existing ones)
   - **Impact**: medium
   - **Mitigation**: Comprehensive manual testing of all auth methods before considering fix complete

**Rollback Plan**:

If this fix causes issues:
1. Remove the `NEXT_PUBLIC_AUTH_PASSWORD=true` line from `packages/e2b/e2b-template/.env`
2. Rebuild the template: `tsx .claude/skills/e2b-sandbox/scripts/build-template.ts`
3. Create new sandboxes will use the old template without password auth
4. Existing sandboxes are unaffected (they use the configuration at creation time)

## Performance Impact

**Expected Impact**: none

This is a purely configuration-based change with no code modifications, database changes, or performance implications.

## Security Considerations

**Security Impact**: none

Enabling password authentication is not a security risk:
- Password authentication is already supported by Supabase
- Passwords are hashed and managed securely by Supabase
- Email/password auth is an industry-standard authentication method
- Already enabled in production environments
- Same security model as local development environments

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Create E2B sandbox with current template
/sandbox create --template slideheroes-claude-agent

# Start dev server in sandbox
/sandbox run-claude "pnpm dev"

# Access login page and observe: Only "Sign in with Google" button visible
# Email/password fields should NOT appear
```

**Expected Result**: Login page shows only Google OAuth option, no email/password fields.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build
pnpm build

# Create new E2B sandbox from rebuilt template
/sandbox create --template slideheroes-claude-agent

# Start dev server in new sandbox
/sandbox run-claude "pnpm dev"

# Access login page and observe: Both Google OAuth button AND email/password fields visible
```

**Expected Result**: All validation commands succeed. Login page shows both "Sign in with Google" button and email/password input fields. Both auth methods work.

### Regression Prevention

```bash
# Verify no auth config errors
pnpm typecheck

# Verify no lint issues in auth config files
pnpm lint:fix

# Run full type check across entire project
pnpm typecheck

# If auth tests exist, verify they pass
pnpm test --grep "auth" || true
```

## Dependencies

No new dependencies required. This fix only modifies an existing environment configuration file.

## Database Changes

No database changes required. This is a configuration-only fix affecting the auth UI layer.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a non-breaking configuration change.

**Feature flags needed**: no

**Backwards compatibility**: maintained

The fix is purely additive (enabling an additional auth method) and doesn't change existing behavior for any other components.

## Success Criteria

The fix is complete when:
- [ ] `NEXT_PUBLIC_AUTH_PASSWORD=true` is added to `packages/e2b/e2b-template/.env`
- [ ] E2B template is rebuilt successfully
- [ ] New sandbox from rebuilt template shows both OAuth and password auth on login page
- [ ] All validation commands pass
- [ ] Email/password sign-up and sign-in flows work in the new sandbox
- [ ] OAuth sign-in still works (no regressions)
- [ ] No auth errors in browser console
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Code review approved (if applicable)

## Notes

This is a straightforward fix that aligns password authentication in E2B sandboxes with:
1. Local development setup (`.env.local.example` has `NEXT_PUBLIC_AUTH_PASSWORD=true`)
2. Production environment (`apps/web/.env.production` includes password auth)
3. Documented configuration patterns (`apps/web/config/auth.config.ts` supports this variable)

The configuration variable is already fully supported by the application and was likely inadvertently omitted from the E2B template configuration.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1230*
