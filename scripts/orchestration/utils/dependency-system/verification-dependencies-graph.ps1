# PowerShell Verification Dependencies Graph Module
# Part of the modular dependency system for reset-and-migrate.ps1
#
# Purpose: Handles all operations related to dependency graph traversal and resolution
# This module provides functions for traversing the dependency graph and resolving
# dependencies for verification steps.

# Import core module for shared state
. "$PSScriptRoot\verification-dependencies-core.ps1"

# Function to get all dependency names across all verification steps
function Get-AllDependencies {
    $allDeps = @()
    foreach ($verificationStep in $script:verificationDependencies.Keys) {
        $allDeps += $script:verificationDependencies[$verificationStep]
    }
    return $allDeps | Select-Object -Unique
}

# Function to get dependencies for a specific verification step
function Get-VerificationDependencies {
    param (
        [Parameter(Mandatory = $true)]
        [string]$VerificationStep
    )
    
    if ($script:verificationDependencies.ContainsKey($VerificationStep)) {
        return $script:verificationDependencies[$VerificationStep]
    } else {
        Log-Message "No dependencies found for verification step '$VerificationStep'" "Gray"
        return @()
    }
}

# Function to resolve a dependency graph for a verification step
# This determines the complete set of dependencies required
function Resolve-DependencyGraph {
    param (
        [Parameter(Mandatory = $true)]
        [string]$VerificationStep
    )
    
    Log-Message "Resolving dependency graph for '$VerificationStep'..." "Gray"
    
    # Get direct dependencies for this step
    $dependencies = Get-VerificationDependencies -VerificationStep $VerificationStep
    
    # In this simple version, we don't have nested dependencies yet
    # But this function provides a place to implement more complex resolution
    # in the future if needed
    
    return $dependencies
}

# Function to check if all dependencies for a verification step have been completed
function Test-DependenciesCompleted {
    param (
        [Parameter(Mandatory = $true)]
        [string]$VerificationStep
    )
    
    $dependencies = Get-VerificationDependencies -VerificationStep $VerificationStep
    $allCompleted = $true
    
    foreach ($dependency in $dependencies) {
        if ($script:completedDependencies -notcontains $dependency) {
            $allCompleted = $false
            break
        }
    }
    
    return $allCompleted
}

# Functions are automatically available when dot-sourced
# No need for Export-ModuleMember in PowerShell scripts
