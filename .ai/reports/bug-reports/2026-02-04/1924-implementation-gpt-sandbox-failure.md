## ✅ Implementation Complete

### Summary
- Added provider-specific pnpm install configuration for E2B sandboxes
- Implemented pre-install validation to catch template issues early
- Added exponential backoff retry logic (up to 3 attempts with 3s, 9s, 27s delays)
- GPT provider now uses `--no-frozen-lockfile` to handle stale dependency cache
- Claude provider continues to use strict `--frozen-lockfile` validation
- Improved error propagation with detailed logging and event emission
- Added configurable environment variables for timeout and retry tuning

### Files Changed
```
.ai/alpha/scripts/lib/completion-phase.ts          |  73 ++++-
.ai/alpha/scripts/lib/event-emitter.ts             |   2 +
.ai/alpha/scripts/lib/sandbox.ts                   | 364 ++++++++++++++++++++-
.ai/alpha/scripts/types/index.ts                   |   3 +
.ai/alpha/scripts/types/orchestrator.types.ts      |  62 ++++
apps/web/.env.local.example                        |  14 +-
```

### Key Changes
1. **Type Definitions** (`orchestrator.types.ts`):
   - `ProviderInstallConfig` - Provider-specific install flags and timeout settings
   - `SandboxValidationResult` - Pre-install validation result structure
   - `InstallAttemptResult` - Install attempt result with diagnostics

2. **Sandbox Module** (`sandbox.ts`):
   - `getProviderInstallConfig()` - Returns provider-specific install configuration
   - `validateSandboxEnvironment()` - Pre-install validation (workspace, package.json, lockfile, node, pnpm)
   - `executeInstallWithRetry()` - Exponential backoff retry with detailed logging
   - Updated `createReviewSandbox()` to use provider-aware install logic

3. **Completion Phase** (`completion-phase.ts`):
   - Enhanced `setupReviewSandbox()` with detailed error logging and stack traces
   - Added `review_sandbox_created` event type for success tracking
   - Increased timeout to 20 minutes to accommodate GPT retry logic

4. **Environment Variables** (`.env.local.example`):
   - `ALPHA_SANDBOX_INSTALL_TIMEOUT_MS` - Install timeout (default: 1200000ms = 20min)
   - `ALPHA_SANDBOX_INSTALL_MAX_RETRIES` - Retry count (default: 3)

### Commits
```
8da27c701 fix(tooling): add provider-specific install handling for GPT sandbox
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - TypeScript compilation successful
- `pnpm lint:fix` - Linting passed (1 file auto-fixed)
- `pnpm format:fix` - Formatting passed (2 files auto-fixed)

### Follow-up Items
- Consider rebuilding GPT E2B template with pre-cached dependencies (Option 2 from plan) for long-term consistency
- Monitor sandbox creation success rate per provider after deployment
- Track install timeout frequency to inform template optimization

---
*Implementation completed by Claude Opus 4.5*
