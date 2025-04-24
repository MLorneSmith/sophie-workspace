# PowerShell Verification Dependencies Execution Module
# Part of the modular dependency system for reset-and-migrate.ps1
#
# Purpose: Manages the execution of dependencies with proper error handling
# This module provides functions for running dependencies and verifications,
# with caching and appropriate error handling.

# Import required modules for shared state and graph traversal
. "$PSScriptRoot\verification-dependencies-core.ps1"
. "$PSScriptRoot\verification-dependencies-graph.ps1"

# Function to run a dependency with enhanced caching
function Invoke-Dependency {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Name,
        
        [Parameter(Mandatory = $false)]
        [bool]$IgnoreErrors = $false,
        
        [Parameter(Mandatory = $false)]
        [bool]$Force = $false,
        
        [Parameter(Mandatory = $false)]
        [string]$CalledBy = "Unknown"
    )
    
    # Skip if already completed (unless forced)
    if (-not $Force -and (Test-DependencyCompleted -DependencyName $Name)) {
        Log-Message "Dependency '$Name' already completed (called by: $($script:completedDependenciesMap[$Name].CalledBy)), skipping" "Gray"
        
        # For backward compatibility
        if ($script:completedDependencies -notcontains $Name) {
            $script:completedDependencies += $Name
        }
        
        return $true
    }
    
    Log-Message "Running dependency: $Name" "Yellow"
    
    try {
        # Change to packages/content-migrations directory
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            # Execute the command and capture the exit code only
            Exec-Command -command "pnpm run $Name" -description "Running dependency: $Name" -continueOnError $IgnoreErrors
            $exitCode = $LASTEXITCODE
            
            if ($exitCode -eq 0) {
                # Register completed dependency with enhanced tracking
                Register-CompletedDependency -DependencyName $Name -CalledBy $CalledBy -Success $true
                
                # For backward compatibility
                if ($script:completedDependencies -notcontains $Name) {
                    $script:completedDependencies += $Name
                }
                
                Log-Success "Dependency '$Name' completed successfully (called by: $CalledBy)"
                Pop-Location
                return $true
            } else {
                if (-not $IgnoreErrors) {
                    Log-Warning "Dependency '$Name' failed with exit code $exitCode"
                    Pop-Location
                    return $false
                } else {
                    Log-Warning "Dependency '$Name' failed with exit code $exitCode but continuing as requested"
                    Pop-Location
                    return $false
                }
            }
        } else {
            Log-Warning "Could not change to packages/content-migrations directory"
            return $false
        }
    } catch {
        if (-not $IgnoreErrors) {
            Log-Error "Failed to run dependency '$Name': $_"
            return $false
        } else {
            Log-Warning "Failed to run dependency '$Name' but continuing as requested: $_"
            return $false
        }
    }
}

# Function to ensure all dependencies for a verification step are run
function Confirm-DependenciesRun {
    param (
        [Parameter(Mandatory = $true)]
        [string]$VerificationStep,
        
        [Parameter(Mandatory = $false)]
        [bool]$ContinueOnError = $false
    )
    
    Log-Message "Ensuring dependencies for verification step '$VerificationStep' are run..." "Yellow"
    
    $dependencies = Get-VerificationDependencies -VerificationStep $VerificationStep
    $allDependenciesRun = $true
    
    if ($dependencies.Count -eq 0) {
        Log-Message "No dependencies found for verification step '$VerificationStep'" "Gray"
        return $true
    }
    
    foreach ($dependency in $dependencies) {
        $depResult = Invoke-Dependency -Name $dependency -IgnoreErrors $ContinueOnError
        if (-not $depResult) {
            $allDependenciesRun = $false
            
            if (-not $ContinueOnError) {
                Log-Warning "Required dependency '$dependency' failed. Verification will be skipped."
                return $false
            }
        }
    }
    
    return $allDependenciesRun
}

# Function to run a verification with automatic dependency handling
function Invoke-VerificationWithDependencies {
    param (
        [Parameter(Mandatory = $true)]
        [string]$VerificationStep,
        
        [Parameter(Mandatory = $false)]
        [string]$Description = "Verifying with dependencies",
        
        [Parameter(Mandatory = $false)]
        [bool]$ContinueOnError = $false
    )
    
    Log-Message "Running verification step '$VerificationStep' with automatic dependency handling..." "Yellow"
    
    # First ensure all dependencies are run
    $dependenciesResult = Confirm-DependenciesRun -VerificationStep $VerificationStep -ContinueOnError $ContinueOnError
    
    if (-not $dependenciesResult -and -not $ContinueOnError) {
        Log-Error "Dependencies for verification step '$VerificationStep' failed to run. Skipping verification."
        return $false
    }
    
    # Now run the verification
    try {
        # Change to packages/content-migrations directory
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            # Execute the command and capture the exit code only
            Exec-Command -command "pnpm run $VerificationStep" -description $Description -continueOnError $ContinueOnError
            $exitCode = $LASTEXITCODE
            
            Pop-Location
            
            if ($exitCode -eq 0) {
                Log-Success "$VerificationStep verification passed with automatic dependency handling"
                return $true
            } else {
                Log-Warning "$VerificationStep verification failed even after running dependencies"
                return $false
            }
        } else {
            Log-Warning "Could not change to packages/content-migrations directory"
            return $false
        }
    } catch {
        Log-Error "Failed to run verification step '$VerificationStep': $_"
        return $false
    }
}

# Functions are automatically available when dot-sourced
# No need for Export-ModuleMember in PowerShell scripts
