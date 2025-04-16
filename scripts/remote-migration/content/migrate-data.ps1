# PowerShell script to migrate data to remote Supabase instance
# This assumes schema has been properly migrated

param (
    [switch]$SkipFixes,
    [switch]$SkipVerification
)

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Import modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\verification.ps1"
. "$PSScriptRoot\..\utils\supabase.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"

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
    
    # Phase 2: Create data dump and apply to remote
    Log-Phase "DATA MIGRATION PHASE"
    
    Log-Step "Creating and applying data dump" 2
    Set-ProjectRootLocation
    Push-Location -Path "apps/web"
    Log-Message "Changed directory to: $(Get-Location)" "Gray"
    
    # Create temporary dump directory if it doesn't exist
    $dumpDir = Join-Path -Path $env:TEMP -ChildPath "slideheroes_dump"
    if (-not (Test-Path -Path $dumpDir)) {
        New-Item -ItemType Directory -Path $dumpDir -Force | Out-Null
    }
    
    # Create data dump using supabase db dump
    Log-Message "Creating seed data file..." "Yellow"
    
    # Check if seed.sql exists and back it up if it does
    $seedFile = "supabase/seed.sql"
    if (Test-Path -Path $seedFile) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = "supabase/seed_backup_$timestamp.sql"
        Copy-Item -Path $seedFile -Destination $backupFile
        Log-Message "Backed up existing seed file to $backupFile" "Yellow"
    }
    
    # Create a dump of public schema
    Log-Message "Dumping public schema data..." "Yellow"
    Exec-Command -command "supabase db dump --data-only --schema public > $seedFile" -description "Creating public schema seed data"
    
    # Create a dump of payload schema and append to seed file
    Log-Message "Dumping payload schema data..." "Yellow"
    Exec-Command -command "supabase db dump --data-only --schema payload >> $seedFile" -description "Appending payload schema seed data"
    
    # Push data to remote database
    Log-Message "Pushing schema and data to remote database..." "Yellow"
    Exec-Command -command "supabase db push --db-url `"$env:REMOTE_DATABASE_URL`" --include-seed --include-roles" -description "Pushing schema and data to remote"
    
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
