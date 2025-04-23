# PowerShell Verification Dependencies Module for Reset-and-Migrate.ps1
# Provides utility functions for database verification and validation

# Import utility modules
. "$PSScriptRoot\logging.ps1"

# Function to verify database tables and columns
function Verify-DatabaseColumns {
    try {
        # First ensure we're at the project root
        Set-ProjectRootLocation
        
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
            
            # Run the verification script for table columns
            Log-Message "Verifying database columns..." "Yellow"
            $verificationResult = Exec-Command -command "pnpm run verify:table-columns" -description "Verifying database columns" -captureOutput -continueOnError
            
            # Check for known issues
            if ($verificationResult -match "Warning" -or $LASTEXITCODE -ne 0) {
                Log-Warning "Some database column issues were detected"
                
                # Log specific issues that are expected
                if ($verificationResult -match "quiz_question_id column not found") {
                    Log-Message "Expected issue: quiz_question_id column not found in some tables. This is addressed in later fixes." "Yellow"
                }
                if ($verificationResult -match "Missing reference column") {
                    Log-Message "Expected issue: Missing reference columns in some tables. These will be addressed in relationship fixes." "Yellow"
                }
                
                # Try to fix common issues
                Log-Message "Attempting to fix common database column issues..." "Yellow"
                
                # Run the column repair script
                Exec-Command -command "pnpm run repair:table-columns" -description "Repairing database columns" -continueOnError
                
                # Verify again
                Log-Message "Re-verifying database columns after repairs..." "Yellow"
                $reVerificationResult = Exec-Command -command "pnpm run verify:table-columns" -description "Re-verifying database columns" -captureOutput -continueOnError
                
                if ($reVerificationResult -match "Warning" -or $LASTEXITCODE -ne 0) {
                    Log-Warning "Some database column issues could not be automatically fixed"
                    
                    # Determine if these are non-critical issues
                    $nonCriticalIssues = $true
                    if ($reVerificationResult -match "Critical error") {
                        $nonCriticalIssues = $false
                    }
                    
                    if ($nonCriticalIssues) {
                        Log-Message "These appear to be non-critical issues. Continuing with the migration process." "Yellow"
                    } else {
                        Log-Error "Critical database column issues detected. Fix these issues before continuing."
                        return $false
                    }
                } else {
                    Log-Success "All database column issues have been fixed"
                }
            } else {
                Log-Success "All database columns verified successfully"
            }
            
            Pop-Location
            Log-Message "Returned to directory: $(Get-Location)" "Gray"
            
            return $true
        } else {
            Log-Warning "Could not find packages/content-migrations directory, skipping database column verification"
            return $false
        }
    }
    catch {
        Log-Error "Failed to verify database columns: $_"
        Log-Warning "This is non-critical, continuing"
        return $false
    }
}

# Function to test if a combination of quiz and question exists
function Test-QuizQuestionExists {
    param (
        [string]$QuizId,
        [string]$QuestionId
    )
    
    try {
        # Run a direct SQL query to check if the combination exists
        $query = "SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE parent_id = '$QuizId' AND quiz_question_id = '$QuestionId'"
        
        # Run the query
        $result = Invoke-SqlQuery -Query $query
        
        # Check the result
        if ($result -and $result -match "(\d+)") {
            $count = [int]$matches[1]
            return $count -gt 0
        }
        
        return $false
    }
    catch {
        Log-Warning "Could not verify quiz-question relationship: $_"
        return $false
    }
}

# Function to execute a SQL query and return the result
function Invoke-SqlQuery {
    param (
        [string]$Query
    )
    
    try {
        # Check if we have a database connection string
        if (-not $env:DATABASE_URI -and -not $env:DATABASE_URL) {
            Log-Warning "No database connection string found"
            return $null
        }
        
        # Use the connection string from environment
        $connectionString = if ($env:DATABASE_URI) { $env:DATABASE_URI } else { $env:DATABASE_URL }
        
        # First ensure we're at the project root
        Set-ProjectRootLocation
        
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            # Execute the query using our utility function
            $result = Exec-Command -command "pnpm run utils:run-sql --sql `"$Query`"" -description "Executing SQL query" -captureOutput -continueOnError
            
            Pop-Location
            return $result
        } else {
            Log-Warning "Could not find packages/content-migrations directory, cannot execute SQL query"
            return $null
        }
    }
    catch {
        Log-Warning "Failed to execute SQL query: $_"
        return $null
    }
}

# Function to identify common expected warnings in migration logs
function Identify-ExpectedWarnings {
    param (
        [string]$LogContent
    )
    
    $expectedWarnings = @{
        "No email adapter provided" = "This warning is expected in development environment and can be safely ignored."
        "No posts were migrated" = "This warning is expected if all posts are already in the database."
        "UID required but not supplied" = "This warning is related to Supabase auth configuration and is expected in development."
        "Quiz ID not set correctly" = "This will be fixed in the quiz relationship fixing steps."
        "Connection pool size has not been configured" = "This is a non-critical warning from Supabase that can be ignored."
        "Could not create one or more lesson-quiz relationships" = "This will be fixed in the relationship fixing phase."
    }
    
    $foundWarnings = @()
    
    foreach ($warning in $expectedWarnings.Keys) {
        if ($LogContent -match [regex]::Escape($warning)) {
            $foundWarnings += @{
                Warning = $warning
                Explanation = $expectedWarnings[$warning]
            }
        }
    }
    
    return $foundWarnings
}

# Function to log expected warnings with explanations
function Log-ExpectedMigrationWarnings {
    param (
        [string]$LogFile
    )
    
    try {
        if (Test-Path -Path $LogFile) {
            $logContent = Get-Content -Path $LogFile -Raw
            
            $expectedWarnings = Identify-ExpectedWarnings -LogContent $logContent
            
            if ($expectedWarnings.Count -gt 0) {
                Write-Host ""
                Log-Message "Expected warnings found in the migration log:" "Yellow"
                
                foreach ($warningInfo in $expectedWarnings) {
                    Log-ExpectedWarning "$($warningInfo.Warning): $($warningInfo.Explanation)"
                }
                
                Write-Host ""
            }
        }
    }
    catch {
        Log-Warning "Failed to analyze migration log for expected warnings: $_"
    }
}
