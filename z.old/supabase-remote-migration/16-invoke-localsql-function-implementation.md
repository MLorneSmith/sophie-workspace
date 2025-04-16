# Invoke-LocalSql Function Implementation

**Date:** April 16, 2025  
**Status:** Proposed Solution

## Table of Contents

1. [Issue Description](#1-issue-description)
2. [Root Cause Analysis](#2-root-cause-analysis)
3. [Proposed Solution](#3-proposed-solution)
4. [Implementation Plan](#4-implementation-plan)
5. [Testing Strategy](#5-testing-strategy)
6. [Future Considerations](#6-future-considerations)

## 1. Issue Description

When running the `supabase-remote-migration.ps1` script with default parameters, the migration process fails during the "Synchronizing migrations between local and remote" step with the following error:

```
ERROR: The term 'param' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
```

This error prevents the migration process from proceeding past the schema initialization step, resulting in empty tables in the remote Supabase instance.

## 2. Root Cause Analysis

After thorough analysis of the migration script files, the root cause has been identified:

1. The `sync-migrations.ps1` script uses a function called `Invoke-LocalSql` to execute SQL queries against the local database
2. While `Invoke-RemoteSql` is properly defined in the `database.ps1` utility file, its local counterpart `Invoke-LocalSql` is missing
3. When PowerShell encounters this undefined function, it attempts to interpret the `param` keyword in the parameter list as a command, resulting in the error

Specifically, in `sync-migrations.ps1`, we have code like:

```powershell
$localMigrationsQuery = "SELECT id, name, batch, created_at FROM payload.payload_migrations ORDER BY id;"
$localMigrations = Invoke-LocalSql -query $localMigrationsQuery -captureOutput
```

But the referenced function `Invoke-LocalSql` is not defined anywhere in the utilities.

## 3. Proposed Solution

The solution is to implement the missing `Invoke-LocalSql` function in the `database.ps1` utility file. The implementation should mirror the existing `Invoke-RemoteSql` function but be tailored for the local database connection:

```powershell
# Execute a SQL command against the local database
function Invoke-LocalSql {
    param (
        [string]$query,
        [switch]$captureOutput,
        [switch]$continueOnError
    )

    try {
        # Use the local database URL
        if (-not $env:DATABASE_URL) {
            throw "DATABASE_URL environment variable is not set"
        }

        # For local database, we don't need to specify the URL since it uses the linked project
        $params = @{
            command = "supabase db execute -c `"$query`""
            description = "Executing SQL on local database"
        }

        if ($captureOutput.IsPresent) {
            $params["captureOutput"] = $true
        }

        if ($continueOnError.IsPresent) {
            $params["continueOnError"] = $true
        }

        $result = Exec-Command @params
        return $result
    }
    catch {
        if (-not $continueOnError.IsPresent) {
            throw $_
        }
        Write-Host "SQL Error on local: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}
```

This implementation:

- Uses the same parameter structure as `Invoke-RemoteSql` for consistency
- Calls `supabase db execute` without the `--db-url` parameter, which targets the local Supabase instance
- Includes proper error handling and output capture options
- Returns the query results in the same format as `Invoke-RemoteSql`

## 4. Implementation Plan

1. Add the `Invoke-LocalSql` function to `scripts\orchestration\remote-migration\utils\database.ps1`
2. Ensure the function is defined before it's referenced in other files
3. Test the function with a simple query to verify it works correctly
4. Run the full migration script to ensure it progresses past the synchronization step

Implementation timeline:

- Function implementation: Immediate
- Testing: Following implementation
- Deployment: Upon successful testing

## 5. Testing Strategy

The implementation will be validated through the following tests:

1. **Unit Testing**:

   - Directly invoke the `Invoke-LocalSql` function with a simple query (e.g., "SELECT 1")
   - Verify the function returns the expected result
   - Test error scenarios by executing invalid SQL

2. **Integration Testing**:

   - Execute `supabase-remote-migration.ps1 -Test` to validate basic connectivity
   - Run `supabase-remote-migration.ps1 -SyncOnly` to test just the migration synchronization step
   - Verify the sync process correctly identifies and synchronizes migrations

3. **End-to-End Testing**:
   - Execute the full migration script
   - Verify all steps complete successfully
   - Check that tables in the remote database are properly populated

## 6. Future Considerations

While this fix addresses the immediate issue, several improvements could enhance the migration system's robustness:

1. **Function Consolidation**:

   - Consider creating a unified `Invoke-Sql` function that accepts a `remote` switch to determine which database to target
   - This would reduce code duplication and ensure consistent behavior

2. **Enhanced Error Handling**:

   - Add more detailed error messages with troubleshooting guidance
   - Implement retry logic for transient connection issues

3. **Testing Framework**:

   - Develop a comprehensive test suite for all database utility functions
   - Create mock database responses for more thorough testing

4. **Documentation**:

   - Add inline documentation to all functions
   - Create a utility reference guide for the migration system

5. **Connection Pooling**:
   - Implement connection pooling for better performance during bulk operations
   - Add connection timeouts and retry logic

By implementing this fix and considering these future improvements, the migration system will become more robust and maintainable.
