# Bug Diagnosis: Alpha Orchestrator Database Connection Failure and Missing Preview URLs

**ID**: ISSUE-pending (to be assigned after GitHub issue creation)
**Created**: 2026-01-14T20:30:00Z
**Reporter**: User via /diagnose command
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Autonomous Coding workflow orchestrator has two distinct issues: (1) The remote Supabase sandbox database (`slideheroes-alpha-sandbox`) cannot be connected to due to authentication failure, preventing database reset/seeding operations and new migration applications. (2) The UI does not display preview URLs on completion because they are written to the progress file AFTER the status changes to "completed", causing a race condition.

## Environment

- **Application Version**: Current dev branch
- **Environment**: Development (local orchestrator)
- **Platform**: Linux (WSL2)
- **Node Version**: 22.16.0
- **Database**: Supabase remote project (kdjbbhjgogqywtlctlzq)
- **Last Working**: Unknown (first report of these issues)

## Reproduction Steps

### Issue A: Database Connection Failure

1. Run the spec orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
2. Observe that database capacity check fails silently (returns true due to non-blocking error handling)
3. Database reset is skipped due to psql connection failure
4. Database seeding is skipped as a result

### Issue B: Preview URL Not Displayed

1. Run the spec orchestrator to completion
2. Observe that the Ink UI shows "completed" status
3. Note that review URLs are NOT displayed in the CompletionUI
4. Verify that `overall-progress.json` DOES contain the reviewUrls after completion

## Expected Behavior

### Issue A
- The orchestrator should successfully connect to the remote Supabase sandbox database
- Database should be reset with `DROP SCHEMA public CASCADE`
- Migrations should be applied via `supabase db push`
- Payload CMS should be seeded via the first sandbox

### Issue B
- When the orchestrator completes, the UI should display clickable review URLs for:
  - VS Code web interface (port 8080)
  - Development server (port 3000)

## Actual Behavior

### Issue A
- Database connection fails with: `FATAL: password authentication failed for user "postgres"`
- The `checkDatabaseCapacity()` function returns `true` (non-blocking) when psql fails
- The `resetSandboxDatabase()` function skips silently when `SUPABASE_SANDBOX_DB_URL` is present but connection fails
- No migrations or seeding are applied to the remote database

### Issue B
- UI renders CompletionUI when status changes to "completed"
- At that moment, reviewUrls are NOT yet in the progress file
- Progress file is updated 30+ seconds later after dev server starts
- UI has already rendered without reviewUrls and doesn't re-poll

## Diagnostic Data

### Console Output (Database Connection Test)
```
Testing connection to: postgresql://postgres.kdjbbhjgogqywtlctlzq:0R1SVJ0...
Connection failed: psql: error: connection to server at "aws-0-us-west-2.pooler.supabase.com" (35.160.209.8), port 5432 failed: FATAL:  password authentication failed for user "postgres"
```

### Progress File (Shows reviewUrls ARE Written)
```json
{
  "specId": 1362,
  "status": "completed",
  "reviewUrls": [
    {
      "label": "sbx-a",
      "vscode": "https://8080-ixx0sz39s8q1wrwsw3qbd.e2b.app",
      "devServer": "https://3000-ixx0sz39s8q1wrwsw3qbd.e2b.app"
    }
  ]
}
```

### Environment Variables
```
SUPABASE_SANDBOX_PROJECT_REF=kdjbbhjgogqywtlctlzq
SUPABASE_SANDBOX_URL=https://kdjbbhjgogqywtlctlzq.supabase.co
SUPABASE_SANDBOX_DB_URL=postgresql://postgres.kdjbbhjgogqywtlctlzq:****@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

## Error Stack Traces

### Issue A - Database Connection
```
psql: error: connection to server at "aws-0-us-west-2.pooler.supabase.com" (35.160.209.8), port 5432 failed:
FATAL:  password authentication failed for user "postgres"
connection to server at "aws-0-us-west-2.pooler.supabase.com" (35.160.209.8), port 5432 failed:
FATAL:  password authentication failed for user "postgres"
```

## Related Code

### Issue A - Affected Files:
- `.ai/alpha/scripts/lib/database.ts` - `resetSandboxDatabase()`, `checkDatabaseCapacity()`
- `.ai/alpha/scripts/lib/orchestrator.ts` - Lines 893-914 (database operations)
- `.env` - `SUPABASE_SANDBOX_DB_URL` credential (line 20)

### Issue B - Affected Files:
- `.ai/alpha/scripts/lib/orchestrator.ts` - Lines 1055-1137 (completion sequence)
- `.ai/alpha/scripts/lib/manifest.ts` - `writeOverallProgress()` function
- `.ai/alpha/scripts/ui/index.tsx` - Lines 168-176 (phase state management)
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` - `progressEqual()` function

## Related Issues & Context

### Similar Symptoms
- No previous issues found for Alpha orchestrator database authentication

### Same Component
- The Alpha orchestrator system is new and this is the first diagnosis

## Root Cause Analysis

### Identified Root Cause - Issue A (Database)

**Summary**: The database password in `SUPABASE_SANDBOX_DB_URL` is incorrect or has been rotated.

**Detailed Explanation**:
The Supabase sandbox project connection string contains a password that does not authenticate successfully. The pooler connection format `postgres.{project_ref}:{password}@...pooler.supabase.com` requires the database password from the Supabase dashboard "Database Settings" page. The current password (`0R1SVJ05OHf0aUoB`) is being rejected by the Supabase pooler.

**Supporting Evidence**:
- psql returns `FATAL: password authentication failed for user "postgres"`
- The connection URL format is correct (pooler URL, port 5432, /postgres database)
- The project reference `kdjbbhjgogqywtlctlzq` matches the Supabase project URL

### Identified Root Cause - Issue B (Preview URL)

**Summary**: Race condition between status update and reviewUrls write causes UI to render without preview URLs.

**Detailed Explanation**:
The orchestrator sets `status: "completed"` and calls `saveManifest()` at line 1060, which triggers the UI to switch to `CompletionUI`. However, reviewUrls are only written to the progress file at line 1115, approximately 30+ seconds later (after dev server startup). By this time, the CompletionUI has already rendered with empty reviewUrls. The progress poller continues polling but the phase has already transitioned to "completed" and the component doesn't re-render with the new data.

**Supporting Evidence**:
- Code sequence: Lines 1058-1060 set status, Lines 1093-1115 write reviewUrls
- Progress file shows reviewUrls present AFTER completion
- UI `onStateChange` callback at line 168 sets phase to "completed" immediately on status change
- `CompletionUI` receives `reviewUrls` from state at render time (before file is updated)

### How This Causes the Observed Behavior

**Issue A**: When the orchestrator runs, it attempts database operations using psql. The authentication failure causes these operations to fail silently (functions return early or catch errors). The orchestrator continues without a properly initialized database.

**Issue B**: When all features complete, the orchestrator updates the manifest status to "completed". The UI's polling mechanism detects this change and immediately transitions to the CompletionUI phase. Meanwhile, the orchestrator prepares the review sandbox, starts the dev server (30s delay), and THEN writes reviewUrls. The UI has already stopped reacting to progress file changes because it reached the "completed" phase.

### Confidence Level

**Confidence**: High

**Reasoning**:
- Issue A: Direct psql connection test confirms authentication failure with clear error message
- Issue B: Code analysis shows clear sequence: status written before reviewUrls, and UI phase change is triggered by status

## Fix Approach (High-Level)

### Issue A - Database Credentials
1. Obtain the correct database password from Supabase Dashboard > Project Settings > Database
2. Update `SUPABASE_SANDBOX_DB_URL` in `.env` with the new password
3. Test connection: `psql "$SUPABASE_SANDBOX_DB_URL" -c "SELECT 1"`

### Issue B - Preview URL Timing
Two possible approaches:

**Approach 1 (Recommended)**: Write reviewUrls BEFORE setting status to "completed"
- Generate reviewUrls structure early in completion sequence
- Write to progress file before status change
- UI will have reviewUrls when CompletionUI renders

**Approach 2**: Make CompletionUI poll for reviewUrls
- Add polling in CompletionUI to watch for reviewUrls
- Re-render when reviewUrls appear in progress file
- More complex, requires additional state management

## Diagnosis Determination

Two distinct bugs have been identified:

1. **Database Authentication Failure**: The `SUPABASE_SANDBOX_DB_URL` password is incorrect. This prevents database reset, migration application, and Payload CMS seeding. The fix requires updating the `.env` file with the correct credentials from the Supabase dashboard.

2. **Preview URL Race Condition**: The UI phase transitions to "completed" before reviewUrls are written to the progress file. The fix requires reordering the orchestrator completion sequence to write reviewUrls before (or at the same time as) setting the status to "completed".

## Additional Context

### Database Task in Task Decomposition
The user mentioned checking if database migration tasks were created for spec 1362. Looking at the tasks.json for Feature 1373 (Activity Database Schema), it contains tasks for creating the activity schema. However, these tasks rely on the sandbox having proper database connectivity to apply migrations, which would fail if the database credentials are incorrect.

### Environment Variable Loading
The `.env` file parsing works correctly - environment variables are being loaded by `loadEnvFile()` in `spec-orchestrator.ts`. The issue is purely the credential value, not the loading mechanism.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash, Grep, Glob*
