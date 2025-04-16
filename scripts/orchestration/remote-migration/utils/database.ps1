# Database Utility Functions
# This module provides common database operations for the migration process

# Import logging utilities
. "$PSScriptRoot\logging.ps1"

# Check if local Supabase is running
function Is-SupabaseRunning {
    $status = Exec-Command -command "supabase status" -description "Checking Supabase status" -captureOutput -continueOnError
    return -not ($status -match "No such container" -or $status -match "failed" -or $LASTEXITCODE -ne 0)
}

# Execute a SQL command against the remote database (using direct connection)
function Invoke-RemoteSql {
    param (
        [string]$query,
        [switch]$captureOutput,
        [switch]$continueOnError
    )

    try {
        # Use the remote database URL for direct connection
        if (-not $env:REMOTE_DATABASE_URL) {
            throw "REMOTE_DATABASE_URL environment variable is not set"
        }
        
        $dbUrl = $env:REMOTE_DATABASE_URL
        
        # For remote, we use 'supabase db execute --db-url='
        $params = @{
            command = "supabase db execute --db-url=`"$dbUrl`" -c `"$query`""
            description = "Executing SQL on remote database"
        }

        if ($captureOutput.IsPresent) {
            $params["captureOutput"] = $true
        }

        if ($continueOnError.IsPresent) {
            $params["continueOnError"] = $true
        }

        $result = Exec-Command @params
        return $result
    }
    catch {
        if (-not $continueOnError.IsPresent) {
            throw $_
        }
        Write-Host "SQL Error on remote: $($_.Exception.Message)"
        return $null
    }
}

# Check database connection (local)
function Test-LocalDatabaseConnection {
    param (
        [string]$name = "local database"
    )
    
    try {
        # Check if Supabase is running
        $isRunning = Is-SupabaseRunning
        if (-not $isRunning) {
            Write-Host "Local Supabase is not running. Attempting to start it..."
            Exec-Command -command "supabase start" -description "Starting Supabase" -continueOnError
            
            # Check again after attempting to start
            $isRunning = Is-SupabaseRunning
            if (-not $isRunning) {
                Write-Host "Failed to start local Supabase. Please run 'supabase start' manually and try again."
                return $false
            }
        }
        
        # If we got here, Supabase is running
        Write-Host "Local Supabase is running."
        return $true
    }
    catch {
        Write-Host "Connection to $name failed: $($_.Exception.Message)"
        return $false
    }
}

# Check database connection (remote)
function Test-RemoteDatabaseConnection {
    param (
        [string]$name = "remote database"
    )
    
    try {
        # First check if we can list projects
        Write-Host "Checking Supabase projects..."
        $projectsOutput = Exec-Command -command "supabase projects list" -description "Listing projects" -captureOutput -continueOnError
        
        # Try to find the project reference ID
        $projectId = $null
        $projectName = "2025slideheroes"
        
        # Find the project reference ID (not the name) from the projects list
        Write-Host "Searching for project ID for '$projectName'..."
        $projectLines = $projectsOutput -split "`n" | Where-Object { $_ -match $projectName }
        
        if ($projectLines.Count -gt 0) {
            foreach ($line in $projectLines) {
                if ($line -match "\|\s+([a-z0-9]{20})\s+\|\s+$projectName\s+\|") {
                    $projectId = $matches[1]
                    Write-Host "Found project reference ID for $projectName`: $projectId"
                    
                    # Update environment variable with correct reference ID
                    $oldUrl = $env:REMOTE_DATABASE_URL
                    if ($oldUrl -match "postgres://postgres\.([a-zA-Z0-9]+):") {
                        $urlProjectId = $matches[1]
                        if ($urlProjectId -ne $projectId) {
                            Write-Host "Updating connection string with correct project ID..."
                            $env:REMOTE_DATABASE_URL = $oldUrl -replace "postgres://postgres\.$urlProjectId`:", "postgres://postgres\.$projectId`:"
                            Write-Host "Updated connection string to: $($env:REMOTE_DATABASE_URL -replace '(postgres(ql)?:\/\/[^:]+:)[^@]+(@.+)', '$1********$3')"
                        }
                    }
                    break
                }
            }
        }
        
        # If we couldn't find the project in the list, try extracting from URL as fallback
        if (-not $projectId -and $env:REMOTE_DATABASE_URL -match "postgres://postgres\.([a-zA-Z0-9]+):") {
            $projectId = $matches[1]
            Write-Host "Extracted project ID from URL (fallback): $projectId"
        }
        
        if (-not $projectId) {
            Write-Host "Cannot determine project ID from either projects list or connection URL"
            return $false
        }
        
        # Link to the project using the reference ID
        Write-Host "Linking to project $projectId..."
        $linkOutput = Exec-Command -command "supabase link --project-ref $projectId" -description "Linking to project" -captureOutput -continueOnError
        
        if ($linkOutput -match "Error" -or $linkOutput -match "Failed") {
            Write-Host "Failed to link to project: $linkOutput"
        } else {
            Write-Host "Successfully linked to project $projectId"
        }
        
        # Test direct connection using psql-style URL
        Write-Host "Testing remote database connection..."
        
        # Try direct connection if possible
        try {
            $query = "SELECT 1 AS connection_test;"
            $result = Invoke-RemoteSql -query $query -captureOutput -continueOnError
            
            if ($result -match "1") {
                Write-Host "Connection to $name successful"
                return $true
            } else {
                Write-Host "Connection attempt returned: $result"
                Write-Host "Connection to $name failed with unexpected result"
            }
        } catch {
            Write-Host "Direct connection failed: $($_.Exception.Message)"
        }
        
        # Double-check project link status
        $linkCheckOutput = Exec-Command -command "supabase projects list" -description "Rechecking project link" -captureOutput -continueOnError
        
        if ($linkCheckOutput -match "●.*$projectId") {
            Write-Host "Project is properly linked. Connection issue may be with permissions or network."
        } else {
            Write-Host "Project is not properly linked. Trying to link again..."
            Exec-Command -command "supabase link --project-ref $projectId" -description "Re-linking to project" -continueOnError
        }
        
        # Final attempt
        $query = "SELECT 1 AS connection_test;"
        $result = Invoke-RemoteSql -query $query -captureOutput -continueOnError
        
        if ($result -match "1") {
            Write-Host "Connection to $name successful after re-linking"
            return $true
        } else {
            Write-Host "Final connection attempt failed"
            return $false
        }
    }
    catch {
        Write-Host "Connection to $name failed: $($_.Exception.Message)"
        return $false
    }
}

# Get all tables in a schema from remote database
function Get-RemoteSchemaTables {
    param (
        [string]$schema = "payload"
    )

    $query = "SELECT table_name FROM information_schema.tables WHERE table_schema = '$schema' AND table_type = 'BASE TABLE' ORDER BY table_name;"
    $result = Invoke-RemoteSql -query $query -captureOutput -continueOnError
    return $result -split "`n" | Where-Object { $_ -match '\S' } | ForEach-Object { $_.Trim() }
}

# Compare schema tables between local and remote
function Compare-SchemaTables {
    param (
        [string]$schema = "payload"
    )
    
    $localTables = @()
    try {
        $localTablesCmd = Exec-Command -command "supabase db execute -c `"SELECT table_name FROM information_schema.tables WHERE table_schema = '$schema' AND table_type = 'BASE TABLE' ORDER BY table_name;`"" -captureOutput -continueOnError
        $localTables = $localTablesCmd -split "`n" | Where-Object { $_ -match '\S' } | ForEach-Object { $_.Trim() }
    } catch {
        Write-Host "Could not get local tables: $_"
    }
    
    $remoteTables = Get-RemoteSchemaTables -schema $schema
    
    $missingInRemote = $localTables | Where-Object { $remoteTables -notcontains $_ }
    $extraInRemote = $remoteTables | Where-Object { $localTables -notcontains $_ }
    
    return @{
        LocalTables = $localTables
        RemoteTables = $remoteTables
        MissingInRemote = $missingInRemote
        ExtraInRemote = $extraInRemote
        LocalCount = $localTables.Count
        RemoteCount = $remoteTables.Count
    }
}

# Define content type table groups
function Get-ContentTypeTables {
    param (
        [string]$contentType
    )
    
    $contentTypeTables = @{
        # Core tables
        "core" = @(
            "users",
            "media",
            "payload_preferences",
            "payload_migrations"
        )
        
        # Posts and related tables
        "posts" = @(
            "posts",
            "posts_categories",
            "posts_tags",
            "posts_rels"
        )
        
        # Documentation and related tables
        "documentation" = @(
            "documentation",
            "documentation_categories",
            "documentation_tags",
            "documentation_breadcrumbs",
            "documentation_rels"
        )
        
        # Course content and related tables
        "courses" = @(
            "courses",
            "course_lessons",
            "course_lessons_rels",
            "courses_rels"
        )
        
        # Quiz content and related tables
        "quizzes" = @(
            "course_quizzes",
            "course_quizzes_rels",
            "quiz_questions",
            "quiz_questions_options",
            "quiz_questions_rels"
        )
        
        # Survey content and related tables
        "surveys" = @(
            "surveys",
            "survey_questions",
            "survey_questions_options",
            "surveys_rels",
            "survey_questions_rels"
        )
        
        # Downloads and related tables
        "downloads" = @(
            "downloads",
            "downloads_rels",
            "posts__downloads",
            "course_lessons__downloads",
            "course_quizzes__downloads",
            "courses__downloads",
            "documentation__downloads",
            "surveys__downloads"
        )
    }
    
    if ($contentType -eq "all") {
        $allTables = @()
        foreach ($type in $contentTypeTables.Keys) {
            $allTables += $contentTypeTables[$type]
        }
        return $allTables | Select-Object -Unique
    }
    
    if ($contentTypeTables.ContainsKey($contentType)) {
        return $contentTypeTables[$contentType]
    }
    
    Write-Host "Unknown content type: $contentType"
    return @()
}
