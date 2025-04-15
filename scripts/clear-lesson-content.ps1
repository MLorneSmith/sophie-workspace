# Script to clear lesson content fields in the database
# This helps fix issues with template tags showing as raw text

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Get the directory of this script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Navigate to the project root
$projectRoot = Split-Path -Parent $scriptDir
Set-Location -Path $projectRoot

# Output information
Write-Host "Running lesson content clearing script..."
Write-Host "Project root: $projectRoot"

# Run the TypeScript script using ts-node
try {
    # Execute the script
    npx ts-node -P ./packages/content-migrations/tsconfig.json ./packages/content-migrations/src/scripts/repair/clear-lesson-content.ts
    
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
