# PowerShell Path Management Module for Reset-and-Migrate.ps1
# Handles directory navigation and path resolution

# Find and store the project root path
function Get-ProjectRoot {
    # Start from current location and search upward
    $currentPath = Get-Location
    $testPath = $currentPath.Path
    
    # Keep going up until we find both packages/ and apps/ directories
    while (-not (Test-Path -Path (Join-Path -Path $testPath -ChildPath "packages")) -or 
           -not (Test-Path -Path (Join-Path -Path $testPath -ChildPath "apps"))) {
        $parentPath = Split-Path -Path $testPath -Parent
        if ($null -eq $parentPath -or $parentPath -eq $testPath) {
            throw "Could not find project root containing both 'packages' and 'apps' directories"
        }
        $testPath = $parentPath
    }
    
    return $testPath
}

# Store the project root when this module is imported
$script:ProjectRoot = Get-ProjectRoot

# Function to get absolute path from project-relative path
function Get-AbsolutePath {
    param (
        [Parameter(Mandatory = $true)]
        [string]$RelativePath
    )
    
    return Join-Path -Path $script:ProjectRoot -ChildPath $RelativePath
}

# Function to safely change directory, ensuring it exists
function Set-ProjectLocation {
    param (
        [Parameter(Mandatory = $true)]
        [string]$RelativePath
    )
    
    $targetPath = Get-AbsolutePath -RelativePath $RelativePath
    
    if (Test-Path -Path $targetPath -PathType Container) {
        Set-Location -Path $targetPath
        return $true
    } else {
        return $false
    }
}

# Function to ensure we return to project root
function Set-ProjectRootLocation {
    Set-Location -Path $script:ProjectRoot
    return $true
}

# No need to export functions when dot-sourcing
# All functions and variables will be available in the calling script
