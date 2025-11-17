# MFA Timeout Root Cause Analysis

## Issue Summary

**Problem**: Super-admin authentication setup times out at 45000ms when attempting to verify MFA.

**Affected Tests**: Shards 3-7 (all tests requiring super-admin authentication)

**Root Cause**: **Selector Mismatch** - Test uses wrong selector for MFA input field.

---

## Technical Analysis

### Expected vs Actual Selectors

**Test Looking For** (`auth.po.ts:110`):
```typescript
const otpInput = this.page.locator("[data-input-otp]");
await otpInput.waitFor({ state: "visible" });
```

**Actual HTML Rendered** (from diagnostic logs):
```json
{
  "name": "verificationCode",
  "id": "_r_0_-form-item",
  "type": "text"
}
```

**Missing**: `data-input-otp` attribute does not exist on the input element!

### Component Hierarchy

```
MultiFactorChallengeContainer (multi-factor-challenge-container.tsx)
└── InputOTP (packages/ui/src/shadcn/input-otp.tsx)
    └── OTPInput (from 'input-otp' npm library)
        └── <input name="verificationCode" />
```

The `InputOTP` wraps the external `input-otp` library which renders a standard HTML input with `name="verificationCode"`.

### Why It Times Out

1. ✅ Login succeeds - Auth API responds with 200
2. ✅ Navigates to `/auth/verify`
3. ❌ `await otpInput.waitFor({ state: "visible" })` waits for `[data-input-otp]`
4. ❌ Element never found (doesn't exist)
5. ❌ Waits for timeout (10000ms in `submitMFAVerification`)
6. ❌ Never proceeds to submit button check
7. ❌ Total timeout: 45000ms in `loginAsSuperAdmin`

### Diagnostic Evidence

From test run logs:
```
✅ Navigation complete (1391ms total). Final URL: http://localhost:3001/auth/verify

❌ Authentication failed for michael@slideheroes.com
Current URL: http://localhost:3001/auth/verify
Available inputs: [
  {
    "name": "verificationCode",
    "id": "_r_0_-form-item",
    "type": "text"
  }
]
```

**Key Insight**: The page **successfully loaded**, but the test couldn't find the input due to wrong selector!

---

## Solution

### Fix 1: Update Selector in auth.po.ts

**File**: `apps/e2e/tests/authentication/auth.po.ts`
**Lines**: 110, 210

**Change**:
```typescript
// ❌ OLD (line 110)
const otpInput = this.page.locator("[data-input-otp]");

// ✅ NEW
const otpInput = this.page.locator('[name="verificationCode"]');
```

```typescript
// ❌ OLD (line 210)
const mfaInput = await this.page.locator("[data-input-otp]").count();

// ✅ NEW
const mfaInput = await this.page.locator('[name="verificationCode"]').count();
```

### Alternative: Add data-input-otp to Component

If you want to keep the test selector, add the attribute to the component:

**File**: `packages/ui/src/shadcn/input-otp.tsx`
```typescript
const InputOTP: React.FC<React.ComponentPropsWithoutRef<typeof OTPInput>> = ({
	className,
	containerClassName,
	...props
}) => (
	<OTPInput
		data-input-otp="true"  // ✅ Add this
		containerClassName={cn(
			"flex items-center gap-2 has-disabled:opacity-50",
			containerClassName,
		)}
		className={cn("disabled:cursor-not-allowed", className)}
		{...props}
	/>
);
```

**Recommendation**: Use Fix 1 (update selector) - more reliable and doesn't modify UI library.

---

## Verification Steps

After applying the fix:

1. Run super-admin auth setup:
   ```bash
   cd apps/e2e
   pnpm playwright test tests/auth.setup.ts -g "super-admin"
   ```

2. Expected result:
   - Login succeeds ✅
   - Navigates to `/auth/verify` ✅
   - Finds MFA input `[name="verificationCode"]` ✅
   - Enters TOTP code ✅
   - Waits for button to enable ✅
   - Clicks submit ✅
   - Completes MFA verification ✅

3. Run affected shards:
   ```bash
   pnpm test:shard3  # Accounts
   pnpm test:shard4  # Admin & Invitations
   pnpm test:shard5  # Billing
   ```

---

## Files to Update

### Primary Fix
- `apps/e2e/tests/authentication/auth.po.ts` (lines 110, 210)

### Related Files (for context)
- `apps/web/app/auth/verify/page.tsx` - MFA verification page
- `packages/features/auth/src/components/multi-factor-challenge-container.tsx` - MFA form component
- `packages/ui/src/shadcn/input-otp.tsx` - Input OTP wrapper
- `apps/web/supabase/seeds/01_main_seed.sql` - MFA secret seed data (already correct)

---

## Impact Assessment

**Before Fix**:
- Super-admin authentication: 0% success rate
- Shards 3-7: Cascading failures (tests skipped due to auth setup failure)
- Total E2E failures: 18/147 (12%)

**After Fix** (projected):
- Super-admin authentication: 100% success rate
- Shards 3-7: Expected to pass
- Total E2E failures: 1/147 (0.7% - only localStorage issue, now fixed)

**Time Saved**: ~150 seconds per test run (no more timeout waits)

---

## Lessons Learned

1. **Always verify selectors match actual HTML** - Don't assume attributes exist
2. **Use diagnostic tests for selector issues** - Dump actual DOM state
3. **Check component library internals** - Third-party libraries may render differently
4. **Prefer stable selectors** - `name` attribute is more stable than custom `data-*` attributes
5. **Test in isolation first** - Reproduce issues in minimal tests before complex setups

---

Generated: 2025-10-30T19:15:00Z
Related: e2e-failure-analysis.md (localStorage fix)
