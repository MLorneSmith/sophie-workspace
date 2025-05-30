# WSL and Docker Desktop Diagnostic and Fix Script
# This script diagnoses and fixes common WSL/Docker issues after updates

param(
    [switch]$Help,
    [switch]$Fix
)

if ($Help) {
    Write-Host @"
WSL and Docker Desktop Diagnostic and Fix Script

This script diagnoses and fixes common issues with WSL and Docker Desktop,
especially after WSL updates.

Usage:
  .\scripts\fix-wsl-docker.ps1 [-Fix] [-Help]

Options:
  -Fix     Automatically apply fixes (otherwise just diagnose)
  -Help    Show this help message

The script will:
1. Check WSL status and version
2. Check Docker Desktop status
3. Identify common issues
4. Apply fixes if -Fix parameter is used
"@
    exit 0
}

Write-Host "=== WSL and Docker Desktop Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check WSL Status
Write-Host "1. Checking WSL Status..." -ForegroundColor Yellow
try {
    $wslVersion = wsl --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   WSL Version Info:" -ForegroundColor Green
        $wslVersion | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "   ERROR: WSL not properly installed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ERROR: WSL command failed: $_" -ForegroundColor Red
}

Write-Host ""

# 2. Check WSL Distributions
Write-Host "2. Checking WSL Distributions..." -ForegroundColor Yellow
try {
    $wslList = wsl --list --verbose 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   WSL Distributions:" -ForegroundColor Green
        $wslList | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "   ERROR: Cannot list WSL distributions" -ForegroundColor Red
    }
} catch {
    Write-Host "   ERROR: WSL list command failed: $_" -ForegroundColor Red
}

Write-Host ""

# 3. Check Docker Desktop Process
Write-Host "3. Checking Docker Desktop..." -ForegroundColor Yellow
$dockerProcesses = Get-Process "*docker*" -ErrorAction SilentlyContinue
if ($dockerProcesses) {
    Write-Host "   Docker processes running:" -ForegroundColor Green
    $dockerProcesses | ForEach-Object { Write-Host "   - $($_.Name) (PID: $($_.Id))" -ForegroundColor Gray }
} else {
    Write-Host "   Docker Desktop is NOT running" -ForegroundColor Red
}

# 4. Test Docker Command
Write-Host ""
Write-Host "4. Testing Docker Command..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Docker CLI: $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: Docker CLI not working" -ForegroundColor Red
    }
} catch {
    Write-Host "   ERROR: Docker command failed: $_" -ForegroundColor Red
}

# 5. Check Windows Features
Write-Host ""
Write-Host "5. Checking Windows Features..." -ForegroundColor Yellow
$features = @("Microsoft-Windows-Subsystem-Linux", "VirtualMachinePlatform")
foreach ($feature in $features) {
    $status = Get-WindowsOptionalFeature -Online -FeatureName $feature -ErrorAction SilentlyContinue
    if ($status) {
        $state = $status.State
        $color = if ($state -eq "Enabled") { "Green" } else { "Red" }
        Write-Host "   $feature: $state" -ForegroundColor $color
    } else {
        Write-Host "   $feature: Not found" -ForegroundColor Red
    }
}

# 6. Recommendations and Fixes
Write-Host ""
Write-Host "6. Recommendations:" -ForegroundColor Yellow

$issues = @()
$fixes = @()

# Check if Docker Desktop is not running
if (-not $dockerProcesses) {
    $issues += "Docker Desktop is not running"
    $fixes += "Start Docker Desktop"
}

# Check if WSL distributions are stopped
if ($wslList -match "Stopped") {
    $issues += "WSL distributions are stopped"
    $fixes += "Restart WSL distributions"
}

if ($issues.Count -eq 0) {
    Write-Host "   No major issues detected!" -ForegroundColor Green
} else {
    Write-Host "   Issues found:" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
    
    Write-Host ""
    Write-Host "   Suggested fixes:" -ForegroundColor Cyan
    $fixes | ForEach-Object { Write-Host "   - $_" -ForegroundColor White }
}

# Apply fixes if requested
if ($Fix -and $issues.Count -gt 0) {
    Write-Host ""
    Write-Host "7. Applying Fixes..." -ForegroundColor Cyan
    
    # Fix 1: Restart WSL
    if ($wslList -match "Stopped") {
        Write-Host "   Restarting WSL..." -ForegroundColor Yellow
        wsl --shutdown
        Start-Sleep 3
        wsl -d Ubuntu echo "WSL restart test" 2>&1 | Out-Null
        Write-Host "   WSL restarted" -ForegroundColor Green
    }
    
    # Fix 2: Start Docker Desktop
    if (-not $dockerProcesses) {
        Write-Host "   Starting Docker Desktop..." -ForegroundColor Yellow
        $dockerPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $dockerPath) {
            Start-Process $dockerPath
            Write-Host "   Docker Desktop starting... (may take a minute)" -ForegroundColor Green
        } else {
            Write-Host "   ERROR: Docker Desktop not found at expected path" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "   Fixes applied. Please wait 1-2 minutes for services to start." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Diagnostic Complete ===" -ForegroundColor Cyan
