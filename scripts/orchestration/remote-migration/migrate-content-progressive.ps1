# migrate-content-progressive.ps1

param (
    [switch]$SkipCore,
    [switch]$SkipDocumentation,
    [switch]$SkipCourses,
    [switch]$SkipQuizzes,
    [switch]$SkipSurveys,
    [switch]$SkipVerify
)

# Import required modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"
. "$PSScriptRoot\utils\column-checks.ps1"
. "$PSScriptRoot\utils\direct-sql-transfer.ps1"
. "$PSScriptRoot\utils\verification.ps1"

# Initialize logging
Initialize-Logging -logPrefix "progressive-migration"

try {
    Log-Phase "PROGRESSIVE MIGRATION PHASE"

    # Function to run a migration phase
    function Run-MigrationPhase {
        param (
            [string]$PhaseName,
            [string[]]$Tables,
            [switch]$Skip
        )

        if ($Skip) {
            Log-Message "Skipping $PhaseName phase (requested)" "Yellow"
            return
        }

        Log-Step "Running $PhaseName Migration Phase" 1

        # Create temporary directory for dumps
        $dumpDir = Join-Path -Path $env:TEMP -ChildPath "migration_${PhaseName}"
        New-Item -ItemType Directory -Path $dumpDir -Force | Out-Null

        # Create dumps for each table
        foreach ($table in $Tables) {
            $dumpFile = Join-Path -Path $dumpDir -ChildPath "$table.sql"
            Log-Message "Dumping payload.$table table to $dumpFile" "Yellow"

            # Use Supabase CLI with correct syntax - it doesn't support --table but supports --schema
            # Navigate to project root first, then to apps/web
            Set-ProjectRootLocation
            $webAppPath = Join-Path -Path (Get-Location) -ChildPath "apps\web"
            if (Test-Path $webAppPath) {
                Push-Location -Path $webAppPath
                Log-Message "Changed directory to: $webAppPath" "Green"
            } else {
                Log-Warning "Web app path not found: $webAppPath"
                throw "Cannot proceed: Web app path not found"
            }
            $supabaseDumpCmd = "supabase db dump --data-only --schema payload --local > `"$dumpFile.temp`""
            Exec-Command -command $supabaseDumpCmd -description "Dumping all payload tables" -continueOnError
            
            # Extract only the specific table data using PowerShell
            if (Test-Path "$dumpFile.temp") {
                $allContent = Get-Content -Path "$dumpFile.temp" -Raw
                # Search for the specific table's INSERT statements
                $tablePattern = "(?s)-- Data for Name: $table; .*?-- [^\r\n]*\r?\n"
                if ($allContent -match $tablePattern) {
                    $tableData = $matches[0]
                    Set-Content -Path $dumpFile -Value $tableData
                    Log-Message "Extracted $table data from full dump" "Green"
                } else {
                    Log-Message "No data found for $table in dump" "Yellow"
                    # Create empty file
                    Set-Content -Path $dumpFile -Value "-- No data for $table"
                }
                
                # Clean up temporary file
                Remove-Item -Path "$dumpFile.temp" -Force
            }
            Pop-Location
        }

        # Combine dumps into a single file
        $combinedDumpFile = Join-Path -Path $dumpDir -ChildPath "${PhaseName}_combined.sql"
        Log-Message "Combining dumps into $combinedDumpFile" "Yellow"

        # Create empty combined file
        New-Item -ItemType File -Path $combinedDumpFile -Force | Out-Null

        # Add header
        Add-Content -Path $combinedDumpFile -Value "-- $PhaseName Data Migration Script"
        Add-Content -Path $combinedDumpFile -Value "-- Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        Add-Content -Path $combinedDumpFile -Value ""
        Add-Content -Path $combinedDumpFile -Value "BEGIN;"

        # Concatenate all dump files
        foreach ($table in $Tables) {
            $dumpFile = Join-Path -Path $dumpDir -ChildPath "$table.sql"
            if (Test-Path $dumpFile) {
                $content = Get-Content -Path $dumpFile -Raw
                Add-Content -Path $combinedDumpFile -Value "-- Table: payload.$table"
                Add-Content -Path $combinedDumpFile -Value $content
                Add-Content -Path $combinedDumpFile -Value ""
            }
        }

        # Add transaction end
        Add-Content -Path $combinedDumpFile -Value "COMMIT;"

        # Apply to remote database using direct method - input content to temporary file
        Log-Message "Applying $PhaseName data to remote database..." "Yellow"
        
        Push-Location -Path "apps/web"
        
        # Create a temporary SQL file in the supabase/seed directory
        $seedDir = Join-Path -Path "supabase" -ChildPath "seed"
        if (-not (Test-Path $seedDir)) {
            New-Item -ItemType Directory -Path $seedDir -Force | Out-Null
        }
        
        $seedFile = Join-Path -Path $seedDir -ChildPath "$PhaseName.sql"
        Copy-Item -Path $combinedDumpFile -Destination $seedFile -Force
        
        # Use supabase db push with include-seed flag to apply seed data
        Log-Message "Pushing seed data to remote database..." "Yellow"
        $pushCmd = "supabase db push --db-url=`"$env:REMOTE_DATABASE_URL`" --include-seed"
        Exec-Command -command $pushCmd -description "Applying $PhaseName data to remote"
        
        # Clean up the temporary file
        Remove-Item -Path $seedFile -Force -ErrorAction SilentlyContinue
        
        Pop-Location

        # Run relationship fixes
        Log-Message "Running relationship fixes for $PhaseName..." "Yellow"

        # Temporarily set DATABASE_URI to remote
        $originalDatabaseUri = $env:DATABASE_URI
        $env:DATABASE_URI = $env:REMOTE_DATABASE_URL

        Set-ProjectRootLocation
        # Get the content migrations path relative to project root
        Set-ProjectRootLocation
        $contentMigrationsPath = Join-Path -Path (Get-Location) -ChildPath "packages\content-migrations"
        if (Test-Path $contentMigrationsPath) {
            Push-Location -Path $contentMigrationsPath
            Log-Message "Changed directory to: $contentMigrationsPath" "Green"
            
            # Check if scripts exist before running them
            $packageJson = Join-Path -Path $contentMigrationsPath -ChildPath "package.json"
            if (Test-Path $packageJson) {
                $packageData = Get-Content -Path $packageJson -Raw | ConvertFrom-Json

                # Generic fix script based on content type
                if ($packageData.scripts -and $packageData.scripts.'fix:relationships-direct') {
                    Log-Message "Running relationship fixes script..." "Yellow"
                    Exec-Command -command "pnpm run fix:relationships-direct" -description "Fixing relationships"
                } else {
                    Log-Warning "Script 'fix:relationships-direct' not found in package.json, skipping"
                }

                # Type-specific fixes if available
                switch ($PhaseName) {
                    "Posts" {
                        if ($packageData.scripts -and $packageData.scripts.'fix:post-image-relationships') {
                            Log-Message "Running post image relationship fixes..." "Yellow"
                            Exec-Command -command "pnpm run fix:post-image-relationships" -description "Fixing post image relationships"
                        }
                    }
                    "Documentation" {
                        # Add doc-specific fixes if any
                    }
                    "Courses" {
                        # Add course-specific fixes if any
                    }
                }

                # Always fix Lexical format safely with column check
                switch ($PhaseName) {
                    "Posts" {
                        Safe-Fix-Lexical-Format -collection "posts"
                    }
                    "Documentation" {
                        Safe-Fix-Lexical-Format -collection "documentation"
                    }
                    "Courses" {
                        Safe-Fix-Lexical-Format -collection "course_lessons"
                        Safe-Fix-Lexical-Format -collection "course_lessons" -field "todo"
                    }
                }
            } else {
                Log-Warning "package.json not found in content-migrations path: $packageJson"
            }

            # Restore original DATABASE_URI
            $env:DATABASE_URI = $originalDatabaseUri
            Pop-Location
        } else {
            Log-Warning "Content migrations path not found: $contentMigrationsPath"
            throw "Cannot proceed: Content migrations path not found"
        }

        # Cleanup
        if (Test-Path $dumpDir) {
            Remove-Item -Path $dumpDir -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        # Add verification for the tables
        Log-Message "Verifying $PhaseName migration..." "Yellow"
        foreach ($table in $Tables) {
            try {
                # Verify the table was migrated successfully
                $verified = Verify-TableMigration -schema "payload" -table $table
                if (-not $verified) {
                    Log-Warning "Verification incomplete for payload.$table, but continuing"
                }
            }
            catch {
                Log-Warning "Verification failed for payload.$table - $_. Continuing anyway."
            }
        }

        Log-Success "$PhaseName migration completed"
    }

    # Core Tables Migration
    $coreTables = @(
        "users",
        "media",
        "payload_preferences",
        "payload_migrations"
    )
    Run-MigrationPhase -PhaseName "Core" -Tables $coreTables -Skip:$SkipCore

    # Documentation Migration
    $docTables = @(
        "documentation",
        "documentation_rels",
        "documentation_categories",
        "documentation_tags",
        "documentation_breadcrumbs",
        "documentation__downloads"
    )
    Run-MigrationPhase -PhaseName "Documentation" -Tables $docTables -Skip:$SkipDocumentation

    # Course Migration
    $courseTables = @(
        "courses",
        "courses_rels",
        "courses__downloads",
        "course_lessons",
        "course_lessons_rels",
        "course_lessons__downloads",
        "course_quizzes",
        "course_quizzes_rels",
        "course_quizzes__downloads"
    )
    Run-MigrationPhase -PhaseName "Courses" -Tables $courseTables -Skip:$SkipCourses

    # Quiz Migration
    $quizTables = @(
        "quiz_questions",
        "quiz_questions_rels",
        "quiz_questions_options"
    )
    Run-MigrationPhase -PhaseName "Quizzes" -Tables $quizTables -Skip:$SkipQuizzes

    # Survey Migration
    $surveyTables = @(
        "surveys",
        "surveys_rels",
        "surveys__downloads",
        "survey_questions",
        "survey_questions_rels",
        "survey_questions_options"
    )
    Run-MigrationPhase -PhaseName "Surveys" -Tables $surveyTables -Skip:$SkipSurveys

    # Run final verification if required
    if (-not $SkipVerify) {
        Log-Phase "FINAL VERIFICATION PHASE"

        # Temporarily set DATABASE_URI to remote
        $originalDatabaseUri = $env:DATABASE_URI
        $env:DATABASE_URI = $env:REMOTE_DATABASE_URL

        Set-ProjectRootLocation
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Running full verification on remote database..." "Yellow"
            Exec-Command -command "pnpm run verify:all" -description "Running full verification"

            # Restore original DATABASE_URI
            $env:DATABASE_URI = $originalDatabaseUri
        }
    }

    Log-Success "Progressive content migration completed successfully"
}
catch {
    Log-Error "CRITICAL ERROR: Progressive migration failed: $_"
    exit 1
}
finally {
    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
