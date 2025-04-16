# Direct Schema Creation Script
# This script creates the payload schema using direct psql connection

# Import utility modules
. "$PSScriptRoot\utils\logging.ps1"
. "$PSScriptRoot\utils\env-loader.ps1"

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

function Create-PayloadSchema-Direct {
    try {
        Log-Phase "DIRECT SCHEMA CREATION"
        
        # Parse the connection string to get individual components
        if ($env:REMOTE_DATABASE_URL -match "postgres://postgres\.([a-zA-Z0-9]+):([^@]+)@([^:]+):(\d+)\/(.+)") {
            $projectId = $matches[1]
            # We use $env:SUPABASE_DB_PASSWORD now
            $dbHost = $matches[3]
            $dbPort = $matches[4]
            $dbName = $matches[5]
            
            # Generate a temporary SQL file with the schema creation script
            $tempSqlFile = [System.IO.Path]::GetTempFileName() + ".sql"
            $schemaFile = Join-Path -Path $PSScriptRoot -ChildPath "create-payload-schema-fixed.sql"
            
            if (-not (Test-Path -Path $schemaFile)) {
                throw "Schema creation file not found: $schemaFile"
            }
            
            Copy-Item -Path $schemaFile -Destination $tempSqlFile
            
            # Set password as environment variable for psql
            # Note: PGPASSWORD environment variable should already be set from the main script
            
            # Execute the SQL file using Supabase CLI
            Log-Step "Executing schema creation with Supabase CLI"
            
            # Read the SQL file content
            $sqlContent = Get-Content -Path $tempSqlFile -Raw
            
            # Use the Supabase CLI db execute command
            $command = "supabase db execute --db-url=`"$env:REMOTE_DATABASE_URL`" -c `"$sqlContent`""
            
            $output = Exec-Command -command $command -description "Creating schema with Supabase CLI" -captureOutput
            
            # Check if the schema was created successfully
            if ($output -match "ERROR") {
                Log-Error "Error creating schema: $output"
                return $false
            }
            
            Log-Success "Successfully created payload schema in remote database"
            
            # Clean up temp file
            Remove-Item -Path $tempSqlFile -Force
            
            return $true
        } else {
            Log-Error "Could not parse database connection string: $env:REMOTE_DATABASE_URL"
            return $false
        }
    }
    catch {
        Log-Error "Error creating schema directly: $($_.Exception.Message)"
        return $false
    }
}

# Run schema creation
$result = Create-PayloadSchema-Direct

# Return exit code (0 for success, 1 for failure)
exit [int](-not $result)
