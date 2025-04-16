# sync-migrations.ps1

# Import required modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"

# Initialize logging
Initialize-Logging -logPrefix "migration-sync"

try {
    Log-Phase "MIGRATION SYNCHRONIZATION PHASE"

    # Move to the web directory where Supabase is configured
    Push-Location -Path "apps/web"

    # Find the specific migration that's causing the issue
    Log-Step "Checking migration status" 1
    Exec-Command -command "supabase migration list" -description "Listing migrations" -continueOnError
    
    # List remote migrations
    Log-Step "Checking remote migration status" 2
    Exec-Command -command "supabase db remote changes" -description "Checking remote migrations" -continueOnError
    
    # Pull remote migrations to sync local and remote state
    Log-Step "Pulling remote migrations" 3
    Log-Message "Synchronizing local migration state with remote database..." "Yellow"
    Exec-Command -command "supabase db pull" -description "Pulling remote schema changes" -continueOnError
    
    # Check for any specific version that needs repairing
    # Extract the version from the error message if available
    $repairVersion = $env:MIGRATION_REPAIR_VERSION
    if ($repairVersion) {
        Log-Step "Repairing specific migration" 4
        Log-Message "Repairing migration $repairVersion..." "Yellow"
        Exec-Command -command "supabase migration repair --status reverted $repairVersion" -description "Repairing migration" -continueOnError
    }
    
    # Verify migration status after repairs
    Log-Step "Verifying migration status" 5
    Exec-Command -command "supabase migration list" -description "Listing migrations after repair" -continueOnError
    
    # Return to original directory
    Pop-Location
    
    Log-Success "Migration synchronization completed"
}
catch {
    Log-Error "CRITICAL ERROR: Migration synchronization failed: $_"
    exit 1
}
finally {
    # Make sure we're back to the original directory
    if ((Get-Location).Path -match "apps[/\\]web$") {
        Pop-Location
    }
    
    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
