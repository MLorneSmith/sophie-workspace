# Setup git configuration for Windows PowerShell environment

Write-Host "🪟 Configuring git for Windows environment" -ForegroundColor Cyan
git config core.autocrlf true
Write-Host "✅ Git configured for Windows: autocrlf=true" -ForegroundColor Green

Write-Host ""
Write-Host "Current git configuration:" -ForegroundColor Yellow
Write-Host "  core.autocrlf: $(git config core.autocrlf)"
$eol = git config core.eol
if ($eol) {
    Write-Host "  core.eol: $eol"
} else {
    Write-Host "  core.eol: (not set)"
}