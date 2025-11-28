# Cloudflare Turnstile CI/CD Test Automation Bypass - Comprehensive Guide

**Research Date**: 2025-11-11
**Project**: SlideHeroes Integration Tests
**Current Issue**: Tests blocked by Cloudflare Turnstile challenges during GitHub Actions execution

---

## Executive Summary

Your integration tests are failing because Cloudflare Turnstile is correctly identifying automated Playwright tests as bot traffic and serving CAPTCHA challenges. Cloudflare provides **official test credentials** specifically designed for CI/CD automation. The recommended solution is to use environment detection to serve test keys in non-production environments while maintaining production security.

**Key Finding**: Cloudflare explicitly supports test automation through dummy keys - bypassing or third-party CAPTCHA solving is unnecessary and violates terms of service.

---

## Table of Contents

1. [Cloudflare Dashboard Navigation](#1-cloudflare-dashboard-navigation-2025)
2. [Test Keys vs Production Keys](#2-test-keys-vs-production-keys)
3. [Implementation Solutions (Ranked)](#3-implementation-solutions-ranked)
4. [Code Examples](#4-code-examples)
5. [Domain Configuration](#5-domain-configuration)
6. [Playwright/E2E Integration](#6-playwrighte2e-integration)
7. [Gotchas and Limitations](#7-gotchas-and-limitations)

---

## 1. Cloudflare Dashboard Navigation (2025)

### Accessing Turnstile Settings

**Direct Link (Fastest)**:
```
https://dash.cloudflare.com/?to=/:account/turnstile
```

**Manual Navigation**:
1. Log in to your Cloudflare account
2. Look for **Turnstile** in the left sidebar navigation (global settings page)
3. Note: Turnstile menu is NOT available on site-specific settings pages

### Managing Your Widget

**Current Widget**: `2025slideheroes-web.vercel.app`

**To Update Configuration**:
1. Navigate to Turnstile page
2. Select your existing widget (`2025slideheroes-web.vercel.app`)
3. Click **Settings** tab
4. Modify configuration as needed
5. Click **Save**

**To View Analytics**:
1. Select widget from list
2. View dashboard with analytics, performance metrics, and challenge statistics

### Creating New Widgets

If you need separate widgets for different environments:

1. Click **Add widget** button
2. Complete required fields:
   - Widget name (descriptive identifier like "SlideHeroes Dev")
   - Hostname management (specify domains)
   - Widget mode (Managed/Non-Interactive/Invisible)
3. Optional: Enable pre-clearance for SPAs
4. Click **Create**
5. **Important**: Save sitekey and secret key securely - secret key shown only once

---

## 2. Test Keys vs Production Keys

### Official Cloudflare Test Keys

Cloudflare provides **dummy keys** that work on ANY domain (including localhost) specifically for testing:

#### Dummy Sitekeys

| Sitekey | Behavior | Widget Type |
|---------|----------|-------------|
| `1x00000000000000000000AA` | Always passes | Visible |
| `2x00000000000000000000AB` | Always blocks | Visible |
| `1x00000000000000000000BB` | Always passes | Invisible |
| `2x00000000000000000000BB` | Always blocks | Invisible |
| `3x00000000000000000000FF` | Forces interactive challenge | Visible |

**All dummy sitekeys generate**: `XXXX.DUMMY.TOKEN.XXXX`

#### Dummy Secret Keys

| Secret Key | Behavior |
|------------|----------|
| `1x0000000000000000000000000000000AA` | Accepts dummy token |
| `2x0000000000000000000000000000000AA` | Rejects dummy token |
| `3x0000000000000000000000000000000AA` | Returns "token already spent" error |

### Critical Security Rules

**Production Keys**:
- Will REJECT dummy tokens (prevents misconfigurations)
- Should NOT include localhost/127.0.0.1 in allowed domains

**Dummy Keys**:
- Only accept `XXXX.DUMMY.TOKEN.XXXX` token format
- Will REJECT real tokens from production
- Work on any domain without restrictions

**Verification**:
- Both client (sitekey) and server (secret key) must use matching key types
- Never mix dummy and production keys

---

## 3. Implementation Solutions (Ranked)

### Solution 1: Environment Detection with Test Keys (RECOMMENDED) ⭐⭐⭐⭐⭐

**Why This is Best**:
- Official Cloudflare-supported approach
- No terms of service violations
- Fast and reliable test execution
- No rate limiting concerns
- Maintains production security

**Approach**: Detect test environments server-side and serve appropriate keys.

**Pros**:
- ✅ 100% reliable
- ✅ Zero maintenance overhead
- ✅ Fast test execution
- ✅ Official support from Cloudflare
- ✅ Works across all CI/CD platforms

**Cons**:
- ⚠️ Requires code changes to support environment detection
- ⚠️ Must ensure test keys never reach production

**Implementation Complexity**: Low (2-3 hours)

---

### Solution 2: Separate Test Widget with Hostname Allowlist ⭐⭐⭐⭐

**Approach**: Create dedicated test widget configured for test domains only.

**Configuration**:
1. Create new widget: "SlideHeroes Tests"
2. Add test hostnames:
   - `localhost`
   - `127.0.0.1`
   - `localhost:3001` (your test port)
   - Any GitHub Actions domains if applicable

**Pros**:
- ✅ Real Turnstile validation in tests
- ✅ Separate analytics for test traffic
- ✅ Can test actual challenge behavior

**Cons**:
- ⚠️ Tests may still trigger challenges if behavior too bot-like
- ⚠️ Rate limiting possible during heavy test runs
- ⚠️ Slower test execution (real challenge solving)
- ⚠️ More complex CI configuration

**Implementation Complexity**: Medium (4-6 hours)

---

### Solution 3: Conditional Turnstile Rendering ⭐⭐⭐

**Approach**: Completely disable Turnstile in test environments.

**Implementation**: Check environment variable before rendering widget.

**Pros**:
- ✅ Simplest implementation
- ✅ Fastest test execution
- ✅ Zero Turnstile overhead

**Cons**:
- ⚠️ Tests don't validate Turnstile integration
- ⚠️ Risk of bugs in production Turnstile code
- ⚠️ Missing coverage of CAPTCHA flows

**Implementation Complexity**: Low (1-2 hours)

**When to Use**: Early development or if Turnstile is non-critical to core flows

---

### Solution 4: Third-Party CAPTCHA Solvers ❌ NOT RECOMMENDED

**Services**: 2captcha, CapSolver, Anti-Captcha

**Why Avoid**:
- ❌ Violates Cloudflare terms of service
- ❌ Expensive ($1-3 per 1000 solves)
- ❌ Slow (5-20 seconds per solve)
- ❌ Unreliable (60-80% success rate)
- ❌ Requires API keys and payment
- ❌ Ethical concerns (uses real humans or farms)

**Only Consider If**: You're scraping/testing third-party sites where you can't control Turnstile configuration.

---

## 4. Code Examples

### Solution 1 Implementation (Recommended)

#### Step 1: Environment Detection Utility

Create: `packages/features/auth/src/captcha/server/captcha-env.ts`

```typescript
import 'server-only';

interface CaptchaCredentials {
  sitekey: string;
  secretKey: string;
}

/**
 * Detect if request is from test environment
 * Uses multiple signals for reliability
 */
export function isTestEnvironment(request?: Request): boolean {
  // Check for test environment variables
  const isTestEnv =
    process.env.NODE_ENV === 'test' ||
    process.env.E2E_TESTING === 'true' ||
    process.env.PLAYWRIGHT_TEST === 'true';

  if (isTestEnv) return true;

  // Check IP address (if request provided)
  if (request) {
    const testIPs = ['127.0.0.1', '::1'];
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                request.headers.get('x-real-ip');

    if (ip && testIPs.includes(ip)) return true;

    // Check for custom test header
    const testHeader = request.headers.get('x-test-environment');
    if (testHeader === process.env.TEST_ENVIRONMENT_SECRET) return true;
  }

  return false;
}

/**
 * Get appropriate Turnstile credentials based on environment
 */
export function getTurnstileCredentials(request?: Request): CaptchaCredentials {
  if (isTestEnvironment(request)) {
    return {
      sitekey: '1x00000000000000000000AA', // Dummy key - always passes
      secretKey: '1x0000000000000000000000000000000AA', // Dummy secret
    };
  }

  // Production credentials
  const sitekey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;
  const secretKey = process.env.CAPTCHA_SECRET_TOKEN;

  if (!sitekey || !secretKey) {
    throw new Error('Production Turnstile credentials not configured');
  }

  return { sitekey, secretKey };
}
```

#### Step 2: Update Server-Side Verification

Update: `packages/features/auth/src/captcha/server/verify-captcha.tsx`

```typescript
import 'server-only';
import { getTurnstileCredentials } from './captcha-env';

const VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify CAPTCHA token with environment-aware credentials
 */
export async function verifyCaptchaToken(token: string, request?: Request) {
  const { secretKey } = getTurnstileCredentials(request);

  const formData = new FormData();
  formData.append('secret', secretKey);
  formData.append('response', token);

  const res = await fetch(VERIFY_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Failed to verify CAPTCHA token');
  }

  const data = await res.json();

  if (!data.success) {
    throw new Error('Invalid CAPTCHA token');
  }

  return data;
}
```

#### Step 3: Update Client-Side Hook

Update: `packages/features/auth/src/captcha/client/use-captcha.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getTurnstileSiteKey } from '../shared/captcha-config';

/**
 * Hook to get environment-appropriate sitekey
 */
export function useCaptcha() {
  const [siteKey, setSiteKey] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch sitekey from server to ensure environment detection runs server-side
    fetch('/api/captcha/config')
      .then(res => res.json())
      .then(data => {
        setSiteKey(data.siteKey);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load captcha config:', error);
        setLoading(false);
      });
  }, []);

  return { siteKey, loading };
}
```

#### Step 4: Create Config API Route

Create: `apps/web/app/api/captcha/config/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getTurnstileCredentials } from '@kit/auth/captcha/server/captcha-env';

export async function GET(request: Request) {
  const { sitekey } = getTurnstileCredentials(request);

  return NextResponse.json({
    siteKey: sitekey,
  });
}
```

#### Step 5: Environment Variables

**Development/Test** - `.env.test`:
```bash
# Test environment detection
E2E_TESTING=true
PLAYWRIGHT_TEST=true
TEST_ENVIRONMENT_SECRET=your-secret-token-here

# Optional: Production keys for reference (not used in tests)
NEXT_PUBLIC_CAPTCHA_SITE_KEY=your-production-sitekey
CAPTCHA_SECRET_TOKEN=your-production-secret
```

**Production** - `.env.production`:
```bash
# Production Turnstile credentials
NEXT_PUBLIC_CAPTCHA_SITE_KEY=your-production-sitekey
CAPTCHA_SECRET_TOKEN=your-production-secret

# Ensure test mode is OFF
E2E_TESTING=false
PLAYWRIGHT_TEST=false
```

**GitHub Actions** - `.github/workflows/integration-tests.yml`:
```yaml
- name: Run Integration Tests
  env:
    E2E_TESTING: true
    PLAYWRIGHT_TEST: true
    TEST_ENVIRONMENT_SECRET: ${{ secrets.TEST_ENVIRONMENT_SECRET }}
    # Other test environment variables...
  run: pnpm test:e2e
```

#### Step 6: Add Deployment Safety Check

Create: `apps/web/lib/captcha-safety-check.ts`

```typescript
/**
 * Verify we're not accidentally using test credentials in production
 * Run this in your CI/CD pipeline
 */
export function verifyCaptchaConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  const siteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;

  if (isProd) {
    // Check if using dummy keys in production
    if (siteKey?.startsWith('1x00000000000000000000')) {
      throw new Error(
        '❌ SECURITY ALERT: Test Turnstile keys detected in production!\n' +
        'Production must use real Turnstile credentials.'
      );
    }

    // Verify production keys are set
    if (!siteKey || !process.env.CAPTCHA_SECRET_TOKEN) {
      throw new Error(
        '❌ Configuration Error: Production Turnstile credentials missing'
      );
    }

    console.log('✅ Turnstile configuration verified for production');
  } else {
    console.log('ℹ️ Non-production environment detected, test keys allowed');
  }
}
```

Add to `next.config.mjs`:
```javascript
import { verifyCaptchaConfig } from './lib/captcha-safety-check.ts';

// Run safety check during build
verifyCaptchaConfig();

export default nextConfig;
```

---

### Solution 3 Implementation (Simplest)

#### Conditional Rendering Approach

Update: `packages/features/auth/src/captcha/client/use-captcha.tsx`

```typescript
'use client';

export function useCaptcha() {
  // Disable Turnstile entirely in test environments
  const isTest =
    process.env.NODE_ENV === 'test' ||
    process.env.NEXT_PUBLIC_E2E_TESTING === 'true';

  if (isTest) {
    return {
      siteKey: undefined, // Will prevent CaptchaField from rendering
      loading: false,
    };
  }

  return {
    siteKey: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY,
    loading: false,
  };
}
```

Update: `packages/features/auth/src/captcha/server/verify-captcha.tsx`

```typescript
import 'server-only';

export async function verifyCaptchaToken(token: string) {
  // Skip verification in test environments
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.E2E_TESTING === 'true'
  ) {
    console.log('⚠️ Skipping CAPTCHA verification in test environment');
    return { success: true };
  }

  // Production verification...
  const secretKey = process.env.CAPTCHA_SECRET_TOKEN;
  if (!secretKey) {
    throw new Error('CAPTCHA_SECRET_TOKEN is not set');
  }

  // ... rest of verification logic
}
```

**Environment Variables** - `.env.test`:
```bash
NEXT_PUBLIC_E2E_TESTING=true
E2E_TESTING=true
```

---

## 5. Domain Configuration

### Hostname Management in Cloudflare

**Limits**:
- Free users: 15 hostnames per widget
- Enterprise: 200 hostnames per widget

**Format Requirements**:
- Must be fully qualified domain names (FQDNs)
- No wildcards supported directly
- Apex domain covers all subdomains automatically
  - Example: Adding `example.com` allows `www.example.com`, `app.example.com`, etc.

### Multi-Environment Widget Strategy

#### Option A: Single Widget with Multiple Domains (Simple)

**Single Widget**: `SlideHeroes Production`

**Hostnames**:
```
2025slideheroes-web.vercel.app
www.2025slideheroes-web.vercel.app
slideheroes.com
www.slideheroes.com
staging.slideheroes.com
localhost (if needed for local testing)
```

**Pros**: Simple management, single set of keys
**Cons**: Mixed analytics, can't set different rules per environment

#### Option B: Separate Widgets Per Environment (Recommended)

**Production Widget**: `SlideHeroes Production`
- Domains: `slideheroes.com`, `www.slideheroes.com`
- Mode: Managed (adaptive challenges)
- Analytics: Production traffic only

**Staging Widget**: `SlideHeroes Staging`
- Domains: `staging.slideheroes.com`, `*.vercel.app`
- Mode: Non-Interactive (lighter checks)
- Analytics: Staging traffic

**Development Widget**: `SlideHeroes Dev`
- Domains: `localhost`, `127.0.0.1`, `*.local`
- Mode: Managed
- Analytics: Local dev traffic

**Test Widget**: Use dummy keys instead
- No real widget needed
- Better approach: Environment detection with test keys

### Current Configuration Audit

Your current widget: `2025slideheroes-web.vercel.app`

**Recommended Actions**:
1. ✅ Keep current widget for Vercel preview deployments
2. ➕ Create production widget for final domain
3. ➕ Implement environment detection with test keys for CI/CD
4. ⚙️ Update hostname list to include all preview URLs if needed

---

## 6. Playwright/E2E Integration

### Test Configuration Best Practices

#### Playwright Config with Custom Header

Update: `apps/e2e/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3001',

    // Add custom header for test environment detection
    extraHTTPHeaders: {
      'x-test-environment': process.env.TEST_ENVIRONMENT_SECRET || 'test-secret',
    },

    // Other settings...
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Test environment setup
  webServer: {
    command: 'pnpm --filter web dev:test',
    url: 'http://localhost:3001',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      E2E_TESTING: 'true',
      PLAYWRIGHT_TEST: 'true',
      // Other test environment variables...
    },
  },
});
```

#### Global Setup for Test Environment

Create: `apps/e2e/global-setup.ts`

```typescript
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up test environment...');

  // Verify test environment is properly configured
  if (!process.env.E2E_TESTING) {
    throw new Error('E2E_TESTING environment variable not set');
  }

  // Verify test keys are available (for logging/debugging)
  const baseURL = config.use?.baseURL || 'http://localhost:3001';

  const browser = await chromium.launch();
  const page = await browser.newPage({
    extraHTTPHeaders: {
      'x-test-environment': process.env.TEST_ENVIRONMENT_SECRET || 'test-secret',
    },
  });

  try {
    // Test that captcha config endpoint returns test keys
    await page.goto(`${baseURL}/api/captcha/config`);
    const config = await page.evaluate(() => document.body.textContent);
    const configData = JSON.parse(config || '{}');

    if (!configData.siteKey?.startsWith('1x00000000000000000000')) {
      console.warn('⚠️ Warning: Not using test captcha keys. Tests may fail.');
    } else {
      console.log('✅ Test environment configured with dummy Turnstile keys');
    }
  } catch (error) {
    console.error('❌ Failed to verify test environment:', error);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
```

Update `playwright.config.ts`:
```typescript
export default defineConfig({
  globalSetup: require.resolve('./global-setup'),
  // ... rest of config
});
```

#### Page Object Pattern for Auth with Turnstile

Update: `apps/e2e/tests/auth.po.ts`

```typescript
import { Page } from '@playwright/test';

export class AuthPageObject {
  constructor(private readonly page: Page) {}

  async signIn(params: { email: string; password: string }) {
    await this.page.fill('input[name="email"]', params.email);
    await this.page.fill('input[name="password"]', params.password);

    // In test environment, Turnstile widget will auto-solve with dummy keys
    // No manual interaction needed

    await this.page.click('button[type="submit"]');

    // Wait for navigation after successful sign-in
    await this.page.waitForURL('**/home/**');
  }

  async signUp(params: { email: string; password: string; name: string }) {
    await this.page.goto('/auth/sign-up');

    await this.page.fill('input[name="email"]', params.email);
    await this.page.fill('input[name="password"]', params.password);
    await this.page.fill('input[name="name"]', params.name);

    // Turnstile will auto-pass with test keys
    await this.page.click('button[type="submit"]');

    // Handle any post-signup flow
    await this.page.waitForURL('**/home/**');
  }

  /**
   * Helper to verify Turnstile is in test mode (for debugging)
   */
  async verifyTestMode() {
    // Check if dummy Turnstile is loaded
    const turnstileWidget = await this.page.locator('.cf-turnstile').first();

    if (await turnstileWidget.isVisible()) {
      const siteKey = await turnstileWidget.getAttribute('data-sitekey');
      console.log('🔍 Turnstile sitekey:', siteKey);

      if (siteKey?.startsWith('1x00000000000000000000')) {
        console.log('✅ Using test Turnstile keys');
        return true;
      }
    }

    return false;
  }
}
```

#### Test Example with Reliability Pattern

Create: `apps/e2e/tests/auth/sign-in.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { AuthPageObject } from '../auth.po';

test.describe('Authentication', () => {
  test('should sign in with test Turnstile keys', async ({ page }) => {
    const auth = new AuthPageObject(page);

    // Navigate to sign-in page
    await page.goto('/auth/sign-in');

    // Optional: Verify we're using test keys
    const isTestMode = await auth.verifyTestMode();
    console.log('Test mode active:', isTestMode);

    // Sign in - Turnstile will auto-solve
    await expect(async () => {
      await auth.signIn({
        email: 'test1@slideheroes.com',
        password: 'aiesec1992',
      });

      // Verify successful sign-in
      expect(page.url()).toContain('/home');
    }).toPass({
      intervals: [1000, 2000, 5000],
      timeout: 30_000,
    });
  });

  test('should handle sign-up flow', async ({ page }) => {
    const auth = new AuthPageObject(page);

    const testEmail = `test-${Date.now()}@slideheroes.com`;

    await expect(async () => {
      await auth.signUp({
        email: testEmail,
        password: 'test-password-123',
        name: 'Test User',
      });

      expect(page.url()).toContain('/home');
    }).toPass();
  });
});
```

### GitHub Actions Configuration

Update: `.github/workflows/integration-tests.yml`

```yaml
name: Integration Tests

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Start Supabase
        run: pnpm supabase:web:start

      - name: Run integration tests
        env:
          # Test environment detection
          E2E_TESTING: true
          PLAYWRIGHT_TEST: true
          TEST_ENVIRONMENT_SECRET: ${{ secrets.TEST_ENVIRONMENT_SECRET }}

          # Supabase configuration
          E2E_SUPABASE_URL: http://127.0.0.1:54321
          E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}

          # Test user credentials
          E2E_TEST_USER_EMAIL: test1@slideheroes.com
          E2E_TEST_USER_PASSWORD: aiesec1992

          # Application configuration
          TEST_BASE_URL: http://localhost:3001
          NEXT_PUBLIC_SITE_URL: http://localhost:3001

          # Optional: Production keys for reference (not used)
          NEXT_PUBLIC_CAPTCHA_SITE_KEY: ${{ secrets.TURNSTILE_SITE_KEY }}
          CAPTCHA_SECRET_TOKEN: ${{ secrets.TURNSTILE_SECRET }}
        run: |
          pnpm test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results
          path: apps/e2e/test-results/
          retention-days: 30
```

---

## 7. Gotchas and Limitations

### Common Pitfalls

#### 1. Mixed Key Types ❌

**Problem**: Using dummy sitekey with production secret key (or vice versa)

**Symptoms**:
- All verifications fail
- Error: "Invalid CAPTCHA token"

**Solution**: Always use matching key types (both dummy or both production)

```typescript
// ❌ WRONG - Mixed key types
const siteKey = '1x00000000000000000000AA'; // Dummy
const secretKey = process.env.PRODUCTION_SECRET; // Production

// ✅ CORRECT - Matching key types
const { siteKey, secretKey } = getTurnstileCredentials(request);
```

#### 2. Test Keys in Production ❌

**Problem**: Accidentally deploying with test keys

**Symptoms**:
- All CAPTCHA challenges pass (security breach!)
- No bot protection in production

**Solution**: Add deployment safety checks (see Step 6 above)

```typescript
// In next.config.mjs
if (process.env.NODE_ENV === 'production') {
  if (process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY?.startsWith('1x0')) {
    throw new Error('Test keys detected in production!');
  }
}
```

#### 3. Localhost Not in Domain Allowlist

**Problem**: Testing with production keys on localhost

**Symptoms**:
- Turnstile widget fails to load
- Console error: "Invalid domain"

**Solutions**:
- Option A: Add `localhost` to widget's hostname allowlist
- Option B: Use dummy test keys (recommended)

#### 4. Token Expiration in Long-Running Tests

**Problem**: Turnstile tokens expire after 5 minutes

**Symptoms**:
- Tests pass locally but fail in slow CI
- Error: "Token expired"

**Solution**: Request new token if operation takes >5 minutes

```typescript
// In auth page object
async longRunningOperation() {
  // Refresh Turnstile token before long operation
  if (this.turnstileInstance) {
    this.turnstileInstance.reset();
  }

  // Proceed with operation
  await this.page.click('button[type="submit"]');
}
```

#### 5. Widget Not Rendering in Tests

**Problem**: CaptchaField returns null due to missing siteKey

**Symptoms**:
- Tests fail with "element not found"
- Submit button disabled

**Diagnosis**:
```typescript
// Add logging to use-captcha.tsx
export function useCaptcha() {
  const { siteKey, loading } = useCaptchaInternal();

  console.log('🔍 Captcha siteKey:', siteKey);
  console.log('🔍 Environment:', process.env.NODE_ENV);

  return { siteKey, loading };
}
```

**Solutions**:
- Verify API route `/api/captcha/config` returns sitekey
- Check environment variables are loaded correctly
- Ensure environment detection logic is working

### Performance Considerations

#### Test Execution Speed

**With Dummy Keys**:
- Token generation: <100ms
- Verification: <200ms
- Total overhead: ~300ms per auth operation

**With Real Keys** (not recommended for CI):
- Challenge solving: 2-5 seconds
- Verification: 200-500ms
- Total overhead: 2-5 seconds per operation
- Risk of rate limiting

**Recommendation**: Always use dummy keys for CI/CD to maintain fast test execution.

#### Rate Limiting

**Dummy Keys**: No rate limits
**Production Keys**:
- Free tier: 1 million verifications/month
- Paid tier: Custom limits

**CI/CD Impact**: Running 100 tests with 5 auth operations each = 500 verifications per run. With 20 runs/day = 10,000 verifications/day = 300k/month.

### Browser-Specific Issues

#### Turnstile Detection in Headless Mode

**Issue**: Some Cloudflare configurations detect headless browsers even with proper keys

**Solution**: Use dummy keys OR run Playwright in headed mode for debugging

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    headless: process.env.CI ? true : false, // Headed locally, headless in CI
  },
});
```

#### Cookie and Storage Requirements

**Requirement**: Turnstile uses cookies and localStorage

**Impact on Tests**: Ensure context persists between pages

```typescript
// Maintain context across navigation
await page.goto('/auth/sign-in', {
  waitUntil: 'networkidle',
});
```

### Debugging Tips

#### Enable Turnstile Debug Mode

Add to widget configuration (client-side):

```typescript
<CaptchaField
  siteKey={siteKey}
  options={{
    options: {
      size: 'invisible',
      // Debug mode
      appearance: 'interaction-only',
    },
  }}
/>
```

#### Log Verification Responses

Update server verification:

```typescript
export async function verifyCaptchaToken(token: string, request?: Request) {
  const { secretKey } = getTurnstileCredentials(request);

  console.log('🔍 Verifying token with secret:', secretKey.substring(0, 10) + '...');

  const res = await fetch(VERIFY_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  console.log('📊 Verification response:', {
    success: data.success,
    errors: data['error-codes'],
    hostname: data.hostname,
  });

  if (!data.success) {
    console.error('❌ Verification failed:', data);
    throw new Error('Invalid CAPTCHA token');
  }

  return data;
}
```

#### Test Environment Detection

Add logging to verify detection works:

```typescript
export function isTestEnvironment(request?: Request): boolean {
  const isTest =
    process.env.NODE_ENV === 'test' ||
    process.env.E2E_TESTING === 'true' ||
    process.env.PLAYWRIGHT_TEST === 'true';

  console.log('🔍 Environment detection:', {
    NODE_ENV: process.env.NODE_ENV,
    E2E_TESTING: process.env.E2E_TESTING,
    PLAYWRIGHT_TEST: process.env.PLAYWRIGHT_TEST,
    isTest,
  });

  return isTest;
}
```

---

## Quick Start Checklist

### For SlideHeroes Project

- [ ] **Step 1**: Create environment detection utilities
  - [ ] Add `packages/features/auth/src/captcha/server/captcha-env.ts`
  - [ ] Update `verify-captcha.tsx` to use environment detection
  - [ ] Create `/api/captcha/config` route

- [ ] **Step 2**: Configure environment variables
  - [ ] Add test flags to `apps/web/.env.test`
  - [ ] Add test flags to `apps/e2e/.env.test.locked`
  - [ ] Verify production keys in `.env.production`

- [ ] **Step 3**: Update Playwright configuration
  - [ ] Add custom headers to `playwright.config.ts`
  - [ ] Create `global-setup.ts` for verification
  - [ ] Update test environment variables

- [ ] **Step 4**: Update GitHub Actions workflow
  - [ ] Add `E2E_TESTING=true` to env
  - [ ] Add `PLAYWRIGHT_TEST=true` to env
  - [ ] Add `TEST_ENVIRONMENT_SECRET` from GitHub secrets

- [ ] **Step 5**: Add deployment safety checks
  - [ ] Create `captcha-safety-check.ts`
  - [ ] Add check to `next.config.mjs`
  - [ ] Test build process

- [ ] **Step 6**: Test the implementation
  - [ ] Run tests locally: `pnpm test:e2e`
  - [ ] Verify test keys are used (check logs)
  - [ ] Run tests in CI (GitHub Actions)
  - [ ] Verify production build uses real keys

---

## Additional Resources

### Official Documentation

- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [Testing Documentation](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
- [E2E Testing Tutorial](https://developers.cloudflare.com/turnstile/tutorials/excluding-turnstile-from-e2e-tests/)
- [Widget Management](https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/)

### Community Resources

- [GitHub: microsoft/playwright #23884](https://github.com/microsoft/playwright/issues/23884) - Turnstile with Playwright discussion
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

### Makerkit Integration

Your project uses:
- Package: `@marsidev/react-turnstile` (React wrapper)
- Component: `CaptchaField` (custom wrapper with react-hook-form support)
- Current mode: Invisible widget

---

## Conclusion

**Recommended Implementation Path**:

1. ✅ **Immediate**: Implement Solution 1 (Environment Detection with Test Keys)
2. ✅ **Short-term**: Add deployment safety checks
3. ✅ **Medium-term**: Create separate production widget for final domain
4. ✅ **Ongoing**: Monitor test execution times and adjust as needed

**Expected Outcomes**:
- ✅ Integration tests will pass consistently in CI/CD
- ✅ No CAPTCHA challenges during test execution
- ✅ Production security maintained
- ✅ Fast test execution (<1 second overhead per auth operation)
- ✅ Official Cloudflare support for the approach

**Implementation Time**: 2-4 hours for complete setup with safety checks

---

## Questions & Next Steps

If you encounter issues during implementation:

1. **Check logs**: Environment detection, sitekey values, verification responses
2. **Verify environment variables**: Ensure test flags are set correctly
3. **Test locally first**: Run `pnpm test:e2e` before pushing to CI
4. **Gradual rollout**: Test with a single spec file first

**Need Help?**
- Check Cloudflare Turnstile status: https://www.cloudflarestatus.com/
- Review Playwright test logs: `apps/e2e/test-results/`
- Enable debug logging in environment detection utilities

---

**Report Generated**: 2025-11-11
**Research Confidence**: High (Official Cloudflare documentation + verified community practices)
**Implementation Risk**: Low (Using official Cloudflare test infrastructure)
