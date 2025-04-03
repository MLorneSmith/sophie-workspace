# PowerShell script to analyze migration logs
# This script helps extract key information from migration log files

param (
    [Parameter(Mandatory=$false)]
    [string]$LogFile = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$ListAll,
    
    [Parameter(Mandatory=$false)]
    [switch]$Errors,
    
    [Parameter(Mandatory=$false)]
    [switch]$Warnings,
    
    [Parameter(Mandatory=$false)]
    [switch]$Commands,
    
    [Parameter(Mandatory=$false)]
    [switch]$Summary
)

# Function to get the most recent log file
function Get-MostRecentLog {
    param (
        [string]$Pattern
    )
    
    $files = Get-ChildItem -Path $PSScriptRoot -Filter $Pattern | Sort-Object LastWriteTime -Descending
    if ($files.Count -eq 0) {
        Write-Host "No log files found matching pattern: $Pattern" -ForegroundColor Red
        return $null
    }
    
    return $files[0].FullName
}

# Function to extract errors from a log file
function Get-LogErrors {
    param (
        [string]$LogFile
    )
    
    $content = Get-Content -Path $LogFile -Raw
    $errorPattern = "(?m)^.*ERROR.*$|^.*Error.*$|^.*error.*$|failed with exit code"
    $matches = [regex]::Matches($content, $errorPattern)
    
    return $matches | ForEach-Object { $_.Value }
}

# Function to extract warnings from a log file
function Get-LogWarnings {
    param (
        [string]$LogFile
    )
    
    $content = Get-Content -Path $LogFile -Raw
    $warningPattern = "(?m)^.*WARNING.*$|^.*Warning.*$|^.*warning.*$"
    $matches = [regex]::Matches($content, $warningPattern)
    
    return $matches | ForEach-Object { $_.Value }
}

# Function to extract commands from a log file
function Get-LogCommands {
    param (
        [string]$LogFile
    )
    
    $content = Get-Content -Path $LogFile -Raw
    $commandPattern = "(?m)^.*EXECUTING: .*$"
    $matches = [regex]::Matches($content, $commandPattern)
    
    return $matches | ForEach-Object { $_.Value }
}

# Function to generate a summary of a log file
function Get-LogSummary {
    param (
        [string]$LogFile
    )
    
    $content = Get-Content -Path $LogFile -Raw
    
    # Extract start and end times
    $startTimeMatch = [regex]::Match($content, "Starting migration process at (.*)")
    $startTime = if ($startTimeMatch.Success) { $startTimeMatch.Groups[1].Value } else { "Unknown" }
    
    # Count errors, warnings, and commands
    $errors = Get-LogErrors -LogFile $LogFile
    $warnings = Get-LogWarnings -LogFile $LogFile
    $commands = Get-LogCommands -LogFile $LogFile
    
    # Check if migration was successful
    $successMatch = [regex]::Match($content, "All migrations and verifications completed successfully!")
    $success = $successMatch.Success
    
    # Create summary
    $summary = @{
        "LogFile" = $LogFile
        "StartTime" = $startTime
        "Success" = $success
        "ErrorCount" = $errors.Count
        "WarningCount" = $warnings.Count
        "CommandCount" = $commands.Count
    }
    
    return $summary
}

# Main script logic
if (-not $LogFile) {
    $LogFile = Get-MostRecentLog -Pattern "migration-detailed-log-*.txt"
    if (-not $LogFile) {
        exit 1
    }
}

Write-Host "Analyzing log file: $LogFile" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

# If no specific options are provided, show a summary by default
if (-not ($ListAll -or $Errors -or $Warnings -or $Commands -or $Summary)) {
    $Summary = $true
}

# Process according to options
if ($Summary -or $ListAll) {
    $summary = Get-LogSummary -LogFile $LogFile
    Write-Host "SUMMARY:" -ForegroundColor Cyan
    Write-Host "  Log File: $($summary.LogFile)" -ForegroundColor White
    Write-Host "  Start Time: $($summary.StartTime)" -ForegroundColor White
    
    if ($summary.Success) {
        Write-Host "  Status: SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "  Status: FAILED" -ForegroundColor Red
    }
    
    Write-Host "  Error Count: $($summary.ErrorCount)" -ForegroundColor $(if ($summary.ErrorCount -gt 0) { "Red" } else { "Green" })
    Write-Host "  Warning Count: $($summary.WarningCount)" -ForegroundColor $(if ($summary.WarningCount -gt 0) { "Yellow" } else { "Green" })
    Write-Host "  Command Count: $($summary.CommandCount)" -ForegroundColor White
    Write-Host ""
}

if ($Errors -or $ListAll) {
    $errors = Get-LogErrors -LogFile $LogFile
    Write-Host "ERRORS ($($errors.Count)):" -ForegroundColor Red
    if ($errors.Count -eq 0) {
        Write-Host "  No errors found" -ForegroundColor Green
    } else {
        $errors | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    }
    Write-Host ""
}

if ($Warnings -or $ListAll) {
    $warnings = Get-LogWarnings -LogFile $LogFile
    Write-Host "WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
    if ($warnings.Count -eq 0) {
        Write-Host "  No warnings found" -ForegroundColor Green
    } else {
        $warnings | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    }
    Write-Host ""
}

if ($Commands -or $ListAll) {
    $commands = Get-LogCommands -LogFile $LogFile
    Write-Host "COMMANDS ($($commands.Count)):" -ForegroundColor Cyan
    $commands | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host ""
}

Write-Host "Analysis complete" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

# Usage examples
if (-not ($ListAll -or $Errors -or $Warnings -or $Commands -or $Summary)) {
    Write-Host "USAGE EXAMPLES:" -ForegroundColor Cyan
    Write-Host "  .\analyze-logs.ps1                                # Analyze most recent log with summary" -ForegroundColor Gray
    Write-Host "  .\analyze-logs.ps1 -LogFile path\to\logfile.txt   # Analyze specific log file" -ForegroundColor Gray
    Write-Host "  .\analyze-logs.ps1 -Errors                        # Show only errors" -ForegroundColor Gray
    Write-Host "  .\analyze-logs.ps1 -Warnings                      # Show only warnings" -ForegroundColor Gray
    Write-Host "  .\analyze-logs.ps1 -Commands                      # Show only commands" -ForegroundColor Gray
    Write-Host "  .\analyze-logs.ps1 -Summary                       # Show summary" -ForegroundColor Gray
    Write-Host "  .\analyze-logs.ps1 -ListAll                       # Show everything" -ForegroundColor Gray
}
