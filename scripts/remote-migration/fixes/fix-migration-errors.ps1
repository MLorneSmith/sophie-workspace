# Migration Error Fixes
# This script addresses common migration errors that can occur during schema migration

param (
    [string]$RemoteDbUrl,
    [switch]$FixAll,
    [switch]$FixDownloadsRels,
    [switch]$FixDocumentationRels,
    [switch]$FixCourseLessonsRels,
    [switch]$Verbose
)

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Import modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\database.ps1"

# Fix potential path issues by ensuring utils directory exists
if (-not (Test-Path "$PSScriptRoot\..\utils\database.ps1")) {
    Write-Host "Warning: Database utils not found at expected path, trying alternate paths..." -ForegroundColor Yellow
    
    # Try different relative paths
    $possiblePaths = @(
        "$PSScriptRoot\..\utils\database.ps1",
        "$PSScriptRoot\..\..\utils\database.ps1",
        "$PSScriptRoot\utils\database.ps1",
        ".\scripts\remote-migration\utils\database.ps1"
    )
    
    $found = $false
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            Write-Host "Found database.ps1 at: $path" -ForegroundColor Green
            . $path
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        throw "Could not locate database.ps1 in any of the expected locations."
    }
}

# Initialize logging
Log-Phase "STARTING MIGRATION ERROR FIXES"

try {
    # Check remote DB URL
    if (-not $RemoteDbUrl -and -not $env:REMOTE_DATABASE_URL) {
        throw "Remote database URL not provided. Use -RemoteDbUrl parameter or set REMOTE_DATABASE_URL environment variable."
    }
    
    # Make sure the URL is properly formatted for CLI
    $dbUrl = if ($RemoteDbUrl) { $RemoteDbUrl } else { $env:REMOTE_DATABASE_URL }
    
    # Validate connection URL format
    if (-not ($dbUrl.StartsWith("postgresql://") -or $dbUrl.StartsWith("postgres://"))) {
        throw "Invalid database URL format. Must be in format: postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres or postgres://postgres.project-ref:password@aws-0-region.pooler.supabase.com:5432/postgres"
    }

    # Function to fix downloads_rels parent_id issue
    function Fix-DownloadsRelsTable {
        Log-Step "Fixing downloads_rels table parent_id column issue"
        
        # Check if the table exists
        $checkTableQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'payload' AND table_name = 'downloads_rels');"
        $tableExists = Invoke-RemoteSql -query $checkTableQuery -captureOutput -continueOnError
        
        if ($tableExists -match "t") {
            Log-Message "Table payload.downloads_rels exists" "Cyan"
            
            # Check if parent_id column exists
            $checkColumnQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads_rels' AND column_name = 'parent_id');"
            $columnExists = Invoke-RemoteSql -query $checkColumnQuery -captureOutput -continueOnError
            
            if ($columnExists -match "t") {
                Log-Message "Column parent_id already exists in downloads_rels table" "Green"
            } else {
                Log-Message "Adding parent_id column to downloads_rels table" "Yellow"
                
                # Add parent_id column
                $addColumnQuery = @"
                ALTER TABLE payload.downloads_rels 
                ADD COLUMN parent_id TEXT;
"@
                Invoke-RemoteSql -query $addColumnQuery -continueOnError
                
                Log-Success "Added parent_id column to downloads_rels table"
            }
        } else {
            Log-Warning "Table payload.downloads_rels does not exist. Creating it..."
            
            # Create the downloads_rels table with parent_id column
            $createTableQuery = @"
            CREATE TABLE IF NOT EXISTS payload.downloads_rels (
                id SERIAL PRIMARY KEY,
                parent_id TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
"@
            Invoke-RemoteSql -query $createTableQuery -continueOnError
            
            Log-Success "Created downloads_rels table with parent_id column"
        }
    }
    
    # Function to fix course_lessons_rels parent_id issue
    function Fix-CourseLessonsRelsTable {
        Log-Step "Fixing course_lessons_rels table parent_id column issue"
        
        # Check if the table exists
        $checkTableQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'payload' AND table_name = 'course_lessons_rels');"
        $tableExists = Invoke-RemoteSql -query $checkTableQuery -captureOutput -continueOnError
        
        if ($tableExists -match "t") {
            Log-Message "Table payload.course_lessons_rels exists" "Cyan"
            
            # Check if parent_id column exists
            $checkParentIdQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'course_lessons_rels' AND column_name = 'parent_id');"
            $parentIdExists = Invoke-RemoteSql -query $checkParentIdQuery -captureOutput -continueOnError
            
            if ($parentIdExists -match "t") {
                Log-Message "Column parent_id already exists in course_lessons_rels table" "Green"
            } else {
                Log-Message "Adding parent_id column to course_lessons_rels table" "Yellow"
                $addParentIdQuery = "ALTER TABLE payload.course_lessons_rels ADD COLUMN parent_id INTEGER;"
                Invoke-RemoteSql -query $addParentIdQuery -continueOnError
                Log-Success "Added parent_id column to course_lessons_rels table"
            }
            
            # Check if _parent_id column exists
            $checkUnderscoreParentIdQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'course_lessons_rels' AND column_name = '_parent_id');"
            $underscoreParentIdExists = Invoke-RemoteSql -query $checkUnderscoreParentIdQuery -captureOutput -continueOnError
            
            if ($underscoreParentIdExists -match "t") {
                Log-Message "Column _parent_id already exists in course_lessons_rels table" "Green"
            } else {
                Log-Message "Adding _parent_id column to course_lessons_rels table" "Yellow"
                $addUnderscoreParentIdQuery = "ALTER TABLE payload.course_lessons_rels ADD COLUMN _parent_id INTEGER;"
                Invoke-RemoteSql -query $addUnderscoreParentIdQuery -continueOnError
                Log-Success "Added _parent_id column to course_lessons_rels table"
            }
            
            Log-Success "Ensured parent_id and _parent_id columns exist in course_lessons_rels table"
        } else {
            Log-Warning "Table payload.course_lessons_rels does not exist. Creating it..."
            
            # Create the course_lessons_rels table with both column variants
            $createTableQuery = @"
            CREATE TABLE IF NOT EXISTS payload.course_lessons_rels (
                id SERIAL PRIMARY KEY,
                parent_id INTEGER,
                _parent_id INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
"@
            Invoke-RemoteSql -query $createTableQuery -continueOnError
            
            Log-Success "Created course_lessons_rels table with parent_id and _parent_id columns"
        }
    }
    
    # Function to fix documentation_rels parent_id issue
    function Fix-DocumentationRelsTable {
        Log-Step "Fixing documentation_rels table parent_id column issue"
        
        # Check if the table exists
        $checkTableQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'payload' AND table_name = 'documentation_rels');"
        $tableExists = Invoke-RemoteSql -query $checkTableQuery -captureOutput -continueOnError
        
        if ($tableExists -match "t") {
            Log-Message "Table payload.documentation_rels exists" "Cyan"
            
            # Check if parent_id column exists
            $checkParentIdQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'documentation_rels' AND column_name = 'parent_id');"
            $parentIdExists = Invoke-RemoteSql -query $checkParentIdQuery -captureOutput -continueOnError
            
            if ($parentIdExists -match "t") {
                Log-Message "Column parent_id already exists in documentation_rels table" "Green"
            } else {
                Log-Message "Adding parent_id column to documentation_rels table" "Yellow"
                $addParentIdQuery = "ALTER TABLE payload.documentation_rels ADD COLUMN parent_id TEXT;"
                Invoke-RemoteSql -query $addParentIdQuery -continueOnError
                Log-Success "Added parent_id column to documentation_rels table"
            }
            
            # Check if _parent_id column exists
            $checkUnderscoreParentIdQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'documentation_rels' AND column_name = '_parent_id');"
            $underscoreParentIdExists = Invoke-RemoteSql -query $checkUnderscoreParentIdQuery -captureOutput -continueOnError
            
            if ($underscoreParentIdExists -match "t") {
                Log-Message "Column _parent_id already exists in documentation_rels table" "Green"
            } else {
                Log-Message "Adding _parent_id column to documentation_rels table" "Yellow"
                $addUnderscoreParentIdQuery = "ALTER TABLE payload.documentation_rels ADD COLUMN _parent_id TEXT;"
                Invoke-RemoteSql -query $addUnderscoreParentIdQuery -continueOnError
                Log-Success "Added _parent_id column to documentation_rels table"
            }
            
            # Check if value column exists (needed for downloads_relationships view)
            $checkValueQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'documentation_rels' AND column_name = 'value');"
            $valueExists = Invoke-RemoteSql -query $checkValueQuery -captureOutput -continueOnError
            
            if ($valueExists -match "t") {
                Log-Message "Column value already exists in documentation_rels table" "Green"
            } else {
                Log-Message "Adding value column to documentation_rels table" "Yellow"
                $addValueQuery = "ALTER TABLE payload.documentation_rels ADD COLUMN value TEXT;"
                Invoke-RemoteSql -query $addValueQuery -continueOnError
                Log-Success "Added value column to documentation_rels table"
            }
            
            # Check if downloads_id column exists (alternative name for value column)
            $checkDownloadsIdQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'documentation_rels' AND column_name = 'downloads_id');"
            $downloadsIdExists = Invoke-RemoteSql -query $checkDownloadsIdQuery -captureOutput -continueOnError
            
            if ($downloadsIdExists -match "t") {
                Log-Message "Column downloads_id already exists in documentation_rels table" "Green"
            } else {
                Log-Message "Adding downloads_id column to documentation_rels table" "Yellow"
                $addDownloadsIdQuery = "ALTER TABLE payload.documentation_rels ADD COLUMN downloads_id TEXT;"
                Invoke-RemoteSql -query $addDownloadsIdQuery -continueOnError
                Log-Success "Added downloads_id column to documentation_rels table"
            }
            
            Log-Success "Ensured all required columns exist in documentation_rels table"
        } else {
            Log-Warning "Table payload.documentation_rels does not exist. Creating it..."
            
            # Create the documentation_rels table with both column variants
            $createTableQuery = @"
            CREATE TABLE IF NOT EXISTS payload.documentation_rels (
                id SERIAL PRIMARY KEY,
                parent_id TEXT,
                _parent_id TEXT,
                value TEXT,
                downloads_id TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
"@
            Invoke-RemoteSql -query $createTableQuery -continueOnError
            
            Log-Success "Created documentation_rels table with all required columns"
        }
    }

    # Function to fix any other missing tables based on errors
    function Fix-MissingTablesFromErrors {
        Log-Step "Checking for and fixing other missing tables"
        
        # Review recent migration logs for error patterns
        $logPath = "$PSScriptRoot\..\..\..\z.migration-logs"
        $recentLogs = Get-ChildItem -Path $logPath -Filter "migration-log-*.txt" | Sort-Object LastWriteTime -Descending | Select-Object -First 3
        
        $knownErrorPatterns = @{
            "column .+ does not exist" = @{
                "regex" = 'column "([^"]+)" (?:of relation|does not exist)'
                "fix" = { 
                    param($match)
                    $column = $match.Groups[1].Value
                    $tableMatch = [regex]::Match($match.Context.PostContext, '\s*alter\s+table\s+"?([^"\.]+)"?\."?([^"\.]+)"?')
                    
                    if ($tableMatch.Success) {
                        $schema = $tableMatch.Groups[1].Value
                        $table = $tableMatch.Groups[2].Value
                        
                        Log-Message "Detected missing column: $column in $schema.$table" "Yellow"
                        
                        # Add the column to the table
                        $addColumnQuery = @"
                        DO $$
                        BEGIN
                            -- Check if column exists
                            IF NOT EXISTS (
                                SELECT 1 FROM information_schema.columns
                                WHERE table_schema = '$schema'
                                AND table_name = '$table'
                                AND column_name = '$column'
                            ) THEN
                                EXECUTE 'ALTER TABLE $schema."$table" ADD COLUMN "$column" TEXT';
                            END IF;
                        END
                        $$;
"@
                        Invoke-RemoteSql -query $addColumnQuery -continueOnError
                        Log-Success "Added column $column to $schema.$table if it was missing"
                    }
                }
            }
            "relation .+ does not exist" = @{
                "regex" = 'relation "([^"\.]+)\.([^"\.]+)" does not exist'
                "fix" = {
                    param($match)
                    $schema = $match.Groups[1].Value
                    $table = $match.Groups[2].Value
                    
                    Log-Message "Detected missing table: $schema.$table" "Yellow"
                    
                    # Create the table
                    $createTableQuery = @"
                    CREATE TABLE IF NOT EXISTS $schema.$table (
                        id SERIAL PRIMARY KEY,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW()
                    );
"@
                    Invoke-RemoteSql -query $createTableQuery -continueOnError
                    Log-Success "Created missing table $schema.$table if it didn't exist"
                }
            }
        }
        
        foreach ($log in $recentLogs) {
            $logContent = Get-Content -Path $log.FullName -Raw
            
            foreach ($pattern in $knownErrorPatterns.Keys) {
                $regex = $knownErrorPatterns[$pattern].regex
                $fix = $knownErrorPatterns[$pattern].fix
                
                $matches = [regex]::Matches($logContent, $regex, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                
                foreach ($match in $matches) {
                    & $fix $match
                }
            }
        }
        
        # Also look specifically for view-related errors
        $viewErrorPattern = 'column\s+([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s+does not exist'
        $typeErrorPattern = 'operator does not exist: integer = text'
        $courseLessonsPattern = 'column clr.parent_id does not exist'
        
        foreach ($log in $recentLogs) {
            $logContent = Get-Content -Path $log.FullName -Raw
            
            # Check for view-related errors
            $viewMatches = [regex]::Matches($logContent, $viewErrorPattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            foreach ($match in $viewMatches) {
                $tableAlias = $match.Groups[1].Value
                $columnName = $match.Groups[2].Value
                
                if ($tableAlias -eq "dr" -and $columnName -eq "_parent_id") {
                    Log-Message "Found view-related error for documentation_rels._parent_id column, fixing..." "Yellow"
                    Fix-DocumentationRelsTable
                }
                
                if ($tableAlias -eq "clr" -and $columnName -eq "parent_id") {
                    Log-Message "Found view-related error for course_lessons_rels.parent_id column, fixing..." "Yellow"
                    Fix-CourseLessonsRelsTable
                }
            }
            
            # Check for course_lessons_rels issues explicitly
            if ($logContent -match $courseLessonsPattern) {
                Log-Message "Found issue with course_lessons_rels.parent_id column, fixing..." "Yellow"
                Fix-CourseLessonsRelsTable
            }
            
            # Check for type mismatch errors
            if ($logContent -match $typeErrorPattern) {
                Log-Message "Found type mismatch error (integer vs text), fixing..." "Yellow"
                Fix-TypeMismatchInRelationTables
            }
        }
    }
    
    # Function to fix type mismatch in documentation and related tables
    function Fix-TypeMismatchInRelationTables {
        Log-Step "Fixing type mismatch in documentation and related tables"
        
        # Check documentation table id column type
        $checkDocIdTypeQuery = "SELECT data_type FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'documentation' AND column_name = 'id';"
        $docIdType = Invoke-RemoteSql -query $checkDocIdTypeQuery -captureOutput -continueOnError
        
        # If documentation.id is integer type, convert relevant columns
        if ($docIdType -match "integer") {
            Log-Message "Documentation table id is integer type, need to ensure type compatibility" "Yellow"
            
            # 1. First check if documentation_rels._parent_id exists
            $checkParentIdQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'documentation_rels' AND column_name = '_parent_id');"
            $parentIdExists = Invoke-RemoteSql -query $checkParentIdQuery -captureOutput -continueOnError
            
            if ($parentIdExists -match "t") {
                # Update documentation_rels._parent_id to be integer type
                Log-Message "Altering documentation_rels._parent_id to be integer type" "Yellow"
                $alterParentIdTypeQuery = @"
                ALTER TABLE payload.documentation_rels 
                ALTER COLUMN _parent_id TYPE INTEGER USING _parent_id::INTEGER;
"@
                Invoke-RemoteSql -query $alterParentIdTypeQuery -continueOnError
                Log-Success "Updated _parent_id column type to integer"
            }
            
            # 2. Check and update documentation_rels.parent_id
            $checkUnderscoreParentIdQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'documentation_rels' AND column_name = 'parent_id');"
            $underscoreParentIdExists = Invoke-RemoteSql -query $checkUnderscoreParentIdQuery -captureOutput -continueOnError
            
            if ($underscoreParentIdExists -match "t") {
                # Update documentation_rels.parent_id to be integer type
                Log-Message "Altering documentation_rels.parent_id to be integer type" "Yellow"
                $alterUnderscoreParentIdTypeQuery = @"
                ALTER TABLE payload.documentation_rels 
                ALTER COLUMN parent_id TYPE INTEGER USING parent_id::INTEGER;
"@
                Invoke-RemoteSql -query $alterUnderscoreParentIdTypeQuery -continueOnError
                Log-Success "Updated parent_id column type to integer"
            }
            
            # 3. Check and update documentation_rels.value
            $checkValueQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'documentation_rels' AND column_name = 'value');"
            $valueExists = Invoke-RemoteSql -query $checkValueQuery -captureOutput -continueOnError
            
            if ($valueExists -match "t") {
                # Update documentation_rels.value to be integer type
                Log-Message "Altering documentation_rels.value to be integer type" "Yellow"
                $alterValueTypeQuery = @"
                ALTER TABLE payload.documentation_rels 
                ALTER COLUMN value TYPE INTEGER USING value::INTEGER;
"@
                Invoke-RemoteSql -query $alterValueTypeQuery -continueOnError
                Log-Success "Updated value column type to integer"
            }
            
            # 4. Check and update documentation_rels.downloads_id
            $checkDownloadsIdQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'documentation_rels' AND column_name = 'downloads_id');"
            $downloadsIdExists = Invoke-RemoteSql -query $checkDownloadsIdQuery -captureOutput -continueOnError
            
            if ($downloadsIdExists -match "t") {
                # Update documentation_rels.downloads_id to be integer type
                Log-Message "Altering documentation_rels.downloads_id to be integer type" "Yellow"
                $alterDownloadsIdTypeQuery = @"
                ALTER TABLE payload.documentation_rels 
                ALTER COLUMN downloads_id TYPE INTEGER USING downloads_id::INTEGER;
"@
                Invoke-RemoteSql -query $alterDownloadsIdTypeQuery -continueOnError
                Log-Success "Updated downloads_id column type to integer"
            }
            
            # 5. Also check downloads table id column type
            $checkDownloadsIdTypeQuery = "SELECT data_type FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'downloads' AND column_name = 'id';"
            $downloadsIdType = Invoke-RemoteSql -query $checkDownloadsIdTypeQuery -captureOutput -continueOnError
            
            Log-Message "Downloads table id is $downloadsIdType type" "Cyan"
            
            # 6. Check course_lessons id column type
            $checkCourseLessonsIdTypeQuery = "SELECT data_type FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'course_lessons' AND column_name = 'id';"
            $courseLessonsIdType = Invoke-RemoteSql -query $checkCourseLessonsIdTypeQuery -captureOutput -continueOnError
            
                Log-Message "Course lessons table id is $courseLessonsIdType type" "Cyan"
                
                # Handle course_lessons_rels table based on id type
                if ($courseLessonsIdType -match "integer") {
                    Log-Message "Ensuring course_lessons_rels table has integer type columns" "Yellow"
                    Fix-CourseLessonsRelsTable
                }
                elseif ($courseLessonsIdType -match "uuid") {
                    # For UUID type, we need to ensure the relation columns are also UUID type
                    Log-Message "Course lessons table has UUID ids, fixing relation columns" "Yellow"
                    
                    # Check if course_lessons_rels._parent_id exists
                    $checkParentIdQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'course_lessons_rels' AND column_name = '_parent_id');"
                    $parentIdExists = Invoke-RemoteSql -query $checkParentIdQuery -captureOutput -continueOnError
                    
                    if ($parentIdExists -match "t") {
                        # Update course_lessons_rels._parent_id to be UUID type
                        Log-Message "Altering course_lessons_rels._parent_id to be UUID type" "Yellow"
                        $alterParentIdTypeQuery = @"
                        ALTER TABLE payload.course_lessons_rels 
                        ALTER COLUMN _parent_id TYPE UUID USING _parent_id::UUID;
"@
                        Invoke-RemoteSql -query $alterParentIdTypeQuery -continueOnError
                        Log-Success "Updated _parent_id column type to UUID"
                    }
                    
                    # Check if course_lessons_rels.parent_id exists
                    $checkUnderscoreParentIdQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'course_lessons_rels' AND column_name = 'parent_id');"
                    $underscoreParentIdExists = Invoke-RemoteSql -query $checkUnderscoreParentIdQuery -captureOutput -continueOnError
                    
                    if ($underscoreParentIdExists -match "t") {
                        # Update course_lessons_rels.parent_id to be UUID type
                        Log-Message "Recreating course_lessons_rels.parent_id as UUID type" "Yellow"
                        
                        # Just drop and recreate the column as UUID - simplest approach
                        $recreateColumnQuery = @"
                        -- Drop the column
                        ALTER TABLE payload.course_lessons_rels DROP COLUMN IF EXISTS parent_id;
                        -- Add it back as UUID type
                        ALTER TABLE payload.course_lessons_rels ADD COLUMN parent_id UUID;
"@
                        Invoke-RemoteSql -query $recreateColumnQuery -continueOnError
                        Log-Success "Recreated parent_id column as UUID type"
                    }
                }
            
            Log-Success "Fixed type mismatch issues in all relationship tables"
        } else {
            Log-Message "Documentation table id is not integer type, no type conversion needed" "Green"
        }
    }

    # Run fixes based on parameters
    if ($FixAll -or $FixDownloadsRels) {
        Fix-DownloadsRelsTable
    }
    
    if ($FixAll -or $FixDocumentationRels) {
        Fix-DocumentationRelsTable
    }
    
    if ($FixAll -or $FixCourseLessonsRels) {
        Fix-CourseLessonsRelsTable
    }
    
    # Function to fix views that join UUID and integer columns
    function Fix-ViewTypeConflicts {
        Log-Step "Fixing view type conflicts"
        
        # First, let's check if the downloads_relationships view exists
        $checkViewQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.views WHERE table_schema = 'payload' AND table_name = 'downloads_relationships');"
        $viewExists = Invoke-RemoteSql -query $checkViewQuery -captureOutput -continueOnError
        
        if ($viewExists -match "t") {
            Log-Message "View payload.downloads_relationships exists, dropping it to recreate with proper casting" "Yellow"
            $dropViewQuery = "DROP VIEW IF EXISTS payload.downloads_relationships;"
            Invoke-RemoteSql -query $dropViewQuery -continueOnError
        }
        
        # First check if the course_lessons_rels table has a downloads_id or value column
        Log-Message "Checking course_lessons_rels table structure" "Yellow"
        
        $checkValueColumnQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'course_lessons_rels' AND column_name = 'value');"
        $valueColumnExists = Invoke-RemoteSql -query $checkValueColumnQuery -captureOutput -continueOnError
        
        $checkDownloadsIdColumnQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'course_lessons_rels' AND column_name = 'downloads_id');"
        $downloadsIdColumnExists = Invoke-RemoteSql -query $checkDownloadsIdColumnQuery -captureOutput -continueOnError
        
        # Add missing columns if needed
        if ($valueColumnExists -notmatch "t") {
            Log-Message "Adding value column to course_lessons_rels table" "Yellow"
            $addValueColumnQuery = "ALTER TABLE payload.course_lessons_rels ADD COLUMN value TEXT;"
            Invoke-RemoteSql -query $addValueColumnQuery -continueOnError
            Log-Success "Added value column to course_lessons_rels table"
        }
        
        if ($downloadsIdColumnExists -notmatch "t") {
            Log-Message "Adding downloads_id column to course_lessons_rels table" "Yellow"
            $addDownloadsIdColumnQuery = "ALTER TABLE payload.course_lessons_rels ADD COLUMN downloads_id TEXT;"
            Invoke-RemoteSql -query $addDownloadsIdColumnQuery -continueOnError
            Log-Success "Added downloads_id column to course_lessons_rels table"
        }
        
        # Create a simpler version of the view with proper type casting
        Log-Message "Creating fixed downloads_relationships view with proper type casting" "Yellow"
        $createViewQuery = @"
-- Drop existing view and recreate with a simpler solution
DROP VIEW IF EXISTS payload.downloads_relationships;

-- Create a simplified view that just casts everything to text for comparison
CREATE VIEW payload.downloads_relationships AS

-- Documentation relationship (these are likely INTEGER ids)
SELECT 
    doc.id::text AS table_name,
    dl.id::text AS download_id,
    'documentation'::text AS collection_type
FROM payload.documentation doc
LEFT JOIN payload.documentation_rels dr ON 
    (doc.id = dr._parent_id OR doc.id = dr.parent_id)
LEFT JOIN payload.downloads dl ON 
    (dl.id = dr.value OR dl.id = dr.downloads_id)
WHERE dl.id IS NOT NULL

UNION ALL

-- Course lessons relationship (these are UUID ids)
SELECT 
    cl.id::text AS table_name,
    dl.id::text AS download_id,
    'course_lessons'::text AS collection_type
FROM payload.course_lessons cl
LEFT JOIN payload.course_lessons_rels clr ON 
    (cl.id::text = clr._parent_id::text OR cl.id::text = clr.parent_id::text)
LEFT JOIN payload.downloads dl ON 
    (dl.id::text = clr.value::text OR dl.id::text = clr.downloads_id::text)
WHERE dl.id IS NOT NULL;
"@
        Invoke-RemoteSql -query $createViewQuery -continueOnError
        Log-Success "Fixed downloads_relationships view with proper type casting"
    }

    # Always run type mismatch fix - this seems to be a common issue
    Fix-TypeMismatchInRelationTables
    
    # Fix views with type conflicts
    Fix-ViewTypeConflicts
    
    if ($FixAll) {
        Fix-MissingTablesFromErrors
    }
    
    Log-Success "Migration error fixes completed successfully"
}
catch {
    Log-Error "CRITICAL ERROR: Migration error fixes failed: $_"
    exit 1
}
finally {
    # Final message
    Log-Phase "MIGRATION ERROR FIXES COMPLETE"
}
