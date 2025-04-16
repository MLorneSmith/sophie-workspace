# Simple logging
function Log-Message { 
    param ([string]$Message)
    Write-Host $Message
}

function Log-Success { 
    param ([string]$Message)
    Write-Host $Message
}

function Log-Error { 
    param ([string]$Message)
    Write-Host $Message
}

function Log-Warning { 
    param ([string]$Message)
    Write-Host $Message
}

function Log-Phase { 
    param ([string]$PhaseName)
    Write-Host $PhaseName
}

function Log-Step { 
    param ([string]$StepName)
    Write-Host $StepName
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
