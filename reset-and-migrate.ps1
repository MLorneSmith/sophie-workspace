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
. "$PSScriptRoot\scripts\orchestration\utils\enhanced-logging.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\execution.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\verification.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\diagnostic.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\configuration.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\performance-logging.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\verification-dependencies-improved.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\dependency-graph.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\sql-error-logging.ps1"
. "$PSScriptRoot\scripts\orchestration\phases\setup.ps1"
. "$PSScriptRoot\scripts\orchestration\phases\processing.ps1"
. "$PSScriptRoot\scripts\orchestration\phases\loading-with-quiz-repair.ps1"

# Global variables
$script:overallSuccess = $true

try {
    # Initialize logging and environment
    Initialize-Logging
    Initialize-Timer

    # Move PNPM configuration from payload to root
    Move-PnpmConfiguration

    # Phase 1: Setup
    # Reset Supabase database, run Web app migrations, reset Payload schema, run Payload migrations
    Log-EnhancedPhase -PhaseName "SETUP PHASE" -PhaseNumber 1 -TotalPhases 4
    Invoke-SetupPhase
    Log-EnhancedPhaseCompletion -PhaseName "SETUP PHASE" -Success $true

    # Phase 2: Processing
    # Process raw data, generate SQL seed files, fix quiz ID consistency, fix references
    Log-EnhancedPhase -PhaseName "PROCESSING PHASE" -PhaseNumber 2 -TotalPhases 4
    Invoke-ProcessingPhase -ForceRegenerate:$ForceRegenerate
    Log-EnhancedPhaseCompletion -PhaseName "PROCESSING PHASE" -Success $true

    # Phase 3: Loading
    # Run content migrations, import downloads, fix relationships, verify database
    Log-EnhancedPhase -PhaseName "LOADING PHASE" -PhaseNumber 3 -TotalPhases 4
    Invoke-LoadingPhase -SkipVerification:$SkipVerification
    Log-EnhancedPhaseCompletion -PhaseName "LOADING PHASE" -Success $true

    # Phase 4: Post-Verification
    # Verify specific collections and content integrity
    if (-not $SkipVerification) {
        Log-EnhancedPhase -PhaseName "POST-VERIFICATION PHASE" -PhaseNumber 4 -TotalPhases 4

        # Verify posts content integrity with dependency management
        Log-EnhancedStep -StepName "Verifying posts content integrity" -StepNumber 12 -TotalSteps 12
        Set-ProjectRootLocation
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"

            # Use dependency-aware verification for post content
            Log-Message "Running post content verification with dependency handling..." "Yellow"
            $postVerificationResult = Invoke-VerificationWithDependencies -VerificationStep "verify:post-content" -Description "Verifying posts content with dependencies" -ContinueOnError $true

            if ($postVerificationResult) {
                Log-Success "Post content verification passed with automatic dependency handling"
            } else {
                Log-Warning "Post content verification found issues that need manual inspection"
                $script:overallSuccess = $false
            }

            Pop-Location
            Log-Message "Returned to directory: $(Get-Location)" "Gray"
        } else {
            Log-Warning "Could not find packages/content-migrations directory, skipping posts verification"
        }
        Log-EnhancedStepCompletion -Success $true

        Log-EnhancedPhaseCompletion -PhaseName "POST-VERIFICATION PHASE" -Success $true
    }

    # Final success/failure message with diagnostic summary
    Finalize-Timer

    if ($script:overallSuccess) {
        Log-Success "All migrations and verifications completed successfully!"
        Log-Message "Admin user created with email: michael@slideheroes.com" "Green"

        # Show performance report
        Show-PerformanceReport

        # Show diagnostic summary with improved reliability
        Log-Message "Migration Summary:" "Cyan"

        # Run diagnostic with timeout handling
        try {
            Show-MigrationDiagnostic -TimeoutSeconds 20
        } catch {
            $errorMsg = Get-SafeErrorMessage $_
            Log-Warning "Could not generate migration statistics: $errorMsg"
            Log-Message "For detailed migration status, run: pnpm --filter @kit/content-migrations run diagnostic:migration-status" "Yellow"
        }

        # Note about warnings - use the enhanced expected warning format
        Log-ExpectedWarning "Warning messages about 'No posts were migrated' are expected if all posts are already in the database."
        Log-ExpectedWarning "Warning messages about 'verification found issues' during early phases are expected and will be fixed in later phases."
        Log-ExpectedWarning "SQL errors related to 'ADD COLUMN cannot be performed on relation' for some tables are handled gracefully."
    } else {
        Log-Warning "Migration process completed with warnings or errors. Please check the logs for details."

        # Still show performance report and diagnostic summary even on warning/error
        Show-PerformanceReport

        Log-Message "Migration Status:" "Cyan"
        try {
            Show-MigrationDiagnostic -TimeoutSeconds 15
        } catch {
            $errorMsg = Get-SafeErrorMessage $_
            Log-Warning "Could not generate migration statistics: $errorMsg"
            Log-Message "For detailed migration status, run: pnpm --filter @kit/content-migrations run diagnostic:migration-status" "Yellow"
        }

        # Simplified error summary without complex pattern matching
        Log-Message "Error Summary:" "Yellow"
        try {
            # Simply count common error types by basic string containment
            $detailedLog = Get-Content -Path $script:detailedLogFile -ErrorAction SilentlyContinue

            # Count SQL errors by simple string contains
            $sqlErrorCount = ($detailedLog | Where-Object { $_ -like "*SQL ERROR DETECTED:*" }).Count

            if ($sqlErrorCount -gt 0) {
                Log-Message "Found $sqlErrorCount SQL errors in the log file" "Yellow"

                # Count common SQL error types without complex regex
                $missingColumnCount = ($detailedLog | Where-Object { $_ -like "*Missing Column*" }).Count
                $missingTableCount = ($detailedLog | Where-Object { $_ -like "*Missing Table*" }).Count
                $modificationCount = ($detailedLog | Where-Object { $_ -like "*Table Modification Restriction*" }).Count
                $transactionCount = ($detailedLog | Where-Object { $_ -like "*Transaction Aborted*" }).Count

                # Display basic counts
                if ($missingColumnCount -gt 0) {
                    Log-Message "  - Missing Column errors: $missingColumnCount" "Yellow"
                }
                if ($missingTableCount -gt 0) {
                    Log-Message "  - Missing Table errors: $missingTableCount" "Yellow"
                }
                if ($modificationCount -gt 0) {
                    Log-Message "  - Table Modification errors: $modificationCount" "Yellow"
                }
                if ($transactionCount -gt 0) {
                    Log-Message "  - Transaction Aborted errors: $transactionCount" "Yellow"
                }
            }
        } catch {
            $errorMsg = Get-SafeErrorMessage $_
            Log-Warning "Could not generate SQL error summary: $errorMsg"
        }
    }
}
catch {
    $errorMsg = Get-SafeErrorMessage $_
    Log-Error "CRITICAL ERROR: Migration process failed: $errorMsg"
    Log-Message "Please check the log files for details:" "Red"
    Log-Message "  - Transcript log: $script:logFile" "Red"
    Log-Message "  - Detailed log: $script:detailedLogFile" "Red"

    # Stop transcript before exiting
    try {
        Stop-Transcript -ErrorAction SilentlyContinue
    }
    catch {
        $errorMsg = Get-SafeErrorMessage $_
        Write-Host "Warning: Could not stop transcript: $errorMsg" -ForegroundColor Yellow
    }
    exit 1
}
finally {
    # Finalize logging
    Finalize-Logging -success $script:overallSuccess
}
