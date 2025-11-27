# Bug Fix: E2E Shard 4 Admin Tests - Global Setup Missing MFA Verification

**Related Diagnosis**: #729 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Global setup authenticates super admin with password only (AAL1), but `is_super_admin()` requires MFA verification (AAL2)
- **Fix Approach**: Add MFA verification to global setup after password authentication
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E global setup authenticates the super admin user for the admin test suite using `signInWithPassword()`, which returns an AAL1 (Authentication Assurance Level 1) session. However, the `is_super_admin()` database function in `schemas/13-mfa.sql` requires AAL2 (MFA verified) before granting admin access.

Without MFA verification, the super admin's session fails the `is_super_admin()` check, causing `/admin` routes to redirect to 404. This cascades to 6 of 8 tests failing (admin dashboard, delete flow, invite operations all timeout or show 404).

### Solution Approaches Considered

#### Option 1: Add MFA Verification to Global Setup ⭐ RECOMMENDED

**Description**: After `signInWithPassword()` succeeds, immediately call `supabase.auth.mfa.challenge()` and `supabase.auth.mfa.verify()` with the existing TOTP key to complete MFA verification, resulting in an AAL2 session.

**Pros**:
- Minimal code changes (3 API calls in global setup)
- No test file modifications needed
- AAL2 session properly set in storage state
- Uses existing TOTP generation utility (totp-generator)
- Proven pattern in `AuthPageObject.submitMFAVerification()`
- Matches how UI-based MFA works

**Cons**:
- Global setup becomes slightly more complex
- Requires totp-generator import

**Risk Assessment**: low - Straightforward Supabase auth API usage with error handling

**Complexity**: simple - Reuses existing patterns from auth tests

#### Option 2: Use Admin Client Bypass

**Description**: Modify global setup to use admin client with manual validation, bypassing MFA requirement.

**Why Not Chosen**:
- Introduces security risk by bypassing RLS via admin client
- Masks the real issue (global setup doesn't match production auth flow)
- Tests wouldn't verify that super admins actually need MFA
- Violates security principle of "never bypass RLS unless absolutely necessary"

#### Option 3: Modify `is_super_admin()` to Not Require MFA

**Description**: Remove the MFA requirement from `is_super_admin()` database function.

**Why Not Chosen**:
- Defeats the purpose of MFA requirement for super admins
- Tests would pass but wouldn't verify critical security feature
- Not acceptable for production security posture

### Selected Solution: Add MFA Verification to Global Setup

**Justification**: This approach maintains security by requiring proper AAL2 verification, keeps tests realistic, and requires minimal code changes. It's the most straightforward fix with lowest risk.

**Technical Approach**:
1. After successful `signInWithPassword()`, check if MFA factor exists for the user
2. Call `supabase.auth.mfa.challenge()` to initiate MFA verification
3. Generate TOTP code using existing TOTP key (`NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE`)
4. Call `supabase.auth.mfa.verify()` with the generated code
5. Update session with the new AAL2 tokens
6. Continue with existing flow to inject session into storage state

**Architecture Changes**: None - This is additive to existing flow

**Migration Strategy**: N/A - Only affects global setup, no existing data migration needed

## Implementation Plan

### Affected Files

- `apps/e2e/global-setup.ts` - Add MFA verification after password sign-in (lines 146-157)
  - Specific changes: After `signInWithPassword()` succeeds, add MFA challenge/verify flow
  - Import `totp-generator` for TOTP code generation
  - Handle MFA verification with proper error handling

### New Files

None - All changes are within existing global-setup.ts

### Step-by-Step Tasks

#### Step 1: Import TOTP Generator

Add import for totp-generator package at the top of global-setup.ts:

```typescript
import { TOTP } from "totp-generator";
```

**Why this step first**: Required for generating TOTP codes in subsequent steps

#### Step 2: Extract TOTP Key to Constant

Define the TOTP key as a constant at the module level (matching AuthPageObject):

```typescript
const MFA_KEY = "NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE";
```

**Why this step**: Makes the key explicit and reusable, matches test patterns

#### Step 3: Add MFA Verification After Password Sign-In

In the global setup loop (around line 146), after successful password authentication:

```typescript
// Immediately after: if (error || !data.session) { ... }

// For super admin user, verify MFA to get AAL2
if (authState.role === "admin") {
  debugLog("mfa:challenge_start", {
    user: authState.name,
    userId: data.session?.user?.id?.slice(0, 8),
  });

  // Challenge MFA - returns list of available factors
  const { data: challengeData, error: challengeError } =
    await supabase.auth.mfa.getFactors();

  if (challengeError) {
    console.error(
      `⚠️  MFA factor retrieval failed for ${authState.name}: ${challengeError.message}`,
    );
    // Don't throw - continue without AAL2 (non-admin users don't need MFA)
  } else if (challengeData?.totp && challengeData.totp.length > 0) {
    const totpFactor = challengeData.totp[0];

    // Create challenge for this factor
    const { data: challengeSessionData, error: sessionError } =
      await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

    if (sessionError || !challengeSessionData) {
      console.error(
        `⚠️  MFA challenge failed for ${authState.name}: ${sessionError?.message || "No challenge data"}`,
      );
    } else {
      debugLog("mfa:challenge_created", {
        user: authState.name,
        factorId: totpFactor.id,
        sessionId: challengeSessionData.session?.id?.slice(0, 8),
      });

      // Generate TOTP code
      const { otp } = await TOTP.generate(MFA_KEY, { period: 30 });

      debugLog("mfa:otp_generated", { user: authState.name, otpLength: 6 });

      // Verify the challenge with TOTP code
      const { data: verifyData, error: verifyError } =
        await supabase.auth.mfa.challengeAndVerify({
          factorId: totpFactor.id,
          code: otp,
        });

      if (verifyError) {
        console.error(
          `⚠️  MFA verification failed for ${authState.name}: ${verifyError.message}`,
        );
      } else if (verifyData?.session) {
        // Update the session with AAL2 tokens
        data.session = verifyData.session;

        debugLog("mfa:verified_success", {
          user: authState.name,
          newAal: verifyData.session.user.app_metadata?.aal || "unknown",
          userId: data.session?.user?.id?.slice(0, 8),
        });

        console.log(`✅ MFA verified (AAL2) for ${authState.name}`);
      }
    }
  }
}
```

**Why this step**: Core fix - achieves AAL2 verification for super admin

#### Step 4: Update Session Injection with AAL2 Tokens

Ensure the session being injected into storage state uses the updated session with AAL2 from MFA verification (the code from Step 3 already updates `data.session`):

```typescript
// This uses the updated session from Step 3 if MFA was verified
const { error: setSessionError } = await ssrClient.auth.setSession({
  access_token: data.session.access_token,
  refresh_token: data.session.refresh_token,
});
```

**Why this step**: Ensures the AAL2 tokens are persisted in the storage state

#### Step 5: Validate with Type Checking and Testing

- Run `pnpm typecheck` to ensure imports and types are correct
- Run `pnpm test:e2e --shard=4` to validate shard 4 tests pass

**Why this step**: Ensures implementation is syntactically correct and functionally working

## Testing Strategy

### Unit Tests

N/A - Global setup is not unit tested, only integration tested via E2E

### Integration Tests

N/A - Global setup is tested through E2E execution

### E2E Tests

Validation occurs through the E2E test suite itself:

- **Admin Dashboard displays all stat cards** - Should pass (404 redirects to visible dashboard)
- **Delete team account flow** - Should pass (timeouts resolve)
- **Users can delete invites** - Should pass (no timeout)
- **Users can update invites** - Should pass (no timeout)
- **Member of team again** - Should pass (email body found)
- **Let users accept invite** - Should pass (invitation flow works)

### Manual Testing Checklist

Execute these verifications before considering the fix complete:

- [ ] Run shard 4 E2E tests: `pnpm test:e2e --shard=4`
- [ ] All 8 tests in shard 4 pass (currently 6 fail)
- [ ] Super admin user can access `/admin` without 404
- [ ] Admin dashboard displays stat cards correctly
- [ ] No new E2E test failures in other shards
- [ ] Global setup completes without errors
- [ ] Debug logging shows `MFA verified (AAL2)` for super admin

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **TOTP Generation Timing**: OTP codes expire every 30 seconds
   - **Likelihood**: low
   - **Impact**: medium (MFA verification fails, tests fail)
   - **Mitigation**: OTP is generated immediately before verification, no delay in between. If needed, add retry logic with exponential backoff.

2. **MFA Factor Not Found**: Super admin doesn't have TOTP factor set up
   - **Likelihood**: low (factor is pre-seeded in test database)
   - **Impact**: medium (tests continue with AAL1, fail accessing admin)
   - **Mitigation**: Add error logging to diagnose, verify test seeding includes MFA factor

3. **Session Token Encoding**: New AAL2 tokens may not be properly encoded in cookies
   - **Likelihood**: very low
   - **Impact**: medium (session injection fails)
   - **Mitigation**: Using Supabase's own `setSession()` method, which handles encoding correctly

**Rollback Plan**:

If this fix causes issues in production (unlikely since tests only):
1. Revert the changes to global-setup.ts
2. Tests will fail with AAL1 again (original state)
3. Re-run `/diagnose` to document the regression
4. Root cause is clearly identified by reverting

**Monitoring** (not needed):
- This only affects E2E test setup, no production monitoring needed
- Test results are the only metric

## Performance Impact

**Expected Impact**: minimal

- Global setup already authenticates users sequentially (one at a time)
- MFA verification adds ~100-500ms per super admin user (one API call)
- Total global setup time increases by <1 second
- No impact on individual test execution time (storage states reused)

## Security Considerations

**Security Impact**: positive

- Ensures MFA verification is properly tested
- Validates that super admins actually require AAL2
- Maintains security posture of `is_super_admin()` function
- Tests are now more realistic to production authentication flow

**Security Review**: not needed (test infrastructure change only)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run shard 4 without the fix
pnpm test:e2e --shard=4

# Expected Result: 6 of 8 tests fail with timeouts or 404 errors
# Admin dashboard test shows 404 page (not authenticated as super admin)
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint and format
pnpm lint:fix
pnpm format:fix

# Run shard 4 E2E tests
pnpm test:e2e --shard=4

# Expected Result: All 8 tests pass
# Admin dashboard test shows stat cards (authenticated as super admin with AAL2)
# No timeouts or 404 errors
```

### Regression Prevention

```bash
# Run full E2E suite to ensure no regressions in other shards
pnpm test:e2e

# Run with verbose logging to verify MFA verification
DEBUG_E2E_AUTH=true pnpm test:e2e --shard=4

# Expected Result: All tests pass, debug logs show "MFA verified (AAL2)" for super admin
```

## Dependencies

### New Dependencies

**No new dependencies required** - `totp-generator` already exists in the project

Verify it's available:
```bash
pnpm ls totp-generator
# Should show: totp-generator@x.x.x
```

### Existing Dependencies Used

- `@supabase/supabase-js` - Already used in global setup for Supabase client
- `totp-generator` - Already used in `AuthPageObject.submitMFAVerification()`

## Database Changes

**No database changes required**

- MFA factors are pre-seeded in test database
- No schema modifications needed
- No migrations required

## Deployment Considerations

**Deployment Risk**: none

- This is a test infrastructure change only
- No impact on production code
- Only affects E2E test setup
- Safe to deploy at any time

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] All 8 shard 4 tests pass
- [ ] No new test failures in other shards
- [ ] Admin can access `/admin` without 404
- [ ] Admin dashboard displays all stat cards
- [ ] Global setup completes without errors
- [ ] Debug logs confirm MFA verification for super admin
- [ ] Code passes `pnpm typecheck`
- [ ] Code passes `pnpm lint`

## Notes

**Implementation Details**:
- The TOTP key is already defined in test environment and pre-seeded with the super admin user
- MFA verification is only needed for the admin user in global setup
- Non-admin test users don't need MFA verification (they only need AAL1)
- Existing pattern in `AuthPageObject.submitMFAVerification()` provides reference implementation

**Decision Log**:
- Chose API-based MFA verification (not UI-based) because global setup runs once for all tests
- API-based is 100x faster and more reliable than UI-based verification
- TOTP generation uses same library and key as UI tests for consistency
- Error handling is lenient - missing MFA factors don't crash setup, just log warnings

**References**:
- Diagnosis: #729
- Related Pattern: `apps/e2e/tests/authentication/auth.po.ts:submitMFAVerification()`
- MFA Schema: `apps/web/supabase/schemas/13-mfa.sql:is_super_admin()`
- Supabase MFA API: https://supabase.com/docs/reference/javascript/auth-mfa

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #729*
