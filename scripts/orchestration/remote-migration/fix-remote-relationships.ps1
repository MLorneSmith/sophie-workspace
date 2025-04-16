# Remote Relationship Fixes Script
# This script fixes relationship issues between tables in the remote database
# after data migration has been completed

# Import utility modules
. "$PSScriptRoot\utils\database.ps1"
. "$PSScriptRoot\utils\verification.ps1"

# Parameters
param (
    [switch]$FixAll,
    [switch]$FixPosts,
    [switch]$FixDocumentation,
    [switch]$FixCourses,
    [switch]$FixQuizzes,
    [switch]$FixSurveys,
    [switch]$FixUUIDTables,
    [switch]$DryRun,
    [switch]$Verbose
)

# Configure error handling
$ErrorActionPreference = "Stop"

# If FixAll is specified, set all fix flags
if ($FixAll) {
    $FixPosts = $true
    $FixDocumentation = $true
    $FixCourses = $true
    $FixQuizzes = $true
    $FixSurveys = $true
    $FixUUIDTables = $true
}

function Fix-RemoteRelationships {
    try {
        # Show banner
        Log-Phase "STARTING RELATIONSHIP FIXES"

        # Test database connection
        Log-Step "Testing database connection"
        $remoteConnectionOk = Test-DatabaseConnection -connectionString $env:REMOTE_DATABASE_URL -name "remote database"

        if (-not $remoteConnectionOk) {
            throw "Remote database connection issues detected. Cannot proceed with relationship fixes."
        }

        # Initialize counters
        $fixesApplied = 0
        $potentialIssues = 0

        # Fix Posts relationships
        if ($FixPosts) {
            Log-Step "Fixing Posts relationships"
            
            # Fix posts_rels relationships
            $fixPostsRelsQuery = @"
            -- Ensure posts_rels references valid posts
            DELETE FROM payload.posts_rels 
            WHERE NOT EXISTS (
                SELECT 1 FROM payload.posts WHERE id = posts_rels.parent_id
            ) OR NOT EXISTS (
                SELECT 1 FROM payload.posts WHERE id = posts_rels.value
            );
"@
            
            if (-not $DryRun) {
                $result = Invoke-RemoteSql -query $fixPostsRelsQuery -captureOutput
                Log-Success "Fixed posts_rels table relationships"
            } else {
                Log-Message "DRY RUN: Would fix posts_rels table relationships" "Yellow"
            }
            $fixesApplied++
            
            # Fix posts_categories relationships
            $fixPostsCategoriesQuery = @"
            -- Ensure posts_categories references valid posts
            DELETE FROM payload.posts_categories 
            WHERE NOT EXISTS (
                SELECT 1 FROM payload.posts WHERE id = posts_categories.parent_id
            );
"@
            
            if (-not $DryRun) {
                $result = Invoke-RemoteSql -query $fixPostsCategoriesQuery -captureOutput
                Log-Success "Fixed posts_categories table relationships"
            } else {
                Log-Message "DRY RUN: Would fix posts_categories table relationships" "Yellow"
            }
            $fixesApplied++
            
            # Fix posts_tags relationships
            $fixPostsTagsQuery = @"
            -- Ensure posts_tags references valid posts
            DELETE FROM payload.posts_tags
            WHERE NOT EXISTS (
                SELECT 1 FROM payload.posts WHERE id = posts_tags.parent_id
            );
"@
            
            if (-not $DryRun) {
                $result = Invoke-RemoteSql -query $fixPostsTagsQuery -captureOutput
                Log-Success "Fixed posts_tags table relationships"
            } else {
                Log-Message "DRY RUN: Would fix posts_tags table relationships" "Yellow"
            }
            $fixesApplied++
        }

        # Fix Documentation relationships
        if ($FixDocumentation) {
            Log-Step "Fixing Documentation relationships"
            
            # Fix documentation_rels relationships
            $fixDocumentationRelsQuery = @"
            -- Ensure documentation_rels references valid documentation
            DELETE FROM payload.documentation_rels 
            WHERE NOT EXISTS (
                SELECT 1 FROM payload.documentation WHERE id = documentation_rels.parent_id
            ) OR NOT EXISTS (
                SELECT 1 FROM payload.documentation WHERE id = documentation_rels.value
            );
"@
            
            if (-not $DryRun) {
                $result = Invoke-RemoteSql -query $fixDocumentationRelsQuery -captureOutput
                Log-Success "Fixed documentation_rels table relationships"
            } else {
                Log-Message "DRY RUN: Would fix documentation_rels table relationships" "Yellow"
            }
            $fixesApplied++
            
            # Fix documentation_categories relationships
            $fixDocumentationCategoriesQuery = @"
            -- Ensure documentation_categories references valid documentation
            DELETE FROM payload.documentation_categories 
            WHERE NOT EXISTS (
                SELECT 1 FROM payload.documentation WHERE id = documentation_categories.parent_id
            );
"@
            
            if (-not $DryRun) {
                $result = Invoke-RemoteSql -query $fixDocumentationCategoriesQuery -captureOutput
                Log-Success "Fixed documentation_categories table relationships"
            } else {
                Log-Message "DRY RUN: Would fix documentation_categories table relationships" "Yellow"
            }
            $fixesApplied++
            
            # Fix documentation_breadcrumbs relationships
            $fixDocumentationBreadcrumbsQuery = @"
            -- Ensure documentation_breadcrumbs references valid documentation
            DELETE FROM payload.documentation_breadcrumbs 
            WHERE NOT EXISTS (
                SELECT 1 FROM payload.documentation WHERE id = documentation_breadcrumbs.parent_id
            );
"@
            
            if (-not $DryRun) {
                $result = Invoke-RemoteSql -query $fixDocumentationBreadcrumbsQuery -captureOutput
                Log-Success "Fixed documentation_breadcrumbs table relationships"
            } else {
                Log-Message "DRY RUN: Would fix documentation_breadcrumbs table relationships" "Yellow"
            }
            $fixesApplied++
        }

        # Fix Courses relationships
        if ($FixCourses) {
            Log-Step "Fixing Courses relationships"
            
            # Fix courses_rels relationships
            $fixCoursesRelsQuery = @"
            -- Ensure courses_rels references valid courses
            DELETE FROM payload.courses_rels 
            WHERE NOT EXISTS (
                SELECT 1 FROM payload.courses WHERE id = courses_rels.parent_id
            );
"@
            
            if (-not $DryRun) {
                $result = Invoke-RemoteSql -query $fixCoursesRelsQuery -captureOutput
                Log-Success "Fixed courses_rels table relationships"
            } else {
                Log-Message "DRY RUN: Would fix courses_rels table relationships" "Yellow"
            }
            $fixesApplied++
            
            # Fix course_lessons_rels relationships
            $fixCourseLessonsRelsQuery = @"
            -- Ensure course_lessons_rels references valid lessons
            DELETE FROM payload.course_lessons_rels 
            WHERE NOT EXISTS (
                SELECT 1 FROM payload.course_lessons WHERE id = course_lessons_rels.parent_id
            );
"@
            
            if (-not $DryRun) {
                $result = Invoke-RemoteSql -query $fixCourseLessonsRelsQuery -captureOutput
                Log-Success "Fixed course_lessons_rels table relationships"
            } else {
                Log-Message "DRY RUN: Would fix course_lessons_rels table relationships" "Yellow"
            }
            $fixesApplied++
        }

        # Fix Quizzes relationships
        if ($FixQuizzes) {
            Log-Step "Fixing Quizzes relationships"
            
            # Fix course_quizzes_rels relationships
            $fixQuizzesRelsQuery = @"
            -- Ensure course_quizzes_rels references valid quizzes
            DELETE FROM payload.course_quizzes_rels 
            WHERE NOT EXISTS (
                SELECT 1 FROM payload.course_quizzes WHERE id = course_quizzes_rels.parent_id
            );
"@
            
            if (-not $DryRun) {
                $result = Invoke-RemoteSql -query $fixQuizzesRelsQuery -captureOutput
                Log-Success "Fixed course_quizzes_rels table relationships"
            } else {
                Log-Message "DRY RUN: Would fix course_quizzes_rels table relationships" "Yellow"
            }
            $fixesApplied++
            
            # Fix quiz_questions_rels relationships
            $fixQuestionsRelsQuery = @"
            -- Ensure quiz_questions_rels references valid questions
            DELETE FROM payload.quiz_questions_rels 
            WHERE NOT EXISTS (
                SELECT 1 FROM payload.quiz_questions WHERE id = quiz_questions_rels.parent_id
            );
"@
            
            if (-not $DryRun) {
                $result = Invoke-RemoteSql -query $fixQuestionsRelsQuery -captureOutput
                Log-Success "Fixed quiz_questions_rels table relationships"
            } else {
                Log-Message "DRY RUN: Would fix quiz_questions_rels table relationships" "Yellow"
            }
            $fixesApplied++
            
            # Fix quiz_questions_options relationships
            $fixQuestionsOptionsQuery = @"
            -- Ensure quiz_questions_options references valid questions
            DELETE FROM payload.quiz_questions_options 
            WHERE NOT EXISTS (
                SELECT 1 FROM payload.quiz_questions WHERE id = quiz_questions_options.parent_id
            );
"@
            
            if (-not $DryRun) {
                $result = Invoke-RemoteSql -query $fixQuestionsOptionsQuery -captureOutput
                Log-Success "Fixed quiz_questions_options table relationships"
            } else {
                Log-Message "DRY RUN: Would fix quiz_questions_options table relationships" "Yellow"
            }
            $fixesApplied++
        }

        # Fix Surveys relationships
        if ($FixSurveys) {
            Log-Step "Fixing Surveys relationships"
            
            # Fix surveys_rels relationships
            $fixSurveysRelsQuery = @"
            -- Ensure surveys_rels references valid surveys
            DELETE FROM payload.surveys_rels 
            WHERE NOT EXISTS (
                SELECT 1 FROM payload.surveys WHERE id = surveys_rels.parent_id
            );
"@
            
            if (-not $DryRun) {
                $result = Invoke-RemoteSql -query $fixSurveysRelsQuery -captureOutput
                Log-Success "Fixed surveys_rels table relationships"
            } else {
                Log-Message "DRY RUN: Would fix surveys_rels table relationships" "Yellow"
            }
            $fixesApplied++
            
            # Fix survey_questions_rels relationships
            $fixSurveyQuestionsRelsQuery = @"
            -- Ensure survey_questions_rels references valid questions
            DELETE FROM payload.survey_questions_rels 
            WHERE NOT EXISTS (
                SELECT 1 FROM payload.survey_questions WHERE id = survey_questions_rels.parent_id
            );
"@
            
            if (-not $DryRun) {
                $result = Invoke-RemoteSql -query $fixSurveyQuestionsRelsQuery -captureOutput
                Log-Success "Fixed survey_questions_rels table relationships"
            } else {
                Log-Message "DRY RUN: Would fix survey_questions_rels table relationships" "Yellow"
            }
            $fixesApplied++
            
            # Fix survey_questions_options relationships
            $fixSurveyQuestionsOptionsQuery = @"
            -- Ensure survey_questions_options references valid questions
            DELETE FROM payload.survey_questions_options 
            WHERE NOT EXISTS (
                SELECT 1 FROM payload.survey_questions WHERE id = survey_questions_options.parent_id
            );
"@
            
            if (-not $DryRun) {
                $result = Invoke-RemoteSql -query $fixSurveyQuestionsOptionsQuery -captureOutput
                Log-Success "Fixed survey_questions_options table relationships"
            } else {
                Log-Message "DRY RUN: Would fix survey_questions_options table relationships" "Yellow"
            }
            $fixesApplied++
        }

        # Fix Download relationships
        $fixDownloadsQuery = @"
        -- Ensure download relationships are valid
        DELETE FROM payload.posts__downloads
        WHERE NOT EXISTS (
            SELECT 1 FROM payload.posts WHERE id = posts__downloads.post_id
        ) OR NOT EXISTS (
            SELECT 1 FROM payload.downloads WHERE id = posts__downloads.download_id
        );

        DELETE FROM payload.course_lessons__downloads
        WHERE NOT EXISTS (
            SELECT 1 FROM payload.course_lessons WHERE id = course_lessons__downloads.course_lesson_id
        ) OR NOT EXISTS (
            SELECT 1 FROM payload.downloads WHERE id = course_lessons__downloads.download_id
        );

        DELETE FROM payload.documentation__downloads
        WHERE NOT EXISTS (
            SELECT 1 FROM payload.documentation WHERE id = documentation__downloads.documentation_id
        ) OR NOT EXISTS (
            SELECT 1 FROM payload.downloads WHERE id = documentation__downloads.download_id
        );
"@

        if (-not $DryRun) {
            $result = Invoke-RemoteSql -query $fixDownloadsQuery -captureOutput
            Log-Success "Fixed download relationship tables"
        } else {
            Log-Message "DRY RUN: Would fix download relationship tables" "Yellow"
        }
        $fixesApplied++

        # Fix UUID tables relationships
        if ($FixUUIDTables) {
            Log-Step "Fixing UUID tables relationships"
            
            # Get all UUID tables
            $getUUIDTablesQuery = @"
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'payload'
            AND table_name ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$';
"@
            
            $uuidTables = Invoke-RemoteSql -query $getUUIDTablesQuery -captureOutput
            $uuidTablesList = $uuidTables -split "`n" | Where-Object { $_ -match '\S' } | ForEach-Object { $_.Trim() }
            
            Log-Message "Found $($uuidTablesList.Count) UUID tables to process" "Cyan"
            
            foreach ($table in $uuidTablesList) {
                if ($Verbose) {
                    Log-Message "Processing UUID table: $table" "Yellow"
                }
                
                # Check if table has required columns
                $columnsQuery = @"
                SELECT column_name
                FROM information_schema.columns 
                WHERE table_schema = 'payload' 
                AND table_name = '$table';
"@
                
                $columns = Invoke-RemoteSql -query $columnsQuery -captureOutput
                $columnsList = $columns -split "`n" | Where-Object { $_ -match '\S' } | ForEach-Object { $_.Trim() }
                
                # If table has parent_id and value columns, fix relationships
                if ($columnsList -contains "parent_id" -and $columnsList -contains "value") {
                    $fixUUIDTableQuery = @"
                    -- Fix relationships in $table
                    DELETE FROM payload."$table"
                    WHERE parent_id IS NULL OR value IS NULL;
"@
                    
                    if (-not $DryRun) {
                        $result = Invoke-RemoteSql -query $fixUUIDTableQuery -captureOutput
                        if ($Verbose) {
                            Log-Success "Fixed relationships in UUID table $table"
                        }
                    } else {
                        if ($Verbose) {
                            Log-Message "DRY RUN: Would fix relationships in UUID table $table" "Yellow"
                        }
                    }
                    $fixesApplied++
                } else {
                    if ($Verbose) {
                        Log-Message "UUID table $table doesn't have standard relationship columns, skipping" "Yellow"
                    }
                    $potentialIssues++
                }
            }
            
            Log-Success "Processed all UUID tables"
        }

        # Final verification
        if (-not $DryRun) {
            Log-Step "Performing final relationship verification"
            
            # Verify relationships in the database
            $verifyRelationshipsQuery = @"
            SELECT
                tc.table_schema,
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_schema AS foreign_table_schema,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM
                information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'payload';
"@
            
            $relationships = Invoke-RemoteSql -query $verifyRelationshipsQuery -captureOutput
            $relationshipRows = $relationships -split "`n" | Where-Object { $_ -match '\S' }
            $issuesFound = 0
            
            foreach ($row in $relationshipRows) {
                # Extract table, column, referenced table, referenced column
                $parts = $row -split "\|" | ForEach-Object { $_.Trim() }
                if ($parts.Count -ge 7) {
                    $tableSchema = $parts[0]
                    $constraintName = $parts[1]
                    $tableName = $parts[2]
                    $columnName = $parts[3]
                    $refTableSchema = $parts[4]
                    $refTableName = $parts[5]
                    $refColumnName = $parts[6]
                    
                    # Check for broken references
                    $checkQuery = @"
                    SELECT COUNT(*) FROM (
                        SELECT t1.$columnName
                        FROM $tableSchema.$tableName t1
                        LEFT JOIN $refTableSchema.$refTableName t2
                        ON t1.$columnName = t2.$refColumnName
                        WHERE t1.$columnName IS NOT NULL
                        AND t2.$refColumnName IS NULL
                    ) as broken_refs;
"@
                    
                    $brokenRefs = Invoke-RemoteSql -query $checkQuery -captureOutput
                    $brokenCount = $brokenRefs.Trim()
                    
                    if ($brokenCount -ne "0") {
                        Log-Warning "Found $brokenCount broken references in $constraintName ($tableSchema.$tableName.$columnName -> $refTableSchema.$refTableName.$refColumnName)"
                        $issuesFound++
                    }
                }
            }
            
            if ($issuesFound -eq 0) {
                Log-Success "No broken references found in the database"
            } else {
                Log-Warning "Found $issuesFound foreign key constraints with broken references. Manual fixes may be required."
            }
        }

        # Final output
        Log-Phase "RELATIONSHIP FIXES COMPLETE"
        
        if ($DryRun) {
            Log-Message "DRY RUN: Would apply $fixesApplied fixes to relationships" "Yellow"
        } else {
            Log-Success "Applied $fixesApplied fixes to relationships"
        }
        
        if ($potentialIssues -gt 0) {
            Log-Warning "Identified $potentialIssues potential issues that may require manual intervention"
        }
        
        return @{
            Success = $true
            FixesApplied = $fixesApplied
            DryRun = $DryRun
            PotentialIssues = $potentialIssues
        }
    }
    catch {
        Log-Error "RELATIONSHIP FIXES ERROR: $($_.Exception.Message)"
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Execute the fixes
Fix-RemoteRelationships
