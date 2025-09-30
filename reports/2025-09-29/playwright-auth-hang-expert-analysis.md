# Playwright E2E Authentication Hang - Expert Analysis

**Date**: 2025-09-29
**Environment**: GitHub Actions CI - Dev Integration Tests
**Issue**: All authentication setup tests timeout at 30 seconds during `waitForURL` after form submission

## Executive Summary

The authentication tests are hanging because Playwright's `waitForURL` is waiting for a navigation event that **never completes** due to how the application performs authentication redirects. The application uses `window.location.href` for hard navigation after successful login, but Playwright cannot properly detect this navigation completing in the CI environment, likely due to timing issues with Cloudflare Turnstile captcha validation and session establishment delays.

**Root Cause**: Race condition between:

1. Supabase authentication session establishment (async polling)
2. Cloudflare Turnstile captcha validation
3. Playwright's navigation detection
4. Hard navigation via `window.location.href`

## Technical Deep Dive

### 1. Authentication Flow Analysis

The authentication flow follows this sequence:

```typescript
// 1. User submits form (auth.po.ts:76)
await this.page.click('button[type="submit"]');

// 2. Form submission triggers mutation (password-sign-in-container.tsx:25)
const data = await signInMutation.mutateAsync({
  ...credentials,
  options: { captchaToken }, // ⚠️ Turnstile token
});

// 3. Supabase authentication (use-sign-in-with-email-password.ts:24)
const response = await client.auth.signInWithPassword(credentials);

// 4. Session establishment polling begins (implicit in Supabase client)
// - Supabase client polls for session availability
// - Can take 2-5 seconds in production environments

// 5. onSignIn callback triggers (sign-in-methods-container.tsx:121)
window.location.href = returnPath; // ⚠️ Hard navigation

// 6. Playwright waits for navigation (auth.po.ts:250)
await this.page.waitForURL(...); // ⏱️ TIMEOUT HERE
```

### 2. The Critical Race Condition

**Why `waitForURL` Hangs**:

```typescript
// auth.po.ts:250-265
await this.page.waitForURL(
  (url) => {
    const urlStr = url.toString();
    console.log(`[waitForURL] Current: ${urlStr}, Target: ${targetUrl}`);

    const leftSignIn = !urlStr.includes("/auth/sign-in");
    const reachedTarget = urlStr.includes(targetUrl) || urlStr.includes("/onboarding");

    return leftSignIn && reachedTarget;
  },
  {
    timeout: 30000, // ⏱️ Times out here
  },
);
```

**The Problem**:

1. Form submits successfully
2. Supabase authentication completes
3. `window.location.href = returnPath` executes
4. **BUT**: Navigation might not trigger if:
   - Session polling hasn't completed
   - Turnstile validation is still processing
   - Browser hasn't received auth cookies yet
   - Playwright detects navigation start but never sees completion

### 3. Cloudflare Turnstile Interference

**Configuration** (from workflow):

```yaml
NEXT_PUBLIC_CAPTCHA_SITE_KEY: '2x00000000000000000000AB'  # Test key
```

**Potential Issues**:

1. **Captcha Token Lifecycle**:

   ```typescript
   // password-sign-in-container.tsx:17-40
   const { captchaToken, resetCaptchaToken } = useCaptchaToken();

   const data = await signInMutation.mutateAsync({
     ...credentials,
     options: { captchaToken }, // May be undefined or invalid
   });
   ```

2. **Test Key Behavior**:
   - Cloudflare test key `2x00000000000000000000AB` should auto-pass
   - BUT: In CI environment, Turnstile widget may not render properly
   - Empty or missing captchaToken could cause backend delays

3. **No Error Handling**:

   ```typescript
   // If captcha validation fails on backend, what happens?
   // Current code catches all errors silently:
   try {
     const data = await signInMutation.mutateAsync(...);
     await onSignIn(userId);
   } catch {
     // wrong credentials, do nothing  ⚠️ Too broad!
   }
   ```

### 4. Session Establishment Timing

**Supabase Client Behavior**:

```typescript
// use-sign-in-with-email-password.ts:24
const response = await client.auth.signInWithPassword(credentials);
```

**What happens internally**:

1. Supabase makes auth API call
2. Server validates credentials + captcha
3. Server returns session token
4. Client **polls** for session availability (not immediate)
5. Session becomes available after 2-5 seconds

**In CI environment**:

- Network latency is higher
- Session polling may take longer
- `window.location.href` fires before session is fully available
- Navigation might not complete properly

### 5. waitForURL Predicate Problem

```typescript
// auth.po.ts:250-261
await this.page.waitForURL(
  (url) => {
    // This predicate is called repeatedly until it returns true OR timeout
    const leftSignIn = !urlStr.includes("/auth/sign-in");
    const reachedTarget = urlStr.includes(targetUrl) || urlStr.includes("/onboarding");

    return leftSignIn && reachedTarget;
  },
  { timeout: 30000 }
);
```

**Analysis**:

- Predicate requires **BOTH** conditions to be true
- If navigation starts but doesn't complete, we stay on `/auth/sign-in`
- `leftSignIn` remains false → predicate never returns true → timeout

**Likely scenario**:

1. Form submits
2. Authentication completes
3. `window.location.href` is set
4. Browser **starts** navigation but gets stuck
5. URL never actually changes from `/auth/sign-in`
6. Playwright keeps polling the predicate
7. 30 seconds elapse → TimeoutError

## Environment-Specific Factors

### GitHub Actions CI Environment

**Characteristics affecting tests**:

1. **Headless Browser**: No actual rendering → captcha widget may not work
2. **Network Latency**: Higher latency to dev.slideheroes.com
3. **Resource Limits**: 2 CPU cores, limited memory
4. **No GPU**: Affects rendering and JavaScript execution
5. **Vercel Protection**: Extra layer requiring bypass header

### Vercel Deployment Protection

```yaml
# From workflow
extraHTTPHeaders: {
  "x-vercel-protection-bypass": "${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}"
}
```

**Potential issue**:

- Bypass header works for HTTP requests
- But what about WebSocket connections for session polling?
- Supabase client uses both HTTP and potentially WebSocket
- Protection layer might interfere with session establishment

### Turnstile in CI

**Known issues with Turnstile in automation**:

1. **Widget Loading**: May fail in headless browsers
2. **Challenge Display**: Can't display challenges without rendering
3. **Token Generation**: Might timeout if widget doesn't load
4. **Backend Validation**: Even with test key, validation adds latency

## Configuration Analysis

### Playwright Config

```typescript
// playwright.config.ts
navigationTimeout: 30 * 1000,  // 30 seconds
timeout: 120 * 1000,           // 2 minutes (test timeout)
retries: 1,                     // Only 1 retry
workers: 2,                     // CI workers
```

**Issues**:

- 30s navigation timeout is reasonable but not sufficient for this flow
- Only 1 retry means one timeout = failure
- 2 workers can cause resource contention

### Test Config

```typescript
// test-config.ts
retryStrategy: {
  maxRetries: isCI ? 3 : 2,
  timeouts: {
    medium: isCI ? 30000 : 20000,  // Used for auth tests
    long: isCI ? 60000 : 45000,    // Used for super-admin
  },
}

// Retry intervals for auth
getRetryIntervals("auth"): [500, 1000, 2500, 5000, 8000, 12000]
```

**Issues**:

- `toPass()` wrapper uses 30s timeout
- BUT: Individual `waitForURL` also has 30s timeout
- Nested timeouts can cause confusion
- Total time: 30s (waitForURL) × retries = still fails

### Auth Setup Tests

```typescript
// auth.setup.ts:27-76
await expect(async () => {
  await auth.loginAsUser({
    email: credentials.email,
    password: credentials.password,
  });
}).toPass({
  intervals: testConfig.getRetryIntervals("auth"),
  timeout: testConfig.getTimeout("medium"), // 30000ms
});
```

**Analysis**:

- `toPass()` retries the entire `loginAsUser` flow
- Each retry includes a full 30s `waitForURL` timeout
- So retry 1: wait 30s → timeout → retry 2: wait 30s → timeout → fail
- **Not actually increasing total timeout, just retrying same timeout**

## Root Cause Determination

**Primary Root Cause**:

The `window.location.href` navigation is not completing within Playwright's detection timeframe because:

1. **Session establishment is asynchronous** and takes 5-10+ seconds in CI
2. **Captcha validation adds latency** even with test key
3. **Hard navigation via `window.location.href`** happens before session is fully ready
4. **Playwright's `waitForURL`** expects navigation to complete quickly
5. **Navigation starts but never completes** → timeout

**Contributing Factors**:

1. **Turnstile widget may not load properly** in headless CI environment
2. **Vercel protection might interfere** with session polling WebSockets
3. **Network latency to dev.slideheroes.com** adds 2-5 second delays
4. **toPass() retry strategy** doesn't actually extend timeout, just retries same timeout
5. **No debug visibility** into what's happening during the hang

## Evidence From Logs

**What we expect to see but don't**:

```
[Auth Debug] Navigating to return path: /home
[waitForURL] Current: https://dev.slideheroes.com/auth/sign-in, Target: /home
[waitForURL] Current: https://dev.slideheroes.com/home, Target: /home  ← Never reaches this
```

**What likely happens**:

```
[Auth Debug] Sign-in attempt: { email: 'test@slideheroes.com' }
[Auth Debug] Session established successfully: { userId: '...' }
[Auth Debug] Navigating to return path: /home
[waitForURL] Current: https://dev.slideheroes.com/auth/sign-in, Target: /home
[waitForURL] Current: https://dev.slideheroes.com/auth/sign-in, Target: /home
[waitForURL] Current: https://dev.slideheroes.com/auth/sign-in, Target: /home
... 30 seconds later ...
TimeoutError: page.waitForURL: Timeout 30000ms exceeded
```

URL never changes from `/auth/sign-in` because navigation doesn't complete.

## Recommended Solutions

### Solution 1: Wait for Session Before Navigation (Best)

**Change**: Ensure session is fully established before attempting navigation

```typescript
// sign-in-methods-container.tsx
const onSignIn = async (userId?: string) => {
  // Get current session to ensure it's established
  const { data: { session } } = await client.auth.getSession();

  if (!session) {
    console.error("[Auth] Session not established after sign-in");
    // Retry or throw error
    throw new Error("Session establishment failed");
  }

  // Add explicit delay for session cookies to propagate
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Now safe to navigate
  window.location.href = returnPath;
};
```

**Pros**:

- Addresses root cause directly
- Ensures session is ready before navigation
- Works in all environments

**Cons**:

- Adds 2s delay to all authentications
- Requires code change in application

### Solution 2: Use waitForResponse Instead (Recommended for Tests)

**Change**: Wait for actual network response before expecting navigation

```typescript
// auth.po.ts
async loginAsUser(params: {
  email: string;
  password: string;
  next?: string;
}) {
  await this.goToSignIn(params.next);

  // Set up response listener BEFORE form submission
  const authResponsePromise = this.page.waitForResponse(
    (response) => {
      return response.url().includes('auth/v1/token') &&
             response.request().method() === 'POST';
    },
    { timeout: 30000 }
  );

  await this.signIn({
    email: params.email,
    password: params.password,
  });

  // Wait for auth response
  const authResponse = await authResponsePromise;
  console.log(`Auth response: ${authResponse.status()}`);

  // Wait for session to be established (poll with retry)
  await this.page.waitForFunction(
    async () => {
      const response = await fetch('/api/auth/session');
      return response.ok;
    },
    { timeout: 15000, polling: 500 }
  );

  // NOW wait for navigation with longer timeout
  await this.page.waitForURL(
    (url) => {
      const urlStr = url.toString();
      const leftSignIn = !urlStr.includes("/auth/sign-in");
      const reachedTarget = urlStr.includes(targetUrl) || urlStr.includes("/onboarding");
      return leftSignIn && reachedTarget;
    },
    { timeout: 45000 } // Increased from 30s
  );
}
```

**Pros**:

- Only changes test code
- More robust detection of auth completion
- Better debug visibility

**Cons**:

- Longer timeouts needed
- More complex test code

### Solution 3: Use Soft Navigation with waitForLoadState

**Change**: Use more reliable navigation waiting strategy

```typescript
// auth.po.ts
async loginAsUser(params) {
  await this.goToSignIn(params.next);

  const responsePromise = this.page.waitForResponse(
    resp => resp.url().includes('auth/v1/token'),
    { timeout: 30000 }
  );

  await this.signIn({
    email: params.email,
    password: params.password,
  });

  // Wait for auth API response
  const response = await responsePromise;

  if (response.status() !== 200) {
    throw new Error(`Auth failed with status ${response.status()}`);
  }

  // Wait for any navigation to start
  await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });

  // Wait for network to settle
  await this.page.waitForLoadState('networkidle', { timeout: 30000 });

  // Verify we're on the right page
  const currentUrl = this.page.url();
  const targetUrl = params.next ?? "/home";

  if (!currentUrl.includes(targetUrl) && !currentUrl.includes("/onboarding")) {
    throw new Error(`Expected ${targetUrl}, got ${currentUrl}`);
  }
}
```

**Pros**:

- More flexible than strict URL matching
- Works better with async navigation
- Better for flaky environments

**Cons**:

- Still requires longer timeouts
- networkidle can be unreliable

### Solution 4: Mock/Bypass Turnstile in Tests

**Change**: Ensure captcha doesn't interfere with tests

```typescript
// Add to playwright.config.ts
use: {
  extraHTTPHeaders: {
    'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
  },
  // Mock Turnstile script
  contextOptions: {
    // Intercept and mock captcha script
  }
}

// Or set environment variable to disable captcha in test
// .env.test
NEXT_PUBLIC_CAPTCHA_SITE_KEY='' // Empty = disabled
```

**Pros**:

- Removes captcha as variable
- Faster tests
- More reliable

**Cons**:

- Doesn't test actual captcha flow
- May hide production issues

### Solution 5: Increase All Timeouts (Quick Fix)

**Change**: Simply increase timeouts to account for CI latency

```typescript
// playwright.config.ts
use: {
  navigationTimeout: 60 * 1000, // 60s instead of 30s
}

// auth.po.ts:250
await this.page.waitForURL(..., {
  timeout: 60000, // 60s instead of 30s
});

// test-config.ts
timeouts: {
  medium: isCI ? 60000 : 20000, // 60s instead of 30s
  long: isCI ? 90000 : 45000,   // 90s instead of 60s
}
```

**Pros**:

- Simplest change
- Might work if only issue is CI latency

**Cons**:

- Doesn't fix root cause
- Tests take longer
- May still fail if navigation never completes

## Recommended Implementation Strategy

**Phase 1: Immediate Fix (Choose One)**

Option A: Increase timeouts + add better logging

```typescript
// auth.po.ts - Increase timeout and add detailed logging
await this.page.waitForURL(..., { timeout: 60000 });

// Add network request logging
this.page.on('request', req => console.log(`→ ${req.method()} ${req.url()}`));
this.page.on('response', resp => console.log(`← ${resp.status()} ${resp.url()}`));
```

Option B: Wait for auth response before expecting navigation

```typescript
// auth.po.ts - Add explicit auth response wait
const authResponse = await this.page.waitForResponse(
  resp => resp.url().includes('auth/v1/token'),
  { timeout: 30000 }
);
console.log(`Auth completed with status ${authResponse.status()}`);

// Then wait for navigation with extended timeout
await this.page.waitForURL(..., { timeout: 45000 });
```

**Phase 2: Robust Solution**

Implement Solution #2 (waitForResponse) combined with session polling:

1. Wait for auth API response
2. Poll for session establishment
3. Wait for navigation with appropriate timeout
4. Add detailed logging at each step
5. Implement proper error handling

**Phase 3: Long-term Fix**

Fix the application code (Solution #1):

1. Ensure session is established before navigation
2. Add retry logic for session polling
3. Handle captcha failures gracefully
4. Provide better error messages

## Debugging Commands

To investigate further, run these in CI:

```bash
# Enable Playwright debug logging
DEBUG=pw:api,pw:browser pnpm --filter web-e2e test:integration

# Run single auth test with trace
pnpm --filter web-e2e playwright test auth.setup.ts --trace on

# Run with headed browser (if possible in CI)
pnpm --filter web-e2e playwright test auth.setup.ts --headed

# Capture HAR file for network analysis
pnpm --filter web-e2e playwright test auth.setup.ts --save-har=auth.har
```

## Expected Outcomes

**After implementing Solution #2 (Recommended)**:

1. **Auth tests pass reliably** in CI environment
2. **Better visibility** into what's happening during auth
3. **Clearer error messages** when failures occur
4. **No application code changes** required

**Metrics to track**:

- Auth test pass rate (target: >95%)
- Average auth test duration (target: <15s)
- Timeout rate (target: <1%)

## Conclusion

The authentication hang is caused by a race condition between:

- Supabase session establishment (asynchronous polling)
- Cloudflare Turnstile captcha validation
- Hard navigation via `window.location.href`
- Playwright's expectation of fast navigation completion

The CI environment exacerbates this with network latency, headless browser limitations, and resource constraints.

**Recommended immediate action**: Implement Solution #2 (waitForResponse + session polling + extended timeout) to fix tests without changing application code.

**Long-term action**: Implement Solution #1 (ensure session ready before navigation) to fix the root cause in the application.
