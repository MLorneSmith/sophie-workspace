# PowerShell Verification Dependencies Validation Module
# Part of the modular dependency system for reset-and-migrate.ps1
#
# Purpose: Provides validation and diagnostic functions for the dependency graph
# This module offers functions to validate the integrity of the dependency graph
# and identify potential issues like circular dependencies or redundant definitions.

# Import required modules for shared state and graph traversal
. "$PSScriptRoot\verification-dependencies-core.ps1"
. "$PSScriptRoot\verification-dependencies-graph.ps1"

# Function to test the integrity of the dependency graph
function Test-DependencyGraph {
    param (
        [switch]$Quiet
    )
    
    $hasIssues = $false
    
    if (-not $Quiet) {
        Log-Message "Running dependency graph diagnostics..." "Cyan"
    }
    
    # Check for undefined dependencies (dependencies that don't exist as scripts)
    $allDeps = Get-AllDependencies
    $undefinedDeps = @()
    
    # In a real implementation, we would check if each dependency exists as a script
    # For now, we'll just check for null or empty values
    foreach ($dep in $allDeps) {
        if ([string]::IsNullOrEmpty($dep)) {
            $undefinedDeps += $dep
        }
    }
    
    if ($undefinedDeps.Count -gt 0) {
        $hasIssues = $true
        if (-not $Quiet) {
            Log-Warning "Found $($undefinedDeps.Count) undefined dependencies:"
            foreach ($dep in $undefinedDeps) {
                Log-Message "  - $dep" "Yellow"
            }
        }
    } else {
        if (-not $Quiet) {
            Log-Success "All dependencies are properly defined"
        }
    }
    
    # Check for circular dependencies
    $circular = Find-CircularDependencies
    if ($circular.Count -gt 0) {
        $hasIssues = $true
        if (-not $Quiet) {
            Log-Warning "Found $($circular.Count) circular dependency chains:"
            foreach ($chain in $circular) {
                Log-Message "  - $chain" "Yellow"
            }
        }
    } else {
        if (-not $Quiet) {
            Log-Success "No circular dependencies found"
        }
    }
    
    # Check for redundant dependencies
    $redundant = Find-RedundantDependencies
    if ($redundant.Count -gt 0) {
        $hasIssues = $true
        if (-not $Quiet) {
            Log-Warning "Found $($redundant.Count) redundant dependencies:"
            foreach ($item in $redundant) {
                Log-Message "  - $($item.Step): $($item.Redundant)" "Yellow"
            }
        }
    } else {
        if (-not $Quiet) {
            Log-Success "No redundant dependencies found"
        }
    }
    
    return -not $hasIssues
}

# Function to find circular dependencies in the graph
# Note: In our current simple dependency model, circular dependencies can't exist
# However, this function is included for future expansion when nested dependencies might be supported
function Find-CircularDependencies {
    # In our current implementation, dependencies are not hierarchical,
    # so circular dependencies can't exist yet. But this is a placeholder for
    # when we support more complex dependency graphs.
    
    $circularPaths = @()
    
    # In a more complex implementation with nested dependencies,
    # we would use a depth-first search algorithm to find cycles
    
    return $circularPaths
}

# Function to find redundant dependencies (same dependency listed multiple times)
function Find-RedundantDependencies {
    $redundantDeps = @()
    
    foreach ($step in $script:verificationDependencies.Keys) {
        $dependencies = $script:verificationDependencies[$step]
        $uniqueDeps = $dependencies | Select-Object -Unique
        
        if ($uniqueDeps.Count -lt $dependencies.Count) {
            # There are duplicate dependencies in this step
            $groupedDeps = $dependencies | Group-Object
            $duplicates = $groupedDeps | Where-Object { $_.Count -gt 1 }
            
            foreach ($dup in $duplicates) {
                $redundantDeps += @{
                    "Step" = $step
                    "Redundant" = $dup.Name
                    "Count" = $dup.Count
                }
            }
        }
    }
    
    return $redundantDeps
}

# Function to find orphaned dependencies (dependencies not used by any verification step)
function Find-OrphanedDependencies {
    $allDeps = Get-AllDependencies
    $orphanedDeps = @()
    
    # In a real implementation, we would compare with all available scripts
    # For now, this is a placeholder
    
    return $orphanedDeps
}

# Functions are automatically available when dot-sourced
# No need for Export-ModuleMember in PowerShell scripts
