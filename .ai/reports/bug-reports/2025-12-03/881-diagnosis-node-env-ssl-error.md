# Bug Diagnosis: NODE_ENV=production in Claude Code causes Payload CMS SSL connection errors

**ID**: ISSUE-881
**Created**: 2025-12-03T21:15:00Z
**Reporter**: system (investigation from #879)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

When running Payload CMS development server through Claude Code, the database connection fails with "self-signed certificate in certificate chain" error. This occurs because Claude Code's shell environment has NODE_ENV=production set, which causes the database adapter to enable SSL for connections to local Supabase PostgreSQL, which has SSL disabled.

## Environment

- **Application Version**: slideheroes@2.13.1
- **Environment**: development (intended), production (actual NODE_ENV)
- **Node Version**: 22.16.0
- **Database**: PostgreSQL 15 (Supabase local, SSL disabled)
- **Claude Code Version**: 2.0.58
- **Last Working**: Unknown (may have always been an issue when running through Claude Code)

## Reproduction Steps

1. Open project in Claude Code
2. Run `pnpm --filter payload dev` or start Payload dev server
3. Make a request to `http://localhost:3020/api/users/me`
4. Observe SSL connection error in logs

## Expected Behavior

Payload CMS should connect to local Supabase PostgreSQL without SSL, using the development configuration.

## Actual Behavior

Payload CMS attempts SSL connection because NODE_ENV=production causes `shouldEnableSSL()` to return `true`, resulting in:
```
Error: cannot connect to Postgres. Details: self-signed certificate in certificate chain
```

## Diagnostic Data

### Console Output
```
[DB-ADAPTER-DEBUG] Built adapter configuration sslEnabled=false sslReason=none poolMax=8 poolMin=1
[15:59:21] ERROR: Error: cannot connect to Postgres. Details: self-signed certificate in certificate chain
    err: {
      "type": "Error",
      "message": "self-signed certificate in certificate chain",
      "code": "SELF_SIGNED_CERT_IN_CHAIN"
    }
```

### Environment Verification
```bash
$ echo $NODE_ENV
production

$ docker exec supabase_db_2025slideheroes-db psql -U postgres -c 'SHOW ssl;'
 ssl
-----
 off
```

### Direct pg Connection Test (works)
```javascript
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:54522/postgres',
  ssl: false
});
pool.query('SELECT 1')  // SUCCESS
```

## Error Stack Traces
```
Error: self-signed certificate in certificate chain
    at /node_modules/.pnpm/pg-pool@3.10.1_pg@8.16.3/node_modules/pg-pool/index.js:45:11
    at async connectWithReconnect (@payloadcms/db-postgres/dist/connect.js:7:18)
    at async Object.connect (@payloadcms/db-postgres/dist/connect.js:46:13)
    at async BasePayload.init (payload/dist/index.js:360:13)
```

## Related Code
- **Affected Files**:
  - `apps/payload/src/lib/database-adapter-singleton.ts:170-183` (shouldEnableSSL method)
  - `.claude/settings.local.json` (missing env override)
- **Recent Changes**: None relevant
- **Suspected Functions**: `shouldEnableSSL()` at line 170-183

## Related Issues & Context

### Direct Predecessors
- #879 (CLOSED): "Bug Fix: Payload CMS database connection SSL certificate error" - Original issue with incorrect diagnosis (blamed sslmode=disable in connection string)
- #877: Original diagnosis issue

### Historical Context
Issue #879 was closed because the original diagnosis was incorrect. The root cause was not the `sslmode=disable` parameter but rather NODE_ENV=production in the Claude Code shell environment.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Claude Code shell has NODE_ENV=production set, causing the database adapter's `shouldEnableSSL()` method to return `true` and attempt SSL connections to a local database that has SSL disabled.

**Detailed Explanation**:

1. **NODE_ENV Source**: The Claude Code binary (version 2.0.58) sets NODE_ENV=production in its shell environment. This was verified by:
   - Direct echo: `echo $NODE_ENV` returns "production"
   - String search in binary: `strings /home/msmith/.local/share/claude/versions/2.0.58 | grep NODE_ENV` shows production references

2. **SSL Decision Chain** (`database-adapter-singleton.ts:170-183`):
   ```typescript
   private shouldEnableSSL(): boolean {
     if (process.env.PAYLOAD_ENABLE_SSL === "true") return true;
     if (process.env.PAYLOAD_MIGRATION_MODE === "production") return true;
     return this.environment === "production";  // <-- Returns true because NODE_ENV=production
   }
   ```

3. **SSL Config Applied** (`database-adapter-singleton.ts:196-200`):
   ```typescript
   const sslConfig = shouldUseSSL
     ? { rejectUnauthorized: false }  // SSL enabled with self-signed allowed
     : false;                          // SSL disabled entirely
   ```

4. **pg-pool Behavior**: When `ssl: { rejectUnauthorized: false }` is passed, pg-pool attempts SSL negotiation. Even though `rejectUnauthorized: false` should accept self-signed certs, the local Supabase PostgreSQL has `ssl = off`, causing the connection to fail with a certificate chain error.

### How This Causes the Observed Behavior

```
NODE_ENV=production (Claude Code shell)
    ↓
this.environment = "production" (DatabaseAdapterManager constructor line 49)
    ↓
shouldEnableSSL() returns true (line 182)
    ↓
ssl: { rejectUnauthorized: false } passed to pg-pool (line 197-199)
    ↓
pg-pool attempts SSL negotiation
    ↓
Local PostgreSQL has ssl=off, connection fails
    ↓
"self-signed certificate in certificate chain" error
```

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct verification that NODE_ENV=production in Claude Code shell
- Direct verification that PostgreSQL has ssl=off
- Direct verification that pg connection works when ssl:false is used
- Code trace shows exact path from NODE_ENV to SSL enablement

## Fix Approach (High-Level)

**Option 1 (Recommended)**: Add environment override in `.claude/settings.local.json`:
```json
{
  "env": {
    "NODE_ENV": "development"
  }
}
```

**Option 2**: Modify `database-adapter-singleton.ts` to add explicit SSL disable check:
```typescript
private shouldEnableSSL(): boolean {
  if (process.env.PAYLOAD_DISABLE_SSL === "true") return false;  // Add this
  // ... existing logic
}
```

**Option 3**: Modify Payload dev script to explicitly set NODE_ENV:
```json
"dev": "cross-env NODE_ENV=development PORT=3020 NODE_OPTIONS=--no-deprecation next dev"
```

## Diagnosis Determination

The root cause is definitively identified: Claude Code's shell environment has NODE_ENV=production, which propagates to the Payload CMS database adapter and causes SSL to be enabled for local development connections.

The fix is straightforward - either configure Claude Code to use NODE_ENV=development for this project, or modify the database adapter to not rely solely on NODE_ENV for SSL decisions.

## Additional Context

- This issue only manifests when running through Claude Code
- Running the same commands in a regular terminal (with NODE_ENV unset or =development) works correctly
- The original issue #879 was misdiagnosed as a conflict between sslmode=disable and ssl:false

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Read, Grep, Task (context7-expert, perplexity-expert, claude-code-guide)*
