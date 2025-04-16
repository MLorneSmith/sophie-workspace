# Posts Migration Test
# This script tests migrating only the posts-related tables to the remote database

# Import necessary modules
. "$PSScriptRoot\..\utils\database.ps1"
. "$PSScriptRoot\..\utils\direct-sql-transfer.ps1"

function Test-PostsMigration {
    Write-Host "==== Posts Migration Test ====" -ForegroundColor Cyan
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
    
    # Define posts tables
    $postsTables = @(
        "posts",
        "posts_categories",
        "posts_tags",
        "posts_rels",
        "posts__downloads"
    )
    
    # Check if posts tables exist in remote
    Write-Host "Checking if posts tables exist in remote database..." -ForegroundColor Yellow
    $missingTables = @()
    
    foreach ($table in $postsTables) {
        $exists = Invoke-RemoteSql -query "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'payload' AND table_name = '$table');" -captureOutput
        
        if ($exists -notmatch "t") {
            $missingTables += $table
        }
    }
    
    if ($missingTables.Count -gt 0) {
        Write-Host "ERROR: The following posts tables are missing in the remote database:" -ForegroundColor Red
        $missingTables | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        Write-Host ""
        Write-Host "Please run schema migration first before testing data migration." -ForegroundColor Red
        return $false
    }
    
    Write-Host "All posts tables exist in remote database." -ForegroundColor Green
    Write-Host ""
    
    # Display initial row counts
    Write-Host "Initial posts table row counts:" -ForegroundColor Yellow
    
    foreach ($table in $postsTables) {
        $comparison = Compare-TableCounts -schema "payload" -table $table -verbose
    }
    
    Write-Host ""
    
    # Migrate each posts table
    Write-Host "Starting migration of posts tables..." -ForegroundColor Yellow
    $successful = 0
    $failed = 0
    
    foreach ($table in $postsTables) {
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
    
    foreach ($table in $postsTables) {
        $comparison = Compare-TableCounts -schema "payload" -table $table -verbose
    }
    
    # Additional content verification
    Write-Host "Verifying post content transfer..." -ForegroundColor Yellow
    
    try {
        # Check if any posts were transferred
        $postCount = Get-TableRowCount -connectionString $env:REMOTE_DATABASE_URL -tableFullName "payload.posts"
        
        if ($postCount -gt 0) {
            Write-Host "SUCCESS: $postCount posts transferred to remote database" -ForegroundColor Green
            
            # Check post content for a sample post
            $samplePostTitle = Invoke-RemoteSql -query "SELECT title FROM payload.posts LIMIT 1;" -captureOutput
            
            if (-not [string]::IsNullOrWhiteSpace($samplePostTitle)) {
                Write-Host "Sample post title verification: '$samplePostTitle'" -ForegroundColor Green
            } else {
                Write-Host "WARNING: Sample post title could not be verified" -ForegroundColor Yellow
            }
        } else {
            if ($successful -gt 0) {
                Write-Host "WARNING: Tables migrated but no posts found in remote database" -ForegroundColor Yellow
            } else {
                Write-Host "ERROR: No posts data transferred" -ForegroundColor Red
            }
        }
    }
    catch {
        Write-Host "Error during content verification: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Display final results
    Write-Host ""
    Write-Host "==== Posts Migration Test Results ====" -ForegroundColor Cyan
    
    if ($failed -eq 0) {
        Write-Host "SUCCESS: All $successful posts tables were migrated successfully." -ForegroundColor Green
        return $true
    } else {
        Write-Host "PARTIAL SUCCESS: $successful of $($postsTables.Count) posts tables migrated successfully." -ForegroundColor Yellow
        Write-Host "$failed tables failed to migrate." -ForegroundColor Red
        return $false
    }
}

# Run the test
$testResult = Test-PostsMigration

# Return appropriate exit code
exit [int](-not $testResult)
