# verify-remote-content.ps1

param (
    [switch]$VerifyPosts,
    [switch]$VerifyDocumentation,
    [switch]$VerifyCourses,
    [switch]$VerifyQuizzes,
    [switch]$VerifySurveys,
    [switch]$VerifyAll
)

# Import required modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"

# Initialize logging
Initialize-Logging -logPrefix "remote-verification"

try {
    Log-Phase "REMOTE CONTENT VERIFICATION"

    # Temporarily set DATABASE_URI to remote and prepare environment
    $originalDatabaseUri = $env:DATABASE_URI
    $env:DATABASE_URI = $env:REMOTE_DATABASE_URL
    
    # Set DATABASE_URL as well for scripts that might use it
    $originalDatabaseUrl = $env:DATABASE_URL
    $env:DATABASE_URL = $env:REMOTE_DATABASE_URL

    Log-Message "Using remote database URL: $env:REMOTE_DATABASE_URL" "Cyan"
    
    # Verify direct access to remote database
    Push-Location -Path "apps/web"
    Log-Message "Testing remote database connection..." "Yellow"
    Exec-Command -command "supabase db diff --db-url `"$env:REMOTE_DATABASE_URL`" --schema payload -s 1" -description "Testing remote connection" -continueOnError
    Pop-Location

    Set-ProjectRootLocation
    if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
        # General data integrity verification
        if ($VerifyAll -or $VerifyPosts) {
            Log-Step "Verifying Posts Content" 1
            Log-Message "Verifying that all posts are properly migrated to remote database..." "Yellow"
            Exec-Command -command "pnpm run verify:post-content" -description "Verifying posts content"
        }

        if ($VerifyAll -or $VerifyDocumentation) {
            Log-Step "Verifying Documentation Content" 2
            Exec-Command -command "pnpm run verify:documentation-content" -description "Verifying documentation content"
        }

        if ($VerifyAll -or $VerifyCourses) {
            Log-Step "Verifying Course Content" 3
            Exec-Command -command "pnpm run verify:course-content" -description "Verifying course content"
        }

        if ($VerifyAll -or $VerifyQuizzes) {
            Log-Step "Verifying Quiz Content" 4
            Exec-Command -command "pnpm run verify:quiz-content" -description "Verifying quiz content"
        }

        if ($VerifyAll -or $VerifySurveys) {
            Log-Step "Verifying Survey Content" 5
            Exec-Command -command "pnpm run verify:survey-content" -description "Verifying survey content"
        }

        # UUID table verification
        Log-Step "Verifying UUID Tables" 6
        Exec-Command -command "pnpm run verify:uuid-tables" -description "Verifying UUID tables"

        # Relationship verification
        Log-Step "Verifying Relationships" 7
        Exec-Command -command "pnpm run verify:relationships" -description "Verifying relationships"

        # Lexical format verification
        Log-Step "Verifying Lexical Format" 8
        Exec-Command -command "pnpm run verify:lexical-format" -description "Verifying lexical format"

        # Comprehensive verification
        if ($VerifyAll) {
            Log-Step "Running Comprehensive Verification" 9
            Exec-Command -command "pnpm run verify:all" -description "Running comprehensive verification"
        }

        # Restore original environment variables
        $env:DATABASE_URI = $originalDatabaseUri
        $env:DATABASE_URL = $originalDatabaseUrl
    }
    else {
        Log-Error "Could not find content-migrations package"
        exit 1
    }

    Log-Success "Remote content verification completed"
}
catch {
    Log-Error "CRITICAL ERROR: Verification failed: $_"
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
