# PowerShell script to test download import functionality
# This will run the import-downloads.ts script and show the generated SQL file

Write-Host "Testing download import functionality..." -ForegroundColor Cyan

# Create output directory if it doesn't exist
$outputDir = Join-Path -Path $PSScriptRoot -ChildPath "sql-output"
if (-not (Test-Path -Path $outputDir)) {
    New-Item -Path $outputDir -ItemType Directory | Out-Null
    Write-Host "Created output directory: $outputDir" -ForegroundColor Green
}

# Change to the content-migrations directory
Push-Location -Path $PSScriptRoot
Write-Host "Working directory: $(Get-Location)" -ForegroundColor Gray

# Run the import script using the script defined in package.json
Write-Host "Running download import script..." -ForegroundColor Yellow
pnpm run generate:downloads-sql

# Check if the SQL file was generated
$sqlFile = Join-Path -Path $outputDir -ChildPath "import-downloads.sql"
if (Test-Path -Path $sqlFile) {
    Write-Host "SQL file was generated successfully: $sqlFile" -ForegroundColor Green
    
    # Show file info
    $fileInfo = Get-Item -Path $sqlFile
    Write-Host "File size: $($fileInfo.Length) bytes" -ForegroundColor Gray
    Write-Host "Last modified: $($fileInfo.LastWriteTime)" -ForegroundColor Gray
    
    # Show the first few lines of the SQL file
    Write-Host "`nPreview of SQL file content:" -ForegroundColor Cyan
    Get-Content -Path $sqlFile -TotalCount 20 | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Gray
    }
    
    Write-Host "`nTo run this SQL file against your database, use:" -ForegroundColor Yellow
    Write-Host "psql -U postgres -d your_database -f `"$sqlFile`"" -ForegroundColor Yellow
} else {
    Write-Host "Error: SQL file was not generated" -ForegroundColor Red
    exit 1
}

# Return to original directory
Pop-Location

Write-Host "`nTest completed successfully!" -ForegroundColor Green
