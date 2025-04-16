# Progressive Content Migration Script
# This script implements the progressive migration approach for Payload CMS data
# by migrating one content type at a time with comprehensive verification

# Import utility modules
. "$PSScriptRoot\utils\database.ps1"
. "$PSScriptRoot\utils\direct-sql-transfer.ps1"
. "$PSScriptRoot\utils\uuid-tables.ps1"
. "$PSScriptRoot\utils\verification.ps1"

# Parameters
param (
    [switch]$SkipCore,
    [switch]$SkipPosts,
    [switch]$SkipDocumentation,
    [switch]$SkipCourses, 
    [switch]$SkipQuizzes,
    [switch]$SkipSurveys,
    [switch]$SkipDownloads,
    [switch]$SkipUUIDTables,
    [switch]$SkipVerify,
    [switch]$UseSupabaseCLI,
    [switch]$ForceRecreate
)

# Configure error handling
$ErrorActionPreference = "Stop"

function Start-ProgressiveMigration {
    try {
        # Show banner
        Log-Phase "STARTING PROGRESSIVE CONTENT MIGRATION"

        # Test database connections
        Log-Step "Testing database connections"
        $localConnectionOk = Test-DatabaseConnection -connectionString $env:DATABASE_URL -name "local database"
        $remoteConnectionOk = Test-DatabaseConnection -connectionString $env:REMOTE_DATABASE_URL -name "remote database"

        if (-not $localConnectionOk -or -not $remoteConnectionOk) {
            throw "Database connection issues detected. Cannot proceed with migration."
        }

        # Compare local and remote schemas to ensure all tables exist
        Log-Step "Comparing local and remote schemas"
        $schemaComparison = Compare-SchemaTables -schema "payload"
        
        if ($schemaComparison.MissingInRemote.Count -gt 0) {
            Log-Warning "The following tables exist in local but not in remote: $($schemaComparison.MissingInRemote -join ', ')"
            throw "Schema mismatch detected. Please run schema migration first."
        }

        # Store migration results
        $migrationResults = @()

        # Process UUID tables first for identification
        if (-not $SkipUUIDTables) {
            Log-Step "Processing UUID Tables"
            # Process UUID tables on remote to ensure required columns exist
            $uuidTables = Process-UUIDTables -connectionString $env:REMOTE_DATABASE_URL -schema "payload"
            Log-Success "Processed $($uuidTables.Count) UUID tables in remote database"
        }

        # Core tables migration
        if (-not $SkipCore) {
            $coreTables = Get-ContentTypeTables -contentType "core"
            $result = Migrate-ContentType -contentType "CORE" -tables $coreTables -description "Basic user and media tables" -skipVerification:$SkipVerify -useSupabaseCLI:$UseSupabaseCLI
            $migrationResults += $result
        }

        # Posts migration 
        if (-not $SkipPosts) {
            $postsTables = Get-ContentTypeTables -contentType "posts"
            $result = Migrate-ContentType -contentType "POSTS" -tables $postsTables -description "Blog posts and categories" -skipVerification:$SkipVerify -useSupabaseCLI:$UseSupabaseCLI
            $migrationResults += $result
        }

        # Documentation migration
        if (-not $SkipDocumentation) {
            $documentationTables = Get-ContentTypeTables -contentType "documentation"
            $result = Migrate-ContentType -contentType "DOCUMENTATION" -tables $documentationTables -description "Documentation pages and structure" -skipVerification:$SkipVerify -useSupabaseCLI:$UseSupabaseCLI
            $migrationResults += $result
        }

        # Course content migration
        if (-not $SkipCourses) {
            $courseTables = Get-ContentTypeTables -contentType "courses"
            $result = Migrate-ContentType -contentType "COURSES" -tables $courseTables -description "Course content and lessons" -skipVerification:$SkipVerify -useSupabaseCLI:$UseSupabaseCLI
            $migrationResults += $result
        }

        # Quiz content migration
        if (-not $SkipQuizzes) {
            $quizTables = Get-ContentTypeTables -contentType "quizzes"
            $result = Migrate-ContentType -contentType "QUIZZES" -tables $quizTables -description "Quizzes and questions" -skipVerification:$SkipVerify -useSupabaseCLI:$UseSupabaseCLI
            $migrationResults += $result
        }

        # Survey content migration
        if (-not $SkipSurveys) {
            $surveyTables = Get-ContentTypeTables -contentType "surveys"
            $result = Migrate-ContentType -contentType "SURVEYS" -tables $surveyTables -description "Surveys and questions" -skipVerification:$SkipVerify -useSupabaseCLI:$UseSupabaseCLI
            $migrationResults += $result
        }

        # Downloads migration
        if (-not $SkipDownloads) {
            $downloadsTables = Get-ContentTypeTables -contentType "downloads"
            $result = Migrate-ContentType -contentType "DOWNLOADS" -tables $downloadsTables -description "Downloads and relationships" -skipVerification:$SkipVerify -useSupabaseCLI:$UseSupabaseCLI
            $migrationResults += $result
        }
        
        # Process UUID tables again to migrate data if they weren't empty
        if (-not $SkipUUIDTables) {
            Log-Step "Migrating UUID relationship tables"
            
            # Get all UUID tables from local database
            $localUUIDTables = Get-UUIDTables -connectionString $env:DATABASE_URL -schema "payload"
            
            if ($localUUIDTables.Count -gt 0) {
                Log-Message "Found $($localUUIDTables.Count) UUID tables to migrate" "Cyan"
                
                $successful = 0
                $failed = 0
                
                foreach ($table in $localUUIDTables) {
                    Log-Message "Processing UUID table: $table" "Yellow"
                    
                    # Ensure table has required columns in remote database
                    Ensure-UUIDTableColumns -connectionString $env:REMOTE_DATABASE_URL -schema "payload" -table $table
                    
                    # Migrate the data
                    $result = Transfer-TableData -schema "payload" -table $table -verifyAfterTransfer:(-not $SkipVerify)
                    
                    if ($result) {
                        $successful++
                    } else {
                        $failed++
                    }
                }
                
                $migrationResults += @{
                    ContentType = "UUID_TABLES"
                    SuccessCount = $successful
                    FailedCount = $failed
                    TotalTables = $localUUIDTables.Count
                }
                
                Log-Message "UUID tables migration: $successful succeeded, $failed failed" "Cyan"
            } else {
                Log-Message "No UUID tables found in local database" "Yellow"
            }
        }

        # Display migration summary
        Log-Phase "MIGRATION SUMMARY"
        
        $totalSuccess = 0
        $totalFailed = 0
        $totalTables = 0
        
        foreach ($result in $migrationResults) {
            $totalSuccess += $result.SuccessCount
            $totalFailed += $result.FailedCount
            $totalTables += $result.TotalTables
            
            Log-Message "$($result.ContentType): $($result.SuccessCount)/$($result.TotalTables) tables migrated successfully"
        }
        
        $successPercentage = if ($totalTables -gt 0) { [math]::Round(($totalSuccess / $totalTables) * 100, 2) } else { 0 }
        
        if ($totalFailed -eq 0) {
            Log-Success "ALL CONTENT MIGRATED SUCCESSFULLY!"
        } else {
            Log-Warning "MIGRATION COMPLETED WITH ISSUES: $totalSuccess/$totalTables tables migrated successfully ($successPercentage%)"
        }
        
        # Return summary results
        return @{
            Success = $totalFailed -eq 0
            SuccessCount = $totalSuccess
            FailedCount = $totalFailed
            TotalTables = $totalTables
            SuccessPercentage = $successPercentage
        }
    }
    catch {
        Log-Error "ERROR DURING PROGRESSIVE MIGRATION: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Execute the migration
Start-ProgressiveMigration
