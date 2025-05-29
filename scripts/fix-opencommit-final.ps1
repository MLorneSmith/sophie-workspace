# Final OpenCommit Fix Script
# This script applies all the fixes we discovered

Write-Host "=== OpenCommit Final Fix Script ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Fixing OpenCommit Configuration..." -ForegroundColor Yellow

# Fix the invalid model name (this was the main issue!)
Write-Host "   Setting valid model: gpt-4o-mini" -ForegroundColor Green
pnpm exec opencommit config set OCO_MODEL=gpt-4o-mini

# Set adequate token limits
Write-Host "   Setting adequate token limits" -ForegroundColor Green
pnpm exec opencommit config set OCO_TOKENS_MAX_INPUT=16000
pnpm exec opencommit config set OCO_TOKENS_MAX_OUTPUT=2048

# Clear undefined API URL
Write-Host "   Clearing undefined API URL" -ForegroundColor Green
pnpm exec opencommit config set OCO_API_URL=""

# Optimize for speed and reliability
Write-Host "   Optimizing for speed" -ForegroundColor Green
pnpm exec opencommit config set OCO_ONE_LINE_COMMIT=true
pnpm exec opencommit config set OCO_DESCRIPTION=false
pnpm exec opencommit config set OCO_EMOJI=false
pnpm exec opencommit config set OCO_WHY=false

Write-Host ""
Write-Host "2. Current Configuration:" -ForegroundColor Yellow
if (Test-Path "$env:USERPROFILE\.opencommit") {
    Get-Content "$env:USERPROFILE\.opencommit" | ForEach-Object {
        if ($_ -match "OCO_MODEL|OCO_TOKENS|OCO_API_URL") {
            Write-Host "   $_" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "3. Testing OpenCommit..." -ForegroundColor Yellow

# Create a simple test file
$testContent = "Test file created at $(Get-Date)"
$testFile = "opencommit-test-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
Set-Content -Path $testFile -Value $testContent

# Stage and test
git add $testFile
Write-Host "   Created and staged test file: $testFile" -ForegroundColor Gray

Write-Host "   Running OpenCommit test..." -ForegroundColor Gray
$testResult = pnpm exec opencommit --yes 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   SUCCESS: OpenCommit is working!" -ForegroundColor Green
    Write-Host "   Test commit created successfully" -ForegroundColor Green
} else {
    Write-Host "   FAILED: OpenCommit still has issues" -ForegroundColor Red
    Write-Host "   Error: $testResult" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Fix Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Key Fixes Applied:" -ForegroundColor Yellow
Write-Host "- Fixed invalid model name (gpt-4.1-mini -> gpt-4o-mini)" -ForegroundColor White
Write-Host "- Increased token limits (3000 -> 16000 input)" -ForegroundColor White
Write-Host "- Cleared undefined API URL" -ForegroundColor White
Write-Host "- Optimized settings for speed and reliability" -ForegroundColor White
Write-Host ""
Write-Host "OpenCommit should now work reliably for normal-sized commits!" -ForegroundColor Green
