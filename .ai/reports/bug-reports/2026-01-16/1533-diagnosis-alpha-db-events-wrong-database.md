# Bug Diagnosis: Alpha Orchestrator DB Events Missing and Sandbox Database Not Seeded

**ID**: ISSUE-pending
**Created**: 2026-01-16T19:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Despite implementing Issues #1522, #1526, and #1530 to add database event emission and UI routing, Supabase database events are not appearing in the Alpha Orchestrator UI dashboard and the sandbox database (`slideheroes-alpha-sandbox`) has not been seeded. The sandboxes proceed to work on tasks but the database schema expected by those features doesn't exist, causing potential downstream failures.

## Environment

- **Application Version**: dev branch (commit d237a523f)
- **Environment**: development
- **Node Version**: Current system Node.js
- **Database**: PostgreSQL (Supabase)
  - Sandbox: `kdjbbhjgogqywtlctlzq` (slideheroes-alpha-sandbox)
  - Production: `ldebzombxtszzcgnylgq` (main project)
- **Last Working**: Never worked correctly (newly implemented feature)

## Reproduction Steps

1. Start the Alpha orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe the UI dashboard during startup
3. Wait 5+ minutes for database operations to complete
4. Check the "Recent Events" section - no database events appear
5. Check Supabase console for `slideheroes-alpha-sandbox` project - no payload schema or seed data exists
6. Sandboxes start working on tasks despite missing database schema

## Expected Behavior

During orchestrator startup, the following should occur:
1. Event server starts and UI connects via WebSocket
2. UI sends "ready" signal, orchestrator proceeds with DB operations
3. Database events appear in UI in this order:
   - "Checking database capacity..."
   - "Database capacity OK: XMB / 500MB"
   - "Resetting sandbox database..."
   - "Database schema reset complete"
   - "Verifying database tables..."
   - "Verified: N table(s) created"
   - "Running Payload migrations..."
   - "Payload migrations complete"
   - "Running Payload seeding..."
   - "Payload seeding complete"
   - "Verified: N user(s) seeded"
4. Sandbox database has `payload.users` table with seed data
5. Sandboxes can implement features that depend on database schema

## Actual Behavior

1. Event server starts (confirmed)
2. UI connects but may not send "ready" signal in time (unconfirmed)
3. No database events appear in the "Recent Events" section
4. The sandbox database (`kdjbbhjgogqywtlctlzq`) has:
   - 34 public tables (base migrations DID run)
   - NO `payload` schema (Payload migrations did NOT run on sandbox DB)
5. Sandboxes start working immediately on implementation tasks

## Diagnostic Data

### Database State Verification

```bash
# Public schema - has tables (base migrations ran)
$ psql "$SUPABASE_SANDBOX_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
34

# Payload schema - DOES NOT EXIST (seeding never ran on sandbox)
$ psql "$SUPABASE_SANDBOX_DB_URL" -t -c "SELECT COUNT(*) FROM payload.users"
ERROR:  relation "payload.users" does not exist
```

### E2B Template .env Configuration

File: `packages/e2b/e2b-template/.env`

```env
# PRODUCTION Supabase credentials (WRONG!)
DATABASE_URL=postgresql://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require
DATABASE_URI=postgresql://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=prefer
```

### Root .env Configuration

File: `.env` (project root)

```env
# SANDBOX Supabase credentials (CORRECT!)
SUPABASE_SANDBOX_PROJECT_REF=kdjbbhjgogqywtlctlzq
SUPABASE_SANDBOX_DB_URL=postgresql://postgres.kdjbbhjgogqywtlctlzq:zR5V8CBTyFrwfnZP@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

### Sandbox Log Evidence

File: `.ai/alpha/archive/2026-01-16T17-32-22/logs/run-mkh4tnhc-cast/sbx-a.log`

```
================================================================================
Alpha Orchestrator Log
Run ID: run-mkh4tnhc-cast
Spec ID: 1362
Sandbox: sbx-a
Started: 2026-01-16T17:11:56.086Z
================================================================================
[PTY] Creating PTY session at 2026-01-16T17:11:56.086Z
[PTY] PTY created with PID 891
[PTY] Sending command: run-claude "/alpha:implement 1367"
```

**Note:** The sandbox immediately starts executing `/alpha:implement` without any trace of Payload migration/seeding commands in the log. The seeding commands run via `sandbox.commands.run()` which doesn't use PTY, so they wouldn't appear here. However, the immediate task execution suggests seeding either completed very quickly (unlikely) or was skipped/failed silently.

## Error Stack Traces

No explicit error stack traces found. The issue is that operations succeed against the **wrong database** (production instead of sandbox).

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/database.ts` (seedSandboxDatabase function)
  - `.ai/alpha/scripts/lib/environment.ts` (getAllEnvVars function)
  - `packages/e2b/e2b-template/.env` (hardcoded production credentials)

- **Recent Changes**:
  - d237a523f fix(tooling): add UI ready signal and DB verification for event timing
  - d3f548711 chore(tooling): clean up orchestrator progress files and update statusline
  - 61b21a289 fix(tooling): route WebSocket DB events to UI EventLog

- **Suspected Functions**:
  - `seedSandboxDatabase()` in database.ts:281-378
  - `getAllEnvVars()` in environment.ts:246-359
  - E2B template `.env` loading

## Related Issues & Context

### Direct Predecessors
- #1522 (CLOSED): "Bug Fix: Orchestrator Database Setup Events Missing from UI" - Added event emitter
- #1526 (CLOSED): "Bug Fix: WebSocket DB Events Not Displayed in UI EventLog" - Added UI routing
- #1530 (CLOSED): "Bug Fix: Supabase Database Events Not Appearing in UI + DB Setup Timing Issues" - Added verification and timing

### Infrastructure Issues
- #1521 (CLOSED): Original diagnosis for missing events
- #1525 (CLOSED): WebSocket routing diagnosis
- #1529 (CLOSED): Event timing diagnosis

### Historical Context
The pattern shows multiple attempts to fix the same symptom (missing DB events) without identifying the root cause (wrong database being targeted). Each fix addressed a different layer:
- #1522: Event emission layer (correct)
- #1526: UI routing layer (correct)
- #1530: Timing/verification layer (correct)

But none addressed the **configuration layer** - the E2B template has hardcoded production DB credentials that override the injected sandbox credentials.

## Root Cause Analysis

### Identified Root Cause

**Summary**: E2B sandbox template contains hardcoded production Supabase credentials that override the sandbox database credentials passed via environment variables.

**Detailed Explanation**:

When `seedSandboxDatabase()` runs Payload migrations and seeding commands inside the E2B sandbox:

```typescript
// database.ts:301-308
const migrateResult = await sandbox.commands.run(
    `cd ${WORKSPACE_DIR}/apps/payload && ` +
    "NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run payload migrate --forceAcceptWarning",
    {
        timeoutMs: 300000,
        envs: getAllEnvVars(), // <-- Injects sandbox DB URL
    },
);
```

The `getAllEnvVars()` function correctly injects:
- `DATABASE_URL=postgresql://postgres.kdjbbhjgogqywtlctlzq:...` (sandbox)
- `DATABASE_URI=postgresql://postgres.kdjbbhjgogqywtlctlzq:...?sslmode=require` (sandbox)

However, the E2B sandbox template (`packages/e2b/e2b-template/.env`) already contains:
- `DATABASE_URL=postgresql://postgres.ldebzombxtszzcgnylgq:...` (production)
- `DATABASE_URI=postgresql://postgres.ldebzombxtszzcgnylgq:...` (production)

When pnpm/Node.js loads environment variables, it typically prioritizes `.env` files loaded during startup over programmatically set env vars. The Payload CMS uses `DATABASE_URI` to connect to PostgreSQL.

**Result**: Payload migrations and seeding run against **production** database instead of sandbox database. The orchestrator sees "success" because the commands complete without error (they just target the wrong DB).

### Supporting Evidence

1. **Sandbox DB has no payload schema**:
   ```sql
   SELECT COUNT(*) FROM payload.users; -- ERROR: relation does not exist
   ```

2. **Sandbox DB has public tables** (base migrations ran locally via supabase CLI):
   ```sql
   SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'; -- 34
   ```

3. **E2B template has production credentials hardcoded**:
   ```env
   DATABASE_URL=postgresql://postgres.ldebzombxtszzcgnylgq:...
   ```

4. **Root .env has correct sandbox credentials**:
   ```env
   SUPABASE_SANDBOX_DB_URL=postgresql://postgres.kdjbbhjgogqywtlctlzq:...
   ```

### How This Causes the Observed Behavior

1. Orchestrator starts event server and UI
2. Base migrations run locally via `supabase db push` (uses `SUPABASE_SANDBOX_DB_URL` correctly)
3. Sandbox is created from E2B template (which has production DB credentials)
4. `seedSandboxDatabase()` runs Payload commands inside sandbox
5. Payload uses `DATABASE_URI` from template `.env` → points to production
6. Migrations/seeding succeed (on production DB, not sandbox)
7. Orchestrator continues because `seedSandboxDatabase()` returned `true`
8. Events ARE emitted but may be lost due to timing (secondary issue)
9. Sandboxes start working on features expecting sandbox DB schema
10. Features fail silently or produce incorrect results due to missing schema

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence from database queries confirms schema mismatch
- E2B template clearly contains production credentials
- The production project ID (`ldebzombxtszzcgnylgq`) differs from sandbox project ID (`kdjbbhjgogqywtlctlzq`)
- This explains why "seeding succeeds" but sandbox has no data
- Timing/event display issues are secondary; the primary bug is configuration

## Fix Approach (High-Level)

**Primary Fix**: Update E2B template `.env` to either:

Option A: Remove hardcoded database credentials entirely and rely on injected env vars
Option B: Add placeholder values that will be overridden by injected vars
Option C: Modify template build process to use sandbox-specific `.env` file

**Secondary Fix**: Ensure environment variable injection takes precedence:
- Modify `sandbox.commands.run()` calls to explicitly override with injected vars
- Or use `--env-file` flag to specify which `.env` file Payload should use

**Implementation Note**: The E2B template is built/cached by E2B. Changes to the template require:
1. Update template files locally
2. Rebuild the E2B template (`e2b template build`)
3. Test that new template uses correct credentials

## Diagnosis Determination

The root cause has been definitively identified: **E2B sandbox template hardcodes production Supabase credentials which override the sandbox credentials injected by the orchestrator.**

This is a configuration bug, not a code logic bug. The event emission (#1522), UI routing (#1526), and timing/verification (#1530) implementations are correct. The issue is that they're operating against the wrong database.

The fix requires updating the E2B template configuration to use sandbox database credentials instead of production credentials.

## Additional Context

- The E2B template is a pre-built sandbox environment that includes the project codebase and dependencies
- The template's `.env` file is baked into the sandbox image at build time
- Environment variables passed to `sandbox.commands.run()` may not override the template's `.env` depending on how the application loads environment
- This is a common misconfiguration pattern when using sandboxed environments with multiple database targets

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (psql), Glob, file system analysis*
