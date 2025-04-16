# Remote Supabase Migration System

This directory contains scripts for migrating data and schema from the local Supabase instance to the remote Supabase instance.

## Directory Structure

- `migrate-to-remote.ps1` - Main script that orchestrates the entire migration process
- `migrate-schema.ps1` - Script to migrate schema to remote Supabase instance
- `migrate-data.ps1` - Script to migrate data to remote Supabase instance
- `migrate-posts-data.ps1` - Script to specifically migrate posts data to remote Supabase instance
- `tests/` - Directory containing test scripts
  - `supabase-test.ps1` - Test script for Supabase connection
  - `test-remote-supabase.ps1` - Additional test script
  - `test-push-capability.ps1` - Test script for push capability
  - `simple-test.ps1` - Simple test script

## Usage

The main wrapper script `supabase-remote-migration.ps1` in the root directory can be used to run these scripts with various options:

```powershell
# Run full migration
./supabase-remote-migration.ps1

# Test connection
./supabase-remote-migration.ps1 -Test

# Migrate schema only
./supabase-remote-migration.ps1 -SchemaOnly

# Migrate data only
./supabase-remote-migration.ps1 -DataOnly

# Migrate posts data only
./supabase-remote-migration.ps1 -PostsOnly

# Skip schema diff generation
./supabase-remote-migration.ps1 -SkipDiff

# Skip relationship fixes
./supabase-remote-migration.ps1 -SkipFixes

# Skip verification steps
./supabase-remote-migration.ps1 -SkipVerify
```

## Workflow

1. First, run the test to verify connection:

   ```powershell
   ./supabase-remote-migration.ps1 -Test
   ```

2. Migrate schema:

   ```powershell
   ./supabase-remote-migration.ps1 -SchemaOnly
   ```

3. Migrate data:

   ```powershell
   ./supabase-remote-migration.ps1 -DataOnly
   ```

4. If posts data is missing, migrate posts specifically:
   ```powershell
   ./supabase-remote-migration.ps1 -PostsOnly
   ```

## Troubleshooting

If you encounter errors related to migration versions:

1. Pull the remote migration history:

   ```powershell
   supabase db pull
   ```

2. Repair the migration history if necessary:

   ```powershell
   supabase migration repair --status reverted <migration_id>
   ```

3. If specific data is missing, use the specialized migration scripts:
   ```powershell
   ./supabase-remote-migration.ps1 -PostsOnly
   ```
