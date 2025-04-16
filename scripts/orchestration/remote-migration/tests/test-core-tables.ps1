# Core Tables Migration Test
# This script tests migrating only the core tables to the remote database

# Import necessary modules
. "$PSScriptRoot\..\utils\database.ps1"
. "$PSScriptRoot\..\utils\direct-sql-transfer.ps1"

function Test-CoreTablesMigration {
    Write-Host "==== Core Tables Migration Test ====" -ForegroundColor Cyan
    Write-Host ""
    
    # First, check if we can connect to both databases
    Write-Host "Testing database connections..." -ForegroundColor Yellow
    $localConnectionOk = Test-DatabaseConnection -connectionString $env:DATABASE_URL -name "local database"
    $remoteConnectionOk = Test-DatabaseConnection -connectionString $env:REMOTE_DATABASE_URL -name "remote database"
    
    if (-not $localConnectionOk -or -not $remoteConnectionOk) {
        Write-Host "Database connection issues detected. Cannot proceed with test." -ForegroundColor Red
        return $false
    }
    
    Write-Host "Connections successful." -ForegroundColor Green
    Write-Host ""
    
    # Define core tables
    $coreTables = @(
        "users",
        "media",
        "payload_preferences",
        "payload_migrations"
    )
    
    # Check if core tables exist in remote
    Write-Host "Checking if core tables exist in remote database..." -ForegroundColor Yellow
    $missingTables = @()
    
    foreach ($table in $coreTables) {
        $exists = Invoke-RemoteSql -query "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'payload' AND table_name = '$table');" -captureOutput
        
        if ($exists -notmatch "t") {
            $missingTables += $table
        }
    }
    
    if ($missingTables.Count -gt 0) {
        Write-Host "ERROR: The following core tables are missing in the remote database:" -ForegroundColor Red
        $missingTables | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        Write-Host ""
        Write-Host "Please run schema migration first before testing data migration." -ForegroundColor Red
        return $false
    }
    
    Write-Host "All core tables exist in remote database." -ForegroundColor Green
    Write-Host ""
    
    # Display initial row counts
    Write-Host "Initial table row counts:" -ForegroundColor Yellow
    
    foreach ($table in $coreTables) {
        $comparison = Compare-TableCounts -schema "payload" -table $table -verbose
    }
    
    Write-Host ""
    
    # Migrate each core table
    Write-Host "Starting migration of core tables..." -ForegroundColor Yellow
    $successful = 0
    $failed = 0
    
    foreach ($table in $coreTables) {
        Write-Host "Migrating table: payload.$table" -ForegroundColor Cyan
        
        $result = Transfer-TableData -schema "payload" -table $table -verifyAfterTransfer
        
        if ($result) {
            Write-Host "Successfully migrated payload.$table" -ForegroundColor Green
            $successful++
        } else {
            Write-Host "Failed to migrate payload.$table" -ForegroundColor Red
            $failed++
        }
        
        Write-Host ""
    }
    
    # Display final row counts for verification
    Write-Host "Final table row counts after migration:" -ForegroundColor Yellow
    
    foreach ($table in $coreTables) {
        $comparison = Compare-TableCounts -schema "payload" -table $table -verbose
    }
    
    # Display final results
    Write-Host ""
    Write-Host "==== Core Tables Migration Test Results ====" -ForegroundColor Cyan
    
    if ($failed -eq 0) {
        Write-Host "SUCCESS: All $successful core tables were migrated successfully." -ForegroundColor Green
        return $true
    } else {
        Write-Host "PARTIAL SUCCESS: $successful of $($coreTables.Count) core tables migrated successfully." -ForegroundColor Yellow
        Write-Host "$failed tables failed to migrate." -ForegroundColor Red
        return $false
    }
}

# Run the test
$testResult = Test-CoreTablesMigration

# Return appropriate exit code
exit [int](-not $testResult)
