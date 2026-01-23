# Bug Fix: Alpha Orchestrator Event Server - Missing Python Dependencies

**Related Diagnosis**: #1545
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Missing Python packages (`fastapi`, `uvicorn`, `websockets`) prevent event server from starting
- **Fix Approach**: Add Python dependency installation and startup validation before orchestrator runs
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator's event server fails to start because required Python packages are not installed. This causes all database events to be silently dropped, leaving the UI with no visibility into database operations (reset, migrations, seeding) that should complete in the first 5 minutes. Additionally, the database setup appears to have failed silently since no tables were created.

For full details, see diagnosis issue #1545.

### Solution Approaches Considered

#### Option 1: Install Dependencies via Package Manager ⭐ RECOMMENDED

**Description**: Add `pip install` command before the orchestrator starts. This ensures all required Python packages are available when the event server launches. Can be done via:
- Manual setup instructions in README/docs
- Automated install script in the orchestrator startup
- Docker/environment setup script

**Pros**:
- Simple one-time fix that solves the root cause entirely
- Minimal code changes required
- Works for all deployment scenarios (local dev, CI/CD, containers)
- No architectural changes needed
- Clear error messaging if installation fails

**Cons**:
- Requires Python and pip to be available
- May fail in sandboxed/restricted environments
- Installation takes time on first run

**Risk Assessment**: Low - pip installation is a standard, well-understood operation that rarely fails.

**Complexity**: Simple - straightforward shell command execution.

#### Option 2: Rewrite Event Server in Node.js/TypeScript

**Description**: Convert `event-server.py` to a Node.js server using Express or similar framework, eliminating the Python dependency entirely.

**Why Not Chosen**:
- Much higher complexity (rewrite entire server)
- Unnecessary scope creep when the real fix is just installing packages
- Could introduce new bugs during conversion
- Requires extensive testing of the new server
- Contradicts "never fix what's not broken" principle
- This is a tooling issue, not an architecture issue

#### Option 3: Add Fallback in-Memory Event Store

**Description**: If Python server fails to start, fall back to an in-memory event store in the Node.js orchestrator itself, skipping WebSocket streaming.

**Why Not Chosen**:
- Doesn't fix the root cause - just hides the problem
- Reduces observability compared to WebSocket streaming
- More complex than simply installing packages
- Still requires the Python packages for other purposes

### Selected Solution: Install Dependencies via Package Manager

**Justification**:
This approach directly fixes the root cause with minimal complexity and risk. The missing Python packages are the sole reason the event server fails. By ensuring they're installed before the orchestrator starts, we restore full functionality without any architectural changes or workarounds.

**Technical Approach**:
1. Add a startup validation function that checks Python packages are installed
2. If missing, attempt automatic installation via pip
3. Provide clear error messaging if installation fails
4. Log successful installation so users know the fix was applied
5. Skip this check on subsequent runs (assume packages remain installed)

**Architecture Changes**: None - no changes to existing code structure or data flow.

**Migration Strategy**: Not applicable - this is a pure dependency addition.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/orchestrator.ts` - Add dependency check before `startEventServer()`
- `.ai/alpha/scripts/lib/environment.ts` - Add function to validate/install Python dependencies
- `.env.example` - Document the Python dependency requirement
- `README.md` or `.ai/alpha/README.md` - Add setup instructions for Python dependencies

### New Files

- `.ai/alpha/scripts/python-requirements.txt` - List of required Python packages (fastapi, uvicorn, websockets)

### Step-by-Step Tasks

#### Step 1: Create Python Requirements File

Create `.ai/alpha/scripts/python-requirements.txt` with all required packages:

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
websockets==12.0
```

**Why this step first**: Establishes the dependency list as a single source of truth that can be used for both manual and automated installation.

#### Step 2: Add Dependency Validation Function

Add new function to `.ai/alpha/scripts/lib/environment.ts`:

```typescript
/**
 * Validate that required Python packages are installed.
 * Attempts to install them if missing.
 *
 * @param log - Logger function
 * @returns true if packages are available (either already installed or just installed)
 */
export async function validatePythonDependencies(
  log: (...args: unknown[]) => void
): Promise<boolean> {
  const { execSync } = await import("node:child_process");

  const packages = ["fastapi", "uvicorn", "websockets"];
  const missingPackages: string[] = [];

  // Check which packages are missing
  for (const pkg of packages) {
    try {
      execSync(`python3 -c "import ${pkg}"`, { stdio: "ignore" });
    } catch {
      missingPackages.push(pkg);
    }
  }

  // If all packages present, we're good
  if (missingPackages.length === 0) {
    log("   ✅ Python dependencies verified");
    return true;
  }

  // Try to install missing packages
  log(`   ⚠️ Missing Python packages: ${missingPackages.join(", ")}`);
  log("   📦 Attempting to install via pip...");

  try {
    const requirementsPath = path.join(
      getProjectRoot(),
      ".ai/alpha/scripts/python-requirements.txt"
    );
    execSync(`pip install -q -r "${requirementsPath}"`, {
      stdio: ["pipe", "pipe", "pipe"],
    });
    log("   ✅ Python dependencies installed successfully");
    return true;
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : String(err);
    log(
      `   ❌ Failed to install Python dependencies: ${errorMessage}`
    );
    log("   📖 Manual installation:");
    log(`      pip install -r .ai/alpha/scripts/python-requirements.txt`);
    return false;
  }
}
```

**Why this step**: Provides a reusable function that can be called before starting the event server.

#### Step 3: Integrate into Orchestrator Startup

Modify `.ai/alpha/scripts/lib/orchestrator.ts` at line 876 (before `startEventServer()`):

```typescript
// Check Python dependencies before starting event server
if (options.ui && !options.dryRun) {
  log("\n🔍 Validating environment...");
  const depsOk = await validatePythonDependencies(log);
  if (!depsOk) {
    console.error(
      "❌ Python dependencies are required for the event server."
    );
    console.error(
      "   Install with: pip install -r .ai/alpha/scripts/python-requirements.txt"
    );
    process.exit(1);
  }
}
```

**Why this order**: Fail fast before attempting to start the event server - provides clear error messaging rather than a timeout.

#### Step 4: Improve Error Visibility in Event Emitter

Modify `.ai/alpha/scripts/lib/event-emitter.ts` line 87-96 to log errors in non-UI mode:

```typescript
fetch(EVENT_SERVER_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(event),
}).catch((err) => {
  // In non-UI mode, log the error to help with debugging
  if (!process.env.ORCHESTRATOR_UI_ENABLED) {
    console.error(
      `⚠️ Failed to emit event to event server: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  // Still silently ignore in UI mode - orchestrator continues
});
```

**Why this step**: Makes silent failures less silent, improving debuggability.

#### Step 5: Update Documentation

Update `.env.example` and/or create `.ai/alpha/README.md` to document Python dependency requirement:

```markdown
## Prerequisites

### Python Requirements

The Alpha Orchestrator event server requires Python 3.8+ with the following packages:
- fastapi
- uvicorn
- websockets

**Install with:**
```bash
pip install -r .ai/alpha/scripts/python-requirements.txt
```

The orchestrator will attempt automatic installation if packages are missing.
```

#### Step 6: Add Tests/Validation

Add a validation script that can be run before orchestration:

```typescript
// .ai/alpha/scripts/validate-environment.ts
// Can be run independently to check if orchestrator can start

import { validatePythonDependencies } from "./lib/environment.js";

const { log } = createLogger(false);

async function validateEnvironment() {
  log("🔍 Validating Alpha Orchestrator environment...\n");

  const pythonOk = await validatePythonDependencies(log);
  const depsValid = validateSupabaseConfig();

  if (pythonOk && depsValid) {
    log("\n✅ Environment validation passed");
    process.exit(0);
  } else {
    log("\n❌ Environment validation failed");
    process.exit(1);
  }
}

validateEnvironment();
```

## Testing Strategy

### Unit Tests

- ✅ Test `validatePythonDependencies()` returns true when packages installed
- ✅ Test `validatePythonDependencies()` attempts installation when missing
- ✅ Test failure handling when pip is not available
- ✅ Regression test: ensure event server starts successfully when dependencies installed

### Manual Testing Checklist

Execute these tests before considering fix complete:

- [ ] Fresh environment with Python installed, missing pip packages
- [ ] Run orchestrator → Should detect missing packages and attempt installation
- [ ] Verify installation succeeds and orchestrator continues
- [ ] Run orchestrator again → Should skip installation check (already present)
- [ ] Verify event server starts successfully on both runs
- [ ] Verify UI receives database events (db_capacity_check, db_reset_start, etc.)
- [ ] Verify Supabase database has tables after reset/migrations
- [ ] Test on macOS, Linux (WSL), and Windows environments

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **pip not available or outdated**: Some systems may have pip issues
   - **Likelihood**: Low
   - **Impact**: Medium - orchestrator fails to start
   - **Mitigation**: Provide clear error message with manual installation instructions; allow users to pre-install packages

2. **Network issues during pip install**: CI/CD environments may have restricted network access
   - **Likelihood**: Medium
   - **Impact**: High - orchestrator cannot start
   - **Mitigation**: Document pre-installation step for CI/CD; provide Docker image with pre-installed packages

3. **Version conflicts with system Python packages**: Existing environment may have conflicting versions
   - **Likelihood**: Low
   - **Impact**: Medium - installation may fail or break other tools
   - **Mitigation**: Use `--user` flag in pip install to isolate to user environment

**Rollback Plan**:

If this change causes issues:
1. Remove the dependency validation code from `orchestrator.ts`
2. Keep the `python-requirements.txt` file (no harm)
3. Revert to previous behavior - event server may fail silently but orchestrator continues
4. Document in setup instructions that users need to install Python packages manually

**Monitoring** (if needed):
- Monitor for Python installation failures in CI/CD logs
- Track whether dependency validation is actually running and succeeding
- Alert if event server still fails to start despite passing dependency check

## Performance Impact

**Expected Impact**: Minimal (negligible)

- Dependency check adds ~1-2 seconds on first run (only when packages missing)
- Pip installation (if needed) adds ~10-20 seconds (only once, then cached)
- Subsequent runs skip check entirely (instant)
- No runtime performance impact

## Security Considerations

**Security Impact**: Low

- Installing packages from PyPI is the standard Python workflow
- Using specific versions in `python-requirements.txt` ensures reproducibility
- No new network access required beyond standard pip operations
- No code injection risks - only installing well-known packages

**No security review needed** - standard dependency management.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Remove Python packages to simulate the bug
pip uninstall -y fastapi uvicorn websockets

# Run orchestrator - event server should fail silently
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui

# Observe: No database events appear in UI
# Observe: Database remains empty (0 public tables)
```

**Expected Result**: Event server fails to start, no database events visible in UI.

### After Fix (Bug Should Be Resolved)

```bash
# Verify fix in clean environment
# First run - should install packages automatically
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui

# Wait for UI to display - should see database events
# Check database - should have tables after migrations

# Second run - should skip installation check
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui
```

**Expected Result**:
- First run: Installation message appears, event server starts, database events visible
- Database: Tables created, seed data present
- Second run: No installation message, event server starts immediately
- UI: Database events (db_capacity_check, db_reset_start, db_migration_start, etc.) appear in Recent Events

### Regression Prevention

```bash
# Ensure orchestrator works in all modes
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --dry-run

# Verify event server health endpoint
curl http://localhost:9000/health

# Verify database operations complete
PGPASSWORD="$SUPABASE_SANDBOX_PASSWORD" psql \
  -h "$SUPABASE_HOST" \
  -U "$SUPABASE_USER" \
  -d postgres \
  -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
# Should return > 0
```

## Dependencies

### New Dependencies

None - only Python packages which are the subject of this fix:

```bash
pip install -r .ai/alpha/scripts/python-requirements.txt
```

**Packages added**:
- `fastapi==0.104.1` - Web framework for event server
- `uvicorn[standard]==0.24.0` - ASGI server for FastAPI
- `websockets==12.0` - WebSocket protocol support

These are already used by the event server, so we're just ensuring they're installed.

## Database Changes

**No database changes required** - this fix doesn't modify database schema or content.

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**:
- If deploying to production, pre-install Python packages: `pip install -r .ai/alpha/scripts/python-requirements.txt`
- If using Docker, add pip install step to Dockerfile before orchestrator runs
- If using CI/CD, add pip install step before running orchestrator

**Feature flags needed**: No

**Backwards compatibility**: Maintained - fix is additive only, doesn't change existing behavior.

## Success Criteria

The fix is complete when:
- [ ] Python dependencies file created (`python-requirements.txt`)
- [ ] Dependency validation function added and tested
- [ ] Orchestrator attempts auto-installation on startup
- [ ] Clear error messaging if installation fails
- [ ] Event server starts successfully when dependencies installed
- [ ] Database events appear in UI (db_capacity_check, db_reset_start, etc.)
- [ ] Supabase database has tables after migrations
- [ ] All tests pass
- [ ] Zero regressions detected
- [ ] Documentation updated

## Notes

This is a straightforward dependency management fix. The root cause is simply that required packages aren't installed. By adding automatic detection and installation, we solve the problem completely without any architectural changes.

The event server is critical for observability - users need to see what's happening during the first 5 minutes of orchestration. This fix restores that visibility.

**Related documentation**:
- Event server implementation: `.ai/alpha/scripts/event-server.py`
- Orchestrator entry point: `.ai/alpha/scripts/spec-orchestrator.ts`
- Issue diagnosis: #1545

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1545*
