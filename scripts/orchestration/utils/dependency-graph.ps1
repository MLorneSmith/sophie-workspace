# Dependency graph for content migration steps

# Define the step dependency graph
$global:stepDependencies = @{
    # Setup Phase
    "ResetSupabaseDatabase" = @{
        "Id" = 1
        "Phase" = "Setup"
        "Dependencies" = @()
        "Function" = "Reset-SupabaseDatabase"
        "Parallel" = $false
    }
    "ResetPayloadSchema" = @{
        "Id" = 2
        "Phase" = "Setup"
        "Dependencies" = @("ResetSupabaseDatabase")
        "Function" = "Reset-PayloadSchema"
        "Parallel" = $false
    }
    "RunPayloadMigrations" = @{
        "Id" = 3
        "Phase" = "Setup"
        "Dependencies" = @("ResetPayloadSchema")
        "Function" = "Run-PayloadMigrations"
        "Parallel" = $false
    }

    # Processing Phase
    "ProcessRawData" = @{
        "Id" = 4
        "Phase" = "Processing"
        "Dependencies" = @("RunPayloadMigrations")
        "Function" = "Process-RawData"
        "Parallel" = $false
    }
    "GenerateSqlSeedFiles" = @{
        "Id" = 5
        "Phase" = "Processing"
        "Dependencies" = @("ProcessRawData")
        "Function" = "Generate-SqlSeedFiles"
        "Parallel" = $false
    }
    "FixReferences" = @{
        "Id" = 6
        "Phase" = "Processing"
        "Dependencies" = @("GenerateSqlSeedFiles")
        "Function" = "Fix-References"
        "Parallel" = $false
    }

    # Loading Phase
    "RunContentMigrations" = @{
        "Id" = 7
        "Phase" = "Loading"
        "Dependencies" = @("FixReferences")
        "Function" = "Run-ContentMigrations"
        "Parallel" = $false
    }
    "MigrateBlogPosts" = @{
        "Id" = 8.1
        "Phase" = "Loading"
        "Dependencies" = @("RunContentMigrations")
        "Function" = "Migrate-BlogPosts"
        "Parallel" = $true  # Can potentially run in parallel with others
    }
    "MigratePrivatePosts" = @{
        "Id" = 8.2
        "Phase" = "Loading"
        "Dependencies" = @("RunContentMigrations")
        "Function" = "Migrate-PrivatePosts"
        "Parallel" = $true  # Can potentially run in parallel with others
    }
    "FixUuidTables" = @{
        "Id" = 8.3
        "Phase" = "Loading"
        "Dependencies" = @("RunContentMigrations")
        "Function" = "Fix-UuidTables"
        "Parallel" = $true  # Can potentially run in parallel with others
    }
    "ImportDownloads" = @{
        "Id" = 9
        "Phase" = "Loading"
        "Dependencies" = @("RunContentMigrations", "FixUuidTables")
        "Function" = "Import-Downloads"
        "Parallel" = $false  # Better to run sequentially due to potential conflicts
    }
    "FixRelationships" = @{
        "Id" = 10
        "Phase" = "Loading"
        "Dependencies" = @("MigrateBlogPosts", "MigratePrivatePosts", "ImportDownloads")
        "Function" = "Fix-Relationships"
        "Parallel" = $false
    }
    "VerifyDatabaseState" = @{
        "Id" = 11
        "Phase" = "Loading"
        "Dependencies" = @("FixRelationships")
        "Function" = "Verify-DatabaseState"
        "Parallel" = $false
    }
    "CreateCertificatesBucket" = @{
        "Id" = 12
        "Phase" = "Loading"
        "Dependencies" = @("VerifyDatabaseState")
        "Function" = "Create-CertificatesBucket"
        "Parallel" = $false
    }

    # Verification Phase
    "VerifyPostsContent" = @{
        "Id" = 13
        "Phase" = "Verification"
        "Dependencies" = @("CreateCertificatesBucket")
        "Function" = "Verify-PostsContent"
        "Parallel" = $false
    }
}

# Track completed steps
$global:completedSteps = @()

function Mark-StepComplete {
    param (
        [string]$StepName
    )
    
    if (-not $global:completedSteps.Contains($StepName)) {
        $global:completedSteps += $StepName
    }
}

function Get-StepByID {
    param (
        [int]$ID
    )

    foreach ($step in $global:stepDependencies.GetEnumerator()) {
        if ($step.Value.Id -eq $ID) {
            return $step.Key
        }
    }

    return $null
}

function Get-DependenciesForStep {
    param (
        [string]$StepName
    )

    if (-not $global:stepDependencies.ContainsKey($StepName)) {
        Log-Warning "Step '$StepName' not found in dependency graph"
        return @()
    }

    return $global:stepDependencies[$StepName].Dependencies
}

function Get-ParallelizableSteps {
    $parallelizableSteps = @()
    
    foreach ($step in $global:stepDependencies.GetEnumerator()) {
        if ($step.Value.Parallel -and (Test-StepDependenciesSatisfied $step.Key)) {
            $parallelizableSteps += $step.Key
        }
    }
    
    return $parallelizableSteps
}

function Test-StepDependenciesSatisfied {
    param (
        [string]$StepName
    )
    
    if (-not $global:stepDependencies.ContainsKey($StepName)) {
        return $false
    }
    
    $step = $global:stepDependencies[$StepName]
    
    foreach ($dependency in $step.Dependencies) {
        if (-not $global:completedSteps.Contains($dependency)) {
            return $false
        }
    }
    
    return $true
}

function Show-DependencyGraph {
    $mermaidGraph = @"
graph TD;
"@
    
    foreach ($step in $global:stepDependencies.GetEnumerator()) {
        $stepName = $step.Key
        $dependencies = $step.Value.Dependencies
        
        if ($dependencies.Count -eq 0) {
            $mermaidGraph += "`n    $stepName;"
        } else {
            foreach ($dep in $dependencies) {
                $mermaidGraph += "`n    $dep --> $stepName;"
            }
        }
    }
    
    # Group by phase
    foreach ($phase in @("Setup", "Processing", "Loading", "Verification")) {
        $mermaidGraph += "`n    subgraph $phase"
        
        foreach ($step in $global:stepDependencies.GetEnumerator()) {
            if ($step.Value.Phase -eq $phase) {
                $mermaidGraph += "`n        $($step.Key);"
            }
        }
        
        $mermaidGraph += "`n    end"
    }
    
    Log-Message "Dependency Graph (Mermaid Format):" "Cyan"
    Write-Host $mermaidGraph
}

# Function to run potentially parallelizable steps
# Currently runs sequentially but logs that they could be parallelized
function Invoke-ParallelSteps {
    param (
        [string[]]$Steps,
        [hashtable]$Parameters = @{}
    )

    $results = @{}

    foreach ($step in $Steps) {
        Log-Message "Running step '$step' (could be parallelized)" "Magenta"

        $functionName = $global:stepDependencies[$step].Function
        $stepParams = if ($Parameters.ContainsKey($step)) { $Parameters[$step] } else { @{} }

        $results[$step] = & $functionName @stepParams
        
        # Mark step as complete
        Mark-StepComplete -StepName $step
    }

    return $results
}
