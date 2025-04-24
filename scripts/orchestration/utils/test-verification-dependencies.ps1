# Test script for verification dependencies parameter handling

# Import the verification dependencies module
. "$PSScriptRoot\verification-dependencies.ps1"

Write-Host "Testing Run-VerificationWithDependencies with switch parameter..." -ForegroundColor Cyan

# Define a mock function to check parameter values
function Invoke-VerificationWithDependencies {
    param (
        [string]$VerificationStep,
        [string]$Description,
        [bool]$ContinueOnError
    )
    
    Write-Host "Received parameters:" -ForegroundColor Yellow
    Write-Host "  VerificationStep: $VerificationStep" -ForegroundColor White
    Write-Host "  Description: $Description" -ForegroundColor White
    Write-Host "  ContinueOnError: $ContinueOnError (Type: $($ContinueOnError.GetType().Name))" -ForegroundColor White
    
    return $true
}

# Test 1: Without the switch parameter
Write-Host "`nTest 1: Without the switch parameter" -ForegroundColor Green
Run-VerificationWithDependencies -VerificationStep "test:step" -Description "Test description"

# Test 2: With the switch parameter
Write-Host "`nTest 2: With the switch parameter" -ForegroundColor Green
Run-VerificationWithDependencies -VerificationStep "test:step" -Description "Test description" -ContinueOnError

Write-Host "`nTests completed." -ForegroundColor Cyan
