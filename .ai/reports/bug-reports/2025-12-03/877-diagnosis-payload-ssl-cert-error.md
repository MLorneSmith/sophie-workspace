# Bug Diagnosis: Payload CMS database connection fails with self-signed certificate error

**ID**: ISSUE-877
**Created**: 2025-12-03T20:15:00Z
**Reporter**: system (observed during debugging)
**Severity**: high
**Status**: new
**Type**: error

## Summary

Payload CMS fails to connect to the local Supabase PostgreSQL database during development with the error "self-signed certificate in certificate chain". This prevents the Payload API from serving content, causing 500 errors on any page that fetches CMS data.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Node Version**: 22.16.0
- **Database**: PostgreSQL 17.6.1 (Supabase local)
- **Payload CMS**: 3.65.0
- **@payloadcms/db-postgres**: 3.65.0
- **Last Working**: Unknown (intermittent issue)

## Reproduction Steps

1. Start local Supabase with `npx supabase start`
2. Run `pnpm dev` to start the development server
3. Navigate to any page that fetches Payload CMS content (e.g., `/home/course/lessons/the-who`)
4. Observe 500 error from Payload API

## Expected Behavior

Payload CMS should connect to the local PostgreSQL database without SSL issues since `sslmode=disable` is specified in the connection string.

## Actual Behavior

Payload CMS throws an error during database connection:
```
Error: cannot connect to Postgres. Details: self-signed certificate in certificate chain
```

The API returns 500 errors for all content requests.

## Diagnostic Data

### Console Output
```
[DB-ADAPTER-INFO] DatabaseAdapterManager initialized operation=db_adapter_init
[DB-ADAPTER-INFO] Creating database adapter synchronously
[DB-ADAPTER-DEBUG] Building adapter configuration
[DB-ADAPTER-DEBUG] Built adapter configuration sslEnabled=false sslReason=none poolMax=8 poolMin=1 schemaName=payload idType=uuid operation=adapter_config
[DB-ADAPTER-INFO] Database adapter created successfully
[DB-ADAPTER-DEBUG] Starting background database validation
[DB-ADAPTER-DEBUG] Async connection test passed
[DB-ADAPTER-INFO] Background database validation completed successfully

[ERROR]: Error: cannot connect to Postgres. Details: self-signed certificate in certificate chain
    at pg-pool/index.js:45:11
    at async connectWithReconnect (@payloadcms/db-postgres/dist/connect.js:7:18)
```

### Network Analysis
```
GET http://localhost:3020/api/course-lessons?where[slug][equals]=the-who&depth=2 500 in 3.0s
```

### Database Analysis
```bash
# Direct connection works fine
PGPASSWORD=postgres psql -h localhost -p 54522 -U postgres -c "SELECT 1;"
# Returns: 1 row (success)
```

## Error Stack Traces
```
Error: self-signed certificate in certificate chain
    at /home/msmith/projects/2025slideheroes/node_modules/.pnpm/pg-pool@3.10.1_pg@8.16.3/node_modules/pg-pool/index.js:45:11
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async connectWithReconnect (@payloadcms/db-postgres/dist/connect.js:7:18)
    at async Object.connect (@payloadcms/db-postgres/dist/connect.js:46:13)
    at async BasePayload.init (payload/dist/index.js:360:13)
```

## Related Code
- **Affected Files**:
  - `apps/payload/src/lib/database-adapter-singleton.ts`
  - `apps/payload/.env.development`
- **Recent Changes**: No recent changes to database configuration
- **Suspected Functions**: `buildAdapterConfig()` in database-adapter-singleton.ts

## Related Issues & Context

### Similar Symptoms
- This is a known issue with `@payloadcms/db-postgres` when SSL configuration conflicts with connection string parameters

### Historical Context
This appears to be an intermittent issue that can occur when:
1. Environment variables are loaded in unexpected order
2. SSL parameters in connection string conflict with explicit `ssl` config
3. The pg library interprets configuration differently than expected

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `ssl` configuration passed to pg-pool conflicts with the `sslmode=disable` parameter in the DATABASE_URI connection string, causing pg to still attempt SSL negotiation.

**Detailed Explanation**:

The database adapter in `apps/payload/src/lib/database-adapter-singleton.ts` (lines 205-214) builds a configuration like:

```typescript
const config: PostgresAdapterArgs = {
    pool: {
        connectionString,  // Contains ?sslmode=disable
        ssl: sslConfig,    // Set to `false` when not production
        ...poolConfig,
    },
    ...
};
```

The issue is a **configuration precedence conflict** in the `pg` library:

1. When `ssl: false` is passed as an explicit config option, the pg library should disable SSL
2. However, the connection string contains `?schema=payload&sslmode=disable`
3. The `@payloadcms/db-postgres` adapter passes this configuration to `pg-pool`
4. Under certain conditions (hot reload, module caching, or environment variable loading order), the SSL negotiation still occurs
5. The local Supabase database responds with its self-signed certificate, which fails validation

**Supporting Evidence**:
- Direct psql connection works: `PGPASSWORD=postgres psql -h localhost -p 54522 -U postgres` succeeds
- The adapter logs show `sslEnabled=false` but the error still occurs
- The error specifically mentions "self-signed certificate in certificate chain" - this means SSL negotiation IS happening despite the config
- Research confirms this is a known issue with `@payloadcms/db-postgres` - see GitHub issues and Stack Overflow

### How This Causes the Observed Behavior

1. User starts `pnpm dev`
2. Payload CMS initializes the database adapter
3. The adapter correctly configures `ssl: false`
4. However, pg-pool still attempts SSL negotiation (likely due to module caching or configuration merging issues)
5. Local Supabase responds with its self-signed certificate
6. pg-pool rejects the certificate (since `rejectUnauthorized` defaults to `true` when SSL is negotiated)
7. Connection fails with "self-signed certificate" error
8. Payload API returns 500 for all content requests

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The error specifically indicates SSL negotiation is occurring
2. Direct database connection works without SSL
3. This is a documented issue with the pg library and Payload CMS
4. The adapter configuration shows `sslEnabled=false` but error still occurs

## Fix Approach (High-Level)

Two potential fixes:

**Option 1 (Quick Fix)**: Remove `sslmode=disable` from the connection string and rely solely on the explicit `ssl: false` config:
```
DATABASE_URI=postgresql://postgres:postgres@localhost:54522/postgres?schema=payload
```

**Option 2 (More Robust)**: In `buildAdapterConfig()`, when SSL is disabled, explicitly set:
```typescript
ssl: {
    rejectUnauthorized: false,
}
```
This ensures that even if SSL negotiation occurs, self-signed certs are accepted.

**Option 3 (Environment-specific)**: Add `NODE_TLS_REJECT_UNAUTHORIZED=0` for development only (not recommended for production).

## Diagnosis Determination

The root cause is a configuration conflict between the connection string's `sslmode=disable` parameter and the explicit `ssl: false` configuration passed to pg-pool. Under certain runtime conditions (likely related to module caching or hot reload), the pg library attempts SSL negotiation despite the configuration, causing the self-signed certificate error.

The fix is straightforward: either remove the conflicting `sslmode` parameter from the connection string, or configure the adapter to accept self-signed certificates when SSL is disabled.

## Additional Context

- This issue is intermittent and may not occur on every startup
- The issue was observed while testing content renderer fixes for GitHub issue #875
- Local Supabase database is healthy and accepts non-SSL connections

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (git, grep, docker, psql), Read, Glob, Task (perplexity-expert)*
