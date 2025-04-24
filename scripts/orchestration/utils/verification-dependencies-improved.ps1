# PowerShell Verification Dependencies Module for Reset-and-Migrate.ps1
# This file has been refactored into a modular system in the dependency-system directory.
# It is maintained for backward compatibility and simply dot-sources the new implementation.

# Import the new modular implementation
. "$PSScriptRoot\dependency-system\verification-dependencies-optimized.ps1"

# All functions from the refactored modules are now available in this scope.
# This ensures backward compatibility with existing code that imports this file.

# Log a message to indicate the modular system is being used
Log-Message "Using modular dependency system for verification dependencies" "Cyan"

# Initialize the dependency system if this file is being sourced directly
if (-not $script:completedDependencies) {
    Initialize-DependencySystem
}
