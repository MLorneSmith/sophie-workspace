# Immediate Supabase Migration Fixes

**Document Date:** April 15, 2025  
**Status:** Action Plan

## Urgent Issues Identified

Based on our analysis of the migration attempts and database inspection, we've identified several critical issues that need immediate attention:

1. **Path Navigation Problems**:

   - The progressive migration script can't find paths like 'packages\content-migrations\apps\web'
   - Directory navigation commands fail during the migration process

2. **Missing Script References**:

   - Script references like 'fix:relationships-direct' don't exist in the project
   - Error handling is inadequate when scripts are missing

3. **Schema Mismatches**:

   - Column errors like "column 'todo' does not exist" during Lexical format fixes
   - Local and remote schema have subtle differences

4. **Data Transfer Issues**:
   - Most tables remain empty despite migration attempts
   - SQL generation and execution appears unreliable

## Immediate Action Items

### 1. Fix Path Issues in Progressive Migration Script

```powershell
# In scripts/orchestration/remote-migration/migrate-content-progressive.ps1

# BEFORE: These lines cause errors
Push-Location -Path "apps/web"
# ...
if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
    # ...
}

# AFTER: Fix with proper path resolution and validation
$webAppPath = Join-Path -Path $PSScriptRoot -ChildPath "..\..\..\apps\web"
if (Test-Path $webAppPath) {
    Push-Location -Path $webAppPath
    # ...
} else {
    Log-Warning "Web app path not found: $webAppPath"
    # Graceful fallback logic
}

$contentMigrationsPath = Join-Path -Path $PSScriptRoot -ChildPath "..\..\..\packages\content-migrations"
if (Test-Path $contentMigrationsPath) {
    Push-Location -Path $contentMigrationsPath
    # ...
} else {
    Log-Warning "Content migrations path not found: $contentMigrationsPath"
    # Graceful fallback logic
}
```

### 2. Add Script Existence Checks

```powershell
# In scripts/orchestration/remote-migration/migrate-content-progressive.ps1

# BEFORE: Script fails when references don't exist
Exec-Command -command "pnpm run fix:relationships-direct" -description "Fixing relationships"

# AFTER: Check script existence first
$packageJson = Join-Path -Path $contentMigrationsPath -ChildPath "package.json"
$packageData = Get-Content -Path $packageJson -Raw | ConvertFrom-Json

if ($packageData.scripts -and $packageData.scripts.'fix:relationships-direct') {
    Log-Message "Running relationship fixes script..." "Yellow"
    Exec-Command -command "pnpm run fix:relationships-direct" -description "Fixing relationships" -continueOnError
} else {
    Log-Warning "Script 'fix:relationships-direct' not found in package.json, skipping"
    # Optional: Run an alternative script if available
    if ($packageData.scripts -and $packageData.scripts.'verify:relationship-columns') {
        Log-Message "Running alternative relationship verification..." "Yellow"
        Exec-Command -command "pnpm run verify:relationship-columns" -description "Verifying relationships" -continueOnError
    }
}
```

### 3. Add Column Existence Checks for Lexical Format Fix

Create a new file `scripts/orchestration/remote-migration/utils/column-checks.ps1`:

```powershell
# Column check utility functions

function Column-Exists {
    param (
        [string]$schema,
        [string]$table,
        [string]$column
    )

    $result = Invoke-RemoteSql "
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = '$schema'
        AND table_name = '$table'
        AND column_name = '$column'
    );"

    return $result -match "t"
}

function Safe-Fix-Lexical-Format {
    param (
        [string]$collection,
        [string]$field = "content"
    )

    if (Column-Exists -schema "payload" -table $collection -column $field) {
        Log-Message "Fixing Lexical format for $collection.$field" "Yellow"
        Exec-Command -command "pnpm --filter @kit/content-migrations run fix:lexical-format -- --collection $collection --field $field" -description "Fixing Lexical format" -continueOnError
    } else {
        Log-Warning "Column $field does not exist in payload.$collection, skipping Lexical format fix"
    }
}
```

Then update the main script to use these utilities:

```powershell
# In migrate-content-progressive.ps1
. "$PSScriptRoot\utils\column-checks.ps1"

# Replace Lexical format fix with safe version
Safe-Fix-Lexical-Format -collection "posts"
Safe-Fix-Lexical-Format -collection "documentation"
Safe-Fix-Lexical-Format -collection "course_lessons" -field "todo"
```

### 4. Implement Direct SQL Data Transfer

Create a new direct SQL data transfer function in `scripts/orchestration/remote-migration/utils/direct-sql-transfer.ps1`:

```powershell
# Direct SQL data transfer functions

function Get-LocalTableData {
    param (
        [string]$schema,
        [string]$table
    )

    $tempFile = Join-Path -Path $env:TEMP -ChildPath "$schema`_$table.sql"

    # Use local database URL from environment
    $localDbUrl = $env:DATABASE_URL

    # Export data directly using psql COPY command
    Exec-Command -command "psql `"$localDbUrl`" -c `"COPY $schema.$table TO STDOUT WITH CSV HEADER`" > `"$tempFile`"" -description "Exporting data from $schema.$table" -continueOnError

    return $tempFile
}

function Import-RemoteTableData {
    param (
        [string]$schema,
        [string]$table,
        [string]$dataFile
    )

    # Use remote database URL from environment
    $remoteDbUrl = $env:REMOTE_DATABASE_URL

    # First truncate the table to avoid conflicts
    Exec-Command -command "psql `"$remoteDbUrl`" -c `"TRUNCATE $schema.$table;`"" -description "Truncating remote $schema.$table" -continueOnError

    # Import data using psql COPY command
    Exec-Command -command "psql `"$remoteDbUrl`" -c `"COPY $schema.$table FROM STDIN WITH CSV HEADER`" < `"$dataFile`"" -description "Importing data to $schema.$table" -continueOnError
}

function Transfer-TableData {
    param (
        [string]$schema,
        [string]$table
    )

    Log-Message "Transferring data for $schema.$table..." "Yellow"

    try {
        # Get data from local table
        $dataFile = Get-LocalTableData -schema $schema -table $table

        # Import to remote table
        Import-RemoteTableData -schema $schema -table $table -dataFile $dataFile

        # Clean up temporary file
        if (Test-Path $dataFile) {
            Remove-Item -Path $dataFile -Force
        }

        Log-Success "Successfully transferred data for $schema.$table"
        return $true
    }
    catch {
        Log-Error "Failed to transfer data for $schema.$table: $_"
        return $false
    }
}
```

### 5. Add Verification Steps

Create a verification utility in `scripts/orchestration/remote-migration/utils/verification.ps1`:

```powershell
# Verification utility functions

function Verify-TableRowCount {
    param (
        [string]$schema,
        [string]$table
    )

    $localDbUrl = $env:DATABASE_URL
    $remoteDbUrl = $env:REMOTE_DATABASE_URL

    # Get local count
    $localCount = Exec-Command -command "psql `"$localDbUrl`" -t -c `"SELECT COUNT(*) FROM $schema.$table;`"" -description "Counting local $schema.$table" -captureOutput
    $localCount = $localCount.Trim()

    # Get remote count
    $remoteCount = Exec-Command -command "psql `"$remoteDbUrl`" -t -c `"SELECT COUNT(*) FROM $schema.$table;`"" -description "Counting remote $schema.$table" -captureOutput
    $remoteCount = $remoteCount.Trim()

    # Compare counts
    if ($localCount -eq $remoteCount) {
        Log-Success "Row count match for $schema.$table: $localCount rows"
        return $true
    } else {
        Log-Warning "Row count mismatch for $schema.$table: Local=$localCount, Remote=$remoteCount"
        return $false
    }
}

function Verify-SampleData {
    param (
        [string]$schema,
        [string]$table,
        [string]$idColumn = "id"
    )

    $localDbUrl = $env:DATABASE_URL
    $remoteDbUrl = $env:REMOTE_DATABASE_URL

    # Get a sample ID from local
    $sampleId = Exec-Command -command "psql `"$localDbUrl`" -t -c `"SELECT $idColumn FROM $schema.$table LIMIT 1;`"" -description "Getting sample from local $schema.$table" -captureOutput
    $sampleId = $sampleId.Trim()

    if (-not $sampleId) {
        Log-Warning "No data found in local $schema.$table to verify"
        return $true
    }

    # Check if sample exists in remote
    $remoteCheck = Exec-Command -command "psql `"$remoteDbUrl`" -t -c `"SELECT EXISTS(SELECT 1 FROM $schema.$table WHERE $idColumn = '$sampleId');`"" -description "Checking sample in remote $schema.$table" -captureOutput
    $remoteCheck = $remoteCheck.Trim()

    if ($remoteCheck -eq "t") {
        Log-Success "Sample data verified for $schema.$table"
        return $true
    } else {
        Log-Warning "Sample data verification failed for $schema.$table"
        return $false
    }
}
```

## Implementation Steps

1. **Immediate Codebase Updates**:

   - Create/update the utility files mentioned above
   - Modify migrate-content-progressive.ps1 to use these utilities
   - Add comprehensive error handling and logging

2. **Test Core Tables Migration Only**:

   - Run the updated migration script for core tables only:

   ```powershell
   ./supabase-remote-migration.ps1 -ProgressiveOnly -SkipDocumentation -SkipCourses -SkipQuizzes -SkipSurveys
   ```

   - Verify users and media tables have data

3. **Address Schema Differences**:

   - Create a schema comparison script to identify all differences
   - Document required column additions or modifications
   - Apply necessary schema fixes

4. **Test Posts Migration**:

   - Once core tables are working, test posts migration:

   ```powershell
   ./supabase-remote-migration.ps1 -PostsOnly
   ```

   - Verify post content and relationships

5. **Progressive Content Migration**:
   - Proceed with remaining content types one at a time
   - Verify after each step before proceeding

## Success Criteria

The immediate fixes will be considered successful when:

1. Core tables migration completes without errors
2. Row counts match between local and remote for users and media tables
3. Sample data verification passes for core tables
4. Path and script existence issues are handled gracefully

## Monitoring and Recovery

- Add detailed logging of each migration step
- Create checkpoints to enable resuming from failures
- Generate detailed verification reports after each step

These immediate fixes target the most critical issues preventing successful migration and lay the groundwork for a reliable, progressive content migration approach.
