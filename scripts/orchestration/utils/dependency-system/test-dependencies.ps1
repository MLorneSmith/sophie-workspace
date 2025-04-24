# Test script for modular dependency system
# This script demonstrates the basic functionality of the dependency system
# and can be used to verify that it works as expected.

# Change to the directory containing this script
Set-Location $PSScriptRoot

# Import the main module
. "$PSScriptRoot\verification-dependencies-optimized.ps1"

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "TESTING MODULAR DEPENDENCY SYSTEM" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

# Initialize the dependency system
Initialize-DependencySystem

# Get a list of all dependencies
$allDeps = Get-AllDependencies
Write-Host "Total dependencies defined: $($allDeps.Count)" -ForegroundColor Yellow

# Show dependency information for a specific verification step
Write-Host "`nDependencies for verify:todo-fields:" -ForegroundColor Yellow
$todoDeps = Get-VerificationDependencies -VerificationStep "verify:todo-fields"
foreach ($dep in $todoDeps) {
    Write-Host "  - $dep" -ForegroundColor Gray
}

# Show the dependency graph
Write-Host "`nDependency Graph:" -ForegroundColor Yellow
Show-DependencyGraph

# Simulate running a dependency
$script:completedDependencies += "sql:ensure-todo-column"
$script:completedDependencies += "fix:todo-fields"

Write-Host "`nAfter running some dependencies:" -ForegroundColor Yellow
Show-DependencyReport

# Show verification step status
Write-Host "`nVerification Step Status:" -ForegroundColor Yellow
Show-VerificationStepStatus

# Test the dependency graph
Write-Host "`nValidating Dependency Graph:" -ForegroundColor Yellow
Test-DependencyGraph

# Generate full report
Write-Host "`nGenerating Full Dependency System Report:" -ForegroundColor Yellow
Get-DependencySystemReport -IncludeValidation

Write-Host "`nTest completed successfully!" -ForegroundColor Green
