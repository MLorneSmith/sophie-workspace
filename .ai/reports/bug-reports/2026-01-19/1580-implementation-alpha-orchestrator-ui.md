# Bug Fix: Alpha Orchestrator UI - Event Ordering and Dev Server Issues

## ✅ Implementation Complete

Issue: #1580
Commit: `0edb3458c fix(tooling): resolve Alpha Orchestrator event ordering and dev server issues`

### Summary

Fixed three related issues in the Alpha Orchestrator UI:

1. **Event Accumulation Fix** - Events now limited to 10 (newest first) instead of accumulating to 30+ lines
   - Changed event handling in `ui/index.tsx:266-278` from appending to prepending
   - Events display in newest-first order to match Recent Events section behavior

2. **Event Ordering Fix** - SandboxColumn now displays most recent events
   - With prepend logic, `slice(0, 3)` correctly shows the 3 most recent events
   - Proper newest-first ordering maintained throughout event lifecycle

3. **Dev Server Health Check Improvement** - Port 3000 now properly verified before use
   - Changed `startDevServer()` in `sandbox.ts` to throw error on timeout instead of returning URL
   - Orchestrator gracefully handles failures and provides VS Code URL as fallback

### Files Changed

- `.ai/alpha/scripts/ui/index.tsx` - Event handling logic
- `.ai/alpha/scripts/lib/sandbox.ts` - Dev server startup
- `.ai/alpha/scripts/lib/orchestrator.ts` - Dev server integration
- `.ai/alpha/scripts/lib/__tests__/sandbox-devserver.spec.ts` - New tests (7 tests)
- `.ai/alpha/scripts/lib/__tests__/ui-event-ordering.spec.ts` - New tests (7 tests)

### Key Changes

#### 1. Event Ordering (ui/index.tsx:266-281)
```typescript
// Before: Appended events, kept last 10
const updated = [...existing, displayText]
    .filter((item, idx, arr) => arr.indexOf(item) === idx)
    .slice(-10);

// After: Prepends events (newest first), keeps first 10
if (existing.length > 0 && existing[0] === displayText) {
    return prev;
}
const updated = [displayText, ...existing].slice(0, 10);
```

#### 2. Dev Server Health Check (sandbox.ts:329-332)
```typescript
// Before: Returned URL even if health checks failed
return devServerUrl;

// After: Throws error if timeout reached
throw new Error(`Dev server failed to start...`);
```

#### 3. Orchestrator Error Handling (orchestrator.ts:1248-1274)
- Removed redundant 30-second wait (already handled by health checks)
- Added graceful fallback: still provides VS Code URL even if dev server fails
- Improved error logging with details

### Validation Results

✅ **All validation commands passed:**
- TypeScript type checking: 39 tasks successful
- Lint with auto-fix: 0 errors
- Format with auto-fix: Fixed 2 files (formatting)
- Unit tests: **269 tests passed** (262 existing + 7 new)

### Test Coverage

**New tests added:**
- `sandbox-devserver.spec.ts` - 7 tests for dev server health check logic
- `ui-event-ordering.spec.ts` - 7 tests for event ordering prepend logic

**Tests validate:**
- Event prepending maintains newest-first ordering
- Events limited to 10 items
- Duplicate event prevention
- Dev server health check retry logic
- Graceful error handling on timeout
- Orchestrator URL fallback behavior

### Technical Details

**Event Flow:**
1. WebSocket emits event (sandbox tool event)
2. Handler calls `formatEventForDisplay()`
3. New event prepended to front of array (newest first)
4. Array sliced to keep first 10 items only
5. SandboxColumn displays `slice(0, 3)` → shows 3 most recent

**Dev Server Startup:**
1. Fire off `nohup start-dev` process
2. Health check polls port for up to 30 seconds
3. Returns URL on success OR throws error on timeout
4. Orchestrator catches error and handles gracefully
5. Provides VS Code URL even if dev server failed

### Follow-up Items

None - All specified issues resolved and tested.

### Deviations from Plan

None - Implementation followed the exact plan from issue #1580.

---

*Implementation completed by Claude Opus 4.5*
