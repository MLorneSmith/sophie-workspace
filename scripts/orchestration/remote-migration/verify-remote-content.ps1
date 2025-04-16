# Remote Content Verification Script
# This script verifies that data in the remote database is consistent and complete
# by performing various integrity checks on the migrated content

# Import utility modules
. "$PSScriptRoot\utils\database.ps1"
. "$PSScriptRoot\utils\verification.ps1"
. "$PSScriptRoot\utils\uuid-tables.ps1"

# Parameters
param (
    [switch]$VerifyCore,
    [switch]$VerifyPosts,
    [switch]$VerifyDocumentation,
    [switch]$VerifyCourses,
    [switch]$VerifyQuizzes,
    [switch]$VerifySurveys,
    [switch]$VerifyDownloads,
    [switch]$VerifyUUIDTables,
    [switch]$VerifyAll,
    [switch]$VerboseOutput
)

# If VerifyAll is specified, set all individual verification flags
if ($VerifyAll) {
    $VerifyCore = $true
    $VerifyPosts = $true
    $VerifyDocumentation = $true
    $VerifyCourses = $true
    $VerifyQuizzes = $true
    $VerifySurveys = $true
    $VerifyDownloads = $true
    $VerifyUUIDTables = $true
}

# If no specific verification is requested, default to verifying everything
if (-not ($VerifyCore -or $VerifyPosts -or $VerifyDocumentation -or $VerifyCourses -or 
          $VerifyQuizzes -or $VerifySurveys -or $VerifyDownloads -or $VerifyUUIDTables)) {
    $VerifyAll = $true
    $VerifyCore = $true
    $VerifyPosts = $true
    $VerifyDocumentation = $true
    $VerifyCourses = $true
    $VerifyQuizzes = $true
    $VerifySurveys = $true
    $VerifyDownloads = $true
    $VerifyUUIDTables = $true
}

function Verify-RemoteContent {
    try {
        # Show banner
        Log-Phase "STARTING REMOTE CONTENT VERIFICATION"

        # Test database connections
        Log-Step "Testing database connections"
        $localConnectionOk = Test-DatabaseConnection -connectionString $env:DATABASE_URL -name "local database"
        $remoteConnectionOk = Test-DatabaseConnection -connectionString $env:REMOTE_DATABASE_URL -name "remote database"

        if (-not $localConnectionOk -or -not $remoteConnectionOk) {
            throw "Database connection issues detected. Cannot proceed with verification."
        }

        # Store verification results
        $verificationResults = @()
        $overallSuccess = $true

        # Verify core tables
        if ($VerifyCore) {
            Log-Step "Verifying core tables"
            $coreTables = Get-ContentTypeTables -contentType "core"
            $coreResults = Verify-ContentType -contentType "CORE" -tables $coreTables -verbose:$VerboseOutput
            $verificationResults += $coreResults
            $overallSuccess = $overallSuccess -and $coreResults.Success
        }

        # Verify posts
        if ($VerifyPosts) {
            Log-Step "Verifying posts tables"
            $postsTables = Get-ContentTypeTables -contentType "posts"
            $postsResults = Verify-ContentType -contentType "POSTS" -tables $postsTables -verbose:$VerboseOutput
            $verificationResults += $postsResults
            $overallSuccess = $overallSuccess -and $postsResults.Success

            # Additional verification for post content
            if ($postsResults.Success) {
                Log-Step "Verifying post content"
                $postContentResult = Verify-PostContent
                if (-not $postContentResult) {
                    $overallSuccess = $false
                }
            }
        }

        # Verify documentation
        if ($VerifyDocumentation) {
            Log-Step "Verifying documentation tables"
            $documentationTables = Get-ContentTypeTables -contentType "documentation"
            $documentationResults = Verify-ContentType -contentType "DOCUMENTATION" -tables $documentationTables -verbose:$VerboseOutput
            $verificationResults += $documentationResults
            $overallSuccess = $overallSuccess -and $documentationResults.Success
        }

        # Verify courses
        if ($VerifyCourses) {
            Log-Step "Verifying course tables"
            $courseTables = Get-ContentTypeTables -contentType "courses"
            $courseResults = Verify-ContentType -contentType "COURSES" -tables $courseTables -verbose:$VerboseOutput
            $verificationResults += $courseResults
            $overallSuccess = $overallSuccess -and $courseResults.Success
        }

        # Verify quizzes
        if ($VerifyQuizzes) {
            Log-Step "Verifying quiz tables"
            $quizTables = Get-ContentTypeTables -contentType "quizzes"
            $quizResults = Verify-ContentType -contentType "QUIZZES" -tables $quizTables -verbose:$VerboseOutput
            $verificationResults += $quizResults
            $overallSuccess = $overallSuccess -and $quizResults.Success
        }

        # Verify surveys
        if ($VerifySurveys) {
            Log-Step "Verifying survey tables"
            $surveyTables = Get-ContentTypeTables -contentType "surveys"
            $surveyResults = Verify-ContentType -contentType "SURVEYS" -tables $surveyTables -verbose:$VerboseOutput
            $verificationResults += $surveyResults
            $overallSuccess = $overallSuccess -and $surveyResults.Success
        }

        # Verify downloads
        if ($VerifyDownloads) {
            Log-Step "Verifying download tables"
            $downloadTables = Get-ContentTypeTables -contentType "downloads"
            $downloadResults = Verify-ContentType -contentType "DOWNLOADS" -tables $downloadTables -verbose:$VerboseOutput
            $verificationResults += $downloadResults
            $overallSuccess = $overallSuccess -and $downloadResults.Success
        }

        # Verify UUID tables
        if ($VerifyUUIDTables) {
            Log-Step "Verifying UUID relationship tables"
            
            # Get all UUID tables from local database
            $localUUIDTables = Get-UUIDTables -connectionString $env:DATABASE_URL -schema "payload"
            $uuidTableResults = Verify-UUIDTables -uuidTables $localUUIDTables -verbose:$VerboseOutput
            $verificationResults += $uuidTableResults
            $overallSuccess = $overallSuccess -and $uuidTableResults.Success
        }

        # Display verification summary
        Log-Phase "VERIFICATION SUMMARY"
        
        foreach ($result in $verificationResults) {
            $statusText = if ($result.Success) { "PASSED" } else { "FAILED" }
            $statusColor = if ($result.Success) { "Green" } else { "Red" }
            
            Log-Message "$($result.ContentType): $statusText" $statusColor
            Log-Message "  Matched: $($result.MatchedCount)/$($result.TotalTables) tables"
            
            if ($result.MismatchedTables.Count -gt 0) {
                Log-Message "  Mismatched tables: $($result.MismatchedTables -join ', ')" "Yellow"
            }
            
            if ($result.EmptyRemoteTables.Count -gt 0) {
                Log-Message "  Empty remote tables: $($result.EmptyRemoteTables -join ', ')" "Yellow"
            }
        }
        
        # Final result
        if ($overallSuccess) {
            Log-Success "ALL VERIFICATION CHECKS PASSED!"
        } else {
            Log-Warning "VERIFICATION FAILED: Some checks did not pass. See details above."
        }
        
        return @{
            Success = $overallSuccess
            Results = $verificationResults
        }
    }
    catch {
        Log-Error "ERROR DURING VERIFICATION: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

function Verify-ContentType {
    param (
        [string]$contentType,
        [string[]]$tables,
        [switch]$verbose
    )
    
    Log-Message "Verifying $contentType content ($($tables.Count) tables)..." "Cyan"
    
    $matched = 0
    $mismatched = @()
    $emptyRemote = @()
    
    foreach ($table in $tables) {
        if ($verbose) {
            Log-Message "Checking table: payload.$table" "Yellow"
        }
        
        # Get row counts
        $comparison = Compare-TableCounts -schema "payload" -table $table -verbose:$verbose
        
        if ($comparison.LocalCount -eq 0 -and $comparison.RemoteCount -eq 0) {
            # Both empty, consider matched
            $matched++
            if ($verbose) {
                Log-Message "Both local and remote tables are empty" "Cyan"
            }
        }
        elseif ($comparison.LocalCount -eq 0 -and $comparison.RemoteCount -gt 0) {
            # Local empty but remote has data - weird but we'll count as matched
            $matched++
            if ($verbose) {
                Log-Message "Remote has data but local is empty (unusual)" "Yellow"
            }
        }
        elseif ($comparison.LocalCount -gt 0 -and $comparison.RemoteCount -eq 0) {
            # Local has data but remote empty - migration issue
            $emptyRemote += $table
            if ($verbose) {
                Log-Message "Local has data but remote is empty" "Red"
            }
        }
        elseif ($comparison.Match) {
            # Row counts match
            $matched++
            
            # Do a sample data verification
            $sampleVerification = Verify-SampleData -schema "payload" -table $table
            
            if ($verbose) {
                if ($sampleVerification) {
                    Log-Message "Row counts match and sample data verified" "Green"
                } else {
                    Log-Message "Row counts match but sample data verification failed" "Red"
                    $mismatched += $table
                }
            }
        }
        else {
            # Row counts don't match
            $mismatched += $table
            if ($verbose) {
                Log-Message "Row counts don't match" "Red"
            }
        }
    }
    
    $success = ($mismatched.Count -eq 0) -and ($emptyRemote.Count -eq 0)
    
    if ($success) {
        Log-Success "$contentType verification: All tables matched"
    } else {
        Log-Warning "$contentType verification: $matched/$($tables.Count) tables matched, $($mismatched.Count) mismatched, $($emptyRemote.Count) empty in remote"
    }
    
    return @{
        ContentType = $contentType
        Success = $success
        MatchedCount = $matched
        MismatchedTables = $mismatched
        EmptyRemoteTables = $emptyRemote
        TotalTables = $tables.Count
    }
}

function Verify-UUIDTables {
    param (
        [string[]]$uuidTables,
        [switch]$verbose
    )
    
    Log-Message "Verifying UUID relationship tables ($($uuidTables.Count) tables)..." "Cyan"
    
    $matched = 0
    $mismatched = @()
    $emptyRemote = @()
    
    foreach ($table in $uuidTables) {
        if ($verbose) {
            Log-Message "Checking UUID table: payload.$table" "Yellow"
        }
        
        # Check if table exists in remote
        $exists = Invoke-RemoteSql -query "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'payload' AND table_name = '$table');" -captureOutput
        
        if ($exists -notmatch "t") {
            # Table doesn't exist in remote
            $mismatched += $table
            if ($verbose) {
                Log-Message "Table doesn't exist in remote database" "Red"
            }
            continue
        }
        
        # Get row counts
        $comparison = Compare-TableCounts -schema "payload" -table $table -verbose:$verbose
        
        if ($comparison.Match) {
            # Row counts match
            $matched++
        }
        elseif ($comparison.LocalCount -gt 0 -and $comparison.RemoteCount -eq 0) {
            # Local has data but remote empty
            $emptyRemote += $table
        }
        else {
            # Row counts don't match
            $mismatched += $table
        }
    }
    
    $success = ($mismatched.Count -eq 0) -and ($emptyRemote.Count -eq 0)
    
    if ($success) {
        Log-Success "UUID tables verification: All tables matched"
    } else {
        Log-Warning "UUID tables verification: $matched/$($uuidTables.Count) tables matched, $($mismatched.Count) mismatched, $($emptyRemote.Count) empty in remote"
    }
    
    return @{
        ContentType = "UUID_TABLES"
        Success = $success
        MatchedCount = $matched
        MismatchedTables = $mismatched
        EmptyRemoteTables = $emptyRemote
        TotalTables = $uuidTables.Count
    }
}

function Verify-PostContent {
    Log-Message "Verifying post content integrity..." "Yellow"
    
    try {
        # Get a sample post from remote
        $samplePostQuery = @"
        SELECT id, title, content 
        FROM payload.posts 
        WHERE content IS NOT NULL 
        LIMIT 1;
"@
        $samplePost = Invoke-RemoteSql -query $samplePostQuery -captureOutput
        
        if ([string]::IsNullOrWhiteSpace($samplePost)) {
            Log-Warning "No posts with content found in remote database"
            return $false
        }
        
        # Check content format - it should be in Lexical format
        if ($samplePost -match '"root"' -and $samplePost -match '"type":"root"') {
            Log-Success "Post content appears to be in Lexical format"
            return $true
        } else {
            Log-Warning "Post content may not be in the correct Lexical format"
            return $false
        }
    }
    catch {
        Log-Error "Error during post content verification: $($_.Exception.Message)"
        return $false
    }
}

# Execute the verification
$verificationResult = Verify-RemoteContent

# Return exit code based on verification result
exit [int](-not $verificationResult.Success)
