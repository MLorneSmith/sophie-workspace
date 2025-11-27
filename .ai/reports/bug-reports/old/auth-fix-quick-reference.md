# Authentication Fix - Quick Reference

**Issue**: E2E tests timeout at authentication on dev deployment
**Root Cause**: Missing `CAPTCHA_SECRET_TOKEN` in Vercel environment
**Estimated Fix Time**: 5-15 minutes

---

## Quick Diagnosis

### Symptoms

- ✅ Tests pass locally
- ❌ Tests timeout on CI (dev.slideheroes.com)
- ⏱️ Timeout at `page.waitForURL` after 45 seconds
- 🔄 URL never changes from `/auth/sign-in`

### Root Cause

```text
Client Side (CI):   NEXT_PUBLIC_CAPTCHA_SITE_KEY = '2x00000000000000000000AB' ✅
Server Side (Vercel): CAPTCHA_SECRET_TOKEN = ??? ❌ MISSING

Result: Authentication fails server-side during captcha validation
        Client has poor error handling → appears as navigation timeout
```

---

## Fix Options

### Option 1: Configure Vercel (RECOMMENDED - 5 min)

**Best for**: Quick fix, no code changes, production-ready

```bash
# 1. Go to Vercel Dashboard
https://vercel.com/[your-team]/slideheroes/settings/environment-variables

# 2. Add Environment Variable
Name:        CAPTCHA_SECRET_TOKEN
Value:       2x0000000000000000000000000000000AA
Environment: Preview, Development
[Save]

# 3. Redeploy
vercel --prod
# Or trigger via GitHub push to dev branch
```

**Verification**:

```bash
# Check environment variable is set
vercel env ls | grep CAPTCHA_SECRET_TOKEN

# Test authentication (should succeed)
pnpm --filter web-e2e playwright test auth.setup.ts
```

---

### Option 2: Skip Captcha in Tests (15 min)

**Best for**: No Vercel access, quick workaround

**Step 1**: Update verification function

File: `/home/msmith/projects/2025slideheroes/packages/features/auth/src/captcha/server/verify-captcha.tsx`

```typescript
export async function verifyCaptchaToken(token: string) {
  // Skip validation in test/CI environments
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.SKIP_CAPTCHA_VALIDATION === 'true'
  ) {
    console.warn('[CAPTCHA] Validation skipped (test environment)');
    return; // Early return - no validation
  }

  if (!CAPTCHA_SECRET_TOKEN) {
    throw new Error("CAPTCHA_SECRET_TOKEN is not set");
  }

  // ... rest of existing validation code
}
```

**Step 2**: Update CI workflow

File: `/home/msmith/projects/2025slideheroes/.github/workflows/dev-integration-tests.yml`

```yaml
# Around line 430, add:
env:
  NEXT_PUBLIC_CAPTCHA_SITE_KEY: '2x00000000000000000000AB'
  SKIP_CAPTCHA_VALIDATION: 'true'  # ← ADD THIS LINE
```

**Step 3**: Deploy and test

```bash
git add -A
git commit -m "fix(e2e): skip captcha validation in test environment"
git push origin dev
```

---

### Option 3: Mock Captcha in Playwright (20 min)

**Best for**: Testing without server changes

File: `/home/msmith/projects/2025slideheroes/apps/e2e/tests/authentication/auth.po.ts`

```typescript
async signIn(params: { email: string; password: string }) {
  // Mock Turnstile verification endpoint
  await this.page.route(
    '**/challenges.cloudflare.com/turnstile/v0/siteverify',
    (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
  );

  // Rest of existing sign-in code...
  await this.page.fill('[data-test="email-input"]', params.email);
  await this.page.fill('[data-test="password-input"]', params.password);
  await this.page.click('button[type="submit"]');
}
```

---

## Verification Steps

### After applying fix:

```bash
# 1. Check Vercel deployment status
vercel ls

# 2. Run single auth test
pnpm --filter web-e2e playwright test auth.setup.ts --headed

# 3. Check for success indicators
# ✅ Test completes in <15 seconds
# ✅ URL changes from /auth/sign-in to /home
# ✅ No "CAPTCHA_SECRET_TOKEN is not set" errors
# ✅ Console shows: "Session established successfully"

# 4. Run full test suite
pnpm --filter web-e2e test:integration
```

---

## Debugging Commands

### Check current configuration:

```bash
# Vercel environment variables
vercel env ls

# Check if deployed app has captcha configured
curl -s https://dev.slideheroes.com/api/health | jq '.checks.captchaConfigured'
```

### Monitor authentication flow:

```bash
# Run with debug logging
DEBUG=pw:api pnpm --filter web-e2e playwright test auth.setup.ts

# View network requests
pnpm --filter web-e2e playwright test auth.setup.ts --trace on
```

### Check logs:

```bash
# Vercel deployment logs
vercel logs https://dev.slideheroes.com --follow

# Local test logs
pnpm --filter web-e2e playwright test auth.setup.ts 2>&1 | grep -E "(Auth Debug|CAPTCHA|Error)"
```

---

## Expected Results

### Before Fix

```text
❌ TimeoutError: page.waitForURL: Timeout 45000ms exceeded
❌ Test Duration: ~45 seconds
❌ URL stuck on: /auth/sign-in
```

### After Fix

```text
✅ Test passes: "User can sign in with password"
✅ Test Duration: <15 seconds
✅ Final URL: /home or /onboarding
✅ Console: "Session established successfully"
```

---

## Rollback Plan

If fix causes issues:

### Option 1 Rollback (Vercel):

```bash
# Remove environment variable
vercel env rm CAPTCHA_SECRET_TOKEN preview
vercel env rm CAPTCHA_SECRET_TOKEN development
```

### Option 2 Rollback (Code):

```bash
git revert HEAD
git push origin dev
```

---

## Next Steps

After immediate fix:

1. **Add error handling** (30 min)
   - Better error messages in `password-sign-in-container.tsx`
   - Don't call `onSignIn` if auth fails
   - Show user-friendly captcha errors

2. **Add health check** (15 min)
   - Create `/api/health` endpoint
   - Validate environment variables
   - CI fails fast if misconfigured

3. **Add environment validation** (15 min)
   - Check required env vars at build time
   - Log warnings for missing variables
   - Prevent deployment if critical vars missing

---

## Key Files

```text
Configuration:
├─ .github/workflows/dev-integration-tests.yml  # CI environment variables
├─ apps/web/config/auth.config.ts               # Auth configuration
└─ apps/web/next.config.mjs                     # Build-time validation

Server-Side:
└─ packages/features/auth/src/captcha/server/verify-captcha.tsx  # Captcha validation

Client-Side:
├─ packages/features/auth/src/components/sign-in-methods-container.tsx     # onSignIn callback
├─ packages/features/auth/src/components/password-sign-in-container.tsx    # Form submission
└─ packages/features/auth/src/captcha/client/captcha-provider.tsx          # Token state

Tests:
└─ apps/e2e/tests/authentication/auth.po.ts     # Test helper
```

---

## Support Resources

- **Full Investigation Report**: `reports/2025-09-30/auth-flow-deployment-investigation.md`
- **Previous Analysis**: `reports/2025-09-29/playwright-auth-hang-expert-analysis.md`
- **Cloudflare Turnstile Docs**: <https://developers.cloudflare.com/turnstile/troubleshooting/testing/>
- **Vercel Env Vars**: <https://vercel.com/docs/projects/environment-variables>

---

## Questions to Answer

- [ ] Is `CAPTCHA_SECRET_TOKEN` set in Vercel project settings?
- [ ] Are we using test keys or production keys?
- [ ] Do test keys match? (Client: `2x...AB`, Server: `2x...AA`)
- [ ] Can we access Vercel dashboard to set env vars?
- [ ] Is captcha validation required for E2E tests?

---

**Recommended Action**: Start with **Option 1** (Configure Vercel) - it's the fastest and most production-ready fix.
