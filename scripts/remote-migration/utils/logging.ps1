# Enhanced logging utilities

function Log-Message { 
    param (
        [string]$Message,
        [string]$ForegroundColor = "White"
    )
    Write-Host $Message -ForegroundColor $ForegroundColor
}

function Log-Success { 
    param ([string]$Message)
    Write-Host $Message -ForegroundColor "Green"
}

function Log-Error { 
    param ([string]$Message)
    Write-Host $Message -ForegroundColor "Red"
}

function Log-Warning { 
    param ([string]$Message)
    Write-Host $Message -ForegroundColor "Yellow"
}

function Log-Phase { 
    param ([string]$PhaseName)
    Write-Host "`n=== $PhaseName ===" -ForegroundColor "Cyan"
}

function Log-Step { 
    param ([string]$StepName)
    Write-Host ">> $StepName" -ForegroundColor "Magenta"
}

function Exec-Command {
    param (
        [string]$command,
        [string]$description = "Executing",
        [switch]$captureOutput,
        [switch]$continueOnError
    )
    
    try {
        Write-Host "Running: $command"
        
        if ($captureOutput) {
            $output = Invoke-Expression $command 2>&1
            return $output
        } else {
            Invoke-Expression $command
        }
    }
    catch {
        if (-not $continueOnError) {
            throw $_
        } else {
            return $null
        }
    }
}
