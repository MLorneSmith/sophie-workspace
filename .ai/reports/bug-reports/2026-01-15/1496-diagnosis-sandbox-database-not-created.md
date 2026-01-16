# Bug Diagnosis: Sandbox Supabase Database Not Created - Invalid Credentials in .env

**ID**: ISSUE-pending
**Created**: 2026-01-15T20:30:00Z
**Reporter**: User
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The remote Supabase database for the 'slideheroes-alpha-sandbox' project was never created because the database credentials in the `.env` file are invalid/outdated. The orchestrator's database operations silently fail due to password authentication errors, but the orchestrator continues without error because the error handling returns `true` on failure.

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: development
- **Supabase Project**: slideheroes-alpha-sandbox (ref: kdjbbhjgogqywtlctlzq)
- **Node Version**: 22.16.0
- **Database**: PostgreSQL (Supabase hosted)

## Reproduction Steps

1. Start the orchestrator with spec 1362: `tsx spec-orchestrator.ts 1362`
2. Orchestrator loads `.env` file and attempts database operations
3. `checkDatabaseCapacity()` tries to connect to database
4. Connection fails with "password authentication failed"
5. Error is silently caught and operation returns `true` (non-blocking)
6. `resetSandboxDatabase()` similarly fails silently
7. `seedSandboxDatabase()` fails silently
8. Orchestrator continues without a working database
9. Features are implemented but no tables exist in the database

## Expected Behavior

1. Database credentials should be valid and connect successfully
2. Database operations (reset, seed) should succeed
3. Tables should be created in the sandbox Supabase project
4. Dev server preview should have a working database backend

## Actual Behavior

1. Database credentials in `.env` are invalid (password authentication fails)
2. Database operations fail silently due to error handling that returns `true`
3. No tables are created
4. Dev server preview has no database tables

## Diagnostic Data

### Connection Test

```
psql "postgresql://postgres.kdjbbhjgogqywtlctlzq:on30Vj3F9BYNQpid@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

Error: FATAL: password authentication failed for user "postgres"
```

### API Keys Mismatch

The `.env` file contains old/placeholder values that don't match the actual Supabase project:

| Credential | .env Value | Actual Supabase Value |
|------------|------------|----------------------|
| anon_key | `sb_publishable_ABGb...` | `eyJhbGciOiJIUzI1NiI...` (JWT format) |
| service_role_key | `sb_secret_4c5Hh...` | `eyJhbGciOiJIUzI1NiI...` (JWT format) |
| db_password | `on30Vj3F9BYNQpid` | **Unknown - needs retrieval from Supabase Dashboard** |

### .env File Format Issue

The `.env` file has inconsistent formatting with leading spaces on some lines:

```
Line 20: "  SUPABASE_SANDBOX_DB_URL=postgresql://..."
                                     ^^ Leading spaces
```

While the `loadEnvFile()` function in the orchestrator handles this with `.trim()`, it's a potential source of confusion.

## Error Stack Traces

No stack traces are generated because errors are silently caught:

```typescript
// database.ts line 91-94
} catch {
  // psql might not be installed locally - that's OK, we'll check in sandbox
  log("   ℹ️ Could not check database size locally (psql not available)");
  return true;  // <-- Silent failure, returns success!
}
```

## Related Code

- **Affected Files**:
  - `.env` (line 20) - Invalid `SUPABASE_SANDBOX_DB_URL`
  - `.env` (lines 16-19) - Invalid API keys
  - `.ai/alpha/scripts/lib/database.ts` - Silent error handling
  - `.ai/alpha/scripts/lib/orchestrator.ts` (lines 931-952) - Database operation flow

- **Suspected Functions**:
  - `checkDatabaseCapacity()` - Silently catches psql errors
  - `resetSandboxDatabase()` - Also likely fails silently
  - `seedSandboxDatabase()` - Also likely fails silently

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `.env` file contains invalid/placeholder Supabase credentials for the sandbox project, and the orchestrator's error handling masks connection failures.

**Detailed Explanation**:

Two issues combine to cause this bug:

1. **Invalid Credentials**: The Supabase sandbox project credentials in `.env` are either:
   - Placeholder values that were never updated with real credentials
   - Old values from when the project was first created that have since been rotated
   - The database password `on30Vj3F9BYNQpid` does not authenticate

2. **Silent Failure**: The database operations catch all errors and return `true`:
   ```typescript
   // database.ts:91-94
   } catch {
     log("   ℹ️ Could not check database size locally (psql not available)");
     return true;  // Treats failure as success!
   }
   ```
   This was intended to handle "psql not installed" but catches ALL errors including authentication failures.

**Supporting Evidence**:
- Direct psql connection fails: `FATAL: password authentication failed`
- API keys from `supabase projects api-keys` don't match `.env` values
- No tables visible in Supabase Studio for the project

### How This Causes the Observed Behavior

1. Orchestrator starts → loads `.env` with invalid credentials
2. `checkDatabaseCapacity()` attempts psql connection → fails with auth error
3. Catch block logs "psql not available" and returns `true`
4. `resetSandboxDatabase()` attempts psql → fails → silently returns
5. `seedSandboxDatabase()` via sandbox attempts connection → fails → silently returns
6. Orchestrator proceeds thinking database is ready
7. Features implement without database → no tables created
8. Preview URL has no working database

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct connection test proves password is invalid
- API key comparison proves credentials are outdated
- Error handling code clearly shows silent failure pattern
- No tables visible in Supabase Studio confirms no database operations succeeded

## Fix Approach (High-Level)

**Two fixes required:**

1. **Update `.env` with correct credentials**:
   - Get actual database password from Supabase Dashboard → Project Settings → Database
   - Get actual API keys from Supabase Dashboard → Project Settings → API
   - Update all `SUPABASE_SANDBOX_*` values in `.env`

2. **Improve error handling in database.ts**:
   - Distinguish between "psql not installed" and "connection failed"
   - Log actual error message for debugging
   - Consider failing loudly on auth errors rather than continuing

```typescript
// Improved error handling
} catch (error) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  if (errorMsg.includes('password authentication failed')) {
    error(`❌ Database authentication failed. Check SUPABASE_SANDBOX_DB_URL in .env`);
    return false;  // Actually fail!
  }
  // Only treat as non-blocking if psql genuinely not found
  log("   ℹ️ Could not check database size locally (psql not available)");
  return true;
}
```

## Diagnosis Determination

The sandbox Supabase database was never created because:
1. The credentials in `.env` are invalid/outdated
2. The orchestrator's error handling masks connection failures
3. Database operations silently fail and the orchestrator continues without a working database

The fix requires updating the credentials and improving error handling to catch authentication failures explicitly.

## Additional Context

This affects two use cases:
1. **E2B Dev Server Preview**: Cannot function without a database for human-in-the-loop review
2. **Spec 1362 Activity Tracking Feature**: Cannot create new database tables via migrations when there's no working database connection

The credentials issue likely occurred when:
- The slideheroes-alpha-sandbox project was created (2026-01-08)
- Placeholder values were added to `.env`
- Real credentials were never updated OR were rotated by Supabase

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (psql, supabase CLI), Read, Grep, file analysis*
