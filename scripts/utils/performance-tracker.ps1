# Performance tracking utility for PowerShell
# Enables tracking and reporting on script execution times

# Initialize the performance tracker
$script:performanceTimings = @{}
$script:performanceStartTimes = @{}

# Function to start timing an operation
function Start-Timing {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Operation
    )
    
    $script:performanceStartTimes[$Operation] = Get-Date
}

# Function to stop timing an operation and record the result
function Stop-Timing {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Operation
    )
    
    if ($script:performanceStartTimes.ContainsKey($Operation)) {
        $startTime = $script:performanceStartTimes[$Operation]
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        $script:performanceTimings[$Operation] = $duration
        
        return $duration
    } else {
        Write-Warning "No start time recorded for operation: $Operation"
        return 0
    }
}

# Function to get the timing for a specific operation
function Get-Timing {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Operation
    )
    
    if ($script:performanceTimings.ContainsKey($Operation)) {
        return $script:performanceTimings[$Operation]
    } else {
        Write-Warning "No timing recorded for operation: $Operation"
        return 0
    }
}

# Function to get all performance timings
function Get-AllTimings {
    return $script:performanceTimings
}

# Function to reset all timings
function Reset-Timings {
    $script:performanceTimings = @{}
    $script:performanceStartTimes = @{}
}

# Function to print a performance report
function Write-PerformanceReport {
    $totalDuration = 0
    
    Write-Host ""
    Write-Host "Performance Report:"
    Write-Host "==================="
    
    foreach ($key in $script:performanceTimings.Keys | Sort-Object) {
        $duration = $script:performanceTimings[$key]
        $totalDuration += $duration
        Write-Host ("{0,-40} {1,8:F2} seconds" -f $key, $duration)
    }
    
    Write-Host "-----------------------------------------"
    Write-Host ("{0,-40} {1,8:F2} seconds" -f "Total", $totalDuration)
    Write-Host ""
}

# Initialize the performance timer
function Initialize-PerformanceTimer {
    Reset-Timings
    Start-Timing "Total Execution"
    
    Write-Host "Performance timing initialized"
}

# No need to export functions, they will be available in the scope where the script is dot-sourced
