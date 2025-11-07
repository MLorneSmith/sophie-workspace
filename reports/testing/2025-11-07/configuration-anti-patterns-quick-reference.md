# Configuration Anti-Patterns - Quick Reference Guide

**Quick diagnosis tool for configuration issues in E2E tests**

---

## The Core Anti-Pattern

```typescript
// ❌ ANTI-PATTERN: Silent failure with default
const url = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";

// ✅ SOLUTION: Environment-aware validation
const url = isCI 
  ? requireEnv("E2E_SUPABASE_URL")  // Fail fast in CI
  : process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";  // Defaults OK locally
```

---

## When to Use Each Pattern

### Use `||` (Logical OR) - Acceptable Cases

✅ **Feature flags with boolean defaults**
```typescript
const enableFeature = process.env.ENABLE_FEATURE || "false";
```

✅ **Display preferences**
```typescript
const theme = process.env.THEME || "light";
```

✅ **Non-critical metrics**
```typescript
const githubActor = process.env.GITHUB_ACTOR || "unknown";
```

### Use `??` (Nullish Coalescing) - Better for Explicit Checks

✅ **Configuration with explicit null/undefined handling**
```typescript
const port = process.env.PORT ?? 3000;
```

✅ **Values where empty string is valid**
```typescript
const prefix = process.env.PREFIX ?? "";  // Empty string is valid
```

### Use Environment-Aware Validation - Critical Infrastructure

✅ **Database connection strings**
```typescript
if (process.env.CI === "true" && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL required in CI");
}
```

✅ **API keys and secrets**
```typescript
if (process.env.CI === "true" && !process.env.API_KEY) {
  throw new Error("API_KEY required in CI");
}
```

✅ **External service URLs**
```typescript
if (process.env.CI === "true" && !process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL required in CI");
}
```

---

## Decision Tree

```
Is this variable critical for tests to run correctly?
│
├─ YES → Is this CI environment?
│   │
│   ├─ YES → REQUIRE variable (throw error if missing)
│   │
│   └─ NO → Allow default with warning
│
└─ NO → Is it a feature flag or display option?
    │
    ├─ YES → Use ?? with sensible default
    │
    └─ NO → Use || with default
```

---

## Common Scenarios

### Scenario 1: Database Connection

**Bad:**
```typescript
const dbUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/test";
// CI connects to localhost (doesn't exist) → cryptic error
```

**Good:**
```typescript
function getDatabaseUrl(): string {
  if (process.env.CI === "true") {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL is required in CI environment.\n" +
        "Add it to GitHub Secrets: Settings > Secrets > Actions"
      );
    }
    return process.env.DATABASE_URL;
  }
  
  // Local development - default is OK
  return process.env.DATABASE_URL || "postgresql://localhost:5432/test";
}
```

### Scenario 2: API Keys

**Bad:**
```typescript
const apiKey = process.env.API_KEY || "demo-key-123";
// CI uses demo key → tests pass but test nothing real
```

**Good:**
```typescript
function getApiKey(): string {
  const key = process.env.API_KEY;
  
  if (!key) {
    if (process.env.CI === "true") {
      throw new Error("API_KEY is required in CI");
    }
    console.warn("⚠️ Using demo API key - not suitable for CI");
    return "demo-key-123";
  }
  
  return key;
}
```

### Scenario 3: Feature Flags

**Good:**
```typescript
const enableBilling = process.env.ENABLE_BILLING_TESTS ?? "false";
// This is fine - feature flag with reasonable default
```

### Scenario 4: Display Options

**Good:**
```typescript
const logLevel = process.env.LOG_LEVEL || "info";
// This is fine - display preference with reasonable default
```

---

## Error Message Template

### Bad Error Message
```
Error: Connection failed
Error: ENOTFOUND localhost
Error: Authentication failed
```

### Good Error Message Template
```
❌ [Environment]: [What's Wrong]

🔧 How to Fix:
   1. [Specific step 1]
   2. [Specific step 2]
   3. [Specific step 3]

📖 Documentation: [Link to relevant docs]

ℹ️ Additional Context: [Why this matters / what to avoid]
```

### Example: Missing Supabase URL
```
❌ CI Environment: Required environment variable E2E_SUPABASE_URL is not set.

🔧 How to Fix:
   1. Go to https://github.com/MLorneSmith/2025slideheroes/settings/secrets/actions
   2. Click "New repository secret"
   3. Name: E2E_SUPABASE_URL
   4. Value: Your test Supabase instance URL (e.g., https://xxxxx.supabase.co)
   5. Re-run this workflow

📖 Documentation: apps/e2e/README.md#environment-setup

ℹ️ Note: Use your test instance, not production!
```

---

## Checklist: Is Your Configuration Safe?

### For Critical Variables (Database, APIs, Secrets)

- [ ] Throws clear error in CI when missing
- [ ] Error message explains how to fix
- [ ] Local development has helpful default or clear setup docs
- [ ] No secrets committed to repository (even demo keys)
- [ ] Validates format (URL, connection string, etc.)

### For Non-Critical Variables (Flags, Display)

- [ ] Has reasonable default
- [ ] Default documented in code comment
- [ ] Uses `??` instead of `||` (when appropriate)
- [ ] Won't cause tests to fail mysteriously

### For All Configuration

- [ ] Environment-aware (knows if running in CI)
- [ ] Clear error messages with actionable steps
- [ ] Documented in .env.example
- [ ] Tested in both local and CI environments

---

## Quick Fixes

### Fix 1: Add Environment Check

**Before:**
```typescript
const url = process.env.SUPABASE_URL || "http://localhost:54321";
```

**After:**
```typescript
const url = process.env.CI === "true"
  ? requireEnv("SUPABASE_URL")
  : process.env.SUPABASE_URL || "http://localhost:54321";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required in CI environment`);
  }
  return value;
}
```

### Fix 2: Use Validation Utility

**Before:**
```typescript
// Scattered across multiple files
const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://localhost:54321";
const supabaseKey = process.env.E2E_SUPABASE_KEY || "default-key";
```

**After:**
```typescript
// In one central location
import { validateE2EConfig } from "./utils/env-validator";

const config = validateE2EConfig();
// config.supabaseUrl - validated and correct for environment
// config.supabaseKey - validated and correct for environment
```

### Fix 3: Improve Error Message

**Before:**
```typescript
if (!process.env.API_KEY) {
  throw new Error("API_KEY not set");
}
```

**After:**
```typescript
if (!process.env.API_KEY) {
  throw new Error(
    "❌ API_KEY is required but not set.\n\n" +
    "🔧 How to Fix:\n" +
    "   1. Copy .env.example to .env.local\n" +
    "   2. Fill in API_KEY value\n" +
    "   3. Restart the dev server\n\n" +
    "📖 See README.md for setup instructions"
  );
}
```

---

## Testing Your Configuration

### Test Case 1: CI Without Variable

```typescript
test("should fail in CI when required var is missing", () => {
  process.env.CI = "true";
  delete process.env.REQUIRED_VAR;
  
  expect(() => {
    getConfig();
  }).toThrow(/REQUIRED_VAR is required/);
});
```

### Test Case 2: Local With Default

```typescript
test("should use default in local mode", () => {
  delete process.env.CI;
  delete process.env.OPTIONAL_VAR;
  
  const config = getConfig();
  expect(config.optionalVar).toBe("default-value");
});
```

### Test Case 3: Format Validation

```typescript
test("should validate URL format", () => {
  process.env.API_URL = "not-a-url";
  
  expect(() => {
    getConfig();
  }).toThrow(/Invalid URL format/);
});
```

---

## Files to Review in This Codebase

### Critical (Fix Immediately)

1. **apps/e2e/global-setup.ts:35** - Supabase URL with default
2. **apps/e2e/tests/helpers/test-users.ts:4** - Supabase URL with default

### Medium Priority

3. **scripts/update-test-user-progress.ts:77** - Payload URL with default
4. **scripts/test-certificate-generation.ts:58** - Payload URL with default

### Low Priority (Acceptable)

5. **scripts/collect-ci-metrics.js** - Metrics with defaults (OK)
6. **apps/web/lib/i18n/i18n.settings.ts** - Using `??` (Good)

---

## Resources

**Internal Documentation:**
- Main analysis: configuration-management-analysis.md
- E2E setup: apps/e2e/README.md
- Example validator: apps/e2e/tests/utils/credential-validator.ts

**External References:**
- 12-Factor App: https://12factor.net/config
- Fail-fast principle: https://martinfowler.com/ieeeSoftware/failFast.pdf
- Zod validation: https://zod.dev/

---

**Last Updated**: 2025-11-07  
**Maintained By**: Engineering Team  
**Status**: Living Document
