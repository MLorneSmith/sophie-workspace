# Split Large Commits Script
# This script helps split large commits into smaller, logical chunks for OpenCommit

param(
    [switch]$DryRun,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Split Large Commits Script

This script helps you split large commits into smaller, logical chunks that work better with OpenCommit.

Usage:
  .\scripts\split-commit.ps1 [-DryRun] [-Help]

Options:
  -DryRun    Show what would be done without actually doing it
  -Help      Show this help message

The script will:
1. Identify large files in your staged changes
2. Suggest logical groupings for commits
3. Help you commit them in smaller chunks
"@
    exit 0
}

Write-Host "🔍 Analyzing staged changes..." -ForegroundColor Cyan

# Get staged files with their sizes
$stagedFiles = git diff --cached --name-only
$largeFiles = @()
$normalFiles = @()

foreach ($file in $stagedFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        $lines = (git diff --cached --numstat $file | ForEach-Object { ($_ -split '\t')[0] })
        
        if ($lines -match '^\d+$' -and [int]$lines -gt 1000) {
            $largeFiles += @{
                File = $file
                Lines = [int]$lines
                Size = $size
            }
        } else {
            $normalFiles += $file
        }
    }
}

Write-Host "`n📊 Analysis Results:" -ForegroundColor Yellow
Write-Host "Large files (>1000 lines): $($largeFiles.Count)" -ForegroundColor Red
Write-Host "Normal files: $($normalFiles.Count)" -ForegroundColor Green

if ($largeFiles.Count -gt 0) {
    Write-Host "`n🚨 Large Files Detected:" -ForegroundColor Red
    foreach ($file in $largeFiles) {
        Write-Host "  📄 $($file.File) - $($file.Lines) lines" -ForegroundColor Yellow
    }
    
    Write-Host "`n💡 Recommendations:" -ForegroundColor Cyan
    Write-Host "1. Commit large files separately (especially migrations)" -ForegroundColor White
    Write-Host "2. Use descriptive commit messages for each logical group" -ForegroundColor White
    Write-Host "3. Consider if large files can be excluded from OpenCommit" -ForegroundColor White
}

# Suggest commit groups
Write-Host "`n📝 Suggested Commit Groups:" -ForegroundColor Cyan

$groups = @{
    "Migrations" = @()
    "Configuration" = @()
    "Source Code" = @()
    "Documentation" = @()
    "Other" = @()
}

foreach ($file in ($largeFiles + $normalFiles)) {
    $fileName = if ($file -is [hashtable]) { $file.File } else { $file }
    
    if ($fileName -match "migration|\.json$") {
        $groups["Migrations"] += $fileName
    } elseif ($fileName -match "config|\.config\.|\.env") {
        $groups["Configuration"] += $fileName
    } elseif ($fileName -match "\.(ts|js|tsx|jsx)$") {
        $groups["Source Code"] += $fileName
    } elseif ($fileName -match "\.(md|txt|rst)$") {
        $groups["Documentation"] += $fileName
    } else {
        $groups["Other"] += $fileName
    }
}

$groupNumber = 1
foreach ($groupName in $groups.Keys) {
    if ($groups[$groupName].Count -gt 0) {
        Write-Host "`n$groupNumber. $groupName ($($groups[$groupName].Count) files):" -ForegroundColor Green
        foreach ($file in $groups[$groupName]) {
            Write-Host "   - $file" -ForegroundColor Gray
        }
        $groupNumber++
    }
}

Write-Host "`n🛠️  Next Steps:" -ForegroundColor Cyan
Write-Host "1. Reset your current staging: git reset" -ForegroundColor White
Write-Host "2. Stage files by group: git add <files>" -ForegroundColor White
Write-Host "3. Commit each group: pnpm exec opencommit" -ForegroundColor White
Write-Host "4. Repeat for each group" -ForegroundColor White

if (-not $DryRun) {
    Write-Host "`n❓ Would you like to start the interactive commit process? (y/n): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "`n🚀 Starting interactive commit process..." -ForegroundColor Green
        Write-Host "First, let's reset the staging area..." -ForegroundColor Cyan
        git reset
        
        Write-Host "`nNow you can stage files by group and commit them one by one." -ForegroundColor Green
        Write-Host "Example: git add apps/payload/src/migrations/*.json && pnpm exec opencommit" -ForegroundColor Gray
    }
}
