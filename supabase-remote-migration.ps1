# Supabase Remote Migration Wrapper Script
# This wrapper script makes it easy to run the migration process from the root directory
# while keeping the actual scripts organized in subdirectories

# Parameters for the script
param (
    [switch]$Test,
    [switch]$SchemaOnly,
    [switch]$DataOnly,
    [switch]$PostsOnly,
    [switch]$VerifyOnly,
    [switch]$UUIDTablesOnly,
    [switch]$ProgressiveOnly,
    [switch]$FixOnly,
    [switch]$SyncOnly,
    [switch]$FixConnectionString,
    [switch]$DiagnoseCourse,
    [switch]$SkipDiff,
    [switch]$SkipFixes,
    [switch]$SkipVerify,
    [switch]$SkipCore,
    [switch]$SkipDocumentation,
    [switch]$SkipCourses,
    [switch]$SkipQuizzes,
    [switch]$SkipSurveys,
    [switch]$TestCoreOnly,
    [switch]$TestPostsOnly,
    [string]$RepairMigration
)

# Set environment variable for migration repair if provided
if ($RepairMigration) {
    $env:MIGRATION_REPAIR_VERSION = $RepairMigration
}

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Display banner
function Show-Banner {
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "         SLIDEHEROES REMOTE MIGRATION UTILITY          " -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "This wrapper script calls the organized migration scripts in the"
    Write-Host "scripts/orchestration/remote-migration directory."
    Write-Host ""
    Write-Host "Command options:"
    Write-Host "  -Test           : Run connection test only"
    Write-Host "  -SchemaOnly     : Migrate schema only"
    Write-Host "  -DataOnly       : Migrate data only (legacy)"
    Write-Host "  -PostsOnly      : Migrate only posts data"
    Write-Host "  -ProgressiveOnly: Run progressive content migration only"
    Write-Host "  -VerifyOnly     : Run content verification only"
    Write-Host "  -UUIDTablesOnly : Set up UUID table management only"
    Write-Host "  -FixOnly        : Run relationship fixes only"
    Write-Host "  -SyncOnly       : Synchronize migrations between local and remote"
    Write-Host "  -FixConnectionString: Fix database connection string issues"
    Write-Host "  -DiagnoseCourse : Diagnose course route issues in remote database"
    Write-Host "  -RepairMigration: Repair a specific migration by version"
    Write-Host "  -SkipDiff       : Skip schema diff generation"
    Write-Host "  -SkipFixes      : Skip data relationship fixes"
    Write-Host "  -SkipVerify     : Skip verification steps"
    Write-Host "  -SkipCore       : Skip core tables migration"
    Write-Host "  -SkipDocumentation : Skip documentation migration"
    Write-Host "  -SkipCourses    : Skip courses migration"
    Write-Host "  -SkipQuizzes    : Skip quizzes migration"
    Write-Host "  -SkipSurveys    : Skip surveys migration"
    Write-Host "  -TestCoreOnly   : Run core tables migration test only"
    Write-Host "  -TestPostsOnly  : Run posts migration test only"
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host ""
}

# Show banner
Show-Banner

try {
    # Path to the scripts
    $migrationDir = Join-Path -Path $PSScriptRoot -ChildPath "scripts\orchestration\remote-migration"
    $migrationScript = Join-Path -Path $migrationDir -ChildPath "master-migration.ps1"
    $testScript = Join-Path -Path $migrationDir -ChildPath "tests\basic-connection-test.ps1"
    $testCoreScript = Join-Path -Path $migrationDir -ChildPath "tests\test-core-tables.ps1"
    $testPostsScript = Join-Path -Path $migrationDir -ChildPath "tests\test-posts-only.ps1"
    $schemaScript = Join-Path -Path $migrationDir -ChildPath "migrate-schema.ps1"
    $dataScript = Join-Path -Path $migrationDir -ChildPath "migrate-data.ps1"
    $verifyScript = Join-Path -Path $migrationDir -ChildPath "verify-remote-content.ps1"
    $postsScript = Join-Path -Path $migrationDir -ChildPath "migrate-posts-direct.ps1"
    $uuidTablesScript = Join-Path -Path $migrationDir -ChildPath "setup-uuid-tables.ps1"
    $progressiveScript = Join-Path -Path $migrationDir -ChildPath "migrate-content-progressive.ps1"
    $fixRelationshipsScript = Join-Path -Path $migrationDir -ChildPath "fix-remote-relationships.ps1"
    $syncMigrationsScript = Join-Path -Path $migrationDir -ChildPath "sync-migrations.ps1"
    $fixConnStringScript = Join-Path -Path $migrationDir -ChildPath "fix-connection-string.ps1"
    $diagnoseCourseScript = Join-Path -Path $migrationDir -ChildPath "diagnose-course-route.ps1"
    
    # Check if essential scripts exist
    if (-not (Test-Path -Path $testScript)) {
        throw "Test script not found at: $testScript"
    }
    
    # Run the appropriate script based on parameters
    if ($Test) {
        Write-Host "Running connection test only..." -ForegroundColor Yellow
        & $testScript
        exit $LASTEXITCODE
    }
    
    if ($TestCoreOnly) {
        Write-Host "Running core tables migration test only..." -ForegroundColor Yellow
        if (-not (Test-Path -Path $testCoreScript)) {
            throw "Core tables test script not found at: $testCoreScript"
        }
        & $testCoreScript
        exit $LASTEXITCODE
    }
    
    if ($TestPostsOnly) {
        Write-Host "Running posts migration test only..." -ForegroundColor Yellow
        if (-not (Test-Path -Path $testPostsScript)) {
            throw "Posts test script not found at: $testPostsScript"
        }
        & $testPostsScript
        exit $LASTEXITCODE
    }
    
    if ($SchemaOnly) {
        Write-Host "Running schema migration only..." -ForegroundColor Yellow
        $params = @()
        if ($SkipDiff) {
            $params += "-SkipDiff"
        }
        & $schemaScript @params
        exit $LASTEXITCODE
    }
    
    if ($DataOnly) {
        Write-Host "Running data migration only..." -ForegroundColor Yellow
        $params = @()
        if ($SkipFixes) {
            $params += "-SkipFixes"
        }
        if ($SkipVerify) {
            $params += "-SkipVerification"
        }
        & $dataScript @params
        exit $LASTEXITCODE
    }
    
    if ($PostsOnly) {
        Write-Host "Running posts data migration only..." -ForegroundColor Yellow
        if (-not (Test-Path -Path $postsScript)) {
            throw "Posts migration script not found at: $postsScript"
        }
        & $postsScript
        exit $LASTEXITCODE
    }
    
    if ($VerifyOnly) {
        Write-Host "Running content verification..." -ForegroundColor Yellow
        if (-not (Test-Path -Path $verifyScript)) {
            throw "Verification script not found at: $verifyScript"
        }
        & $verifyScript -VerifyAll
        exit $LASTEXITCODE
    }
    
    if ($ProgressiveOnly) {
        Write-Host "Running progressive content migration only..." -ForegroundColor Yellow
        if (-not (Test-Path -Path $progressiveScript)) {
            throw "Progressive migration script not found at: $progressiveScript"
        }
        
        $params = @()
        if ($SkipCore) { $params += "-SkipCore" }
        if ($SkipDocumentation) { $params += "-SkipDocumentation" }
        if ($SkipCourses) { $params += "-SkipCourses" }
        if ($SkipQuizzes) { $params += "-SkipQuizzes" }
        if ($SkipSurveys) { $params += "-SkipSurveys" }
        if ($SkipVerify) { $params += "-SkipVerify" }
        
        & $progressiveScript @params
        exit $LASTEXITCODE
    }
    
    if ($FixOnly) {
        Write-Host "Running relationship fixes only..." -ForegroundColor Yellow
        if (-not (Test-Path -Path $fixRelationshipsScript)) {
            throw "Relationship fixes script not found at: $fixRelationshipsScript"
        }
        & $fixRelationshipsScript -FixAll
        exit $LASTEXITCODE
    }
    
    if ($SyncOnly) {
        Write-Host "Running migration synchronization only..." -ForegroundColor Yellow
        if (-not (Test-Path -Path $syncMigrationsScript)) {
            throw "Migration synchronization script not found at: $syncMigrationsScript"
        }
        & $syncMigrationsScript
        exit $LASTEXITCODE
    }
    
    if ($FixConnectionString) {
        Write-Host "Running connection string fix..." -ForegroundColor Yellow
        if (-not (Test-Path -Path $fixConnStringScript)) {
            throw "Connection string fix script not found at: $fixConnStringScript"
        }
        & $fixConnStringScript
        exit $LASTEXITCODE
    }
    
    if ($DiagnoseCourse) {
        Write-Host "Running course route diagnosis..." -ForegroundColor Yellow
        if (-not (Test-Path -Path $diagnoseCourseScript)) {
            throw "Course route diagnostic script not found at: $diagnoseCourseScript"
        }
        & $diagnoseCourseScript
        exit $LASTEXITCODE
    }
    
    if ($UUIDTablesOnly) {
        Write-Host "Setting up UUID table management only..." -ForegroundColor Yellow
        if (-not (Test-Path -Path $uuidTablesScript)) {
            throw "UUID tables script not found at: $uuidTablesScript"
        }
        & $uuidTablesScript
        exit $LASTEXITCODE
    }
    
    # If no specific script was specified, run the full migration
    Write-Host "Running full migration process..." -ForegroundColor Yellow
    
    # First, check the connection string
    Write-Host "1. Checking database connection string..." -ForegroundColor Yellow
    if (Test-Path -Path $fixConnStringScript) {
        & $fixConnStringScript
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: Connection string check had issues. Continuing with caution..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Warning: Connection string check script not found. Continuing without check..." -ForegroundColor Yellow
    }
    
    # Next, synchronize migrations
    Write-Host "2. Synchronizing migrations between local and remote..." -ForegroundColor Yellow
    if (Test-Path -Path $syncMigrationsScript) {
        & $syncMigrationsScript
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: Migration synchronization had issues. Continuing with caution..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Warning: Migration synchronization script not found. Continuing without sync..." -ForegroundColor Yellow
    }
    
    # Build parameters for progressive migration
    $progressiveParams = @()
    if ($SkipCore) { $progressiveParams += "-SkipCore" }
    if ($SkipDocumentation) { $progressiveParams += "-SkipDocumentation" }
    if ($SkipCourses) { $progressiveParams += "-SkipCourses" }
    if ($SkipQuizzes) { $progressiveParams += "-SkipQuizzes" }
    if ($SkipSurveys) { $progressiveParams += "-SkipSurveys" }
    if ($SkipVerify) { $progressiveParams += "-SkipVerify" }
    
    # Build parameters for schema migration
    $schemaParams = @()
    if ($SkipDiff) { $schemaParams += "-SkipDiff" }
    
    # Run schema migration
    Write-Host "3. Running schema migration..." -ForegroundColor Yellow
    & $schemaScript @schemaParams
    
    # Setup UUID tables
    Write-Host "4. Setting up UUID table management..." -ForegroundColor Yellow
    & $uuidTablesScript
    
    # Run progressive content migration
    Write-Host "5. Running progressive content migration..." -ForegroundColor Yellow
    if (Test-Path -Path $progressiveScript) {
        & $progressiveScript @progressiveParams
    } else {
        # Fallback to just migrating posts data if progressive script doesn't exist
        Write-Host "Progressive migration script not found. Falling back to posts migration only." -ForegroundColor Yellow
        & $postsScript
    }
    
    # Run relationship fixes
    if (-not $SkipFixes) {
        Write-Host "6. Running relationship fixes..." -ForegroundColor Yellow
        if (Test-Path -Path $fixRelationshipsScript) {
            & $fixRelationshipsScript -FixAll
        } else {
            Write-Host "Relationship fixes script not found. Skipping." -ForegroundColor Yellow
        }
    }
    
    # Run verification
    if (-not $SkipVerify) {
        Write-Host "7. Running content verification..." -ForegroundColor Yellow
        if (Test-Path -Path $verifyScript) {
            & $verifyScript -VerifyAll
        } else {
            Write-Host "Verification script not found. Skipping." -ForegroundColor Yellow
        }
    }
    
    Write-Host "Full migration process completed successfully!" -ForegroundColor Green
    exit $LASTEXITCODE
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
