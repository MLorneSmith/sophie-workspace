# Simple test script for Supabase remote connection

# Set the database URL
$dbUrl = "postgresql://postgres:UcQ5TYC3Hdh0v5G0@db.2025slideheroes.supabase.co:5432/postgres"

Write-Host "===== SUPABASE CONNECTION TEST =====" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Step 1: Checking if Supabase CLI is installed..." -ForegroundColor Yellow
try {
    $version = & supabase --version
    Write-Host "Supabase CLI found: $version" -ForegroundColor Green
}
catch {
    Write-Host "Supabase CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Test basic connection using supabase commands
Write-Host ""
Write-Host "Step 2: Testing basic connection..." -ForegroundColor Yellow

# Create temp dir if it doesn't exist
$tempDir = Join-Path $env:TEMP "supabase-test"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Create a simple SQL test file
$testFile = Join-Path $tempDir "test.sql"
"SELECT 1 as connection_test;" | Out-File -FilePath $testFile

Write-Host "Testing connection using supabase db execute..." -ForegroundColor Yellow
Write-Host "Command: supabase db execute `"$testFile`" --db-url `"$dbUrl`"" -ForegroundColor Gray

& supabase db execute "$testFile" --db-url "$dbUrl"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Connection successful!" -ForegroundColor Green
}
else {
    Write-Host "Connection failed with exit code: $LASTEXITCODE" -ForegroundColor Red
}

# Cleanup
Remove-Item -Path $testFile -Force
Write-Host ""
Write-Host "Test completed." -ForegroundColor Cyan
