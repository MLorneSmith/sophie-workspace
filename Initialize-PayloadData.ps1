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
        Write-Host "Executing Stage 2: Seed Core Content..."
        $stage2Path = Join-Path $PayloadLocalInitPath "stage-2-seed-core"
        $payloadAppPath = Join-Path $ScriptRoot "apps/payload"

        # Set environment variable to disable nestedDocsPlugin for Stage 2
        $env:DISABLE_NESTED_DOCS_PLUGIN = 'true'

        Write-Host "Running seed-courses.ts..."
        pnpm --filter @slideheroes/payload-local-init run seed:courses
        if ($LASTEXITCODE -ne 0) { throw "Stage 2: seed-courses.ts failed." }

        Write-Host "Running seed-course-lessons.ts..."
        pnpm --filter @slideheroes/payload-local-init run seed:course-lessons
        if ($LASTEXITCODE -ne 0) { throw "Stage 2: seed-course-lessons.ts failed." }

        Write-Host "Running seed-course-quizzes.ts..."
        pnpm --filter @slideheroes/payload-local-init run seed:course-quizzes
        if ($LASTEXITCODE -ne 0) { throw "Stage 2: seed-course-quizzes.ts failed." }

        Write-Host "Running seed-surveys.ts..."
        pnpm --filter @slideheroes/payload-local-init run seed:surveys
        if ($LASTEXITCODE -ne 0) { throw "Stage 2: seed-surveys.ts failed." }

        Write-Host "Running seed-downloads.ts..."
        pnpm --filter @slideheroes/payload-local-init run seed:downloads
        if ($LASTEXITCODE -ne 0) { throw "Stage 2: seed-downloads.ts failed." }

        Write-Host "Running seed-media.ts..."
        pnpm --filter @slideheroes/payload-local-init run seed:media
        if ($LASTEXITCODE -ne 0) { throw "Stage 2: seed-media.ts failed." }

        Write-Host "Running seed-posts.ts..."
        pnpm --filter @slideheroes/payload-local-init run seed:posts
        if ($LASTEXITCODE -ne 0) { throw "Stage 2: seed-posts.ts failed." }

        Write-Host "Running seed-private.ts..."
        pnpm --filter @slideheroes/payload-local-init run seed:private
        if ($LASTEXITCODE -ne 0) { throw "Stage 2: seed-private.ts failed." }

        Write-Host "Running seed-surveys.ts..."
        pnpm --filter @slideheroes/payload-local-init run seed:surveys
        if ($LASTEXITCODE -ne 0) { throw "Stage 2: seed-surveys.ts failed." }

        Write-Host "Running seed-survey-questions.ts..."
        pnpm --filter @slideheroes/payload-local-init run seed:survey-questions
        if ($LASTEXITCODE -ne 0) { throw "Stage 2: seed-survey-questions.ts failed." }

        Write-Host "Running seed-documentation.ts..."
        pnpm --filter @slideheroes/payload-local-init run seed:documentation # Added this line
        if ($LASTEXITCODE -ne 0) { $env:DISABLE_NESTED_DOCS_PLUGIN = $null; throw "Stage 2: seed-documentation.ts failed." } # Added this line

        # Unset environment variable after Stage 2
        $env:DISABLE_NESTED_DOCS_PLUGIN = $null

        Write-Host "Stage 2 completed."
    } else {
        Write-Host "Skipping Stage 2: Seed Core Content."
    }

    # Stage 3: Relationship Population
    if (-not $SkipPopulateRelationships.IsPresent) {
        Write-Host "Executing Stage 3: Populate Relationships..."
        $stage3Path = Join-Path $PayloadLocalInitPath "stage-3-populate-relationships"
        $payloadAppPath = Join-Path $ScriptRoot "apps/payload" # Define payloadAppPath for Stage 3 as well
        # $effectiveEnvPathForNode is no longer needed as env vars are loaded by Payload init

        # Change directory to apps/payload for Stage 3 scripts
        Push-Location $payloadAppPath

        # Revert Stage 3 scripts to original execution for now
        Write-Host "Running populate-course-relationships.mjs..."
        node (Join-Path $stage3Path "populate-course-relationships.mjs")
        if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Stage 3: populate-course-relationships.mjs failed." }

        # Add calls for other relationship scripts here
        # node (Join-Path $stage3Path "populate-content-download-relationships.mjs")
        # if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Stage 3: populate-content-download-relationships.mjs failed." }
        # ... etc.
        Write-Host "Stage 3 completed."
    } else {
        Write-Host "Skipping Stage 3: Populate Relationships."
    }

    # Stage 4: Verification
    if (-not $SkipVerification.IsPresent) {
        Write-Host "Executing Stage 4: Verification..."
        $stage4Path = Join-Path $PayloadLocalInitPath "stage-4-verify"
        $payloadAppPath = Join-Path $ScriptRoot "apps/payload" # Define payloadAppPath for Stage 4 as well
        # $effectiveEnvPathForNode is no longer needed as env vars are loaded by Payload init

        # Change directory to apps/payload for Stage 4 scripts
        Push-Location $payloadAppPath

        # Revert Stage 4 scripts to original execution for now
        Write-Host "Running verify-document-counts.mjs..."
        node (Join-Path $stage4Path "verify-document-counts.mjs")
        if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Stage 4: verify-document-counts.mjs failed." }

        # Add calls for other verification scripts here
        # node (Join-Path $stage4Path "verify-relationships-integrity.mjs")
        # if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Stage 4: verify-relationships-integrity.mjs failed." }
        # ... etc.
        # Return to the original directory
        Pop-Location
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
