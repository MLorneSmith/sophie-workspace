# Script to clear lesson content fields in the database
# This helps fix issues with template tags showing as raw text
# This script can be called directly or as part of the migration process

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Get the directory of this script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Set location to script directory to ensure proper path resolution
Set-Location -Path $scriptDir

# Output information
Write-Host "Running lesson content clearing script..." -ForegroundColor Cyan
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray

# Run the TypeScript script using tsx
try {
    # Execute the script
    npx tsx ./src/scripts/repair/clear-lesson-content.ts
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to clear lesson content. Exit code: $LASTEXITCODE"
        exit $LASTEXITCODE
    }
    
    Write-Host "Successfully cleared lesson content fields" -ForegroundColor Green
} 
catch {
    Write-Error "An error occurred while clearing lesson content: $_"
    exit 1
}
