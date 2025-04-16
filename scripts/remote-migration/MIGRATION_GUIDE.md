# Remote Database Migration Guide

## Overview

This guide documents our approach to migrating content from the local development Supabase database to the remote production Supabase instance.

## Current Status

We've resolved several key issues with the remote migration process:

1. **Working Schema Creation**: We can successfully create the schema in the remote database using direct PSQL commands.
2. **Data Inspection**: We can inspect table structures and determine proper column data types.
3. **Data Insertion**: We can insert data directly into the remote database using properly formatted SQL.
4. **Error Handling**: We've identified common issues like data type mismatches and column name differences.

## Key Lessons Learned

1. **Column Names and Casing**: Remote and local database column names may differ in casing (e.g., "updatedAt" vs "updated_at"). Always quote column names in SQL to avoid issues.

2. **Data Types**:

   - The `id` column in the documentation table is an integer, not a string or UUID.
   - The `content` column is JSONB and requires properly formatted JSON strings.

3. **PSQL Direct Approach**: Using direct PSQL is more reliable than the Supabase CLI for data migration.

4. **PowerShell Syntax**: Handling redirect operators (`<`) in PowerShell requires using Get-Content and pipelines.

## Migration Scripts

1. **Simple Test Migration**: `simple-table-migration.ps1` - Tests migration for a single table, helping identify schema issues before mass migration.

2. **Schema Setup**: `setup-uuid-tables.ps1` - Sets up the UUID table management system and ensures required columns exist.

3. **Content Migration**: `migrate-content-progressive.ps1` - Progressively migrates content from local to remote in a reliable, verifiable way.

## Recommendations for Future Improvements

1. **Enhanced Migration Logging**: Improve logging to better track migration progress and issues.

2. **Dependency Handling**: Ensure tables are migrated in the correct order to handle foreign key constraints properly.

3. **Progressive Migration**: Continue using the progressive approach (migrating one content type at a time) with verified success between steps.

4. **Content Verification**: Always verify that migrated content is correct in the remote database, checking both row counts and data integrity.

5. **Error Recovery**: Implement robust error recovery mechanisms to handle partial failures.

## Usage Guide

### 1. Prepare the Environment

Ensure you have the correct environment variables set:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
$env:REMOTE_DATABASE_URL="postgres://postgres.ldebzombxtszzcgnylgq:password@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
```

### 2. Setup Remote Schema

```powershell
.\supabase-remote-migration.ps1 -PsqlSchema
```

### 3. Test Migration with a Single Table

```powershell
.\scripts\remote-migration\simple-table-migration.ps1 -table documentation
```

### 4. Migrate Core Data

```powershell
$env:FORCE_REMOTE_ONLY="true"; .\supabase-remote-migration.ps1 -ProgressiveOnly -SkipVerify
```

### 5. Verify Migration

```powershell
.\supabase-remote-migration.ps1 -VerifyOnly
```

## Troubleshooting

1. **Table doesn't exist errors**: Run the schema migration again to create missing tables.
2. **Column name errors**: Check the local and remote schema for differences in column names or casing.
3. **Data type errors**: Ensure data is formatted correctly for the respective column types.
4. **Permission errors**: Verify that your connection has the proper permissions in the remote database.
