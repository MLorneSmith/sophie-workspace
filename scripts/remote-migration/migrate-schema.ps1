# PowerShell script to migrate schema to remote Supabase instance

param (
    [string]$RemoteDbUrl,
    [switch]$SkipDiff
)

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Import modules
. "$PSScriptRoot\utils\path-management.ps1"
. "$PSScriptRoot\utils\logging.ps1"
. "$PSScriptRoot\utils\database.ps1"
. "$PSScriptRoot\utils\remote-config.ps1"

# Initialize logging
Log-Phase "STARTING SCHEMA MIGRATION"

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
    
    # Phase 2: Ensure tables exist before schema push
    Log-Phase "TABLE PREPARATION PHASE"
    Log-Message "Ensuring tables exist before schema modifications..." "Yellow"
    
    # Get a list of all tables in the schema files
    # First, check if there's a recent migration file to parse
    $migrationFiles = Get-ChildItem -Path "supabase/migrations" -Filter "*.sql" | Sort-Object LastWriteTime -Descending
    $tablesToCreate = @()
    
    if ($migrationFiles.Count -gt 0) {
        $latestMigration = $migrationFiles[0].FullName
        Log-Message "Analyzing latest migration file: $($migrationFiles[0].Name)" "Cyan"
        
        # Parse the SQL file to extract table names that are being altered
        $migrationContent = Get-Content -Path $latestMigration -Raw
        
        # Look for ALTER TABLE statements
        $alterTableMatches = [regex]::Matches($migrationContent, 'alter\s+table\s+"?([a-zA-Z0-9_]+)"?\."?([a-zA-Z0-9_]+)"?', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        
        foreach ($match in $alterTableMatches) {
            $schema = $match.Groups[1].Value
            $table = $match.Groups[2].Value
            
            if ($schema -eq "payload" -and $tablesToCreate -notcontains $table) {
                $tablesToCreate += $table
                Log-Message "Found table to ensure exists: $table" "Gray"
            }
        }
        
        # Also look for downloads-related tables specifically
        $downloadsRelatedTables = @(
            "posts__downloads",
            "course_lessons__downloads",
            "course_quizzes__downloads",
            "courses__downloads", 
            "documentation__downloads",
            "surveys__downloads"
        )
        
        foreach ($table in $downloadsRelatedTables) {
            if ($tablesToCreate -notcontains $table) {
                $tablesToCreate += $table
                Log-Message "Adding downloads-related table: $table" "Gray"
            }
        }
    }
    
    # Add all known content type tables
    $allTables = Get-ContentTypeTables -contentType "all"
    foreach ($table in $allTables) {
        if ($tablesToCreate -notcontains $table) {
            $tablesToCreate += $table
            Log-Message "Adding known content table: $table" "Gray"
        }
    }
    
    # Ensure the tables exist
    if ($tablesToCreate.Count -gt 0) {
        Log-Message "Creating $($tablesToCreate.Count) tables if they don't exist..." "Yellow"
        Create-SchemaTablesProgressively -connectionString $dbUrl -tables $tablesToCreate -schema "payload"
        Log-Success "Table preparation completed successfully"
    } else {
        Log-Message "No tables to prepare" "Yellow"
    }
    
    # Phase 3: Push schema to remote
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
    # Final message
    Log-Phase "SCHEMA MIGRATION COMPLETE"
}
