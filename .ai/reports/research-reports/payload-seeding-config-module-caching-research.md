# Research Report: Module Caching and SSL Configuration Issues in Payload CMS Seeding

**Date**: 2025-11-05
**Context**: Payload CMS v3.62.1 with @payloadcms/db-postgres adapter
**Problem**: Tests failing with SSL certificate errors despite NODE_ENV=test configuration

## Executive Summary

The module caching issue in `payload.seeding.config.ts` stems from multiple root causes:

1. **Invalid SSL configuration property**: `sslmode` is not a valid property in the node-postgres `ssl` config object - it only works in connection strings
2. **Module-level evaluation**: The config is evaluated once at module load time and cached by Node.js
3. **Static export pattern**: Payload's `buildConfig()` is exported directly, not as a factory function
4. **Vitest module caching**: Tests import the config module before environment variables are properly set

## Key Findings

### 1. Node-postgres SSL Configuration

#### Valid SSL Properties

According to official node-postgres documentation, the `ssl` config object accepts:

- `rejectUnauthorized` (boolean) - whether to reject self-signed certificates
- `ca` (string) - certificate authority
- `key` (string) - client key
- `cert` (string) - client certificate
- `enableChannelBinding` (boolean) - enables SCRAM-SHA-256-PLUS

#### Invalid Property Found

**CRITICAL BUG**: Line 68 in `payload.seeding.config.ts` contains:
```typescript
sslmode: "require",  // ❌ INVALID - not a valid ssl object property
```

**Source**: [node-postgres SSL documentation](https://node-postgres.com/features/ssl)

The documentation explicitly states:
> "If you plan to use a combination of a database connection string from the environment and SSL settings in the config object directly, then you must avoid including any of `sslcert`, `sslkey`, `sslrootcert`, or `sslmode` in the connection string."

**`sslmode` is a connection string parameter only**, not an ssl object property.

#### Recent GitHub Issue Confirms

GitHub issue [#3355](https://github.com/brianc/node-postgres/issues/3355) from December 2024 demonstrates this exact problem:

> "It seems like the query param `sslmode=require` completely overrides the `ssl` property setting. I confirmed this by removing the `sslmode=require` and the pool got connected normally."

**Impact**: The invalid `sslmode` property is silently ignored, making the SSL config ineffective.

### 2. Vitest Module Caching Behavior

#### How Vitest Caches Modules

From [Vitest documentation](https://vitest.dev/api/vi.html):

- Vitest maintains a module registry cache across test files
- Top-level imports are evaluated once and cached
- Module-level code (including config evaluation) runs at import time
- Subsequent imports of the same module return the cached version

#### The `vi.resetModules()` Solution

```typescript
import { vi } from 'vitest'

beforeEach(() => {
  vi.resetModules() // Clears the module cache
})

test('change state', async () => {
  const mod = await import('./some/path.js') // Dynamic import required
  // Module is re-evaluated fresh
})
```

**Key limitation**: "Top-level imports cannot be re-evaluated"

This means static imports like:
```typescript
import payloadSeedingConfig from '../../../payload.seeding.config.js';
```

...will NOT be reset by `vi.resetModules()` because they're evaluated before the test runs.

**Current code location**: `payload-initializer.ts` line 19 uses a static import, which explains why module caching persists.

### 3. Payload CMS Configuration Patterns

#### Standard Pattern (Static Export)

Payload CMS typically uses static configuration exports:

```typescript
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  db: postgresAdapter({ /* config */ }),
  // ...
});
```

This pattern evaluates environment variables at module load time, not at runtime.

#### Environment Variable Timing Issue

From Payload GitHub discussions:

- `PAYLOAD_PUBLIC_*` variables are bundled at build time
- Config evaluation happens during webpack/build stage
- Production builds "bake in" environment values
- Changing env vars after build requires rebuild

**Relevance**: The same timing issue affects test environments - config is evaluated when the module is first imported, not when tests run.

#### Factory Function Alternative

Some projects use factory functions for dynamic configuration:

```typescript
// Factory pattern - evaluates on each call
export function createPayloadConfig() {
  return buildConfig({
    secret: process.env.PAYLOAD_SECRET,
    db: createDatabaseAdapter(), // evaluated fresh each time
  });
}
```

However, Payload CMS v3 expects a static config export, making this pattern challenging to implement.

### 4. Environment-Specific Database Adapter Solutions

#### Pattern 1: Connection String Configuration

**Recommended approach** for SSL in different environments:

```typescript
const databaseURI = process.env.NODE_ENV === 'production'
  ? process.env.DATABASE_URI // Production: use as-is (may include ?sslmode=require)
  : `${process.env.DATABASE_URI}?sslmode=disable`; // Test/dev: append disable

return postgresAdapter({
  pool: {
    connectionString: databaseURI,
    // NO ssl property - let connection string handle it
  },
});
```

This leverages the fact that connection string parameters take precedence.

#### Pattern 2: Separate SSL Object (Current Approach)

```typescript
const sslConfig = process.env.NODE_ENV === "production"
  ? {
      rejectUnauthorized: false,
      // REMOVE invalid 'sslmode' property
    }
  : false;

return postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URI,
    ssl: sslConfig,
  },
});
```

**Issue**: If `DATABASE_URI` contains `?sslmode=require`, it will override the ssl object.

#### Pattern 3: Parse and Merge (Most Robust)

From node-postgres issue #3355 comments:

> "Use the `pg-connection-string` package (which is how pg parses `connectionString`) and merge the resulting configuration exactly the way you want"

```typescript
import { parse } from 'pg-connection-string';

const connectionConfig = parse(process.env.DATABASE_URI);

// Remove sslmode from parsed config
delete connectionConfig.sslmode;

// Explicitly set ssl based on environment
const poolConfig = {
  ...connectionConfig,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
};

return postgresAdapter({ pool: poolConfig });
```

This gives explicit control over SSL configuration regardless of connection string.

## Root Cause Analysis

### Why Tests Are Failing

1. **Static import in payload-initializer.ts**: `import payloadSeedingConfig from '../../../payload.seeding.config.js'` (line 19)
2. **Module evaluated once**: Config file runs when first imported, before test setup
3. **Environment variable timing**: `vitest.setup.ts` sets `NODE_ENV=test`, but config may already be cached from earlier import
4. **Invalid SSL property**: `sslmode: "require"` in ssl object is silently ignored
5. **Connection string wins**: If `DATABASE_URI` contains `?sslmode=require`, it overrides the ssl object's `false` setting

### Module Evaluation Timeline

```
1. Vitest startup
2. vitest.setup.ts runs → sets NODE_ENV=test
3. Test file imports → triggers chain of imports
4. payload-initializer.ts imports payload.seeding.config.js
5. payload.seeding.config.js evaluates:
   - Reads NODE_ENV (may still be undefined or system default)
   - Creates sslConfig based on that value
   - Exports static config object
6. Module cached by Node.js
7. Subsequent test imports use cached version
8. Tests run with stale config
```

## Recommended Solutions

### Solution 1: Fix Invalid SSL Property (IMMEDIATE)

**Priority**: Critical
**Effort**: 5 minutes
**Impact**: Fixes silent SSL misconfiguration

```typescript
// payload.seeding.config.ts line 64-70
const sslConfig =
  process.env.NODE_ENV === "production"
    ? {
        rejectUnauthorized: false,
        // REMOVE: sslmode: "require", // ❌ Invalid property
      }
    : false;
```

### Solution 2: Use Connection String for SSL Control (RECOMMENDED)

**Priority**: High
**Effort**: 15 minutes
**Impact**: Eliminates module caching issues for SSL

```typescript
// payload.seeding.config.ts
const databaseURI = process.env.DATABASE_URI;
if (!databaseURI) {
  throw new Error("DATABASE_URI environment variable is required for seeding");
}

// Let connection string handle SSL mode entirely
// Production: postgresql://...?sslmode=require
// Test: postgresql://...?sslmode=disable
// Dev: postgresql://... (no SSL)

return postgresAdapter({
  pool: {
    connectionString: databaseURI,
    // Remove ssl property entirely - connection string handles it
    max: 2,
    min: 0,
    // ... other pool settings
  },
  schemaName: "payload",
  idType: "uuid",
  push: false,
});
```

**Tests update their DATABASE_URI**:
```typescript
// In test files
process.env.DATABASE_URI = 'postgresql://test:test@localhost:5432/test?sslmode=disable';
```

### Solution 3: Factory Function with Dynamic Import (ADVANCED)

**Priority**: Medium
**Effort**: 2-3 hours
**Impact**: Solves module caching completely but requires refactoring

```typescript
// payload.seeding.config.ts - export factory instead of static config
export function createPayloadSeedingConfig() {
  // Environment variables evaluated fresh each time
  const payloadSecret = process.env.PAYLOAD_SECRET;
  const databaseURI = process.env.DATABASE_URI;
  const nodeEnv = process.env.NODE_ENV;

  if (!payloadSecret || !databaseURI) {
    throw new Error("Required environment variables missing");
  }

  return buildConfig({
    secret: payloadSecret,
    serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || "",
    collections: [ /* ... */ ],
    db: (() => {
      const sslConfig = nodeEnv === "production"
        ? { rejectUnauthorized: false }
        : false;

      return postgresAdapter({
        pool: {
          connectionString: databaseURI,
          ssl: sslConfig,
          // ... pool config
        },
        schemaName: "payload",
        idType: "uuid",
        push: false,
      });
    })(),
  });
}
```

**Update payload-initializer.ts**:
```typescript
import { vi } from 'vitest';

// Use dynamic import + factory
export async function initializePayload(): Promise<Payload> {
  // Clear module cache to force fresh evaluation
  vi.resetModules();

  // Dynamic import evaluates module fresh
  const { createPayloadSeedingConfig } = await import('../../../payload.seeding.config.js');

  // Factory creates fresh config with current env vars
  const config = createPayloadSeedingConfig();

  return await getPayload({ config });
}
```

**Challenges**:
- Payload expects static default export
- May require forking Payload or using workarounds
- More complex than connection string approach

### Solution 4: Test Environment Setup Improvements

**Priority**: High
**Effort**: 30 minutes
**Impact**: Ensures consistent test environment

```typescript
// vitest.setup.ts - ensure env vars set BEFORE any imports
import { resolve } from "node:path";
import { config } from "dotenv";

// Load .env.test FIRST
const envPath = resolve(__dirname, ".env.test");
config({ path: envPath });

// Set NODE_ENV BEFORE any other code runs
process.env.NODE_ENV = "test";

// Ensure DATABASE_URI includes sslmode=disable for local Supabase
if (!process.env.DATABASE_URI?.includes('sslmode=')) {
  const uri = process.env.DATABASE_URI || "postgresql://postgres:postgres@localhost:54322/postgres";
  process.env.DATABASE_URI = `${uri}?sslmode=disable`;
}

// Other setup...
```

**Update test files**:
```typescript
// Add to beforeEach in integration tests
beforeEach(() => {
  resetPayloadInstance();

  // Explicitly set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URI = 'postgresql://test:test@localhost:5432/test?sslmode=disable';
  process.env.PAYLOAD_SECRET = 'test-secret-key-for-testing';

  orchestrator = new SeedOrchestrator();
});
```

## Implementation Priority

### Phase 1: Immediate Fixes (Day 1)

1. ✅ **Remove invalid `sslmode` property** from ssl config object (Solution 1)
2. ✅ **Switch to connection string SSL control** (Solution 2)
3. ✅ **Update test DATABASE_URI** to include `?sslmode=disable` explicitly

### Phase 2: Environment Hardening (Day 2)

4. ✅ **Improve vitest.setup.ts** to ensure DATABASE_URI has SSL mode (Solution 4)
5. ✅ **Update integration tests** to explicitly set DATABASE_URI in beforeEach
6. ✅ **Document** the connection string SSL pattern in code comments

### Phase 3: Optional Advanced Fix (Future)

7. ⏸️ **Evaluate factory function approach** if module caching issues persist (Solution 3)
8. ⏸️ **Consider** using `vi.resetModules()` with dynamic imports if needed

## Verification Steps

After implementing fixes:

1. **Run individual test**: `pnpm --filter payload test src/seed/seed-engine/__tests__/integration/full-workflow.test.ts`
2. **Run full test suite**: `pnpm --filter payload test`
3. **Verify SSL disabled**: Check Supabase logs - should not show SSL errors
4. **Test production config**: Temporarily set `NODE_ENV=production` and verify SSL enabled
5. **Check connection pooling**: Monitor active connections during tests

## References

### Primary Sources

1. **Node-postgres SSL documentation**: https://node-postgres.com/features/ssl
2. **GitHub issue #3355**: https://github.com/brianc/node-postgres/issues/3355
3. **Vitest vi.resetModules()**: https://vitest.dev/api/vi.html
4. **Payload CMS Config**: https://payloadcms.com/docs/configuration/overview

### Secondary Sources

5. GitHub issue #2281: node-postgres connection string vs ssl object
6. GitHub issue #2607: PGSSLMODE vs rejectUnauthorized
7. Stack Overflow: Vitest mock caching
8. Medium articles: Node.js module exports best practices

## Appendix: Code Snippets

### Current Problematic Code

```typescript
// apps/payload/src/payload.seeding.config.ts lines 64-70
const sslConfig =
  process.env.NODE_ENV === "production"
    ? {
        rejectUnauthorized: false,
        sslmode: "require", // ❌ INVALID - silently ignored
      }
    : false;

return postgresAdapter({
  pool: { ...poolConfig, connectionString: databaseURI },
  schemaName: "payload",
  idType: "uuid",
  push: false,
});
```

### Recommended Fixed Code

```typescript
// apps/payload/src/payload.seeding.config.ts (FIXED)
// DATABASE_URI should include SSL mode in the connection string:
// - Production: postgresql://...?sslmode=require
// - Test: postgresql://...?sslmode=disable
// - Development: postgresql://... (no SSL)

const databaseURI = process.env.DATABASE_URI;
if (!databaseURI) {
  throw new Error("DATABASE_URI environment variable is required for seeding");
}

// Connection string based pool configuration (no separate ssl object)
const poolConfig = {
  connectionString: databaseURI, // SSL mode handled by connection string
  max: 2,
  min: 0,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  acquireTimeoutMillis: 5000,
  createTimeoutMillis: 10000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
};

return postgresAdapter({
  pool: poolConfig,
  schemaName: "payload",
  idType: "uuid",
  push: false,
});
```

### Test Environment Setup

```typescript
// apps/payload/vitest.setup.ts (ENHANCED)
import { resolve } from "node:path";
import { config } from "dotenv";

// Load .env.test file
const envPath = resolve(__dirname, ".env.test");
config({ path: envPath });

// Force NODE_ENV to 'test'
process.env.NODE_ENV = "test";

// Ensure DATABASE_URI includes sslmode=disable for local Supabase
const baseUri = process.env.DATABASE_URI || "postgresql://postgres:postgres@localhost:54322/postgres";
if (!baseUri.includes('sslmode=')) {
  process.env.DATABASE_URI = `${baseUri}?sslmode=disable`;
}

// Set other required variables
if (!process.env.PAYLOAD_SECRET) {
  process.env.PAYLOAD_SECRET = "test_payload_secret_for_e2e_testing";
}
if (!process.env.PAYLOAD_PUBLIC_SERVER_URL) {
  process.env.PAYLOAD_PUBLIC_SERVER_URL = "http://localhost:3020";
}
```

## Conclusion

The SSL configuration issue has three interrelated root causes:

1. **Invalid property**: `sslmode` doesn't belong in the ssl config object
2. **Module caching**: Config evaluated once at import time, cached thereafter
3. **Connection string precedence**: Connection string SSL settings override ssl object

The recommended fix is to **remove the ssl object entirely** and **handle SSL mode through the connection string**. This approach:

- ✅ Eliminates the invalid `sslmode` property
- ✅ Sidesteps module caching issues (connection string evaluated fresh)
- ✅ Follows node-postgres best practices
- ✅ Simplifies configuration logic
- ✅ Makes environment-specific behavior explicit and testable

Implementation should take ~30 minutes and immediately resolve the test failures.
