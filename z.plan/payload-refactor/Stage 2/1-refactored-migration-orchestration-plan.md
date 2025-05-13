# Plan: Refactoring the Migration Orchestration System

**Date:** May 6, 2025

## 1. Overview

This document outlines the plan for rebuilding the main content migration and seeding orchestration script (currently `reset-and-migrate.ps1`) and reorganizing its constituent scripts. The goal is to create a more modular, maintainable, and reliable system for initializing Payload CMS data.

## 2. New Orchestration Script: `Initialize-PayloadData.ps1`

- **New Name:** `Initialize-PayloadData.ps1`
- **Purpose:** This PowerShell script will serve as the primary entry point for the entire data initialization process. It will replace the existing `reset-and-migrate.ps1`.
- **Location:** Root directory of the project (`d:/SlideHeroes/App/repos/2025slideheroes/Initialize-PayloadData.ps1`).
- **Key Responsibilities:**
  - Define parameters for controlling execution (e.g., `-SkipResetSchema`, `-RunStageOnly <StageNumber>`).
  - Set up and manage necessary environment variables for child scripts (e.g., database connection strings, paths to SSOT files, Payload `.env` path).
  - Execute scripts for each stage of the migration/seeding process in the correct sequence.
  - Implement robust error handling: check the exit code of each called script and halt execution if a script fails.
  - Provide clear, contextual logging for each stage and the overall process.

## 3. New Centralized Location for Constituent Scripts

- All new and refactored scripts called by `Initialize-PayloadData.ps1` will be located within the `packages/payload-local-init/` directory.
- This centralizes all components of the new migration and seeding system, improving organization and discoverability.

## 4. Directory Structure within `packages/payload-local-init/`

The `packages/payload-local-init/` directory will be structured by stages, reflecting the modular design of the refactored process:

```
packages/
└── payload-local-init/
    ├── stage-0-reset/
    │   └── reset-payload-schema.ps1       # (Or .js) Script to drop/recreate payload schema
    ├── stage-1-schema-apply/
    │   └── apply-payload-migrations.ps1   # Simple wrapper to run 'pnpm payload migrate'
    ├── stage-2-seed-core/
    │   ├── seed-static-collections.js
    │   ├── seed-media-downloads.js
    │   ├── seed-main-content-collections.js
    │   └── seed-course-structure.js
    ├── stage-3-populate-relationships/
    │   ├── populate-course-relationships.js
    │   ├── populate-content-download-relationships.js
    │   ├── populate-survey-relationships.js
    │   └── populate-documentation-hierarchy.js
    ├── stage-4-verify/
    │   ├── verify-document-counts.js
    │   ├── verify-core-attributes.js
    │   ├── verify-relationships-integrity.js
    │   └── verify-lexical-content.js
    └── utils/
        └── # Shared Node.js or PowerShell utilities (e.g., db-client.js, lexical-transformer.js)
            # To be populated with known-good, robust utilities if any are identified for reuse.
```

## 5. Script Creation and Migration Strategy

- **`Initialize-PayloadData.ps1` (New PowerShell Script):**

  - Will be created from scratch.
  - Will manage the execution flow, parameters, and error handling.

- **Stage 0: `reset-payload-schema.ps1` (New PowerShell Script):**

  - Focused script using `psql` to drop and recreate the `payload` schema.

- **Stage 1: `apply-payload-migrations.ps1` (New PowerShell Script):**

  - Simple wrapper to navigate to `apps/payload` and execute `pnpm payload migrate --env-file=<path_to_env>`.
  - Will check for successful execution.

- **Stage 2, 3, and 4 (New Node.js Scripts):**
  - All `.js` scripts listed under `stage-2-seed-core/`, `stage-3-populate-relationships/`, and `stage-4-verify/` will be **newly created Node.js scripts**.
  - Functionality will be based on the detailed script plan previously discussed, emphasizing:
    - Reading data directly from SSOT files (located in `packages/content-migrations/src/data/`).
    - Using appropriate methods for data insertion:
      - Generated SQL + `psql` for bulk, simple data (Stage 2).
      - Payload Local API (`payload.create`) for content requiring transformations or hook execution (Stage 2).
      - Payload Local API (`payload.update`) **exclusively** for establishing relationships (Stage 3).
    - Independent verification logic (Stage 4).
  - **Reusing Existing Scripts:** Direct copying of old scripts from `packages/content-migrations/src/scripts/` is generally discouraged for core logic to ensure a clean break from past issues. However, small, well-tested, and demonstrably robust utility functions could be considered for inclusion in `packages/payload-local-init/utils/` after careful review.

## 6. Conceptual Content of `Initialize-PayloadData.ps1`

```powershell
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
        $effectiveEnvPath = if ([System.IO.Path]::IsPathRooted($PayloadEnvPath)) { $PayloadEnvPath } else { Join-Path $ScriptRoot $PayloadEnvPath }
        pnpm payload migrate --env-file="$effectiveEnvPath"
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

        Write-Host "Running seed-static-collections.js..."
        node (Join-Path $stage2Path "seed-static-collections.js")
        if ($LASTEXITCODE -ne 0) { throw "Stage 2: seed-static-collections.js failed." }

        Write-Host "Running seed-media-downloads.js..."
        node (Join-Path $stage2Path "seed-media-downloads.js")
        if ($LASTEXITCODE -ne 0) { throw "Stage 2: seed-media-downloads.js failed." }

        Write-Host "Running seed-main-content-collections.js..."
        node (Join-Path $stage2Path "seed-main-content-collections.js")
        if ($LASTEXITCODE -ne 0) { throw "Stage 2: seed-main-content-collections.js failed." }

        Write-Host "Running seed-course-structure.js..."
        node (Join-Path $stage2Path "seed-course-structure.js")
        if ($LASTEXITCODE -ne 0) { throw "Stage 2: seed-course-structure.js failed." }
        Write-Host "Stage 2 completed."
    } else {
        Write-Host "Skipping Stage 2: Seed Core Content."
    }

    # Stage 3: Relationship Population
    if (-not $SkipPopulateRelationships.IsPresent) {
        Write-Host "Executing Stage 3: Populate Relationships..."
        $stage3Path = Join-Path $PayloadLocalInitPath "stage-3-populate-relationships"
        $effectiveEnvPathForNode = if ([System.IO.Path]::IsPathRooted($PayloadEnvPath)) { $PayloadEnvPath } else { Join-Path $ScriptRoot $PayloadEnvPath }

        Write-Host "Running populate-course-relationships.js..."
        node (Join-Path $stage3Path "populate-course-relationships.js") --env-file="$effectiveEnvPathForNode"
        if ($LASTEXITCODE -ne 0) { throw "Stage 3: populate-course-relationships.js failed." }

        # Add calls for other relationship scripts here, passing --env-file
        # node (Join-Path $stage3Path "populate-content-download-relationships.js") --env-file="$effectiveEnvPathForNode"
        # if ($LASTEXITCODE -ne 0) { throw "Stage 3: populate-content-download-relationships.js failed." }
        # ... etc.
        Write-Host "Stage 3 completed."
    } else {
        Write-Host "Skipping Stage 3: Populate Relationships."
    }

    # Stage 4: Verification
    if (-not $SkipVerification.IsPresent) {
        Write-Host "Executing Stage 4: Verification..."
        $stage4Path = Join-Path $PayloadLocalInitPath "stage-4-verify"

        Write-Host "Running verify-document-counts.js..."
        node (Join-Path $stage4Path "verify-document-counts.js")
        if ($LASTEXITCODE -ne 0) { throw "Stage 4: verify-document-counts.js failed." }

        # Add calls for other verification scripts here
        # node (Join-Path $stage4Path "verify-relationships-integrity.js")
        # if ($LASTEXITCODE -ne 0) { throw "Stage 4: verify-relationships-integrity.js failed." }
        # ... etc.
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
```

This plan establishes a clear, organized, and robust foundation for the new content migration and seeding system.
