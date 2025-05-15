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
                $key = $parts[0].Trim().Replace(':', '_') # Sanitize key: replace colons with underscores
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
        pnpm payload migrate
        if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Stage 1: Apply Payload Migrations failed." }
        Pop-Location
        Write-Host "Stage 1 completed."
    } else {
        Write-Host "Skipping Stage 1: Apply Payload Migrations."
    }

    # Generate Payload types after migration
    Write-Host "Generating Payload types after migration..."
    $payloadAppPath = Join-Path $ScriptRoot "apps/payload"
    Push-Location $payloadAppPath
    pnpm payload generate:types
    if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Payload generate:types failed post-migration." }
    Pop-Location
    Write-Host "Payload types generated successfully."

    # Stage 2: Core Content Seeding
if (-not $SkipSeedCore.IsPresent) {
    Write-Host "Executing Stage 2: Seed Core Content (Orchestrated)..."
    
    # Timestamp for log files
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $logDir = Join-Path $ScriptRoot "z.migration-logs"
    if (-not (Test-Path $logDir)) {
        New-Item -Path $logDir -ItemType Directory | Out-Null
    }
    $stage2StdOutLog = Join-Path $logDir "stage2-stdout-$timestamp.log"
    $stage2StdErrLog = Join-Path $logDir "stage2-stderr-$timestamp.log"

    Write-Host "Current working directory before Stage 2 pnpm: $(Get-Location)"
    
    # --- Stage 2a: Build ---
    Write-Host "Attempting to run Stage 2a: Build..."
    $stage2BuildStdOutLog = Join-Path $logDir "stage2-build-stdout-$timestamp.log"
    $stage2BuildStdErrLog = Join-Path $logDir "stage2-build-stderr-$timestamp.log"

    # Step 1: Run clean:stage2 and explicitly delete the built file
    Write-Host "Running pnpm run clean:stage2 and explicitly deleting built file..."
    pnpm --filter @slideheroes/payload-local-init run clean:stage2 1>> $stage2BuildStdOutLog 2>> $stage2BuildStdErrLog # Append to logs
    $exitCodeClean = $LASTEXITCODE
    
    $builtFilePath = Join-Path (Join-Path $ScriptRoot "packages/payload-local-init") "dist/run-stage-2.js"
    if (Test-Path $builtFilePath) {
        Write-Host "Explicitly deleting existing built file: ${builtFilePath}"
        Remove-Item $builtFilePath -Force -ErrorAction SilentlyContinue
    }

    if ($exitCodeClean -ne 0) {
        Write-Error "Stage 2a: clean:stage2 script failed with exit code $exitCodeClean."
        throw "Stage 2a: clean:stage2 script failed."
    }
    Write-Host "clean:stage2 script completed and built file deleted (if existed)."

    # Step 2: Run esbuild via cmd /c, allowing its output directly to console
    $payloadLocalInitPackagePath = Join-Path $ScriptRoot "packages/payload-local-init"
    Push-Location $payloadLocalInitPackagePath
    Write-Host "Changed directory to $payloadLocalInitPackagePath"
    Write-Host "Executing esbuild bundle command via cmd /c (output to console)..."
    
    # Add a timestamp to the esbuild arguments to prevent caching issues
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $esbuildArgs = "./stage-2-seed-core/run-stage-2.ts --bundle --outfile=dist/run-stage-2.js --platform=node --format=esm --external:payload --external:@payloadcms/db-postgres --external:pg --define:__TIMESTAMP__=$timestamp"
    # Note: Using the .cmd shim for esbuild.
    $esbuildCommand = ".\node_modules\.bin\esbuild.cmd $esbuildArgs"
    
    Write-Host "Running command: cmd /c ""$esbuildCommand"""
    cmd /c "$esbuildCommand" # Output from esbuild will go to console, not to $stage2BuildStdOutLog/$stage2BuildStdErrLog
    $exitCodeBuild = $LASTEXITCODE
    
    Pop-Location
    Write-Host "Returned to original directory."

    # Note: $stage2BuildStdOutLog and $stage2BuildStdErrLog will only contain output from clean:stage2 for this build step.
    # esbuild output went to console.
    if ($exitCodeBuild -ne 0) {
        Write-Error "Stage 2a: esbuild bundle command (via cmd /c) failed with exit code $exitCodeBuild. Check console for esbuild errors."
        Write-Error "Build Stdout log (from clean:stage2 only) is ${stage2BuildStdOutLog}:"
        Get-Content $stage2BuildStdOutLog -ErrorAction SilentlyContinue | Write-Error
        Write-Error "Build Stderr log (from clean:stage2 only) is ${stage2BuildStdErrLog}:"
        Get-Content $stage2BuildStdErrLog -ErrorAction SilentlyContinue | Write-Error
        throw "Stage 2a: Build (esbuild) failed."
    }
    Write-Host "Stage 2a: Build (esbuild via cmd /c) completed with exit code $exitCodeBuild. Check console for esbuild output. Logs in ${stage2BuildStdOutLog} and ${stage2BuildStdErrLog} are for clean:stage2 part only."
    
    # --- Stage 2b: Run Built Script ---
    $env:DISABLE_NESTED_DOCS_PLUGIN = 'true'
    # Set PAYLOAD_CONFIG_PATH for the script
    $env:PAYLOAD_CONFIG_PATH = "apps/payload/src/payload.config.ts"
    Write-Host "Attempting to run Stage 2b: Run Built Script (stage2:run-built). Stdout will be in $stage2StdOutLog, Stderr in $stage2StdErrLog"

    pnpm --filter @slideheroes/payload-local-init run stage2:run-built 1> $stage2StdOutLog 2> $stage2StdErrLog
    $exitCodeRun = $LASTEXITCODE

    $env:DISABLE_NESTED_DOCS_PLUGIN = $null # Reset env var
    # Unset PAYLOAD_CONFIG_PATH
    Remove-Item Env:PAYLOAD_CONFIG_PATH -ErrorAction SilentlyContinue

    if ($exitCodeRun -ne 0) {
        Write-Error "Stage 2b: Run Built Script (stage2:run-built) failed with exit code $exitCodeRun."
        Write-Error "Run Stdout content from ${stage2StdOutLog}:"
        Get-Content $stage2StdOutLog -ErrorAction SilentlyContinue | Write-Error
        Write-Error "Run Stderr content from ${stage2StdErrLog}:"
        Get-Content $stage2StdErrLog -ErrorAction SilentlyContinue | Write-Error
        throw "Stage 2b: Run Built Script (stage2:run-built) failed."
    }

    Write-Host "Stage 2b: Run Built Script (stage2:run-built) completed with exit code $exitCodeRun."
    Write-Host "Full Run Stdout logged to: ${stage2StdOutLog}"
    Write-Host "Full Run Stderr logged to: ${stage2StdErrLog}"

    # --- JSON Extraction and Validation from $stage2StdOutLog (output of stage2:run-built) ---
    $jsonOutputObject = $null # Initialize before try block
    $rawStdOutContent = Get-Content -LiteralPath $stage2StdOutLog -Raw -ErrorAction SilentlyContinue # Corrected variable name
    
    if (-not $rawStdOutContent) {
        Write-Error "Stage 2 stdout log (${stage2StdOutLog}) is empty or could not be read."
        throw "Failed to get any output from Stage 2 for JSON map."
    }

    try {
        # Attempt to find the JSON block. Assuming it's the last significant JSON structure.
        # This might need refinement if there's other JSON-like logging.
        $jsonLines = $rawStdOutContent.Split([Environment]::NewLine) | Where-Object { $_.Trim().StartsWith('{') -and $_.Trim().EndsWith('}') }
        $jsonOutputString = $jsonLines | Select-Object -Last 1

        if (-not $jsonOutputString) {
            Write-Error "Could not find valid JSON output line in Stage 2 stdout log (${stage2StdOutLog})."
            Write-Error "Stage 2 Full Stdout was:"
            Write-Error $rawStdOutContent
            throw "Failed to extract JSON map from Stage 2 output."
        }
        $jsonOutputObject = $jsonOutputString | ConvertFrom-Json -ErrorAction Stop
        Write-Host "Successfully extracted and validated JSON map from Stage 2 stdout for Stage 3 input."
    } catch {
        Write-Error "Failed to parse Stage 2 output as JSON. Extracted line was: '${jsonOutputString}' (see ${stage2StdOutLog})."
        Write-Error "Stage 2 Full Stdout was:"
        Write-Error $rawStdOutContent
        throw "Invalid JSON map received from Stage 2 for Stage 3 input."
    }

    # --- Proceed to Stage 3 (using environment variable as before) ---
    Write-Host "Pausing for 5 seconds before starting Stage 3..."
    Start-Sleep -Seconds 5

    if (-not $SkipPopulateRelationships.IsPresent) {
        Write-Host "Executing Stage 3: Populate Relationships..."
        Write-Host "Running run-stage-3.ts (via pnpm run) and passing Stage 2 JSON map via environment variable..."
        
        $jsonForEnvVar = $jsonOutputObject | ConvertTo-Json -Depth 10 -Compress
        $env:SSOT_QUESTION_ID_MAP = $jsonForEnvVar
        
        # Capture Stage 3 output similarly if needed, or let it print to console
        $stage3Output = & pnpm --filter @slideheroes/payload-local-init run stage3:populate-relationships *>&1 | Out-String
        $exitCodeStage3 = $LASTEXITCODE
        Remove-Item Env:SSOT_QUESTION_ID_MAP -ErrorAction SilentlyContinue
        
        if ($exitCodeStage3 -ne 0) {
            Write-Error "Stage 3: run-stage-3.ts failed with exit code $exitCodeStage3."
            Write-Error "Stage 3 Output:"
            Write-Error $stage3Output
            throw "Stage 3: run-stage-3.ts failed."
        }
        Write-Host "Stage 3 completed successfully (Exit Code: $exitCodeStage3)."
        # Write-Host "Stage 3 Output: $stage3Output" # Uncomment to see output
    } else {
        Write-Host "Skipping Stage 3: Populate Relationships."
    }
} else {
    Write-Host "Skipping Stage 2: Seed Core Content."
    if (-not $SkipPopulateRelationships.IsPresent) {
         Write-Warning "Stage 2 was skipped, but Stage 3 requires data from Stage 2. Stage 3 will likely fail."
    }
}


    # Stage 4: Verification
    if (-not $SkipVerification.IsPresent) {
        Write-Host "Executing Stage 4: Verification..."
        $stage4Path = Join-Path $PayloadLocalInitPath "stage-4-verification"
        Write-Host "Running verify-document-counts.ts..."
        pnpm --filter @slideheroes/payload-local-init run verify:counts
        if ($LASTEXITCODE -ne 0) { throw "Stage 4: verify-document-counts.ts failed." }
        Write-Host "Running verify-relationships.ts..."
        pnpm --filter @slideheroes/payload-local-init run verify:relationships
        if ($LASTEXITCODE -ne 0) { throw "Stage 4: verify-relationships.ts failed." }
        Write-Host "Running verify-related-item-counts.ts..."
        pnpm --filter @slideheroes/payload-local-init run verify:related-item-counts
        if ($LASTEXITCODE -ne 0) { throw "Stage 4: verify-related-item-counts.ts failed." }
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
