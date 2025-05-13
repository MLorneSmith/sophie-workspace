# Initialize-PayloadData.ps1 Script Fix Plan

This document outlines the analysis of the `Initialize-PayloadData.ps1` script and the plan to fix issues related to handling output from the Stage 2 seeding process (`run-stage-2.ts`).

## Problem Summary

The `Initialize-PayloadData.ps1` script currently fails to reliably capture the JSON ID map output from Stage 2 (`run-stage-2.ts`) and pass it to Stage 3 (`run-stage-3.ts`). This is primarily because:

1.  **Output Stream Merging:** The script merges standard output (stdout) and standard error (stderr) from the Stage 2 process, making it difficult to isolate the JSON map (expected on stdout) from warnings or errors (expected on stderr).
2.  **Fragile JSON Extraction:** It attempts to find the _last_ line resembling JSON, which can fail if logs or warnings appear after the JSON output.
3.  **Exit Code Handling:** The script relies on `$LASTEXITCODE`, but `run-stage-2.ts` might have been forcing an exit code of 0, masking internal errors. Warnings printed to stderr might also be misinterpreted as fatal errors by the script's logic.

## Analysis of Current Script (`Initialize-PayloadData.ps1`)

1.  **Error Handling:**

    - `$ErrorActionPreference = "Stop"`: Correctly set.
    - `pnpm ... 2>&1 | Out-String`: Merges stdout and stderr, preventing proper distinction.
    - `if ($LASTEXITCODE -ne 0)`: Potentially unreliable due to Stage 2's exit code behavior.

2.  **JSON Capture:**

    - Relies on finding the last JSON-like line, which is error-prone.
    - `ConvertFrom-Json` validation is correct _if_ the right line is extracted.

3.  **Data Passing:**
    - `$jsonOutput | pnpm ... run stage3:populate-relationships`: Correctly pipes the _string_ to Stage 3's stdin, assuming `$jsonOutput` holds the valid JSON string.

## Plan for Modification

### Step 1: Modify `run-stage-2.ts` (Conceptual - Requires Implementation)

- **Remove `process.exit(0)`:** Delete the forced successful exit from the end of `runAllStage2Seeders`.
- **Ensure Proper Exit on Error:** Verify that the main `try...catch` block calls `process.exit(1)` on actual errors.
- **Output JSON to Stdout Only:** Ensure the final ID map JSON string is printed _only_ via `console.log()` at the end of the `try` block. Use `console.info/warn/error` for other messages.

### Step 2: Modify `Initialize-PayloadData.ps1` (Proposed Changes)

Replace the existing Stage 2 execution block with the following PowerShell code:

```powershell
# Stage 2: Core Content Seeding
if (-not $SkipSeedCore.IsPresent) {
    Write-Host "Executing Stage 2: Seed Core Content (Orchestrated)..."
    $env:DISABLE_NESTED_DOCS_PLUGIN = 'true'
    Write-Host "Running run-stage-2.ts (via pnpm run stage2:seed-all)..."

    # Temporary files for stdout and stderr (optional for debugging)
    # $stdOutFile = [System.IO.Path]::GetTempFileName()
    # $stdErrFile = [System.IO.Path]::GetTempFileName()

    # Use Start-Process to capture streams separately
    $process = Start-Process "pnpm" -ArgumentList "--filter @slideheroes/payload-local-init run stage2:seed-all" -WorkingDirectory $ScriptRoot -NoNewWindow -PassThru -RedirectStandardOutput ($stdOutFile = [System.IO.Path]::GetTempFileName()) -RedirectStandardError ($stdErrFile = [System.IO.Path]::GetTempFileName())
    $process.WaitForExit()
    $exitCode = $process.ExitCode

    # Read captured content
    $stdOutContent = Get-Content -Path $stdOutFile -Raw -ErrorAction SilentlyContinue
    $stdErrContent = Get-Content -Path $stdErrFile -Raw -ErrorAction SilentlyContinue

    $env:DISABLE_NESTED_DOCS_PLUGIN = $null # Reset env var

    # --- Error and Warning Handling ---
    if ($stdErrContent -and ($exitCode -eq 0)) {
        Write-Warning "Stage 2 completed with warnings:"
        Write-Warning $stdErrContent
        # Continue execution despite warnings
    }

    if ($exitCode -ne 0) {
        Write-Error "Stage 2 failed with exit code $exitCode."
        Write-Error "Standard Output:"
        Write-Error $stdOutContent
        Write-Error "Standard Error:"
        Write-Error $stdErrContent
        Remove-Item $stdOutFile, $stdErrFile -ErrorAction SilentlyContinue
        throw "Stage 2: Orchestrated core content seeding (run-stage-2.ts) failed."
    }

    Write-Host "Stage 2 completed successfully (Exit Code: $exitCode)."

    # --- JSON Extraction and Validation ---
    $jsonOutputObject = $null
    try {
        # Attempt to parse the entire stdout content as JSON
        $jsonOutputObject = $stdOutContent | ConvertFrom-Json -ErrorAction Stop
        Write-Host "Successfully extracted and validated JSON map from Stage 2 stdout."
    } catch {
        Write-Error "Failed to parse Stage 2 stdout as JSON."
        Write-Error "Stdout content was:"
        Write-Error $stdOutContent
        Remove-Item $stdOutFile, $stdErrFile -ErrorAction SilentlyContinue
        throw "Invalid JSON map received from Stage 2."
    }

    # Clean up temp files
    Remove-Item $stdOutFile, $stdErrFile -ErrorAction SilentlyContinue

    # --- Proceed to Stage 3 ---
    Write-Host "Pausing for 5 seconds before starting Stage 3..."
    Start-Sleep -Seconds 5

    if (-not $SkipPopulateRelationships.IsPresent) {
        Write-Host "Executing Stage 3: Populate Relationships..."
        Write-Host "Running run-stage-3.ts (via pnpm run) and piping Stage 2 JSON map..."

        # Convert the parsed PowerShell object back to a JSON string for piping
        $jsonInputString = $jsonOutputObject | ConvertTo-Json -Depth 10 # Use sufficient depth

        # Pipe the JSON string to Stage 3
        $jsonInputString | pnpm --filter @slideheroes/payload-local-init run stage3:populate-relationships
        if ($LASTEXITCODE -ne 0) { throw "Stage 3: run-stage-3.ts failed." }

        Write-Host "Stage 3 completed."
    } else {
        Write-Host "Skipping Stage 3: Populate Relationships."
    }
} else {
    Write-Host "Skipping Stage 2: Seed Core Content."
    if (-not $SkipPopulateRelationships.IsPresent) {
         Write-Warning "Stage 2 was skipped, but Stage 3 requires data from Stage 2. Stage 3 might fail or produce incorrect results."
    }
}

# Stage 4 remains unchanged...
```

_(Note: The PowerShell code uses `Start-Process` for better stream redirection compared to the previous example)_

### Step 3: Verify `run-stage-3.ts` Input Handling (Conceptual)

- Ensure `packages/payload-local-init/stage-3-populate-relationships/run-stage-3.ts` reads a JSON string from standard input, parses it, and correctly uses the ID maps (especially `quizQuestions`).

## Summary of Changes to `Initialize-PayloadData.ps1`

1.  **Separate Output Streams:** Use `Start-Process` with redirection to capture stdout and stderr into temporary files.
2.  **Improved Error/Warning Logic:** Check `$exitCode`. Log warnings from stderr if `$exitCode` is 0 and continue. Treat non-zero `$exitCode` as fatal.
3.  **Robust JSON Parsing:** Parse the _entire_ captured stdout content using `ConvertFrom-Json`.
4.  **Correct Piping:** Convert the parsed PowerShell JSON object _back_ into a JSON string (`ConvertTo-Json`) before piping it to Stage 3.
5.  **Dependency:** Relies on `run-stage-2.ts` exiting correctly and printing only JSON to `console.log()`.
