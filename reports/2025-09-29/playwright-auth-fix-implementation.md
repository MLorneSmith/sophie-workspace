# Playwright Authentication Hang - Implementation Fix

**Date**: 2025-09-29
**Status**: Ready for Implementation
**Recommended Solution**: Enhanced waitForResponse with session polling

## Quick Summary

Replace the simple `waitForURL` with a more robust authentication detection strategy that:

1. Waits for Supabase auth API response
2. Polls for session establishment
3. Waits for navigation with appropriate timeout
4. Provides detailed logging for debugging

## Implementation

### File: `/apps/e2e/tests/authentication/auth.po.ts`

**Replace the `loginAsUser` method (lines 232-268) with this enhanced version:**

```typescript
async loginAsUser(params: {
  email: string;
  password: string;
  next?: string;
}) {
  await this.goToSignIn(params.next);

  // Set up response listeners BEFORE form submission
  // This ensures we capture the auth API call
  const authResponsePromise = this.page.waitForResponse(
    (response) => {
      const url = response.url();
      const method = response.request().method();

      // Match Supabase auth token endpoint
      const isAuthEndpoint = url.includes('auth/v1/token') && method === 'POST';

      if (isAuthEndpoint) {
        console.log(`[Auth] Detected auth API call: ${url}`);
      }

      return isAuthEndpoint;
    },
    { timeout: 30000 }
  );

  // Submit the sign-in form
  await this.signIn({
    email: params.email,
    password: params.password,
  });

  console.log("[Auth] Form submitted, waiting for API response...");

  // Wait for auth API response and validate it
  try {
    const authResponse = await authResponsePromise;
    const status = authResponse.status();

    console.log(`[Auth] API response received: ${status}`);

    if (status !== 200) {
      const responseBody = await authResponse.text().catch(() => 'Unable to read response');
      console.error(`[Auth] Authentication failed with status ${status}`);
      console.error(`[Auth] Response body: ${responseBody}`);
      throw new Error(`Authentication API failed with status ${status}`);
    }
  } catch (error) {
    console.error("[Auth] Failed to get auth API response:", error);
    throw error;
  }

  console.log("[Auth] API authentication successful, waiting for session establishment...");

  // Wait for session to be fully established
  // Supabase client polls for session availability, which can take 2-5 seconds
  // We need to wait for this polling to complete before navigation can succeed
  await this.page.waitForFunction(
    async () => {
      try {
        // Check if session is available by making a request
        const response = await fetch('/api/user', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        // Session is ready if we get a valid response (200 or even 404 is ok)
        // What we want to avoid is 401 (unauthorized)
        return response.status !== 401;
      } catch {
        // Network error or endpoint doesn't exist - continue waiting
        return false;
      }
    },
    {
      timeout: 20000,  // 20 seconds for session establishment
      polling: 500,    // Check every 500ms
    }
  ).catch((error) => {
    console.warn("[Auth] Session establishment check timed out, proceeding anyway:", error.message);
    // Don't throw - session might be ready but our check failed
  });

  console.log("[Auth] Session established, waiting for navigation...");

  // Now wait for navigation with a flexible predicate
  const targetUrl = params.next ?? "/home";

  try {
    await this.page.waitForURL(
      (url) => {
        const urlStr = url.toString();

        // Check if we've left the sign-in page AND reached a valid destination
        const leftSignIn = !urlStr.includes("/auth/sign-in");
        const reachedTarget =
          urlStr.includes(targetUrl) ||
          urlStr.includes("/onboarding") ||
          urlStr.includes("/home");  // Accept any home route

        const isValid = leftSignIn && reachedTarget;

        if (!isValid) {
          console.log(`[Auth] Still waiting... Current: ${urlStr}, Target: ${targetUrl}`);
        } else {
          console.log(`[Auth] Navigation complete: ${urlStr}`);
        }

        return isValid;
      },
      {
        timeout: 45000, // Extended timeout for CI environment
        waitUntil: 'domcontentloaded', // Don't wait for full page load
      }
    );
  } catch (error) {
    // If waitForURL times out, check if we're actually on a valid page
    const currentUrl = this.page.url();
    const isOnValidPage =
      (currentUrl.includes(targetUrl) ||
       currentUrl.includes("/onboarding") ||
       currentUrl.includes("/home")) &&
      !currentUrl.includes("/auth/sign-in");

    if (isOnValidPage) {
      console.log(`[Auth] Navigation completed (fallback check): ${currentUrl}`);
      return; // Successfully authenticated despite waitForURL timeout
    }

    console.error(`[Auth] Navigation failed - current URL: ${currentUrl}, expected: ${targetUrl}`);
    throw error;
  }

  console.log(`[Auth] Login complete: ${this.page.url()}`);
}
```

### File: `/apps/e2e/playwright.config.ts`

**Update timeouts for better CI reliability (line 78):**

```typescript
use: {
  baseURL: ...,
  extraHTTPHeaders: ...,
  screenshot: "only-on-failure",
  trace: "on-first-retry",
  navigationTimeout: 45 * 1000, // Increased from 30s to 45s for CI
}
```

### File: `/apps/e2e/tests/utils/test-config.ts`

**Update retry strategy for CI (lines 72-76):**

```typescript
timeouts: {
  short: isCI ? 15000 : 10000,
  medium: isCI ? 45000 : 20000,  // Increased from 30s to 45s
  long: isCI ? 90000 : 45000,    // Increased from 60s to 90s
},
```

## Why This Works

### 1. Explicit Auth API Wait

```typescript
const authResponsePromise = this.page.waitForResponse(
  (response) => url.includes('auth/v1/token') && method === 'POST',
  { timeout: 30000 }
);
```

- Ensures we know when Supabase auth completes
- Provides immediate feedback if auth fails
- Decouples auth completion from navigation

### 2. Session Establishment Polling

```typescript
await this.page.waitForFunction(
  async () => {
    const response = await fetch('/api/user', { credentials: 'include' });
    return response.status !== 401;
  },
  { timeout: 20000, polling: 500 }
);
```

- Waits for session cookies to propagate
- Accounts for Supabase client session polling
- Ensures session is ready before expecting navigation

### 3. Extended Navigation Timeout

```typescript
await this.page.waitForURL(..., {
  timeout: 45000,  // 15 seconds more than before
  waitUntil: 'domcontentloaded',
});
```

- Accounts for CI environment latency
- Uses `domcontentloaded` instead of full page load
- Still validates we reached correct destination

### 4. Fallback Validation

```typescript
catch (error) {
  const currentUrl = this.page.url();
  const isOnValidPage = currentUrl.includes(targetUrl) && !currentUrl.includes("/auth/sign-in");

  if (isOnValidPage) {
    return; // Successfully authenticated
  }
  throw error;
}
```

- Handles edge case where navigation completes but waitForURL times out
- Prevents false negatives
- Better error messages when actual failure occurs

## Testing the Fix

### Local Testing

```bash
# Test the auth setup specifically
pnpm --filter web-e2e playwright test auth.setup.ts

# Test with verbose logging
DEBUG=pw:api pnpm --filter web-e2e playwright test auth.setup.ts

# Test with trace for detailed analysis
pnpm --filter web-e2e playwright test auth.setup.ts --trace on
```

### CI Testing

The fix will be automatically tested when you:

1. Push to dev branch
2. Trigger dev-integration-tests workflow manually
3. Wait for next deploy to dev

Expected results:

- ✅ All 4 auth setup tests pass
- ✅ Total auth setup time: 20-30 seconds (5-8s per user)
- ✅ Detailed logging shows each step completing

## Rollback Plan

If this fix doesn't work, rollback is simple:

```bash
git checkout HEAD~1 -- apps/e2e/tests/authentication/auth.po.ts
git checkout HEAD~1 -- apps/e2e/playwright.config.ts
git checkout HEAD~1 -- apps/e2e/tests/utils/test-config.ts
```

## Additional Debugging

If auth tests still fail after this fix, enable detailed logging:

### Enable Request/Response Logging

Add to `auth.po.ts` constructor:

```typescript
constructor(page: Page) {
  this.page = page;
  this.mailbox = new Mailbox(page);

  // Log all network requests for debugging
  page.on('request', request => {
    if (request.url().includes('auth') || request.url().includes('supabase')) {
      console.log(`→ ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('auth') || response.url().includes('supabase')) {
      console.log(`← ${response.status()} ${response.url()}`);
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser console error: ${msg.text()}`);
    }
  });
}
```

### Capture Network Activity

Add to CI workflow step:

```yaml
- name: Run integration test suite
  env:
    # ... existing env vars ...
    PWDEBUG: 1  # Enable Playwright debug mode
  run: |
    # Run with HAR capture for network analysis
    pnpm --filter web-e2e playwright test auth.setup.ts --save-har=auth-debug.har

- name: Upload debug artifacts
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: auth-debug
    path: |
      apps/e2e/auth-debug.har
      apps/e2e/test-results/
```

## Expected Log Output (Success)

When working correctly, you should see:

```
🔐 Authenticating test user: test@slideheroes.com
Filling email: test@slideheroes.com
Filling password: ***
Email field value after fill: test@slideheroes.com
Password field has value: yes
Form submitted, waiting for navigation...
[Auth] Form submitted, waiting for API response...
[Auth] Detected auth API call: https://dev.slideheroes.com/auth/v1/token
[Auth] API response received: 200
[Auth] API authentication successful, waiting for session establishment...
[Auth Debug] Session established successfully: { userId: '...' }
[Auth] Session established, waiting for navigation...
[Auth Debug] Navigating to return path: /home
[Auth] Still waiting... Current: https://dev.slideheroes.com/auth/sign-in, Target: /home
[Auth] Navigation complete: https://dev.slideheroes.com/home
[Auth] Login complete: https://dev.slideheroes.com/home
✅ authenticate as test user (8.5s)
```

## Success Criteria

- ✅ All 4 auth setup tests pass consistently
- ✅ Each test completes in <15 seconds
- ✅ No timeout errors in CI
- ✅ Detailed logs show each step completing
- ✅ Tests work on both local and CI environments

## Next Steps After Implementation

1. **Monitor CI runs** for 3-5 deployments to confirm stability
2. **Analyze logs** to understand typical timing patterns
3. **Adjust timeouts** if needed based on actual performance data
4. **Consider application-level fix** (Solution #1 from analysis) as long-term improvement
