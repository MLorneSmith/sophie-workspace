# Dependency Execution Optimization Plan

## 1. Introduction and Issue Summary

The content migration system, orchestrated by the `reset-and-migrate.ps1` script, has been improved with recent updates to the dependency handling system. However, there are still some inefficiencies and potential issues that could be addressed to make the migration process more robust, transparent, and maintainable.

Based on analysis of the latest migration logs and examination of the current verification-dependencies-improved.ps1 implementation, several minor issues have been identified:

1. **Redundant Script Execution**: Some dependency scripts are being executed multiple times unnecessarily, which wastes processing time and may lead to inconsistent states.
2. **Dependency Warning Messages**: There are warning messages about dependencies that, while not critical failures, might confuse users and make it difficult to distinguish between expected warnings and actual problems.
3. **Limited Visualization**: The current dependency system lacks clear visualization, making it difficult to understand the execution flow and identify bottlenecks.
4. **Potential Race Conditions**: Multiple scripts modifying the same tables could cause race conditions or transaction conflicts.
5. **Suboptimal Error Handling**: The system could benefit from more granular and context-specific error handling for critical dependencies.

This plan outlines a comprehensive approach to address these issues without disrupting the existing functionality.

## 2. Detailed Analysis

### Current Dependency System Implementation

The current dependency system in `scripts/orchestration/utils/verification-dependencies-improved.ps1` provides:

1. **Dependency Tracking**: A mechanism to track which dependencies have already been executed
2. **Automatic Dependency Resolution**: Functions to ensure dependencies are run before verification steps
3. **Basic Reporting**: Functions to show which dependencies have been completed

However, the system has the following limitations:

```powershell
# Current implementation excerpt showing overlapping dependencies
$script:verificationDependencies["verify:all"] = @(
    "sql:ensure-todo-column",
    "fix:todo-fields",
    "fix:lexical-format",
    "fix:payload-relationships-strict-improved"
)

# Separate verification step with overlapping dependencies
$script:verificationDependencies["verify:todo-fields"] = @(
    "sql:ensure-todo-column",
    "fix:todo-fields",
    "fix:lexical-format"
)
```

This structure leads to redundant execution when a verification step with overlapping dependencies runs after a previous step already executed some of the dependencies.

### Analysis of Migration Log Symptoms

From the migration log, we can observe:

1. Multiple executions of the same dependency scripts
2. Warning messages about dependencies that might confuse users
3. Long execution chains with potential for race conditions
4. Limited visibility into which dependencies are actually necessary

For example, the log shows dependencies like `fix:todo-fields` and `fix:lexical-format` being run multiple times, which is unnecessary and inefficient.

## 3. Root Causes

### 3.1 Dependency Definition Structure

The current dependency system uses a simple key-value mapping between verification steps and dependencies, without considering:

1. **Hierarchical Dependencies**: Some dependencies might themselves have dependencies
2. **Shared Dependencies**: Multiple verification steps have overlapping dependencies
3. **Execution Order**: The order of dependencies might matter for certain operations

### 3.2 Dependency Execution Logic

The dependency execution logic doesn't:

1. **Analyze Dependencies Before Execution**: Pre-analyze all dependencies to optimize the execution plan
2. **Group Related Dependencies**: Group related operations that should be executed together
3. **Consider Transactional Boundaries**: Define clear transaction boundaries for related operations

### 3.3 Reporting and Visualization

The reporting system provides basic information but lacks:

1. **Detailed Timing**: Information about how long each dependency took to execute
2. **Dependency Relationships**: Visualization of the dependency graph
3. **Execution Plan**: Clear representation of which dependencies will be executed and why

## 4. Proposed Solutions

### 4.1 Optimize Dependency Structure and Execution

1. **Refactor Dependency Definitions**:

   - Create a hierarchical dependency graph with parent-child relationships
   - Define dependency groups for related operations
   - Specify execution order constraints where necessary

2. **Implement Intelligent Dependency Resolution**:

   - Pre-analyze the dependency graph to determine the minimal set of dependencies to run
   - Group dependency execution to minimize transaction conflicts
   - Implement topological sorting for dependencies with order constraints

3. **Add Dependency Annotation**:
   - Add metadata to dependencies such as criticality, estimated time, and purpose
   - Use annotations to provide better error messages and execution planning

### 4.2 Enhance Error Handling

1. **Categorize Errors by Severity and Type**:

   - Distinguish between expected transient errors and critical failures
   - Provide specific recovery strategies for different error types
   - Add context-specific error messages with troubleshooting guidance

2. **Implement Graceful Degradation**:

   - Allow partial success with clear reporting of what completed and what failed
   - Provide recovery paths for common failure scenarios
   - Add the option to re-run specific failed dependencies without restarting the entire migration

3. **Improve Transaction Management**:
   - Use explicit transaction blocks for related operations
   - Add savepoints for complex operations with potential for partial success
   - Implement proper transaction isolation levels based on the operation type

### 4.3 Implement Comprehensive Visualization and Reporting

1. **Create Dependency Graph Visualization**:

   - Generate a visual representation of the dependency graph
   - Highlight execution paths and completed dependencies
   - Show timing information and bottlenecks

2. **Enhance Execution Reporting**:

   - Provide detailed reports of what was executed and why
   - Show skipped dependencies and the reason for skipping
   - Include timing information and success/failure status

3. **Add Diagnostic Tools**:
   - Implement functions to analyze the dependency structure for inconsistencies
   - Create tools to validate the dependency graph for cycles or unreachable nodes
   - Add performance profiling for dependency execution

## 5. Implementation Plan

### Phase 1: Refactor Dependency Structure

1. **Create Enhanced Dependency Data Structure**:

```powershell
# Define a more comprehensive dependency structure
$script:dependencyGraph = @{
    # Dependencies as nodes with metadata
    "Nodes" = @{
        "sql:ensure-todo-column" = @{
            "Description" = "Ensures the todo column exists in course_lessons table",
            "Category" = "Database",
            "Critical" = $true,
            "EstimatedTime" = "1s"
        },
        "fix:todo-fields" = @{
            "Description" = "Fixes todo fields in course_lessons table",
            "Category" = "Content",
            "Critical" = $true,
            "EstimatedTime" = "2s",
            "Dependencies" = @("sql:ensure-todo-column")
        }
        # ...other nodes
    },

    # Verification steps with required dependencies
    "VerificationSteps" = @{
        "verify:todo-fields" = @{
            "Description" = "Verifies todo fields are properly populated",
            "Dependencies" = @("fix:todo-fields", "fix:lexical-format")
        }
        # ...other verification steps
    },

    # Logical dependency groups for related operations
    "Groups" = @{
        "TodoFieldsGroup" = @("sql:ensure-todo-column", "fix:todo-fields", "fix:lexical-format"),
        "RelationshipsGroup" = @("fix:payload-relationships-strict-improved", "fix:direct-quiz-fix")
        # ...other groups
    }
}
```

2. **Implement Dependency Resolution Functions**:

```powershell
function Resolve-DependencyGraph {
    param (
        [string]$VerificationStep
    )

    # Get direct dependencies for the verification step
    $directDeps = $script:dependencyGraph.VerificationSteps[$VerificationStep].Dependencies

    # Resolve recursive dependencies
    $allDeps = @()
    foreach ($dep in $directDeps) {
        $allDeps += $dep
        if ($script:dependencyGraph.Nodes[$dep].Dependencies) {
            $allDeps += Resolve-DependencyDag -DependencyName $dep
        }
    }

    # Remove duplicates and return sorted list
    return $allDeps | Select-Object -Unique | Sort-Object
}

function Resolve-DependencyDag {
    param (
        [string]$DependencyName
    )

    $deps = @()

    # Get dependencies of this dependency
    $nodeDeps = $script:dependencyGraph.Nodes[$DependencyName].Dependencies

    if ($nodeDeps) {
        foreach ($dep in $nodeDeps) {
            $deps += $dep
            # Recursive call for nested dependencies
            $deps += Resolve-DependencyDag -DependencyName $dep
        }
    }

    return $deps
}
```

3. **Update Tracking Mechanism**:

```powershell
# Add timing and status tracking
$script:dependencyStatus = @{}

function Update-DependencyStatus {
    param (
        [string]$DependencyName,
        [bool]$Success,
        [int]$ExecutionTimeMs,
        [string]$ErrorMessage = $null
    )

    $script:dependencyStatus[$DependencyName] = @{
        "Success" = $Success,
        "ExecutionTimeMs" = $ExecutionTimeMs,
        "ErrorMessage" = $ErrorMessage,
        "ExecutedAt" = Get-Date
    }
}
```

### Phase 2: Implement Optimized Execution Engine

1. **Create Intelligent Execution Function**:

```powershell
function Invoke-OptimizedDependencies {
    param (
        [string]$VerificationStep,
        [bool]$ContinueOnError = $false
    )

    # Get all dependencies including nested ones
    $allDeps = Resolve-DependencyGraph -VerificationStep $VerificationStep

    # Filter out already completed dependencies
    $pendingDeps = $allDeps | Where-Object { -not $script:dependencyStatus.ContainsKey($_) -or -not $script:dependencyStatus[$_].Success }

    # Group dependencies by category for more efficient execution
    $groupedDeps = $pendingDeps | Group-Object -Property { $script:dependencyGraph.Nodes[$_].Category }

    # Execute dependencies by group
    foreach ($group in $groupedDeps) {
        Log-Message "Processing $($group.Count) dependencies in category $($group.Name)..." "Yellow"

        foreach ($dep in $group.Group) {
            $startTime = (Get-Date).Ticks / 10000
            $success = Invoke-Dependency -Name $dep -IgnoreErrors $ContinueOnError
            $endTime = (Get-Date).Ticks / 10000
            $executionTime = $endTime - $startTime

            Update-DependencyStatus -DependencyName $dep -Success $success -ExecutionTimeMs $executionTime

            if (-not $success -and -not $ContinueOnError -and $script:dependencyGraph.Nodes[$dep].Critical) {
                Log-Error "Critical dependency $dep failed. Cannot continue with verification."
                return $false
            }
        }
    }

    return $true
}
```

2. **Enhance Dependency Execution Function**:

```powershell
function Invoke-Dependency {
    param (
        [string]$Name,
        [bool]$IgnoreErrors = $false,
        [bool]$Force = $false
    )

    # Skip if already completed successfully (unless forced)
    if (-not $Force -and $script:dependencyStatus.ContainsKey($Name) -and $script:dependencyStatus[$Name].Success) {
        Log-Message "Dependency '$Name' already completed successfully, skipping" "Gray"
        return $true
    }

    $metadata = $script:dependencyGraph.Nodes[$Name]
    Log-Message "Running dependency: $Name - $($metadata.Description)" "Yellow"

    try {
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            # Use transaction if appropriate for this dependency category
            $useTransaction = $metadata.Category -in @("Database", "Relationships")

            if ($useTransaction) {
                Log-Message "Starting transaction for $Name" "Gray"
                # Execute begin transaction command
            }

            Exec-Command -command "pnpm run $Name" -description "Running dependency: $Name" -continueOnError $IgnoreErrors
            $exitCode = $LASTEXITCODE

            if ($exitCode -eq 0) {
                if ($useTransaction) {
                    Log-Message "Committing transaction for $Name" "Gray"
                    # Execute commit transaction command
                }

                Log-Success "Dependency '$Name' completed successfully"
                Pop-Location
                return $true
            } else {
                if ($useTransaction) {
                    Log-Message "Rolling back transaction for $Name" "Gray"
                    # Execute rollback transaction command
                }

                $errorMsg = "Dependency '$Name' failed with exit code $exitCode"

                if (-not $IgnoreErrors) {
                    Log-Warning $errorMsg

                    # Add context-specific guidance based on the dependency
                    if ($Name -eq "fix:payload-relationships-strict-improved") {
                        Log-Message "This may indicate issues with the relationship tables. Try running 'pnpm run fix:uuid-tables' first." "Yellow"
                    }

                    Pop-Location
                    return $false
                } else {
                    Log-Warning "$errorMsg but continuing as requested"
                    Pop-Location
                    return $false
                }
            }
        } else {
            Log-Warning "Could not change to packages/content-migrations directory"
            return $false
        }
    } catch {
        $errorMsg = "Exception while running dependency '$Name': $_"

        if (-not $IgnoreErrors) {
            Log-Error $errorMsg
            return $false
        } else {
            Log-Warning "$errorMsg but continuing as requested"
            return $false
        }
    }
}
```

### Phase 3: Create Visualization and Reporting Tools

1. **Implement Dependency Graph Visualization**:

```powershell
function Show-DependencyGraph {
    param (
        [string]$VerificationStep = $null
    )

    Log-Message "Dependency Graph Visualization:" "Cyan"

    if ($VerificationStep) {
        # Show graph for specific verification step
        $deps = Resolve-DependencyGraph -VerificationStep $VerificationStep
        Log-Message "Dependencies for verification step '$VerificationStep':" "Yellow"
        Show-DependencyTree -Dependencies $deps -Level 0
    } else {
        # Show full graph
        foreach ($step in $script:dependencyGraph.VerificationSteps.Keys) {
            Log-Message "Verification step: $step" "Yellow"
            $deps = $script:dependencyGraph.VerificationSteps[$step].Dependencies
            Show-DependencyTree -Dependencies $deps -Level 1
            Log-Message "" "White"
        }
    }
}

function Show-DependencyTree {
    param (
        [string[]]$Dependencies,
        [int]$Level
    )

    foreach ($dep in $Dependencies) {
        $indent = "  " * $Level
        $status = if ($script:dependencyStatus.ContainsKey($dep)) {
            if ($script:dependencyStatus[$dep].Success) { "[DONE]" } else { "[FAIL]" }
        } else {
            "[PEND]"
        }

        $time = if ($script:dependencyStatus.ContainsKey($dep)) {
            "$($script:dependencyStatus[$dep].ExecutionTimeMs)ms"
        } else {
            "est. $($script:dependencyGraph.Nodes[$dep].EstimatedTime)"
        }

        Log-Message "$indent$status $dep - $time" "Gray"

        # Show nested dependencies
        if ($script:dependencyGraph.Nodes[$dep].Dependencies) {
            Show-DependencyTree -Dependencies $script:dependencyGraph.Nodes[$dep].Dependencies -Level ($Level + 1)
        }
    }
}
```

2. **Create Advanced Execution Report**:

```powershell
function Show-ExecutionReport {
    param (
        [switch]$IncludeTimings,
        [switch]$IncludePending,
        [switch]$IncludeGroups
    )

    Log-Message "Dependency Execution Report:" "Cyan"

    # Show successful dependencies
    $completed = $script:dependencyStatus.Keys | Where-Object { $script:dependencyStatus[$_].Success } | Sort-Object
    Log-Message "Completed Dependencies ($($completed.Count)):" "Green"
    foreach ($dep in $completed) {
        $time = if ($IncludeTimings) { " - $($script:dependencyStatus[$dep].ExecutionTimeMs)ms" } else { "" }
        Log-Message "  - $dep$time" "Green"
    }

    # Show failed dependencies
    $failed = $script:dependencyStatus.Keys | Where-Object { -not $script:dependencyStatus[$_].Success } | Sort-Object
    if ($failed.Count -gt 0) {
        Log-Message "Failed Dependencies ($($failed.Count)):" "Red"
        foreach ($dep in $failed) {
            $time = if ($IncludeTimings) { " - $($script:dependencyStatus[$dep].ExecutionTimeMs)ms" } else { "" }
            $error = if ($script:dependencyStatus[$dep].ErrorMessage) { " - $($script:dependencyStatus[$dep].ErrorMessage)" } else { "" }
            Log-Message "  - $dep$time$error" "Red"
        }
    }

    # Show pending dependencies if requested
    if ($IncludePending) {
        $allDeps = $script:dependencyGraph.Nodes.Keys
        $pending = $allDeps | Where-Object { -not $script:dependencyStatus.ContainsKey($_) } | Sort-Object
        if ($pending.Count -gt 0) {
            Log-Message "Pending Dependencies ($($pending.Count)):" "Gray"
            foreach ($dep in $pending) {
                Log-Message "  - $dep - est. $($script:dependencyGraph.Nodes[$dep].EstimatedTime)" "Gray"
            }
        }
    }

    # Show dependency groups if requested
    if ($IncludeGroups) {
        Log-Message "Dependency Groups:" "Cyan"
        foreach ($group in $script:dependencyGraph.Groups.Keys) {
            $deps = $script:dependencyGraph.Groups[$group]
            $completed = $deps | Where-Object { $script:dependencyStatus.ContainsKey($_) -and $script:dependencyStatus[$_].Success }
            $percentage = [math]::Round(($completed.Count / $deps.Count) * 100)
            Log-Message "  - $group: $($completed.Count)/$($deps.Count) ($percentage%)" "Yellow"
        }
    }
}
```

3. **Implement Diagnostic Functions**:

```powershell
function Test-DependencyGraph {
    Log-Message "Running dependency graph diagnostics..." "Cyan"

    # Check for undefined dependencies
    $allDeps = @()
    foreach ($step in $script:dependencyGraph.VerificationSteps.Keys) {
        $allDeps += $script:dependencyGraph.VerificationSteps[$step].Dependencies
    }
    foreach ($node in $script:dependencyGraph.Nodes.Keys) {
        if ($script:dependencyGraph.Nodes[$node].Dependencies) {
            $allDeps += $script:dependencyGraph.Nodes[$node].Dependencies
        }
    }

    $uniqueDeps = $allDeps | Select-Object -Unique
    $undefinedDeps = $uniqueDeps | Where-Object { -not $script:dependencyGraph.Nodes.ContainsKey($_) }

    if ($undefinedDeps.Count -gt 0) {
        Log-Warning "Found $($undefinedDeps.Count) undefined dependencies:"
        foreach ($dep in $undefinedDeps) {
            Log-Message "  - $dep" "Yellow"
        }
    } else {
        Log-Success "All dependencies are properly defined"
    }

    # Check for circular dependencies
    $circular = Find-CircularDependencies
    if ($circular.Count -gt 0) {
        Log-Warning "Found $($circular.Count) circular dependency chains:"
        foreach ($chain in $circular) {
            Log-Message "  - $chain" "Yellow"
        }
    } else {
        Log-Success "No circular dependencies found"
    }

    # Check for redundant dependencies
    $redundant = Find-RedundantDependencies
    if ($redundant.Count -gt 0) {
        Log-Warning "Found $($redundant.Count) redundant dependencies:"
        foreach ($item in $redundant) {
            Log-Message "  - $($item.Step): $($item.Redundant) (already included via $($item.Via))" "Yellow"
        }
    } else {
        Log-Success "No redundant dependencies found"
    }
}

function Find-CircularDependencies {
    $results = @()

    foreach ($node in $script:dependencyGraph.Nodes.Keys) {
        $visited = @{}
        $path = @()

        if (Test-CircularDependency -Node $node -Visited $visited -Path $path -Result ([ref]$results)) {
            # Circular dependency found and added to results
        }
    }

    return $results
}

function Test-CircularDependency {
    param (
        [string]$Node,
        [hashtable]$Visited,
        [array]$Path,
        [ref]$Result
    )

    if ($Visited.ContainsKey($Node)) {
        if ($Visited[$Node]) {
            # This node is in the current path, circular dependency found
            $circularPath = $Path + @($Node)
            $Result.Value += ($circularPath -join " -> ")
            return $true
        }
        return $false
    }

    # Mark as being visited in current path
    $Visited[$Node] = $true
    $Path += $Node

    # Check children
    if ($script:dependencyGraph.Nodes[$Node].Dependencies) {
        foreach ($dep in $script:dependencyGraph.Nodes[$Node].Dependencies) {
            if (Test-CircularDependency -Node $dep -Visited $Visited -Path $Path -Result $Result) {
                return $true
            }
        }
    }

    # Mark as no longer in current path
    $Visited[$Node] = $false
    return $false
}

function Find-RedundantDependencies {
    $results = @()

    foreach ($step in $script:dependencyGraph.VerificationSteps.Keys) {
        $directDeps = $script:dependencyGraph.VerificationSteps[$step].Dependencies
        $allIndirectDeps = @()

        # Build list of all indirect dependencies
        foreach ($dep in $directDeps) {
            $indirectDeps = Resolve-DependencyDag -DependencyName $dep
            foreach ($indirect in $indirectDeps) {
                $allIndirectDeps += @{
                    "Dependency" = $indirect
                    "Via" = $dep
                }
            }
        }

        # Find redundancies
        foreach ($dep in $directDeps) {
            $redundantVia = $allIndirectDeps | Where-Object { $_.Dependency -eq $dep } | Select-Object -First 1

            if ($redundantVia) {
                $results += @{
                    "Step" = $step
                    "Redundant" = $dep
                    "Via" = $redundantVia.Via
                }
            }
        }
    }

    return $results
}
```

### Phase 4: Update Main Migration Script

1. **Update Reset-and-Migrate.ps1 to Use Enhanced System**:

```powershell
# PowerShell script to reset the database and run all migrations
# Organized in a modular structure with clear phases

# Parameters for the script
param (
    [switch]$ForceRegenerate,
    [switch]$SkipVerification,
    [switch]$OptimizeDependencies = $true # Add new parameter
)

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Import modules
. "$PSScriptRoot\scripts\orchestration\utils\path-management.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\logging.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\enhanced-logging.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\execution.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\verification.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\diagnostic.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\configuration.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\performance-logging.ps1"
# Use the new optimized dependency system if enabled
if ($OptimizeDependencies) {
    . "$PSScriptRoot\scripts\orchestration\utils\verification-dependencies-optimized.ps1"
} else {
    . "$PSScriptRoot\scripts\orchestration\utils\verification-dependencies-improved.ps1"
}
. "$PSScriptRoot\scripts\orchestration\utils\dependency-graph.ps1"
. "$PSScriptRoot\scripts\orchestration\phases\setup.ps1"
. "$PSScriptRoot\scripts\orchestration\phases\processing.ps1"
. "$PSScriptRoot\scripts\orchestration\phases\loading.ps1"

# Global variables
$script:overallSuccess = $true

try {
    # Initialize logging and environment
    Initialize-Logging
    Initialize-Timer

    # Initialize dependency tracking if using optimized system
    if ($OptimizeDependencies) {
        Initialize-DependencyGraph
        Log-Message "Using optimized dependency system" "Cyan"
    }

    # Move PNPM configuration from payload to root
    Move-PnpmConfiguration

    # Phase 1: Setup
    # Reset Supabase database, run Web app migrations, reset Payload schema, run Payload migrations
    Log-EnhancedPhase -PhaseName "SETUP PHASE" -PhaseNumber 1 -TotalPhases 4
    Invoke-SetupPhase
    Log-EnhancedPhaseCompletion -PhaseName "SETUP PHASE" -Success $true

    # Phase 2: Processing
    # Process raw data, generate SQL seed files, fix quiz ID consistency, fix references
    Log-EnhancedPhase -PhaseName "PROCESSING PHASE" -PhaseNumber 2 -TotalPhases 4
    Invoke-ProcessingPhase -ForceRegenerate:$ForceRegenerate
    Log-EnhancedPhaseCompletion -PhaseName "PROCESSING PHASE" -Success $true

    # Phase 3: Loading
    # Run content migrations, import downloads, fix relationships, verify database
    Log-EnhancedPhase -PhaseName "LOADING PHASE" -PhaseNumber 3 -TotalPhases 4
    Invoke-LoadingPhase -SkipVerification:$SkipVerification
    Log-EnhancedPhaseCompletion -PhaseName "LOADING PHASE" -Success $true

    # Phase 4: Post-Verification
    # Verify specific collections and content integrity
    if (-not $SkipVerification) {
        Log-EnhancedPhase -PhaseName "POST-VERIFICATION PHASE" -PhaseNumber 4 -TotalPhases 4

        # Verify posts content integrity with dependency management
        Log-EnhancedStep -StepName "Verifying posts content integrity" -StepNumber 12 -TotalSteps 12
        Set-ProjectRootLocation
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"

            # Use optimized dependency verification if enabled
            Log-Message "Running post content verification with dependency handling..." "Yellow"

            if ($OptimizeDependencies) {
                $postVerificationResult = Invoke-VerificationWithOptimizedDependencies -VerificationStep "verify:post-content" -Description "Verifying posts content with dependencies" -ContinueOnError $true
            } else {
                $postVerificationResult = Invoke-VerificationWithDependencies -VerificationStep "verify:post-content" -Description "Verifying posts content with dependencies" -ContinueOnError $true
            }

            if ($postVerificationResult) {
                Log-Success "Post content verification passed with automatic dependency handling"
            } else {
                Log-Warning "Post content verification found issues that need manual inspection"
                $script:overallSuccess = $false
            }

            Pop-Location
            Log-Message "Returned to directory: $(Get-Location)" "Gray"
        } else {
            Log-Warning "Could not find packages/content-migrations directory, skipping posts verification"
        }
        Log-EnhancedStepCompletion -Success $true

        Log-EnhancedPhaseCompletion -PhaseName "POST-VERIFICATION PHASE" -Success $true
    }

    # Final success/failure message with diagnostic summary
    Finalize-Timer

    if ($script:overallSuccess) {
        Log-Success "All migrations and verifications completed successfully!"
        Log-Message "Admin user created with email: michael@slideheroes.com" "Green"

        # Show performance report
        Show-PerformanceReport

        # Show dependency report if using optimized system
        if ($OptimizeDependencies) {
            Show-ExecutionReport -IncludeTimings
        }

        # Show diagnostic summary with improved reliability
        Log-Message "Migration Summary:" "Cyan"

        # Run diagnostic with timeout handling
        try {
            Show-MigrationDiagnostic -TimeoutSeconds 20
        } catch {
            Log-Warning "Could not generate migration statistics: $_"
            Log-Message "For detailed migration status, run: pnpm --filter @kit/content-migrations run diagnostic:migration-status" "Yellow"
        }

        # Note about warnings - use the enhanced expected warning format
        Log-ExpectedWarning "Warning messages about 'No posts were migrated' are expected if all posts are already in the database."
        Log-ExpectedWarning "Warning messages about 'verification found issues' during early phases are expected and will be fixed in later phases."
    } else {
        Log-Warning "Migration process completed with warnings or errors. Please check the logs for details."

        # Still show performance report and diagnostic summary even on warning/error
        Show-PerformanceReport

        # Show dependency report with failures highlighted if using optimized system
        if ($OptimizeDependencies) {
            Show-ExecutionReport -IncludeTimings -IncludePending
        }

        Log-Message "Migration Status:" "Cyan"
        try {
            Show-MigrationDiagnostic -TimeoutSeconds 15
        } catch {
            Log-Warning "Could not generate migration statistics: $_"
            Log-Message "For detailed migration status, run: pnpm --filter @kit/content-migrations run diagnostic:migration-status" "Yellow"
        }
    }
}
catch {
    Log-Error "CRITICAL ERROR: Migration process failed: $_"
    Log-Message "Please check the log files for details:" "Red"
    Log-Message "  - Transcript log: $script:logFile" "Red"
    Log-Message "  - Detailed log: $script:detailedLogFile" "Red"

    # Show dependency failures if using optimized system
    if ($OptimizeDependencies) {
        Log-Message "Dependency failures:" "Red"
        Show-ExecutionReport -IncludeTimings
    }

    # Stop transcript before exiting
    try {
        Stop-
```
