# Enhanced logging utilities for content migration system

# Function to set UTF-8 encoding for PowerShell outputs
function Set-UTF8Encoding {
    # Only set PowerShell's output encoding to UTF-8
    # Removed problematic reflection-based encoding modification that was causing errors
    $OutputEncoding = [System.Text.UTF8Encoding]::new()
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
    
    # For newer PowerShell versions, set default encoding via built-in parameter
    try {
        if ($PSVersionTable.PSVersion.Major -ge 7) {
            # Set default encoding for Out-File, which is used by many cmdlets
            $PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'
            $PSDefaultParameterValues['*:Encoding'] = 'utf8'
        }
    } catch {
        # Ignore errors if PSVersionTable isn't available
    }
    
    Log-Message "Set UTF-8 encoding for PowerShell outputs" "Gray"
}

# Function to sanitize log text for display
function Sanitize-LogText {
    param (
        [string]$Text
    )
    
    # Replace known problematic character sequences
    $Text = $Text -replace 'GÇë', '['
    $Text = $Text -replace 'GÇë', ']'
    $Text = $Text -replace 'GöÇ', '-'
    $Text = $Text -replace 'G£à', '✓'
    $Text = $Text -replace 'G£ô', '•'
    
    return $Text
}

function Show-ProgressBar {
    param (
        [int]$Current,
        [int]$Total,
        [string]$Activity,
        [int]$BarLength = 50
    )

    $percentComplete = [math]::Min(100, [math]::Round(($Current / $Total) * 100, 0))
    $completedLength = [math]::Round(($percentComplete / 100) * $BarLength)
    $remainingLength = $BarLength - $completedLength

    $progressBar = "[" + "=".PadRight($completedLength, "=") + " ".PadRight($remainingLength, " ") + "]"

    # Use single quotes to avoid variable interpolation issues
    Write-Host ("`r" + $Activity + ': ' + $progressBar + ' ' + $percentComplete + '% (' + $Current + '/' + $Total + ')') -NoNewline

    if ($Current -eq $Total) {
        Write-Host ""
    }
}

# Enhanced step logging function with progress indicators
function Log-EnhancedStep {
    param (
        [string]$StepName,
        [int]$StepNumber = 0,
        [int]$TotalSteps = 12
    )

    $progressText = if ($StepNumber -gt 0) { "[$StepNumber/$TotalSteps] " } else { "" }
    $lineLength = 80

    # Start timing this step
    Start-StepTimer -StepName "$StepNumber-$StepName"

    # Visual display
    Write-Host ""
    Write-Host "+" -ForegroundColor Cyan -NoNewline
    Write-Host "-".PadRight($lineLength - 2, "-") -ForegroundColor Cyan -NoNewline
    Write-Host "+" -ForegroundColor Cyan

    Write-Host "|" -ForegroundColor Cyan -NoNewline
    Write-Host " $progressText$StepName" -ForegroundColor Yellow -NoNewline
    $paddingRight = $lineLength - 3 - "$progressText$StepName".Length
    Write-Host " ".PadRight($paddingRight) -NoNewline
    Write-Host "|" -ForegroundColor Cyan

    Write-Host "+" -ForegroundColor Cyan -NoNewline
    Write-Host "-".PadRight($lineLength - 2, "-") -ForegroundColor Cyan -NoNewline
    Write-Host "+" -ForegroundColor Cyan

    # Create detailed log entry with status tracking
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Add-Content -Path $script:detailedLogFile -Value ("`n" + $timestamp + " - ------------------------------------------------------------")
    # Use string concatenation instead of interpolation for colons
    Add-Content -Path $script:detailedLogFile -Value ($timestamp + " - STEP " + $StepNumber + ": " + $StepName + " [STARTED]")
    Add-Content -Path $script:detailedLogFile -Value ($timestamp + " - ------------------------------------------------------------")

    # Update global step tracking
    $global:currentStep = $StepNumber
    $global:currentStepName = $StepName
    $global:stepStartTime = Get-Date

    if ($StepNumber -gt 0 -and $TotalSteps -gt 0) {
        Show-ProgressBar -Current $StepNumber -Total $TotalSteps -Activity "Migration Progress"
    }
}

# Enhanced step completion logging
function Log-EnhancedStepCompletion {
    param (
        [bool]$Success = $true
    )

    # Stop timing this step
    Stop-StepTimer -StepName "$global:currentStep-$global:currentStepName"

    # Calculate step duration
    $stepDuration = (Get-Date) - $global:stepStartTime
    $durationText = [math]::Round($stepDuration.TotalSeconds, 2).ToString() + "s"

    # Create detailed log entry with status tracking
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $status = if ($Success) { "COMPLETED" } else { "FAILED" }
    # Use string concatenation instead of interpolation
    Add-Content -Path $script:detailedLogFile -Value ($timestamp + " - STEP " + $global:currentStep + ": " + $global:currentStepName + " [" + $status + "] (" + $durationText + ")")

    # Add timing information
    $stepTime = $global:executionTiming.StepTimings["$global:currentStep-$global:currentStepName"].Duration.TotalSeconds
    $roundedTime = [math]::Round($stepTime, 2)
    Add-Content -Path $script:detailedLogFile -Value ($timestamp + " - Step duration: " + $roundedTime + " seconds")

    # Log success/failure
    if ($Success) {
        Log-Success ("Step " + $global:currentStep + " completed successfully (" + $durationText + ")")
    }
    else {
        Log-Warning ("Step " + $global:currentStep + " completed with warnings or errors (" + $durationText + ")")
    }
}

# Enhanced phase logging with progress tracking
function Log-EnhancedPhase {
    param (
        [string]$PhaseName,
        [int]$PhaseNumber = 0, 
        [int]$TotalPhases = 4
    )

    $lineLength = 80
    $headerLine = "=".PadRight($lineLength, "=")

    Write-Host ""
    Write-Host $headerLine -ForegroundColor Cyan
    if ($PhaseNumber -gt 0) {
        Write-Host ("PHASE " + $PhaseNumber + "/" + $TotalPhases + ": " + $PhaseName) -ForegroundColor Cyan
    } else {
        Write-Host $PhaseName -ForegroundColor Cyan
    }
    Write-Host $headerLine -ForegroundColor Cyan
    Write-Host ""

    # Log to detailed log file
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    # Use string concatenation to avoid interpolation issues
    Add-Content -Path $script:detailedLogFile -Value ("`n" + $timestamp + " - " + $headerLine)
    if ($PhaseNumber -gt 0) {
        Add-Content -Path $script:detailedLogFile -Value ($timestamp + " - PHASE " + $PhaseNumber + "/" + $TotalPhases + ": " + $PhaseName)
    } else {
        Add-Content -Path $script:detailedLogFile -Value ($timestamp + " - " + $PhaseName)
    }
    Add-Content -Path $script:detailedLogFile -Value ($timestamp + " - " + $headerLine)

    # Start phase timer
    Start-PhaseTimer -PhaseName $PhaseName
}

# Enhanced phase completion logging
function Log-EnhancedPhaseCompletion {
    param (
        [string]$PhaseName,
        [bool]$Success = $true
    )

    # Stop phase timer
    Stop-PhaseTimer -PhaseName $PhaseName

    # Calculate phase duration
    $phaseTime = $global:executionTiming.PhaseTimings[$PhaseName].Duration.TotalSeconds
    $durationText = [math]::Round($phaseTime, 2).ToString() + "s"

    # Log to detailed log file
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $status = if ($Success) { "COMPLETED" } else { "COMPLETED WITH WARNINGS" }
    Add-Content -Path $script:detailedLogFile -Value ($timestamp + " - PHASE " + $PhaseName + " " + $status + " (" + $durationText + ")")

    # Log completion
    if ($Success) {
        Log-Success ($PhaseName + " phase completed successfully (" + $durationText + ")")
    } else {
        Log-Warning ($PhaseName + " phase completed with warnings (" + $durationText + ")")
    }
}

# Function to show expected warning notes
function Log-ExpectedWarning {
    param (
        [string]$WarningText
    )

    Write-Host "NOTE: " -ForegroundColor Yellow -NoNewline
    Write-Host $WarningText -ForegroundColor Gray
    
    # Log to detailed log file
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Add-Content -Path $script:detailedLogFile -Value ($timestamp + " - EXPECTED WARNING: " + $WarningText)
}
