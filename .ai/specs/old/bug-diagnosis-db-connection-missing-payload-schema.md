# Bug Diagnosis: Database Connection Fails Due to Missing Payload Schema

**ID**: ISSUE-692
**Created**: 2025-11-25T17:45:00Z
**Reporter**: system (test infrastructure)
**Severity**: high
**Status**: new
**Type**: error

## Summary

The test infrastructure fails during the `infrastructure_check` phase with a database connection failure. The root cause is that the Supabase PostgREST service cannot start properly because the `payload` schema is configured in `config.toml` but does not exist in the database. This prevents all E2E tests from running.

## Environment

- **Application Version**: dev branch (commit 0bfb1ffeb)
- **Environment**: development (local)
- **Node Version**: (WSL2)
- **Database**: PostgreSQL 17.6 via Supabase local
- **Supabase CLI**: v2.58.5
- **Last Working**: Unknown

## Reproduction Steps

1. Start Supabase with `pnpm supabase:web:start`
2. Run tests with `/test` command
3. Observe infrastructure check failure

## Expected Behavior

Supabase should start fully, including the PostgREST REST API, and tests should proceed to execution.

## Actual Behavior

- Database container starts and is healthy
- PostgREST container enters a retry loop, failing to build schema cache
- Test infrastructure reports `database: connection_failed`
- Tests abort before execution

## Diagnostic Data

### Console Output
```
[2025-11-25T17:39:44.325Z] ERROR: Failed to setup Web Supabase: Timeout waiting for Web Supabase startup after 121762ms (43 attempts)
[2025-11-25T17:39:50.672Z] ERROR: ⚠️ Some services failed to start properly:
[2025-11-25T17:39:50.672Z] ERROR:   ❌ supabase: not_running
[2025-11-25T17:39:50.672Z] ERROR:   ❌ database: connection_failed
[2025-11-25T17:39:50.672Z] ERROR:   ❌ testUsers: cannot_check
[2025-11-25T17:39:50.672Z] ERROR: ❌ Phase 'infrastructure_check' failed: Critical infrastructure services are not healthy
```

### PostgREST Container Logs (Root Cause Evidence)
```
25/Nov/2025:17:38:13 +0000: Failed to load the schema cache using db-schemas=public,storage,graphql_public,payload and db-extra-search-path=public,extensions,payload. {"code":"3F000","details":null,"hint":null,"message":"schema \"payload\" does not exist"}
25/Nov/2025:17:38:45 +0000: Attempting to reconnect to the database in 32 seconds...
25/Nov/2025:17:38:45 +0000: Successfully connected to PostgreSQL 17.6
25/Nov/2025:17:38:45 +0000: Failed to load the schema cache... {"code":"3F000"... "message":"schema \"payload\" does not exist"}
```

### Database Connection Test (Direct)
```sql
-- Direct psql connection succeeds:
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54522 -U postgres -d postgres -c "SELECT 1"
 connection_test
-----------------
               1
(1 row)
```

### Existing Schemas in Database
```
schema_name
--------------------
 _realtime
 auth
 extensions
 graphql
 graphql_public
 information_schema
 public
 storage
 supabase_functions
 vault
(15 rows)
```

Note: `payload` schema is **NOT** present.

### Supabase Configuration
```toml
# apps/web/supabase/config.toml
schemas = ["public", "storage", "graphql_public", "payload"]
extra_search_path = ["public", "extensions", "payload"]
```

### REST API Response
```json
{"code":"PGRST002","details":null,"hint":null,"message":"Could not query the database for the schema cache. Retrying."}
```

## Error Stack Traces

PostgREST error code `3F000` indicates: `invalid_schema_name` (schema does not exist)

## Related Code
- **Affected Files**:
  - `apps/web/supabase/config.toml:8-10` - Schema configuration
  - `.ai/ai_scripts/testing/infrastructure/` - Test infrastructure checks
- **Recent Changes**:
  - Supabase port change from 54321 to 54521 (commit abd362ceb)
  - E2E shard execution fixes (commits 0bfb1ffeb, 3ff466bef)
- **Suspected Functions**: PostgREST schema cache initialization

## Related Issues & Context

### Similar Symptoms
- #372 (CLOSED): "Payload E2E Tests: Database schema issue causing shard 7 failures" - Related to payload schema issues
- #549 (CLOSED): "Payload CMS Seeding: 5 Validation Errors Due to Missing Required Fields"

### Historical Context
The `payload` schema was historically created by Payload CMS migrations (see backup migrations in `apps/web/supabase/migrations/backup/`). These backup migrations contain `CREATE SCHEMA IF NOT EXISTS payload;` statements but are not being applied.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `payload` schema is referenced in `config.toml` but was never created in the database, causing PostgREST to fail schema cache initialization.

**Detailed Explanation**:
1. `apps/web/supabase/config.toml` configures PostgREST to expose schemas: `["public", "storage", "graphql_public", "payload"]`
2. When PostgREST starts, it attempts to build a schema cache by querying all configured schemas
3. The `payload` schema does not exist in the database (confirmed by `information_schema.schemata` query)
4. PostgREST fails with error code `3F000` ("schema \"payload\" does not exist")
5. PostgREST enters a retry loop, never becoming healthy
6. Test infrastructure health checks detect PostgREST as unhealthy
7. Tests abort with "database: connection_failed"

**Supporting Evidence**:
1. PostgREST logs explicitly show: `"message":"schema \"payload\" does not exist"`
2. Database schema query confirms `payload` not in schema list
3. Backup migrations in `apps/web/supabase/migrations/backup/` contain `CREATE SCHEMA IF NOT EXISTS payload;` but are not applied
4. Direct psql connection works, proving the database itself is healthy
5. Docker shows `supabase_db` as healthy but `supabase_rest` returning 503

### How This Causes the Observed Behavior

1. User runs `/test` command
2. Test controller starts infrastructure check phase
3. Infrastructure check calls Supabase REST API endpoint
4. PostgREST returns 503 (service unavailable) because schema cache failed
5. Test controller marks `database: connection_failed`
6. Phase fails with "Critical infrastructure services are not healthy"
7. Tests abort without running

### Confidence Level

**Confidence**: High

**Reasoning**:
- PostgREST logs explicitly state the error message
- The configured schema (`payload`) is provably missing from the database
- Direct database connection works, isolating the issue to PostgREST
- Error code 3F000 is PostgreSQL's standard "schema does not exist" error

## Fix Approach (High-Level)

Two options:

**Option A (Recommended): Create the payload schema**
Add a migration or modify an existing schema file to create the `payload` schema:
```sql
CREATE SCHEMA IF NOT EXISTS payload;
```
Then apply with `pnpm supabase:web:reset` or `pnpm --filter web supabase migrations up`.

**Option B: Remove payload from config**
If Payload CMS is not being used, remove `payload` from the `schemas` and `extra_search_path` arrays in `config.toml`.

## Diagnosis Determination

The root cause is definitively identified: the `payload` schema is configured in Supabase but does not exist in the database. This is a configuration/migration gap, not a runtime bug. The fix requires either creating the schema or removing it from configuration.

## Additional Context

- The `supabase_pooler` container was also reported as stopped, but this is likely a secondary issue or normal behavior for local development
- Supabase CLI reports a newer version available (v2.62.5 vs installed v2.58.5)
- The test infrastructure correctly identifies unhealthy services but the error message "database: connection_failed" could be more specific

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (supabase status, docker ps, psql, docker logs, git log), Grep, Glob, Read*
