# PowerShell Loading Phase Module for Reset-and-Migrate.ps1
# Handles content migration and database verification

# Import utility modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\verification.ps1"
. "$PSScriptRoot\..\utils\supabase.ps1"

# Function to run the loading phase
function Invoke-LoadingPhase {
    param (
        [switch]$SkipVerification
    )
    
    # Step 7: Run content migrations via Payload migrations
    Run-ContentMigrations
    
    # Identify potentially parallelizable steps
    Log-Message "Identifying steps that could potentially be run in parallel..." "Cyan"
    
    # Step 8.1: Run specialized blog post migration
    Migrate-BlogPosts
    
    # Step 8.2: Run specialized private posts migration
    Migrate-PrivatePosts

    # Step 8.3: Fix UUID tables to ensure columns exist
    Fix-UuidTables
    
    # Step 9: Import downloads from R2 bucket
    Import-Downloads
    
    # Step 10: Fix relationships
    Fix-Relationships
    
    # Step 11: Comprehensive database verification
    if (-not $SkipVerification) {
        Verify-DatabaseState
    }
    
    # Step 12: Create certificates storage bucket in Supabase
    Create-CertificatesBucket
    
    Log-Success "Loading phase completed successfully"
}

# Function to run content migrations
function Run-ContentMigrations {
    Log-EnhancedStep "Running content migrations via Payload migrations" 7 12
    
    try {
        # First ensure we're at the project root
        Set-ProjectRootLocation
        Log-Message "Changed to project root: $(Get-Location)" "Gray"
        
        # Navigate to apps/payload directory using absolute path
        if (Set-ProjectLocation -RelativePath "apps/payload") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
        } else {
            throw "Could not find apps/payload directory from project root"
        }

        # Run all migrations (including content migrations)
        Log-Message "Running all Payload migrations..." "Yellow"
        Exec-Command -command "pnpm payload migrate" -description "Running Payload migrations"

        # Verify migrations were applied
        Log-Message "Verifying migrations..." "Yellow"
        
        try {
            $migrationStatus = Exec-Command -command "pnpm migrate:status" -description "Verifying migration status" -captureOutput -continueOnError
        } catch {
            Log-Warning "Could not verify migration status: $_"
            Log-Message "This is non-critical, continuing" "Yellow"
        }

        # Return to project root before changing to content-migrations
        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        # Now go to content-migrations from the project root
        Set-ProjectRootLocation
        # Run verification scripts
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
            
            Log-Message "Verifying database state..." "Yellow"
            $verificationResult = Exec-Command -command "pnpm run verify:all" -description "Verifying database structure" -captureOutput -continueOnError
            
            # Check if verification found any issues
            if ($verificationResult -match "Warning" -or $verificationResult -match "Error") {
                Log-Warning "Verification found issues, will run repairs in the Fix-Relationships step"
            } else {
                Log-Success "No issues found in initial verification"
            }

            Pop-Location
            Log-Message "Returned to directory: $(Get-Location)" "Gray"
        } else {
            Log-Warning "Could not find packages/content-migrations directory, skipping initial verification"
        }
        
        Log-Success "Content migrations completed successfully"
        return $true
    }
    catch {
        Log-Error "Failed to run content migrations: $_"
        throw "Content migration failed: $_"
    }
}

# Function to import downloads from R2 bucket
function Import-Downloads {
    Log-EnhancedStep "Importing downloads from R2 bucket" 9 12
    
    try {
        # First ensure we're at the project root
        Set-ProjectRootLocation
        Log-Message "Changed to project root: $(Get-Location)" "Gray"
        
        # Navigate to content-migrations directory using absolute path
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
        } else {
            throw "Could not find packages/content-migrations directory from project root"
        }
        
        Log-Message "Importing downloads..." "Yellow"
        Exec-Command -command "pnpm run import:downloads" -description "Importing downloads from R2 bucket" -continueOnError
        
        Log-Success "Downloads imported successfully"
        
        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        return $true
    }
    catch {
        Log-Error "Failed to import downloads: $_"
        throw "Download import failed: $_"
    }
}

# Function to fix UUID tables
function Fix-UuidTables {
    Log-EnhancedStep "Fixing UUID tables to ensure all required columns exist" 8.3 12
    
    try {
        # First ensure we're at the project root
        Set-ProjectRootLocation
        Log-Message "Changed to project root: $(Get-Location)" "Gray"
        
        # Navigate to content-migrations directory
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
            
            # Run the UUID tables fix script
            Log-Message "Running UUID tables fix script to add private_id column..." "Yellow"
            Exec-Command -command "pnpm run fix:uuid-tables" -description "Fixing UUID tables"

            # Verify the UUID tables
            Log-Message "Verifying UUID tables..." "Yellow"
            Exec-Command -command "pnpm run verify:uuid-tables" -description "Verifying UUID tables"
            
            # Additionally run the direct column fixing script
            Log-Message "Ensuring all relationship columns exist..." "Yellow"
            Exec-Command -command "pnpm --filter @kit/content-migrations run repair:relationship-columns" -description "Fixing relationship columns"
            
            # Verify columns were added
            Log-Message "Verifying columns were added..." "Yellow"
            Exec-Command -command "pnpm --filter @kit/content-migrations run verify:relationship-columns" -description "Verifying relationship columns"
            
            Log-Success "UUID tables fixed and verified successfully"
            
            Pop-Location
            Log-Message "Returned to directory: $(Get-Location)" "Gray"
        } else {
            Log-Warning "Could not find packages/content-migrations directory, skipping UUID table fix"
        }
        
        return $true
    }
    catch {
        Log-Error "Failed to fix UUID tables: $_"
        Log-Warning "This error might affect relationship queries, but continuing"
        return $false
    }
}

# Function to fix relationships
function Fix-Relationships {
    Log-EnhancedStep "Fixing relationships" 10 12
    
    try {
        # First ensure we're at the project root
        Set-ProjectRootLocation
        Log-Message "Changed to project root: $(Get-Location)" "Gray"
        
        # Navigate to content-migrations directory using absolute path
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
        } else {
            throw "Could not find packages/content-migrations directory from project root"
        }

        # Run the repair scripts
        Log-Message "Running edge case repairs..." "Yellow"
        Exec-Command -command "pnpm run repair:edge-cases" -description "Running edge case repairs" -continueOnError

        # Run Payload CMS relationship fix with strict typing (highest priority)
        Log-Message "Running Payload CMS relationship fix with strict typing..." "Yellow"
        Exec-Command -command "pnpm run fix:payload-relationships-strict" -description "Fixing Payload relationships with strict typing" -continueOnError
        
        # Run the consolidated quizzes relationship fix
        Log-Message "Running consolidated quiz relationship fix..." "Yellow"
        Exec-Command -command "pnpm run fix:direct-quiz-fix" -description "Fixing all quiz relationships" -continueOnError

        # Fix invalid quiz references in lessons
        Log-Message "Fixing invalid quiz references..." "Yellow"
        Exec-Command -command "pnpm run fix:invalid-quiz-references" -description "Fixing invalid quiz references" -continueOnError

        # Apply direct SQL fix for all quiz relationship issues
        Log-Message "Applying direct SQL fix for quiz relationships..." "Yellow"
        Exec-Command -command "pnpm run fix:direct-quiz-fix" -description "Applying direct quiz relationships fix" -continueOnError
        
        # Run comprehensive lesson-quiz relationship fixes
        Log-Message "Running comprehensive lesson-quiz relationship fixes..." "Yellow"
        Exec-Command -command "pnpm run fix:lesson-quiz-relationships-comprehensive" -description "Fixing all lesson-quiz relationships" -continueOnError

        # Run comprehensive question-quiz relationship fixes
        Log-Message "Running comprehensive question-quiz relationship fixes..." "Yellow"
        Exec-Command -command "pnpm run fix:question-quiz-relationships-comprehensive" -description "Fixing all question-quiz relationships" -continueOnError

        # Skip the deprecated unidirectional fix, as it's now part of the consolidated course-quiz-relationships script

        # Fix survey questions population issue
        Log-Message "Fixing survey questions population..." "Yellow"
        Exec-Command -command "pnpm run fix:survey-questions-population" -description "Fixing survey questions population" -continueOnError

        # Ensure todo column exists in course_lessons table
        Log-Message "Ensuring todo column exists in course_lessons table..." "Yellow"
        Exec-Command -command "pnpm run sql:ensure-todo-column" -description "Ensuring todo column exists" -continueOnError

        # Fix todo fields in course_lessons table
        Log-Message "Fixing todo fields in course_lessons table..." "Yellow"
        Exec-Command -command "pnpm run fix:todo-fields" -description "Fixing todo fields" -continueOnError

        # Fix Lexical format issues in todo fields
        Log-Message "Fixing Lexical format in todo fields..." "Yellow"
        Exec-Command -command "pnpm run fix:lexical-format" -description "Fixing Lexical format" -continueOnError

        # Fix Lexical format issues in posts and private posts
        Log-Message "Fixing Lexical format in posts and private posts..." "Yellow"
        Exec-Command -command "pnpm run fix:post-lexical-format" -description "Fixing Post Lexical format" -continueOnError

        # Fix Lexical format across all collections (comprehensive fix)
        Log-Message "Fixing all Lexical fields across all collections..." "Yellow"
        Exec-Command -command "pnpm run fix:all-lexical-fields" -description "Fixing all Lexical fields" -continueOnError
        
        # Fix bunny_video_id fields in course_lessons table
        Log-Message "Fixing bunny_video_id fields in course_lessons table..." "Yellow"
        Exec-Command -command "pnpm run fix:bunny-video-ids" -description "Fixing bunny video IDs" -continueOnError
        
        # Fix post image relationships
        Log-Message "Fixing post image relationships..." "Yellow"
        Exec-Command -command "pnpm run fix:post-image-relationships" -description "Fixing post image relationships" -continueOnError
        
        # Fix downloads relationships and update URLs to use custom domain
        Log-Message "Fixing downloads relationships and URLs..." "Yellow"
        Exec-Command -command "pnpm run fix:downloads-relationships" -description "Fixing downloads relationships and URLs" -continueOnError
        
        # Fix downloads R2 integration with custom domain
        Log-Message "Fixing downloads R2 integration..." "Yellow"
        Exec-Command -command "pnpm run fix:downloads-r2-integration" -description "Fixing downloads R2 integration" -continueOnError
        
        # Fix downloads metadata with correct column names and thumbnails
        Log-Message "Fixing downloads metadata..." "Yellow"
        Exec-Command -command "pnpm run fix:downloads-metadata" -description "Fixing downloads metadata" -continueOnError
        
        # Fix download R2 URLs with proper CDN links
        Log-Message "Fixing download R2 URLs..." "Yellow"
        Exec-Command -command "pnpm run fix:download-r2-urls" -description "Fixing download R2 URLs" -continueOnError
        
        # Fix download R2 mappings for placeholder files
        Log-Message "Fixing download R2 mappings..." "Yellow"
        Exec-Command -command "pnpm run fix:download-r2-mappings" -description "Fixing download R2 mappings" -continueOnError
        
        # Clear lesson content to fix template tag rendering issues
        Log-Message "Clearing lesson content fields to fix template tag rendering..." "Yellow"
        Exec-Command -command "pnpm run clear:lesson-content" -description "Clearing lesson content fields" -continueOnError

        # Apply the consolidated course-quiz relationships fix
        Log-Message "Applying consolidated course-quiz relationship fix..." "Yellow"
        Exec-Command -command "pnpm run fix:course-quiz-relationships" -description "Fixing course-quiz relationships" -continueOnError
        
        # Run the consolidated quiz course ID fix
        Log-Message "Running consolidated quiz course ID fix..." "Yellow"
        Exec-Command -command "pnpm run fix:quiz-course-ids" -description "Fixing quiz course IDs" -continueOnError

        # Run final verification
        Log-Message "Running final verification..." "Yellow"
        $finalVerification = Exec-Command -command "pnpm run verify:all" -description "Final verification" -captureOutput -continueOnError
        
        if ($finalVerification -match "Warning" -or $finalVerification -match "Error") {
            Log-Warning "Some issues could not be fixed automatically"
        } else {
            Log-Success "All relationship issues have been fixed"
        }

        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        return $true
    }
    catch {
        Log-Error "Failed to fix relationships: $_"
        throw "Relationship fixing failed: $_"
    }
}

# Function to verify database state
function Verify-DatabaseState {
    Log-EnhancedStep "Performing comprehensive database verification" 11 12
    
    try {
        # First ensure we're at the project root
        Set-ProjectRootLocation
        Log-Message "Changed to project root: $(Get-Location)" "Gray"
        
        # Navigate to content-migrations directory using absolute path
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
        } else {
            throw "Could not find packages/content-migrations directory from project root"
        }

        # Check for required environment variables
        Check-DatabaseEnvironment
        
        # Verify database schema using the Node.js utility
        Log-Message "Verifying database schema..." "Yellow"
        $finalVerification = Exec-Command -command "pnpm run sql:verify-schema" -description "Final database verification" -captureOutput -continueOnError
        
        if ($finalVerification -match "Error" -or $LASTEXITCODE -ne 0) {
            Log-Error "Final database verification failed"
            $global:overallSuccess = $false
        } else {
            Log-Success "Database schema verification passed"
        }

        # Verify database columns
        Verify-DatabaseColumns
        
        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        Log-Success "Database verification completed successfully"
        return $true
    }
    catch {
        Log-Error "Database verification failed: $_"
        $global:overallSuccess = $false
        return $false
    }
}

# Function to create certificates bucket in Supabase
# This step is now handled by the migration file: apps/web/supabase/migrations/20250407140654_create_certificates_bucket.sql
function Create-CertificatesBucket {
    Log-EnhancedStep "Creating certificates storage bucket in Supabase" 12 12
    
    try {
        # The bucket is created by the Supabase migration process
        # No additional actions are needed here as the migration file handles it
        
        Log-Message "Certificates bucket is created during migration with direct SQL INSERT" "Gray"
        Log-Success "Database migrations successfully handle certificates bucket creation"
        return $true
    }
    catch {
        Log-Error "Failed to verify certificates bucket: $_"
        Log-Warning "This is non-critical, continuing"
        return $false
    }
}


# Function to run private posts migration with full content
function Migrate-PrivatePosts {
    Log-EnhancedStep "Migrating private posts with complete content" 8.2 12
    
    try {
        # First ensure we're at the project root
        Set-ProjectRootLocation
        Log-Message "Changed to project root: $(Get-Location)" "Gray"
        
        # Check if private posts exist in the database
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
            
            # Run the direct migration script for private posts
            Log-Message "Running specialized private posts migration script..." "Yellow"
            $privateOutput = Exec-Command -command "pnpm run migrate:private-direct" -description "Migrating private posts with full content" -captureOutput -continueOnError
            
            # Check for enhanced status messages
            if ($privateOutput -match "No new private posts were migrated. All (\d+) private posts already exist") {
                Log-Message "Private posts are up to date. All $($matches[1]) private posts already exist in the database." "Yellow"
            } elseif ($privateOutput -match "Successfully migrated/updated (\d+) of (\d+) private posts") {
                Log-Success "Successfully migrated/updated $($matches[1]) of $($matches[2]) private posts"
            } else {
                # Fallback to traditional verification method
                $verifyQuery = "SELECT COUNT(*) as count FROM payload.private"
                $result = Exec-Command -command "pnpm run utils:run-sql --sql `"$verifyQuery`"" -description "Verifying private posts table" -captureOutput -continueOnError
                # Safely extract count with proper error handling
                $postCount = 0
                if ($result -match "count: (\d+)" -or $result -match "count:(\d+)" -or $result -match "rows: (\d+)") {
                    $postCount = [int]($Matches[1])
                }
                
                if ($postCount -gt 0) {
                    Log-Success "Found $postCount private posts in the database"
                } else {
                    Log-Warning "No private posts found in the database. Check the private posts migration script."
                }
            }
            
            Pop-Location
            Log-Message "Returned to directory: $(Get-Location)" "Gray"
        } else {
            Log-Warning "Could not find packages/content-migrations directory, skipping private posts migration"
        }
        
        return $true
    }
    catch {
        Log-Error "Failed to migrate private posts: $_"
        Log-Warning "This is non-critical, continuing"
        return $false
    }
}

# Function to run blog posts migration with full content
function Migrate-BlogPosts {
    Log-EnhancedStep "Migrating blog posts with complete content" 8.1 12
    
    try {
        # First ensure we're at the project root
        Set-ProjectRootLocation
        Log-Message "Changed to project root: $(Get-Location)" "Gray"
        
        # Check if posts exist in the database
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
            
                # Run the direct migration script for posts regardless of existing count
                Log-Message "Running specialized post migration script..." "Yellow"
                $postsOutput = Exec-Command -command "pnpm run migrate:posts-direct" -description "Migrating blog posts with full content" -captureOutput -continueOnError
                
                # Check for enhanced status messages
                if ($postsOutput -match "No new posts were migrated. All (\d+) posts already exist") {
                    Log-Message "Blog posts are up to date. All $($matches[1]) posts already exist in the database." "Yellow"
                } elseif ($postsOutput -match "Successfully migrated/updated (\d+) of (\d+) posts") {
                    Log-Success "Successfully migrated/updated $($matches[1]) of $($matches[2]) blog posts"
                } else {
                    # Fallback to traditional verification method
                    $verifyQuery = "SELECT COUNT(*) as count FROM payload.posts"
                    $result = Exec-Command -command "pnpm run utils:run-sql --sql `"$verifyQuery`"" -description "Verifying posts table" -captureOutput -continueOnError
                    # Safely extract count with proper error handling
                    $postCount = 0
                    if ($result -match "count: (\d+)" -or $result -match "count:(\d+)" -or $result -match "rows: (\d+)") {
                        $postCount = [int]($Matches[1])
                    }
                    
                    if ($postCount -gt 0) {
                        Log-Success "Found $postCount blog posts in the database"
                    } else {
                        Log-Warning "No posts found in the database. Check the post migration script."
                    }
                }
            
            Pop-Location
            Log-Message "Returned to directory: $(Get-Location)" "Gray"
        } else {
            Log-Warning "Could not find packages/content-migrations directory, skipping blog posts migration"
        }
        
        return $true
    }
    catch {
        Log-Error "Failed to migrate blog posts: $_"
        Log-Warning "This is non-critical, continuing"
        return $false
    }
}

# All functions are automatically available when dot-sourced
# No need for Export-ModuleMember in this context
