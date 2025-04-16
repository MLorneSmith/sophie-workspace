# Direct Schema Creation Script using PSQL
# This script creates the payload schema using direct psql connection

# Import utility modules
. "$PSScriptRoot\utils\logging.ps1"
. "$PSScriptRoot\utils\env-loader.ps1"

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Check if psql is available
function Test-PsqlAvailable {
    try {
        $psqlVersion = & psql --version
        Log-Success "PostgreSQL client found: $psqlVersion"
        return $true
    }
    catch {
        Log-Error "PostgreSQL client (psql) not found in PATH."
        Log-Warning "Please install PostgreSQL client tools from: https://www.postgresql.org/download/"
        Log-Warning "Make sure to add the bin directory to your PATH environment variable."
        Log-Warning "You only need the Command Line Tools, not the full server."
        return $false
    }
}

# Test database connection using direct psql
function Test-PsqlConnection {
    param(
        [string]$connStr
    )
    
    try {
        Log-Step "Testing PostgreSQL connection using psql"
        $command = "psql `"$connStr`" -c `"SELECT 1;`" -t"
        $result = Exec-Command -command $command -description "Testing connection" -captureOutput -continueOnError
        
        if ($LASTEXITCODE -eq 0 -and $result.Trim() -eq "1") {
            Log-Success "Connection successful!"
            return $true
        } else {
            Log-Error "Connection failed: $result"
            return $false
        }
    }
    catch {
        Log-Error "Connection test exception: $($_.Exception.Message)"
        return $false
    }
}

function Create-PayloadSchema-Psql {
    try {
        Log-Phase "DIRECT SCHEMA CREATION WITH PSQL"
        
        # Parse the connection string to get individual components
        if ($env:REMOTE_DATABASE_URL -match "postgres://postgres\.([a-zA-Z0-9]+):([^@]+)@([^:]+):(\d+)\/(.+)") {
            $projectId = $matches[1]
            # Password is taken from environment
            $dbHost = $matches[3]
            $dbPort = $matches[4]
            $dbName = $matches[5]
            
            # Use the SQL file directly without creating a temporary copy
            $schemaFile = Join-Path -Path $PSScriptRoot -ChildPath "create-payload-schema-direct.sql"
            
            if (-not (Test-Path -Path $schemaFile)) {
                throw "Schema creation file not found: $schemaFile"
            }
            
            # Get the SQL content directly
            $sqlContent = Get-Content -Path $schemaFile -Raw
            
            # Log the SQL being executed for debugging
            Log-Message "SQL to execute:" "Cyan"
            Log-Message $sqlContent "Gray"
            
            # Set password environment variable for psql
            $env:PGPASSWORD = $env:SUPABASE_DB_PASSWORD
            
            # Execute the SQL file using psql directly
            Log-Step "Executing schema creation with PSQL"
            
            # Build the psql connection string
            $psqlConnStr = "postgresql://postgres:$env:PGPASSWORD@$dbHost`:$dbPort/$dbName"
            
            # Use psql to execute the SQL directly
            $command = "psql `"$psqlConnStr`" -c `"$sqlContent`" -v ON_ERROR_STOP=1"
            
            $output = Exec-Command -command $command -description "Creating schema with PSQL" -captureOutput -continueOnError
            
            # Check if the schema was created successfully
            if ($LASTEXITCODE -ne 0) {
                Log-Error "Error creating schema: $output"
                
                # Try alternative approach with parameters
                Log-Step "Trying alternative approach with file parameter"
                $command2 = "psql -h $dbHost -p $dbPort -U postgres.$projectId -d $dbName -f `"$schemaFile`" -v ON_ERROR_STOP=1"
                $output2 = Exec-Command -command $command2 -description "Creating schema with PSQL (alternate)" -captureOutput -continueOnError
                
                if ($LASTEXITCODE -ne 0) {
                    Log-Error "Alternative approach also failed: $output2"
                    return $false
                }
            }
            
            # Verify the schema was created
            Log-Step "Verifying schema creation"
            $verifyCommand = "psql `"$psqlConnStr`" -c `"SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'payload');`" -t"
            $verifyOutput = Exec-Command -command $verifyCommand -description "Verifying schema" -captureOutput
            
            if ($verifyOutput -match "t") {
                Log-Success "Payload schema exists in remote database"
                
                # Verify dynamic_uuid_tables table was created
                $verifyTableCommand = "psql `"$psqlConnStr`" -c `"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'payload' AND table_name = 'dynamic_uuid_tables');`" -t"
                $verifyTableOutput = Exec-Command -command $verifyTableCommand -description "Verifying dynamic_uuid_tables table" -captureOutput
                
                if ($verifyTableOutput -match "t") {
                    Log-Success "dynamic_uuid_tables table exists in remote database"
                    
                    # Check if we can query the dynamic_uuid_tables table
                    $queryTableCommand = "psql `"$psqlConnStr`" -c `"SELECT COUNT(*) FROM payload.dynamic_uuid_tables;`" -t"
                    $queryTableOutput = Exec-Command -command $queryTableCommand -description "Querying dynamic_uuid_tables table" -captureOutput -continueOnError
                    
                    if ($LASTEXITCODE -eq 0) {
                        Log-Success "Successfully queried dynamic_uuid_tables table (Count: $($queryTableOutput.Trim()))"
                    } else {
                        Log-Warning "Could not query dynamic_uuid_tables table: $queryTableOutput"
                    }
                    
                    # No temp file to clean up anymore
                    
                    return $true
                } else {
                    Log-Error "dynamic_uuid_tables table creation failed"
                    return $false
                }
            } else {
                Log-Error "Schema creation verification failed"
                return $false
            }
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

# Main execution flow

# Display banner
Log-Message "=======================================================" "Magenta"
Log-Message "          PAYLOAD SCHEMA PSQL DIRECT CREATION          " "Magenta" 
Log-Message "=======================================================" "Magenta"
Log-Message "This script creates the payload schema and initial tables using the PostgreSQL client (psql)."
Log-Message "=======================================================" "Magenta"

# Check for psql availability first
if (-not (Test-PsqlAvailable)) {
    Log-Error "Cannot proceed without PostgreSQL client (psql)"
    exit 1
}

# Ensure PGPASSWORD is set
if (-not $env:PGPASSWORD) {
    if (-not $env:SUPABASE_DB_PASSWORD) {
        Log-Error "PGPASSWORD or SUPABASE_DB_PASSWORD environment variable not set"
        exit 1
    }
    else {
        $env:PGPASSWORD = $env:SUPABASE_DB_PASSWORD
        Log-Warning "PGPASSWORD environment variable set from SUPABASE_DB_PASSWORD"
    }
}
else {
    Log-Success "PGPASSWORD environment variable is set"
}

# Run schema creation
$result = Create-PayloadSchema-Psql

# Return exit code (0 for success, 1 for failure)
exit [int](-not $result)
