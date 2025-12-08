# Context7 Research: Supabase Remote Database Reset & Migration Push

**Date**: 2025-12-08
**Agent**: context7-expert
**Libraries Researched**: supabase/cli

## Query Summary

Researched CLI commands and workflows for resetting remote Supabase databases and pushing migrations during active development, including options to completely rebuild remote database schemas.

## Findings

### 1. Remote Database Reset Commands

The Supabase CLI provides **two methods** to reset a remote database:

#### Method 1: Using --linked Flag (Recommended)

supabase db reset --linked

Prerequisites:
- Project must be linked: supabase link --project-ref project-ref
- Must be authenticated: supabase login

Behavior:
- Drops all tables and re-applies all local migrations from scratch
- Runs seed data from supabase/seed.sql (unless --no-seed specified)
- Uses migrations from supabase/migrations/ directory
- Completely rebuilds the remote database schema

Options:
- supabase db reset --linked --no-seed
- supabase db reset --linked --version 20240115120000
- supabase db reset --linked --last 3

#### Method 2: Using Direct Database URL

supabase db reset --db-url "postgresql://user:password@host:port/database?sslmode=require"

Important: Connection string must be percent-encoded (URL-encoded).

### 2. Migration Push Commands

#### Standard Push (Incremental)

supabase db push

Behavior:
- Applies only new migrations not found in remote history
- Safe for production use
- Non-destructive (doesn't drop existing data)

#### Push with --include-all Flag

supabase db push --include-all

Behavior:
- Includes all migrations not found on remote history table
- Useful when remote migration history is out of sync
- Does NOT drop existing schema - only adds missing migrations

Key Difference from Reset:
- db push --include-all: Applies missing migrations (additive)
- db reset --linked: Drops everything and rebuilds from scratch (destructive)

#### Additional Push Options

supabase db push --dry-run
supabase db push --include-roles
supabase db push --include-seed
supabase db push --include-all --include-seed --include-roles

### 3. Complete Remote Database Rebuild Workflow

Scenario: Completely rebuild a remote database during active development

Step 1: Ensure you are linked to the remote project
supabase link --project-ref your-project-ref

Step 2: (Optional) Verify current state
supabase migration list --linked

Step 3: Reset the remote database (DESTRUCTIVE)
supabase db reset --linked

Step 4: Verify the reset
supabase migration list --linked

Step 5: Generate TypeScript types
supabase gen types --linked > types/database.ts

Warning: This is DESTRUCTIVE and will:
- Drop all tables, functions, and policies
- Delete all data (unless you have backups)
- Re-apply all migrations from scratch
- Run seed scripts

### 4. Migration History Management

List Migrations:
- supabase migration list --local
- supabase migration list --linked

Repair Migration History:
- supabase migration repair 20240101120000 20240102120000 --status applied
- supabase migration repair 20240103120000 --status reverted

### 5. Pre-Reset Backup Strategies

Always backup before resetting:
- supabase db dump --linked -f backup-$(date +%Y%m%d).sql
- supabase db dump --linked --data-only -f data-backup-$(date +%Y%m%d).sql
- supabase db dump --linked --data-only --use-copy -f data-copy-$(date +%Y%m%d).sql

## Key Takeaways

1. supabase db reset --linked is the primary command for completely rebuilding remote databases during development
2. supabase db push --include-all applies missing migrations but doesn't drop existing schema
3. Always backup before using db reset on any environment with data
4. Use --dry-run with push commands to preview changes
5. Link your project first with supabase link --project-ref ref
6. Reset is DESTRUCTIVE - use only in development/staging environments
7. For production, use incremental db push without --include-all

## CLI Command Reference

### Reset Commands
- supabase db reset --linked - Reset linked remote database
- supabase db reset --linked --no-seed - Reset without seed data
- supabase db reset --linked --version version - Reset to specific version
- supabase db reset --db-url url - Reset using direct connection

### Push Commands
- supabase db push --dry-run - Preview changes
- supabase db push - Apply pending migrations
- supabase db push --include-all - Include all missing migrations
- supabase db push --include-seed - Include seed data
- supabase db push --include-roles - Include custom roles

### Utility Commands
- supabase migration list --linked - View remote migrations
- supabase db pull - Pull remote schema
- supabase db dump --linked -f backup.sql - Backup database
- supabase migration repair version --status applied - Fix history

## Sources

- supabase/cli via Context7 (official Supabase CLI documentation)
- CLI help output: supabase db reset --help, supabase db push --help
- https://context7.com/supabase/cli/llms.txt
