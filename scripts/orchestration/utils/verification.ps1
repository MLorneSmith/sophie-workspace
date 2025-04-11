# PowerShell Verification Module for Reset-and-Migrate.ps1
# Contains functions for database and file verification

# Import the logging and execution modules if not already imported
if (-not (Get-Command -Name "Log-Message" -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\logging.ps1"
}
if (-not (Get-Command -Name "Exec-Command" -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\execution.ps1"
}

# Function to verify comprehensive database state
function Verify-Database {
    param (
        [switch]$quick
    )
    
    Log-Message "Verifying database state..." "Yellow"
    $success = $true
    
    # Verify schemas
    if (-not (Verify-Schema -schema "public")) {
        Log-Error "Public schema verification failed"
        $success = $false
    }
    
    if (-not (Verify-Schema -schema "payload")) {
        Log-Error "Payload schema verification failed"
        $success = $false
    }
    
    # If quick verification, return here
    if ($quick) {
        return $success
    }
    
    # Verify essential tables
    $requiredTables = @(
        @{"schema" = "payload"; "table" = "courses"},
        @{"schema" = "payload"; "table" = "course_lessons"},
        @{"schema" = "payload"; "table" = "course_quizzes"},
        @{"schema" = "payload"; "table" = "quiz_questions"},
        @{"schema" = "payload"; "table" = "surveys"},
        @{"schema" = "payload"; "table" = "survey_questions"}
    )
    
    foreach ($tableInfo in $requiredTables) {
        if (-not (Verify-Table -schema $tableInfo.schema -table $tableInfo.table)) {
            Log-Error "Required table '$($tableInfo.schema).$($tableInfo.table)' verification failed"
            $success = $false
        }
    }
    
    # Verify relationships
    $verificationResult = Exec-Command -command "pnpm --filter @kit/content-migrations run verify:all" -description "Running comprehensive verification" -captureOutput -continueOnError
    
    if ($verificationResult -match "Error" -or $LASTEXITCODE -ne 0) {
        Log-Error "Comprehensive verification failed"
        $success = $false
    }
    
    return $success
}

# Function to verify and fix quiz ID consistency
function Verify-QuizConsistency {
    Log-Message "Verifying quiz system integrity..." "Yellow"
    
    try {
        # Verify quiz system integrity
        $quizSystemVerification = Exec-Command -command "pnpm exec tsx src/scripts/verification/verify-quiz-system-integrity.ts" -description "Verifying quiz system integrity" -captureOutput -continueOnError
        
        if ($LASTEXITCODE -ne 0) {
            Log-Error "Quiz system integrity verification failed"
            Log-Message "Attempting to fix quiz ID consistency..." "Yellow"
            
            # Run several fix scripts
            Exec-Command -command "pnpm exec tsx src/scripts/fix-quiz-id-consistency.ts" -description "Fixing quiz ID consistency" -continueOnError
            Exec-Command -command "pnpm exec tsx src/scripts/fix-lesson-quiz-references.ts" -description "Fixing lesson-quiz references" -continueOnError
            Exec-Command -command "pnpm exec tsx src/scripts/fix-lessons-quiz-references-sql.ts" -description "Fixing additional lesson-quiz references" -continueOnError
            Exec-Command -command "pnpm exec tsx src/scripts/fix-questions-quiz-references.ts" -description "Fixing quiz question references" -continueOnError
            
            # Verify again
            $quizSystemVerification = Exec-Command -command "pnpm exec tsx src/scripts/verification/verify-quiz-system-integrity.ts" -description "Re-verifying quiz system integrity" -captureOutput -continueOnError
            
            if ($LASTEXITCODE -ne 0) {
                Log-Error "Quiz system integrity verification still failed after fix attempts"
                return $false
            } else {
                Log-Success "Quiz system integrity fixed successfully"
                return $true
            }
        } else {
            Log-Success "Quiz system integrity verification passed"
            return $true
        }
    }
    catch {
        Log-Error "Error during quiz consistency verification: $_"
        return $false
    }
}

# Function to verify and fix relationship integrity
function Verify-RelationshipIntegrity {
    Log-Message "Verifying relationship integrity..." "Yellow"
    
    try {
        # Run the repair scripts
        Exec-Command -command "pnpm run repair:edge-cases" -description "Running edge case repairs" -continueOnError
        Exec-Command -command "pnpm exec tsx src/scripts/repair/fix-lesson-quiz-field-name.ts" -description "Fixing lesson-quiz relationships" -continueOnError
        Exec-Command -command "pnpm run fix:survey-questions-population" -description "Fixing survey questions population" -continueOnError
        
        # Final verification
        $finalVerification = Exec-Command -command "pnpm run verify:all" -description "Final relationship verification" -captureOutput -continueOnError
        
        if ($finalVerification -match "Warning" -or $finalVerification -match "Error" -or $LASTEXITCODE -ne 0) {
            Log-Warning "Some relationship issues could not be fixed automatically"
            return $false
        } else {
            Log-Success "All relationship integrity issues fixed"
            return $true
        }
    }
    catch {
        Log-Error "Error during relationship verification: $_"
        return $false
    }
}

# Function to verify database columns and their types
function Verify-DatabaseColumns {
    Log-Message "Verifying database columns..." "Yellow"
    $success = $true
    
    try {
        # Verify course_lessons quiz_id_id column
        $courseLessonsVerification = Exec-Command -command "pnpm run verify:course-lessons" -description "Verifying course_lessons quiz_id_id column" -captureOutput -continueOnError
        
        if ($courseLessonsVerification -match "Error" -or $LASTEXITCODE -ne 0) {
            Log-Error "Course lessons quiz_id_id column verification failed"
            $success = $false
        } else {
            Log-Success "Course lessons quiz_id_id column verification passed"
        }
        
        # Verify media_id columns
        $mediaColumnsVerification = Exec-Command -command "pnpm --filter @kit/content-migrations run verify:media-columns" -description "Verifying media_id columns" -captureOutput -continueOnError
        
        if ($mediaColumnsVerification -match "Error" -or $LASTEXITCODE -ne 0) {
            Log-Error "Media columns verification failed"
            $success = $false
        } else {
            Log-Success "Media columns verification passed"
        }
        
        # Verify relationship columns
        Exec-Command -command "pnpm --filter @kit/content-migrations run repair:relationship-columns" -description "Fixing relationship columns" -captureOutput -continueOnError
        
        $relationshipColumnsVerification = Exec-Command -command "pnpm --filter @kit/content-migrations run verify:relationship-columns" -description "Verifying relationship columns" -captureOutput -continueOnError
        
        if ($relationshipColumnsVerification -match "Error" -or $LASTEXITCODE -ne 0) {
            Log-Error "Relationship columns verification failed"
            $success = $false
        } else {
            Log-Success "Relationship columns verification passed"
        }
        
        return $success
    }
    catch {
        Log-Error "Error during database columns verification: $_"
        return $false
    }
}

# Function to check database environment settings
function Check-DatabaseEnvironment {
    Log-Message "Checking database environment settings..." "Yellow"
    
    try {
        # Check for required environment variables
        if (-not $env:DATABASE_URL -and $env:DATABASE_URI) {
            Log-Message "Setting DATABASE_URL from DATABASE_URI for compatibility" "Yellow"
            $env:DATABASE_URL = $env:DATABASE_URI
        }
        
        # If still not set, check the .env.development file in the content-migrations package
        if (-not $env:DATABASE_URL) {
            $currentLocation = Get-Location
            $envFile = Join-Path -Path $currentLocation -ChildPath ".env.development"
            
            if (Test-Path -Path $envFile) {
                Log-Message "Loading environment variables from .env.development" "Yellow"
                Get-Content -Path $envFile | ForEach-Object {
                    if ($_ -match '^\s*DATABASE_URL=(.*)$') {
                        $env:DATABASE_URL = $matches[1]
                        Log-Message "Set DATABASE_URL from .env.development file" "Yellow"
                    } elseif (-not $env:DATABASE_URL -and $_ -match '^\s*DATABASE_URI=(.*)$') {
                        $env:DATABASE_URL = $matches[1]
                        Log-Message "Set DATABASE_URL from DATABASE_URI in .env.development file" "Yellow"
                    }
                }
            }
        }
        
        if (-not $env:DATABASE_URL) {
            Log-Warning "DATABASE_URL environment variable is not set"
            Log-Message "Please ensure either DATABASE_URL or DATABASE_URI is set in your environment or .env.development file" "Yellow"
            return $false
        } else {
            Log-Success "Database environment settings are properly configured"
            return $true
        }
    }
    catch {
        Log-Error "Error while checking database environment: $_"
        return $false
    }
}

# All functions are automatically available when dot-sourced
# No need for Export-ModuleMember in this context
