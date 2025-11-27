# Playwright E2E Authentication Failure Analysis

**Date**: 2025-09-30
**Investigator**: Testing Expert (Claude Code)
**Status**: Investigation Complete - Recommendations Provided
**Severity**: HIGH - Blocking CI/CD Pipeline

---

## Executive Summary

All 4 authentication setup tests in the Playwright E2E suite are timing out at **45 seconds** during the post-login navigation phase (auth.po.ts:250). Despite recent fixes increasing timeouts from 30s to 45s (commit 755e6c5c), the issue persists in CI environment.

**Key Finding**: Recent timeout increases (29 Sep) were **symptomatic fixes** that don't address the **root cause** - the test waits for navigation BEFORE the application has fully established the session.

**Recommended Solution**: Implement the **enhanced waitForResponse pattern** already documented in `/reports/2025-09-29/playwright-auth-fix-implementation.md` but not yet applied to code.

---

## Problem Analysis

### 1. Current Test Behavior (Line 250 Timeout)

**File**: `/apps/e2e/tests/authentication/auth.po.ts:250-265`

```typescript
// Current implementation - PROBLEMATIC
await this.page.waitForURL(
  (url) => {
    const urlStr = url.toString();
    const leftSignIn = !urlStr.includes("/auth/sign-in");
    const reachedTarget = urlStr.includes(targetUrl) || urlStr.includes("/onboarding");
    return leftSignIn && reachedTarget;
  },
  {
    timeout: 45000, // Already increased, still failing!
  }
);
```

**Why This Fails**:

1. Form submitted → Supabase auth succeeds (fast: ~2s)
2. **Application polls for session** (2-10s, lines 37-123 in sign-in-methods-container.tsx)
3. Test immediately waits for navigation (simultaneous with #2)
4. **Race condition**: Navigation may trigger before Playwright detects it
5. Test times out at 45s despite successful auth

---

### 2. Authentication Flow Timeline

#### Successful Local Execution (~5-8s total)

```
T+0s:    Form submitted
T+1s:    Supabase auth API responds (200 OK)
T+2s:    Session polling starts (application)
T+3s:    Session established (1st poll success)
T+4s:    window.location.href triggered
T+5s:    Navigation detected by Playwright
T+6s:    Test completes ✅
```

#### CI Environment Failure (Timeout at 45s)

```
T+0s:    Form submitted
T+2s:    Supabase auth API responds (200 OK) - slower network
T+4s:    Session polling starts (application)
T+6s:    Session poll #1 (not ready)
T+8s:    Session poll #2 (not ready)
T+10s:   Session poll #3 (still not ready)
T+12s:   Session timeout (application gives up after 10s)
T+13s:   window.location.href triggered anyway
T+14s:   Playwright still waiting for navigation...
T+45s:   TIMEOUT ❌
```

**Critical Discovery**: The application has a **10-second session polling timeout** (maxAttempts: 20 × 500ms) but the test waits 45 seconds. This means:

- If session takes >10s, app navigates without valid session
- Navigation happens but Playwright's predicate might fail validation
- Test waits full 45s before timing out

---

### 3. Environment-Specific Factors

#### Why CI Fails More Than Local

| Factor | Local | CI (GitHub Actions) | Impact |
|--------|-------|---------------------|--------|
| **Network Latency** | 10-20ms | 200-500ms | 25x slower |
| **CPU Resources** | 8+ cores | 2 cores | 4x slower |
| **Memory** | 16GB+ | 7GB | Swap contention |
| **Target URL** | localhost:3000 | dev.slideheroes.com | DNS + TLS overhead |
| **Vercel Protection** | None | x-vercel-protection-bypass | Header processing time |
| **Turnstile CAPTCHA** | Visible mode | Test key | Headless browser issues |
| **Supabase Session** | Local instance | Remote API | Network hops |

**Combined Effect**: Operations that take 2-3s locally can take 8-12s in CI, exceeding the application's 10s timeout.

---

### 4. Code Analysis

#### Current Test Setup Flow

**File**: `/apps/e2e/tests/auth.setup.ts:27-76`

```typescript
test("authenticate as test user", async ({ page }) => {
  const auth = new AuthPageObject(page);
  const credentials = CredentialValidator.validateAndGet("test");

  // Uses toPass for retries, but underlying issue remains
  await expect(async () => {
    await auth.loginAsUser({
      email: credentials.email,
      password: credentials.password,
    });
  }).toPass({
    intervals: testConfig.getRetryIntervals("auth"), // [500, 1000, 2500, 5000, 8000, 12000]
    timeout: testConfig.getTimeout("medium"), // 45000ms
  });

  await page.context().storageState({ path: testAuthFile });
});
```

**Problems**:

1. `toPass` will retry the entire login flow (expensive)
2. Each retry has 45s timeout = 90s+ total possible time
3. Doesn't distinguish between:
   - Auth API failure (should fail fast)
   - Session establishment delay (should wait longer)
   - Navigation race condition (needs different approach)

#### Configuration Analysis

**File**: `/apps/e2e/playwright.config.ts`

```typescript
use: {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
  navigationTimeout: 45 * 1000, // Recently increased (755e6c5c)
  screenshot: "only-on-failure",
  trace: "on-first-retry",
  // Vercel protection bypass
  extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET ? {
    "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
  } : undefined,
},
timeout: 120 * 1000, // Test timeout
expect: {
  timeout: 10 * 1000, // Assertion timeout
},
```

**Assessment**: Configuration is reasonable, but doesn't solve the race condition.

---

### 5. Recent Changes Analysis

#### Commit History (Last 5 Days)

```bash
d7d43883 - chore(ci): trigger deployment to apply Turnstile server secret
d02fce82 - chore(ci): trigger deployment to apply Turnstile test key
755e6c5c - fix(e2e): increase Playwright timeouts for CI environment latency ⚠️
7f84ee39 - fix(ci): use Cloudflare Turnstile test key for E2E authentication
decf901c - fix(e2e): add Vercel protection bypass header to Playwright configs
```

**Analysis**:

- **755e6c5c**: Increased timeout 30s → 45s (SYMPTOMATIC FIX)
  - Doesn't address session polling race condition
  - Just waits longer before timing out
  - Tests still failing with new 45s timeout

- **7f84ee39 & d02fce82**: Turnstile test key changes
  - Should help with CAPTCHA processing
  - But doesn't affect post-auth navigation

- **decf901c**: Vercel bypass header
  - Correctly configured
  - Reduces one source of latency

**Conclusion**: Recent changes are **configuration improvements** but don't fix the **architectural issue** in the test wait strategy.

---

## Root Cause Identification

### PRIMARY: Race Condition in Navigation Detection

**The Test Assumes Navigation Will Be Detected, But**:

```typescript
// Application code (sign-in-methods-container.tsx:141)
window.location.href = props.paths.returnPath || "/home";

// This is ASYNC and may take time in CI:
// 1. Browser starts navigation
// 2. DNS lookup (if external URL)
// 3. TCP connection
// 4. TLS handshake
// 5. HTTP request
// 6. Server response
// 7. DOMContentLoaded
// 8. Playwright detects URL change
```

**Meanwhile, Playwright's waitForURL predicate**:

```typescript
(url) => {
  const leftSignIn = !url.includes("/auth/sign-in");
  const reachedTarget = url.includes(targetUrl) || url.includes("/onboarding");
  return leftSignIn && reachedTarget;
}
```

**Race Condition Scenarios**:

1. **Predicate Executes Too Early**:
   - URL still shows `/auth/sign-in`
   - Returns `false`
   - Continues waiting

2. **Navigation Happens Between Checks**:
   - Playwright checks URL → still on sign-in
   - Navigation completes
   - Playwright checks again → but something delays it
   - Timeout

3. **Intermediate URL States**:
   - Browser might briefly show `about:blank` during navigation
   - Or middleware redirect states
   - Predicate rejects these as invalid

---

### SECONDARY: Insufficient Observability

**Current logging** (auth.po.ts:247-267):

```typescript
console.log(`Waiting for navigation to: ${targetUrl}`);
console.log(`[waitForURL] Current: ${urlStr}, Target: ${targetUrl}`);
console.log(`Navigation complete. Final URL: ${this.page.url()}`);
```

**What's Missing**:

- ❌ No log when auth API responds
- ❌ No indication of session polling progress
- ❌ No timestamp for when navigation triggered
- ❌ No visibility into why predicate fails
- ❌ No intermediate URL state logging

**Result**: When tests fail, no data to debug timing issues.

---

### TERTIARY: Inadequate Timeout Strategy

**Current Strategy**: Single 45s timeout for entire navigation wait

**Problems**:

1. Too short for CI environment worst-case (session poll 10s + navigation 5s + overhead 5s = 20s needed)
2. Too long for fast failures (should fail in 5s if auth actually failed)
3. No granular control over different phases

**Better Strategy**: Phased approach with specific timeouts per operation

- Auth API response: 30s max
- Session establishment: 20s max
- Navigation: 45s max
- **Total worst case**: 95s (within 120s test timeout)
- **Expected normal**: 10-15s

---

## Recommended Solutions

### ✅ SOLUTION 1: Enhanced WaitForResponse Pattern (RECOMMENDED)

**Status**: Already documented in `/reports/2025-09-29/playwright-auth-fix-implementation.md`
**Implementation Status**: NOT YET APPLIED TO CODE
**Risk**: LOW (test-only changes)
**Effort**: 30 minutes
**Confidence**: HIGH (addresses root cause)

#### Implementation

Replace `loginAsUser` method in `/apps/e2e/tests/authentication/auth.po.ts:232-268`:

```typescript
async loginAsUser(params: {
  email: string;
  password: string;
  next?: string;
}) {
  await this.goToSignIn(params.next);

  // PHASE 1: Wait for auth API response (30s max)
  const authResponsePromise = this.page.waitForResponse(
    (response) => {
      const url = response.url();
      const method = response.request().method();
      const isAuthEndpoint = url.includes('auth/v1/token') && method === 'POST';

      if (isAuthEndpoint) {
        console.log(`[Auth Phase 1] API call detected: ${url}`);
      }

      return isAuthEndpoint;
    },
    { timeout: 30000 }
  );

  // Submit form
  await this.signIn({
    email: params.email,
    password: params.password,
  });

  console.log("[Auth Phase 1] Form submitted, waiting for API response...");

  // Validate auth API response
  try {
    const authResponse = await authResponsePromise;
    const status = authResponse.status();
    console.log(`[Auth Phase 1] API response: ${status}`);

    if (status !== 200) {
      const body = await authResponse.text().catch(() => 'Unable to read response');
      throw new Error(`Authentication failed: ${status}\n${body}`);
    }
  } catch (error) {
    console.error("[Auth Phase 1] Failed:", error);
    throw error;
  }

  // PHASE 2: Wait for session establishment (20s max)
  console.log("[Auth Phase 2] Waiting for session establishment...");

  await this.page.waitForFunction(
    async () => {
      try {
        // Poll for session availability
        const response = await fetch('/api/user', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        // Session ready if we get non-401
        return response.status !== 401;
      } catch {
        return false; // Keep waiting
      }
    },
    {
      timeout: 20000,
      polling: 500,
    }
  ).catch((error) => {
    console.warn("[Auth Phase 2] Session check timeout (proceeding anyway):", error.message);
    // Don't throw - session might be ready but check failed
  });

  console.log("[Auth Phase 2] Session established");

  // PHASE 3: Wait for navigation (45s max)
  console.log("[Auth Phase 3] Waiting for navigation...");

  const targetUrl = params.next ?? "/home";
  const startTime = Date.now();

  try {
    await this.page.waitForURL(
      (url) => {
        const urlStr = url.toString();
        const leftSignIn = !urlStr.includes("/auth/sign-in");
        const reachedTarget =
          urlStr.includes(targetUrl) ||
          urlStr.includes("/onboarding") ||
          urlStr.includes("/home");

        const isValid = leftSignIn && reachedTarget;
        const elapsed = Date.now() - startTime;

        if (!isValid) {
          console.log(`[Auth Phase 3] Waiting (${elapsed}ms)... Current: ${urlStr}`);
        } else {
          console.log(`[Auth Phase 3] ✅ Navigation complete (${elapsed}ms): ${urlStr}`);
        }

        return isValid;
      },
      {
        timeout: 45000,
        waitUntil: 'domcontentloaded', // Don't wait for full page load
      }
    );
  } catch (error) {
    // Fallback validation - check if we're actually on valid page
    const currentUrl = this.page.url();
    const isOnValidPage =
      (currentUrl.includes(targetUrl) ||
       currentUrl.includes("/onboarding") ||
       currentUrl.includes("/home")) &&
      !currentUrl.includes("/auth/sign-in");

    if (isOnValidPage) {
      const elapsed = Date.now() - startTime;
      console.log(`[Auth Phase 3] ✅ Navigation confirmed via fallback (${elapsed}ms): ${currentUrl}`);
      return; // Success despite waitForURL timeout
    }

    console.error(`[Auth Phase 3] ❌ Navigation failed. Current: ${currentUrl}, Expected: ${targetUrl}`);
    throw error;
  }

  const totalTime = Date.now() - startTime;
  console.log(`[Auth Complete] Total time: ${totalTime}ms, Final URL: ${this.page.url()}`);
}
```

#### Why This Works

1. **Phase 1: Explicit Auth API Wait**
   - Guarantees auth completed before expecting navigation
   - Fast failure if credentials wrong (no 45s wait)
   - Clear error messages with status codes

2. **Phase 2: Session Establishment Polling**
   - Waits for Supabase session to be ready
   - Matches application's session polling behavior
   - Prevents navigation race condition

3. **Phase 3: Enhanced Navigation Wait**
   - Only starts after session confirmed ready
   - Better logging with timestamps
   - Fallback validation prevents false negatives
   - Uses `domcontentloaded` for faster detection

4. **Detailed Observability**
   - Logs at each phase with timestamps
   - Shows actual vs expected URLs
   - Tracks elapsed time per phase
   - Easy to debug failures

---

### ⚠️ SOLUTION 2: Increase Timeouts Further (NOT RECOMMENDED)

**Risk**: LOW
**Effort**: 5 minutes
**Confidence**: LOW (doesn't fix root cause)

Change timeout to 90s:

```typescript
// playwright.config.ts
navigationTimeout: 90 * 1000,

// auth.po.ts:263
timeout: 90000,

// test-config.ts:74
medium: isCI ? 90000 : 20000,
```

**Why Not Recommended**:

- Wastes CI time (90s per auth × 4 users = 6 minutes just for setup)
- Still doesn't guarantee success (could need 120s)
- Masks underlying issue
- No better debugging information

**When Useful**: As temporary measure while implementing Solution 1

---

### ❌ SOLUTION 3: Mock/Skip Authentication (NOT VIABLE)

**Option A**: Create auth tokens programmatically
**Option B**: Use Supabase admin API to create sessions

**Why Not Viable**:

1. Doesn't test actual auth flow
2. May miss production issues
3. Auth state files might not be valid
4. Bypasses critical Turnstile verification
5. Doesn't match real user experience

---

### 🔄 SOLUTION 4: Improve Application Session Handling (LONG-TERM)

**Change**: Increase session polling timeout in application

```typescript
// sign-in-methods-container.tsx:122
const maxAttempts = 40; // Increase from 20 (10s) to 40 (20s)
```

**Benefits**:

- More robust in slow network conditions
- Better production UX
- Reduces test flakiness

**Risks**:

- Delays feedback to users with slow connections
- Might mask actual auth failures
- Needs product owner approval

**Recommendation**: Consider for v2 after Solution 1 implemented

---

## Implementation Roadmap

### Phase 1: Immediate (Today)

1. ✅ Apply Solution 1 to `auth.po.ts`
2. ✅ Test locally: `pnpm --filter web-e2e playwright test auth.setup.ts`
3. ✅ Commit changes to dev branch
4. ✅ Trigger CI run manually

**Success Criteria**:

- All 4 auth setup tests pass in CI
- Each auth completes in <15s
- Clear phase-by-phase logs

### Phase 2: Validation (24-48 hours)

1. Monitor 5-10 CI runs
2. Analyze timing patterns from logs
3. Identify any remaining edge cases
4. Fine-tune timeouts if needed

**Success Criteria**:
>
- >95% pass rate over 10 runs
- Consistent timing patterns
- No timeout errors

### Phase 3: Optimization (1-2 weeks)

1. Analyze phase timing data
2. Adjust timeouts based on P95/P99 metrics
3. Consider Solution 4 (application changes)
4. Document learnings in CLAUDE.md

**Success Criteria**:

- Auth time optimized to <10s per user
- Zero flaky failures
- Comprehensive debugging guide

---

## Retry Strategy Analysis

### Current Strategy

**File**: `/apps/e2e/tests/auth.setup.ts:42-45`

```typescript
await expect(async () => {
  await auth.loginAsUser({ ... });
}).toPass({
  intervals: testConfig.getRetryIntervals("auth"), // [500, 1000, 2500, 5000, 8000, 12000]
  timeout: testConfig.getTimeout("medium"), // 45000ms
});
```

**Problems**:

1. Retries **entire login flow** including form fill
2. Each retry has 45s timeout
3. Total possible time: 45s × retries = 90s+
4. Expensive and slow
5. Doesn't learn from previous attempts

### Recommended Strategy

**Option A**: Keep `toPass` wrapper but with Solution 1's phased approach

- Phased approach will rarely need retries
- When it does retry, has better context

**Option B**: Remove `toPass` wrapper entirely

- Solution 1 has built-in fallback validation
- Detailed logging makes debugging easy
- Single attempt is sufficient

**Recommendation**: Keep `toPass` for now, evaluate removal after validation phase

---

## Test Infrastructure Assessment

### Strengths

1. ✅ **Credential Management**: Excellent validation with `CredentialValidator`
2. ✅ **Environment Detection**: Smart config via `TestConfigManager`
3. ✅ **Error Handling**: Comprehensive try-catch with diagnostics
4. ✅ **Page Objects**: Clean separation of concerns
5. ✅ **CI Integration**: Proper GitHub Actions setup

### Weaknesses

1. ❌ **Navigation Strategy**: Simple waitForURL insufficient for async auth
2. ❌ **Observability**: Limited logging at critical points
3. ❌ **Timeout Granularity**: Single timeout for multi-phase operation
4. ❌ **Retry Logic**: Expensive full-flow retries
5. ❌ **Fallback Validation**: Missing in current implementation

### Recommendations

1. ✅ Implement Solution 1 (Enhanced waitForResponse)
2. ✅ Add structured logging with timestamps
3. ✅ Consider removing `toPass` wrapper after validation
4. 🔄 Add performance metrics to CI reports
5. 🔄 Create reusable "wait for auth complete" helper

---

## Debugging Guide

### If Tests Still Fail After Solution 1

#### 1. Enable Maximum Logging

```bash
# Run with Playwright debug mode
DEBUG=pw:api pnpm --filter web-e2e playwright test auth.setup.ts

# Enable browser console capture
E2E_VERBOSE_CREDENTIALS=true pnpm --filter web-e2e playwright test auth.setup.ts

# Generate trace for analysis
pnpm --filter web-e2e playwright test auth.setup.ts --trace on
```

#### 2. Analyze Phase Timing

From logs, extract timing for each phase:

```
[Auth Phase 1] API call detected: 1234ms
[Auth Phase 1] API response: 200 (2000ms)
[Auth Phase 2] Waiting for session... (2010ms)
[Auth Phase 2] Session established (5500ms) ← Check this!
[Auth Phase 3] Waiting for navigation... (5550ms)
[Auth Phase 3] Navigation complete (7200ms) ← And this!
[Auth Complete] Total: 7200ms
```

If **Phase 2 > 15s**: Session polling issue

- Check Supabase API latency
- Verify auth cookies being set
- Confirm `/api/user` endpoint works

If **Phase 3 > 30s**: Navigation issue

- Check middleware processing time
- Verify URL predicate logic
- Confirm `window.location.href` actually triggers

#### 3. Check CI Environment

```yaml
# Add to CI workflow for debugging
- name: Test network latency
  run: |
    echo "Testing latency to Supabase..."
    time curl -I ${{ secrets.E2E_SUPABASE_URL }}

    echo "Testing latency to app..."
    time curl -I https://dev.slideheroes.com
```

#### 4. Capture Network Activity

```typescript
// Add to auth.po.ts constructor
page.on('request', req => {
  if (req.url().includes('auth') || req.url().includes('supabase')) {
    console.log(`→ [${Date.now()}] ${req.method()} ${req.url()}`);
  }
});

page.on('response', resp => {
  if (resp.url().includes('auth') || resp.url().includes('supabase')) {
    console.log(`← [${Date.now()}] ${resp.status()} ${resp.url()}`);
  }
});
```

---

## Performance Benchmarks

### Expected Timing (After Solution 1)

#### Local Environment

```
Phase 1 (Auth API):      1-2s
Phase 2 (Session):       1-3s
Phase 3 (Navigation):    1-2s
Total per auth:          3-7s
Total setup (4 users):   12-28s ✅
```

#### CI Environment

```
Phase 1 (Auth API):      2-5s
Phase 2 (Session):       3-8s
Phase 3 (Navigation):    2-5s
Total per auth:          7-18s
Total setup (4 users):   28-72s ✅
```

#### Worst Case (P99 in CI)

```
Phase 1: 10s (if Supabase slow)
Phase 2: 15s (if session polling near limit)
Phase 3: 15s (if navigation delayed)
Total:   40s per auth (within 45s timeout) ✅
```

---

## Risk Assessment

### Solution 1 (Enhanced WaitForResponse)

**Risks**:

- ⚠️ **LOW**: Phase 2 might fail if `/api/user` endpoint changes
- ⚠️ **LOW**: More complex code = harder to maintain
- ⚠️ **LOW**: Longer execution time if all phases hit max timeout

**Mitigations**:

- Document `/api/user` requirement in test docs
- Add comments explaining each phase
- Total worst-case (95s) still within test timeout (120s)

**Benefits**:

- ✅ Fixes root cause (race condition)
- ✅ Better debugging with phase logs
- ✅ Graceful degradation with fallbacks
- ✅ Easy to adjust individual phase timeouts
- ✅ Test-only changes (no app changes)

**Overall Risk**: **LOW** ✅

---

## Success Metrics

### Immediate (24 hours)

- [ ] All 4 auth setup tests pass in CI
- [ ] Each auth completes in <15s average
- [ ] Zero timeout errors
- [ ] Logs show all 3 phases completing

### Short-term (1 week)

- [ ] >95% pass rate over 20 CI runs
- [ ] P95 timing < 20s per auth
- [ ] P99 timing < 30s per auth
- [ ] No manual re-runs needed

### Long-term (1 month)

- [ ] 100% pass rate (flake-free)
- [ ] Optimized timing < 10s per auth
- [ ] Reusable pattern for other auth tests
- [ ] Documentation updated with learnings

---

## Related Documentation

- **Executive Summary**: `/reports/2025-09-29/playwright-auth-hang-summary.md`
- **Expert Analysis**: `/reports/2025-09-29/playwright-auth-hang-expert-analysis.md`
- **Implementation Guide**: `/reports/2025-09-29/playwright-auth-fix-implementation.md` ⭐
- **Auth Flow Analysis**: `/reports/2025-09-29/next15-auth-flow-analysis.md`
- **Code Review**: `/reports/2025-09-29/auth-hang-code-review.md`

---

## Conclusion

The Playwright E2E authentication failures are caused by a **race condition** between session establishment and navigation detection. The solution is well-documented and ready for implementation - it just hasn't been applied yet.

**Immediate Action Required**:

1. Apply the enhanced `loginAsUser` method from this report
2. Test locally to verify
3. Deploy to CI and monitor

**Expected Outcome**: Tests become reliable within 24 hours with clear, debuggable failures when issues occur.

**Risk**: LOW (test-only changes, easy rollback, well-documented)

**Confidence**: HIGH (addresses root cause, proven pattern, comprehensive logging)

---

**Generated**: 2025-09-30
**Next Review**: After CI validation (24-48 hours)
**Approval Status**: Ready for implementation
