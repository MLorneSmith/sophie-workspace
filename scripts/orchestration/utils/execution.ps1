# PowerShell Execution Module for Reset-and-Migrate.ps1
# Extracted from the existing script to support modularization

# Import the logging module if not already imported
if (-not (Get-Command -Name "Log-Message" -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\logging.ps1"
}

# Track overall success
$script:overallSuccess = $true
$script:currentStep = "Initialization"

# Function to execute a command and check its exit code
function Exec-Command {
    param (
        [string]$command,
        [string]$description,
        [switch]$captureOutput,
        [switch]$continueOnError
    )
    
    $script:currentStep = $description
    Log-Message "EXECUTING: $command" "Gray"
    Log-Message "DESCRIPTION: $description" "Gray"
    
    try {
        if ($captureOutput) {
            # Capture both stdout and stderr
            $output = Invoke-Expression "$command 2>&1" | Out-String
            
            # Try to write to the log file, but don't fail if the file is in use
            try {
                Add-Content -Path $script:detailedLogFile -Value "--- Command Output Start ---`n$output`n--- Command Output End ---" -ErrorAction SilentlyContinue
            }
            catch {
                Write-Host "Warning: Could not write command output to log file: $_" -ForegroundColor Yellow
            }
            
            # Check exit code
            if ($LASTEXITCODE -ne 0 -and -not $continueOnError) {
                Log-Error "Command failed with exit code: $LASTEXITCODE"
                throw "Command failed with exit code: $LASTEXITCODE"
            }
            
            return $output
        } else {
            # Execute without capturing
            Invoke-Expression $command
            
            # Check exit code
            if ($LASTEXITCODE -ne 0 -and -not $continueOnError) {
                Log-Error "Command failed with exit code: $LASTEXITCODE"
                throw "Command failed with exit code: $LASTEXITCODE"
            }
        }
    }
    catch {
        Log-Error "Error in step '$description': $_"
        $script:overallSuccess = $false
        
        if (-not $continueOnError) {
            throw $_
        } else {
            Log-Warning "Continuing despite error due to continueOnError flag"
        }
    }
}

# Function to verify database schema exists
function Verify-Schema {
    param (
        [string]$schema
    )
    
    $result = Exec-Command -command "pnpm --filter @kit/content-migrations run verify:schema $schema" -description "Verifying schema '$schema' exists" -captureOutput
    
    if ($LASTEXITCODE -eq 0) {
        Log-Message "Schema '$schema' exists" "Green"
        return $true
    } else {
        Log-Message "Schema '$schema' does not exist" "Red"
        return $false
    }
}

# Function to verify table exists
function Verify-Table {
    param (
        [string]$schema,
        [string]$table
    )
    
    $result = Exec-Command -command "pnpm --filter @kit/content-migrations run verify:table $schema $table" -description "Verifying table '$schema.$table' exists" -captureOutput
    
    if ($LASTEXITCODE -eq 0) {
        Log-Message "Table '$schema.$table' exists" "Green"
        return $true
    } else {
        Log-Message "Table '$schema.$table' does not exist" "Red"
        return $false
    }
}

# Function to initialize migration
function Initialize-Migration {
    # Set error action preference to stop on errors
    $ErrorActionPreference = "Stop"
    
    # Initialize logging
    $logInfo = Initialize-Logging
    
    # Initialize success tracking
    $script:overallSuccess = $true
    $script:currentStep = "Initialization"
    
    return $logInfo
}

# Function to check if migration was successful
function Get-MigrationSuccess {
    return $script:overallSuccess
}

# All functions are automatically available when dot-sourced
# No need for Export-ModuleMember in this context
