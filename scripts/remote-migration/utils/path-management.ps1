# Path management utilities for Supabase Remote Migration
# These utilities help with managing file paths and directory navigation

# Set the location to the project root directory
function Set-ProjectRootLocation {
    # Get current location
    $currentPath = Get-Location
    
    # Check if we're already in the project root
    if (Test-Path "supabase" -PathType Container) {
        Log-Message "Already in project root directory: $currentPath" "Gray"
        return
    }
    
    # Check for common project root indicators
    if (Test-Path "scripts/remote-migration") {
        # We're in the project root
        return
    }
    
    # Navigate up until we find the project root
    $count = 0
    $maxDepth = 5
    
    while ($count -lt $maxDepth) {
        Set-Location ..
        $count++
        
        if (Test-Path "scripts/remote-migration") {
            Log-Message "Changed to project root directory: $(Get-Location)" "Gray"
            return
        }
    }
    
    # If we couldn't find a parent directory with the project root indicators,
    # return to the original location and log an error
    Set-Location $currentPath
    Log-Warning "Could not locate project root directory from $currentPath"
}

# Get the path to a specific subdirectory relative to project root
function Get-ProjectPath {
    param (
        [string]$subPath
    )
    
    $projectRoot = $PSScriptRoot
    while (-not (Test-Path "$projectRoot/scripts/remote-migration" -PathType Container)) {
        $projectRoot = Split-Path -Parent $projectRoot
        if ([string]::IsNullOrEmpty($projectRoot)) {
            Log-Warning "Could not locate project root directory"
            return $null
        }
    }
    
    $fullPath = Join-Path -Path $projectRoot -ChildPath $subPath
    return $fullPath
}
