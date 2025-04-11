# PowerShell script to reset the database and run all migrations
# Organized in a modular structure with clear phases

# Parameters for the script
param (
    [switch]$ForceRegenerate,
    [switch]$SkipVerification
)

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Import modules
. "$PSScriptRoot\scripts\orchestration\utils\path-management.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\logging.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\execution.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\verification.ps1"
. "$PSScriptRoot\scripts\orchestration\phases\setup.ps1"
. "$PSScriptRoot\scripts\orchestration\phases\processing.ps1"
. "$PSScriptRoot\scripts\orchestration\phases\loading.ps1"

# Global variables
$script:overallSuccess = $true

try {
    # Initialize logging and environment
    Initialize-Logging
    
    # Phase 1: Setup
    # Reset Supabase database, run Web app migrations, reset Payload schema, run Payload migrations
    Invoke-SetupPhase
    
    # Phase 2: Processing
    # Process raw data, generate SQL seed files, fix quiz ID consistency, fix references
    Invoke-ProcessingPhase -ForceRegenerate:$ForceRegenerate
    
    # Phase 3: Loading
    # Run content migrations, import downloads, fix relationships, verify database
    Invoke-LoadingPhase -SkipVerification:$SkipVerification
    
    # Final success/failure message
    if ($script:overallSuccess) {
        Log-Success "All migrations and verifications completed successfully!"
        Log-Message "Admin user created with email: michael@slideheroes.com" "Green"
    } else {
        Log-Warning "Migration process completed with warnings or errors. Please check the logs for details."
    }
}
catch {
    Log-Error "CRITICAL ERROR: Migration process failed: $_"
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
}
