# psql - Supabase Local Development Reference

**Purpose**: Essential psql commands and patterns for SlideHeroes local Supabase development, RLS testing, and database debugging.

**Related Files**:

- `apps/web/supabase/migrations/` - Database migrations
- `apps/web/supabase/schemas/` - Schema definitions
- `CLAUDE.md` - Database patterns and RLS guidelines

## Connecting to Local Supabase

```bash
# Start Supabase
supabase start

# Get connection details
supabase status

# Connect via Supabase CLI (recommended)
supabase db connect

# Connect manually
psql postgresql://postgres:postgres@localhost:54322/postgres

# Or with environment variables
export PGHOST=localhost
export PGPORT=54322
export PGUSER=postgres
export PGDATABASE=postgres
psql
```

**Default local Supabase port**: `54322` (not standard PostgreSQL 5432)

## Essential Meta-Commands

```sql
-- List tables in public schema
\dt public.*

-- Describe table structure (shows columns, indexes, RLS, policies)
\d public.accounts
\d+ public.accounts  -- Extended info

-- List all schemas (Supabase has many)
\dn

-- List functions
\df public.*
\df+ public.has_role_on_account  -- Show specific function

-- List policies on table
\d+ public.projects  -- Shows RLS policies

-- List indexes
\di public.*

-- List roles
\du

-- Show extensions
\dx

-- Toggle expanded output (useful for wide tables)
\x
\x auto  -- Auto-switch based on width

-- Enable query timing
\timing on

-- Quit
\q
```

## Supabase Schema Overview

```sql
-- Supabase local has these key schemas:
-- auth       - Authentication tables (users, sessions, etc.)
-- storage    - Storage buckets and objects
-- realtime   - Realtime subscriptions
-- public     - Your application tables
-- extensions - PostgreSQL extensions

-- Inspect auth tables
\dt auth.*
\d+ auth.users

-- Inspect storage
\dt storage.*
\d+ storage.buckets

-- Your app tables
\dt public.*
```

## Testing RLS Policies (Critical for Supabase)

### Basic RLS Testing

```sql
-- Connect as postgres
psql postgresql://postgres:postgres@localhost:54322/postgres

-- Grant roles to postgres for testing
GRANT anon, authenticated TO postgres;

-- Test as anonymous user
SET ROLE anon;
SELECT * FROM public.accounts;  -- Should be restricted
RESET ROLE;

-- Test as authenticated user
SET ROLE authenticated;
SELECT * FROM public.accounts;  -- Should see only authorized data
RESET ROLE;
```

### Testing with JWT Claims (Simulating Real Users)

```sql
-- Set role to authenticated
SET ROLE authenticated;

-- Set JWT claims to simulate a specific user
SET request.jwt.claim.sub = 'user-uuid-here';
SET request.jwt.claim.email = 'user@example.com';
SET request.jwt.claim.role = 'authenticated';

-- Query will execute as this user
SELECT * FROM public.accounts;
-- Should only see accounts this user has access to

-- Test with different user
SET request.jwt.claim.sub = 'different-user-uuid';
SELECT * FROM public.accounts;

-- Reset
RESET ROLE;
```

### Testing Custom Claims (RBAC)

For multi-tenant with custom roles:

```sql
SET ROLE authenticated;

-- Set full JWT claims including app_metadata
SET request.jwt.claims = '{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "app_metadata": {
    "account_id": "account-123",
    "user_role": "owner"
  }
}';

-- Your RLS policies can access these:
-- (current_setting('request.jwt.claims')::json->'app_metadata'->>'user_role') = 'owner'

SELECT * FROM public.projects WHERE account_id = 'account-123';

RESET ROLE;
```

### Helper Function for RLS Testing

Create this helper to quickly test as different users:

```sql
CREATE OR REPLACE PROCEDURE auth.login_as_user(user_email text)
LANGUAGE plpgsql AS $$
DECLARE
  auth_user auth.users;
BEGIN
  SELECT * INTO auth_user
  FROM auth.users
  WHERE email = user_email;

  EXECUTE format('SET request.jwt.claim.sub = %L', (auth_user).id::text);
  EXECUTE format('SET request.jwt.claim.role = %I', (auth_user).role);
  EXECUTE format('SET request.jwt.claim.email = %L', (auth_user).email);
  EXECUTE format('SET ROLE %I', (auth_user).role);
END;
$$;

-- Usage
CALL auth.login_as_user('user@example.com');
SELECT * FROM public.accounts;  -- Executes as this user
RESET ROLE;
```

## Testing Database Functions

```sql
-- Test function as specific user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid';

-- Call function
SELECT * FROM public.create_project('New Project', 'account-id');

-- Verify results
SELECT * FROM public.projects WHERE account_id = 'account-id';

RESET ROLE;
```

## Debugging RLS Policies

```sql
-- Check if RLS is enabled on table
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- List all policies on a table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'accounts';

-- Test what auth.uid() returns
SET ROLE authenticated;
SET request.jwt.claim.sub = 'test-user-uuid';
SELECT auth.uid();  -- Should return 'test-user-uuid'

-- Test policy expression directly
SELECT
  id,
  account_id,
  auth.uid() AS current_user,
  auth.uid() = account_id AS "should_see_row"
FROM public.account_users;

RESET ROLE;
```

## Performance Testing

```sql
-- Enable timing
\timing on

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM public.projects
WHERE account_id = 'account-uuid';

-- Test RLS performance impact
-- Without RLS (as postgres)
EXPLAIN ANALYZE SELECT * FROM public.projects;

-- With RLS (as authenticated user)
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid';
EXPLAIN ANALYZE SELECT * FROM public.projects;
RESET ROLE;

-- Check indexes
\d public.projects
```

## Testing Migrations in Transaction

```sql
-- Test migration safely
BEGIN;

-- Create table
CREATE TABLE public.presentations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can read own account presentations"
  ON public.presentations
  FOR SELECT
  TO authenticated
  USING (
    account_id IN (
      SELECT account_id FROM public.account_users
      WHERE user_id = auth.uid()
    )
  );

-- Test the policy
SET ROLE authenticated;
SET request.jwt.claim.sub = 'test-user-uuid';
SELECT * FROM public.presentations;
RESET ROLE;

-- If good, commit; otherwise rollback
ROLLBACK;
-- or
COMMIT;
```

## Running Migration Scripts

```bash
# Execute migration file
psql -h localhost -p 54322 -U postgres -d postgres -f migration.sql

# Execute with transaction (rollback on error)
psql -h localhost -p 54322 -U postgres -d postgres -1 -f migration.sql

# Stop on first error
psql -h localhost -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f migration.sql

# Quiet mode (only show errors)
psql -h localhost -p 54322 -U postgres -d postgres -q -f migration.sql
```

**Migration script template**:

```sql
-- migration.sql
\set ON_ERROR_STOP on

BEGIN;

-- Your changes
CREATE TABLE IF NOT EXISTS public.new_feature (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.new_feature ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT COUNT(*) FROM public.new_feature;

COMMIT;
```

## Common Inspection Patterns

### Quick Data Check

```sql
-- List all public tables
\dt public.*

-- Check table structure
\d+ public.accounts

-- Preview data
SELECT * FROM public.accounts LIMIT 5;

-- Check row counts
SELECT
  'accounts' AS table_name, COUNT(*) FROM public.accounts
UNION ALL
SELECT 'account_users', COUNT(*) FROM public.account_users
UNION ALL
SELECT 'projects', COUNT(*) FROM public.projects;
```

### Check RLS Configuration

```sql
-- Find tables without RLS enabled (potential security issue!)
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;

-- List all policies
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Verify Helper Functions Exist

```sql
-- Check if SlideHeroes helper functions exist
\df public.has_role_on_account
\df public.is_account_owner
\df auth.uid

-- Show function definition
\sf public.has_role_on_account
```

## Exporting Data

```bash
# Export to CSV
psql -h localhost -p 54322 -U postgres -d postgres \
  -c "SELECT * FROM public.users" --csv -o users.csv

# Export query results
psql -h localhost -p 54322 -U postgres -d postgres \
  -c "SELECT * FROM public.accounts WHERE created_at > '2025-01-01'" \
  --csv -o recent_accounts.csv
```

## Troubleshooting

### Connection Issues

```bash
# Check if Supabase is running
supabase status

# Start Supabase
supabase start

# Test connection
psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT 1"

# Check port availability
lsof -i :54322
```

### RLS Policy Issues

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'accounts';

-- Temporarily disable RLS for debugging (as postgres)
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
SELECT * FROM public.accounts;  -- Should see all data
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Test policy conditions
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid';
SELECT auth.uid();  -- Verify this returns expected UUID
SELECT * FROM public.accounts;
RESET ROLE;
```

### Permission Errors

```sql
-- Check current role
SELECT current_user, current_role;

-- Check role permissions
\du

-- Grant permissions (as postgres)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
```

### Function Not Found

```sql
-- Check if function exists
\df public.has_role_on_account

-- If missing, may need to run migration or seed
-- Check: apps/web/supabase/migrations/ and supabase/seed.sql
```

## Best Practices for SlideHeroes

### 1. Always Test RLS Policies

```sql
-- Before deploying any new table:
BEGIN;
  CREATE TABLE public.new_table (...);
  ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "..." ON public.new_table ...;

  -- TEST THE POLICY
  SET ROLE authenticated;
  SET request.jwt.claim.sub = 'test-uuid';
  SELECT * FROM public.new_table;  -- Should be restricted
  RESET ROLE;
COMMIT;
```

### 2. Use Transactions for Exploration

```sql
BEGIN;
  -- Try queries, test changes
  UPDATE public.accounts SET name = 'Test' WHERE id = '...';
  SELECT * FROM public.accounts;
ROLLBACK;  -- Discard all changes
```

### 3. Index RLS Filter Columns

```sql
-- RLS policies filter on these columns, so index them
CREATE INDEX idx_account_users_user_id ON public.account_users(user_id);
CREATE INDEX idx_account_users_account_id ON public.account_users(account_id);
CREATE INDEX idx_projects_account_id ON public.projects(account_id);
```

### 4. Enable Timing for Performance Checks

```sql
\timing on
SELECT * FROM public.projects WHERE account_id = '...';
-- Time: 15.234 ms
```

### 5. Use Expanded Output for Wide Tables

```sql
\x auto
SELECT * FROM auth.users LIMIT 1;
-- Automatically switches to vertical format
```

## Quick Reference

### Connection

```bash
# Local Supabase
supabase db connect

# Manual connection
psql postgresql://postgres:postgres@localhost:54322/postgres
```

### Most Used Commands

```sql
\dt public.*        -- List tables
\d public.accounts  -- Describe table (shows RLS policies!)
\df public.*        -- List functions
\x auto             -- Auto-expand wide results
\timing on          -- Show query execution time
\q                  -- Quit
```

### RLS Testing Pattern

```sql
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid';
SELECT * FROM public.accounts;  -- Test query
RESET ROLE;
```

### Check RLS Status

```sql
-- Tables without RLS (security issue!)
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;

-- List all policies
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public';
```

## Related Documentation

- **PostgreSQL psql**: https://www.postgresql.org/docs/current/app-psql.html
- **Supabase Local Development**: https://supabase.com/docs/guides/local-development
- **Supabase RLS**: https://supabase.com/docs/guides/database/postgres/row-level-security
- **Database Patterns**: `CLAUDE.md` - Database section
- **Migration Guide**: `.ai/ai_docs/context-docs/development/database-patterns.md`
