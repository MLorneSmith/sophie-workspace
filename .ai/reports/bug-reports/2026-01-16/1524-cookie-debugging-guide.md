# E2E Cookie Debugging Guide

**Quick Reference for Troubleshooting E2E Authentication Issues**

---

## Common Symptoms & Solutions

### Symptom: Tests Pass Locally but Fail in CI

**Probable Cause**: Cookie transmission blocked by cross-site policy

**Quick Check**:
```bash
# Check if tests are running against Vercel preview
echo $PLAYWRIGHT_BASE_URL
# Should NOT be localhost if failing in CI
```

**Solution**: Verify `sameSite: "None"` is set for Vercel preview deployments

**File**: `apps/e2e/global-setup.ts:getCookieDomainConfig()`

---

### Symptom: Redirect to `/auth/sign-in` on Protected Routes

**Probable Cause**: Middleware not receiving authentication cookies

**Quick Check**:
```bash
# Enable debug logging in CI
DEBUG_E2E_AUTH=true pnpm --filter e2e test
```

**What to Look For**:
- `[DEBUG_E2E_AUTH:global-setup:cookies:setting]` - Cookie creation
- `cookiesCreated` count should be > 0
- `domain` should match the baseURL hostname
- `sameSite` should be "None" for Vercel preview, "Lax" for localhost

**Solution**: Check cookie attributes match deployment environment

---

### Symptom: Cookie Name Mismatch

**Probable Cause**: E2E Supabase URL doesn't match deployed app's URL

**Quick Check**:
```bash
# View healthcheck output in CI logs
# Look for "Supabase URL validation"
```

**What to Look For**:
- `Expected Cookie: sb-{projectRef}-auth-token`
- E2E URL should match App URL
- Project ref should be the same

**Solution**: Ensure `E2E_SUPABASE_URL` matches `NEXT_PUBLIC_SUPABASE_URL`

---

### Symptom: Cookies Not Found in Browser Context

**Probable Cause**: Storage state not loaded or cookies expired

**Quick Check**:
```bash
# Check if .auth/ directory has storage state files
ls -la .auth/
# Should see: test1@slideheroes.com.json, test2@slideheroes.com.json, etc.
```

**What to Look For**:
- Files should exist and have recent timestamps
- File size should be > 1KB (contains session data)

**Solution**: Re-run global setup to regenerate storage state

---

### Symptom: "URL validation failed" Error

**Probable Cause**: Different Supabase project used in E2E vs deployed app

**Quick Check**:
```bash
# Compare Supabase URLs
echo "E2E: $E2E_SUPABASE_URL"
echo "App: $NEXT_PUBLIC_SUPABASE_URL"
```

**Solution**: Update `E2E_SUPABASE_URL` to match the deployed app's Supabase project

---

## Debugging Commands

### Enable Verbose Logging

```bash
# E2E auth debug logging
DEBUG_E2E_AUTH=true pnpm --filter e2e test

# HAR file recording (captures HTTP headers)
RECORD_HAR_LOGS=true pnpm --filter e2e test
# Output: apps/e2e/test-results/requests.har
```

### Inspect Cookies in CI

```bash
# View global setup output in GitHub Actions
gh run view <run-id> --log | grep "Cookie"

# Look for these lines:
# 🍪 Cookie domain config: ...
# 🍪 Expected cookie name: ...
# 🍪 sb-xxx-auth-token:
#    Domain: ...
#    SameSite: ...
#    Secure: ...
```

### Manual Cookie Verification

```bash
# Run single test with debug output
pnpm --filter e2e test tests/auth/cookie-verification.spec.ts --debug
```

---

## Cookie Configuration Checklist

Use this checklist when modifying cookie configuration:

### For Localhost (HTTP)
- [ ] Domain: `localhost` or `127.0.0.1`
- [ ] SameSite: `Lax`
- [ ] Secure: `false`
- [ ] HttpOnly: `false` (Supabase SSR requirement)

### For Vercel Preview (HTTPS)
- [ ] Domain: `*.vercel.app` (explicit hostname)
- [ ] SameSite: `None` ← **CRITICAL for cross-site**
- [ ] Secure: `true` ← **REQUIRED for sameSite=None**
- [ ] HttpOnly: `false` (Supabase SSR requirement)

### For Production (HTTPS)
- [ ] Domain: `your-domain.com`
- [ ] SameSite: `Lax` (or `Strict` for higher security)
- [ ] Secure: `true`
- [ ] HttpOnly: `false` (Supabase SSR requirement)

---

## Key Files Reference

### Global Setup
**File**: `apps/e2e/global-setup.ts`

**Key Functions**:
- `getCookieDomainConfig(baseURL)` - Returns cookie config for environment
- `globalSetup(config)` - Main setup function, creates auth states

**Lines to Check**:
- Lines 49-104: `getCookieDomainConfig()` implementation
- Lines 840-847: Cookie domain config usage
- Lines 954-1023: Cookie creation and validation

### Playwright Config
**File**: `apps/e2e/playwright.config.ts`

**Key Config**:
- Line 102: `x-vercel-set-bypass-cookie: "samesitenone"` header
- Line 150: `storageState` path for test user
- Line 162: `storageState` path for payload admin

### Cookie Verification Utilities
**File**: `apps/e2e/tests/helpers/cookie-verification.ts`

**Key Functions**:
- `verifyCookiesPresent()` - Check if cookies exist
- `verifyCookieAttributes()` - Check security attributes
- `logCookieDetails()` - Debug output for cookies

### Middleware
**File**: `apps/web/proxy.ts`

**Key Functions**:
- `getUser()` - Validates auth session from cookies
- Lines that read `sb-{projectRef}-auth-token` cookie

---

## Environment Variable Reference

### Required for E2E Tests

```bash
# Playwright configuration
PLAYWRIGHT_BASE_URL=https://your-app.vercel.app  # Target deployment
TEST_BASE_URL=https://your-app.vercel.app        # Fallback
BASE_URL=https://your-app.vercel.app             # Second fallback

# Supabase configuration
E2E_SUPABASE_URL=https://xxx.supabase.co         # Must match deployed app
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx                # Anon key for API

# Vercel bypass (for deployed environments)
VERCEL_AUTOMATION_BYPASS_SECRET=xxx              # Protection bypass token

# Optional debugging
DEBUG_E2E_AUTH=true                              # Enable verbose logging
RECORD_HAR_LOGS=true                             # Capture HTTP headers
```

### Environment Detection Logic

```typescript
// Local development
if (baseURL.includes("localhost")) {
  // Use sameSite: "Lax", secure: false
}

// Vercel preview
if (baseURL.includes(".vercel.app")) {
  // Use sameSite: "None", secure: true
}

// Custom domain
else {
  // Use sameSite: "Lax", secure: true
}
```

---

## Troubleshooting Workflow

### Step 1: Verify Cookie Creation

**Command**:
```bash
DEBUG_E2E_AUTH=true pnpm --filter e2e test 2>&1 | grep "cookies:setting"
```

**Expected Output**:
```json
{
  "user": "test user",
  "totalCookies": 1,
  "domainStrategy": "explicit: your-domain",
  "sameSiteStrategy": "None" | "Lax",
  "cookies": [
    {
      "name": "sb-xxx-auth-token",
      "domain": "your-domain",
      "secure": true|false
    }
  ]
}
```

### Step 2: Verify Cookie Transmission

**Command**:
```bash
RECORD_HAR_LOGS=true pnpm --filter e2e test
```

**Then inspect HAR file**:
```bash
# Check if cookies are in request headers
cat apps/e2e/test-results/requests.har | grep "Cookie:"
# Should see: "Cookie: sb-xxx-auth-token=..."
```

### Step 3: Verify Middleware Recognition

**Check middleware logs** in deployed environment:
- Look for "session found" or "session validated" messages
- Check if JWT issuer matches expected Supabase URL
- Verify AAL (authentication assurance level) is set

### Step 4: Verify Supabase URL Alignment

**Command**:
```bash
# In CI logs, look for:
curl https://your-app.vercel.app/healthcheck?e2e_supabase_url=$E2E_SUPABASE_URL
```

**Expected Response**:
```json
{
  "urlValidation": {
    "valid": true,
    "e2eUrl": "https://xxx.supabase.co",
    "appUrl": "https://xxx.supabase.co",
    "projectRef": "xxx"
  }
}
```

---

## Common Mistakes to Avoid

### ❌ Don't: Use `sameSite: "Lax"` for Vercel Preview in CI

```typescript
// ❌ WRONG - Blocks cookies in CI
if (hostname.endsWith(".vercel.app")) {
  return { sameSite: "Lax" };  // Fails in cross-site context
}
```

### ✅ Do: Use `sameSite: "None"` for Vercel Preview in CI

```typescript
// ✅ CORRECT - Allows cookies in CI
if (hostname.endsWith(".vercel.app")) {
  return { sameSite: "None", secure: true };
}
```

---

### ❌ Don't: Set `httpOnly: true` for Supabase Auth Cookies

```typescript
// ❌ WRONG - Breaks @supabase/ssr client
await context.addCookies([{
  name: "sb-xxx-auth-token",
  httpOnly: true,  // Prevents JS access
}]);
```

### ✅ Do: Set `httpOnly: false` for Supabase Auth Cookies

```typescript
// ✅ CORRECT - Allows @supabase/ssr to read cookies
await context.addCookies([{
  name: "sb-xxx-auth-token",
  httpOnly: false,  // Required for getSession()
}]);
```

---

### ❌ Don't: Use `url` Property for Deployed Environments

```typescript
// ❌ WRONG - Unreliable with dynamic Vercel hostnames
await context.addCookies([{
  name: "sb-xxx-auth-token",
  url: baseURL,  // Playwright cookie API issue
}]);
```

### ✅ Do: Use Explicit `domain` and `path` Properties

```typescript
// ✅ CORRECT - Reliable across all environments
await context.addCookies([{
  name: "sb-xxx-auth-token",
  domain: hostname,  // Explicit domain
  path: "/",
}]);
```

---

### ❌ Don't: Hardcode Cookie Configuration

```typescript
// ❌ WRONG - Not adaptable to different environments
const cookieConfig = {
  sameSite: "Lax",  // Always Lax
  secure: false,     // Always insecure
};
```

### ✅ Do: Adapt Configuration Based on Environment

```typescript
// ✅ CORRECT - Environment-specific configuration
const cookieConfig = getCookieDomainConfig(baseURL);
const sameSite = cookieConfig.sameSite;  // "Lax" or "None"
const secure = baseURL.startsWith("https");  // Dynamic
```

---

## Quick Decision Matrix

### "Should I use sameSite=None or sameSite=Lax?"

```
Is this a cross-site context?
│
├─ YES (CI → Vercel)
│  └─ Use sameSite: "None" + secure: true
│
└─ NO (localhost → localhost)
   └─ Use sameSite: "Lax"
```

### "Should cookies be secure or not?"

```
Is the URL HTTPS?
│
├─ YES (Vercel, production)
│  └─ Use secure: true
│
└─ NO (localhost)
   └─ Use secure: false
```

### "Should cookies be httpOnly?"

```
Does JavaScript need to read this cookie?
│
├─ YES (@supabase/ssr auth cookies)
│  └─ Use httpOnly: false
│
└─ NO (Vercel bypass cookie)
   └─ Use httpOnly: true
```

---

## Testing & Validation

### Unit Test for Cookie Configuration

```typescript
describe("getCookieDomainConfig", () => {
  it("returns sameSite=None for Vercel preview", () => {
    const config = getCookieDomainConfig("https://app.vercel.app");
    expect(config.sameSite).toBe("None");
    expect(config.isVercelPreview).toBe(true);
  });

  it("returns sameSite=Lax for localhost", () => {
    const config = getCookieDomainConfig("http://localhost:3001");
    expect(config.sameSite).toBe("Lax");
    expect(config.isVercelPreview).toBe(false);
  });
});
```

### Integration Test for Cookie Transmission

```typescript
test("cookies are sent with requests to protected routes", async () => {
  const { page, context } = await setupAuthContext();

  // Navigate to protected route
  await page.goto("/home");

  // Should NOT redirect to sign-in
  await expect(page).not.toHaveURL(/\/auth\/sign-in/);

  // Should see authenticated content
  await expect(page.locator('[data-testid="team-selector"]')).toBeVisible();
});
```

---

## Related Documentation

- **Main Summary**: `1524-summary-vercel-cookie-samesite-fix.md`
- **Flow Diagram**: `1524-cookie-flow-diagram.md`
- **Diagnosis Report**: `1523-diagnosis-dev-integration-tests-auth-failure.md`
- **Bug Plan**: `1524-bug-plan-playwright-vercel-cookies.md`
- **Implementation**: `1524-implementation-playwright-vercel-cookies.md`

---

## Support & Resources

### Internal Resources
- Cookie verification utilities: `apps/e2e/tests/helpers/cookie-verification.ts`
- Global setup: `apps/e2e/global-setup.ts`
- Playwright config: `apps/e2e/playwright.config.ts`

### External Resources
- [Playwright Cookie API](https://playwright.dev/docs/api/class-browsercontext#browser-context-add-cookies)
- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [Vercel Protection Bypass](https://vercel.com/docs/deployments/preview-deployments#protection-bypass-automation)

---

*Guide created by Claude Code*
*Date: 2026-01-16*
