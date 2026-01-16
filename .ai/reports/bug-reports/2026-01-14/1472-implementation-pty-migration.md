## ✅ Implementation Complete

### Summary
- Migrated from `sandbox.commands.run()` to `sandbox.pty.create()` for real-time output streaming
- PTY allocates a real pseudo-terminal, forcing Node.js CLI tools to use line-buffered output
- Added comprehensive PTY lifecycle logging for debugging
- Removed unused `capturedStderr` variable (PTY combines stdout/stderr through terminal)
- Updated type annotation for execution result compatibility

### Key Changes
- **PTY Creation**: Uses `cols: 120, rows: 40` with proper env vars (`TERM=xterm-256color`, `FORCE_COLOR=1`, `CI=false`)
- **Command Execution**: Sends command via `pty.sendInput()` followed by `exit $?` to preserve exit code
- **Output Handling**: `onData` callback receives `Uint8Array`, decoded to string for processing
- **Logging**: Added markers for PTY creation, command input, wait, and completion with PID and exit code

### Files Changed
```
.ai/alpha/scripts/lib/feature.ts | 145 ++++++++++++++++++++++++++-------------
1 file changed, 96 insertions(+), 49 deletions(-)
```

### Commits
```
418f76c5f fix(tooling): migrate orchestrator from commands.run() to PTY for real-time output
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - All 39 packages passed
- `pnpm lint:fix` - No errors (1 pre-existing warning)
- `pnpm format:fix` - Applied formatting
- `pnpm --filter ./.ai/alpha/scripts test` - 53/53 tests passed

### Technical Notes
- PTY API from E2B SDK v2.8.2 uses flat `cols`/`rows` properties (not nested `size` object)
- `onData` callback receives raw `Uint8Array` buffer, decoded via `TextDecoder`
- PTY creates an interactive shell; command is sent with `\nexit $?\n` to exit on completion
- Timeout configured via `timeoutMs` in milliseconds (same as `commands.run()`)

### Follow-up Items
- Full orchestrator test run needed to verify fix in production E2B environment
- Monitor for any edge cases with PTY output handling (chunked data, slow startup)

---
*Implementation completed by Claude*
