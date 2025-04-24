# PowerShell Verification Dependencies Module for Reset-and-Migrate.ps1
# This file now uses the new modular system and is maintained for backward compatibility

# Import the improved version which now uses the modular system
. "$PSScriptRoot\verification-dependencies-improved.ps1"

# For backward compatibility with existing code that uses Run-VerificationWithDependencies
function Run-VerificationWithDependencies {
    param (
        [Parameter(Mandatory = $true)]
        [string]$VerificationStep,
        
        [Parameter(Mandatory = $false)]
        [string]$Description = "Verification with dependencies",
        
        [Parameter(Mandatory = $false)]
        [switch]$ContinueOnError
    )
    
    # Convert switch to boolean for the underlying function
    $continueOnErrorValue = $ContinueOnError.IsPresent
    
    # Call the renamed function with the same parameters
    return Invoke-VerificationWithDependencies -VerificationStep $VerificationStep -Description $Description -ContinueOnError $continueOnErrorValue
}

# All functions from the modular system are now available in this scope
# This ensures backward compatibility with existing code that imports this file
