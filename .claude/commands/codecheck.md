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
4. **If errors found**: List them clearly from script output
5. **Suggest next steps** only if script fails

## Error Handling

- Script handles all error recovery automatically
- Status file always updated (success/failed/running)
- Auto-fix attempts included in script
- Parallel execution for performance

## Quick Reference

- **Success**: All checks pass, ready to commit
- **Failed**: Review errors shown in script output
- **Status File**: `/tmp/.claude_codecheck_status_${GIT_ROOT//\//_}`
- **Logs**: Saved to `/tmp/codecheck_${TIMESTAMP}/`

**Critical**: This is an execution command, not documentation. Run the script immediately when invoked.