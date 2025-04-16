# Initialize Payload Schema Script
# This script creates the payload schema and required tables in the remote database

# Import utility modules
. "$PSScriptRoot\utils\logging.ps1"
. "$PSScriptRoot\utils\database.ps1"

# Set error action to stop on errors
$ErrorActionPreference = "Stop"

function Initialize-PayloadSchema {
    try {
        Log-Phase "INITIALIZING PAYLOAD SCHEMA"
        
        # Verify we can connect to the remote project
        $remoteConnectionOk = Test-RemoteDatabaseConnection -name "remote database for schema initialization"
        
        if (-not $remoteConnectionOk) {
            throw "Cannot connect to remote database. Please check connection settings."
        }
        
        # Check if payload schema already exists
        Log-Step "Checking if payload schema exists in remote database"
        $schemaQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'payload');"
        $hasSchema = Invoke-RemoteSql -query $schemaQuery -captureOutput -continueOnError
        
        if ($hasSchema -match "t") {
            Log-Success "Payload schema already exists in remote database"
            return $true
        }
        
        # Load the schema creation SQL
        Log-Step "Loading schema creation SQL"
        $schemaFile = Join-Path -Path $PSScriptRoot -ChildPath "create-payload-schema-fixed.sql"
        
        if (-not (Test-Path -Path $schemaFile)) {
            throw "Schema creation file not found: $schemaFile"
        }
        
        $schemaSql = Get-Content -Path $schemaFile -Raw
        
        # Execute schema creation SQL via --linked connection
        Log-Step "Creating payload schema and basic tables"
        Invoke-RemoteSql -query $schemaSql
        
        # Verify schema was created
        Log-Step "Verifying schema creation"
        $schemaQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'payload');"
        $hasSchema = Invoke-RemoteSql -query $schemaQuery -captureOutput -continueOnError
        
        if ($hasSchema -match "t") {
            Log-Success "Successfully created payload schema in remote database"
            
            # Verify UUID tracking table was created
            Log-Step "Verifying UUID tracking table"
            $tableQuery = "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'payload' AND table_name = 'dynamic_uuid_tables');"
            $hasTable = Invoke-RemoteSql -query $tableQuery -captureOutput -continueOnError
            
            if ($hasTable -match "t") {
                Log-Success "Successfully created UUID tracking table"
            } else {
                Log-Warning "UUID tracking table was not created properly"
            }
            
            return $true
        } else {
            Log-Error "Failed to create payload schema"
            return $false
        }
    }
    catch {
        Log-Error "Error initializing payload schema: $($_.Exception.Message)"
        return $false
    }
}

# Run the initialization
$result = Initialize-PayloadSchema

# Return exit code (0 for success, 1 for failure)
exit [int](-not $result)
