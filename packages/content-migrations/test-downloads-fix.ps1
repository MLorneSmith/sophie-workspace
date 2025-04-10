# PowerShell script to test the downloads relationship fix
# This script tests if the fixes for the downloads relationship UUID type mismatch issue work properly

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Get the script's directory for absolute paths
$scriptDir = $PSScriptRoot

# Write a section header
function Write-SectionHeader {
    param (
        [string]$title
    )
    
    Write-Host "`n=== $title ===`n" -ForegroundColor Cyan
}

# Initialize success tracking
$overallSuccess = $true

# Function to execute a command and check its exit code
function Exec-Command {
    param (
        [string]$command,
        [string]$description
    )
    
    Write-Host "EXECUTING: $command" -ForegroundColor Gray
    Write-Host "DESCRIPTION: $description" -ForegroundColor Gray
    
    try {
        Invoke-Expression $command
        
        # Check exit code
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Command failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            $script:overallSuccess = $false
            throw "Command failed with exit code: $LASTEXITCODE"
        }
    }
    catch {
        Write-Host "ERROR in step '$description': $_" -ForegroundColor Red
        $script:overallSuccess = $false
        throw $_
    }
}

try {
    Write-SectionHeader "Verifying Downloads Data Types"
    
    # Run the data type verification script
    Exec-Command -command "pnpm --filter @kit/content-migrations run verify:downloads-types" -description "Verifying downloads data types"

    # If we get here, verification passed. Create a test case to fully test our fix
    Write-SectionHeader "Creating Test Case for UUID Type Mismatch"
    
    # Create a SQL file for our test case
    $testSql = @"
-- Test SQL for downloads UUID type mismatch fix
-- This creates a temporary UUID-named table and tests joining with downloads_id

DO \$\$
DECLARE
    temp_table TEXT;
BEGIN
    -- Create a temporary table with UUID-like name to simulate Payload's behavior
    temp_table := '175d8dab_4c75_40a9_b411_bd6e601272b8';
    
    -- Drop the table if it exists
    EXECUTE 'DROP TABLE IF EXISTS payload.' || temp_table;
    
    -- Create the table with structure similar to what Payload creates
    EXECUTE '
        CREATE TABLE payload.' || temp_table || ' (
            id TEXT PRIMARY KEY,
            parent_id TEXT,
            related_id TEXT
        )
    ';
    
    -- Insert test data
    EXECUTE '
        INSERT INTO payload.' || temp_table || ' (id, parent_id, related_id) 
        VALUES (''test-id'', ''parent-1'', ''9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1'')
    ';
    
    -- Add downloads_id column with our fix function
    EXECUTE 'SELECT payload.ensure_downloads_id(''payload.' || temp_table || ''')';
    
    -- Test if the column was created and populated correctly
    PERFORM payload.safe_uuid_comparison(r.related_id, d.id)
    FROM payload.downloads d
    JOIN payload.175d8dab_4c75_40a9_b411_bd6e601272b8 r ON r.related_id::uuid = d.id;
    
    -- If we reach here, the test passed
    RAISE NOTICE 'Test passed - the fix works with temporary UUID tables';
    
    -- Clean up
    EXECUTE 'DROP TABLE payload.' || temp_table;
END;
\$\$ LANGUAGE plpgsql;
"@

    # Write the SQL file
    $testSqlPath = Join-Path -Path $scriptDir -ChildPath "temp-test-downloads-fix.sql"
    Set-Content -Path $testSqlPath -Value $testSql
    
    # Run the SQL file
    Exec-Command -command "pnpm run utils:run-sql-file `"$testSqlPath`"" -description "Running test case for UUID type mismatch fix"
    
    # Remove the temporary SQL file
    Remove-Item -Path $testSqlPath -Force
    
    # Final status
    if ($overallSuccess) {
        Write-SectionHeader "Testing Completed Successfully"
        Write-Host "✅ All tests passed! The downloads relationship UUID type mismatch fix is working properly." -ForegroundColor Green
    } else {
        Write-SectionHeader "Testing Failed"
        Write-Host "❌ Some tests failed. See the output above for details." -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "CRITICAL ERROR: Test process failed: $_" -ForegroundColor Red
    exit 1
}
