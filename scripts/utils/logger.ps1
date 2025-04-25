# Logger utility script for PowerShell
# Provides consistent logging functions used across the migration scripts

# Function to write a section header
function Write-Section {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Text
    )

    $width = 80
    $line = "=" * $width
    
    Write-Host $line
    Write-Host "$Text"
    Write-Host $line
}

# Function to write a log message with timestamp
function Write-Log {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Message,
        
        [Parameter(Mandatory = $false)]
        [ValidateSet("INFO", "WARNING", "ERROR", "SUCCESS")]
        [string] $Level = "INFO"
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $prefix = switch ($Level) {
        "INFO"    { "INFO " }
        "WARNING" { "WARN " }
        "ERROR"   { "ERROR" }
        "SUCCESS" { "✅    " }
    }

    Write-Host "$timestamp [$prefix] $Message"
}

# Function to write a subsection header
function Write-Subsection {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Text
    )

    $width = 70
    $line = "-" * $width
    
    Write-Host ""
    Write-Host $line
    Write-Host "$Text"
    Write-Host $line
}

# Function to log execution of a command
function Write-Command {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Command,
        
        [Parameter(Mandatory = $false)]
        [string] $Description = ""
    )

    Write-Host "EXECUTING: $Command"
    if ($Description -ne "") {
        Write-Host "DESCRIPTION: $Description"
    }
}

# Function to log progress in a visual way
function Write-Progress-Bar {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Status,
        
        [Parameter(Mandatory = $true)]
        [int] $Current,
        
        [Parameter(Mandatory = $true)]
        [int] $Total
    )

    $completed = [math]::Min([math]::Floor(($Current / $Total) * 50), 50)
    $remaining = 50 - $completed
    
    $progressBar = "[" + ("=" * $completed) + (" " * $remaining) + "]"
    $percentage = [math]::Floor(($Current / $Total) * 100)
    
    Write-Host "`r+------------------------------------------------------------------------------+"
    Write-Host "`r| [$Current/$Total] $Status$progressBar $percentage% |"
    Write-Host "`r+------------------------------------------------------------------------------+"
}

# No need to export functions, they will be available in the scope where the script is dot-sourced
