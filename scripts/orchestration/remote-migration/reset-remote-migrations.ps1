# Reset remote migrations script
# WARNING: This script will delete migration records from the remote database
# Use with caution as it can cause data loss if used incorrectly

# Import remote config to get the database URL
. "$PSScriptRoot\..\utils\remote-config.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"

# Initialize logging
Initialize-Logging -logPrefix "reset-remote-migrations"

Write-Host "WARNING: This script will DELETE migration records from the remote database!" -ForegroundColor Red
Write-Host "This is potentially destructive and should only be used during initial setup." -ForegroundColor Red
Write-Host "Using URL: $env:REMOTE_DATABASE_URL" -ForegroundColor Gray

# Prompt for confirmation
$confirmation = Read-Host "Are you sure you want to reset remote migrations? (y/N)"
if ($confirmation -ne "y") {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit 0
}

try {
    # Step 1: Create a backup script to restore if needed
    Write-Host "`nStep 1: Creating backup of remote migration records..." -ForegroundColor Yellow
    
    # Change to web directory where supabase config is located
    Push-Location -Path "apps/web"
    
    # Create a temporary script to dump the migration table
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $backupDir = "$env:TEMP\supabase_migrations_backup_$timestamp"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    Write-Host "  Backup directory: $backupDir" -ForegroundColor Gray
    
    # Verify schema exists by running diff
    Write-Host "  Checking if migration schema exists..." -ForegroundColor Yellow
    $diffOutput = & supabase db diff --db-url="$env:REMOTE_DATABASE_URL" --schema supabase_migrations 2>&1
    
    $hasMigrationSchema = $diffOutput -match "supabase_migrations"
    
    if ($hasMigrationSchema) {
        Write-Host "  Migration schema exists in remote database" -ForegroundColor Green
        
        # Create a SQL script to select migration data (we can't execute it directly)
        $backupScript = Join-Path -Path $backupDir -ChildPath "migrations_backup.sql"
        @"
-- Backup of supabase_migrations.schema_migrations table
-- Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
SELECT * FROM supabase_migrations.schema_migrations;
"@ | Out-File -FilePath $backupScript -Encoding utf8
        
        Write-Host "  Created backup script for reference at: $backupScript" -ForegroundColor Yellow
        
        # Create reset script
        $resetScript = Join-Path -Path $backupDir -ChildPath "reset_migrations.sql"
        @"
-- Script to reset migration records
-- WARNING: This deletes all migration records from the tracking table
BEGIN;
DELETE FROM supabase_migrations.schema_migrations;
COMMIT;
"@ | Out-File -FilePath $resetScript -Encoding utf8
        
        # Step 2: Create a file in the seed directory
        Write-Host "`nStep 2: Creating reset script in seed directory..." -ForegroundColor Yellow
        
        # Create seed directory if it doesn't exist
        $seedDir = Join-Path -Path "supabase" -ChildPath "seed"
        if (-not (Test-Path $seedDir)) {
            New-Item -ItemType Directory -Path $seedDir -Force | Out-Null
        }
        
        # Copy reset script to seed directory
        $seedFile = Join-Path -Path $seedDir -ChildPath "reset_migrations.sql"
        Copy-Item -Path $resetScript -Destination $seedFile -Force
        
        # Step 3: Push with include-seed to execute the reset script
        Write-Host "`nStep 3: Executing reset script..." -ForegroundColor Yellow
        
        $pushCmd = "supabase db push --db-url=`"$env:REMOTE_DATABASE_URL`" --include-seed"
        Write-Host "  Running: $pushCmd" -ForegroundColor Gray
        
        $pushOutput = & supabase db push --db-url="$env:REMOTE_DATABASE_URL" --include-seed 2>&1
        
        # Check if the script executed successfully
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n  Successfully reset migration records!" -ForegroundColor Green
            Write-Host "  You should now be able to run schema migration without conflicts." -ForegroundColor Green
        } else {
            Write-Host "`n  Error executing reset script. Exit code: $LASTEXITCODE" -ForegroundColor Red
            
            # Try a direct approach using the include-all flag
            Write-Host "`n  Attempting to push with --include-all flag..." -ForegroundColor Yellow
            $pushAllCmd = "supabase db push --db-url=`"$env:REMOTE_DATABASE_URL`" --include-all"
            Write-Host "  Running: $pushAllCmd" -ForegroundColor Gray
            
            $pushAllOutput = & supabase db push --db-url="$env:REMOTE_DATABASE_URL" --include-all 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n  Successfully pushed schema with --include-all flag!" -ForegroundColor Green
            } else {
                Write-Host "`n  Error pushing with --include-all flag. Exit code: $LASTEXITCODE" -ForegroundColor Red
                Write-Host "  You may need to manually reset the schema_migrations table in the remote database." -ForegroundColor Red
            }
        }
        
        # Clean up the seed file
        Remove-Item -Path $seedFile -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "  Migration schema not found in remote database." -ForegroundColor Yellow
        Write-Host "  This might indicate the database is fresh or migrations haven't been initialized." -ForegroundColor Yellow
        
        # Try a push with --include-all to initialize migration tracking
        Write-Host "`n  Attempting to push with --include-all flag to initialize migration tracking..." -ForegroundColor Yellow
        $pushAllCmd = "supabase db push --db-url=`"$env:REMOTE_DATABASE_URL`" --include-all"
        Write-Host "  Running: $pushAllCmd" -ForegroundColor Gray
        
        $pushAllOutput = & supabase db push --db-url="$env:REMOTE_DATABASE_URL" --include-all 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n  Successfully initialized migrations with --include-all flag!" -ForegroundColor Green
        } else {
            Write-Host "`n  Error initializing migrations. Exit code: $LASTEXITCODE" -ForegroundColor Red
        }
    }
    
    # Return to original directory
    Pop-Location
    
    Write-Host "`nReset migration operation completed! Backup saved at: $backupDir" -ForegroundColor Cyan
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Run schema migration with './supabase-remote-migration.ps1 -SchemaOnly'" -ForegroundColor Yellow
    Write-Host "2. Run posts migration with './supabase-remote-migration.ps1 -PostsOnly'" -ForegroundColor Yellow
    Write-Host "3. Run progressive content migration with './supabase-remote-migration.ps1 -ProgressiveOnly'" -ForegroundColor Yellow
    
} catch {
    Write-Host "`nError: $_" -ForegroundColor Red
    
    # Return to original directory if needed
    if ((Get-Location).Path -match "apps/web") {
        Pop-Location
    }
    
    # Provide troubleshooting steps
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host " - Check that the remote database is accessible" -ForegroundColor Yellow
    Write-Host " - Verify the Supabase CLI is properly installed" -ForegroundColor Yellow
    Write-Host " - Check the remote database connection string" -ForegroundColor Yellow
}
