# diagnose-course-route.ps1
# Script to diagnose issues with the course route in the remote database

# Import required modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"

# Initialize logging
Initialize-Logging -logPrefix "course-diagnosis"

try {
    Log-Phase "COURSE ROUTE DIAGNOSIS"

    # Set environment variables to use remote database
    $originalDatabaseUri = $env:DATABASE_URI
    $originalDatabaseUrl = $env:DATABASE_URL
    
    $env:DATABASE_URI = $env:REMOTE_DATABASE_URL
    $env:DATABASE_URL = $env:REMOTE_DATABASE_URL
    
    Log-Message "Using remote database: $env:REMOTE_DATABASE_URL" "Cyan"
    
    # First, verify direct access to the remote database
    Log-Step "Testing Database Connection" 1
    Push-Location -Path "apps/web"
    
    # Run a simple diff to check connection
    Log-Message "Testing database connection..." "Yellow"
    Exec-Command -command "supabase db diff --db-url `"$env:REMOTE_DATABASE_URL`" --schema payload --table courses -s 1" -description "Testing database connection" -continueOnError
    
    # Now check if courses table exists and has data
    Log-Step "Checking Courses Table" 2
    Log-Message "Testing if courses table exists and has data..." "Yellow"
    
    # Create a temporary SQL file
    $tempSqlFile = Join-Path -Path $env:TEMP -ChildPath "check_courses.sql"
    @"
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'payload' 
    AND table_name = 'courses'
) AS courses_table_exists;

SELECT COUNT(*) AS course_count FROM payload.courses;

SELECT id, title, active, updated_at
FROM payload.courses
LIMIT 10;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'payload' 
    AND table_name = 'courses_rels'
) AS courses_rels_table_exists;

SELECT COUNT(*) AS courses_rels_count FROM payload.courses_rels;

SELECT * FROM payload.courses_rels LIMIT 10;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'payload' 
    AND table_name = 'course_lessons'
) AS course_lessons_table_exists;

SELECT COUNT(*) AS course_lessons_count FROM payload.course_lessons;
"@ | Out-File -FilePath $tempSqlFile -Encoding utf8
    
    # Execute the SQL with supabase CLI
    Log-Message "Executing SQL queries..." "Yellow"
    Exec-Command -command "supabase db execute --db-url `"$env:REMOTE_DATABASE_URL`" -f `"$tempSqlFile`"" -description "Checking courses tables" -continueOnError
    
    # Clean up
    Remove-Item -Path $tempSqlFile -Force -ErrorAction SilentlyContinue
    
    Pop-Location
    
    # Check if we're using the route handler from Next.js
    Log-Step "Checking Next.js Route Implementation" 3
    Log-Message "Finding course route implementation..." "Yellow"
    
    # Check for course routes
    $coursePaths = @(
        "apps/web/app/home/course/page.tsx"
    )
    
    foreach ($path in $coursePaths) {
        if (Test-Path $path) {
            Log-Message "Found route file: $path" "Green"
            $fileContent = Get-Content -Path $path | Out-String
            Log-Message "File content summary:" "Cyan"
            Log-Message ($fileContent -split '\n' | Select-Object -First 20 | Out-String) "Gray"
            
            # Look for database queries
            if ($fileContent -match "courses") {
                Log-Message "Found courses query in the route file" "Yellow"
                
                # Extract the query if possible
                if ($fileContent -match "(supabase|client).*from\s*\(\s*['""]courses['""].*\)") {
                    Log-Message "Query pattern found: $($matches[0])" "Cyan"
                }
            }
        } else {
            Log-Message "Route file not found: $path" "Red"
        }
    }
    
    # Check for API handlers
    Log-Step "Checking API Route Implementation" 4
    $apiPaths = @(
        "apps/web/app/api/courses"
    )
    
    foreach ($path in $apiPaths) {
        if (Test-Path $path) {
            Log-Message "Found API directory: $path" "Green"
            Get-ChildItem -Path $path -Recurse -File | ForEach-Object {
                Log-Message "Found API file: $($_.FullName)" "Cyan"
                $apiContent = Get-Content -Path $_.FullName | Out-String
                
                if ($apiContent -match "courses") {
                    Log-Message "Found courses query in API file: $($_.Name)" "Yellow"
                }
            }
        } else {
            Log-Message "API directory not found: $path" "Yellow"
        }
    }
    
    # Check for relationship issues
    Log-Step "Running Relationship Verification" 5
    
    Set-ProjectRootLocation
    if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
        Log-Message "Running course relationship verification..." "Yellow"
        Exec-Command -command "pnpm run verify:course-content" -description "Verifying course relationships" -continueOnError
    }
    
    # Restore original environment variables
    $env:DATABASE_URI = $originalDatabaseUri
    $env:DATABASE_URL = $originalDatabaseUrl
    
    Log-Success "Course route diagnosis completed"
}
catch {
    Log-Error "CRITICAL ERROR: Course route diagnosis failed: $_"
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
    
    # Make sure we return to the original directory
    Set-ProjectRootLocation
    
    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
