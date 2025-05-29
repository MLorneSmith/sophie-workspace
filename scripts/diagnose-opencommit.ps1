# OpenCommit Diagnostic Script
# This script helps diagnose OpenCommit issues

param(
    [switch]$Help
)

if ($Help) {
    Write-Host @"
OpenCommit Diagnostic Script

This script helps diagnose OpenCommit configuration and staging issues.

Usage:
  .\scripts\diagnose-opencommit.ps1 [-Help]

The script will:
1. Check OpenCommit installation and version
2. Display current configuration
3. Analyze staged changes
4. Test OpenCommit with a minimal change
5. Provide recommendations
"@
    exit 0
}

Write-Host "=== OpenCommit Diagnostic Report ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check OpenCommit installation
Write-Host "1. Checking OpenCommit Installation..." -ForegroundColor Yellow
try {
    $version = pnpm exec opencommit --version 2>$null
    Write-Host "   Version: $version" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: OpenCommit not found or not working" -ForegroundColor Red
    exit 1
}

# 2. Check configuration
Write-Host "`n2. Current Configuration:" -ForegroundColor Yellow
$configFile = "$env:USERPROFILE\.opencommit"
if (Test-Path $configFile) {
    Write-Host "   Configuration file found at: $configFile" -ForegroundColor Green
    Get-Content $configFile | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Gray
    }
} else {
    Write-Host "   No configuration file found" -ForegroundColor Red
}

# 3. Check staged changes
Write-Host "`n3. Analyzing Staged Changes..." -ForegroundColor Yellow
$stagedFiles = git diff --cached --name-only
if ($stagedFiles) {
    Write-Host "   Staged files:" -ForegroundColor Green
    foreach ($file in $stagedFiles) {
        Write-Host "   - $file" -ForegroundColor Gray
    }
    
    # Get diff stats
    $stats = git diff --cached --stat
    Write-Host "`n   Diff statistics:" -ForegroundColor Green
    Write-Host "   $stats" -ForegroundColor Gray
    
    # Check for large files
    $largeFiles = @()
    git diff --cached --numstat | ForEach-Object {
        $parts = $_ -split '\t'
        if ($parts[0] -match '^\d+$' -and [int]$parts[0] -gt 500) {
            $largeFiles += "$($parts[2]) ($($parts[0]) lines)"
        }
    }
    
    if ($largeFiles.Count -gt 0) {
        Write-Host "`n   WARNING: Large files detected:" -ForegroundColor Red
        foreach ($file in $largeFiles) {
            Write-Host "   - $file" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   No staged changes found" -ForegroundColor Red
}

# 4. Check .opencommitignore
Write-Host "`n4. Checking .opencommitignore..." -ForegroundColor Yellow
if (Test-Path ".opencommitignore") {
    Write-Host "   .opencommitignore file found" -ForegroundColor Green
    $ignoreCount = (Get-Content ".opencommitignore" | Where-Object { $_ -and $_ -notmatch '^#' }).Count
    Write-Host "   $ignoreCount ignore patterns configured" -ForegroundColor Gray
} else {
    Write-Host "   No .opencommitignore file found" -ForegroundColor Yellow
}

# 5. Environment check
Write-Host "`n5. Environment Check..." -ForegroundColor Yellow
if ($env:OPENAI_API_KEY) {
    Write-Host "   OPENAI_API_KEY: Set" -ForegroundColor Green
} else {
    Write-Host "   OPENAI_API_KEY: Not set (may be configured elsewhere)" -ForegroundColor Yellow
}

# 6. Recommendations
Write-Host "`n6. Recommendations:" -ForegroundColor Yellow

if ($stagedFiles) {
    $totalLines = 0
    git diff --cached --numstat | ForEach-Object {
        $parts = $_ -split '\t'
        if ($parts[0] -match '^\d+$') {
            $totalLines += [int]$parts[0]
        }
    }
    
    if ($totalLines -gt 1000) {
        Write-Host "   - SPLIT COMMIT: Too many changes ($totalLines lines)" -ForegroundColor Red
        Write-Host "     Use: .\scripts\split-commit.ps1" -ForegroundColor Gray
    } elseif ($totalLines -gt 500) {
        Write-Host "   - CAUTION: Large commit ($totalLines lines)" -ForegroundColor Yellow
        Write-Host "     Consider splitting or use manual commit" -ForegroundColor Gray
    } else {
        Write-Host "   - Commit size OK ($totalLines lines)" -ForegroundColor Green
    }
} else {
    Write-Host "   - Stage some changes first: git add <files>" -ForegroundColor Gray
}

Write-Host "`n7. Quick Fixes:" -ForegroundColor Yellow
Write-Host "   - Reset config: .\scripts\fix-opencommit.ps1" -ForegroundColor Gray
Write-Host "   - Safe commit: .\scripts\safe-commit.ps1" -ForegroundColor Gray
Write-Host "   - Split large commits: .\scripts\split-commit.ps1" -ForegroundColor Gray
Write-Host "   - Manual commit: git commit -m 'your message'" -ForegroundColor Gray

Write-Host "`n=== End Diagnostic Report ===" -ForegroundColor Cyan
