# Enhanced Validation Code for Global Setup

This document contains the recommended validation code to add to `apps/e2e/global-setup.ts` to prevent configuration errors in the future.

## 1. Configuration Validation Function

Add this function at the top of the file (after imports):

```typescript
/**
 * Validates E2E test configuration with environment-aware error handling
 * Fails fast with actionable error messages if misconfigured
 */
function validateE2EConfiguration(
  supabaseUrl: string,
  baseURL: string,
): void {
  const isCI = process.env.CI === "true";
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical: Check for localhost URL in CI
  if (isCI && supabaseUrl.includes("127.0.0.1")) {
    errors.push(
      "E2E_SUPABASE_URL points to localhost (127.0.0.1:54321) in CI environment",
    );
    errors.push("Expected: Deployed Supabase instance URL");
  }

  // Check for missing or default values
  if (supabaseUrl === "http://127.0.0.1:54321" && isCI) {
    errors.push("E2E_SUPABASE_URL is not set (using default localhost value)");
  }

  // Validate URL format
  try {
    const url = new URL(supabaseUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      errors.push(`Invalid protocol in E2E_SUPABASE_URL: ${url.protocol}`);
    }
  } catch (e) {
    errors.push(`Invalid URL format for E2E_SUPABASE_URL: ${supabaseUrl}`);
  }

  // Check anon key format (should be JWT)
  const anonKey = process.env.E2E_SUPABASE_ANON_KEY;
  if (anonKey && !anonKey.startsWith("eyJ")) {
    warnings.push("E2E_SUPABASE_ANON_KEY does not appear to be a valid JWT");
  }

  // Log configuration for debugging
  console.log("Configuration:");
  console.log(`  E2E_SUPABASE_URL: ${supabaseUrl}`);
  console.log(`  PLAYWRIGHT_BASE_URL: ${baseURL}`);
  console.log(`  CI Environment: ${isCI ? "Yes" : "No"}`);
  console.log("");

  // Display warnings
  if (warnings.length > 0) {
    console.warn("⚠️ Configuration Warnings:");
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
    console.warn("");
  }

  // Handle errors
  if (errors.length > 0) {
    console.error("\n❌ Configuration Error: Invalid E2E Test Configuration\n");
    console.error("Problems detected:");
    errors.forEach((error) => console.error(`  ✗ ${error}`));
    console.error("");
    console.error("Current configuration:");
    console.error(`  E2E_SUPABASE_URL: ${supabaseUrl}`);
    console.error(`  PLAYWRIGHT_BASE_URL: ${baseURL}`);
    console.error(`  CI: ${isCI}`);
    console.error("");

    if (isCI) {
      console.error("Solution for CI environments:");
      console.error("  1. Set GitHub Secrets:");
      console.error(
        "     E2E_SUPABASE_URL=https://your-project.supabase.co",
      );
      console.error("     E2E_SUPABASE_ANON_KEY=eyJhbGc...");
      console.error("");
      console.error("  2. Add to workflow env section:");
      console.error(
        "     E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}",
      );
      console.error(
        "     E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}",
      );
      console.error("");
      console.error("  3. Verify secrets exist:");
      console.error("     gh secret list | grep E2E_SUPABASE");
    } else {
      console.error("Solution for local development:");
      console.error("  1. Copy .env.example to .env.local");
      console.error("  2. Set E2E_SUPABASE_URL to your test Supabase project");
      console.error("  3. Set E2E_SUPABASE_ANON_KEY with your anon key");
      console.error("");
      console.error("  Or use local Supabase:");
      console.error("     pnpm supabase:web:start");
    }
    console.error("");

    throw new Error(
      "E2E configuration validation failed. " +
        (isCI
          ? "Check GitHub Secrets and workflow configuration."
          : "Check your .env.local file."),
    );
  }

  console.log("✅ Configuration validation passed\n");
}
```

## 2. Enhanced Error Handling for Authentication

Replace the error handling block (lines 86-92) with this enhanced version:

```typescript
if (error || !data.session) {
  console.error(`\n❌ Authentication Failed: ${authState.name}\n`);

  // Display error details
  console.error("Error details:");
  console.error(`  Message: ${error?.message || "No session returned"}`);
  console.error(`  Email: ${credentials.email}`);
  console.error(`  Supabase URL: ${supabaseUrl}`);
  console.error("");

  // Context-aware troubleshooting
  if (error?.message?.includes("fetch failed")) {
    console.error("This appears to be a network/connectivity error.");
    console.error("");

    if (supabaseUrl.includes("127.0.0.1")) {
      console.error("⚠️ Configuration Issue Detected:");
      console.error("  You are trying to connect to localhost (127.0.0.1)");

      if (process.env.CI === "true") {
        console.error("  In CI, you must use a deployed Supabase instance");
        console.error("");
        console.error("Fix:");
        console.error(
          "  1. Set E2E_SUPABASE_URL to deployed instance in GitHub Secrets",
        );
        console.error("  2. Add to workflow env section");
      } else {
        console.error("  Make sure local Supabase is running:");
        console.error("     pnpm supabase:web:start");
      }
    } else {
      console.error("Troubleshooting steps:");
      console.error(`  1. Verify ${supabaseUrl} is accessible`);
      console.error("  2. Check network connectivity");
      console.error("  3. Verify E2E_SUPABASE_ANON_KEY is correct");
    }
  } else if (error?.message?.includes("Invalid login credentials")) {
    console.error("Authentication failed with invalid credentials.");
    console.error("");
    console.error("Troubleshooting steps:");
    console.error(`  1. Verify test user exists: ${credentials.email}`);
    console.error("  2. Check E2E_TEST_USER_PASSWORD is correct");
    console.error("  3. Try logging in manually to verify credentials");
  } else {
    console.error("Unexpected authentication error.");
    console.error("Check Supabase logs for more details.");
  }

  console.error("");

  throw (
    error ||
    new Error(`Authentication failed for ${authState.name}: No session returned`)
  );
}
```

## 3. Health Check Before Authentication

Add this function before the authentication loop:

```typescript
/**
 * Verifies Supabase connectivity before attempting authentication
 * Helps distinguish between connectivity issues and authentication problems
 */
async function verifySupabaseConnectivity(
  supabaseUrl: string,
  anonKey: string,
): Promise<void> {
  console.log("Verifying Supabase connectivity...");

  try {
    const healthUrl = `${supabaseUrl}/rest/v1/`;
    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        apikey: anonKey,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log("✅ Supabase connectivity verified");
    console.log(`   Status: ${response.status}`);
    console.log("");
  } catch (error) {
    console.error("\n❌ Supabase Connectivity Check Failed\n");
    console.error("Details:");
    console.error(`  URL: ${supabaseUrl}`);
    console.error(`  Error: ${(error as Error).message}`);
    console.error("");

    if (supabaseUrl.includes("127.0.0.1")) {
      console.error("⚠️ You are connecting to localhost");
      console.error(
        "   Make sure local Supabase is running: pnpm supabase:web:start",
      );
    } else {
      console.error("Troubleshooting:");
      console.error("  1. Verify the Supabase URL is correct");
      console.error("  2. Check if the Supabase project is running");
      console.error("  3. Verify network connectivity");
      console.error("  4. Check if E2E_SUPABASE_ANON_KEY is valid");
    }
    console.error("");

    throw new Error(
      `Cannot connect to Supabase instance at ${supabaseUrl}. ` +
        `Ensure the instance is running and accessible.`,
    );
  }
}
```

## 4. Updated Global Setup Function

Here's how to integrate all the validation into the main function:

```typescript
async function globalSetup(config: FullConfig) {
  console.log(
    "\n🔧 Global Setup: Creating authenticated browser states via API...\n",
  );

  const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:3001";

  // Initialize Supabase client
  const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseAnonKey =
    process.env.E2E_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

  // ✅ VALIDATE CONFIGURATION
  validateE2EConfiguration(supabaseUrl, baseURL);

  // ✅ VERIFY CONNECTIVITY (optional but recommended)
  await verifySupabaseConnectivity(supabaseUrl, supabaseAnonKey);

  // Create auth state directory if it doesn't exist
  const authDir = join(cwd(), ".auth");
  const { mkdirSync } = await import("node:fs");
  try {
    mkdirSync(authDir, { recursive: true });
  } catch (_e) {
    // Directory already exists
  }

  // Define auth states to create
  const authStates = [
    {
      name: "test user",
      role: "test" as const,
      filePath: join(authDir, "test@slideheroes.com.json"),
    },
    {
      name: "owner user",
      role: "owner" as const,
      filePath: join(authDir, "owner@slideheroes.com.json"),
    },
    {
      name: "super-admin user",
      role: "admin" as const,
      filePath: join(authDir, "super-admin@slideheroes.com.json"),
    },
  ];

  const browser = await chromium.launch();

  // Authenticate all users sequentially via API
  for (const authState of authStates) {
    console.log(`🔐 Authenticating ${authState.name} via Supabase API...`);

    const credentials = CredentialValidator.validateAndGet(authState.role);

    // Create a fresh Supabase client for each user
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Sign in via API
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    // ✅ ENHANCED ERROR HANDLING
    if (error || !data.session) {
      // Use enhanced error handler from above
      // ... (full code shown in section 2)
    }

    console.log(`✅ API authentication successful for ${authState.name}`);

    // Create browser context and inject the session
    // ... (rest of existing code)
  }

  await browser.close();

  console.log("✅ Global Setup Complete: All auth states created via API\n");
}

export default globalSetup;
```

## 5. Complete Modified global-setup.ts

For reference, here's where each piece goes:

```typescript
import { join } from "node:path";
import { cwd } from "node:process";
import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";

import { CredentialValidator } from "./tests/utils/credential-validator";

// Ensure environment variables are loaded
dotenvConfig({
  path: [".env", ".env.local"],
  quiet: true,
});

// ✅ ADD: Configuration validation function (Section 1)
function validateE2EConfiguration(
  supabaseUrl: string,
  baseURL: string,
): void {
  // ... code from Section 1 ...
}

// ✅ ADD: Connectivity verification function (Section 3)
async function verifySupabaseConnectivity(
  supabaseUrl: string,
  anonKey: string,
): Promise<void> {
  // ... code from Section 3 ...
}

/**
 * Global setup runs ONCE before all tests (not per-worker).
 * This creates authenticated browser states using API-based authentication.
 *
 * Benefits:
 * - 3-5x faster than UI-based per-test authentication
 * - No race conditions from multiple workers authenticating simultaneously
 * - Bypasses UI timing issues entirely
 * - Production-proven Playwright pattern
 * - Scales efficiently to 4+ workers
 */
async function globalSetup(config: FullConfig) {
  console.log(
    "\n🔧 Global Setup: Creating authenticated browser states via API...\n",
  );

  const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:3001";

  // Initialize Supabase client
  const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseAnonKey =
    process.env.E2E_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

  // ✅ MODIFIED: Add validation
  validateE2EConfiguration(supabaseUrl, baseURL);

  // ✅ MODIFIED: Add connectivity check
  await verifySupabaseConnectivity(supabaseUrl, supabaseAnonKey);

  // Create auth state directory if it doesn't exist
  const authDir = join(cwd(), ".auth");
  const { mkdirSync } = await import("node:fs");
  try {
    mkdirSync(authDir, { recursive: true });
  } catch (_e) {
    // Directory already exists
  }

  // Define auth states to create
  const authStates = [
    {
      name: "test user",
      role: "test" as const,
      filePath: join(authDir, "test@slideheroes.com.json"),
    },
    {
      name: "owner user",
      role: "owner" as const,
      filePath: join(authDir, "owner@slideheroes.com.json"),
    },
    {
      name: "super-admin user",
      role: "admin" as const,
      filePath: join(authDir, "super-admin@slideheroes.com.json"),
    },
  ];

  const browser = await chromium.launch();

  // Authenticate all users sequentially via API
  for (const authState of authStates) {
    console.log(`🔐 Authenticating ${authState.name} via Supabase API...`);

    const credentials = CredentialValidator.validateAndGet(authState.role);

    // Create a fresh Supabase client for each user
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Sign in via API
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    // ✅ MODIFIED: Enhanced error handling (Section 2)
    if (error || !data.session) {
      console.error(`\n❌ Authentication Failed: ${authState.name}\n`);

      console.error("Error details:");
      console.error(`  Message: ${error?.message || "No session returned"}`);
      console.error(`  Email: ${credentials.email}`);
      console.error(`  Supabase URL: ${supabaseUrl}`);
      console.error("");

      // ... rest of enhanced error handling from Section 2 ...

      throw (
        error ||
        new Error(
          `Authentication failed for ${authState.name}: No session returned`,
        )
      );
    }

    console.log(`✅ API authentication successful for ${authState.name}`);

    // Create browser context and inject the session
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();

    // Navigate to the app first to set the domain
    await page.goto("/");

    // Inject Supabase session into local storage
    await page.evaluate((session) => {
      const key = `sb-${window.location.host.split(".")[0]}-auth-token`;
      localStorage.setItem(key, JSON.stringify(session));
    }, data.session);

    console.log(
      `✅ Session injected into browser storage for ${authState.name}`,
    );

    // Navigate to home to verify authentication
    await page.goto("/home");
    await page.waitForURL("**/home**", { timeout: 10000 });

    // Save authenticated state
    await context.storageState({ path: authState.filePath });
    console.log(`✅ ${authState.name} auth state saved successfully\n`);

    await context.close();
  }

  await browser.close();

  console.log("✅ Global Setup Complete: All auth states created via API\n");
}

export default globalSetup;
```

## Benefits of These Enhancements

1. **Early Detection**: Fails immediately with clear message if misconfigured
2. **Actionable Errors**: Tells exactly what to fix and how
3. **Environment Aware**: Different guidance for CI vs local
4. **Connectivity Verification**: Separate network issues from auth issues
5. **Better Debugging**: Context-aware error messages
6. **Self-Documenting**: Logs configuration being used
7. **Reduced Support**: Developers can self-service

## Testing the Enhanced Code

### Test 1: Valid Configuration

```bash
export E2E_SUPABASE_URL="https://your-project.supabase.co"
export E2E_SUPABASE_ANON_KEY="eyJhbGc..."
cd apps/e2e
pnpm exec playwright test --config=playwright.config.ts --global-setup
```

Expected output:
```
Configuration:
  E2E_SUPABASE_URL: https://your-project.supabase.co
  PLAYWRIGHT_BASE_URL: http://localhost:3001
  CI Environment: No

✅ Configuration validation passed

Verifying Supabase connectivity...
✅ Supabase connectivity verified
   Status: 200

🔐 Authenticating test user via Supabase API...
✅ API authentication successful for test user
```

### Test 2: Invalid Configuration (CI)

```bash
export CI="true"
unset E2E_SUPABASE_URL  # Will use default localhost
cd apps/e2e
pnpm exec playwright test --config=playwright.config.ts --global-setup
```

Expected output:
```
Configuration:
  E2E_SUPABASE_URL: http://127.0.0.1:54321
  PLAYWRIGHT_BASE_URL: http://localhost:3001
  CI Environment: Yes

❌ Configuration Error: Invalid E2E Test Configuration

Problems detected:
  ✗ E2E_SUPABASE_URL points to localhost (127.0.0.1:54321) in CI environment
  ✗ Expected: Deployed Supabase instance URL

Solution for CI environments:
  1. Set GitHub Secrets:
     E2E_SUPABASE_URL=https://your-project.supabase.co
     E2E_SUPABASE_ANON_KEY=eyJhbGc...
...
```

### Test 3: Connectivity Failure

```bash
export E2E_SUPABASE_URL="https://nonexistent.supabase.co"
export E2E_SUPABASE_ANON_KEY="eyJhbGc..."
cd apps/e2e
pnpm exec playwright test --config=playwright.config.ts --global-setup
```

Expected output:
```
Configuration:
  E2E_SUPABASE_URL: https://nonexistent.supabase.co
  ...

✅ Configuration validation passed

Verifying Supabase connectivity...

❌ Supabase Connectivity Check Failed

Details:
  URL: https://nonexistent.supabase.co
  Error: getaddrinfo ENOTFOUND nonexistent.supabase.co

Troubleshooting:
  1. Verify the Supabase URL is correct
  2. Check if the Supabase project is running
  3. Verify network connectivity
  4. Check if E2E_SUPABASE_ANON_KEY is valid
```

## Implementation Priority

1. **High**: Configuration validation (Section 1)
   - Immediate, clear feedback
   - Prevents wasted CI time
   - 5 minutes to implement

2. **High**: Enhanced error handling (Section 2)
   - Better debugging experience
   - Context-aware guidance
   - 10 minutes to implement

3. **Medium**: Connectivity check (Section 3)
   - Distinguishes connectivity from auth issues
   - Optional but valuable
   - 5 minutes to implement

## Rollout Strategy

1. Add validation to a feature branch
2. Test locally with both valid and invalid configs
3. Test in CI by temporarily unsetting secrets
4. Merge when validated
5. Monitor CI runs for improved error messages
