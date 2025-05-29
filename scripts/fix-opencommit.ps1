# Fix OpenCommit Hanging Issues
# This script configures OpenCommit to handle large commits better

Write-Host "🔧 Fixing OpenCommit Configuration..." -ForegroundColor Cyan

# Set more conservative token limits
Write-Host "Setting token limits..." -ForegroundColor Yellow
pnpm exec opencommit config set OCO_TOKENS_MAX_INPUT=20000
pnpm exec opencommit config set OCO_TOKENS_MAX_OUTPUT=2048

# Use a faster, more reliable model
Write-Host "Setting model to GPT-4o-mini for speed..." -ForegroundColor Yellow
pnpm exec opencommit config set OCO_MODEL=gpt-4o-mini

# Enable one-line commits for large changes
Write-Host "Enabling one-line commits..." -ForegroundColor Yellow
pnpm exec opencommit config set OCO_ONE_LINE_COMMIT=true

# Disable descriptions for faster processing
Write-Host "Disabling descriptions for speed..." -ForegroundColor Yellow
pnpm exec opencommit config set OCO_DESCRIPTION=false

# Set timeout-friendly settings
Write-Host "Setting timeout-friendly options..." -ForegroundColor Yellow
pnpm exec opencommit config set OCO_EMOJI=false
pnpm exec opencommit config set OCO_WHY=false

Write-Host "✅ OpenCommit configuration updated!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Current Configuration:" -ForegroundColor Cyan
Write-Host "- Model: gpt-4o-mini (faster)" -ForegroundColor White
Write-Host "- Max Input Tokens: 20,000 (reduced)" -ForegroundColor White
Write-Host "- Max Output Tokens: 2,048 (reduced)" -ForegroundColor White
Write-Host "- One-line commits: enabled" -ForegroundColor White
Write-Host "- Descriptions: disabled" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips for avoiding hangs:" -ForegroundColor Yellow
Write-Host "1. Keep commits under 1,000 lines of changes" -ForegroundColor White
Write-Host "2. Exclude large files with .opencommitignore" -ForegroundColor White
Write-Host "3. Split large commits using scripts/split-commit.ps1" -ForegroundColor White
Write-Host "4. Use manual commits for very large changes" -ForegroundColor White
