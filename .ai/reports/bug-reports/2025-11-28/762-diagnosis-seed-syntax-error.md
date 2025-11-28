# Bug Diagnosis: Syntax Error in Supabase Seed File (01_main_seed.sql)

**ID**: ISSUE-762
**Created**: 2025-11-28T19:02:00Z
**Reporter**: system (detected during /supabase-reset)
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Supabase seed file `01_main_seed.sql` contains invalid SQL syntax in the webhook trigger definitions. The `::jsonb` type cast is used incorrectly within `EXECUTE FUNCTION` arguments, causing the `supabase db reset` command to fail during the seeding phase. While database migrations complete successfully, the public schema seeding fails with "syntax error at or near '::'".

## Environment

- **Application Version**: 2.13.1
- **Environment**: development (local)
- **Supabase CLI Version**: 2.63.1
- **Node Version**: v22.x
- **Database**: PostgreSQL 15 (local Supabase)
- **Last Working**: Unknown (issue may have existed for some time but was unnoticed)

## Reproduction Steps

1. Run `pnpm supabase:web:reset` or `npx supabase db reset` from `apps/web`
2. Observe migrations complete successfully
3. Seeding step fails with syntax error

## Expected Behavior

The seed file should execute completely, creating test users, webhooks, testimonials, and other seed data in the public schema.

## Actual Behavior

Seeding fails with error:
```
failed to send batch: ERROR: syntax error at or near "::" (SQLSTATE 42601)
```

The error occurs during execution of the webhook trigger creation DO blocks.

## Diagnostic Data

### Console Output
```
Seeding data from supabase/seeds/01_main_seed.sql...
failed to send batch: ERROR: syntax error at or near "::" (SQLSTATE 42601)
```

### Debug Output (from --debug flag)
```json
{
  "Type": "ErrorResponse",
  "Severity": "ERROR",
  "Code": "42601",
  "Message": "syntax error at or near \"::\"",
  "InternalPosition": 400,
  "InternalQuery": "CREATE TRIGGER \"accounts_teardown\" \n            AFTER DELETE\n            ON \"public\".\"accounts\"\n            FOR EACH ROW\n            EXECUTE FUNCTION \"supabase_functions\".\"http_request\"(\n                'http://host.docker.internal:3000/api/db/webhook',\n                'POST',\n                '{\"Content-Type\":\"application/json\", \"X-Supabase-Event-Signature\":\"WEBHOOKSECRET\"}',\n                '{}'::jsonb,\n                '5000'\n            )",
  "Where": "PL/pgSQL function inline_code_block line 11 at EXECUTE"
}
```

### Network Analysis
N/A - Local database issue

### Database Analysis
- All migrations applied successfully (60 Payload tables created)
- Payload CMS seeding works correctly via separate seed engine
- Only public schema webhook triggers fail

### Performance Metrics
N/A - Syntax error, not performance issue

## Error Stack Traces
```
PL/pgSQL function inline_code_block line 11 at EXECUTE
SQLSTATE 42601: syntax error at or near "::"
```

## Related Code

- **Affected Files**:
  - `apps/web/supabase/seeds/01_main_seed.sql` (lines 27, 54, 81)

- **Recent Changes**:
  - `c5ddf7594` - fix(web): reorganize database seeds and fix kanban TypeScript types (Sep 18, 2025)
  - `98ba57b66` - refactor(e2e): remove duplicate Supabase infrastructure

- **Suspected Functions**:
  - `supabase_functions.http_request()` trigger function
  - DO $$ blocks creating webhook triggers (lines 9-32, 36-59, 63-86)

## Related Issues & Context

### Similar Infrastructure Issues
- #759 (CLOSED): "Bug Fix: Add Payload Schema to Supabase Migrations" - Related database reset infrastructure
- #758 (CLOSED): "Bug Diagnosis: /supabase-reset command does not create Payload tables" - Similar reset workflow issue

### Same Component
- #477 (CLOSED): "Integrate and debug payload seeding within supabase-reset command workflow"
- #343 (CLOSED): "[TASK] Create Supabase Database Reset Slash Command"

### Historical Context
This appears to be an existing issue that was previously unnoticed because:
1. Payload CMS seeding (the main use case) works via a separate TypeScript seed engine
2. The public schema seed data (webhooks, test users) was not frequently validated
3. Development workflow typically works despite this failure

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `::jsonb` type cast operator is incorrectly used within trigger function arguments, where only plain text strings are valid.

**Detailed Explanation**:

The `supabase_functions.http_request()` function is a trigger function that receives its arguments via `TG_ARGV` array. These arguments are **always** passed as text strings when defining a trigger:

```sql
-- From the function definition:
params jsonb DEFAULT '{}'::jsonb;
-- ...
IF TG_ARGV[3] IS NULL OR TG_ARGV[3] = 'null' THEN
  params = '{}'::jsonb;
ELSE
  params = TG_ARGV[3]::jsonb;  -- Function does the conversion internally
END IF;
```

The function itself handles the text-to-jsonb conversion using `TG_ARGV[3]::jsonb`. However, the seed file incorrectly includes the type cast in the trigger definition:

**Problematic Code** (line 27):
```sql
EXECUTE 'CREATE TRIGGER "accounts_teardown"
    AFTER DELETE ON "public"."accounts"
    FOR EACH ROW
    EXECUTE FUNCTION "supabase_functions"."http_request"(
        ''http://host.docker.internal:3000/api/db/webhook'',
        ''POST'',
        ''{"Content-Type":"application/json", "X-Supabase-Event-Signature":"WEBHOOKSECRET"}'',
        ''{}''::jsonb,   -- <-- INVALID: Can't use type cast in trigger args
        ''5000''
    )';
```

When this dynamic SQL is executed, PostgreSQL parses the `CREATE TRIGGER` statement and fails because trigger function arguments must be string literals, not typed expressions.

**Supporting Evidence**:
- Error position 400 in the internal query points exactly to `'{}'::jsonb`
- The `http_request` function signature shows it expects text arguments and does conversion internally
- Direct psql test of `''{}''::jsonb` works in regular DO blocks, but fails in EXECUTE context for trigger creation

### How This Causes the Observed Behavior

1. `supabase db reset` runs migrations successfully
2. Seeding phase executes `01_main_seed.sql`
3. First DO block (lines 9-32) attempts to create `accounts_teardown` trigger
4. The EXECUTE statement generates: `CREATE TRIGGER ... EXECUTE FUNCTION ... '{}'::jsonb ...`
5. PostgreSQL parser rejects `::jsonb` in trigger argument position
6. Batch fails, remaining seed statements are not executed

### Confidence Level

**Confidence**: High

**Reasoning**:
- Debug output shows exact error position matching the `::jsonb` cast
- PostgreSQL trigger syntax documentation confirms arguments must be "simple string constants"
- The `http_request` function source shows it already handles text-to-jsonb conversion

## Fix Approach (High-Level)

Remove the `::jsonb` type casts from all three webhook trigger definitions in `01_main_seed.sql`. The arguments should be plain string literals:

**Before** (line 27):
```sql
''{}''::jsonb,
```

**After**:
```sql
''{}'',
```

This fix needs to be applied at three locations:
- Line 27 (accounts_teardown trigger)
- Line 54 (subscriptions_delete trigger)
- Line 81 (invitations_insert trigger)

## Diagnosis Determination

The root cause is confirmed: invalid `::jsonb` type cast syntax in PostgreSQL trigger function arguments. The fix is straightforward - remove the type casts and pass plain string literals, as the `http_request` function already handles the conversion internally.

## Additional Context

- This bug does not block core development workflow since Payload CMS seeding uses a separate engine
- The affected webhook triggers are development-only and not used in production
- After fixing, test users, testimonials, and building_blocks_submissions will be properly seeded

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash (psql, supabase db reset --debug, git log, gh issue list), Write*
