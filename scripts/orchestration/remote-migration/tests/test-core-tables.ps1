# test-core-tables.ps1
#
# Test script to run only the core tables migration
# This allows for targeted testing of the migration process

# Import the parent script
$parentScript = Join-Path -Path $PSScriptRoot -ChildPath "..\migrate-content-progressive.ps1"

# Display banner
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "         CORE TABLES MIGRATION TEST                 " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "This script will run only the core tables migration"
Write-Host "from the progressive migration script."
Write-Host "This is useful for testing the migration process."
Write-Host "====================================================" -ForegroundColor Cyan

# Run with specific parameters to run only core tables
& $parentScript -SkipDocumentation -SkipCourses -SkipQuizzes -SkipSurveys
