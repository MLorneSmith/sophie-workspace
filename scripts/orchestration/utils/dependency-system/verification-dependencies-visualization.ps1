# PowerShell Verification Dependencies Visualization Module
# Part of the modular dependency system for reset-and-migrate.ps1
#
# Purpose: Provides visualization and reporting of dependency graphs and execution status
# This module offers functions to display the dependency graph and generate execution reports.

# Import required modules for shared state and graph traversal
. "$PSScriptRoot\verification-dependencies-core.ps1"
. "$PSScriptRoot\verification-dependencies-graph.ps1"

# Function to visualize the dependency graph
function Show-DependencyGraph {
    Log-Message "Dependency Graph Visualization:" "Cyan"
    
    foreach ($verificationStep in $script:verificationDependencies.Keys | Sort-Object) {
        Log-Message "Verification step: $verificationStep" "Yellow"
        $dependencies = $script:verificationDependencies[$verificationStep]
        
        foreach ($dependency in $dependencies) {
            $status = if ($script:completedDependencies -contains $dependency) { "[DONE]" } else { "[    ]" }
            Log-Message "  $status $dependency" "Gray"
        }
        
        Log-Message "" "White"
    }
}

# Function to show dependency report
function Show-DependencyReport {
    Log-Message "Dependency Execution Report:" "Cyan"
    
    $completed = $script:completedDependencies | Sort-Object
    foreach ($dep in $completed) {
        Log-Message "  - $dep - Completed" "Green"
    }
    
    $allDeps = Get-AllDependencies | Sort-Object
    $pending = $allDeps | Where-Object { $completed -notcontains $_ }
    foreach ($dep in $pending) {
        Log-Message "  - $dep - Not run" "Gray"
    }
    
    Log-Message "Total dependencies: $($allDeps.Count), Completed: $($completed.Count), Pending: $($pending.Count)" "Cyan"
}

# Function to create a visual representation of the dependency tree
function Show-DependencyTree {
    param (
        [string]$VerificationStep,
        [int]$Level = 0
    )
    
    if (-not $script:verificationDependencies.ContainsKey($VerificationStep)) {
        Log-Warning "Verification step '$VerificationStep' not found in dependency map"
        return
    }
    
    $indent = "  " * $Level
    Log-Message "$indent+ $VerificationStep" "Yellow"
    
    $dependencies = $script:verificationDependencies[$VerificationStep]
    
    foreach ($dependency in $dependencies) {
        $status = if ($script:completedDependencies -contains $dependency) { "[DONE]" } else { "[PEND]" }
        $indent = "  " * ($Level + 1)
        Log-Message "$indent$status $dependency" "Gray"
    }
}

# Function to generate a Mermaid graph representation of dependencies
# This can be useful for documentation or debugging
function Get-MermaidDependencyGraph {
    $output = @"
graph TD;
"@

    foreach ($verificationStep in $script:verificationDependencies.Keys) {
        $dependencies = $script:verificationDependencies[$verificationStep]
        
        foreach ($dependency in $dependencies) {
            $output += "`n    $dependency --> $verificationStep;"
        }
    }
    
    return $output
}

# Function to show concise status of all verification steps
function Show-VerificationStepStatus {
    Log-Message "Verification Step Status:" "Cyan"
    
    foreach ($step in $script:verificationDependencies.Keys | Sort-Object) {
        $dependencies = $script:verificationDependencies[$step]
        $completedDeps = $dependencies | Where-Object { $script:completedDependencies -contains $_ }
        $percentage = if ($dependencies.Count -gt 0) { 
            [math]::Round(($completedDeps.Count / $dependencies.Count) * 100) 
        } else { 
            100 
        }
        
        $statusColor = if ($percentage -eq 100) { "Green" } elseif ($percentage -gt 50) { "Yellow" } else { "Red" }
        
        Log-Message "  $step - Dependencies: $($completedDeps.Count)/$($dependencies.Count) ($percentage%)" $statusColor
    }
}

# Functions are automatically available when dot-sourced
# No need for Export-ModuleMember in PowerShell scripts
