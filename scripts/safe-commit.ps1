# Safe OpenCommit Wrapper
# This script runs OpenCommit with a timeout to prevent hanging

param(
    [int]$TimeoutSeconds = 60,
    [string]$Context = "",
    [switch]$Yes,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Safe OpenCommit Wrapper

This script runs OpenCommit with a timeout to prevent hanging.

Usage:
  .\scripts\safe-commit.ps1 [-TimeoutSeconds 60] [-Context "description"] [-Yes] [-Help]

Options:
  -TimeoutSeconds    Timeout in seconds (default: 60)
  -Context          Additional context for the commit message
  -Yes              Skip confirmation prompt
  -Help             Show this help message

Examples:
  .\scripts\safe-commit.ps1
  .\scripts\safe-commit.ps1 -TimeoutSeconds 30 -Yes
  .\scripts\safe-commit.ps1 -Context "fix Sharp configuration"
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

if ($totalLines -gt 1000) {
    Write-Host "WARNING: Large commit detected! Consider splitting it into smaller commits." -ForegroundColor Yellow
    Write-Host "   Use: .\scripts\split-commit.ps1" -ForegroundColor Gray

    if (-not $Yes) {
        $response = Read-Host "Continue anyway? (y/n)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-Host "Aborted." -ForegroundColor Red
            exit 1
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
    # Create process start info
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "pnpm"
    $processInfo.Arguments = "exec opencommit" + $(if ($Context) { " --context `"$Context`"" } else { "" }) + $(if ($Yes) { " --yes" } else { "" })
    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.WorkingDirectory = Get-Location

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
