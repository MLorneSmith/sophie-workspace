# Relationship Repair Phase
# This script runs the comprehensive relationship repair system
# that ensures consistency between direct fields and relationship tables

$ErrorActionPreference = "Stop"

# Import utilities
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"

function Invoke-RelationshipRepair {
    [CmdletBinding()]
    param(
        [switch]$SkipVerification = $false,
        [switch]$SkipFallback = $false,
        [switch]$VerboseOutput = $false,
        [switch]$ContinueOnError = $false
    )

    try {
        Log-Message "Starting comprehensive relationship repair phase..." "Yellow"
        
# Build command line arguments based on parameters
$cmdArgs = @()

if ($SkipVerification) {
    $cmdArgs += "--skip-verification"
}

if ($SkipFallback) {
    $cmdArgs += "--skip-fallback"
}

if ($VerboseOutput) {
    $cmdArgs += "--verbose"
}

# Run the relationship repair system
$argsString = $cmdArgs -join " "
        Log-Message "Running relationship repair with arguments: $argsString" "Yellow"
        
        if ($ContinueOnError) {
            Exec-Command -command "pnpm --filter @kit/content-migrations run repair:relationships $argsString" -description "Running relationship repair" -continueOnError
        } else {
            Exec-Command -command "pnpm --filter @kit/content-migrations run repair:relationships $argsString" -description "Running relationship repair"
        }
        
        # Verify the results
        if (-not $SkipVerification) {
            Log-Message "Verifying relationship consistency..." "Yellow"
            Exec-Command -command "pnpm --filter @kit/content-migrations run verify:relationships" -description "Verifying relationships"
        }
        
        Log-Success "Relationship repair completed successfully!"
        return $true
    }
    catch {
        Log-Error "Error during relationship repair: $_"
        Log-Warning $_.ScriptStackTrace
        return $false
    }
}

# Execute the function if this script is run directly
if ($MyInvocation.InvocationName -ne ".") {
    Invoke-RelationshipRepair
}
