# Remote Supabase Migration Plan

**Document Date:** April 15, 2025

## Overview

This document outlines the comprehensive plan for migrating our local Supabase database to the remote Supabase instance for the SlideHeroes application. We will focus on the data dump approach (Option A) as it provides the most reliable method to preserve data integrity, relationships, and UUIDs across environments.

## Architecture

```mermaid
flowchart TD
    A[Local Supabase DB] --> B[Schema Migration]
    A --> C[Data Dump]
    B --> D[Remote Supabase DB Schema]
    C --> E[Transform Dump]
    E --> F[Restore to Remote]
    F --> G[Run Relationship Fixes]
    G --> H[Verify Remote Database]
    H --> I[Test Application]

    subgraph Preparation
        J[Set Environment Variables]
        K[Create Helper Scripts]
        L[Test Remote Connection]
    end

    Preparation --> B
```

## 1. Preparation Phase

### 1.1 Required Environment Configuration

Create a new file at `scripts/orchestration/utils/remote-config.ps1`:

```powershell
# Remote migration configuration for Supabase

# Remote database connection
$REMOTE_DATABASE_URL = "postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"

# Set environment variables
$env:REMOTE_DATABASE_URL = $REMOTE_DATABASE_URL

# Remote flag to control script behavior
$IsRemoteMigration = $true

# Connection retry settings
$RemoteConnectionRetries = 3
$RemoteConnectionTimeout = 30
```

### 1.2 Remote Database Utilities

Add these helper functions to `scripts/orchestration/utils/supabase.ps1`:

```powershell
# Establish connection to remote Supabase
function Connect-RemoteSupabase {
    param (
        [string]$connectionString = $env:REMOTE_DATABASE_URL
    )

    Log-Message "Establishing connection to remote Supabase instance..." "Yellow"

    # Try to connect with retry logic
    $maxRetries = $RemoteConnectionRetries
    $retryCount = 0
    $success = $false

    while (-not $success -and $retryCount -lt $maxRetries) {
        try {
            if ($retryCount -gt 0) {
                Log-Message "Retry attempt $retryCount of $maxRetries..." "Yellow"
                Start-Sleep -Seconds (5 * $retryCount)
            }

            # Test connection
            $testConnection = Exec-Command -command "psql `"$connectionString`" -c `"SELECT 1`"" -description "Testing remote database connection" -captureOutput
            $success = $true
            Log-Success "Successfully connected to remote Supabase"
        }
        catch {
            $retryCount++
            Log-Warning "Connection attempt failed: $_"
        }
    }

    if (-not $success) {
        throw "Failed to connect to remote Supabase after $maxRetries attempts"
    }

    return $true
}

# Execute SQL against remote database
function Invoke-RemoteSql {
    param (
        [string]$sql,
        [string]$connectionString = $env:REMOTE_DATABASE_URL
    )

    try {
        $result = Exec-Command -command "psql `"$connectionString`" -c `"$sql`"" -description "Executing SQL on remote database" -captureOutput
        return $result
    }
    catch {
        Log-Error "Failed to execute SQL on remote database: $_"
        throw $_
    }
}
```

### 1.3 Connection Testing Script

Create a test script at `scripts/orchestration/remote-test/test-remote-connection.ps1`:

```powershell
# Test remote database connection
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"
. "$PSScriptRoot\..\utils\supabase.ps1"

# Initialize logging
Initialize-Logging -logPrefix "remote-test"

try {
    # Test connection
    if (Connect-RemoteSupabase) {
        Log-Success "Successfully connected to remote database"

        # Test a simple query
        $result = Invoke-RemoteSql -sql "SELECT schema_name FROM information_schema.schemata"
        Log-Message "Schemas found on remote database:" "Green"
        Log-Message $result "Gray"
    } else {
        Log-Error "Failed to connect to remote database"
    }
}
catch {
    Log-Error "Test failed: $_"
}
finally {
    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
```

## 2. Schema Migration Phase

### 2.1 Schema Migration Script

Create a schema migration script at the project root as `migrate-schema.ps1`:

```powershell
# PowerShell script to migrate schema to remote Supabase instance

param (
    [string]$RemoteDbUrl,
    [switch]$SkipDiff
)

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Import modules
. "$PSScriptRoot\scripts\orchestration\utils\path-management.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\logging.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\execution.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\remote-config.ps1"

# Initialize logging
Initialize-Logging -logPrefix "schema-migration"

try {
    # Check remote DB URL
    if (-not $RemoteDbUrl -and -not $env:REMOTE_DATABASE_URL) {
        throw "Remote database URL not provided. Use -RemoteDbUrl parameter or set REMOTE_DATABASE_URL environment variable."
    }

    $dbUrl = if ($RemoteDbUrl) { $RemoteDbUrl } else { $env:REMOTE_DATABASE_URL }

    # Navigate to web directory
    Set-ProjectRootLocation
    Push-Location -Path "apps/web"
    Log-Message "Changed directory to: $(Get-Location)" "Gray"

    # Phase 1: Create migration diff
    if (-not $SkipDiff) {
        Log-Phase "SCHEMA DIFF PHASE"
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $migrationName = "remote_migration_$timestamp"

        Log-Message "Generating schema diff..." "Yellow"
        Exec-Command -command "supabase db diff -f $migrationName" -description "Generating schema diff"

        Log-Message "Schema diff generated. Migration file created at: supabase/migrations/$migrationName.sql" "Green"
        Log-Message "Please review this file before pushing to remote database!" "Yellow"

        # Prompt user to continue
        $continue = Read-Host "Continue with pushing schema to remote? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Log-Message "Migration aborted by user" "Yellow"
            return
        }
    }

    # Phase 2: Push schema to remote
    Log-Phase "SCHEMA PUSH PHASE"
    Log-Message "Pushing schema to remote database..." "Yellow"
    Exec-Command -command "supabase db push --db-url `"$dbUrl`"" -description "Pushing schema to remote database"

    Log-Success "Schema successfully pushed to remote database"

    Pop-Location
    Log-Message "Returned to directory: $(Get-Location)" "Gray"
}
catch {
    Log-Error "CRITICAL ERROR: Schema migration failed: $_"
    exit 1
}
finally {
    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
```

### 2.2 Schema Migration Process

1. **Generate Migration Diff**:

   ```
   ./migrate-schema.ps1
   ```

   This will create a migration file based on differences between your local and an empty database.

2. **Review Migration File**:

   - Examine the generated migration file at `apps/web/supabase/migrations/remote_migration_[TIMESTAMP].sql`
   - Look for any issues related to:
     - UUID tables and their columns
     - Relationship tables
     - Default values and constraints
     - Sequence definitions

3. **Push Schema to Remote**:
   ```
   ./migrate-schema.ps1 -SkipDiff
   ```
   This will push all migration files to the remote database.

## 3. Data Migration Phase

### 3.1 Data Migration Script

Create a data migration script at the project root as `migrate-data.ps1`:

```powershell
# PowerShell script to migrate data to remote Supabase instance
# This assumes schema has been properly migrated

param (
    [switch]$SkipFixes,
    [switch]$SkipVerification
)

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Import modules
. "$PSScriptRoot\scripts\orchestration\utils\path-management.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\logging.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\execution.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\verification.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\supabase.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\remote-config.ps1"

# Global variables
$script:overallSuccess = $true
$script:dumpFile = Join-Path -Path $env:TEMP -ChildPath "slideheroes_data_dump.sql"

try {
    # Initialize logging
    Initialize-Logging -logPrefix "data-migration"

    # Phase 1: Verify remote connection and schema
    Log-Phase "REMOTE CONNECTION PHASE"
    if (-not (Connect-RemoteSupabase)) {
        throw "Failed to connect to remote Supabase instance"
    }

    # Check if schema exists on remote
    Log-Step "Verifying remote schema structure" 1
    # Check for payload schema
    $schemaExists = Invoke-RemoteSql -sql "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'payload')"
    if ($schemaExists -notcontains "t") {
        Log-Error "Payload schema not found on remote database"
        Log-Message "Please run migrate-schema.ps1 first to setup the schema" "Red"
        throw "Remote schema not setup properly"
    }
    Log-Success "Remote schema verification passed"

    # Phase 2: Create data dump
    Log-Phase "DATA DUMP PHASE"

    Log-Step "Creating data dump from local database" 2
    Set-ProjectRootLocation
    Push-Location -Path "apps/web"
    Log-Message "Changed directory to: $(Get-Location)" "Gray"

    # Create data-only dump with ordered tables
    Log-Message "Creating data-only dump from local database..." "Yellow"
    Exec-Command -command "supabase db dump --data-only > `"$script:dumpFile`"" -description "Creating data-only dump"

    # Check if dump file was created and has content
    if (-not (Test-Path -Path $script:dumpFile) -or (Get-Item -Path $script:dumpFile).Length -eq 0) {
        throw "Failed to create data dump or dump file is empty"
    }

    Log-Success "Data dump created successfully at: $script:dumpFile"

    # Phase 3: Apply data dump to remote
    Log-Phase "DATA RESTORE PHASE"

    Log-Step "Restoring data to remote database" 3

    # Apply dump file to remote database
    Log-Message "Applying data dump to remote database..." "Yellow"
    Exec-Command -command "psql `"$env:REMOTE_DATABASE_URL`" --set ON_ERROR=CONTINUE -f `"$script:dumpFile`"" -description "Applying data dump to remote database"

    Pop-Location
    Log-Message "Returned to directory: $(Get-Location)" "Gray"

    # Phase 4: Fix relationships on remote (if needed)
    if (-not $SkipFixes) {
        Log-Phase "RELATIONSHIP FIX PHASE"

        Log-Step "Fixing relationships on remote database" 4
        Set-ProjectRootLocation
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"

            # Temporarily set DATABASE_URI to remote
            $originalDatabaseUri = $env:DATABASE_URI
            $env:DATABASE_URI = $env:REMOTE_DATABASE_URL

            # Run fix scripts against remote database
            Log-Message "Running fix scripts against remote database..." "Yellow"

            # Fix UUID tables
            Log-Message "Fixing UUID tables on remote..." "Yellow"
            Exec-Command -command "pnpm run fix:uuid-tables" -description "Fixing UUID tables on remote" -continueOnError

            # Fix downloads relationships
            Log-Message "Fixing downloads relationships on remote..." "Yellow"
            Exec-Command -command "pnpm run fix:downloads-relationships" -description "Fixing downloads relationships on remote" -continueOnError

            # Fix post image relationships
            Log-Message "Fixing post image relationships on remote..." "Yellow"
            Exec-Command -command "pnpm run fix:post-image-relationships" -description "Fixing post image relationships on remote" -continueOnError

            # Fix Lexical format
            Log-Message "Fixing Lexical format on remote..." "Yellow"
            Exec-Command -command "pnpm run fix:lexical-format" -description "Fixing Lexical format on remote" -continueOnError
            Exec-Command -command "pnpm run fix:all-lexical-fields" -description "Fixing all Lexical fields on remote" -continueOnError

            # Restore original DATABASE_URI
            $env:DATABASE_URI = $originalDatabaseUri

            Pop-Location
            Log-Message "Returned to directory: $(Get-Location)" "Gray"
        } else {
            Log-Warning "Could not find packages/content-migrations directory, skipping relationship fixes"
        }
    }

    # Phase 5: Verify data integrity on remote
    if (-not $SkipVerification) {
        Log-Phase "VERIFICATION PHASE"

        Log-Step "Verifying data integrity on remote database" 5
        Set-ProjectRootLocation
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"

            # Temporarily set DATABASE_URI to remote
            $originalDatabaseUri = $env:DATABASE_URI
            $env:DATABASE_URI = $env:REMOTE_DATABASE_URL

            # Run verification scripts
            Log-Message "Running verification scripts against remote database..." "Yellow"
            $verificationResult = Exec-Command -command "pnpm run verify:all" -description "Verifying data integrity on remote" -captureOutput -continueOnError

            # Check for warnings or errors
            if ($verificationResult -match "Warning" -or $verificationResult -match "Error") {
                Log-Warning "Verification found issues on remote database"
                Log-Message "Please review the issues and run specific fix scripts if needed" "Yellow"
                $script:overallSuccess = $false
            } else {
                Log-Success "Verification passed with no issues on remote database"
            }

            # Verify posts content specifically
            Log-Message "Verifying posts content on remote..." "Yellow"
            Exec-Command -command "pnpm run verify:post-content" -description "Verifying posts content on remote" -continueOnError

            # Restore original DATABASE_URI
            $env:DATABASE_URI = $originalDatabaseUri

            Pop-Location
            Log-Message "Returned to directory: $(Get-Location)" "Gray"
        } else {
            Log-Warning "Could not find packages/content-migrations directory, skipping verification"
        }
    }

    # Cleanup
    if (Test-Path -Path $script:dumpFile) {
        Remove-Item -Path $script:dumpFile -Force
        Log-Message "Cleaned up temporary dump file" "Gray"
    }

    # Final success/failure message
    if ($script:overallSuccess) {
        Log-Success "Data migration completed successfully!"
    } else {
        Log-Warning "Data migration completed with warnings or errors. Please check the logs for details."
    }
}
catch {
    Log-Error "CRITICAL ERROR: Data migration failed: $_"
    Log-Message "Please check the log files for details:" "Red"
    Log-Message "  - Transcript log: $script:logFile" "Red"
    Log-Message "  - Detailed log: $script:detailedLogFile" "Red"

    # Stop transcript before exiting
    try {
        Stop-Transcript -ErrorAction SilentlyContinue
    }
    catch {
        Write-Host "Warning: Could not stop transcript: $_" -ForegroundColor Yellow
    }
    exit 1
}
finally {
    # Finalize logging
    Finalize-Logging -success $script:overallSuccess

    # Cleanup on exit
    if (Test-Path -Path $script:dumpFile) {
        Remove-Item -Path $script:dumpFile -Force -ErrorAction SilentlyContinue
    }
}
```

### 3.2 Data Migration Process

1. **Run Data Migration**:

   ```
   ./migrate-data.ps1
   ```

   This will:

   - Create a data dump from the local database
   - Apply the dump to the remote database
   - Run relationship fixes against the remote database
   - Verify data integrity on the remote database

2. **Expected Behavior**:
   - The script should handle transactions and continue on non-critical errors
   - The script will temporarily set environment variables to point to the remote database
   - Verification will check for common issues

## 4. Special Considerations

### 4.1 UUID Table Management

Our system has special handling for UUID tables generated by Payload CMS. These tables require:

- **Additional Columns**: `path` and `id` columns
- **Index Management**: Ensure indexes are correctly defined
- **Type Consistency**: TEXT type for UUID fields

The migration scripts address these by:

1. Running dedicated `fix:uuid-tables` script against the remote database
2. Adding required columns to any new UUID tables found
3. Setting up proper tracking of UUID tables

### 4.2 Downloads and Media Handling

Media files and downloads have special considerations:

1. **R2 Bucket References**:

   - Ensure remote environment has proper R2 bucket configuration
   - May require updating download URLs if using different domains

2. **Relationship Handling**:
   - Downloads have complex relationships with multiple collections
   - The `fix:downloads-relationships` script ensures these relationships are properly maintained

### 4.3 Rich Text Content (Lexical Format)

Lexical rich text format needs special handling:

1. **Format Consistency**:

   - Ensure proper JSON structure for all Lexical fields
   - Fix any formatting issues with `fix:lexical-format` and `fix:all-lexical-fields` scripts

2. **Post Content**:
   - Verify post content is complete using `verify:post-content` script

## 5. Testing Strategy

### 5.1 Incremental Testing

1. **Connection Testing**:

   - Run `scripts/orchestration/remote-test/test-remote-connection.ps1` to verify connectivity
   - Ensure proper credentials and permissions are set up

2. **Schema-Only Testing**:

   - Run `./migrate-schema.ps1` to test schema migration
   - Verify essential tables and columns exist in remote database

3. **Data Sample Testing**:

   - Create a limited data dump for specific tables
   - Test relationship fixes on a subset of the data

4. **Full Migration Testing**:
   - Perform complete data migration on a staging instance
   - Run comprehensive verification

### 5.2 Verification Checklist

- [ ] **Schema Structure**: All tables, views, and functions exist
- [ ] **Data Integrity**: All relationships are maintained
- [ ] **UUID Tables**: All UUID tables have required columns
- [ ] **Rich Text**: Lexical format is consistent
- [ ] **Downloads**: Downloads relationships are properly linked
- [ ] **Posts and Documentation**: Content is complete and formatted correctly

## 6. Execution Plan

### 6.1 Pre-Migration Tasks

1. **Set up environment**:

   - Configure environment variables
   - Create/update helper scripts

2. **Verify connectivity**:

   - Test connection to remote Supabase
   - Verify permissions and access

3. **Backup local database**:
   - Create a full backup of local database
   - Store in a safe location

### 6.2 Migration Execution

1. **Schema migration**:

   ```
   ./migrate-schema.ps1
   ```

2. **Data migration**:

   ```
   ./migrate-data.ps1
   ```

3. **Post-migration verification**:
   - Check logs for any warnings or errors
   - Run additional verification if needed

### 6.3 Post-Migration Tasks

1. **Test application**:

   - Configure application to use remote database
   - Test critical functionality

2. **Update documentation**:

   - Document any issues encountered
   - Update configuration references

3. **Monitor performance**:
   - Check for performance issues
   - Optimize queries if needed

## 7. Rollback Plan

If migration fails or critical issues are found:

1. **Schema Rollback**:

   - Reset the remote database schema
   - Re-run schema migration from a known good state

2. **Data Rollback**:

   - Keep a backup of the initial dump
   - Have a clean initial state ready to restore

3. **Partial Recovery**:
   - For non-critical issues, run specific fix scripts
   - Document all manual interventions

## 8. Conclusion

This migration plan uses a data dump approach to ensure all data, including complex relationships and UUID tables, are properly migrated to the remote Supabase instance. The process includes comprehensive verification and fixing steps to ensure data integrity.

By following this plan, we can reliably migrate our complex Payload CMS database to the remote Supabase instance while maintaining all relationships and content.
