# PowerShell script to generate lesson enhancement files
$ErrorActionPreference = "Stop"

Write-Host "Generating Lesson Enhancement Files" -ForegroundColor Cyan

# Install js-yaml dependency if needed
Write-Host "Checking for required dependencies..." -ForegroundColor Yellow
$ymlInstalled = (npm list js-yaml --json) | ConvertFrom-Json -ErrorAction SilentlyContinue
if (-not $ymlInstalled.dependencies.'js-yaml') {
    Write-Host "Installing js-yaml dependency..." -ForegroundColor Yellow
    npm install --save-dev js-yaml
}

# Run the CommonJS script to generate files
Write-Host "Running file generation script..." -ForegroundColor Green
node generate-files.cjs

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Files generated successfully!" -ForegroundColor Green
    
    # Check if the migration file exists
    $migrationFile = Join-Path -Path "../../apps/payload/src/seed/sql" -ChildPath "08-lesson-enhancements.sql"
    if (Test-Path $migrationFile) {
        Write-Host "`nSQL file successfully created at: $migrationFile" -ForegroundColor Green
        Write-Host "`nTo complete the implementation:" -ForegroundColor Cyan
        Write-Host "1. Run the database migration: .\reset-and-migrate.ps1" -ForegroundColor White
        Write-Host "2. Verify that the data has been imported correctly in the Payload CMS admin" -ForegroundColor White
        Write-Host "3. Check that the frontend components render correctly" -ForegroundColor White
    } else {
        Write-Host "`n⚠️ SQL file not copied to the correct location. You may need to manually copy it." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Failed to generate files. Check for errors above." -ForegroundColor Red
}
