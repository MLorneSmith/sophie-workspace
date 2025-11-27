# E2E Authentication Setup - Code Quality Analysis & Refactoring Recommendations

**Date:** 2025-11-07  
**Context:** CI authentication failures (5 consecutive failures) - Works locally, fails in GitHub Actions  
**Failure Point:** `apps/e2e/global-setup.ts:81` - `supabase.auth.signInWithPassword`

---

## Executive Summary

**Root Cause Identified:** The authentication setup code lacks test user provisioning validation. The system attempts to authenticate users that may not exist in the target environment, leading to authentication failures in CI.

**Critical Gap:** No verification that test users exist before attempting authentication.

**Risk Level:** HIGH - Breaks all E2E tests when users don't exist in target environment.

---

## Code Quality Assessment

### Current Architecture Analysis

#### File: `apps/e2e/global-setup.ts`

#### Lines 81-92: Authentication Logic

```typescript
// Sign in via API
const { data, error } = await supabase.auth.signInWithPassword({
  email: credentials.email,
  password: credentials.password,
});

if (error || !data.session) {
  console.error(
    `❌ Failed to authenticate ${authState.name}: ${error?.message || "No session returned"}`,
  );
  throw error || new Error("No session returned from Supabase");
}
```

**Quality Issues:**

1. **No Pre-Flight Validation** 
   - Missing check: "Do these users exist?"
   - Assumes provisioning happened elsewhere
   - No graceful degradation

2. **Insufficient Error Context**
   - Error message doesn't distinguish between:
     - Wrong credentials
     - User doesn't exist
     - Network/API issues
     - Rate limiting
   - Makes debugging CI failures extremely difficult

3. **Tight Coupling**
   - Authentication and provisioning are separate concerns
   - No clear ownership of user creation
   - Violates Single Responsibility Principle

4. **Missing Environment Detection**
   - Same code path for local (Supabase seeded) vs. CI (deployed instance)
   - No environment-specific strategies

---

## Code Smell Detection

### Category 1: Missing Abstraction (Primitive Obsession)

**Location:** Lines 35-38, 75-84

**Smell:** Authentication configuration scattered as primitives
```typescript
const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey = process.env.E2E_SUPABASE_ANON_KEY || "eyJ...";
```

**Impact:**
- Configuration logic duplicated across files
- No validation of connection parameters
- Hard to test in isolation

**Recommendation:** Extract to `SupabaseTestClientFactory`

---

### Category 2: Feature Envy

**Location:** Lines 70-125

**Smell:** `global-setup.ts` does too much work that belongs elsewhere
- Credential validation (delegated to CredentialValidator ✓)
- User provisioning (NOT handled anywhere ✗)
- Browser state management
- Session injection

**Impact:**
- Difficult to test individual concerns
- Changes to provisioning strategy require modifying setup code
- Hard to reuse provisioning logic

**Recommendation:** Extract `TestUserProvisioner` class

---

### Category 3: Missing Error Recovery

**Location:** Lines 86-92

**Smell:** Binary error handling (succeed or throw)
```typescript
if (error || !data.session) {
  throw error || new Error("No session returned from Supabase");
}
```

**Impact:**
- No retry logic for transient failures
- No fallback strategies
- All-or-nothing authentication

**Recommendation:** Implement exponential backoff with retries

---

### Category 4: Incomplete Separation of Concerns

**Files Involved:**
- `global-setup.ts` - Setup orchestration
- `credential-validator.ts` - Credential validation ✓
- `test-users.ts` - User provisioning helpers (NOT integrated) ✗
- `setup-test-users.js` - Standalone script (NOT invoked) ✗

**Smell:** The system HAS provisioning code but DOESN'T use it

**Evidence:**
```typescript
// test-users.ts exists with setupTestUsers() function
export async function setupTestUsers() {
  console.log("🔧 Setting up test users...");
  await Promise.all([
    ensureTestUser(TEST_USERS.user1),
    ensureTestUser(TEST_USERS.user2),
    ensureTestUser(TEST_USERS.newUser),
  ]);
}

// BUT global-setup.ts never calls it!
```

**Impact:**
- Provisioning code exists but is orphaned
- Manual setup required
- CI failures when users don't exist

---

## Environment Configuration Analysis

### Local Environment (Working)
```bash
# Local Supabase has seeded users via migrations
# global-setup.ts authenticates successfully
```

### CI Environment (Failing)
```bash
# Deployed Supabase instance on dev
# E2E_SUPABASE_URL → Points to deployed instance
# E2E_SUPABASE_ANON_KEY → Deployed instance key
# Users may not exist → Authentication fails
```

### Configuration Gap

**Missing in CI Workflow:**
```yaml
# .github/workflows/dev-integration-tests.yml
# Lines 374-413: Run integration tests

# ✗ NO user provisioning step before tests
# ✗ NO verification that users exist
# ✓ Environment variables configured
# ✓ Credentials passed as secrets
```

**Required Addition:**
```yaml
- name: Provision test users
  env:
    E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
    E2E_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}
    E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
    E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
    E2E_OWNER_EMAIL: ${{ secrets.E2E_OWNER_EMAIL }}
    E2E_OWNER_PASSWORD: ${{ secrets.E2E_OWNER_PASSWORD }}
    E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
    E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
  run: |
    echo "🔧 Provisioning test users in target environment..."
    node apps/e2e/scripts/setup-test-users.js
```

---

## Credential Validator Assessment

### File: `apps/e2e/tests/utils/credential-validator.ts`

**Strengths:**
- ✅ Excellent environment-aware error messages
- ✅ Clear validation logic with email format checking
- ✅ Comprehensive error handling with context
- ✅ Good separation of concerns

**Areas for Improvement:**

1. **No Connection Validation** (Lines 173-182)
```typescript
static validateAndGet(type: "test" | "owner" | "admin"): E2ECredentials {
  const credentials = CredentialValidator.getCredentials(type);
  const result = CredentialValidator.validate(credentials);
  // ✗ Validates credentials format but not existence
  // ✗ Doesn't check if user exists in Supabase
}
```

**Recommended Enhancement:**
```typescript
static async validateAndGet(
  type: "test" | "owner" | "admin",
  options?: { verifyExists?: boolean }
): Promise<E2ECredentials> {
  const credentials = CredentialValidator.getCredentials(type);
  const result = CredentialValidator.validate(credentials);
  
  if (!result.isValid) {
    CredentialValidator.handleError(result, credentials);
  }
  
  // NEW: Optionally verify user exists
  if (options?.verifyExists) {
    await CredentialValidator.verifyUserExists(credentials);
  }
  
  return credentials;
}
```

2. **Verbose Mode Leaks Sensitive Data** (Lines 66-71)
```typescript
if (CredentialValidator.verboseMode) {
  console.log(`   Password length: ${password.length} chars`);
  // ✓ Good - doesn't log actual password
  // ✓ Safe for debugging
}
```
**Status:** Acceptable as-is

---

## Refactoring Recommendations

### Priority 1: CRITICAL - Add User Provisioning (HIGH IMPACT)

**Problem:** Authentication fails because users don't exist in CI environment.

**Solution:** Integrate user provisioning into global setup.

#### Refactoring Pattern: Extract Method + Dependency Injection

**File:** `apps/e2e/global-setup.ts`

**Changes:**

1. **Import provisioning logic** (Add after line 7)

   ```typescript
   import { setupTestUsers } from "./tests/helpers/test-users";
   ```

2. **Add provisioning step** (Insert before line 70)
```typescript
// Ensure test users exist in target environment
console.log("🔧 Provisioning test users in target environment...");
try {
  await setupTestUsers();
  console.log("✅ Test users provisioned successfully\n");
} catch (provisionError) {
  console.warn("⚠️ User provisioning failed (may already exist):", provisionError);
  console.log("Continuing with authentication attempt...\n");
}
```

**Benefits:**
- Users guaranteed to exist before authentication
- Idempotent (handles existing users gracefully)
- Clear error messages if provisioning fails
- Works in both local and CI environments

---

### Priority 2: HIGH - Enhance Error Diagnostics

**Problem:** Authentication errors lack context for debugging CI failures.

**Solution:** Add detailed error categorization and diagnostic information.

#### Refactoring Pattern: Replace Error Code with Exception + Strategy Pattern

**File:** `apps/e2e/global-setup.ts`

**Changes:**

1. **Create authentication error helper** (Add after line 13)

```typescript
interface AuthenticationDiagnostics {
  user: string;
  email: string;
  supabaseUrl: string;
  errorCode?: string;
  errorMessage?: string;
  environment: "CI" | "LOCAL";
  suggestions: string[];
}

function diagnoseAuthenticationFailure(
  authState: { name: string; role: string },
  credentials: { email: string },
  supabaseUrl: string,
  error: any
): AuthenticationDiagnostics {
  const isCI = process.env.CI === "true";
  const diagnostics: AuthenticationDiagnostics = {
    user: authState.name,
    email: credentials.email,
    supabaseUrl,
    errorCode: error?.code,
    errorMessage: error?.message,
    environment: isCI ? "CI" : "LOCAL",
    suggestions: [],
  };
  
  // Categorize error and provide specific suggestions
  if (error?.message?.includes("Invalid login credentials")) {
    diagnostics.suggestions = [
      "User may not exist in target environment",
      "Password may be incorrect",
      "Run user provisioning script first",
    ];
  } else if (error?.message?.includes("Email not confirmed")) {
    diagnostics.suggestions = [
      "User exists but email not confirmed",
      "Check email_confirm: true in user creation",
    ];
  } else if (error?.message?.includes("rate limit")) {
    diagnostics.suggestions = [
      "Too many authentication attempts",
      "Wait before retrying",
      "Check for parallel test runs",
    ];
  } else if (!error && !data.session) {
    diagnostics.suggestions = [
      "Authentication succeeded but no session returned",
      "Check Supabase session configuration",
      "Verify JWT settings",
    ];
  }
  
  return diagnostics;
}
```

2. **Replace error handling** (Replace lines 86-92)

```typescript
if (error || !data.session) {
  const diagnostics = diagnoseAuthenticationFailure(
    authState,
    credentials,
    supabaseUrl,
    error
  );
  
  console.error(`❌ Authentication failed for ${authState.name}`);
  console.error(`   Email: ${diagnostics.email}`);
  console.error(`   Supabase URL: ${diagnostics.supabaseUrl}`);
  console.error(`   Environment: ${diagnostics.environment}`);
  if (diagnostics.errorCode) {
    console.error(`   Error Code: ${diagnostics.errorCode}`);
  }
  console.error(`   Error: ${diagnostics.errorMessage || "No session returned"}`);
  console.error("\n💡 Suggestions:");
  diagnostics.suggestions.forEach((s, i) => {
    console.error(`   ${i + 1}. ${s}`);
  });
  
  throw new Error(
    `Authentication failed for ${authState.name}: ${diagnostics.errorMessage || "No session returned"}`
  );
}
```

**Benefits:**
- Clear categorization of failure types
- Actionable suggestions for each error
- Better CI debugging experience
- Distinguishes between different auth failures

---

### Priority 3: MEDIUM - Add Retry Logic with Exponential Backoff

**Problem:** Transient network failures cause setup to fail entirely.

**Solution:** Implement retry mechanism for authentication attempts.

#### Refactoring Pattern: Replace Method with Method Object

**File:** `apps/e2e/global-setup.ts`

**Changes:**

1. **Create authentication service** (Add after diagnostics function)

```typescript
class AuthenticationService {
  private readonly maxRetries = 3;
  private readonly baseDelayMs = 1000;
  
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly supabaseUrl: string
  ) {}
  
  async authenticateWithRetry(
    credentials: E2ECredentials,
    authState: { name: string; role: string }
  ): Promise<AuthResponse> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(
          `🔐 Authentication attempt ${attempt}/${this.maxRetries} for ${authState.name}...`
        );
        
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        
        if (!error && data.session) {
          console.log(`✅ Authentication successful for ${authState.name}`);
          return { data, error: null };
        }
        
        lastError = error;
        
        // Don't retry on credential errors (user doesn't exist, wrong password)
        if (
          error?.message?.includes("Invalid login credentials") ||
          error?.message?.includes("Email not confirmed")
        ) {
          console.error(`❌ Non-retryable error: ${error.message}`);
          break;
        }
        
        // Exponential backoff for retryable errors
        if (attempt < this.maxRetries) {
          const delayMs = this.baseDelayMs * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (err) {
        lastError = err;
        console.error(`❌ Unexpected error on attempt ${attempt}:`, err);
      }
    }
    
    // All retries exhausted
    const diagnostics = diagnoseAuthenticationFailure(
      authState,
      credentials,
      this.supabaseUrl,
      lastError
    );
    
    console.error(`❌ Authentication failed after ${this.maxRetries} attempts`);
    console.error(`   Email: ${diagnostics.email}`);
    console.error(`   Supabase URL: ${diagnostics.supabaseUrl}`);
    console.error(`   Environment: ${diagnostics.environment}`);
    console.error(`   Final Error: ${diagnostics.errorMessage || "No session returned"}`);
    console.error("\n💡 Suggestions:");
    diagnostics.suggestions.forEach((s, i) => {
      console.error(`   ${i + 1}. ${s}`);
    });
    
    throw new Error(
      `Authentication failed for ${authState.name} after ${this.maxRetries} attempts: ${diagnostics.errorMessage || "No session returned"}`
    );
  }
}
```

2. **Use service in main loop** (Replace lines 77-92)

```typescript
// Create authentication service
const authService = new AuthenticationService(supabase, supabaseUrl);

// Authenticate with retry logic
const { data } = await authService.authenticateWithRetry(credentials, authState);
```

**Benefits:**
- Handles transient network issues
- Non-intrusive (doesn't slow down happy path)
- Clear retry progress logging
- Avoids retrying on non-retryable errors

---

### Priority 4: MEDIUM - Extract Configuration to Factory

**Problem:** Supabase client configuration duplicated across files.

**Solution:** Create centralized configuration factory.

#### Refactoring Pattern: Extract Class + Factory Method

**New File:** `apps/e2e/tests/utils/supabase-test-client.ts`

```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseTestConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export class SupabaseTestClientFactory {
  private static readonly DEFAULT_LOCAL_URL = "http://127.0.0.1:54321";
  private static readonly DEFAULT_LOCAL_ANON_KEY = 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
  private static readonly DEFAULT_LOCAL_SERVICE_KEY = 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
  
  /**
   * Get configuration from environment with validation
   */
  static getConfig(): SupabaseTestConfig {
    const url = process.env.E2E_SUPABASE_URL || this.DEFAULT_LOCAL_URL;
    const anonKey = process.env.E2E_SUPABASE_ANON_KEY || this.DEFAULT_LOCAL_ANON_KEY;
    const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY || this.DEFAULT_LOCAL_SERVICE_KEY;
    
    // Validate URLs
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid E2E_SUPABASE_URL: ${url}`);
    }
    
    // Validate keys are JWT format (basic check)
    if (!anonKey.startsWith("eyJ") || !serviceRoleKey.startsWith("eyJ")) {
      throw new Error("Invalid Supabase key format (must be JWT)");
    }
    
    const isCI = process.env.CI === "true";
    const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
    
    console.log(`🔧 Supabase Test Configuration:`);
    console.log(`   URL: ${url}`);
    console.log(`   Environment: ${isCI ? "CI" : "LOCAL"}`);
    console.log(`   Using: ${isLocal ? "Local Supabase" : "Deployed Supabase"}`);
    
    return { url, anonKey, serviceRoleKey };
  }
  
  /**
   * Create Supabase client with anon key (for authentication)
   */
  static createAnonClient(): SupabaseClient {
    const config = this.getConfig();
    return createClient(config.url, config.anonKey);
  }
  
  /**
   * Create Supabase client with service role key (for admin operations)
   */
  static createAdminClient(): SupabaseClient {
    const config = this.getConfig();
    if (!config.serviceRoleKey) {
      throw new Error("Service role key required for admin client");
    }
    return createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  /**
   * Validate connection to Supabase
   */
  static async validateConnection(): Promise<boolean> {
    try {
      const client = this.createAnonClient();
      const { error } = await client.auth.getSession();
      return !error;
    } catch {
      return false;
    }
  }
}
```

**Update Files:**

1. `global-setup.ts` (Replace lines 34-38)

```typescript
const config = SupabaseTestClientFactory.getConfig();

// Validate connection before proceeding
const isConnected = await SupabaseTestClientFactory.validateConnection();
if (!isConnected) {
  throw new Error(`Cannot connect to Supabase at ${config.url}`);
}
```

2. `global-setup.ts` (Replace line 78)

```typescript
const supabase = SupabaseTestClientFactory.createAnonClient();
```

3. `test-users.ts` (Replace lines 3-7, 44-49, 113-118)

```typescript
import { SupabaseTestClientFactory } from "./supabase-test-client";

// In ensureTestUser:
const supabase = SupabaseTestClientFactory.createAdminClient();

// In cleanupTestUsers:
const supabase = SupabaseTestClientFactory.createAdminClient();
```

**Benefits:**
- Single source of truth for configuration
- Centralized validation
- Easy to add logging/monitoring
- Reduces duplication across test files

---

## Validation Requirements

After implementing refactoring:

1. Unit Tests Required

**File:** `apps/e2e/tests/utils/__tests__/credential-validator.spec.ts`
- Test credential format validation
- Test error message generation
- Test environment detection

**File:** `apps/e2e/tests/utils/__tests__/supabase-test-client.spec.ts`
- Test configuration loading
- Test client creation
- Test connection validation

2. Integration Tests Required

**File:** `apps/e2e/tests/__tests__/global-setup.spec.ts`
- Test user provisioning
- Test authentication with retry
- Test error diagnostics
- Test session injection

3. CI Validation Steps

```yaml
- name: Verify test infrastructure
  run: |
    echo "🔍 Validating test setup..."
    
    # 1. Check Supabase connectivity
    curl -f "$E2E_SUPABASE_URL/rest/v1/" -H "apikey: $E2E_SUPABASE_ANON_KEY" || {
      echo "❌ Cannot connect to Supabase"
      exit 1
    }
    
    # 2. Verify credentials are set
    test -n "$E2E_TEST_USER_EMAIL" || { echo "❌ E2E_TEST_USER_EMAIL not set"; exit 1; }
    test -n "$E2E_TEST_USER_PASSWORD" || { echo "❌ E2E_TEST_USER_PASSWORD not set"; exit 1; }
    
    # 3. Provision users
    node apps/e2e/scripts/setup-test-users.js
    
    echo "✅ Test infrastructure validated"
```

---

## Implementation Plan

### Phase 1: Immediate Fixes (Day 1)
1. ✅ Add user provisioning to CI workflow
2. ✅ Integrate `setupTestUsers()` call in `global-setup.ts`
3. ✅ Test in CI environment

**Expected Impact:** Resolves authentication failures

### Phase 2: Enhanced Diagnostics (Day 2-3)
1. ✅ Add authentication diagnostics function
2. ✅ Enhance error messages with suggestions
3. ✅ Add verbose logging mode

**Expected Impact:** Faster debugging of future issues

### Phase 3: Reliability Improvements (Day 4-5)
1. ✅ Implement retry logic with exponential backoff
2. ✅ Add connection validation
3. ✅ Create `AuthenticationService` class

**Expected Impact:** Handles transient failures gracefully

### Phase 4: Architecture Cleanup (Day 6-7)
1. ✅ Extract `SupabaseTestClientFactory`
2. ✅ Refactor configuration management
3. ✅ Add unit tests

**Expected Impact:** Maintainable, testable codebase

---

## Metrics for Success

### Before Refactoring
- ❌ CI Failures: 5/5 (100% failure rate)
- ❌ Time to Debug: 30+ minutes per failure
- ❌ Error Clarity: Generic "authentication failed" message
- ❌ Retry Capability: None (fail fast)

### After Refactoring (Target)
- ✅ CI Failures: 0/5 (0% failure rate)
- ✅ Time to Debug: < 5 minutes with clear diagnostics
- ✅ Error Clarity: Categorized errors with actionable suggestions
- ✅ Retry Capability: 3 retries with exponential backoff

---

## Anti-Patterns Avoided

### 1. Big Bang Refactoring
- ✅ Phased approach with incremental improvements
- ✅ Each phase independently testable

### 2. Premature Optimization
- ✅ Focus on solving actual CI failures first
- ✅ Architecture improvements follow

### 3. Gold Plating
- ✅ Each change addresses real pain point
- ✅ No speculative features

### 4. Test-After Approach
- ✅ Test requirements defined upfront
- ✅ Validation steps included

---

## Recommended Next Steps

1. **Implement Phase 1 immediately** to unblock CI
   - Add provisioning step to workflow
   - Update global-setup.ts with setupTestUsers() call
   - Deploy and verify

2. **Schedule Phase 2-3 for next sprint**
   - Enhanced diagnostics
   - Retry logic
   - Not urgent but high value

3. **Consider Phase 4 as tech debt item**
   - Architecture cleanup
   - Extract factory classes
   - Can be done incrementally

---

## Questions for Discussion

1. **Service Role Key Security**
   - Is `E2E_SUPABASE_SERVICE_ROLE_KEY` currently set as GitHub Secret?
   - Should user provisioning run in CI or be pre-configured?

2. **Test User Strategy**
   - Should test users be ephemeral (created/deleted per run)?
   - Or persistent (created once, reused)?

3. **Error Handling Philosophy**
   - Fail fast vs. retry aggressively?
   - Current recommendation: Retry transient, fail fast on credentials

4. **Monitoring**
   - Should we add metrics for authentication success rates?
   - Track retry counts and failure patterns?

---

## Related Files

**Core Authentication:**
- `/home/msmith/projects/2025slideheroes/apps/e2e/global-setup.ts`
- `/home/msmith/projects/2025slideheroes/apps/e2e/tests/utils/credential-validator.ts`
- `/home/msmith/projects/2025slideheroes/apps/e2e/tests/helpers/test-users.ts`

**CI Configuration:**
- `/home/msmith/projects/2025slideheroes/.github/workflows/dev-integration-tests.yml`

**Environment:**
- `/home/msmith/projects/2025slideheroes/apps/e2e/.env.example`
- `/home/msmith/projects/2025slideheroes/apps/e2e/.env.local` (local only)

---

## Conclusion

The authentication setup code is well-structured with excellent credential validation and error messaging. However, it has a **critical gap**: **no user provisioning validation before authentication**.

The solution is straightforward:
1. Integrate existing `setupTestUsers()` function into global setup
2. Add provisioning step to CI workflow
3. Enhance error diagnostics for future debugging

This refactoring follows the established patterns in the codebase, maintains backward compatibility, and addresses the root cause of CI failures without over-engineering.

**Estimated Implementation Time:** 2-3 hours for Phase 1 (critical fix)  
**Risk Level:** LOW - Phased approach with existing tested components  
**Impact:** HIGH - Resolves all authentication failures in CI
