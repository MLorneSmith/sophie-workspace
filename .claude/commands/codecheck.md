---
name: codecheck
description: Execute comprehensive code quality checks (TypeScript, linting, formatting)
usage: /codecheck [options]
options:
  - fix: Apply automatic fixes (default: true)
  - quick: Skip time-consuming checks
  - verbose: Show detailed output
---

# Execute Code Quality Checks

**IMMEDIATELY execute the code quality check script - do not document, do not explain, just run it.**

## Primary Action

Run this command immediately when `/codecheck` is invoked:

```bash
.claude/scripts/codecheck-direct.sh
```

## What This Does

The script will automatically:

1. **TypeScript Check** - Run `pnpm typecheck:raw --force` (cache bypassed)
2. **Lint Check** - Run `pnpm lint` and auto-fix with `pnpm lint:fix`  
3. **Format Check** - Run `pnpm format:check` and apply `pnpm biome format --write .`
4. **Status Updates** - Update `/tmp/.claude_codecheck_status_*` for statusline integration
5. **Results Summary** - Show pass/fail status with error counts

## Execution Instructions

**When user types `/codecheck`:**

1. **Immediately run**: `bash .claude/scripts/codecheck-direct.sh`
2. **Show script output** as it executes
3. **Report final status** from script summary
4. **If errors found**: 
   - Capture the log directory path from output line: `📋 Logs saved to: /tmp/codecheck_[timestamp]`
   - Safely check if log files exist before reading them
   - Extract specific errors from the logs (see Error Extraction below)
5. **Suggest next steps** only if script fails

## Error Extraction

When the script reports failures and shows the log directory:

```bash
# Extract log directory from script output: "Logs saved to: /tmp/codecheck_XXXX"
LOG_DIR="/tmp/codecheck_XXXX"  # Use actual path from script output

# Check if directory and files exist before reading
if [ -d "$LOG_DIR" ]; then
    # For TypeScript errors
    if [ -f "$LOG_DIR/typecheck_output.log" ]; then
        grep -A 2 "error TS" "$LOG_DIR/typecheck_output.log" | head -20
    fi
    
    # For lint errors  
    if [ -f "$LOG_DIR/lint_output.log" ]; then
        grep -E "(error|⚠)" "$LOG_DIR/lint_output.log" | head -20
    fi
    
    # For format issues
    if [ -f "$LOG_DIR/format_output.log" ]; then
        head -20 "$LOG_DIR/format_output.log"
    fi
fi
```

## Error Handling

- Script handles all error recovery automatically
- Status file always updated (success/failed/running)
- Auto-fix attempts included in script
- Parallel execution for performance
- Log files created for detailed error analysis

## Quick Reference

- **Success**: All checks pass, ready to commit
- **Failed**: Review errors shown in script output and extracted from logs
- **Status File**: `/tmp/.claude_codecheck_status_${GIT_ROOT//\//_}`
- **Logs**: Saved to `/tmp/codecheck_${TIMESTAMP}/` (path shown in script output)

**Critical**: This is an execution command, not documentation. Run the script immediately when invoked, and read logs safely when errors are reported.