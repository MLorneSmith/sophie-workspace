# PowerShell script to orchestrate the entire migration process
# This is the main entry point for migrating to the remote Supabase instance

param (
    [switch]$SkipTest,
    [switch]$SkipDiff,
    [switch]$SkipFixes,
    [switch]$SkipVerification,
    [string]$RemoteDbUrl
)

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Import modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\verification.ps1"
. "$PSScriptRoot\..\utils\supabase.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"

# Global variables
$script:overallSuccess = $true

# Display banner
function Show-Banner {
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "         SLIDEHEROES REMOTE MIGRATION UTILITY          " -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "This utility will migrate your local Supabase database"
    Write-Host "to the remote Supabase instance at 2025slideheroes"
    Write-Host ""
    Write-Host "Steps that will be performed:"
    Write-Host "1. Test remote connection"
    Write-Host "2. Migrate schema to remote"
    Write-Host "3. Migrate data (dump & restore)"
    Write-Host "4. Fix relationships and verify"
    Write-Host ""
    
    if ($RemoteDbUrl) {
        Write-Host "Using custom remote URL: $RemoteDbUrl" -ForegroundColor Yellow
    } else {
        Write-Host "Using default remote URL from remote-config.ps1" -ForegroundColor Yellow
    }
    
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host ""
}

# Initialize the migration process
function Initialize-Migration {
    # Set database URL if provided
    if ($RemoteDbUrl) {
        $env:REMOTE_DATABASE_URL = $RemoteDbUrl
        Log-Message "Using provided Remote Database URL" "Yellow"
    }
    
    # Check if REMOTE_DATABASE_URL is set
    if (-not $env:REMOTE_DATABASE_URL) {
        Log-Error "REMOTE_DATABASE_URL environment variable not set"
        Log-Message "Please provide a remote database URL using the -RemoteDbUrl parameter" "Red"
        Log-Message "Or set the URL in scripts/orchestration/utils/remote-config.ps1" "Red"
        return $false
    }
    
    return $true
}

# Test remote connection
function Test-RemoteConnection {
    Log-Phase "TESTING REMOTE CONNECTION"
    
    try {
        # Run the test-remote-connection.ps1 script
        Log-Message "Running remote connection test..." "Yellow"
        $testScript = Join-Path -Path $PSScriptRoot -ChildPath "..\remote-test\test-remote-connection.ps1"
        
        if (Test-Path $testScript) {
            Exec-Command -command "powershell -File `"$testScript`"" -description "Testing remote connection"
            Log-Success "Remote connection test completed"
            return $true
        } else {
            Log-Error "Could not find test script at $testScript"
            return $false
        }
    }
    catch {
        Log-Error "Remote connection test failed: $_"
        return $false
    }
}

# Migrate schema to remote
function Migrate-SchemaToRemote {
    Log-Phase "MIGRATING SCHEMA TO REMOTE"
    
    try {
        # Run the migrate-schema.ps1 script
        Log-Message "Running schema migration..." "Yellow"
        $schemaScript = Join-Path -Path $PSScriptRoot -ChildPath "migrate-schema.ps1"
        
        $params = ""
        if ($SkipDiff) {
            $params += " -SkipDiff"
        }
        if ($RemoteDbUrl) {
            $params += " -RemoteDbUrl `"$RemoteDbUrl`""
        }
        
        if (Test-Path $schemaScript) {
            Exec-Command -command "powershell -File `"$schemaScript`"$params" -description "Migrating schema to remote"
            Log-Success "Schema migration completed"
            return $true
        } else {
            Log-Error "Could not find schema migration script at $schemaScript"
            return $false
        }
    }
    catch {
        Log-Error "Schema migration failed: $_"
        return $false
    }
}

# Migrate data to remote
function Migrate-DataToRemote {
    Log-Phase "MIGRATING DATA TO REMOTE"
    
    try {
        # Run the migrate-data.ps1 script
        Log-Message "Running data migration..." "Yellow"
        $dataScript = Join-Path -Path $PSScriptRoot -ChildPath "migrate-data.ps1"
        
        $params = ""
        if ($SkipFixes) {
            $params += " -SkipFixes"
        }
        if ($SkipVerification) {
            $params += " -SkipVerification"
        }
        
        if (Test-Path $dataScript) {
            Exec-Command -command "powershell -File `"$dataScript`"$params" -description "Migrating data to remote"
            Log-Success "Data migration completed"
            return $true
        } else {
            Log-Error "Could not find data migration script at $dataScript"
            return $false
        }
    }
    catch {
        Log-Error "Data migration failed: $_"
        return $false
    }
}

# Check if Supabase CLI is installed
function Test-SupabaseCLI {
    try {
        $version = Exec-Command -command "supabase --version" -description "Testing Supabase CLI availability" -captureOutput
        Log-Success "Supabase CLI detected: $version"
        return $true
    }
    catch {
        Log-Error "Supabase CLI not found. Please install it using: npm install -g supabase"
        return $false
    }
}

# Test connection to remote database
function Test-RemoteConnection {
    Log-Phase "TESTING REMOTE CONNECTION"
    
    try {
        # Go to web directory
        Set-ProjectRootLocation
        Push-Location -Path "apps/web"
        
        # Run a dry-run push to test the connection
        Log-Message "Testing connection to remote database..." "Yellow"
        $testOutput = Exec-Command -command "supabase db push --db-url `"$env:REMOTE_DATABASE_URL`" --dry-run" -description "Testing remote connection" -captureOutput
        
        if ($LASTEXITCODE -eq 0) {
            Log-Success "Connection to remote database successful"
            $connectionOk = $true
        } else {
            Log-Error "Connection to remote database failed with exit code: $LASTEXITCODE"
            Log-Message "Output: $testOutput" "Gray"
            $connectionOk = $false
        }
        
        # Return to original directory
        Pop-Location
        
        return $connectionOk
    } catch {
        Log-Error "Connection test failed: $_"
        return $false
    }
}

# Main execution
try {
    # Initialize logging
    Initialize-Logging -logPrefix "remote-migration"
    
    # Show banner
    Show-Banner
    
    # Initialize migration
    if (-not (Initialize-Migration)) {
        throw "Migration initialization failed"
    }
    
    # Verify Supabase CLI is installed
    if (-not (Test-SupabaseCLI)) {
        throw "Supabase CLI not found. Please install it using: npm install -g supabase"
    }
    
    # Step 1: Test remote connection - We'll skip the full test and just validate URL
    if (-not $SkipTest) {
        Log-Phase "TESTING REMOTE CONNECTION"
        
        # Validate connection URL format
        if (-not ($env:REMOTE_DATABASE_URL.StartsWith("postgresql://") -or $env:REMOTE_DATABASE_URL.StartsWith("postgres://"))) {
            throw "Invalid database URL format. Must be in format: postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres or postgres://postgres.project-ref:password@aws-0-region.pooler.supabase.com:5432/postgres"
        }
        
        Log-Success "Remote database URL format validated"
    } else {
        Log-Message "Skipping remote connection validation" "Yellow"
    }
    
    # Step 2: Migrate schema to remote
    if (-not (Migrate-SchemaToRemote)) {
        Log-Error "Schema migration failed, aborting migration"
        throw "Schema migration failed"
    }
    
    # Step 3: Migrate data to remote
    if (-not (Migrate-DataToRemote)) {
        Log-Error "Data migration failed"
        $script:overallSuccess = $false
        # Continue despite data migration errors
        Log-Warning "Continuing despite data migration errors"
    }
    
    # Final success/failure message
    if ($script:overallSuccess) {
        Log-Success "==== REMOTE MIGRATION COMPLETED SUCCESSFULLY ===="
        Log-Message "The database has been successfully migrated to the remote Supabase instance" "Green"
    } else {
        Log-Warning "==== REMOTE MIGRATION COMPLETED WITH WARNINGS OR ERRORS ===="
        Log-Message "Please check the logs for details" "Yellow"
    }
}
catch {
    Log-Error "CRITICAL ERROR: Migration failed: $_"
    Log-Message "Please check the log files for details:" "Red"
    Log-Message "  - Transcript log: $script:logFile" "Red"
    Log-Message "  - Detailed log: $script:detailedLogFile" "Red"
    exit 1
}
finally {
    # Finalize logging
    Finalize-Logging -success $script:overallSuccess
}
