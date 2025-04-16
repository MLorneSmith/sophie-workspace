# Basic UUID Table Setup Script
# Only creates the basic tracking table

# Import remote config
. "$PSScriptRoot\..\utils\remote-config.ps1"

Write-Host "Setting up UUID tracking tables..." -ForegroundColor Cyan

# Go to web directory where supabase.json is
Push-Location -Path "apps/web"

# Create SQL for tracking table
$sql = "CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (id SERIAL PRIMARY KEY, table_name TEXT NOT NULL UNIQUE);"

# Create seed directory if needed
$seedDir = "supabase/seed"
if (-not (Test-Path $seedDir)) {
    New-Item -ItemType Directory -Path $seedDir -Force | Out-Null
}

# Create seed file
$seedFile = Join-Path -Path $seedDir -ChildPath "uuid_table.sql"
Set-Content -Path $seedFile -Value $sql

# Run the push command
Write-Host "Running: supabase db push --db-url=`"$env:REMOTE_DATABASE_URL`" --include-seed" -ForegroundColor Gray
$output = supabase db push --db-url="$env:REMOTE_DATABASE_URL" --include-seed

# Check result
if ($LASTEXITCODE -eq 0) {
    Write-Host "UUID tracking table setup successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to setup UUID tracking table" -ForegroundColor Red
}

# Clean up
Remove-Item -Path $seedFile -Force -ErrorAction SilentlyContinue
Pop-Location

# Return exit code
exit $LASTEXITCODE
