# Safe OpenCommit Wrapper
# This script runs OpenCommit with a timeout to prevent hanging

param(
    [int]$TimeoutSeconds = 60,
    [string]$Context = "",
    [switch]$Yes,
    [switch]$AutoSplit,
    [int]$MaxLines = 500,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Safe OpenCommit Wrapper

This script runs OpenCommit with a timeout to prevent hanging.

Usage:
  .\scripts\safe-commit.ps1 [-TimeoutSeconds 60] [-Context "description"] [-Yes] [-AutoSplit] [-MaxLines 500] [-Help]

Options:
  -TimeoutSeconds    Timeout in seconds (default: 60)
  -Context          Additional context for the commit message
  -Yes              Skip confirmation prompt
  -AutoSplit        Automatically split large commits into smaller chunks
  -MaxLines         Maximum lines per commit when auto-splitting (default: 500)
  -Help             Show this help message

Examples:
  .\scripts\safe-commit.ps1
  .\scripts\safe-commit.ps1 -TimeoutSeconds 30 -Yes
  .\scripts\safe-commit.ps1 -Context "fix Sharp configuration"
  .\scripts\safe-commit.ps1 -AutoSplit -MaxLines 300
  .\scripts\safe-commit.ps1 -AutoSplit -Yes
"@
    exit 0
}

# Check if there are staged changes
$stagedFiles = git diff --cached --name-only
if (-not $stagedFiles) {
    Write-Host "No staged changes found. Please stage your changes first:" -ForegroundColor Red
    Write-Host "   git add <files>" -ForegroundColor Gray
    exit 1
}

# Show what will be committed
Write-Host "Staged changes:" -ForegroundColor Cyan
git diff --cached --stat

# Check commit size
$stats = git diff --cached --numstat
$totalLines = 0
foreach ($line in $stats) {
    $parts = $line -split '\t'
    if ($parts[0] -match '^\d+$') {
        $totalLines += [int]$parts[0]
    }
}

Write-Host "`nTotal lines changed: $totalLines" -ForegroundColor Yellow

# Auto-split logic
if ($totalLines -gt $MaxLines) {
    if ($AutoSplit) {
        Write-Host "AUTO-SPLIT: Large commit detected ($totalLines lines > $MaxLines). Splitting automatically..." -ForegroundColor Cyan

        # Reset staging area
        git reset

        # Group files by type and size
        $allFiles = git diff --name-only HEAD
        $fileGroups = @()
        $currentGroup = @()
        $currentGroupLines = 0

        foreach ($file in $allFiles) {
            if (Test-Path $file) {
                # Get lines changed for this file
                $fileStats = git diff --numstat HEAD -- $file
                $fileLines = 0
                if ($fileStats -match '^(\d+)\s+(\d+)\s+(.+)$') {
                    $fileLines = [int]$matches[1]
                }

                # If adding this file would exceed MaxLines, start a new group
                if (($currentGroupLines + $fileLines) -gt $MaxLines -and $currentGroup.Count -gt 0) {
                    $fileGroups += ,@($currentGroup)
                    $currentGroup = @()
                    $currentGroupLines = 0
                }

                $currentGroup += $file
                $currentGroupLines += $fileLines
            }
        }

        # Add the last group
        if ($currentGroup.Count -gt 0) {
            $fileGroups += ,@($currentGroup)
        }

        Write-Host "Split into $($fileGroups.Count) commits:" -ForegroundColor Green

        # Process each group
        for ($i = 0; $i -lt $fileGroups.Count; $i++) {
            $group = $fileGroups[$i]
            $groupLines = 0
            foreach ($file in $group) {
                $fileStats = git diff --numstat HEAD -- $file
                if ($fileStats -match '^(\d+)\s+(\d+)\s+(.+)$') {
                    $groupLines += [int]$matches[1]
                }
            }

            Write-Host "`nCommit $($i + 1)/$($fileGroups.Count): $($group.Count) files, $groupLines lines" -ForegroundColor Yellow
            foreach ($file in $group) {
                Write-Host "  - $file" -ForegroundColor Gray
            }

            # Stage this group
            foreach ($file in $group) {
                git add $file
            }

            # Commit this group
            $groupContext = if ($Context) { "$Context (part $($i + 1)/$($fileGroups.Count))" } else { "Part $($i + 1) of $($fileGroups.Count)" }

            Write-Host "Processing commit $($i + 1)..." -ForegroundColor Cyan
            & $PSCommandPath -TimeoutSeconds $TimeoutSeconds -Context $groupContext -Yes:$Yes

            if ($LASTEXITCODE -ne 0) {
                Write-Host "Failed to commit group $($i + 1). Stopping auto-split." -ForegroundColor Red
                exit 1
            }
        }

        Write-Host "`nAuto-split completed successfully! Created $($fileGroups.Count) commits." -ForegroundColor Green
        exit 0

    } else {
        Write-Host "WARNING: Large commit detected! ($totalLines lines > $MaxLines)" -ForegroundColor Yellow
        Write-Host "Options:" -ForegroundColor Cyan
        Write-Host "  1. Use -AutoSplit to automatically split this commit" -ForegroundColor White
        Write-Host "  2. Use .\scripts\split-commit.ps1 for manual splitting" -ForegroundColor White
        Write-Host "  3. Continue anyway (may timeout)" -ForegroundColor White

        if (-not $Yes) {
            Write-Host "`nChoose: [A]uto-split, [C]ontinue anyway, [Q]uit: " -ForegroundColor Yellow -NoNewline
            $response = Read-Host

            if ($response -eq 'A' -or $response -eq 'a') {
                # Restart with AutoSplit
                & $PSCommandPath -AutoSplit -TimeoutSeconds $TimeoutSeconds -Context $Context -Yes:$Yes -MaxLines $MaxLines
                exit $LASTEXITCODE
            } elseif ($response -eq 'Q' -or $response -eq 'q') {
                Write-Host "Aborted." -ForegroundColor Red
                exit 1
            }
            # Continue if 'C' or anything else
        }
    }
}

# Build OpenCommit command
$command = "pnpm exec opencommit"
if ($Context) {
    $command += " --context `"$Context`""
}
if ($Yes) {
    $command += " --yes"
}

Write-Host "`nRunning OpenCommit with $TimeoutSeconds second timeout..." -ForegroundColor Green
Write-Host "Command: $command" -ForegroundColor Gray

# Run with timeout using process approach
Write-Host "Starting OpenCommit process..." -ForegroundColor Gray

try {
    # Create process start info with proper encoding
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "pnpm"
    $processInfo.Arguments = "exec opencommit" + $(if ($Context) { " --context `"$Context`"" } else { "" }) + $(if ($Yes) { " --yes" } else { "" })
    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.WorkingDirectory = Get-Location
    $processInfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $processInfo.StandardErrorEncoding = [System.Text.Encoding]::UTF8

    # Start the process
    $process = [System.Diagnostics.Process]::Start($processInfo)

    # Wait for completion with timeout
    $completed = $process.WaitForExit($TimeoutSeconds * 1000)

    if ($completed) {
        $output = $process.StandardOutput.ReadToEnd()
        $error = $process.StandardError.ReadToEnd()
        $exitCode = $process.ExitCode

        if ($exitCode -eq 0) {
            Write-Host "Commit successful!" -ForegroundColor Green
            Write-Host $output
        } else {
            Write-Host "ERROR: OpenCommit failed (Exit code: $exitCode)" -ForegroundColor Red
            if ($output) { Write-Host $output }
            if ($error) { Write-Host $error -ForegroundColor Red }

            Write-Host "`nFallback: Create manual commit? (y/n): " -ForegroundColor Yellow -NoNewline
            $fallback = Read-Host
            if ($fallback -eq 'y' -or $fallback -eq 'Y') {
                Write-Host "Enter commit message: " -ForegroundColor Cyan -NoNewline
                $message = Read-Host
                git commit -m $message
            }
        }
    } else {
        Write-Host "TIMEOUT: OpenCommit timed out after $TimeoutSeconds seconds!" -ForegroundColor Red
        $process.Kill()
        $process.WaitForExit(5000) # Wait up to 5 seconds for cleanup

        Write-Host "`nFallback options:" -ForegroundColor Yellow
        Write-Host "1. Try with smaller changes: git reset && git add <specific-files>" -ForegroundColor White
        Write-Host "2. Create manual commit: git commit -m 'your message'" -ForegroundColor White
        Write-Host "3. Split commit: .\scripts\split-commit.ps1" -ForegroundColor White

        Write-Host "`nCreate manual commit now? (y/n): " -ForegroundColor Yellow -NoNewline
        $manual = Read-Host
        if ($manual -eq 'y' -or $manual -eq 'Y') {
            Write-Host "Enter commit message: " -ForegroundColor Cyan -NoNewline
            $message = Read-Host
            git commit -m $message
            Write-Host "Manual commit created!" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "ERROR: Failed to start OpenCommit process: $_" -ForegroundColor Red
    Write-Host "`nFallback: Create manual commit? (y/n): " -ForegroundColor Yellow -NoNewline
    $manual = Read-Host
    if ($manual -eq 'y' -or $manual -eq 'Y') {
        Write-Host "Enter commit message: " -ForegroundColor Cyan -NoNewline
        $message = Read-Host
        git commit -m $message
        Write-Host "Manual commit created!" -ForegroundColor Green
    }
}
