# packages/payload-local-init/stage-1-schema-apply/apply-payload-migrations.ps1
param (
    [string]$PayloadEnvPath # Relative or absolute path to Payload's .env file
)

$ErrorActionPreference = "Stop" # Exit script on any error

Write-Host "Starting Stage 1: Apply Payload Migrations..."

$ScriptRoot = $PSScriptRoot # Root of the packages/payload-local-init/stage-1-schema-apply directory
$ProjectRoot = Join-Path $ScriptRoot "../../../" # Navigate up to the project root

$payloadAppPath = Join-Path $ProjectRoot "apps/payload"

try {
    Write-Host "Navigating to Payload app directory: $payloadAppPath"
    Push-Location $payloadAppPath

    Write-Host "Running 'pnpm payload migrate'..."
    # Use the provided PayloadEnvPath, resolving it relative to the project root if necessary
    $effectiveEnvPath = if ([System.IO.Path]::IsPathRooted($PayloadEnvPath)) { $PayloadEnvPath } else { Join-Path $ProjectRoot $PayloadEnvPath }
    Write-Host "Using environment file: $effectiveEnvPath"

    pnpm payload migrate --env-file="$effectiveEnvPath"
    if ($LASTEXITCODE -ne 0) { throw "pnpm payload migrate failed." }

    Pop-Location # Return to the original directory
    Write-Host "Stage 1: Apply Payload Migrations completed successfully."
    exit 0 # Indicate success

} catch {
    Write-Error "Error during Stage 1: Apply Payload Migrations: $($_.Exception.Message)"
    Write-Error "Script: $($_.InvocationInfo.ScriptName)"
    Write-Error "Line: $($_.InvocationInfo.ScriptLineNumber)"
    # Ensure Pop-Location is called even on error if Push-Location succeeded
    if (@(Get-Location -Stack).Count -gt 1) { Pop-Location }
    exit 1 # Indicate failure
}
