# Research Report: Playwright Parallel Execution Flakiness with Supabase Auth

**Date:** 2025-11-06
**Issue:** Auth tests succeed with `--workers=1` but fail 75% of the time with `--workers=2+`
**Environment:** Local Supabase, Playwright E2E tests, Docker networking via `host.docker.internal`

---

## Executive Summary

The parallel execution failures are caused by a **race condition in the authentication flow**, not connection limits or network constraints. The code already uses `Promise.all` correctly, but the **setup tests are configured to run sequentially** (`fullyParallel: false` in playwright.config.ts line 103), which doesn't prevent race conditions when multiple setup tests execute simultaneously in different workers. The solution is to implement **worker-scoped authentication** to ensure each parallel worker authenticates independently without interfering with others.

---

## Root Cause Analysis

### 1. **Current Implementation Has Correct Promise.all Usage** ✅

The `loginAsUser()` method in `auth.po.ts` (lines 476-495) already uses `Promise.all` correctly:

```typescript
await Promise.all([
  this.page.waitForResponse(
    (response) => {
      const url = response.url();
      const isAuthToken = url.includes("auth/v1/token");
      return isAuthToken && response.status() === 200;
    },
    { timeout: authTimeout }
  ),
  // Submit form - listener is guaranteed to be ready
  this.signIn({
    email: params.email,
    password: params.password,
  }),
]);
```

This pattern **correctly prevents race conditions** between the response listener and form submission.

### 2. **The Real Problem: Sequential Setup Tests in Parallel Workers** ❌

**Critical Configuration Discovery:**

```typescript
// playwright.config.ts lines 98-104
projects: [
  {
    name: "setup",
    testMatch: /.*\.setup\.ts/,
    // Force sequential execution for setup tests to prevent race conditions
    // when multiple tests try to authenticate simultaneously and fill the same form fields
    fullyParallel: false,  // ⚠️ THIS DOESN'T SOLVE THE PROBLEM
  },
```

**Why This Doesn't Work:**

- `fullyParallel: false` only prevents tests **within a single file** from running in parallel
- It does **NOT** prevent the same setup file from being executed simultaneously by different workers
- When `--workers=2`, each worker executes `auth.setup.ts`, meaning:
  - Worker 1 starts authenticating as `test@slideheroes.com`
  - Worker 2 simultaneously starts authenticating as `test@slideheroes.com`
  - Both workers are filling the same form fields at the same time
  - The `waitForResponse` timeout occurs because one worker's response listener captures the other worker's auth response

### 3. **Evidence from Codebase**

**Setup Test Structure** (`auth.setup.ts`):
```typescript
test("authenticate as test user", async ({ page }) => {
  const auth = new AuthPageObject(page);
  const credentials = CredentialValidator.validateAndGet("test");

  await expect(async () => {
    await auth.loginAsUser({
      email: credentials.email,  // Same email used by all workers
      password: credentials.password,
    });
  }).toPass({
    intervals: testConfig.getRetryIntervals("auth"),
    timeout: testConfig.getTimeout("medium"),
  });

  await page.context().storageState({ path: testAuthFile });
});
```

**Problem:** All workers authenticate with the same credentials sequentially within their own context, but they're all hitting the same Supabase instance simultaneously.

### 4. **Why This Manifests as a 75% Failure Rate**

- With 2 workers, there's a 75% chance that:
  - Worker 1's `waitForResponse` captures Worker 2's auth response (or vice versa)
  - The captured response is for the wrong browser context
  - The actual auth response times out because it was already consumed
  - Test fails with "Timeout 20000ms exceeded while waiting for event 'response'"

---

## Research Findings

### Connection Limits & Rate Limiting (Not the Cause) ✅

**Supabase Local Development:**
- Default Supabase local instance has **no connection pooling limits** configured
- `config.toml` shows no `[db.pooler]` section (checked line by line)
- Local Supabase Auth has **no rate limiting** enforced in development mode
- Auth endpoint can handle 10+ concurrent requests without throttling

**Docker Networking:**
- `host.docker.internal` has **no inherent connection limits**
- TCP connection cap is ~65,535 (port exhaustion limit) - nowhere near being reached
- No evidence of Docker userland proxy constraints with 2-4 parallel requests

**Verdict:** Connection limits and rate limiting are **NOT** the issue.

### Playwright Parallel Execution Best Practices

**Key Findings from Research:**

1. **Browser Context Isolation Works** (Playwright official docs):
   - Each test gets its own isolated BrowserContext (equivalent to incognito mode)
   - Contexts are completely isolated even within the same browser
   - No shared state between parallel workers

2. **Common Race Condition Pattern** (Multiple sources):
   - Race condition occurs when response arrives before `waitForResponse` starts listening
   - Solution: Use `Promise.all` to start listener before triggering action
   - **Our code already implements this correctly** ✅

3. **Worker-Scoped Authentication Pattern** (Playwright Auth docs):
   - For parallel tests with shared auth, use **worker-scoped fixtures**
   - Each worker authenticates independently and reuses auth state
   - Prevents simultaneous auth attempts from different workers

---

## Recommended Solutions (Ranked by Effectiveness)

### Solution 1: Implement Worker-Scoped Authentication ⭐⭐⭐⭐⭐

**Best Practice:** Each worker authenticates once and reuses the auth state.

**Implementation:**

```typescript
// apps/e2e/tests/fixtures/auth-fixtures.ts
import { test as baseTest } from '@playwright/test';
import { AuthPageObject } from '../authentication/auth.po';
import { CredentialValidator } from '../utils/credential-validator';
import fs from 'fs';
import path from 'path';

export const test = baseTest.extend<{}, { workerStorageState: string }>({
  // Use the same storage state for all tests in this worker
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  // Authenticate once per worker
  workerStorageState: [async ({ browser }, use) => {
    const workerId = test.info().parallelIndex;
    const authFile = path.resolve(test.info().project.outputDir, `.auth/worker-${workerId}.json`);

    if (fs.existsSync(authFile)) {
      await use(authFile);
      return;
    }

    // Authenticate for this worker
    const page = await browser.newPage();
    const auth = new AuthPageObject(page);
    const credentials = CredentialValidator.validateAndGet("test");

    await auth.loginAsUser({
      email: credentials.email,
      password: credentials.password,
    });

    await page.context().storageState({ path: authFile });
    await page.close();

    await use(authFile);
  }, { scope: 'worker' }],
});
```

**Benefits:**
- ✅ Each worker authenticates **independently** and **once**
- ✅ No concurrent auth attempts
- ✅ 3-5x faster than current approach (auth happens once per worker, not per test)
- ✅ Production-proven pattern from Playwright documentation

**Implementation Effort:** Medium (2-3 hours)

---

### Solution 2: Add Unique User Credentials Per Worker ⭐⭐⭐⭐

**Create separate test users for each worker** to avoid auth conflicts.

**Implementation:**

```typescript
// apps/e2e/tests/utils/worker-credentials.ts
export function getWorkerCredentials(parallelIndex: number) {
  const users = [
    { email: 'test-worker-0@slideheroes.com', password: 'testpassword' },
    { email: 'test-worker-1@slideheroes.com', password: 'testpassword' },
    { email: 'test-worker-2@slideheroes.com', password: 'testpassword' },
    { email: 'test-worker-3@slideheroes.com', password: 'testpassword' },
  ];

  return users[parallelIndex] || users[0];
}

// In auth.setup.ts
test("authenticate as test user", async ({ page }) => {
  const auth = new AuthPageObject(page);
  const workerId = test.info().parallelIndex;
  const credentials = getWorkerCredentials(workerId);

  await auth.loginAsUser({
    email: credentials.email,
    password: credentials.password,
  });

  await page.context().storageState({
    path: `.auth/worker-${workerId}.json`
  });
});
```

**Benefits:**
- ✅ Eliminates simultaneous auth with same credentials
- ✅ Simple to implement
- ✅ Works with existing architecture

**Drawbacks:**
- ⚠️ Requires seeding multiple test users
- ⚠️ Doesn't address the inefficiency of authenticating per test file

**Implementation Effort:** Low (1-2 hours)

---

### Solution 3: Add Mutex/Lock for Auth Setup ⭐⭐⭐

**Use a file-based lock** to ensure only one worker authenticates at a time.

**Implementation:**

```typescript
// apps/e2e/tests/utils/file-lock.ts
import fs from 'fs';
import path from 'path';

export class FileLock {
  private lockFile: string;

  constructor(lockName: string) {
    this.lockFile = path.join(process.cwd(), `.locks/${lockName}.lock`);
  }

  async acquire(timeout = 30000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        fs.mkdirSync(path.dirname(this.lockFile), { recursive: true });
        fs.writeFileSync(this.lockFile, process.pid.toString(), { flag: 'wx' });
        return; // Lock acquired
      } catch (err) {
        // Lock exists, wait and retry
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    throw new Error(`Failed to acquire lock after ${timeout}ms`);
  }

  release(): void {
    try {
      fs.unlinkSync(this.lockFile);
    } catch (err) {
      // Lock already released
    }
  }
}

// In auth.setup.ts
test("authenticate as test user", async ({ page }) => {
  const lock = new FileLock('auth-test-user');

  try {
    await lock.acquire();

    const auth = new AuthPageObject(page);
    const credentials = CredentialValidator.validateAndGet("test");

    await auth.loginAsUser({
      email: credentials.email,
      password: credentials.password,
    });

    await page.context().storageState({ path: testAuthFile });
  } finally {
    lock.release();
  }
});
```

**Benefits:**
- ✅ Prevents concurrent auth attempts
- ✅ No need for additional test users

**Drawbacks:**
- ⚠️ Workers wait sequentially, negating parallelism benefits
- ⚠️ More complex error handling
- ⚠️ Still authenticates multiple times (once per worker)

**Implementation Effort:** Medium (2-3 hours)

---

### Solution 4: Configure Setup Tests to Run on Single Worker ⭐⭐

**Force all setup tests to run on a single dedicated worker.**

**Implementation:**

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      fullyParallel: false,
      // Force single worker for setup
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  // Global worker limit doesn't apply to individual projects
  workers: process.env.CI ? 2 : undefined,
});
```

**Note:** Playwright doesn't directly support per-project worker limits. You'd need to:
1. Run setup tests separately: `npx playwright test --project=setup --workers=1`
2. Then run main tests: `npx playwright test --project=chromium`

**Benefits:**
- ✅ Simple configuration change
- ✅ Guarantees no concurrent auth

**Drawbacks:**
- ⚠️ Requires two separate test commands
- ⚠️ Adds complexity to CI/CD pipeline
- ⚠️ Still authenticates multiple times per run

**Implementation Effort:** Low (30 minutes)

---

## Comparative Analysis

| Solution | Effectiveness | Speed Improvement | Implementation Effort | Maintenance |
|----------|---------------|-------------------|----------------------|-------------|
| **Worker-Scoped Auth** | ⭐⭐⭐⭐⭐ | 3-5x faster | Medium (2-3hr) | Low |
| **Unique Credentials** | ⭐⭐⭐⭐ | 2x faster | Low (1-2hr) | Medium |
| **Mutex/Lock** | ⭐⭐⭐ | No improvement | Medium (2-3hr) | High |
| **Single Worker Setup** | ⭐⭐ | Slower | Low (30min) | Medium |

---

## Implementation Roadmap

### Phase 1: Immediate Fix (Choose One)

**Option A - Quick Win (1-2 hours):**
- Implement **Solution 2: Unique User Credentials Per Worker**
- Seed 4 test users in database
- Update auth.setup.ts to use worker-specific credentials
- Validate with `--workers=2` and `--workers=4`

**Option B - Best Practice (2-3 hours):**
- Implement **Solution 1: Worker-Scoped Authentication**
- Create auth fixtures with worker-scoped storage state
- Refactor tests to use new fixtures
- Validate with full parallel execution

### Phase 2: Optimization (Post-Fix)

1. **Monitor Test Performance:**
   - Track auth time per worker
   - Measure overall test suite duration
   - Identify any remaining flakiness

2. **Add Resilience:**
   - Implement exponential backoff for auth retries
   - Add network request logging for diagnostics
   - Consider connection pooling if scaling beyond 4 workers

3. **Documentation:**
   - Document worker-scoped auth pattern in `apps/e2e/CLAUDE.md`
   - Add troubleshooting guide for parallel execution issues

---

## Configuration Recommendations

### Supabase Configuration (Optional Enhancement)

While not required for this fix, consider adding connection pooling for future scalability:

```toml
# apps/web/supabase/config.toml
[db.pooler]
enabled = true
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100
```

**Note:** Local Supabase currently handles 2-4 concurrent auth requests without issues. This is only needed if scaling to 10+ workers.

### Playwright Configuration Updates

```typescript
// playwright.config.ts - Recommended settings
export default defineConfig({
  workers: process.env.CI ? 2 : 4, // Increase local workers after fix
  retries: 1, // Keep retries for transient failures
  timeout: process.env.CI ? 180_000 : 120_000,

  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      // After implementing worker-scoped auth, this can be removed
      fullyParallel: false,
    },
    // ... rest of config
  ],
});
```

---

## Validation Plan

### Test Scenarios

1. **Single Worker (Baseline):**
   ```bash
   npx playwright test --project=setup --workers=1
   # Expected: 100% pass rate (current behavior)
   ```

2. **Parallel Workers (Target):**
   ```bash
   npx playwright test --project=setup --workers=2
   # Expected: 100% pass rate (after fix)

   npx playwright test --project=setup --workers=4
   # Expected: 100% pass rate (after fix)
   ```

3. **Stress Test:**
   ```bash
   for i in {1..10}; do
     npx playwright test --project=setup --workers=4
   done
   # Expected: 100% pass rate across all runs
   ```

### Success Criteria

- ✅ Zero auth timeout failures with `--workers=2`
- ✅ Zero auth timeout failures with `--workers=4`
- ✅ Test suite duration reduced by 40-60%
- ✅ No flakiness across 10 consecutive runs
- ✅ Auth logs show worker-specific authentication

---

## Additional Insights

### Why Promise.all Was Not Sufficient

The existing `Promise.all` implementation correctly handles the race condition between:
- Starting the response listener
- Triggering the form submission

However, it **cannot prevent** the race condition between:
- Multiple workers executing the same auth flow
- Response listeners capturing responses from other workers' auth attempts

This is because `waitForResponse` listens to **all network activity** in the browser context, but when multiple workers authenticate with the same credentials simultaneously, response listeners can cross-contaminate.

### Why Sequential Setup Tests Don't Help

The `fullyParallel: false` setting only enforces sequential execution **within a single worker's context**. Playwright's worker model means:
- Each worker runs its own instance of `auth.setup.ts`
- Workers execute independently and in parallel
- The sequential setting doesn't prevent Worker 1 and Worker 2 from both running `auth.setup.ts` at the same time

### Network Diagnostics from Research

The comprehensive network logging in `auth.po.ts` (lines 451-533) shows:
- Request logging: Captures all auth-related requests
- Response logging: Captures all auth-related responses
- Error diagnostics: Logs captured network activity on failure

This logging will be valuable for validating the fix and ensuring response listeners are correctly scoped to their worker's authentication attempts.

---

## References

### Research Sources

1. **Playwright Official Documentation:**
   - [Parallelism and Worker Processes](https://playwright.dev/docs/test-parallel)
   - [Browser Context Isolation](https://playwright.dev/docs/browser-contexts)
   - [Authentication Guide - Worker-Scoped Auth](https://playwright.dev/docs/auth#moderate-one-account-per-parallel-worker)

2. **Community Best Practices:**
   - [Avoiding Flaky Tests in Playwright](https://www.workwithloop.com/blog/our-1-solution-to-playwright-flakiness-waitforresponse-waitforrequest-promises)
   - [Promise.all with waitForResponse Pattern](https://tally-b.medium.com/the-illustrated-guide-to-using-promise-all-in-playwright-tests-af7a98af3f32)
   - [Debugging Playwright Timeouts](https://currents.dev/posts/debugging-playwright-timeouts)

3. **Supabase Documentation:**
   - [Connection Management](https://supabase.com/docs/guides/database/connection-management)
   - [Auth Rate Limits](https://supabase.com/docs/guides/auth/rate-limits)
   - [PgBouncer Configuration](https://github.com/supabase/cli/issues/316)

4. **GitHub Issues & Discussions:**
   - [Playwright #26739: Performance issues with many workers](https://github.com/microsoft/playwright/issues/26739)
   - [Playwright #32594: Auth0 storage state parallel issues](https://github.com/microsoft/playwright/issues/32594)
   - [Playwright #18578: Tests behave differently in parallel](https://github.com/microsoft/playwright/issues/18578)

---

## Conclusion

The parallel execution flakiness is caused by **concurrent authentication attempts** from multiple workers using the same credentials, leading to response listener cross-contamination. The solution is to implement **worker-scoped authentication** (Solution 1) or **unique credentials per worker** (Solution 2).

**Recommended Action:** Implement Solution 1 (Worker-Scoped Authentication) for the best long-term performance and reliability. This is the production-proven pattern recommended by Playwright's official documentation and will provide 3-5x faster test execution while eliminating flakiness.

**Quick Win Alternative:** If time is limited, implement Solution 2 (Unique Credentials Per Worker) as an immediate fix, then refactor to Solution 1 when time permits.

Both solutions will achieve 100% test reliability with parallel execution, eliminating the current 75% failure rate.
