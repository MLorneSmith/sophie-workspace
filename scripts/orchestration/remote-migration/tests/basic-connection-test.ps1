# Basic Connection Test for Supabase Remote Migration
# This script verifies we can connect to the remote database
# and that essential environment variables are set correctly

# Import utility modules
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\database.ps1"

# Configure error handling
$ErrorActionPreference = "Stop"

function Test-BasicConnection {
    try {
        # Show banner
        Write-Host "SUPABASE REMOTE CONNECTION TEST"

        # Check environment variables
        Write-Host "Checking environment variables"
        
        $missingVars = @()
        
        if (-not $env:DATABASE_URL) {
            $missingVars += "DATABASE_URL"
        }
        
        if (-not $env:REMOTE_DATABASE_URL) {
            $missingVars += "REMOTE_DATABASE_URL"
        }
        
        if ($missingVars.Count -gt 0) {
            Write-Host "The following required environment variables are missing:"
            $missingVars | ForEach-Object { Write-Host "  - $_" }
            throw "Missing required environment variables."
        }
        
        Write-Host "All required environment variables are set"
        
        # Display connection strings (masked for security)
        $localDbUrl = $env:DATABASE_URL
        $remoteDbUrl = $env:REMOTE_DATABASE_URL
        
        Write-Host "Local database URL: $($localDbUrl -replace '(postgres(ql)?:\/\/[^:]+:)[^@]+(@.+)', '$1********$3')"
        Write-Host "Remote database URL: $($remoteDbUrl -replace '(postgres(ql)?:\/\/[^:]+:)[^@]+(@.+)', '$1********$3')"

        # Extract project ID from the remote URL and verify project link
        if ($remoteDbUrl -match "postgres://postgres\.([a-zA-Z0-9]+):") {
            $projectId = $matches[1]
            Write-Host "Extracted project ID: $projectId"
            
            # Ensure we're using a valid project ID (must be a hexadecimal string)
            if ($projectId -match "^[a-z0-9]{20}$") {
                Write-Host "Project ID appears to be in the correct format"
                
                # Ensure we're linked to the correct project
                Write-Host "Linking to project $projectId"
                $linkOutput = Exec-Command -command "supabase link --project-ref $projectId" -description "Linking to remote project" -captureOutput -continueOnError
                Write-Host "Link output: $linkOutput"
            } else {
                Write-Host "Warning: Project ID '$projectId' does not appear to be in the correct format (should be 20 hex characters)"
                Write-Host "Attempting to find the correct project ID from projects list..."
                
                $projectsOutput = Exec-Command -command "supabase projects list" -description "Getting projects list" -captureOutput -continueOnError
                $projectLines = $projectsOutput -split "`n" | Where-Object { $_ -match "2025slideheroes" }
                
                if ($projectLines.Count -gt 0) {
                    foreach ($line in $projectLines) {
                        if ($line -match "\|\s+([a-z0-9]{20})\s+\|\s+2025slideheroes\s+\|") {
                            $projectId = $matches[1]
                            Write-Host "Found project ID for 2025slideheroes: $projectId"
                            
                            # Try linking with this ID
                            Write-Host "Linking to project $projectId"
                            $linkOutput = Exec-Command -command "supabase link --project-ref $projectId" -description "Linking to remote project" -captureOutput -continueOnError
                            Write-Host "Link output: $linkOutput"
                            break
                        }
                    }
                } else {
                    Write-Host "Warning: Could not find 2025slideheroes project in projects list"
                }
            }
        } else {
            Write-Host "Warning: Could not extract project ID from remote URL: $remoteDbUrl"
        }

        # Test connection to remote database
        Write-Host "Testing connection to remote database"
        $remoteConnectionOk = Test-RemoteDatabaseConnection -name "remote database"
        
        if (-not $remoteConnectionOk) {
            throw "Failed to connect to remote database."
        }

        # If remote connection is good, verify remote schema
        if ($remoteConnectionOk) {
            Write-Host "Verifying remote schema..."
            
            # Check for payload schema in remote
            $schemaQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'payload');"
            $hasSchema = Invoke-RemoteSql -query $schemaQuery -captureOutput -continueOnError
            
            if ($hasSchema -match "t") {
                Write-Host "Remote database has 'payload' schema"
                
                # Count tables in payload schema
                $tableCountQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'payload';"
                $tableCount = Invoke-RemoteSql -query $tableCountQuery -captureOutput -continueOnError
                
                Write-Host "Remote database has $tableCount tables in 'payload' schema"
                
                if ($tableCount -eq "0") {
                    Write-Host "Warning: Remote database has no tables in 'payload' schema. Schema migration may be required."
                } else {
                    # List all tables in payload schema
                    $tablesQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload' ORDER BY table_name;"
                    $tables = Invoke-RemoteSql -query $tablesQuery -captureOutput -continueOnError
                    $tablesList = $tables -split "\n" | Where-Object { $_ -match '\S' } | ForEach-Object { $_.Trim() }
                    
                    Write-Host "Tables in payload schema:"
                    foreach ($table in $tablesList) {
                        Write-Host "  - $table"
                    }
                    
                    # Check if posts table has data
                    if ($tablesList -contains "posts") {
                        $postsCountQuery = "SELECT COUNT(*) FROM payload.posts;"
                        $postsCount = Invoke-RemoteSql -query $postsCountQuery -captureOutput -continueOnError
                        
                        if ($postsCount -match "^\d+$") {
                            Write-Host "Remote database has $postsCount records in posts table"
                        } else {
                            Write-Host "Could not get posts count or posts table doesn't exist"
                        }
                    } else {
                        Write-Host "The 'posts' table does not exist in the payload schema"
                    }
                }
            } else {
                Write-Host "Warning: Remote database does not have 'payload' schema. Schema migration is required."
            }
        }

        # Final result
        Write-Host "CONNECTION TEST COMPLETE"
        Write-Host "Remote database connection test passed successfully!"
        
        return $true
    }
    catch {
        Write-Host "CONNECTION TEST FAILED: $($_.Exception.Message)"
        return $false
    }
}

# Run the test
$testResult = Test-BasicConnection

# Return exit code based on test result
exit [int](-not $testResult)
