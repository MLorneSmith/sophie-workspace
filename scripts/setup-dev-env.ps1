# Complete development environment setup for Windows PowerShell

Write-Host "🚀 Setting up Windows development environment for 2025slideheroes" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Setup git configuration
Write-Host "1️⃣ Configuring git for Windows..." -ForegroundColor Yellow
& "$PSScriptRoot\setup-git-env.ps1"

# 2. Check if we need to clean node_modules
Write-Host ""
Write-Host "2️⃣ Checking node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    $response = Read-Host "   Found existing node_modules. Remove and reinstall for Windows? (recommended) [Y/n]"
    if ($response -eq '' -or $response -match '^[Yy]') {
        Write-Host "   Cleaning node_modules..." -ForegroundColor Gray
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        Get-ChildItem -Path "apps" -Directory | ForEach-Object {
            Remove-Item -Recurse -Force "$($_.FullName)\node_modules" -ErrorAction SilentlyContinue
        }
        Get-ChildItem -Path "packages" -Directory | ForEach-Object {
            Remove-Item -Recurse -Force "$($_.FullName)\node_modules" -ErrorAction SilentlyContinue
        }
        Write-Host "   ✅ Cleaned node_modules" -ForegroundColor Green
    }
} else {
    Write-Host "   No existing node_modules found" -ForegroundColor Gray
}

# 3. Install dependencies
Write-Host ""
Write-Host "3️⃣ Installing dependencies with pnpm..." -ForegroundColor Yellow
pnpm install

# 4. Check Docker Desktop status
Write-Host ""
Write-Host "4️⃣ Checking Docker status..." -ForegroundColor Yellow
try {
    $dockerRunning = docker ps 2>$null
    if ($?) {
        if ($dockerRunning -match "supabase_db_2025slideheroes-db") {
            Write-Host "   ✅ Supabase Docker containers are running" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Docker is running but Supabase containers are not found" -ForegroundColor DarkYellow
            Write-Host "   Run 'docker-compose up -d' in your Supabase directory" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   ❌ Docker Desktop is not running" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop" -ForegroundColor Gray
}

# 5. Create .env.local if needed
Write-Host ""
Write-Host "5️⃣ Checking environment files..." -ForegroundColor Yellow
$envLocalPath = "apps\payload\.env.local"
if (!(Test-Path $envLocalPath)) {
    Write-Host "   Creating .env.local for Windows development..." -ForegroundColor Gray
    @"
# Windows-specific environment overrides
# This file is gitignored and specific to your Windows environment

# Add any Windows-specific overrides here
# For example, if you need different paths or settings
"@ | Out-File -FilePath $envLocalPath -Encoding UTF8
    Write-Host "   ✅ Created $envLocalPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Windows development environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run 'pnpm dev' to start all development servers"
Write-Host "  2. Or 'pnpm --filter payload dev' to start just Payload"
Write-Host ""
Write-Host "To switch to WSL development:" -ForegroundColor Gray
Write-Host "  - Open WSL terminal" -ForegroundColor Gray
Write-Host "  - Run: ./scripts/setup-dev-env.sh" -ForegroundColor Gray