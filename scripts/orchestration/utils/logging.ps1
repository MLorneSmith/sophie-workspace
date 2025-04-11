# PowerShell Logging Module for Reset-and-Migrate.ps1
# Extracted from the existing script to support modularization

# Initialize global variables for the logging module
$script:logFile = $null
$script:detailedLogFile = $null
$script:logsDir = $null
$script:timestamp = $null

# Function to initialize logging with log files and timestamps
function Initialize-Logging {
    param (
        [string]$LogDirectory = "z.migration-logs"
    )
    
    # Get the script's directory for absolute paths
    $scriptDir = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
    
    # Create logs directory if it doesn't exist
    $script:logsDir = Join-Path -Path $scriptDir -ChildPath $LogDirectory
    if (-not (Test-Path -Path $script:logsDir)) {
        New-Item -Path $script:logsDir -ItemType Directory | Out-Null
        Write-Host "Created logs directory: $script:logsDir" -ForegroundColor Cyan
    }
    
    # Create timestamp for log files
    # Use the timestamp from the environment variable if it's set, otherwise create a new one
    if ($env:MIGRATION_TIMESTAMP) {
        $script:timestamp = $env:MIGRATION_TIMESTAMP
        Write-Host "Using timestamp from environment variable: $script:timestamp" -ForegroundColor Cyan
    } else {
        $script:timestamp = Get-Date -Format "yyyyMMdd-HHmmss-fff"
    }
    
    # Set log file paths
    $script:logFile = Join-Path -Path $script:logsDir -ChildPath "migration-log-$script:timestamp.txt"
    $script:detailedLogFile = Join-Path -Path $script:logsDir -ChildPath "migration-detailed-log-$script:timestamp.txt"
    
    # Start transcript to capture output to a file
    try {
        Start-Transcript -Path $script:logFile -Append -ErrorAction SilentlyContinue
        Log-Message "Starting migration process at $(Get-Date)" "Cyan"
        Log-Message "Detailed logs will be saved to: $script:detailedLogFile" "Cyan"
    }
    catch {
        Write-Host "Warning: Could not start transcript: $_" -ForegroundColor Yellow
        Write-Host "Continuing without transcript..." -ForegroundColor Yellow
    }
    
    return @{
        LogFile = $script:logFile
        DetailedLogFile = $script:detailedLogFile
        Timestamp = $script:timestamp
        LogsDirectory = $script:logsDir
    }
}

# Function to log messages to both console and detailed log
function Log-Message {
    param (
        [string]$message,
        [string]$color = "White"
    )
    
    Write-Host $message -ForegroundColor $color
    
    # Try to write to the log file, but don't fail if the file is in use
    if ($script:detailedLogFile) {
        try {
            Add-Content -Path $script:detailedLogFile -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'): $message" -ErrorAction SilentlyContinue
        }
        catch {
            Write-Host "Warning: Could not write to log file: $_" -ForegroundColor Yellow
        }
    }
}

# Function to log a phase header for better visual organization
function Log-Phase {
    param (
        [string]$phaseName
    )
    
    $separator = "=" * 80
    Log-Message $separator "Cyan"
    Log-Message "$phaseName" "Cyan"
    Log-Message $separator "Cyan"
}

# Function to log a numbered step within a phase
function Log-Step {
    param (
        [string]$stepName,
        [int]$stepNumber
    )
    
    $separator = "-" * 60
    Log-Message "" "Yellow"
    Log-Message $separator "Yellow"
    # Use ${} to properly delimit the variable name before the colon
    Log-Message "STEP ${stepNumber}: $stepName" "Yellow"
    Log-Message $separator "Yellow"
}

# Function to log a success message
function Log-Success {
    param (
        [string]$message
    )
    
    Log-Message "✅ $message" "Green"
}

# Function to log a warning message
function Log-Warning {
    param (
        [string]$message
    )
    
    Log-Message "WARNING: $message" "Yellow"
}

# Function to log an error message
function Log-Error {
    param (
        [string]$message
    )
    
    Log-Message "ERROR: $message" "Red"
}

# Function to finalize logging and wrap up the process
function Finalize-Logging {
    param (
        [bool]$success = $true
    )
    
    # Final success/failure message
    if ($success) {
        Log-Message "All migrations and verifications completed successfully!" "Green"
    } else {
        Log-Message "Migration process completed with warnings or errors. Please check the logs for details." "Yellow"
    }
    
    # Always stop transcript
    try {
        Stop-Transcript -ErrorAction SilentlyContinue
    }
    catch {
        Write-Host "Warning: Could not stop transcript: $_" -ForegroundColor Yellow
    }
    
    Log-Message "Migration logs saved to:" "Cyan"
    Log-Message "  - Transcript log: $script:logFile" "Cyan"
    Log-Message "  - Detailed log: $script:detailedLogFile" "Cyan"
}

# All functions are automatically available when dot-sourced
# No need for Export-ModuleMember in this context
