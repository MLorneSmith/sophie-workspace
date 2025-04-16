# Simple test script to migrate a single table

param (
    [string]$schema = "payload",
    [string]$table = "documentation",
    [switch]$skipTruncate,
    [switch]$verbose
)

# Import required modules
. "$PSScriptRoot\utils\database.ps1"
. "$PSScriptRoot\utils\logging.ps1"
. "$PSScriptRoot\utils\direct-sql-transfer.ps1"

$ErrorActionPreference = "Stop"

# Display banner
Write-Host "====================================================="
Write-Host "      DIRECT SINGLE TABLE MIGRATION TEST"
Write-Host "====================================================="
Write-Host "Schema: $schema"
Write-Host "Table: $table"
Write-Host "Skip Truncate: $skipTruncate"
Write-Host "====================================================="

try {
    # Check database URLs are set
    if (-not $env:DATABASE_URL) {
        throw "Local DATABASE_URL environment variable not set"
    }
    
    if (-not $env:REMOTE_DATABASE_URL) {
        throw "REMOTE_DATABASE_URL environment variable not set"
    }
    
    # Test connections
    Write-Host "Testing remote database connection..." -ForegroundColor Cyan
    $remoteConnectResult = Invoke-RemoteSql -query "SELECT 1 AS test;" -captureOutput -continueOnError
    if (-not $remoteConnectResult -or -not $remoteConnectResult.Trim().Contains("1")) {
        throw "Remote database connection test failed"
    }
    
    Write-Host "Remote database connection test: PASSED" -ForegroundColor Green
    
    # Check if table exists in remote database
    Write-Host "Checking if table exists in remote database..." -ForegroundColor Cyan
    $checkTableQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = '$schema' AND table_name = '$table');"
    $tableExistsResult = Invoke-RemoteSql -query $checkTableQuery -captureOutput -continueOnError
    
    if ($tableExistsResult -and $tableExistsResult.Trim() -eq "t") {
        Write-Host "Table $schema.$table exists in remote database" -ForegroundColor Green
    }
    else {
        Write-Host "Table $schema.$table does not exist in remote database" -ForegroundColor Yellow
        Write-Host "Run supabase-remote-migration.ps1 -PsqlSchema first" -ForegroundColor Yellow
        exit 1
    }
    
    # Get data count in remote
    Write-Host "Getting current row count in remote database..." -ForegroundColor Cyan
    $remoteQuery = "SELECT COUNT(*) FROM $schema.$table;"
    $remoteCountBefore = Invoke-RemoteSql -query $remoteQuery -captureOutput -continueOnError
    Write-Host "Current remote row count: $remoteCountBefore" -ForegroundColor Cyan
    
    # Export CSV from local database
    if ($env:FORCE_REMOTE_ONLY -ne "true") {
        Write-Host "Exporting data from local database..." -ForegroundColor Cyan
        $dataFile = Get-LocalTableData -schema $schema -table $table
        
        if ($dataFile -and (Test-Path $dataFile)) {
            $fileInfo = Get-Item $dataFile
            Write-Host "Data exported to $dataFile ($([int]$fileInfo.Length / 1KB) KB)" -ForegroundColor Green
            
            # Import to remote database
            Write-Host "Importing data to remote database..." -ForegroundColor Cyan
            $importParams = @{
                schema = $schema
                table = $table
                dataFile = $dataFile
            }
            
            if ($skipTruncate) {
                $importParams["skipTruncate"] = $true
            }
            
            $importSuccess = Import-RemoteTableData @importParams
            
            if ($importSuccess) {
                Write-Host "Data imported to remote database successfully" -ForegroundColor Green
                
                # Verify the count
                $remoteCountAfter = Invoke-RemoteSql -query $remoteQuery -captureOutput -continueOnError
                Write-Host "Remote row count after import: $remoteCountAfter" -ForegroundColor Cyan
                
                # Clean up
                if (Test-Path $dataFile) {
                    Remove-Item -Path $dataFile -Force
                    Write-Host "Temporary data file cleaned up" -ForegroundColor Gray
                }
            }
            else {
                Write-Host "Failed to import data to remote database" -ForegroundColor Red
            }
        }
        else {
            Write-Host "Failed to export data from local database" -ForegroundColor Red
        }
    }
    else {
        Write-Host "Local database not available or FORCE_REMOTE_ONLY mode enabled" -ForegroundColor Yellow
        Write-Host "Skipping data export and import" -ForegroundColor Yellow
        
        # Check the columns in the table
        Write-Host "Checking columns in the table..." -ForegroundColor Cyan
        $columnsQuery = "SELECT column_name FROM information_schema.columns WHERE table_schema = '$schema' AND table_name = '$table' ORDER BY ordinal_position;"
        $columns = Invoke-RemoteSql -query $columnsQuery -captureOutput -continueOnError
        
        if ($columns) {
            Write-Host "Table columns:" -ForegroundColor Cyan
            $columns.Split("`n") | Where-Object { $_ -match '\S' } | ForEach-Object {
                Write-Host "  - $_" -ForegroundColor Gray
            }
        }
        
        # Insert a test record if the table is empty and we're in remote-only mode
        if ($remoteCountBefore.Trim() -eq "0") {
            Write-Host "Creating a test record in the remote database..." -ForegroundColor Cyan
            
            # Create a sample record based on the table
            $insertQuery = ""
            if ($table -eq "documentation") {
                $insertQuery = @"
INSERT INTO $schema.$table (id, title, slug, description, content, status, updated_at, created_at)
VALUES (
    1001,
    'Test Documentation Entry',
    'test-documentation-entry',
    'Testing the documentation table',
    '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"This is a test documentation entry created by the migration script.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
    'published',
    NOW(),
    NOW()
);
"@
            }
            elseif ($table -eq "posts") {
                $insertQuery = @"
INSERT INTO $schema.$table (id, title, content, updatedAt, createdAt, _status) 
VALUES (
    'test-post-1',
    'Test Post Entry',
    'This is a test post entry created by the migration script.',
    NOW(),
    NOW(),
    'published'
);
"@
            }
            
            if ($insertQuery) {
                $insertResult = Invoke-RemoteSql -query $insertQuery -continueOnError
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Test record created successfully" -ForegroundColor Green
                    
                    # Verify the count
                    $remoteCountAfter = Invoke-RemoteSql -query $remoteQuery -captureOutput -continueOnError
                    Write-Host "Remote row count after insert: $remoteCountAfter" -ForegroundColor Cyan
                }
                else {
                    Write-Host "Failed to create test record" -ForegroundColor Red
                }
            }
            else {
                Write-Host "No sample insert query available for table $table" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "Table already has data, skipping test record creation" -ForegroundColor Yellow
        }
    }
    
    Write-Host "Migration test completed" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}
