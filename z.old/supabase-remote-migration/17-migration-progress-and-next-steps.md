# Supabase Remote Migration: Progress, Issues, and Next Steps

**Date:** April 16, 2025  
**Status:** In Progress

## Table of Contents

1. [Work Completed](#1-work-completed)
2. [Current Status](#2-current-status)
3. [Remaining Issues](#3-remaining-issues)
4. [Execution Plan](#4-execution-plan)
5. [Detailed Fix Plan](#5-detailed-fix-plan)

## 1. Work Completed

### 1.1. Root Cause Identification

We identified that the root cause of the migration failure was related to multiple issues:

1. **Missing Functions**: The `Invoke-LocalSql` function was referenced but wasn't defined in the database.ps1 utility file.
2. **Parameter Handling Issues**: PowerShell script parameter blocks were incorrectly positioned after code execution in some files.
3. **Schema Creation**: The script to initialize the Payload schema lacked proper SQL syntax and error handling.
4. **Migration Table**: The payload_migrations table wasn't being created or was inaccessible in the remote database.
5. **Error Handling**: Type conversion errors were occurring during migration record comparisons.

### 1.2. Implemented Fixes

1. **Database Utilities Improvement**:

   - Added the missing `Invoke-LocalSql` function to execute SQL against the local database
   - Enhanced the `Invoke-RemoteSql` function with direct PSQL support for better reliability
   - Added a `Test-DatabaseConnection` function for more robust connection verification

2. **PSQL Direct Approach**:

   - Created a simplified script (`create-payload-schema-simple.ps1`) for direct schema initialization
   - Fixed SQL syntax in `create-payload-schema-direct.sql` to include commas between column definitions
   - Added explicit creation of the payload_migrations table to track migrations

3. **Sync-Migrations Enhancement**:

   - Updated the sync-migrations.ps1 script to support remote-only mode when local database isn't available
   - Fixed parameter block positioning to be at the beginning of the script
   - Implemented better error handling for type conversions and database state verification
   - Added built-in fallbacks and user prompts for handling edge cases

4. **Remote Migration Structure**:
   - Improved the schema verification process to be more reliable
   - Enhanced the remote migration script to handle connection failures gracefully
   - Fixed the migration record comparison logic to handle different data types

## 2. Current Status

The migration process is now capable of:

1. **Schema Creation**: Successfully creating the payload schema in the remote database
2. **Table Initialization**: Creating the dynamic_uuid_tables and payload_migrations tables
3. **Connection Management**: Handling connection issues and providing helpful error messages
4. **Remote-Only Mode**: Running without a local database in forced mode

However, the migration still encounters issues during:

1. **UUID Tables Setup**: The setup-uuid-tables.ps1 script is encountering a param error
2. **Table Data Migration**: Schema pushes fail with errors about missing tables
3. **Schema Synchronization**: Complex synchronization scenarios need force flag but still fail in some cases

## 3. Remaining Issues

### 3.1. Parameter Order Errors

The `setup-uuid-tables.ps1` script has the same parameter ordering issue that we fixed in the `sync-migrations.ps1` file. The error message indicates:

```
ERROR: The term 'param' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
```

This is because the script is trying to interpret `param` as a command rather than a parameter block declaration because it's not at the beginning of the script.

### 3.2. UUID Table Utility Functions

The `setup-uuid-tables.ps1` imports a non-existent file called `uuid-tables.ps1`, which would contain utility functions such as:

- `Get-UUIDTables`
- `Ensure-UUIDTableColumns`
- `Track-UUIDTable`

These functions need to be implemented.

### 3.3. Schema Push Errors

During the schema push phase, the following error occurs:

```
ERROR: relation "payload.course_lessons__downloads" does not exist (SQLSTATE 42P01)
At statement 5:
alter table "payload"."course_lessons__downloads" add column "media_id" uuid
```

This indicates the migration is trying to alter tables that don't exist yet in the remote database.

## 4. Execution Plan

To complete the migration process, follow these steps:

1. **Fix UUID Tables Script**:

   ```powershell
   # Edit the setup-uuid-tables.ps1 file to fix parameter ordering
   # Create the missing uuid-tables.ps1 utility file
   ```

2. **Execute Direct Schema Creation**:

   ```powershell
   # Create the schema and required tables using our simplified script
   ./create-payload-schema-simple.ps1
   ```

3. **Run Migration Synchronization**:

   ```powershell
   # Force remote-only migration sync to initialize migration records
   $env:FORCE_REMOTE_ONLY="true"; .\supabase-remote-migration.ps1 -SyncOnly -Force
   ```

4. **Run Progressive Content Migration**:

   ```powershell
   # Migrate content progressively with forced settings
   $env:FORCE_REMOTE_ONLY="true"; .\supabase-remote-migration.ps1 -ProgressiveOnly -Force -SkipCore -SkipVerify
   ```

5. **Verify Migration**:
   ```powershell
   # Verify the content was migrated correctly
   $env:FORCE_REMOTE_ONLY="true"; .\supabase-remote-migration.ps1 -VerifyOnly
   ```

## 5. Detailed Fix Plan

### 5.1. Create UUID Tables Utility File

Create a new file at `scripts\orchestration\remote-migration\utils\uuid-tables.ps1` with the following content:

```powershell
# UUID Tables Utility Functions
# This module provides utilities for managing UUID tables

# Get all UUID tables from a database
function Get-UUIDTables {
    param (
        [string]$connectionString,
        [string]$schema = "payload"
    )

    $query = @"
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = '$schema'
    AND table_name ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$';
"@

    if ($connectionString -match "localhost") {
        $result = Invoke-LocalSql -query $query -captureOutput -continueOnError
    } else {
        $result = Invoke-RemoteSql -query $query -captureOutput -continueOnError
    }

    return $result -split "`n" | Where-Object { $_ -match '\S' } | ForEach-Object { $_.Trim() }
}

# Ensure UUID table has required columns
function Ensure-UUIDTableColumns {
    param (
        [string]$connectionString,
        [string]$schema,
        [string]$table
    )

    $query = @"
    DO \$\$
    BEGIN
        -- Check if path column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = '$schema'
            AND table_name = '$table'
            AND column_name = 'path'
        ) THEN
            EXECUTE 'ALTER TABLE $schema."$table" ADD COLUMN path TEXT';
        END IF;

        -- Check if id column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = '$schema'
            AND table_name = '$table'
            AND column_name = 'id'
        ) THEN
            EXECUTE 'ALTER TABLE $schema."$table" ADD COLUMN id TEXT';
        END IF;
    END
    \$\$;
"@

    if ($connectionString -match "localhost") {
        Invoke-LocalSql -query $query -continueOnError
    } else {
        Invoke-RemoteSql -query $query -continueOnError
    }
}

# Track a UUID table in the dynamic_uuid_tables tracking table
function Track-UUIDTable {
    param (
        [string]$connectionString,
        [string]$schema,
        [string]$table
    )

    $query = @"
    INSERT INTO $schema.dynamic_uuid_tables (uuid_table_name)
    VALUES ('$table')
    ON CONFLICT (uuid_table_name)
    DO UPDATE SET last_checked = NOW();
"@

    if ($connectionString -match "localhost") {
        Invoke-LocalSql -query $query -continueOnError
    } else {
        Invoke-RemoteSql -query $query -continueOnError
    }
}
```

### 5.2. Fix Parameter Order in UUID Tables Script

Update the `scripts\orchestration\remote-migration\setup-uuid-tables.ps1` file to move the parameter block to the beginning:

```powershell
# Parameters must be at the beginning of the script
param (
    [switch]$LocalOnly,
    [switch]$RemoteOnly,
    [switch]$SkipVerification,
    [switch]$Force,
    [switch]$Verbose
)

# UUID Tables Setup Script
# This script detects, manages, and sets up UUID tables which are dynamically created
# by Payload CMS for managing relationships between content types

# Import utility modules
. "$PSScriptRoot\utils\database.ps1"
. "$PSScriptRoot\utils\uuid-tables.ps1"

# Configure error handling
$ErrorActionPreference = "Stop"

# Rest of the script remains the same...
```

### 5.3. Fix Schema Push Approach

Create a function in `database.ps1` to handle the progressive table creation:

```powershell
# Create tables progressively based on schema definitions
function Create-SchemaTablesProgressively {
    param (
        [string]$connectionString,
        [string[]]$tables,
        [string]$schema = "payload"
    )

    foreach ($table in $tables) {
        # Check if table exists
        $checkQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = '$schema' AND table_name = '$table');"
        $exists = Invoke-RemoteSql -query $checkQuery -captureOutput -continueOnError

        if ($exists -notmatch "t") {
            # Create basic table structure
            $createQuery = @"
            CREATE TABLE IF NOT EXISTS $schema.$table (
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
"@
            Invoke-RemoteSql -query $createQuery -continueOnError
            Log-Success "Created base table: $schema.$table"
        }
    }
}
```

By implementing these fixes, we should be able to complete the migration process successfully.
