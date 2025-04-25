# Simplified Relationship Repair Phase
# This script runs the simplified version of the relationship repair system
# that doesn't rely on direct fields that may not exist in the schema

$ErrorActionPreference = "Stop"

# Import utilities
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"

function Invoke-SimplifiedRelationshipRepair {
    [CmdletBinding()]
    param(
        [switch]$SkipVerification = $false,
        [switch]$SkipFallback = $false,
        [switch]$VerboseOutput = $false
    )

    try {
        Log-Message "Starting simplified relationship repair phase..." "Yellow"
        
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

        # Run the simplified relationship repair system
        $argsString = $cmdArgs -join " "
        Log-Message "Running simplified relationship repair with arguments: $argsString" "Yellow"
        
        Exec-Command -command "pnpm --filter @kit/content-migrations run repair:relationships:simplified $argsString" -description "Running simplified relationship repair"
        
        Log-Success "Simplified relationship repair completed successfully!"
        return $true
    }
    catch {
        Log-Error "Error during simplified relationship repair: $_"
        Log-Warning $_.ScriptStackTrace
        return $false
    }
}

# Execute the function if this script is run directly
if ($MyInvocation.InvocationName -ne ".") {
    Invoke-SimplifiedRelationshipRepair
}
