# PowerShell Verification Dependencies Core Module
# Part of the modular dependency system for reset-and-migrate.ps1
#
# Purpose: Provides shared state, basic utilities, and initialization functions
# This module defines the core data structures and initialization functions for
# the dependency system.

# Import utility modules
. "$PSScriptRoot\..\logging.ps1"
. "$PSScriptRoot\..\path-management.ps1"
. "$PSScriptRoot\..\execution.ps1"

# Define verification dependencies between steps and their required fixes
$script:verificationDependencies = @{}

# Todo field verification depends on todo field fixes
$script:verificationDependencies["verify:todo-fields"] = @(
    "sql:ensure-todo-column",
    "fix:todo-fields",
    "fix:lexical-format"
)

# UUID table verification depends on UUID fixes
$script:verificationDependencies["verify:uuid-tables"] = @(
    "fix:uuid-tables",
    "repair:relationship-columns"
)

# Relationship verification depends on relationship fixes
$script:verificationDependencies["verify:relationships"] = @(
    "fix:payload-relationships-strict-improved", # Using the improved version
    "fix:direct-quiz-fix",
    "fix:invalid-quiz-references",
    "fix:lesson-quiz-relationships-comprehensive",
    "fix:question-quiz-relationships-comprehensive"
)

# Lexical format verification depends on Lexical format fixes
$script:verificationDependencies["verify:lexical-format"] = @(
    "fix:lexical-format",
    "fix:post-lexical-format",
    "fix:all-lexical-fields"
)

# Comprehensive verification depends on all fixes
$script:verificationDependencies["verify:all"] = @(
    "sql:ensure-todo-column",
    "fix:todo-fields",
    "fix:lexical-format",
    "fix:payload-relationships-strict-improved" # Using the improved version
)

# Post content verification depends on post lexical format fixes
$script:verificationDependencies["verify:post-content"] = @(
    "fix:post-lexical-format",
    "fix:all-lexical-fields",
    "fix:post-image-relationships"
)

# Track completed dependencies with enhanced data
$script:completedDependenciesMap = @{}
$script:dependencyExecutionLog = @()

# Function to reset dependency tracking
function Reset-DependencyTracking {
    Log-Message "Resetting dependency tracking" "Gray"
    $script:completedDependenciesMap = @{}
    $script:dependencyExecutionLog = @()
}

# Function to register a completed dependency with metadata
function Register-CompletedDependency {
    param (
        [Parameter(Mandatory = $true)]
        [string]$DependencyName,
        
        [Parameter(Mandatory = $false)]
        [string]$CalledBy = "Unknown",
        
        [Parameter(Mandatory = $false)]
        [bool]$Success = $true
    )
    
    # Create or update entry in the map
    $script:completedDependenciesMap[$DependencyName] = @{
        "CompletedAt" = Get-Date
        "CalledBy" = $CalledBy
        "Success" = $Success
    }
    
    # Add to execution log
    $script:dependencyExecutionLog += @{
        "Dependency" = $DependencyName
        "Timestamp" = Get-Date
        "CalledBy" = $CalledBy
        "Success" = $Success
    }
    
    Log-Message "Registered dependency: $DependencyName (called by: $CalledBy, success: $Success)" "Gray"
}

# Function to check if a dependency has been completed
function Test-DependencyCompleted {
    param (
        [Parameter(Mandatory = $true)]
        [string]$DependencyName
    )
    
    return $script:completedDependenciesMap.ContainsKey($DependencyName)
}

# Backward compatibility for legacy scripts
$script:completedDependencies = @()

# Initialize the dependency system
function Initialize-DependencySystem {
    [CmdletBinding()]
    param()
    
    Log-Message "Initializing modular dependency system..." "Cyan"
    Reset-DependencyTracking
    
    Log-Success "Dependency system initialized successfully"
}

# Functions are automatically available when dot-sourced
# No need for Export-ModuleMember in PowerShell scripts
