# PowerShell Performance Logging Module for Reset-and-Migrate.ps1
# Tracks execution times for steps and phases

# Import utility modules
. "$PSScriptRoot\logging.ps1"

# Initialize the global timing data structure
function Initialize-Timer {
    $global:executionTiming = @{
        StartTime = Get-Date
        EndTime = $null
        TotalDuration = $null
        PhaseTimings = @{}
        StepTimings = @{}
    }
    
    Log-Message "Performance timing initialized" "Gray"
}

# Finalize the timer and calculate the total duration
function Finalize-Timer {
    $global:executionTiming.EndTime = Get-Date
    $global:executionTiming.TotalDuration = $global:executionTiming.EndTime - $global:executionTiming.StartTime
    
    Log-Message "Performance timing finalized. Total duration: $([math]::Round($global:executionTiming.TotalDuration.TotalMinutes, 2)) minutes" "Gray"
}

# Start timing a specific phase
function Start-PhaseTimer {
    param (
        [string]$PhaseName
    )
    
    if (-not $global:executionTiming) {
        Initialize-Timer
    }
    
    $global:executionTiming.PhaseTimings[$PhaseName] = @{
        StartTime = Get-Date
        EndTime = $null
        Duration = $null
    }
}

# Stop timing a specific phase
function Stop-PhaseTimer {
    param (
        [string]$PhaseName
    )
    
    if (-not $global:executionTiming -or -not $global:executionTiming.PhaseTimings -or -not $global:executionTiming.PhaseTimings[$PhaseName]) {
        Log-Warning "No timer found for phase: $PhaseName"
        return
    }
    
    $global:executionTiming.PhaseTimings[$PhaseName].EndTime = Get-Date
    $global:executionTiming.PhaseTimings[$PhaseName].Duration = 
        $global:executionTiming.PhaseTimings[$PhaseName].EndTime - 
        $global:executionTiming.PhaseTimings[$PhaseName].StartTime
}

# Start timing a specific step
function Start-StepTimer {
    param (
        [string]$StepName
    )
    
    if (-not $global:executionTiming) {
        Initialize-Timer
    }
    
    $global:executionTiming.StepTimings[$StepName] = @{
        StartTime = Get-Date
        EndTime = $null
        Duration = $null
    }
}

# Stop timing a specific step
function Stop-StepTimer {
    param (
        [string]$StepName
    )
    
    if (-not $global:executionTiming -or -not $global:executionTiming.StepTimings -or -not $global:executionTiming.StepTimings[$StepName]) {
        Log-Warning "No timer found for step: $StepName"
        return
    }
    
    $global:executionTiming.StepTimings[$StepName].EndTime = Get-Date
    $global:executionTiming.StepTimings[$StepName].Duration = 
        $global:executionTiming.StepTimings[$StepName].EndTime - 
        $global:executionTiming.StepTimings[$StepName].StartTime
}

# Get performance timing report for all phases and steps
function Show-PerformanceReport {
    if (-not $global:executionTiming) {
        Log-Warning "No performance timing data available"
        return
    }
    
    # Ensure the timer has been finalized
    if (-not $global:executionTiming.EndTime) {
        Finalize-Timer
    }
    
    $lineWidth = 80
    $headerLine = "=".PadRight($lineWidth, "=")
    
    Write-Host ""
    Write-Host $headerLine -ForegroundColor Cyan
    Write-Host "PERFORMANCE REPORT" -ForegroundColor Cyan
    Write-Host $headerLine -ForegroundColor Cyan
    Write-Host ""
    
    # Total execution time
    $totalDuration = $global:executionTiming.TotalDuration
    Write-Host "Total Execution Time: " -NoNewline -ForegroundColor Yellow
    Write-Host "$([math]::Round($totalDuration.TotalMinutes, 2)) minutes ($([math]::Round($totalDuration.TotalSeconds, 2)) seconds)" -ForegroundColor White
    Write-Host ""
    
    # Phase timings
    Write-Host "Phase Timings:" -ForegroundColor Yellow
    $phasesWithTime = $global:executionTiming.PhaseTimings.GetEnumerator() | 
        Where-Object { $_.Value.Duration } | 
        Sort-Object { $_.Value.StartTime }
    
    if ($phasesWithTime.Count -gt 0) {
        # Calculate the longest phase name for alignment
        $longestPhaseName = ($phasesWithTime | ForEach-Object { $_.Key.Length } | Measure-Object -Maximum).Maximum
        
        foreach ($phase in $phasesWithTime) {
            $phaseName = $phase.Key
            $phaseDuration = $phase.Value.Duration
            
            $percentOfTotal = [math]::Round(($phaseDuration.TotalSeconds / $totalDuration.TotalSeconds) * 100, 1)
            $paddedName = $phaseName.PadRight($longestPhaseName + 2)
            
            # Determine color based on percentage of total time
            $color = "Gray"
            if ($percentOfTotal -gt 50) { $color = "Red" }
            elseif ($percentOfTotal -gt 25) { $color = "Yellow" }
            elseif ($percentOfTotal -gt 10) { $color = "Cyan" }
            
            Write-Host "  $paddedName " -NoNewline
            Write-Host "$([math]::Round($phaseDuration.TotalSeconds, 2)) seconds" -NoNewline -ForegroundColor $color
            Write-Host " ($percentOfTotal% of total)" -ForegroundColor $color
        }
    } else {
        Write-Host "  No phase timing data available" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    # Step timings
    Write-Host "Step Timings (Top 10 longest steps):" -ForegroundColor Yellow
    $stepsWithTime = $global:executionTiming.StepTimings.GetEnumerator() | 
        Where-Object { $_.Value.Duration } | 
        Sort-Object { $_.Value.Duration.TotalSeconds } -Descending |
        Select-Object -First 10
    
    if ($stepsWithTime.Count -gt 0) {
        # Calculate the longest step name for alignment
        $longestStepName = ($stepsWithTime | ForEach-Object { $_.Key.Length } | Measure-Object -Maximum).Maximum
        
        foreach ($step in $stepsWithTime) {
            $stepName = $step.Key
            $stepDuration = $step.Value.Duration
            
            $percentOfTotal = [math]::Round(($stepDuration.TotalSeconds / $totalDuration.TotalSeconds) * 100, 1)
            $paddedName = $stepName.PadRight($longestStepName + 2)
            
            # Determine color based on percentage of total time
            $color = "Gray"
            if ($percentOfTotal -gt 30) { $color = "Red" }
            elseif ($percentOfTotal -gt 15) { $color = "Yellow" }
            elseif ($percentOfTotal -gt 5) { $color = "Cyan" }
            
            Write-Host "  $paddedName " -NoNewline
            Write-Host "$([math]::Round($stepDuration.TotalSeconds, 2)) seconds" -NoNewline -ForegroundColor $color
            Write-Host " ($percentOfTotal% of total)" -ForegroundColor $color
        }
    } else {
        Write-Host "  No step timing data available" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    # Add timing information to the detailed log file
    if ($script:detailedLogFile) {
        $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        Add-Content -Path $script:detailedLogFile -Value "`n$timestamp - PERFORMANCE REPORT"
        Add-Content -Path $script:detailedLogFile -Value "$timestamp - Total Execution Time: $([math]::Round($totalDuration.TotalMinutes, 2)) minutes ($([math]::Round($totalDuration.TotalSeconds, 2)) seconds)"
        
        Add-Content -Path $script:detailedLogFile -Value "$timestamp - Phase Timings:"
        foreach ($phase in $phasesWithTime) {
            $phaseName = $phase.Key
            $phaseDuration = $phase.Value.Duration
            $percentOfTotal = [math]::Round(($phaseDuration.TotalSeconds / $totalDuration.TotalSeconds) * 100, 1)
            Add-Content -Path $script:detailedLogFile -Value ($timestamp + " -   " + $phaseName + " - " + [math]::Round($phaseDuration.TotalSeconds, 2) + " seconds (" + $percentOfTotal + "% of total)")
        }
        
        Add-Content -Path $script:detailedLogFile -Value "$timestamp - Step Timings (Top 10 longest steps):"
        foreach ($step in $stepsWithTime) {
            $stepName = $step.Key
            $stepDuration = $step.Value.Duration
            $percentOfTotal = [math]::Round(($stepDuration.TotalSeconds / $totalDuration.TotalSeconds) * 100, 1)
            Add-Content -Path $script:detailedLogFile -Value ($timestamp + " -   " + $stepName + " - " + [math]::Round($stepDuration.TotalSeconds, 2) + " seconds (" + $percentOfTotal + "% of total)")
        }
    }
}

# Export timing data to a CSV file for further analysis
function Export-TimingData {
    param (
        [string]$OutputPath = ""
    )
    
    if (-not $global:executionTiming) {
        Log-Warning "No performance timing data available to export"
        return
    }
    
    # Generate a default output path if not provided
    if (-not $OutputPath) {
        $timestamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
        $OutputPath = Join-Path -Path $env:TEMP -ChildPath "migration-timing-$timestamp.csv"
    }
    
    try {
        # Create an array to store the CSV data
        $csvData = @()
        
        # Add phase timing data
        foreach ($phase in $global:executionTiming.PhaseTimings.GetEnumerator()) {
            if ($phase.Value.Duration) {
                $csvData += [PSCustomObject]@{
                    Type = "Phase"
                    Name = $phase.Key
                    StartTime = $phase.Value.StartTime.ToString("yyyy-MM-dd HH:mm:ss.fff")
                    EndTime = $phase.Value.EndTime.ToString("yyyy-MM-dd HH:mm:ss.fff")
                    DurationSeconds = [math]::Round($phase.Value.Duration.TotalSeconds, 3)
                }
            }
        }
        
        # Add step timing data
        foreach ($step in $global:executionTiming.StepTimings.GetEnumerator()) {
            if ($step.Value.Duration) {
                $csvData += [PSCustomObject]@{
                    Type = "Step"
                    Name = $step.Key
                    StartTime = $step.Value.StartTime.ToString("yyyy-MM-dd HH:mm:ss.fff")
                    EndTime = $step.Value.EndTime.ToString("yyyy-MM-dd HH:mm:ss.fff")
                    DurationSeconds = [math]::Round($step.Value.Duration.TotalSeconds, 3)
                }
            }
        }
        
        # Export the data to CSV
        $csvData | Export-Csv -Path $OutputPath -NoTypeInformation
        
        Log-Success "Timing data exported to $OutputPath"
        return $OutputPath
    }
    catch {
        Log-Warning "Failed to export timing data: $_"
        return $null
    }
}
