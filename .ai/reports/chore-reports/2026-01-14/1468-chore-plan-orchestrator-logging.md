# Chore: Improve Alpha Orchestrator Logging with Run ID

## Chore Description

Enhance the Alpha Orchestrator logging system to distinguish between different orchestrator runs. Currently, logs and progress files use only sandbox labels and timestamps, making it difficult to correlate data from the same run across multiple sandboxes or to distinguish between runs that occur close together in time. This chore adds a unique run/session ID that ties all logs and progress files from a single orchestrator invocation together, archives previous run data on startup, and includes session headers in log files.

**Key improvements:**
1. Generate unique run ID at orchestrator startup (e.g., `run-abc123` using short hash)
2. Include run ID in log filenames and progress files
3. Archive previous run data to timestamped subdirectory instead of deleting
4. Add session header to each log file with run metadata
5. Update UI to display current run ID

## Relevant Files

Use these files to resolve the chore:

- `.ai/alpha/scripts/lib/orchestrator.ts` - Main orchestrator entry point; generates run ID here and passes to all components
- `.ai/alpha/scripts/lib/feature.ts` - Contains `createLogStream()` function that creates log files; needs run ID in filename
- `.ai/alpha/scripts/lib/manifest.ts` - Contains `clearUIProgress()` that deletes old files; change to archive instead
- `.ai/alpha/scripts/lib/progress.ts` - Contains `writeUIProgress()` that writes progress files; add run ID to progress data
- `.ai/alpha/scripts/config/constants.ts` - Add constants for archive directory naming
- `.ai/alpha/scripts/types/orchestrator.types.ts` - Add `runId` to `SandboxInstance` and create `RunMetadata` type
- `.ai/alpha/scripts/ui/types.ts` - Add run ID to UI state types
- `.ai/alpha/scripts/ui/components/Header.tsx` - Display run ID in UI header
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` - Read run ID from progress files

### New Files

- `.ai/alpha/scripts/lib/run-id.ts` - Utility module for generating and managing run IDs

## Impact Analysis

### Dependencies Affected

- **Internal modules**: All modules that create logs or progress files need access to run ID
- **UI components**: Header component needs to display run ID
- **Progress file format**: Adding new `runId` field (backward compatible)
- **Log file naming**: Changing from `sbx-a-{timestamp}.log` to `{runId}/sbx-a.log`

### Risk Assessment

**Low Risk**: This is an additive change that improves observability without changing core orchestration logic.

- No changes to sandbox management, feature implementation, or work queue logic
- Progress file changes are backward compatible (new optional field)
- Archive behavior preserves data instead of deleting (safer)
- UI changes are isolated to display components

### Backward Compatibility

- Progress files: New `runId` field is optional; existing code continues to work
- Log files: New directory structure; old logs won't interfere
- UI: Gracefully handles missing run ID (shows "unknown")

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/orchestrator-logging-run-id`
- [ ] Verify no active orchestrator runs
- [ ] Review existing log files in `.ai/alpha/logs/` for current naming patterns
- [ ] Check `.ai/alpha/progress/` for current progress file structure

## Documentation Updates Required

- Update `.ai/alpha/docs/alpha-implementation-system.md` with new logging structure
- Add inline code comments explaining run ID generation and usage
- Update any troubleshooting guides that reference log file locations

## Rollback Plan

1. Revert the code changes (standard git revert)
2. Old log files in archive directories remain accessible
3. No database or migration changes to roll back
4. Progress files continue to work without `runId` field

## Step by Step Tasks

### Step 1: Create Run ID Utility Module

Create `.ai/alpha/scripts/lib/run-id.ts` with:
- `generateRunId()`: Generate short unique ID (e.g., `run-abc123` using timestamp + random)
- `RunMetadata` interface: `{ runId, specId, startTime, sandboxCount }`
- `formatRunDirectory()`: Generate archive directory name

```typescript
// Example structure
export interface RunMetadata {
  runId: string;
  specId: number;
  startTime: Date;
  sandboxLabels: string[];
}

export function generateRunId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `run-${timestamp}-${random}`;
}
```

### Step 2: Update Type Definitions

Update `.ai/alpha/scripts/types/orchestrator.types.ts`:
- Add `runId: string` to `SandboxInstance` interface
- Export `RunMetadata` type from run-id module

Update `.ai/alpha/scripts/ui/types.ts`:
- Add `runId?: string` to `OverallProgress` interface
- Add `runId?: string` to `SandboxProgress` interface

### Step 3: Update Constants

Add to `.ai/alpha/scripts/config/constants.ts`:
```typescript
/** Directory for archived runs (relative to project root) */
export const ARCHIVE_DIR = ".ai/alpha/archive";

/** Maximum number of archived runs to keep */
export const MAX_ARCHIVED_RUNS = 10;
```

### Step 4: Modify Orchestrator to Generate Run ID

Update `.ai/alpha/scripts/lib/orchestrator.ts`:
- Import `generateRunId` from run-id module
- Generate run ID at start of `orchestrate()` function
- Pass run ID to all sandbox instances
- Include run ID in console output header
- Pass run ID to UI manager

### Step 5: Update Log File Creation

Update `.ai/alpha/scripts/lib/feature.ts`:
- Modify `createLogStream()` to accept run ID parameter
- Change log file path to: `.ai/alpha/logs/{runId}/sbx-a.log`
- Add session header at start of each log file:
  ```
  ================================================================================
  Alpha Orchestrator Log
  Run ID: run-abc123
  Spec ID: 1362
  Sandbox: sbx-a
  Started: 2026-01-14T17:30:00Z
  ================================================================================
  ```
- Update `runFeatureImplementation()` to pass run ID to log stream

### Step 6: Modify Progress File Archiving

Update `.ai/alpha/scripts/lib/manifest.ts`:
- Rename `clearUIProgress()` to `archiveAndClearPreviousRun()`
- Instead of deleting files, move them to `.ai/alpha/archive/{timestamp}/`
- Archive both progress files and log directories
- Implement `MAX_ARCHIVED_RUNS` cleanup (delete oldest archives)
- Create new progress directory for current run

```typescript
export function archiveAndClearPreviousRun(runId: string): void {
  const projectRoot = getProjectRoot();
  const archiveDir = path.join(projectRoot, ARCHIVE_DIR);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archivePath = path.join(archiveDir, timestamp);

  // Create archive directory
  fs.mkdirSync(archivePath, { recursive: true });

  // Move progress files
  // Move log files
  // Clean up old archives if > MAX_ARCHIVED_RUNS
}
```

### Step 7: Update Progress File Writing

Update `.ai/alpha/scripts/lib/progress.ts`:
- Modify `writeUIProgress()` to include run ID in JSON output
- Modify `writeIdleProgress()` to include run ID
- Update `displayProgressUpdate()` to show run ID

### Step 8: Update UI Components

Update `.ai/alpha/scripts/ui/components/Header.tsx`:
- Display run ID in header (e.g., "Run: abc123")
- Show run ID in a subtle way that doesn't clutter the UI

Update `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts`:
- Read run ID from overall-progress.json
- Pass run ID to UI state

### Step 9: Update Overall Progress File

Update `.ai/alpha/scripts/lib/manifest.ts`:
- Add `runId` field to overall-progress.json structure
- Write run ID when creating/updating overall progress

### Step 10: Export Run ID Module

Update `.ai/alpha/scripts/lib/index.ts`:
- Export `generateRunId` and `RunMetadata` from the new module

Update `.ai/alpha/scripts/config/index.ts`:
- Export `ARCHIVE_DIR` and `MAX_ARCHIVED_RUNS`

### Step 11: Run Validation Commands

Execute all validation commands to ensure zero regressions.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# 1. TypeScript compilation check
cd .ai/alpha/scripts && pnpm exec tsc --noEmit

# 2. Run orchestrator in dry-run mode to verify run ID generation
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --dry-run

# 3. Verify run ID appears in console output
# (manual check - should see "Run ID: run-xxx" in output)

# 4. Start orchestrator briefly and check file structure
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 &
sleep 10
# Check that logs are in run-specific directory
ls -la .ai/alpha/logs/
# Check that progress files include runId
cat .ai/alpha/progress/overall-progress.json | grep runId
kill %1

# 5. Run a second time and verify archiving works
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --dry-run
ls -la .ai/alpha/archive/
# Should see previous run archived

# 6. Verify UI displays run ID (manual check)
# Start orchestrator with UI and verify header shows run ID

# 7. Project-wide type check
pnpm typecheck
```

## Notes

- Run ID format `run-{timestamp36}-{random4}` provides:
  - Uniqueness via timestamp + random component
  - Sortability via timestamp portion
  - Human readability with ~8-12 character total length
  - Example: `run-m5x7k2-a3b9`

- Archive cleanup strategy:
  - Keep last 10 runs by default
  - Delete oldest archives when limit exceeded
  - Consider disk space on long-running systems

- The run ID is generated once at orchestrator startup and passed to all components, ensuring consistency across the entire run.

- Future enhancement: Consider adding run ID to git commit messages when features complete, enabling traceability from code commits back to orchestrator runs.
