# Simple direct PSQL execution script
# This script skips complex file handling and just calls psql directly with the file path

# Set password for PostgreSQL
$env:PGPASSWORD = "UcQ5TYC3Hdh0v5G0"

# Database connection parameters
$dbHost = "aws-0-us-east-2.pooler.supabase.com"
$dbPort = "5432"
$dbUser = "postgres.ldebzombxtszzcgnylgq"
$dbName = "postgres"

# SQL file path
$sqlFile = Join-Path -Path $PSScriptRoot -ChildPath "scripts\orchestration\remote-migration\create-payload-schema-direct.sql"

# Display execution info
Write-Host "Creating payload schema in remote Supabase database" -ForegroundColor Cyan
Write-Host "Host: $dbHost, User: $dbUser, Database: $dbName" -ForegroundColor Cyan
Write-Host "Using SQL file: $sqlFile" -ForegroundColor Cyan

# Check if SQL file exists
if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: SQL file not found at $sqlFile" -ForegroundColor Red
    exit 1
}

# Execute using psql
try {
    Write-Host "Executing psql command..." -ForegroundColor Yellow
    $command = "psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f ""$sqlFile"" -v ON_ERROR_STOP=1"
    Write-Host "Command: $command" -ForegroundColor Gray
    
    Invoke-Expression $command
    
    # Check result
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Schema creation successful!" -ForegroundColor Green
        
        # Verify schema exists
        $verifyCmd = "psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c ""SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'payload');"" -t"
        $verifyResult = Invoke-Expression $verifyCmd
        
        if ($verifyResult.Trim() -eq "t") {
            Write-Host "Verification: payload schema exists!" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "ERROR: Schema verification failed" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "ERROR: Schema creation failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
