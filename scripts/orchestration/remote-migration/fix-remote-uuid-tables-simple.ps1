# Simplified UUID Table Management Script for Remote Supabase
# This script creates basic UUID pattern tables in the remote database

# Import remote config to get the database URL
. "$PSScriptRoot\..\utils\remote-config.ps1"

Write-Host "Starting simplified UUID table management for remote database..." -ForegroundColor Cyan
Write-Host "Using URL: $env:REMOTE_DATABASE_URL" -ForegroundColor Gray

# First, go to the web directory where supabase config exists
Push-Location -Path "apps/web"

# Create simple SQL script for UUID tables
$setupTrackingTableSQL = @"
-- Create tracking table for UUID tables
CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"@

# Ensure seed directory exists
$seedDir = "supabase/seed"
if (-not (Test-Path $seedDir)) {
    New-Item -ItemType Directory -Path $seedDir -Force | Out-Null
}

# Create seed file
$setupFile = Join-Path -Path $seedDir -ChildPath "uuid_setup.sql"
Set-Content -Path $setupFile -Value $setupTrackingTableSQL -Encoding UTF8

# Apply the setup script using Supabase CLI
Write-Host "Creating UUID table tracking system..." -ForegroundColor Yellow
Write-Host "Running: supabase db push --db-url=`"$env:REMOTE_DATABASE_URL`" --include-seed" -ForegroundColor Gray

$pushOutput = & supabase db push --db-url="$env:REMOTE_DATABASE_URL" --include-seed 2>&1
$pushSuccess = $LASTEXITCODE -eq 0

if ($pushSuccess) {
    Write-Host "✓ UUID table tracking system created successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create UUID table tracking system" -ForegroundColor Red
    Write-Host "Error: $pushOutput" -ForegroundColor Red
}

# Clean up seed file
Remove-Item -Path $setupFile -Force -ErrorAction SilentlyContinue

# Return to original directory
Pop-Location

if ($pushSuccess) {
    Write-Host "UUID table management completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "UUID table management failed." -ForegroundColor Red
    Write-Host "Try running: scripts/orchestration/remote-migration/migrate-schema.ps1 first" -ForegroundColor Yellow
    exit 1
}
