# psql - PostgreSQL Interactive Terminal - Quick Reference

## Overview

psql is the PostgreSQL interactive terminal that provides command-line access to databases, enabling SQL execution, meta-command operations, and comprehensive database management. Essential for local Supabase development, testing RLS policies, and database administration.

## When to Use

- **Local Development**: Query and inspect Supabase databases during development
- **RLS Testing**: Simulate authenticated users and test row-level security policies
- **Schema Inspection**: Browse tables, functions, views, and database structure
- **Function Testing**: Execute and debug database functions with different roles
- **Data Migration**: Import/export data, run migration scripts
- **Performance Analysis**: Analyze query execution with `EXPLAIN ANALYZE`
- **Debugging**: Test SQL queries interactively before implementing in code

## Installation & Setup

### Check Installation

```bash
# Verify psql is installed (comes with PostgreSQL/Supabase)
psql --version

# For Supabase local development
supabase status  # Shows connection details
```

### Connection Methods

#### Method 1: Environment Variables

```bash
# Set connection defaults in shell
export PGHOST=localhost
export PGPORT=54322  # Supabase local default
export PGUSER=postgres
export PGDATABASE=postgres
export PGPASSWORD=postgres  # Not recommended for production

# Connect without parameters
psql
```

#### Method 2: Command-Line Options

```bash
# Standard connection
psql -h localhost -p 54322 -U postgres -d postgres

# Supabase local (typical)
psql postgresql://postgres:postgres@localhost:54322/postgres

# With SSL mode
psql "postgresql://user:pass@host:port/db?sslmode=require"
```

#### Method 3: Connection String

```bash
# URI format
psql postgresql://[user[:password]@][host][:port][/dbname][?param=value]

# Supabase local example
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

#### Method 4: Supabase CLI Helper

```bash
# Connect to local Supabase database
supabase db connect

# Or manually
psql -h localhost -p 54322 -U postgres -d postgres
```

## Core Meta-Commands

Meta-commands (backslash commands) provide database inspection and control. They do NOT require semicolons.

### Connection Management

```sql
-- Connect to different database
\c mydb
\connect mydb

-- Connect as different user
\c mydb myuser

-- Show current connection info
\conninfo

-- List all databases
\l
\list
\l+  -- With sizes and descriptions
```

### Schema Inspection (The \d Family)

```sql
-- Describe table structure (most used!)
\d table_name
\d+ table_name  -- Extended info (indexes, constraints, triggers)

-- List all tables
\dt
\dt *.*         -- All schemas
\dt public.*    -- Specific schema
\dt+            -- With sizes

-- List views
\dv
\dv+

-- List indexes
\di
\di+ table_name

-- List sequences
\ds
\ds+

-- List functions
\df
\df+ function_name
\df *.function_name  -- All schemas

-- List schemas
\dn
\dn+

-- List roles/users
\du
\du+

-- List foreign keys and constraints
\d+ table_name  -- Shows all constraints

-- List triggers
\dy

-- List extensions
\dx
\dx+ extension_name
```

### Query Execution

```sql
-- Execute query buffer
\g
SELECT * FROM users \g

-- Execute with expanded output (vertical)
\gx
SELECT * FROM users \gx

-- Execute and save to file
\g filename
\g |command     -- Pipe to command

-- Store results in variables
\gset
SELECT current_user AS user, current_database() AS db \gset
\echo :user :db

-- Show query result column info (no execution)
\gdesc
```

### Output Formatting

```sql
-- Toggle aligned/unaligned output
\a

-- Toggle expanded display (vertical vs horizontal)
\x
\x on
\x off
\x auto  -- Automatic based on width

-- Toggle tuples-only (no headers/footers)
\t

-- Toggle HTML output
\H

-- Set output format
\pset format aligned    -- Default table format
\pset format unaligned  -- No spacing
\pset format wrapped    -- Word wrap
\pset format csv        -- CSV (PostgreSQL 12+)
\pset format html       -- HTML table
\pset format latex      -- LaTeX tabular

-- Configure NULL display
\pset null '(null)'
\pset null 'NULL'

-- Set table border style (0-3)
\pset border 0  -- No borders
\pset border 1  -- Internal dividers
\pset border 2  -- Box around table (default)
\pset border 3  -- Double lines

-- Control pager
\pset pager on
\pset pager off
\pset pager always

-- Set field separator (unaligned mode)
\pset fieldsep ','
\pset fieldsep '\t'
```

### File Operations

```sql
-- Execute SQL from file
\i filename
\include filename
\ir filename  -- Relative to current script

-- Edit query buffer in $EDITOR
\e
\e filename

-- Edit function definition
\ef function_name

-- Edit view definition
\ev view_name

-- Write query buffer to file
\w filename

-- Redirect output to file
\o filename
SELECT * FROM users;
\o  -- Stop redirection

-- Redirect output to pipe
\o |less
SELECT * FROM large_table;
\o
```

### Variables

```sql
-- Set variable
\set myvar 'value'
\set debug 1

-- Use variable (colon prefix)
SELECT * FROM :myvar;
\echo :myvar

-- Unset variable
\unset myvar

-- Show all variables
\set

-- Check if variable exists
\if :{?myvar}
  \echo 'myvar is set'
\endif
```

### Help & Information

```sql
-- Help on meta-commands
\?

-- Help on SQL commands
\h
\h SELECT
\h CREATE TABLE

-- Show SQL command syntax
\h ALTER TABLE
```

### Timing & Performance

```sql
-- Toggle query execution timing
\timing
\timing on
\timing off

-- After enabling, all queries show execution time:
-- Time: 123.456 ms
```

### Copy Operations

```sql
-- Client-side COPY (psql reads/writes files)
\copy table FROM 'file.csv' CSV HEADER
\copy table TO 'file.csv' CSV HEADER
\copy (SELECT * FROM table WHERE ...) TO 'output.csv' CSV

-- Server-side COPY (PostgreSQL reads/writes files)
COPY table FROM '/path/to/file.csv' CSV HEADER;
COPY table TO '/path/to/file.csv' CSV HEADER;
```

### Transaction Control

```sql
-- Manual transaction
BEGIN;
INSERT INTO users (name) VALUES ('test');
ROLLBACK;  -- or COMMIT;

-- Show transaction status in prompt (see PROMPT variables)
```

## Command-Line Options

### Connection Options

```bash
-h, --host=HOSTNAME       # Database server host
-p, --port=PORT          # Database server port (default: 5432)
-U, --username=USERNAME   # Database user
-d, --dbname=DATABASE    # Database name
-W, --password           # Force password prompt
-w, --no-password        # Never prompt for password
```

### Input/Output Options

```bash
-c, --command=COMMAND    # Execute single command and exit
-f, --file=FILENAME      # Execute commands from file
-o, --output=FILENAME    # Send query results to file
-1, --single-transaction # Execute as single transaction (-c and -f)

# Examples
psql -c "SELECT * FROM users"
psql -f migration.sql
psql -c "SELECT * FROM users" -o output.txt
psql -f script1.sql -f script2.sql -1  # Single transaction
```

### Formatting Options

```bash
-A, --no-align           # Unaligned table output
-t, --tuples-only        # Print rows only (no headers)
-H, --html               # HTML output format
--csv                    # CSV output format (PostgreSQL 12+)
-x, --expanded           # Expanded table format
-F, --field-separator=SEP # Field separator (unaligned mode)
-P, --pset=VAR[=ARG]     # Set printing option

# Examples
psql -c "SELECT * FROM users" --csv
psql -c "SELECT * FROM users" -A -t -F ','  # CSV-like
psql -c "SELECT * FROM users" -H > users.html
psql -c "SELECT * FROM users" -x  # Vertical output
```

### Control Options

```bash
-X, --no-psqlrc          # Skip reading .psqlrc
-v, --set=VAR=VALUE      # Set psql variable
-V, --version            # Show version
--help                   # Show help
-q, --quiet              # Quiet mode
-s, --single-step        # Single-step mode (confirm each query)
-L, --log-file=FILENAME  # Log session to file

# Examples
psql -X  # Skip .psqlrc
psql -v myvar=value -c "SELECT :myvar"
psql -L session.log
psql -s -f dangerous-migration.sql  # Confirm each command
```

## Output Formatting Deep Dive

### CSV Output (PostgreSQL 12+)

```bash
# Command-line
psql --csv -c "SELECT * FROM users"

# In psql session
\pset format csv
SELECT * FROM users;

# With custom separator
psql --csv -P csv_fieldsep='|' -c "SELECT * FROM users"

# CSV with headers to file
psql -c "SELECT * FROM users" --csv -o users.csv

# CSV without headers
psql -c "SELECT * FROM users" --csv -t > users.csv
```

**Advantages of CSV format:**
- Properly escapes quotes and delimiters
- Handles newlines in data
- Standard CSV quoting rules
- Works with meta-commands (\l, \d) unlike COPY

### HTML Output

```bash
# Command-line
psql -H -c "SELECT * FROM users" > report.html

# In psql session
\H
SELECT * FROM users;
\H  -- Toggle off
```

### Aligned vs Unaligned

```bash
# Aligned (default) - pretty tables
 id | name  | email
----+-------+-------
  1 | Alice | a@ex
  2 | Bob   | b@ex

# Unaligned (-A) - no spacing
id|name|email
1|Alice|a@ex
2|Bob|b@ex

# Unaligned with custom separator
psql -A -F '\t' -c "SELECT * FROM users"
```

### Expanded Output

```bash
# Horizontal (default)
 id | name  | email
----+-------+-------
  1 | Alice | a@ex

# Expanded/Vertical (\x)
-[ RECORD 1 ]
id    | 1
name  | Alice
email | a@ex

# Automatic (switches based on terminal width)
\x auto
```

## psqlrc Configuration

The `~/.psqlrc` file customizes psql behavior. It executes on startup for interactive sessions.

### Essential Settings

```sql
-- ~/.psqlrc

-- Suppress output during startup
\set QUIET 1

-- Better error handling (rollback in interactive, error in scripts)
\set ON_ERROR_ROLLBACK interactive

-- Show query execution time
\timing

-- Automatic expanded output when needed
\x auto

-- Show NULL as (null) instead of empty
\pset null '(null)'

-- Better border style
\pset border 2

-- Format SQL keywords in uppercase on tab completion
\set COMP_KEYWORD_CASE upper

-- Preserve case when typed, else uppercase
-- \set COMP_KEYWORD_CASE preserve-upper

-- Verbose error messages
\set VERBOSITY verbose

-- Separate history per database
\set HISTFILE ~/.psql/history- :DBNAME

-- Don't store duplicate commands in history
\set HISTCONTROL ignoredups

-- Limit history size
\set HISTSIZE 10000

-- Better prompts (see next section)
\set PROMPT1 '%[%033[1;32m%]%n@%M:%>%[%033[0m%] %[%033[1;34m%]%/%[%033[0m%]%R%# '
\set PROMPT2 '%[%033[1;32m%]%n@%M:%>%[%033[0m%] %[%033[1;34m%]%/%[%033[0m%]%R%# '

-- Re-enable output after startup
\unset QUIET
```

### Custom Prompt Configuration

Prompts use special escape sequences:

| Code | Meaning |
|------|---------|
| `%n` | Username |
| `%M` | Full hostname (or `[local]` for Unix socket) |
| `%m` | Hostname up to first dot |
| `%>` | Port number |
| `%/` | Current database name |
| `%~` | Like `%/`, but `~` for default database |
| `%#` | `#` if superuser, else `>` |
| `%R` | Transaction state: `=` normal, `^` single-line mode, `!` disconnected, `*` in transaction, `!` in failed transaction |
| `%x` | Transaction status |
| `%?` | Error status of last query |
| `%[...%]` | Terminal escape sequences (colors) |

**Examples:**

```sql
-- Simple prompt: dbname=#
\set PROMPT1 '%/%R%# '

-- With username and host: user@host:5432 dbname=#
\set PROMPT1 '%n@%M:%> %/%R%# '

-- Colored prompt (green user, blue database)
\set PROMPT1 '%[%033[1;32m%]%n%[%033[0m%]@%M %[%033[1;34m%]%/%[%033[0m%]%R%# '

-- Show transaction state clearly
\set PROMPT1 '%n@%M:%> %/%R%x%# '
-- Normal: user@host:5432 dbname=#
-- In transaction: user@host:5432 dbname=*#
-- Failed transaction: user@host:5432 dbname=!#
```

**PROMPT1**: Main prompt (awaiting new command)
**PROMPT2**: Continuation prompt (multi-line query)
**PROMPT3**: COPY data input prompt

### Advanced psqlrc Features

```sql
-- Custom shortcuts/macros
\set rtsize 'SELECT table_schema, table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_schema)||\'.\'||quote_ident(table_name))) AS size FROM information_schema.tables WHERE table_type = \'BASE TABLE\' ORDER BY pg_total_relation_size(quote_ident(table_schema)||\'.\'||quote_ident(table_name)) DESC;'

-- Usage: :rtsize

-- Show table sizes
\set tsize 'SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) FROM information_schema.tables WHERE table_schema = \'public\' ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;'

-- Find blocking queries
\set blocking 'SELECT pid, usename, pg_blocking_pids(pid) as blocked_by, query as blocked_query FROM pg_stat_activity WHERE cardinality(pg_blocking_pids(pid)) > 0;'

-- Show active connections
\set connections 'SELECT datname, usename, application_name, client_addr, state, query FROM pg_stat_activity WHERE state != \'idle\' ORDER BY query_start DESC;'
```

### Conditional Configuration

```sql
-- Different settings for production
\if :HOST = 'prod-db.example.com'
  \set PROMPT1 '%[%033[1;31m%]PRODUCTION%[%033[0m%] %n@%M %/%R%# '
  \set AUTOCOMMIT off
\endif

-- Development settings
\if :HOST = 'localhost'
  \set PROMPT1 '%[%033[1;32m%]DEV%[%033[0m%] %/%R%# '
\endif
```

## Supabase Local Development Workflows

### Connecting to Local Supabase

```bash
# Start Supabase locally
supabase start

# Get connection details
supabase status
# Shows: DB URL: postgresql://postgres:postgres@localhost:54322/postgres

# Connect with psql
psql postgresql://postgres:postgres@localhost:54322/postgres

# Or use environment variables
export PGHOST=localhost
export PGPORT=54322
export PGUSER=postgres
export PGPASSWORD=postgres
export PGDATABASE=postgres
psql
```

### Common Supabase Commands

```sql
-- List all schemas (Supabase has many)
\dn

-- Common Supabase schemas
-- auth       - Authentication tables
-- storage    - Storage buckets
-- realtime   - Realtime subscriptions
-- public     - Your app tables
-- extensions - PostgreSQL extensions

-- List auth tables
\dt auth.*

-- Inspect users table
\d+ auth.users

-- List storage buckets
\dt storage.*
\d+ storage.buckets

-- List your app tables
\dt public.*

-- Show installed extensions
\dx
-- Common: uuid-ossp, pgcrypto, pgjwt, pgtap

-- List all functions (including RLS helpers)
\df public.*
\df auth.*

-- Show specific function
\df+ public.has_role_on_account
```

### Testing RLS Policies

Row-Level Security (RLS) is critical in Supabase. Test policies by switching roles and setting JWT claims.

#### Basic RLS Testing

```sql
-- Connect as postgres (bypass RLS)
psql postgresql://postgres:postgres@localhost:54322/postgres

-- Grant roles to postgres for testing
GRANT anon, authenticated TO postgres;

-- Test as anonymous user
SET ROLE anon;
SELECT * FROM public.profiles;  -- Should fail or return nothing
RESET ROLE;

-- Test as authenticated user
SET ROLE authenticated;
SELECT * FROM public.profiles;  -- Should see only own profile
RESET ROLE;
```

#### Testing with JWT Claims

Supabase uses JWT claims for user context. Simulate authenticated users:

```sql
-- Set role to authenticated
SET ROLE authenticated;

-- Set JWT claims for specific user
SET request.jwt.claim.sub = 'user-uuid-here';
SET request.jwt.claim.email = 'user@example.com';
SET request.jwt.claim.role = 'authenticated';

-- Now queries will execute as this user
SELECT * FROM public.profiles;
-- Should only see profile for user-uuid-here

-- Test with different user
SET request.jwt.claim.sub = 'different-user-uuid';
SELECT * FROM public.profiles;
-- Should see different results

-- Reset
RESET ROLE;
```

#### Advanced RLS Testing with Helper Function

Create a helper to simulate user login:

```sql
-- Create helper procedure (in psql)
CREATE OR REPLACE PROCEDURE auth.login_as_user(user_email text)
LANGUAGE plpgsql
AS $$
DECLARE
  auth_user auth.users;
BEGIN
  -- Get user details
  SELECT * INTO auth_user
  FROM auth.users
  WHERE email = user_email;

  -- Set JWT claims
  EXECUTE format('SET request.jwt.claim.sub = %L', (auth_user).id::text);
  EXECUTE format('SET request.jwt.claim.role = %I', (auth_user).role);
  EXECUTE format('SET request.jwt.claim.email = %L', (auth_user).email);

  -- Set full JWT claims as JSON
  EXECUTE format('SET request.jwt.claims = %L',
    json_strip_nulls(json_build_object(
      'sub', (auth_user).id::text,
      'email', (auth_user).email,
      'role', (auth_user).role,
      'app_metadata', (auth_user).raw_app_meta_data
    ))::text
  );

  -- Switch to user's role
  EXECUTE format('SET ROLE %I', (auth_user).role);
END;
$$;

-- Usage
CALL auth.login_as_user('user@example.com');
SELECT * FROM public.profiles;  -- Executes as user@example.com
RESET ROLE;
```

#### Testing Custom Claims (RBAC)

For role-based access control with custom claims:

```sql
-- Set role
SET ROLE authenticated;

-- Set custom claims (app_metadata)
SET request.jwt.claims = '{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "app_metadata": {
    "organization_id": "org-123",
    "user_role": "admin"
  }
}';

-- Your RLS policies can now access these claims
-- Policy example:
-- ((current_setting('request.jwt.claims')::json->'app_metadata'->>'user_role') = 'admin')

-- Test query
SELECT * FROM public.sensitive_data;
-- Should see data based on custom claims

RESET ROLE;
```

### Testing Database Functions

```sql
-- Test function as specific role
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid';

-- Call function
SELECT * FROM public.create_project('New Project');

-- Check results
SELECT * FROM public.projects WHERE created_by = 'user-uuid';

RESET ROLE;
```

### Performance Testing with EXPLAIN

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM public.projects
WHERE user_id = 'user-uuid';

-- Test RLS performance impact
-- Without RLS (as postgres)
EXPLAIN ANALYZE SELECT * FROM public.projects;

-- With RLS (as authenticated)
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid';
EXPLAIN ANALYZE SELECT * FROM public.projects;
RESET ROLE;

-- Compare execution times
```

### Migration Testing

```sql
-- Test migration in transaction
BEGIN;

-- Run migration commands
CREATE TABLE public.new_feature (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.new_feature ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can read own data"
  ON public.new_feature
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Test it
SET ROLE authenticated;
SET request.jwt.claim.sub = 'test-user-uuid';
SELECT * FROM public.new_feature;
RESET ROLE;

-- If good, commit; otherwise rollback
ROLLBACK;
-- or
COMMIT;
```

### Debugging RLS Policies

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- List all policies on a table
\d+ public.projects

-- Or query pg_policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'projects';

-- Test policy conditions
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid';

-- See what auth.uid() returns
SELECT auth.uid();

-- Test policy expression directly
SELECT
  id,
  user_id,
  auth.uid() = user_id AS "should_see_row"
FROM public.projects;

RESET ROLE;
```

## Scripting & Automation

### Running SQL Scripts

```bash
# Execute script
psql -f migration.sql

# Execute with transaction (rollback on error)
psql -1 -f migration.sql

# Execute multiple scripts in order
psql -f 001-schema.sql -f 002-seed.sql -f 003-policies.sql

# With connection details
psql -h localhost -p 54322 -U postgres -d postgres -f script.sql

# Stop on first error
psql -v ON_ERROR_STOP=1 -f script.sql

# Quiet output (only errors)
psql -q -f script.sql

# Log output
psql -f script.sql > output.log 2>&1
```

### Script Best Practices

```sql
-- migration.sql

-- Stop on errors
\set ON_ERROR_STOP on

-- Use transactions
BEGIN;

-- Your changes
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Verify
SELECT COUNT(*) FROM public.projects;

COMMIT;
```

### Conditional Scripts

```sql
-- Check if table exists before creating
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'projects') THEN
    CREATE TABLE public.projects (
      id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      name text NOT NULL
    );
  END IF;
END $$;

-- Using psql meta-commands
\set ON_ERROR_STOP on

-- Check PostgreSQL version
SELECT version();

-- Conditional execution based on result
\if :VERSION_NUM >= 120000
  \echo 'PostgreSQL 12+: Using CSV format'
  \pset format csv
\else
  \echo 'PostgreSQL <12: Using unaligned format'
  \pset format unaligned
\endif
```

### Variable Usage in Scripts

```bash
# Pass variables to script
psql -v table=users -v limit=100 -f query.sql
```

```sql
-- query.sql
SELECT * FROM :table LIMIT :limit;
```

### Generate Reports

```bash
# CSV report
psql -c "SELECT * FROM public.users" --csv -o users.csv

# HTML report
psql -c "SELECT * FROM public.users" -H -o report.html

# With header and formatting
psql <<EOF
\pset title 'User Report'
\pset footer on
SELECT id, name, email, created_at
FROM public.users
ORDER BY created_at DESC;
\g report.txt
EOF
```

### Backup & Restore

```bash
# Dump database (pg_dump, not psql, but commonly used together)
pg_dump -h localhost -p 54322 -U postgres postgres > backup.sql

# Restore database
psql -h localhost -p 54322 -U postgres postgres < backup.sql

# Dump specific table
pg_dump -h localhost -p 54322 -U postgres -t public.users postgres > users.sql

# Restore specific table
psql -h localhost -p 54322 -U postgres postgres < users.sql
```

## Advanced Features

### Variables & Interpolation

```sql
-- Set variables
\set myvar 'hello'
\set num 42

-- Use in queries
SELECT :'myvar' AS greeting, :num AS number;

-- Set from query results
SELECT current_database() AS db \gset
\echo Database: :db

-- Check if variable exists
\if :{?myvar}
  \echo 'myvar exists'
\endif

-- Unset variable
\unset myvar
```

### Conditional Execution

```sql
-- If/else blocks
\if :num > 10
  \echo 'Number is large'
\elif :num > 5
  \echo 'Number is medium'
\else
  \echo 'Number is small'
\endif

-- Execute commands based on conditions
\if :{?PRODUCTION}
  \set AUTOCOMMIT off
  \echo 'Production mode: autocommit disabled'
\else
  \echo 'Development mode'
\endif
```

### Shell Commands

```sql
-- Execute shell command
\! ls -la

-- Use output in psql (via backticks in variables)
\set today `date +%Y-%m-%d`
\echo Today is :today

-- Platform-specific
\! clear  -- Unix/Linux
\! cls    -- Windows
```

### Watch Queries

```bash
# Watch query (refresh every 2 seconds)
watch -n 2 'psql -c "SELECT * FROM public.active_users"'

# Or use \watch in psql (PostgreSQL 9.3+)
SELECT count(*) FROM public.users \watch 5
-- Executes every 5 seconds, Ctrl+C to stop
```

### Large Objects

```sql
-- Import file as large object
\lo_import '/path/to/file.pdf' 'My PDF'

-- List large objects
\lo_list

-- Export large object
\lo_export 12345 '/path/to/output.pdf'

-- Delete large object
\lo_unlink 12345
```

### Prepared Statements

```sql
-- Prepare statement
PREPARE user_query (int) AS
  SELECT * FROM public.users WHERE id = $1;

-- Execute
EXECUTE user_query(1);
EXECUTE user_query(2);

-- Deallocate
DEALLOCATE user_query;

-- Show prepared statements
SELECT name, statement FROM pg_prepared_statements;
```

## Best Practices

### Development Workflow

1. **Use transactions for exploration**:
   ```sql
   BEGIN;
   -- Try queries, inspect data
   ROLLBACK;  -- Discard changes
   ```

2. **Enable timing for performance insights**:
   ```sql
   \timing on
   SELECT * FROM large_table;
   ```

3. **Use expanded output for wide tables**:
   ```sql
   \x auto
   SELECT * FROM table_with_many_columns;
   ```

4. **Set NULL display for clarity**:
   ```sql
   \pset null '(null)'
   ```

5. **Separate history per database**:
   ```sql
   \set HISTFILE ~/.psql/history- :DBNAME
   ```

### Security Best Practices

1. **Never store passwords in scripts**:
   - Use `.pgpass` file or environment variables
   - Format: `hostname:port:database:username:password`

2. **Use SSL for remote connections**:
   ```bash
   psql "postgresql://user@host/db?sslmode=require"
   ```

3. **Test RLS policies thoroughly**:
   - Always test as different roles
   - Verify policies prevent unauthorized access
   - Check performance impact

4. **Disable autocommit in production psql sessions**:
   ```sql
   \set AUTOCOMMIT off
   ```

5. **Use `--no-psqlrc` for scripts**:
   ```bash
   psql -X -f migration.sql
   ```

### Performance Best Practices

1. **Use EXPLAIN ANALYZE for slow queries**:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM large_table WHERE condition;
   ```

2. **Index RLS filter columns**:
   ```sql
   CREATE INDEX idx_user_id ON public.projects(user_id);
   ```

3. **Monitor execution time with \timing**:
   ```sql
   \timing on
   -- Queries will show execution time
   ```

4. **Batch operations in transactions**:
   ```sql
   BEGIN;
   INSERT INTO table VALUES (1), (2), (3);
   COMMIT;
   ```

5. **Use COPY for bulk data**:
   ```sql
   \copy table FROM 'data.csv' CSV HEADER
   ```

### Scripting Best Practices

1. **Always set ON_ERROR_STOP**:
   ```sql
   \set ON_ERROR_STOP on
   ```

2. **Use transactions for migration scripts**:
   ```sql
   BEGIN;
   -- migrations
   COMMIT;
   ```

3. **Add verification queries**:
   ```sql
   -- After migration
   SELECT COUNT(*) FROM new_table;
   ```

4. **Skip .psqlrc in automation**:
   ```bash
   psql -X -f script.sql
   ```

5. **Pass variables for flexibility**:
   ```bash
   psql -v env=production -f deploy.sql
   ```

## Common Patterns

### Quick Data Inspection

```sql
-- Connect
psql postgresql://postgres:postgres@localhost:54322/postgres

-- List tables
\dt public.*

-- Peek at table
SELECT * FROM public.users LIMIT 5;

-- Check counts
SELECT
  'users' AS table, COUNT(*) FROM public.users
UNION ALL
SELECT 'projects', COUNT(*) FROM public.projects;

-- Disconnect
\q
```

### Testing New Feature

```sql
-- Start transaction
BEGIN;

-- Create table
CREATE TABLE public.new_feature (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.new_feature ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users see own data"
  ON public.new_feature
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Test as authenticated user
SET ROLE authenticated;
SET request.jwt.claim.sub = '123e4567-e89b-12d3-a456-426614174000';
SELECT * FROM public.new_feature;
RESET ROLE;

-- Rollback or commit
ROLLBACK;
```

### Debugging Query Performance

```sql
-- Enable timing
\timing on

-- Analyze query
EXPLAIN ANALYZE
SELECT p.*, u.name
FROM public.projects p
JOIN auth.users u ON p.user_id = u.id
WHERE p.status = 'active';

-- Check indexes
\d public.projects

-- Add index if needed
CREATE INDEX idx_projects_status ON public.projects(status);

-- Re-analyze
EXPLAIN ANALYZE
SELECT p.*, u.name
FROM public.projects p
JOIN auth.users u ON p.user_id = u.id
WHERE p.status = 'active';
```

### Exporting Data for Analysis

```bash
# CSV export
psql -c "SELECT * FROM public.users WHERE created_at > '2025-01-01'" --csv -o users.csv

# Multiple queries to separate files
psql <<EOF
\o users.csv
\pset format csv
SELECT * FROM public.users;
\o projects.csv
SELECT * FROM public.projects;
\o
EOF
```

## Troubleshooting

### Connection Issues

```bash
# Test connection
psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT 1"

# Check Supabase is running
supabase status

# Start Supabase if not running
supabase start

# Check PostgreSQL is listening
netstat -an | grep 54322
# or
lsof -i :54322

# Check environment variables
echo $PGHOST $PGPORT $PGUSER $PGDATABASE
```

### Permission Errors

```sql
-- Check current role
SELECT current_user, current_role;

-- Check role permissions
\du

-- Grant necessary permissions (as postgres)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Check table ownership
\dt+

-- Change ownership if needed
ALTER TABLE public.my_table OWNER TO postgres;
```

### RLS Policy Issues

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'projects';

-- List policies
\d+ public.projects

-- Test policy conditions
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid';
SELECT auth.uid();  -- Should return 'user-uuid'
SELECT * FROM public.projects;
RESET ROLE;

-- Temporarily disable RLS for debugging (as postgres)
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
-- Re-enable
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
```

### Output Formatting Issues

```sql
-- Reset formatting to defaults
\a  -- Aligned
\t  -- Headers on
\x off  -- Horizontal
\pset border 2
\pset null ''

-- Or start fresh session
\q
psql
```

### Script Execution Errors

```bash
# Run with verbose error output
psql -f script.sql --echo-errors

# Stop on first error
psql -v ON_ERROR_STOP=1 -f script.sql

# See what's being executed
psql -a -f script.sql  # Echo all input

# Skip .psqlrc that might interfere
psql -X -f script.sql
```

## Limitations & Considerations

### RLS Performance

- RLS policies add overhead to queries
- Index columns used in RLS filters (user_id, etc.)
- Test performance with large datasets
- Consider security definer functions for complex policies

### Transaction Behavior

- DDL commands (CREATE, ALTER) cannot be rolled back on all systems
- Some commands force transaction commit (VACUUM, CREATE DATABASE)
- Meta-commands are not transactional

### Output Limitations

- Large result sets can be slow to display
- Use LIMIT for exploration
- Redirect large outputs to files
- Use \watch carefully (can generate lots of output)

### Connection Limits

- PostgreSQL has max_connections limit
- Supabase local default: 200 connections
- Long-running psql sessions consume connections
- Close unused sessions

### Platform Differences

- Windows vs Unix path separators
- Shell command availability (\!)
- .psqlrc location (~/.psqlrc on Unix, %APPDATA%\postgresql\psqlrc.conf on Windows)
- Signal handling (Ctrl+C behavior)

## Quick Reference Cheat Sheet

### Connection
```bash
psql -h HOST -p PORT -U USER -d DATABASE
psql postgresql://USER:PASS@HOST:PORT/DATABASE
```

### Most Used Meta-Commands
```sql
\l          -- List databases
\c dbname   -- Connect to database
\dt         -- List tables
\d table    -- Describe table
\du         -- List roles
\df         -- List functions
\x          -- Toggle expanded output
\timing     -- Toggle timing
\q          -- Quit
\?          -- Help on meta-commands
\h COMMAND  -- Help on SQL command
```

### Output Formatting
```sql
\pset format [aligned|csv|html]
\pset null '(null)'
\x auto
\t          -- Toggle tuples-only
\o file     -- Redirect output
```

### File Operations
```sql
\i file.sql              -- Execute SQL file
\o file.txt              -- Redirect output
\copy table FROM 'file.csv' CSV HEADER
```

### Variables
```sql
\set var value           -- Set variable
\echo :var               -- Display variable
SELECT :'var';           -- Use in SQL
```

### RLS Testing (Supabase)
```sql
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid';
SELECT * FROM table;
RESET ROLE;
```

### Performance
```sql
\timing on
EXPLAIN ANALYZE SELECT * FROM table;
```

## Additional Resources

- Official PostgreSQL psql Documentation: https://www.postgresql.org/docs/current/app-psql.html
- Supabase Local Development: https://supabase.com/docs/guides/local-development
- Supabase RLS Documentation: https://supabase.com/docs/guides/database/postgres/row-level-security
- pgTAP Testing: https://supabase.com/docs/guides/local-development/testing/pgtap-extended
- PostgreSQL Wiki psqlrc: https://wiki.postgresql.org/wiki/Psqlrc
