# PowerShell script to run reset-and-migrate.ps1 with a more unique timestamp
# This script helps avoid file access conflicts when running migrations

# Get a more unique timestamp with milliseconds
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss-fff"

# Create environment variable to pass the timestamp to the reset-and-migrate.ps1 script
$env:MIGRATION_TIMESTAMP = $timestamp

# Wait a moment to ensure any previous processes have released file handles
Start-Sleep -Seconds 2

# Run the reset-and-migrate.ps1 script
Write-Host "Running reset-and-migrate.ps1 with timestamp: $timestamp" -ForegroundColor Cyan
..\reset-and-migrate.ps1
