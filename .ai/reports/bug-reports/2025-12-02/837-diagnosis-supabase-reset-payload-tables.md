# Bug Diagnosis: /supabase-reset Slash Command Fails to Create Payload Tables

**ID**: ISSUE-837
**Created**: 2025-12-02T15:05:00Z
**Reporter**: User
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The `/supabase-reset` slash command fails to create Payload CMS tables during the reset process. The Supabase database resets correctly and the `payload` schema is created, but the Payload migration that should populate the schema with 60 tables does not execute properly. This causes subsequent seeding operations to fail because the required tables don't exist.

## Environment

- **Application Version**: Payload 3.65.0
- **Environment**: development (local Supabase)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase local Docker)
- **Last Working**: Unknown

## Reproduction Steps

1. Run `/supabase-reset` slash command
2. Observe that Phase 2 (Supabase reset) completes successfully
3. Phase 3 (Payload migrations) appears to run but doesn't create tables
4. Phase 4 (Seeding) fails because tables don't exist

## Expected Behavior

After running `/supabase-reset`:
- The `payload` schema should contain 60 tables
- Seeding should complete with 252 records across 12 collections

## Actual Behavior

After running `/supabase-reset`:
- The `payload` schema exists but contains 0 tables
- Seeding fails because required tables are missing

## Diagnostic Data

### Manual Migration Test (SUCCESSFUL)
```bash
$ cd apps/payload
$ DATABASE_URI="postgresql://postgres:postgres@127.0.0.1:54522/postgres?sslmode=disable" \
  NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run payload migrate --forceAcceptWarning

[10:01:50] INFO: Reading migration files from /home/msmith/projects/2025slideheroes/apps/payload/src/migrations
[10:01:50] INFO: Migrating: 20251104_191046
[10:01:50] INFO: Migrated:  20251104_191046 (100ms)
[10:01:50] INFO: Done.
```

### Table Count After Manual Migration
```
table_count = 60 (correct)
```

### Database State Before Manual Fix
```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'payload';
-- Result: 0 tables
```

### Supabase Status
```
supabase local development setup is running.
Database URL: postgresql://postgres:postgres@127.0.0.1:54522/postgres
```

## Error Stack Traces

No explicit errors thrown - the migration appears to run but tables are not created when executed via slash command.

## Related Code

### Affected Files
- `.claude/commands/supabase-reset.md` (lines 159-241)
- `apps/payload/src/migrations/20251104_191046.ts`
- `apps/payload/src/lib/database-adapter-singleton.ts`

### Problematic Code Pattern

The slash command contains bash instructions structured as follows:

**Phase 2 (lines 177-187):**
```bash
# 2.5 Verify database connection
DATABASE_URL=$(npx supabase status | grep "DB URL" | awk '{print $3}')
```

**Phase 3 (lines 224-230):**
```bash
cd apps/payload
DATABASE_URI="$DATABASE_URL?sslmode=disable" NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run payload migrate --forceAcceptWarning
```

## Related Issues & Context

### Similar Symptoms
This is a new issue related to the architecture of slash command execution.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The slash command instructions assume bash environment variable persistence between separate tool calls, but each Claude Code `Bash` tool invocation runs in an independent shell session.

**Detailed Explanation**:

The `/supabase-reset.md` slash command contains bash code examples written as if they execute in a continuous shell session. The instructions show:

1. **Phase 2**: Capture `DATABASE_URL=$(npx supabase status | grep "DB URL" | awk '{print $3}')`
2. **Phase 3**: Use `$DATABASE_URL` in the migration command

However, when Claude Code interprets and executes these instructions:
- Each `Bash` tool call runs in a **new, independent shell process**
- Environment variables set in one tool call **do not persist** to subsequent calls
- When Phase 3 runs, `$DATABASE_URL` is **empty/undefined**
- The migration command receives no valid `DATABASE_URI`, causing it to either:
  - Use a default that doesn't connect properly
  - Silently fail to execute the migration
  - Connect to a different/incorrect database

**Supporting Evidence**:
1. Manual migration with explicit `DATABASE_URI` creates all 60 tables successfully
2. The migration file (`20251104_191046.ts`) contains valid SQL that works correctly
3. The Payload database adapter (`database-adapter-singleton.ts`) requires `DATABASE_URI` environment variable
4. Running migrations after slash command shows 0 tables, proving migrations didn't execute

### How This Causes the Observed Behavior

1. Slash command Phase 2 runs: `DATABASE_URL` is captured (but only exists in that bash session)
2. Slash command Phase 3 runs in a **new bash session**: `$DATABASE_URL` is undefined
3. Migration command receives empty/undefined `DATABASE_URI`
4. Payload CMS cannot connect to database or connects incorrectly
5. Migration does not execute (no tables created)
6. Phase 4 seeding fails because tables don't exist

### Confidence Level

**Confidence**: High

**Reasoning**:
- Manual execution with explicit DATABASE_URI works perfectly
- The same migration file creates all 60 tables
- The only difference is how the DATABASE_URI is passed
- This directly maps to the bash session isolation issue

## Fix Approach (High-Level)

The slash command needs to be restructured to handle the independent bash session nature of Claude Code tool calls. Options:

1. **Inline DATABASE_URL capture**: Modify Phase 3 to capture and use DATABASE_URL in the same command:
   ```bash
   cd apps/payload && \
   DATABASE_URI="$(cd ../apps/web && npx supabase status | grep 'DB URL' | awk '{print $3}')?sslmode=disable" \
   NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run payload migrate --forceAcceptWarning
   ```

2. **Use explicit instructions**: Add explicit notes in the slash command that Claude must pass the captured DATABASE_URL value to subsequent commands

3. **Create wrapper script**: Create a shell script (`.ai/ai_scripts/database/run-payload-migrations.sh`) that handles the full flow internally

4. **Hardcode local Supabase URL**: Since this is for local development, use the known Supabase URL directly:
   ```bash
   DATABASE_URI="postgresql://postgres:postgres@127.0.0.1:54522/postgres?sslmode=disable"
   ```

**Recommended approach**: Option 4 (hardcode) combined with Option 1 (inline capture as fallback) - the local Supabase URL is deterministic and can be safely hardcoded for the local reset workflow.

## Diagnosis Determination

The root cause has been conclusively identified: **bash environment variable isolation between Claude Code tool calls** prevents the `DATABASE_URL` captured in Phase 2 from being available in Phase 3.

The fix requires restructuring the slash command to either inline the URL capture or use a known static URL for local Supabase connections.

## Additional Context

- The Payload migration file (`20251104_191046.ts`) is 1000+ lines and correctly creates all required tables
- The database adapter uses `process.env.DATABASE_URI` which must be set when the migration runs
- Local Supabase always runs on predictable ports (54521-54527 range)

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Read, Glob, Grep, psql*
