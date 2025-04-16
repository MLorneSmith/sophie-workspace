# Simple data migration script
# Import remote config to get the database URL
. "$PSScriptRoot\scripts\orchestration\utils\remote-config.ps1"

Write-Host "Running simplified data migration..." -ForegroundColor Yellow
# Use the URL directly without modification
$dbUrl = $env:REMOTE_DATABASE_URL
Write-Host "Using URL: $dbUrl"

# Go to web directory
Set-Location -Path "apps/web"

# Create a seed file if needed
Write-Host "Creating seed data file..." -ForegroundColor Yellow
if (-not (Test-Path -Path "supabase/seed.sql")) {
    Write-Host "No seed.sql file found. Creating one from database..." -ForegroundColor Yellow
    
    # Create a backup of existing data as seed
    & supabase db dump --data-only --schema public > supabase/seed.sql
    & supabase db dump --data-only --schema payload >> supabase/seed.sql
    
    Write-Host "Seed file created at supabase/seed.sql" -ForegroundColor Green
} else {
    Write-Host "Using existing seed.sql file" -ForegroundColor Yellow
}

# Push schema and data to remote
Write-Host "Pushing schema and data to remote database..." -ForegroundColor Yellow
& supabase db push --db-url $dbUrl --include-seed --include-roles

# Check result
if ($LASTEXITCODE -eq 0) {
    Write-Host "Data migration successful!" -ForegroundColor Green
    
    Write-Host "Running additional verification..." -ForegroundColor Yellow
    # Go to content-migrations directory
    Set-Location -Path "../../packages/content-migrations"
    
    # Set DATABASE_URI to remote for verification
    $originalDatabaseUri = $env:DATABASE_URI
    $env:DATABASE_URI = $env:REMOTE_DATABASE_URL
    
    # Verify data integrity
    Write-Host "Verifying data integrity on remote database..." -ForegroundColor Yellow
    & pnpm run verify:all
    
    # Restore original DATABASE_URI
    $env:DATABASE_URI = $originalDatabaseUri
    
    Write-Host "Data migration and verification completed" -ForegroundColor Green
} else {
    Write-Host "Data migration failed with code: $LASTEXITCODE" -ForegroundColor Red
}
