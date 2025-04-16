# fix-remote-relationships.ps1

param (
    [switch]$FixPosts,
    [switch]$FixDocumentation,
    [switch]$FixCourses,
    [switch]$FixQuizzes,
    [switch]$FixSurveys,
    [switch]$FixAll,
    [switch]$FixLexical
)

# Import required modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"

# Initialize logging
Initialize-Logging -logPrefix "relationship-fixes"

try {
    Log-Phase "REMOTE RELATIONSHIP FIXES"

    # Temporarily set DATABASE_URI to remote and prepare environment
    $originalDatabaseUri = $env:DATABASE_URI
    $env:DATABASE_URI = $env:REMOTE_DATABASE_URL
    
    # Set DATABASE_URL as well for scripts that might use it
    $originalDatabaseUrl = $env:DATABASE_URL
    $env:DATABASE_URL = $env:REMOTE_DATABASE_URL

    Log-Message "Using remote database URL: $env:REMOTE_DATABASE_URL" "Cyan"
    
    # Verify direct access to remote database first
    Push-Location -Path "apps/web"
    Log-Message "Testing remote database connection..." "Yellow"
    Exec-Command -command "supabase db diff --db-url `"$env:REMOTE_DATABASE_URL`" --schema payload -s 1" -description "Testing remote connection" -continueOnError
    Pop-Location

    Set-ProjectRootLocation
    if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
        # UUID table fixes
        Log-Step "Fixing UUID Tables" 1
        Exec-Command -command "pnpm run fix:uuid-tables" -description "Fixing UUID tables"

        # Content-specific relationship fixes
        if ($FixAll -or $FixPosts) {
            Log-Step "Fixing Post Relationships" 2
            Exec-Command -command "pnpm run fix:post-image-relationships" -description "Fixing post image relationships"
        }

        if ($FixAll -or $FixDocumentation) {
            Log-Step "Fixing Documentation Relationships" 3
            # Check if this script exists, and if not, use a general fix
            if (Test-Path -Path "./src/scripts/repair/fix-documentation-relationships.ts") {
                Exec-Command -command "pnpm run fix:documentation-relationships" -description "Fixing documentation relationships"
            } else {
                Log-Message "Documentation relationship fix script not found, using general relationship fix" "Yellow"
                Exec-Command -command "pnpm run fix:relationships-direct -- --collection=documentation" -description "Fixing documentation relationships" -continueOnError
            }
        }

        if ($FixAll -or $FixCourses) {
            Log-Step "Fixing Course Relationships" 4
            # Check if this script exists, and if not, use a general fix
            if (Test-Path -Path "./src/scripts/repair/fix-course-relationships.ts") {
                Exec-Command -command "pnpm run fix:course-relationships" -description "Fixing course relationships"
            } else {
                Log-Message "Course relationship fix script not found, using general relationship fix" "Yellow"
                Exec-Command -command "pnpm run fix:relationships-direct -- --collection=courses" -description "Fixing course relationships" -continueOnError
                Exec-Command -command "pnpm run fix:relationships-direct -- --collection=course_lessons" -description "Fixing course lesson relationships" -continueOnError
                Exec-Command -command "pnpm run fix:relationships-direct -- --collection=course_quizzes" -description "Fixing course quiz relationships" -continueOnError
            }
        }

        if ($FixAll -or $FixQuizzes) {
            Log-Step "Fixing Quiz Relationships" 5
            # Check if this script exists, and if not, use a general fix
            if (Test-Path -Path "./src/scripts/repair/fix-quiz-relationships.ts") {
                Exec-Command -command "pnpm run fix:quiz-relationships" -description "Fixing quiz relationships"
            } else {
                Log-Message "Quiz relationship fix script not found, using general relationship fix" "Yellow"
                Exec-Command -command "pnpm run fix:relationships-direct -- --collection=quiz_questions" -description "Fixing quiz relationships" -continueOnError
            }
        }

        if ($FixAll -or $FixSurveys) {
            Log-Step "Fixing Survey Relationships" 6
            # Check if this script exists, and if not, use a general fix
            if (Test-Path -Path "./src/scripts/repair/fix-survey-relationships.ts") {
                Exec-Command -command "pnpm run fix:survey-relationships" -description "Fixing survey relationships"
            } else {
                Log-Message "Survey relationship fix script not found, using general relationship fix" "Yellow"
                Exec-Command -command "pnpm run fix:relationships-direct -- --collection=surveys" -description "Fixing survey relationships" -continueOnError
                Exec-Command -command "pnpm run fix:relationships-direct -- --collection=survey_questions" -description "Fixing survey question relationships" -continueOnError
            }
        }

        # General relationship fixes
        Log-Step "Fixing General Relationships" 7
        Exec-Command -command "pnpm run fix:relationships-direct" -description "Fixing general relationships"

        # Lexical format fixes
        if ($FixAll -or $FixLexical) {
            Log-Step "Fixing Lexical Format" 8
            Exec-Command -command "pnpm run fix:lexical-format" -description "Fixing lexical format"
            Exec-Command -command "pnpm run fix:all-lexical-fields" -description "Fixing all lexical fields"
        }

        # Restore original environment variables
        $env:DATABASE_URI = $originalDatabaseUri
        $env:DATABASE_URL = $originalDatabaseUrl
    }
    else {
        Log-Error "Could not find content-migrations package"
        exit 1
    }

    Log-Success "Remote relationship fixes completed"
}
catch {
    Log-Error "CRITICAL ERROR: Relationship fixes failed: $_"
    exit 1
}
finally {
    # Restore original environment variables if not already done
    if ($env:DATABASE_URI -eq $env:REMOTE_DATABASE_URL) {
        $env:DATABASE_URI = $originalDatabaseUri
    }
    if ($env:DATABASE_URL -eq $env:REMOTE_DATABASE_URL) {
        $env:DATABASE_URL = $originalDatabaseUrl
    }

    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
