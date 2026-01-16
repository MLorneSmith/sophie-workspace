# Bug Fix: Missing Supabase Tokens Prevent Migration Sync to Sandbox Database

**Related Diagnosis**: #1509
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Missing required Supabase environment variables (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_SANDBOX_PROJECT_REF`) prevent the Alpha Orchestrator from syncing feature migrations to the remote sandbox database
- **Fix Approach**: Add clear validation and error messaging when required environment variables are missing, implement graceful fallback, and document required setup steps
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator creates E2B sandboxes and runs feature implementations. When features create database migrations (new tables, schemas), these migrations need to be synced to the remote Supabase sandbox database. However, without proper Supabase authentication tokens, the sync operation is silently skipped, leaving the remote database out of sync with the sandbox filesystem. This causes application code that references new tables to fail.

The issue occurs in two places:
1. **Sandbox linking** - `createSandbox()` in sandbox.ts:182 - Skipped when tokens are missing
2. **Migration sync** - `syncFeatureMigrations()` in database.ts:297 - Returns true (success) even though sync was skipped

For full details, see diagnosis issue #1509.

### Solution Approaches Considered

#### Option 1: Fail Fast with Clear Error Messages ⭐ RECOMMENDED

**Description**: When required Supabase tokens are missing, immediately fail with clear, actionable error messages that tell the user exactly what's needed and where to get it.

**Pros**:
- Immediately alerts user to configuration problem before wasting time
- Clear error message shows exactly what's missing and how to fix it
- Prevents confusing silent failures and mysterious downstream errors
- Forces user to address the root cause rather than working around it
- Makes debugging easy - the error message is self-documenting

**Cons**:
- Breaks workflows that don't need Supabase auth (unlikely - most features touch DB)
- Requires users to set up tokens before running orchestrator

**Risk Assessment**: low - Configuration validation is bulletproof

**Complexity**: simple - Just add validation checks and throw errors

#### Option 2: Enhanced Warnings with Verbose Logging

**Description**: Keep the current graceful fallback but add comprehensive logging that explains what's being skipped and why.

**Pros**:
- Non-breaking - allows orchestrator to continue
- Provides visibility into what's happening

**Cons**:
- Users might miss warnings in output
- Doesn't prevent the core problem - migrations still don't sync
- Users might think success when it actually failed silently
- Downstream errors are harder to debug

**Why Not Chosen**: Doesn't fix the underlying issue - it just makes the broken behavior more visible. Users still end up with mismatched databases and confusing errors.

#### Option 3: Try to Create Temporary Tokens in Sandbox

**Description**: Have the orchestrator attempt to create temporary Supabase tokens within the E2B sandbox environment.

**Pros**:
- Could potentially reduce setup burden

**Cons**:
- Requires additional authentication (how would sandbox authenticate to Supabase?)
- Security risk - tokens would need to be stored somewhere
- Complex implementation
- Unclear how this would work in practice

**Why Not Chosen**: Too complex and introduces security concerns. The user already has tokens they just need to provide them.

### Selected Solution: Fail Fast with Clear Error Messages

**Justification**: This is a configuration problem that should be caught immediately. Letting the orchestrator continue in a broken state leads to confusing downstream errors that are hard to debug. Clear, immediate feedback forces users to fix the root cause before proceeding. This is the principle of "fail fast, fail loud" - much better than silent failures.

**Technical Approach**:

1. **Enhance validation in environment.ts**: Add a function `validateSupabaseTokensRequired()` that checks for both `SUPABASE_ACCESS_TOKEN` and `SUPABASE_SANDBOX_PROJECT_REF`

2. **Add early validation in createSandbox()**: Before attempting sandbox operations, validate that tokens are present with clear error message

3. **Add early validation in syncFeatureMigrations()**: Check tokens and fail if missing

4. **Create setup documentation**: Add quick-start guide showing exactly how to get and set these tokens

**Architecture Changes** (if any):
- No architectural changes needed
- This is purely adding validation and better error messaging
- Existing code paths remain the same

**Migration Strategy** (if needed):
- No migration needed - this is a validation improvement
- Breaking change only if users were relying on the silent skipping behavior (unlikely, since it breaks their features)

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/environment.ts` - Add validation function for required tokens
- `.ai/alpha/scripts/lib/sandbox.ts` - Add early validation in createSandbox()
- `.ai/alpha/scripts/lib/database.ts` - Improve error handling in syncFeatureMigrations()
- `CLAUDE.md` or new documentation file - Add setup guide for Supabase tokens

### New Files

- (Optional) `.ai/docs/supabase-token-setup.md` - Setup guide for getting Supabase tokens

### Step-by-Step Tasks

#### Step 1: Add validation function in environment.ts

Add a function that validates required Supabase tokens are present:

```typescript
export function validateSupabaseTokensRequired(): { isValid: boolean; message: string } {
  const token = SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_SANDBOX_PROJECT_REF;

  if (!token || !projectRef) {
    const missing = [];
    if (!token) missing.push('SUPABASE_ACCESS_TOKEN');
    if (!projectRef) missing.push('SUPABASE_SANDBOX_PROJECT_REF');

    return {
      isValid: false,
      message: `Missing required Supabase configuration: ${missing.join(', ')}. See setup guide for details.`
    };
  }

  return { isValid: true, message: '' };
}
```

**Why this step first**: Foundation for all validation checks - centralized, reusable

#### Step 2: Update createSandbox() in sandbox.ts

Add validation at the beginning that fails if tokens are missing:

- Check `validateSupabaseTokensRequired()`
- Throw clear error with setup instructions if missing
- Error message should point to setup documentation

#### Step 3: Update syncFeatureMigrations() in database.ts

Improve the existing validation:

- Replace the current `hasSupabaseAuth()` check with `validateSupabaseTokensRequired()`
- Change behavior from silently skipping (returning true) to throwing error when tokens are required
- Add better error messages showing exact issue and solution
- Keep existing helpful error messages about authentication failures

#### Step 4: Create setup documentation

Add documentation (either new file or update CLAUDE.md):

- Explain why Supabase tokens are needed
- Step-by-step instructions to generate access token
- Step-by-step instructions to get project reference
- Example of setting environment variables
- Troubleshooting section

#### Step 5: Test the changes

- Run orchestrator without tokens - should fail immediately with clear message
- Run orchestrator with tokens - should work normally
- Verify error messages are helpful and actionable
- Check that all code paths are covered

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `validateSupabaseTokensRequired()` returns correct result when tokens present
- ✅ `validateSupabaseTokensRequired()` returns correct result when tokens missing
- ✅ `validateSupabaseTokensRequired()` handles partial configuration (one token missing)
- ✅ Error messages contain actionable information
- ✅ Error messages contain links to documentation

### Integration Tests

- ✅ createSandbox() fails fast when tokens missing
- ✅ createSandbox() succeeds when tokens present
- ✅ syncFeatureMigrations() fails when tokens missing (after implementation)
- ✅ syncFeatureMigrations() succeeds when tokens present

### E2E Tests

Not needed for this fix - it's a configuration validation issue, not a UI/user journey issue.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Set SUPABASE_ACCESS_TOKEN to empty string, run orchestrator → should fail with clear error
- [ ] Set SUPABASE_SANDBOX_PROJECT_REF to empty string, run orchestrator → should fail with clear error
- [ ] Unset both variables, run orchestrator → should fail with clear error showing both are missing
- [ ] Set both variables correctly, run orchestrator → should work normally (or fail for different reasons)
- [ ] Error messages should mention "Missing required Supabase configuration"
- [ ] Error messages should reference setup guide or documentation
- [ ] Verify the error appears early before any sandbox operations begin

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Breaking existing workflows**: If users were somehow relying on the graceful failure
   - **Likelihood**: low - silent failure is not desirable behavior
   - **Impact**: low - only affects users without tokens configured
   - **Mitigation**: Users will immediately see clear error with setup instructions. This is actually better than the silent failure they experienced before.

2. **Incomplete validation**: Missing edge cases in token validation
   - **Likelihood**: low - the check is straightforward (null/empty string)
   - **Impact**: medium - could lead to confusing errors downstream
   - **Mitigation**: Comprehensive validation function that checks both tokens + tests

**Rollback Plan**:

If this fix causes issues:
1. Revert to previous behavior by removing validation checks in `createSandbox()`
2. Restore original `hasSupabaseAuth()` check in `syncFeatureMigrations()`
3. The system will return to silent skipping (pre-fix behavior)

**Monitoring** (if needed):
- None needed - this is a simple validation improvement
- No runtime behavior changes other than error handling

## Performance Impact

**Expected Impact**: none

- This is purely adding validation checks at startup
- Validation is instant (just checking environment variables)
- No performance impact on actual feature implementation

## Security Considerations

**Security Impact**: positive

This fix actually improves security by:
- Preventing accidental use of misconfigured Supabase projects
- Encouraging proper token management and documentation
- Making token configuration explicit and intentional

**Security recommendations**:
- Tokens are already passed via environment variables (best practice)
- No changes needed to how tokens are handled

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Unset Supabase tokens
unset SUPABASE_ACCESS_TOKEN
unset SUPABASE_SANDBOX_PROJECT_REF

# Run orchestrator - migrations should be silently skipped
cd .ai/alpha && npm run orchestrate
```

**Expected Result**: Orchestrator runs but feature migrations are not synced to remote database (current broken behavior)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (if added)
pnpm test:unit --filter @slideheroes/alpha

# Manual verification - should fail with clear error
unset SUPABASE_ACCESS_TOKEN
unset SUPABASE_SANDBOX_PROJECT_REF
cd .ai/alpha && npm run orchestrate
# Should see: "Missing required Supabase configuration: SUPABASE_ACCESS_TOKEN, SUPABASE_SANDBOX_PROJECT_REF"

# Manual verification - should work with tokens
export SUPABASE_ACCESS_TOKEN="sbp_xxxxx"
export SUPABASE_SANDBOX_PROJECT_REF="abcdef"
cd .ai/alpha && npm run orchestrate
# Should work normally (or fail for other reasons, but not missing config)
```

**Expected Result**: All commands succeed, errors are clear and actionable, validation catches missing tokens immediately

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify existing tests still pass
pnpm test:unit --filter @slideheroes/alpha

# Verify lint and type checking
pnpm lint
pnpm typecheck
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required** - using only built-in Node.js functionality and existing imports

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - this is a pure validation improvement
- No database migrations
- No API changes
- Can be deployed independently

**Feature flags needed**: no

**Backwards compatibility**: maintained for users with correct configuration; breaks (intentionally) for users without required tokens

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Orchestrator fails immediately when tokens are missing (not silently)
- [ ] Error message clearly states which tokens are missing
- [ ] Error message includes instructions on where to get tokens
- [ ] Orchestrator works normally when tokens are properly configured
- [ ] All existing tests pass (no regressions)
- [ ] Manual testing checklist complete
- [ ] Code review approved (if applicable)

## Notes

This fix addresses the root cause of the problem: unclear error handling when configuration is incomplete. The current behavior (silent skipping) makes it very hard to debug downstream issues. Clear, immediate feedback is much better for developer experience.

The fix is intentionally simple - it's just validation and error messaging. We're not changing any core logic, just making failures explicit and actionable.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1509*
