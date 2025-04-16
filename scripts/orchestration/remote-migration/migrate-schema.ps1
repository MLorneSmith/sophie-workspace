# PowerShell script to migrate schema to remote Supabase instance

param (
    [string]$RemoteDbUrl,
    [switch]$SkipDiff
)

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Import modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"

# Initialize logging
Initialize-Logging -logPrefix "schema-migration"

try {
    # Check remote DB URL
    if (-not $RemoteDbUrl -and -not $env:REMOTE_DATABASE_URL) {
        throw "Remote database URL not provided. Use -RemoteDbUrl parameter or set REMOTE_DATABASE_URL environment variable."
    }
    
    # Make sure the URL is properly formatted for CLI
    $dbUrl = if ($RemoteDbUrl) { $RemoteDbUrl } else { $env:REMOTE_DATABASE_URL }
    
    # Validate connection URL format
    if (-not ($dbUrl.StartsWith("postgresql://") -or $dbUrl.StartsWith("postgres://"))) {
        throw "Invalid database URL format. Must be in format: postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres or postgres://postgres.project-ref:password@aws-0-region.pooler.supabase.com:5432/postgres"
    }
    
    # Navigate to web directory
    Set-ProjectRootLocation
    Push-Location -Path "apps/web"
    Log-Message "Changed directory to: $(Get-Location)" "Gray"
    
    # Phase 1: Create migration diff
    if (-not $SkipDiff) {
        Log-Phase "SCHEMA DIFF PHASE"
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $migrationName = "remote_migration_$timestamp"
        
        Log-Message "Generating schema diff..." "Yellow"
        Exec-Command -command "supabase db diff -f $migrationName" -description "Generating schema diff"
        
        Log-Message "Schema diff generated. Migration file created at: supabase/migrations/$migrationName.sql" "Green"
        Log-Message "Please review this file before pushing to remote database!" "Yellow"
        
        # Prompt user to continue
        $continue = Read-Host "Continue with pushing schema to remote? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Log-Message "Migration aborted by user" "Yellow"
            return
        }
    }
    
    # Phase 2: Push schema to remote
    Log-Phase "SCHEMA PUSH PHASE"
    Log-Message "Pushing schema to remote database..." "Yellow"
    
    # Add include-roles flag to push any custom roles
    Exec-Command -command "supabase db push --db-url `"$dbUrl`" --include-roles" -description "Pushing schema to remote database"
    
    Log-Success "Schema successfully pushed to remote database"
    
    Pop-Location
    Log-Message "Returned to directory: $(Get-Location)" "Gray"
}
catch {
    Log-Error "CRITICAL ERROR: Schema migration failed: $_"
    exit 1
}
finally {
    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
