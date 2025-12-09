# Bug Diagnosis: Remote database reset does not create Payload CMS tables

**ID**: ISSUE-996
**Created**: 2025-12-09T12:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The `/supabase-seed-remote` slash command successfully runs Supabase migrations and seeds on the remote database, but does not create Payload CMS tables. This is because Payload tables are created by Payload's own migration system (`pnpm run payload migrate`), not by Supabase migrations. The remote reset command only runs `supabase db reset --linked`, which applies Supabase migrations but does not invoke Payload's migration runner.

## Environment

- **Application Version**: Current dev branch
- **Environment**: Remote Supabase (staging/development)
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase hosted)
- **Last Working**: N/A (feature never fully implemented)

## Reproduction Steps

1. Run `/supabase-seed-remote` command
2. Observe that Supabase migrations complete successfully
3. Check remote database - `payload` schema exists but is empty (no tables)
4. Payload CMS tables are not created

## Expected Behavior

After running `/supabase-seed-remote`:
- Supabase migrations should apply (creating `payload` schema)
- Payload CMS migrations should run (creating ~60 tables in `payload` schema)
- Payload CMS should be seeded with data (252 records)

## Actual Behavior

After running `/supabase-seed-remote`:
- Supabase migrations apply successfully
- `payload` schema is created (by migration `20250327_create_payload_schema.sql`)
- **No Payload tables are created** - schema is empty
- No Payload data is seeded

## Diagnostic Data

### Comparison: Local vs Remote Reset

**Local Reset (`/supabase-reset`)** - Working:
```
Phase 1: Validate environment
Phase 2: supabase db reset (creates payload schema)
Phase 3: pnpm run payload migrate  <-- RUNS PAYLOAD MIGRATIONS
Phase 4: pnpm run seed:run         <-- SEEDS PAYLOAD DATA
Phase 5: Verify database
```

**Remote Reset (`/supabase-seed-remote`)** - Missing Steps:
```
Step 1: supabase db dump (backup)
Step 2: supabase db reset --linked (creates payload schema)
Step 3: supabase migration list --linked (verify)
-- MISSING: Payload migrations
-- MISSING: Payload seeding
```

### Key Architectural Insight

Payload CMS uses its own migration system separate from Supabase:
- **Supabase migrations**: Located in `apps/web/supabase/migrations/`
- **Payload migrations**: Located in `apps/payload/src/migrations/`

The Supabase migration `20250327_create_payload_schema.sql` only creates the empty `payload` schema:
```sql
DROP SCHEMA IF EXISTS payload CASCADE;
CREATE SCHEMA payload;
```

The actual Payload tables are created by Payload's migration file `apps/payload/src/migrations/20251208_141121.ts`, which must be run via:
```bash
DATABASE_URI="<remote-connection-string>" pnpm run payload migrate
```

### Remote Database Connection Challenge

Running Payload migrations against remote database requires:
1. Getting the remote DATABASE_URI from Supabase
2. Running Payload's migration command with that connection string
3. Handling SSL requirements for remote connections

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `/supabase-seed-remote` command only runs Supabase CLI commands, but Payload tables are created by Payload's independent migration system which is never invoked.

**Detailed Explanation**:
The application uses two separate database migration systems:
1. **Supabase migrations** - Managed by `supabase db reset --linked`, creates the core schema and empty `payload` schema
2. **Payload migrations** - Managed by `pnpm run payload migrate`, creates all Payload CMS tables (~60 tables)

The local reset command (`/supabase-reset`) correctly runs both:
- Lines 224-239: Runs `pnpm run payload migrate --forceAcceptWarning`
- Lines 251-311: Runs `pnpm run seed:run`

The remote reset command (`/supabase-seed-remote`) only documents:
- `supabase db dump --linked` (backup)
- `supabase db reset --linked` (apply Supabase migrations)
- `supabase migration list --linked` (verify)

**It never runs Payload's migration or seeding commands.**

**Supporting Evidence**:
- Local command file: `.claude/commands/supabase-reset.md` lines 224-239 show Payload migrate step
- Remote command file: `.claude/commands/supabase-seed-remote.md` has no Payload migrate step
- Payload migration file exists: `apps/payload/src/migrations/20251208_141121.ts`
- Supabase migration only creates empty schema: `20250327_create_payload_schema.sql`

### How This Causes the Observed Behavior

1. User runs `/supabase-seed-remote`
2. `supabase db reset --linked` runs all Supabase migrations
3. Migration `20250327_create_payload_schema.sql` creates empty `payload` schema
4. Command completes without running `pnpm run payload migrate`
5. Result: `payload` schema exists but has no tables

### Confidence Level

**Confidence**: High

**Reasoning**: Direct comparison of the two command files shows the exact missing steps. The local command explicitly runs Payload migrations (lines 224-239) while the remote command documentation has no equivalent step.

## Fix Approach (High-Level)

Update `/supabase-seed-remote` to include:
1. **Get remote DATABASE_URI**: Either from environment variable or construct from Supabase project config
2. **Run Payload migrations**: `DATABASE_URI="<remote-uri>" pnpm run payload migrate --forceAcceptWarning`
3. **Run Payload seeding**: `DATABASE_URI="<remote-uri>" pnpm run seed:run`
4. **Add SSL handling**: Remote connections require `?sslmode=require` or similar

The implementation should mirror the local reset's Phase 3 and Phase 4, adapted for remote database connection.

## Diagnosis Determination

Root cause is definitively identified: The remote reset command is incomplete - it only runs Supabase migrations but does not invoke Payload's migration system or seeding. The fix requires adding Payload migrate and seed steps with proper remote database connection handling.

## Additional Context

- Remote DATABASE_URI format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
- SSL is required for remote connections
- The `--linked` flag in Supabase CLI indicates the project is linked to remote
- Payload migrations create ~60 tables with types, functions, and relationships

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, file comparison, architectural analysis*
