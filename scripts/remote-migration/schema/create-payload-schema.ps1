# Simple direct PSQL execution script
# This script uses a direct and streamlined approach to create the payload schema

# Import utility modules for logging
. "$PSScriptRoot\..\utils\logging.ps1"

function Create-PayloadSchema-Simple {
    param (
        [string]$dbHost = "aws-0-us-east-2.pooler.supabase.com",
        [string]$dbPort = "5432",
        [string]$dbUser = "postgres.ldebzombxtszzcgnylgq",
        [string]$dbName = "postgres",
        [string]$password = $env:SUPABASE_DB_PASSWORD,
        [string]$sqlFilePath = "$PSScriptRoot\sql\payload-schema.sql"
    )

    # Ensure password is set
    if (-not $password) {
        Log-Error "Database password not provided"
        return $false
    }

    # Set password for PostgreSQL
    $env:PGPASSWORD = $password

    # Check if SQL file exists
    if (-not (Test-Path $sqlFilePath)) {
        Log-Error "SQL file not found at $sqlFilePath"
        return $false
    }

    Log-Phase "DIRECT SCHEMA CREATION WITH SIMPLE PSQL APPROACH"
    Log-Message "Host: $dbHost, Database: $dbName" "Cyan"
    Log-Message "Using SQL file: $sqlFilePath" "Cyan"

    # Execute using psql
    try {
        Log-Step "Executing psql command directly"
        $command = "psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f `"$sqlFilePath`" -v ON_ERROR_STOP=1"
        
        # Run the command and capture output 
        $output = Invoke-Expression $command 2>&1
        $exitCode = $LASTEXITCODE
        
        # Write output to a temp file for the wrapper script to check
        $output | Out-File -FilePath "$env:TEMP\psql_output.txt" -Force
        
        # Log the output
        foreach ($line in $output) {
            # Log NOTICE messages as informational, not as errors
            if ($line -match "NOTICE:") {
                Log-Message $line "Cyan"
            } else {
                Log-Message $line "Gray"
            }
        }
        
        # Check result
        # Note: We consider it a success either with exit code 0 or when we get NOTICE messages about existing schema
        # and tables, which is normal when running this script multiple times
        if ($exitCode -eq 0 -or ($output -join " " -match "NOTICE.*schema.*already exists")) {
            Log-Success "Schema creation successful! (Schema and/or tables may have already existed)"
            
            # Force success exit code for wrapper script
            $exitCode = 0
            
            # Verify schema exists
            Log-Step "Verifying schema creation"
            $verifyCmd = "psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c `"SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'payload');`" -t"
            $verifyResult = Invoke-Expression $verifyCmd
            
            if ($verifyResult.Trim() -eq "t") {
                Log-Success "Payload schema exists in remote database"
                
                # Verify table exists
                Log-Step "Verifying dynamic_uuid_tables creation"
                $verifyTableCmd = "psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c `"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'payload' AND table_name = 'dynamic_uuid_tables');`" -t"
                $verifyTableResult = Invoke-Expression $verifyTableCmd
                
                if ($verifyTableResult.Trim() -eq "t") {
                    Log-Success "dynamic_uuid_tables exists in remote database"
                    
                    # Check row count
                    Log-Step "Checking dynamic_uuid_tables data"
                    $countCmd = "psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c `"SELECT COUNT(*) FROM payload.dynamic_uuid_tables;`" -t"
                    $countResult = Invoke-Expression $countCmd
                    Log-Success "dynamic_uuid_tables row count: $($countResult.Trim())"
                    
                    return $true
                } else {
                    Log-Error "dynamic_uuid_tables table not found in remote database"
                    return $false
                }
            } else {
                Log-Error "Schema verification failed"
                return $false
            }
        } else {
            Log-Error "Schema creation failed with exit code: $exitCode"
            foreach ($line in $output) {
                Log-Message "    $line" "Red"
            }
            return $false
        }
    }
    catch {
        # Check if this is just a NOTICE message about schema already existing
        if ($_.Exception.Message -match "NOTICE.*schema.*already exists") {
            Log-Message $_.Exception.Message "Cyan"
            Log-Success "Schema already exists (notice message received)"
            
            # Continue with verification
            $verifyCmd = "psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c `"SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'payload');`" -t"
            $verifyResult = Invoke-Expression $verifyCmd
            
            if ($verifyResult.Trim() -eq "t") {
                Log-Success "Payload schema exists in remote database"
                return $true
            }
        } else {
            Log-Error "Exception occurred: $($_.Exception.Message)"
            return $false
        }
    }
}

# Main execution
Log-Message "=======================================================" "Magenta"
Log-Message "       PAYLOAD SCHEMA SIMPLE DIRECT CREATION           " "Magenta"
Log-Message "=======================================================" "Magenta"
Log-Message "This script creates the payload schema using direct psql execution."
Log-Message "=======================================================" "Magenta"

# Check if psql is available
try {
    $psqlVersion = & psql --version
    Log-Success "PostgreSQL client found: $psqlVersion"
}
catch {
    Log-Error "PostgreSQL client (psql) not found in PATH"
    Log-Warning "Please install PostgreSQL client tools from: https://www.postgresql.org/download/"
    Log-Warning "Make sure to add the bin directory to your PATH environment variable."
    exit 1
}

# Ensure database password is available
if (-not $env:SUPABASE_DB_PASSWORD) {
    Log-Error "SUPABASE_DB_PASSWORD environment variable not set"
    exit 1
}

# Execute schema creation
$result = Create-PayloadSchema-Simple

# Return exit code - ensure 0 for success
if ($result) {
    exit 0
} else {
    exit 1
}
