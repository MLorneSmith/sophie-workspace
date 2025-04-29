# Quiz System Repair Script - Full Repair Implementation
# This script repairs relationships between quizzes and questions
# Path: scripts/orchestration/phases/quiz-system-repair.ps1

# Function to run the comprehensive Quiz System Repair 
function Invoke-QuizSystemRepair {
    param (
        [switch]$Verbose,
        [switch]$ContinueOnError
    )

    $ErrorActionPreference = "Stop"
    $scriptStartTime = Get-Date
    
    if ($Verbose) {
        Write-Host "Starting Quiz System Repair at $scriptStartTime" -ForegroundColor Cyan
    }

# Source the utils script for common functions
# Commented out since paths.ps1 doesn't exist
# . $PSScriptRoot\..\utils\paths.ps1

# Environment check
if (!(Test-Path ".env")) {
    Write-Host "No .env file found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

# Run the diagnostic first to identify issues
Write-Host "Running quiz relationship integrity diagnostic..." -ForegroundColor Cyan
pnpm --filter @kit/content-migrations diagnostic:quiz-integrity
if ($LASTEXITCODE -ne 0) {
    Write-Host "Quiz relationship diagnostic found issues to repair." -ForegroundColor Yellow
} else {
    Write-Host "Quiz relationship diagnostic completed successfully." -ForegroundColor Green
}

# Run the verification and repair script
Write-Host "Running quiz relationship integrity verification and repair..." -ForegroundColor Cyan
pnpm --filter @kit/content-migrations verify:quiz-relationship-integrity
if ($LASTEXITCODE -ne 0) {
    Write-Host "Quiz relationship repair encountered some issues but made progress." -ForegroundColor Yellow
} else {
    Write-Host "Quiz relationship repair completed successfully." -ForegroundColor Green
}

# Double-check with another verification run
Write-Host "Running final quiz relationship integrity verification..." -ForegroundColor Cyan
pnpm --filter @kit/content-migrations diagnostic:quiz-integrity
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Some quiz relationship issues may remain." -ForegroundColor Yellow
} else {
    Write-Host "✅ Quiz relationship integrity verification successful." -ForegroundColor Green
}

# Calculate execution time
$scriptEndTime = Get-Date
$executionTime = $scriptEndTime - $scriptStartTime
Write-Host "Quiz System Repair completed in $($executionTime.TotalSeconds) seconds" -ForegroundColor Cyan

# Return success status based on verification result
if ($LASTEXITCODE -eq 0) {
    return $true
} else {
    if ($ContinueOnError) {
        return $false
    } else {
        throw "Quiz System Repair failed with exit code $LASTEXITCODE"
    }
}
}
