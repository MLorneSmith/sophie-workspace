# PowerShell Verification Dependencies Optimized Module
# Main entry point for the modular dependency system for reset-and-migrate.ps1
#
# Purpose: Acts as the entry point and integrates all modules
# This module imports all submodules and provides the public API for the dependency system.

# Import all submodules to bring together the complete functionality
. "$PSScriptRoot\verification-dependencies-core.ps1"
. "$PSScriptRoot\verification-dependencies-graph.ps1"
. "$PSScriptRoot\verification-dependencies-execution.ps1"
. "$PSScriptRoot\verification-dependencies-visualization.ps1"
. "$PSScriptRoot\verification-dependencies-validation.ps1"

# Function to initialize the dependency system
# This should be called at the start of the migration process
function Initialize-DependencySystem {
    Log-Message "Initializing optimized dependency system..." "Cyan"
    
    # Reset dependency tracking to clear any previous state
    Reset-DependencyTracking
    
    # Validate the dependency graph for consistency
    if (Test-DependencyGraph -Quiet) {
        Log-Success "Dependency graph initialized and validated successfully"
    } else {
        Log-Warning "Dependency graph initialized with some issues. Run Test-DependencyGraph for details."
    }
}

# Function to run a verification step with automatic dependency handling
# This wraps the execution module's function with the same name for API consistency
function Invoke-VerificationWithOptimizedDependencies {
    param (
        [Parameter(Mandatory = $true)]
        [string]$VerificationStep,
        
        [Parameter(Mandatory = $false)]
        [string]$Description = "Verifying with optimized dependencies",
        
        [Parameter(Mandatory = $false)]
        [bool]$ContinueOnError = $false
    )
    
    # Call the execution module's function
    return Invoke-VerificationWithDependencies -VerificationStep $VerificationStep -Description $Description -ContinueOnError $ContinueOnError
}

# For backward compatibility with existing code that might use the old function name
# Note: We need to prevent recursive calls, so don't redefine the same function name
# Instead, since we dot-source the execution module, the original function is already available
# No need to redefine Invoke-VerificationWithDependencies

# Generate a comprehensive report on the dependency system status
function Get-DependencySystemReport {
    param (
        [switch]$IncludeGraph,
        [switch]$IncludeValidation
    )
    
    Log-Message "Dependency System Report" "Cyan"
    Log-Message "=========================" "Cyan"
    
    # Show dependency execution status
    Show-DependencyReport
    
    # Show verification step status
    Show-VerificationStepStatus
    
    # Optionally show the dependency graph
    if ($IncludeGraph) {
        Log-Message "" "White"
        Show-DependencyGraph
    }
    
    # Optionally perform and show validation results
    if ($IncludeValidation) {
        Log-Message "" "White"
        Test-DependencyGraph
    }
}

# Functions are automatically available when dot-sourced
# No need for Export-ModuleMember in PowerShell scripts
