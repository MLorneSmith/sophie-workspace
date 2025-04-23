# This script is a PowerShell wrapper to ensure the bunny video ID fix is integrated
# into the migration process properly.

Write-Host "Running Bunny Video ID fix integration script..." -ForegroundColor Cyan

# Set variables for path to SQL file
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFilePath = Join-Path $scriptPath "fix-bunny-video-ids.sql"

# Verify SQL file exists
if (-not (Test-Path $sqlFilePath)) {
    Write-Host "ERROR: SQL file not found at $sqlFilePath" -ForegroundColor Red
    exit 1
} else {
    Write-Host "SQL file found at $sqlFilePath" -ForegroundColor Green
}

# Get absolute path
$absoluteSqlFilePath = (Resolve-Path $sqlFilePath).Path
Write-Host "Absolute SQL file path: $absoluteSqlFilePath" -ForegroundColor Green

# Change to packages/content-migrations directory to use utilities
$currentDir = Get-Location
$contentMigrationsPath = Join-Path (Split-Path -Parent (Split-Path -Parent $scriptPath)) ""
Set-Location $contentMigrationsPath

# Run the SQL file using the project's utility
Write-Host "Executing SQL file directly with psql..." -ForegroundColor Cyan
pnpm run utils:run-sql-file "$absoluteSqlFilePath"

# Verify the update was successful
Write-Host "Verifying bunny_video_id values were set correctly..." -ForegroundColor Cyan
$checkCommand = 'pnpm run utils:run-sql "SELECT COUNT(*) AS updated_lessons FROM payload.course_lessons WHERE bunny_video_id IS NOT NULL;"'
Invoke-Expression $checkCommand

# Return to original directory
Set-Location $currentDir

Write-Host "Bunny Video ID fix integration script completed." -ForegroundColor Green
