# Feature: Add Sandbox Session Logging to .ai/logs/sandbox-logs

## Feature Description

Add comprehensive logging for all E2B sandbox sessions to `.ai/logs/sandbox-logs/`. Each sandbox session will create a log file organized by date (YYYY-MM-DD subdirectories) containing command executed, start/end times, exit status, stdout/stderr output, sandbox ID, environment variables (sanitized), file changes, and resource usage information.

This enables developers to:
- Debug sandbox execution issues after the fact
- Track Claude Code agent activity over time
- Review what changes were made during feature workflows
- Audit sandbox resource usage and performance

## User Story

As a developer using the /sandbox command
I want to have comprehensive logs of each sandbox session saved locally
So that I can review what happened during execution, debug issues, and track agent activity

## Problem Statement

Currently, sandbox session output is only displayed in the terminal during execution. Once the session ends or the terminal is cleared, there's no record of:
- What commands were executed
- What output was produced (stdout/stderr)
- How long operations took
- What files were changed
- Any errors that occurred

This makes debugging difficult and prevents historical analysis of sandbox activity.

## Solution Statement

Add a logging module to the sandbox CLI that:
1. Creates timestamped log files for each sandbox session
2. Captures all command output (stdout/stderr) in real-time
3. Records session metadata (sandbox ID, template, timestamps)
4. Logs file changes (git diff summary)
5. Stores logs in `.ai/logs/sandbox-logs/YYYY-MM-DD/` directory structure
6. Uses JSON format for machine-readable logs with human-readable summaries

## Relevant Files

Use these files to implement the feature:

### Existing Files to Modify
- `.claude/skills/e2b-sandbox/scripts/sandbox-cli.ts` - Main CLI implementation where logging will be integrated
  - Add logging infrastructure (SandboxLogger class)
  - Integrate logging into all command execution functions
  - Add log directory initialization

- `.claude/skills/e2b-sandbox/scripts/sandbox` - Shell wrapper script
  - No changes needed (already passes through to TypeScript CLI)

- `.claude/commands/sandbox.md` - Command documentation
  - Add documentation for logging behavior
  - Document log file location and format

### New Files

- `.ai/logs/sandbox-logs/.gitkeep` - Placeholder for log directory (logs themselves gitignored)
- Add to `.gitignore`: `.ai/logs/sandbox-logs/**/*.json` and `.ai/logs/sandbox-logs/**/*.log`

## Impact Analysis

### Dependencies Affected
- `@e2b/code-interpreter` - Already a dependency, no changes needed
- Node.js `fs` module - Standard library, already available
- No new dependencies required

### Risk Assessment
**Low Risk**:
- Changes are additive (logging doesn't modify execution flow)
- Isolated to sandbox CLI tooling
- No impact on production application code
- Well-understood file I/O patterns

### Backward Compatibility
- Fully backward compatible
- Logging is automatic and doesn't change any command interfaces
- Existing workflows continue to work unchanged
- Logs are an addition, not a modification

### Performance Impact
- Minimal: File writes are async and buffered
- Log files are written at session end (not during execution)
- Real-time streaming callbacks already exist (just tee to log buffer)
- Estimated overhead: <100ms per session

### Security Considerations
- **Sanitize environment variables**: Mask sensitive values (API keys, tokens)
- **No secrets in logs**: Filter out ANTHROPIC_API_KEY, GITHUB_TOKEN, etc.
- **Local storage only**: Logs stay on developer's machine
- **Gitignored**: Log files excluded from version control

## Pre-Feature Checklist

Before starting implementation:
- [x] Verify that you have read the recommended context documents
- [ ] Create feature branch: `feature/sandbox-session-logging`
- [x] Review existing similar features for patterns (checked project logger patterns)
- [x] Identify all integration points (sandbox-cli.ts functions)
- [x] Define success metrics (logs created for all operations)
- [x] Confirm feature doesn't duplicate existing functionality
- [x] Verify all required dependencies are available (fs, path - standard Node.js)
- [ ] Plan feature flag strategy (not needed - always-on logging)

## Documentation Updates Required

- `.claude/commands/sandbox.md` - Add section on logging behavior
- `.claude/skills/e2b-sandbox/SKILL.md` - Update with logging information
- No user-facing docs needed (developer tooling)

## Rollback Plan

- **Disable**: Remove logging calls from sandbox-cli.ts
- **No database migrations**: Feature is file-based only
- **Monitoring**: Check log directory size periodically
- **Graceful degradation**: If log write fails, continue execution without logging (don't block sandbox operations)

## Implementation Plan

### Phase 1: Foundation
1. Create log directory structure
2. Implement SandboxLogger class with JSON + human-readable output
3. Add environment variable sanitization

### Phase 2: Core Implementation
1. Integrate logging into `createSandbox()` function
2. Add logging to `runClaude()` with output capture
3. Integrate into feature workflow functions (`runFeaturePhase`, `runContinuePhase`)
4. Add logging to approval/rejection flows

### Phase 3: Integration
1. Add git diff capture to session logs
2. Include resource timing information
3. Update documentation
4. Test all sandbox commands produce logs

## Step by Step Tasks

### Step 1: Create Log Directory Structure

- Create `.ai/logs/sandbox-logs/.gitkeep` file
- Add `.ai/logs/sandbox-logs/**` to `.gitignore`
- Ensure directory is created on first use

### Step 2: Implement SandboxLogger Class

Create a `SandboxLogger` class in `sandbox-cli.ts` with:

```typescript
interface SessionLog {
  sessionId: string;           // UUID for this session
  sandboxId: string;           // E2B sandbox ID
  command: string;             // Command executed (create, run-claude, feature, etc.)
  args: string[];              // Command arguments
  template: string;            // E2B template used
  startTime: string;           // ISO timestamp
  endTime: string;             // ISO timestamp
  durationMs: number;          // Execution duration
  exitCode: number | null;     // Exit code if applicable
  stdout: string[];            // Captured stdout lines
  stderr: string[];            // Captured stderr lines
  environment: Record<string, string>; // Sanitized env vars
  metadata: Record<string, unknown>;   // Additional context
  gitChanges?: {               // Git diff summary
    filesChanged: number;
    insertions: number;
    deletions: number;
    files: string[];
  };
  error?: string;              // Error message if failed
}
```

Methods:
- `startSession(command, args, sandboxId, template)` - Initialize session
- `log(level, message, data?)` - Add log entry
- `captureStdout(data)` - Append to stdout buffer
- `captureStderr(data)` - Append to stderr buffer
- `setGitChanges(changes)` - Record git diff
- `endSession(exitCode, error?)` - Finalize and write log file
- `sanitizeEnv(env)` - Remove sensitive values

### Step 3: Add Logging to createSandbox()

- Initialize logger at sandbox creation
- Log sandbox ID, template, timeout
- Record sanitized environment variables
- Log success/failure

### Step 4: Add Logging to runClaude()

- Capture stdout/stderr in real-time (tee to logger)
- Log the prompt being executed
- Record exit code and duration
- Include sandbox connection info

### Step 5: Add Logging to Feature Workflow

For `runFeaturePhase()`:
- Log issue number and description
- Capture /feature command output
- Record branch name created
- Log VS Code URL for reference

For `runContinuePhase()`:
- Log /implement output
- Log /review output
- Capture dev server URL
- Record git changes summary

### Step 6: Add Logging to Approval/Rejection

For `approveChanges()`:
- Log commit message
- Record PR URL created
- Capture push output

For `rejectChanges()`:
- Log discarded changes
- Record cleanup actions

### Step 7: Add Git Changes Capture

- Create helper function to parse `git diff --stat`
- Extract files changed, insertions, deletions
- Include in session log

### Step 8: Update Documentation

- Add "Session Logging" section to `.claude/commands/sandbox.md`
- Document log file location and format
- Explain how to read/analyze logs

### Step 9: Run Validation Commands

- Execute all validation commands to ensure feature works correctly
- Verify logs are created for each operation type

## Testing Strategy

### Unit Tests
- Test `SandboxLogger` class methods
- Test environment variable sanitization (ensure secrets are masked)
- Test log file path generation (correct date directories)
- Test JSON serialization of session logs

### Integration Tests
- Test log creation during sandbox create
- Test log capture during run-claude
- Test feature workflow produces comprehensive logs
- Test approval/rejection logging

### E2E Tests
- Run `/sandbox create` and verify log file exists
- Run `/sandbox run-claude` and verify stdout/stderr captured
- Run `/sandbox feature` workflow and verify all phases logged
- Verify git changes are captured in logs

### Edge Cases
- Long-running sessions (ensure buffer doesn't overflow)
- Failed commands (ensure error is logged)
- Missing environment variables (graceful handling)
- Concurrent sessions (unique log files)
- Special characters in output (proper escaping)

## Acceptance Criteria

1. **Log Directory Created**: `.ai/logs/sandbox-logs/` directory exists and is gitignored
2. **Session Logs Generated**: Every sandbox operation creates a log file
3. **Organized by Date**: Logs are in `YYYY-MM-DD` subdirectories
4. **Comprehensive Content**: Logs include:
   - Session ID and sandbox ID
   - Command and arguments
   - Start/end timestamps and duration
   - Complete stdout/stderr output
   - Exit codes
   - Sanitized environment variables
   - Git changes (when applicable)
5. **Secrets Masked**: API keys and tokens are replaced with `[REDACTED]`
6. **Human Readable**: Log files include summary section readable without JSON parsing
7. **No Breaking Changes**: Existing sandbox commands work unchanged
8. **Graceful Failures**: Logging errors don't block sandbox operations

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

```bash
# Type checking - ensure no type errors
pnpm typecheck

# Lint the sandbox CLI
pnpm lint --filter @kit/e2b

# Test sandbox create (verify log created)
/sandbox create --timeout 60
# Then check: ls -la .ai/logs/sandbox-logs/$(date +%Y-%m-%d)/

# Test sandbox list (verify log created)
/sandbox list

# Test run-claude (verify stdout/stderr captured)
/sandbox run-claude "echo hello" --sandbox <id>
# Then verify log contains stdout

# Kill test sandbox
/sandbox kill <id>

# Verify log file format
cat .ai/logs/sandbox-logs/$(date +%Y-%m-%d)/*.json | jq .

# Verify secrets are masked
grep -r "ANTHROPIC_API_KEY\|GITHUB_TOKEN\|OAUTH" .ai/logs/sandbox-logs/ || echo "No secrets found - GOOD"
```

## Notes

### Log File Naming Convention
Format: `{timestamp}-{command}-{sandboxId}.json`
Example: `2025-11-28T14-30-00-feature-abc123xyz.json`

### Log Retention
- Logs are stored indefinitely (developer responsibility to clean up)
- Consider adding a cleanup command in future: `/sandbox logs cleanup --older-than 30d`

### Future Enhancements
1. Log aggregation/search command: `/sandbox logs search "error"`
2. Log viewer in VS Code extension
3. Export logs to external systems
4. Log compression for old entries
5. Analytics dashboard for sandbox usage

### E2B API Reference
Based on Context7 research, the following E2B APIs are used:
- `sandbox.getInfo()` - Get session metadata (sandboxId, template, startedAt)
- `onStdout`/`onStderr` callbacks - Real-time output capture
- `result.stdout`/`result.stderr` - Complete output after execution
- `sandbox.filesystem.write()` - Could be used to also save logs in sandbox

### Sanitization Rules
Mask these environment variable patterns:
- `*_KEY` → `[REDACTED]`
- `*_TOKEN` → `[REDACTED]`
- `*_SECRET` → `[REDACTED]`
- `*_PASSWORD` → `[REDACTED]`
- Specific: `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN`, `E2B_API_KEY`
