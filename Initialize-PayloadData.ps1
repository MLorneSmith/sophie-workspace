# Initialize-PayloadData.ps1
param (
    [switch]$SkipResetSchema,
    [switch]$SkipSchemaApply,
    [switch]$SkipSeedCore,
    [switch]$SkipPopulateRelationships,
    [switch]$SkipVerification,
    [string]$PayloadEnvPath = ".env" # Relative path from project root to Payload's .env
)

$ErrorActionPreference = "Stop" # Exit script on any error

Write-Host "Starting Payload Data Initialization..."
$ScriptRoot = $PSScriptRoot # Root of the 2025slideheroes project
$PayloadLocalInitPath = Join-Path $ScriptRoot "packages/payload-local-init"

# Parse DATABASE_URI and set PostgreSQL environment variables
$databaseUri = "postgresql://postgres:postgres@localhost:54322/postgres" # Hardcoded for now, should ideally be read from .env
$uri = New-Object System.Uri($databaseUri)
$env:PGHOST = $uri.Host
$env:PGPORT = $uri.Port
$env:PGUSER = $uri.UserInfo.Split(':')[0]
$env:PGPASSWORD = $uri.UserInfo.Split(':')[1]
$env:PGDATABASE = $uri.Segments[-1]

# Load environment variables from the specified Payload .env file
$payloadEnvFilePath = Join-Path $ScriptRoot $PayloadEnvPath
if (Test-Path $payloadEnvFilePath) {
    Write-Host "Loading environment variables from $payloadEnvFilePath..."
    Get-Content $payloadEnvFilePath | ForEach-Object {
        $line = $_.Trim()
        if (-not [string]::IsNullOrEmpty($line) -and -not $line.StartsWith("#")) {
            $parts = $line.Split('=', 2)
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim()
                # Remove surrounding quotes if present
                if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                    $value = $value.Substring(1, $value.Length - 2)
                } elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
                Set-Item Env:\${key} $value
                Write-Host "Set environment variable: $key"
            }
        }
    }
} else {
    Write-Warning "Payload environment file not found at $payloadEnvFilePath. Proceeding without loading Payload specific environment variables."
}

try {
    # Stage 0: Database Reset
    if (-not $SkipResetSchema.IsPresent) {
        Write-Host "Executing Stage 0: Reset Payload Schema..."
        & (Join-Path $PayloadLocalInitPath "stage-0-reset/reset-payload-schema.ps1")
        if ($LASTEXITCODE -ne 0) { throw "Stage 0: Reset Payload Schema failed." }
        Write-Host "Stage 0 completed."
    } else {
        Write-Host "Skipping Stage 0: Reset Payload Schema."
    }

    # Stage 1: Schema Application (Payload Migrations)
    if (-not $SkipSchemaApply.IsPresent) {
        Write-Host "Executing Stage 1: Apply Payload Migrations..."
        $payloadAppPath = Join-Path $ScriptRoot "apps/payload"
        Push-Location $payloadAppPath
        Write-Host "Running 'pnpm payload migrate' in $payloadAppPath..."
        # Assuming Payload .env is in apps/payload or specify via --env-file
        # Adjust --env-file path if $PayloadEnvPath is relative to project root
        # $effectiveEnvPath is no longer needed as env vars are set by the orchestration script
        pnpm payload migrate
        if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Stage 1: Apply Payload Migrations failed." }
        Pop-Location
        Write-Host "Stage 1 completed."
    } else {
        Write-Host "Skipping Stage 1: Apply Payload Migrations."
    }

    # Stage 2: Core Content Seeding
    if (-not $SkipSeedCore.IsPresent) {
        Write-Host "Executing Stage 2: Seed Core Content (Orchestrated)..."

        # Create a simple test script
        $testScriptContent = "console.log('Simple test script executed successfully!'); process.exit(0);"
        $testScriptPath = Join-Path $ScriptRoot "test-script.js"
        $testScriptContent | Out-File $testScriptPath -Encoding UTF8

        Write-Host "Running simple test script using direct execution..."
        # Use direct execution to run the simple test script and capture output
        $testScriptOutput = & node $testScriptPath *>&1 | Out-String
        $exitCodeTest = $LASTEXITCODE

        # Clean up test script
        Remove-Item $testScriptPath -ErrorAction SilentlyContinue

        if ($exitCodeTest -ne 0) {
            Write-Error "Simple test script failed with exit code $exitCodeTest."
            Write-Error "Output:"
            Write-Error $testScriptOutput
            throw "Simple test script execution failed. Investigate Node.js/PowerShell environment."
        }

        Write-Host "Simple test script completed successfully. Output:"
        Write-Host $testScriptOutput

        Write-Host "Running run-stage-2.ts (via pnpm run stage2:seed-all) using direct execution..."

        # Set environment variable to disable nestedDocsPlugin for Stage 2
        $env:DISABLE_NESTED_DOCS_PLUGIN = 'true'

        # Use direct execution to run the Stage 2 script and capture output
        $stage2Output = & pnpm --filter @slideheroes/payload-local-init run stage2:seed-all *>&1 | Out-String
        $exitCode = $LASTEXITCODE

        $env:DISABLE_NESTED_DOCS_PLUGIN = $null # Reset env var

        # --- Error and Warning Handling ---
        # With direct execution, stderr is part of the captured output string.
        # We rely on the script's exit code for fatal errors.
        # Warnings will be present in $stage2Output.

        if ($exitCode -ne 0) {
            Write-Error "Stage 2 failed with exit code $exitCode."
            Write-Error "Output:"
            Write-Error $stage2Output
            throw "Stage 2: Orchestrated core content seeding (run-stage-2.ts) failed."
        }

        Write-Host "Stage 2 completed successfully (Exit Code: $exitCode)."
        Write-Host "Stage 2 Output (including potential warnings):"
        Write-Host $stage2Output # Display full output for debugging

        # --- JSON Extraction and Validation ---
        $jsonOutputObject = $null
        $jsonOutputLine = $null
        try {
            # Extract the JSON output line (assuming it starts with '{' and ends with '}')
            # This filters out pnpm warnings and other script output.
            $jsonOutputLine = $stage2Output.Split([Environment]::NewLine) | Where-Object { $_.Trim().StartsWith('{') -and $_.Trim().EndsWith('}') } | Select-Object -Last 1

            if (-not $jsonOutputLine) {
                Write-Error "Could not find valid JSON output line from Stage 2."
                Write-Error "Stage 2 Full Output was:"
                Write-Error $stage2Output
                throw "Failed to extract JSON map from Stage 2 output."
            }

            $jsonOutputObject = $jsonOutputLine | ConvertFrom-Json -ErrorAction Stop
            Write-Host "Successfully extracted and validated JSON map from Stage 2 output."
        } catch {
            Write-Error "Failed to parse Stage 2 output as JSON. Extracted line was: '$jsonOutputLine'"
            Write-Error "Stage 2 Full Output was:"
            Write-Error $stage2Output
            throw "Invalid JSON map received from Stage 2."
        }

        # Add a delay to allow database operations to settle before Stage 3
        Write-Host "Pausing for 5 seconds before starting Stage 3..."
        Start-Sleep -Seconds 5

        # Stage 3: Relationship Population
        if (-not $SkipPopulateRelationships.IsPresent) {
            Write-Host "Executing Stage 3: Populate Relationships..."
            Write-Host "Running run-stage-3.ts (via pnpm run) and passing Stage 2 JSON map via environment variable..."

            # Convert the parsed PowerShell object back to a JSON string for the environment variable
            $jsonInputString = $jsonOutputObject | ConvertTo-Json -Depth 10 # Use sufficient depth

            # Set the environment variable in the current session
            $env:SSOT_QUESTION_ID_MAP = $jsonInputString
            
            # Execute Stage 3 script directly, it will inherit the environment variable
            & pnpm --filter @slideheroes/payload-local-init run stage3:populate-relationships *>&1 | Out-String
            $exitCodeStage3 = $LASTEXITCODE

            # Unset the environment variable
            Remove-Item Env:SSOT_QUESTION_ID_MAP -ErrorAction SilentlyContinue

            if ($exitCodeStage3 -ne 0) {
                # Note: $stage3Output would contain the combined stdout/stderr if captured
                # For simplicity, just throwing error based on exit code for now.
                # Add output capturing if detailed error messages from Stage 3 are needed here.
                throw "Stage 3: run-stage-3.ts failed with exit code $exitCodeStage3."
            }

            Write-Host "Stage 3 completed successfully (Exit Code: $exitCodeStage3)."

        } else {
            Write-Host "Skipping Stage 3: Populate Relationships."
        }
    } else {
        Write-Host "Skipping Stage 2: Seed Core Content."
        # If Stage 2 is skipped, we don't have the ID map from its output.
        # Stage 3 will likely fail if it relies on this map.
        # We could add logic here to read from a previous run's file if available,
        # but for now, let's assume Stage 2 is required for Stage 3 to work correctly.
        if (-not $SkipPopulateRelationships.IsPresent) {
             Write-Warning "Stage 2 was skipped, but Stage 3 requires data from Stage 2. Stage 3 will likely fail."
             # Optionally, throw an error here if skipping Stage 2 makes Stage 3 impossible
             # throw "Cannot run Stage 3 when Stage 2 is skipped."
        }
    }

    # Stage 4: Verification
    if (-not $SkipVerification.IsPresent) {
        Write-Host "Executing Stage 4: Verification..."
        $stage4Path = Join-Path $PayloadLocalInitPath "stage-4-verification" # Corrected path
        # $payloadAppPath is already defined and Push-Location is not strictly needed if scripts handle paths correctly,
        # but pnpm filter handles workspace context. For consistency with Stage 2, we don't need to Push-Location here.
        # If scripts inside payload-local-init need to resolve paths relative to apps/payload, they should do so internally or be passed the path.
        # However, Stage 3 does Push-Location. Let's keep it for now if scripts assume CWD is apps/payload.
        # $payloadAppPath = Join-Path $ScriptRoot "apps/payload" # Removed Push-Location for Stage 4
        # Push-Location $payloadAppPath


        Write-Host "Running verify-document-counts.ts..."
        pnpm --filter @slideheroes/payload-local-init run verify:counts
        if ($LASTEXITCODE -ne 0) { throw "Stage 4: verify-document-counts.ts failed." }

        # Write-Host "Running verify-ssot-content-presence.ts..."
        # pnpm --filter @slideheroes/payload-local-init run verify:ssot-content-presence # If re-enabled
        # if ($LASTEXITCODE -ne 0) { throw "Stage 4: verify-ssot-content-presence.ts failed." }

        Write-Host "Running verify-relationships.ts..."
        pnpm --filter @slideheroes/payload-local-init run verify:relationships
        if ($LASTEXITCODE -ne 0) { throw "Stage 4: verify-relationships.ts failed." }

        Write-Host "Running verify-related-item-counts.ts..."
        pnpm --filter @slideheroes/payload-local-init run verify:related-item-counts
        if ($LASTEXITCODE -ne 0) { throw "Stage 4: verify-related-item-counts.ts failed." }
        
        # Pop-Location # Removed Pop-Location
        Write-Host "Stage 4 completed."
    } else {
        Write-Host "Skipping Stage 4: Verification."
    }

    Write-Host "Payload Data Initialization completed successfully."

} catch {
    Write-Error "Payload Data Initialization failed at stage: $($_.Exception.Message)"
    Write-Error "Script: $($_.InvocationInfo.ScriptName)"
    Write-Error "Line: $($_.InvocationInfo.ScriptLineNumber)"
    exit 1 # Ensure script exits with a non-zero code on failure
}
