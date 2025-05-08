# packages/payload-local-init/stage-0-reset/reset-payload-schema.ps1
# Script for Stage 0: Database Reset
$ErrorActionPreference = "Stop" # Exit script on any error

Write-Host "Starting Stage 0: Reset Payload Schema..."

# Assume standard PostgreSQL environment variables are set:
# PGHOST, PGPORT, PGUSER, PGDATABASE, PGPASSWORD

try {
    Write-Host "Dropping existing 'payload' schema if it exists..."
    & psql -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -d $env:PGDATABASE -c "DROP SCHEMA IF EXISTS payload CASCADE;"
    if ($LASTEXITCODE -ne 0) { throw "Failed to drop 'payload' schema." }
    Write-Host "Payload schema dropped (if it existed)."

    Write-Host "Creating new 'payload' schema..."
    & psql -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -d $env:PGDATABASE -c "CREATE SCHEMA payload;"
    if ($LASTEXITCODE -ne 0) { throw "Failed to create 'payload' schema." }
    Write-Host "Payload schema created."

    Write-Host "Payload schema reset successfully."
    exit 0 # Indicate success

} catch {
    Write-Error "Error during Payload schema reset: $($_.Exception.Message)"
    Write-Error "Script: $($_.InvocationInfo.ScriptName)"
    Write-Error "Line: $($_.InvocationInfo.ScriptLineNumber)"
    exit 1 # Indicate failure
}
