# Bug Fix: GPT Provider Review Sandbox and Dev Server Failures

**Related Diagnosis**: #1923
**Severity**: high
**Bug Type**: integration
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: E2B sandbox template differences between Claude and GPT providers cause `pnpm install --frozen-lockfile` timeouts and silent failures during review sandbox creation
- **Fix Approach**: Add provider-specific handling in sandbox creation with retry logic, improved error logging, and template validation
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha orchestrator with `--provider gpt` fails during the completion phase:
1. Review sandbox creation fails (likely due to `--frozen-lockfile` timeout or template incompatibility)
2. Dev server never starts (cascading failure from #1)
3. Errors are silently caught, leaving `sandbox_ids: []` in manifest
4. Orchestrator shows 18/18 features "complete" but actual validation never ran

The `slideheroes-gpt-agent-dev` template may have different tooling versions, dependency conflicts, or missing build cache that causes dependency installation to timeout or fail.

For full details, see diagnosis issue #1923.

### Solution Approaches Considered

#### Option 1: Provider-Specific Install Configuration ⭐ RECOMMENDED

**Description**: Detect GPT provider during sandbox creation and use provider-appropriate flags:
- Skip `--frozen-lockfile` for GPT (use `--no-frozen-lockfile` with integrity checks)
- Add explicit timeout handling with configurable delays
- Pre-validate template freshness before install
- Implement exponential backoff retry (up to 3 attempts)

**Pros**:
- Addresses root cause of timeouts directly
- Maintains performance for Claude provider (no impact)
- Provides better error diagnostics with detailed logging
- Allows for future provider-specific optimizations
- Works with existing template without rebuilding

**Cons**:
- Requires understanding of template-specific constraints
- May mask underlying template issues if not paired with validation
- Need to maintain provider-specific logic

**Risk Assessment**: medium - Changes are isolated to sandbox creation path, well-tested before production

**Complexity**: moderate - 150-200 lines of code with retry logic and logging

#### Option 2: Rebuild GPT Template with Consistent Tooling

**Description**: Rebuild `slideheroes-gpt-agent-dev` template to match Claude template exactly:
- Rebuild from fresh base with identical Node/pnpm versions
- Pre-cache all dependencies
- Run `pnpm install` during template build
- Verify template with test sandbox creation

**Pros**:
- Eliminates provider differences permanently
- Prevents future similar issues
- Template consistency across providers
- Clean long-term solution

**Cons**:
- Takes 20-30 minutes to rebuild template
- Requires E2B API access and template management
- May not catch all environment-specific issues
- Doesn't help if issue is environment-based

**Why Not Chosen**: Too slow for immediate fix; can be paired with Option 1 for long-term consistency

#### Option 3: Skip Review Sandbox for GPT Provider

**Description**: Detect GPT provider and skip review sandbox creation entirely:
- Log warning that review sandbox unavailable for GPT
- Continue with validation and manifest completion
- Document as limitation in GPT provider support

**Pros**:
- Fastest implementation (10 minutes)
- Guaranteed to work
- Unblocks orchestrator completion

**Cons**:
- Loses human review capability for GPT
- Degrades test quality and visibility
- User experience regression
- Masks underlying template issue

**Why Not Chosen**: Too destructive; loses critical review functionality

### Selected Solution: Option 1 - Provider-Specific Install Configuration

**Justification**:
This approach directly addresses the root cause (install timeout/failure) while maintaining existing functionality for Claude. It's surgical, testable, and provides immediate relief without sacrificing review capabilities. The retry logic and detailed logging will help diagnose future template issues and inform a proper template rebuild (Option 2) as a follow-up.

**Technical Approach**:
1. Add provider detection in `createReviewSandbox()` using `provider` field from manifest
2. Implement conditional install flags: GPT uses `--no-frozen-lockfile --integrity-level lower` to relax constraints
3. Add pre-install validation: verify `/home/user/project` exists and has `package.json`
4. Implement exponential backoff retry: 1st attempt (0s wait), 2nd (3s), 3rd (9s)
5. Add detailed logging for each install phase
6. Surface install timeout as explicit error instead of silent failure
7. Add environment variables for timeout tuning per provider

**Architecture Changes** (none):
- Only internal changes to library functions
- No schema or API changes
- Backward compatible with existing code

**Migration Strategy**:
- No migration needed; fix is transparent to existing code
- Environment variables are optional with sensible defaults

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/lib/sandbox.ts` - `createReviewSandbox()` function needs provider detection and install flag logic
- `.ai/alpha/scripts/lib/completion-phase.ts` - `setupReviewSandbox()` needs better error propagation for diagnostics
- `.ai/alpha/scripts/lib/types.ts` - Add provider type definitions if not present
- `apps/web/.env.example` - Document new optional env vars

### New Files

If new files are needed:
- No new files needed; refactoring existing functions

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Type Definitions and Constants

<describe what this step accomplishes: establishes provider-specific configuration options>

- Read `.ai/alpha/scripts/lib/types.ts` to understand current type structure
- Add `SandboxProvider` type: `'claude' | 'gpt'`
- Add `ProviderInstallConfig` interface with install flags, timeout, retry settings
- Create `PROVIDER_INSTALL_CONFIGS` object with Claude (frozen-lockfile) and GPT (no-frozen-lockfile) configurations
- Add timeout constants: `INSTALL_TIMEOUT_MS = 5 * 60 * 1000` (5 min), with override per provider

**Why this step first**: Establishes the structure for provider-specific logic, makes rest of implementation clearer

#### Step 2: Implement Pre-Install Validation

<describe what this step accomplishes: catches template issues early before attempting install>

- Create `validateSandboxEnvironment()` function to check:
  - `/home/user/project` directory exists
  - `package.json` file is present
  - `.pnpmfile.cjs` or similar config exists (if needed)
  - Node.js version via `node --version`
- Add logging for each validation step
- Return structured result: `{ valid: boolean, errors: string[] }`
- Call this before attempting install in `createReviewSandbox()`
- If validation fails, throw meaningful error with diagnostic info

#### Step 3: Implement Provider-Aware Install Function

<describe what this step accomplishes: executes install with provider-specific flags and retry logic>

- Create `executeInstallWithRetry()` function that:
  - Takes provider, max retries (default 3), and timeout
  - Selects install flags from `PROVIDER_INSTALL_CONFIGS[provider]`
  - Executes: `pnpm install [flags] --timeout [timeout]ms`
  - Catches timeout errors specifically and retries with exponential backoff
  - Logs each attempt: "Install attempt 1/3...", "Install attempt 2/3 (retrying after timeout)..."
  - After all retries exhausted, throws detailed error with:
    - Provider used
    - Exact flags attempted
    - Timeout value
    - Number of retries
    - Last error message
- Implement as separate, testable function (pure function approach)

#### Step 4: Refactor `createReviewSandbox()` to Use New Logic

<describe what this step accomplishes: integrates provider-specific handling into main sandbox creation>

- Read current `createReviewSandbox()` implementation in `.ai/alpha/scripts/lib/sandbox.ts`
- Extract provider from manifest if available (add default handling for backward compatibility)
- Call `validateSandboxEnvironment()` before install
- Replace direct `pnpm install` call with `executeInstallWithRetry()`
- Update error handling to propagate detailed errors instead of catching silently
- Add detailed logging:
  - "Creating review sandbox with provider: {provider}"
  - "Pre-install validation: {validation results}"
  - "Executing install with flags: {flags}"
  - "Install successful in {duration}ms"
- Wrap in try-catch that logs full error stack and re-throws

#### Step 5: Improve Error Propagation in `setupReviewSandbox()`

<describe what this step accomplishes: ensures errors surface properly instead of being silently caught>

- Read `setupReviewSandbox()` in `.ai/alpha/scripts/lib/completion-phase.ts`
- Current code likely catches and silently logs errors
- Change to:
  - Log error at ERROR level (not debug/info)
  - Include error stack trace
  - Record in manifest: `review_sandbox_error: {error details}`
  - Mark manifest as incomplete: `validation_status: 'incomplete-sandbox-error'`
  - Throw error (don't continue silently)
- Add validation to fail orchestrator if review sandbox is required but fails
- Update manifest schema to include error field

#### Step 6: Add Environment Variable Support

<describe what this step accomplishes: allows operators to tune timeouts per environment>

- Add to `.env.example`:
  - `ALPHA_SANDBOX_INSTALL_TIMEOUT_MS` - global timeout override
  - `ALPHA_SANDBOX_PROVIDER_INSTALL_TIMEOUT_MS` - provider-specific timeout (e.g., `ALPHA_SANDBOX_GPT_INSTALL_TIMEOUT_MS`)
  - `ALPHA_SANDBOX_INSTALL_MAX_RETRIES` - retry count (default 3)
- Read from `process.env` in `PROVIDER_INSTALL_CONFIGS` loader
- Document in comments: expected values, defaults, when to adjust

#### Step 7: Add Unit Tests

<describe the testing strategy: validates provider detection and install retry logic>

- Create `sandbox.test.ts` (or add to existing test file):
  - Test `validateSandboxEnvironment()` with valid/invalid template states
  - Test `executeInstallWithRetry()` success path
  - Test retry logic: simulate timeout on attempt 1, success on attempt 2
  - Test max retries exceeded: should throw after all retries
  - Test provider detection: Claude vs GPT flag selection
  - Mock `exec()` to simulate install commands
  - Mock logging to verify correct log messages

- Create `completion-phase.test.ts`:
  - Test `setupReviewSandbox()` with successful sandbox creation
  - Test error propagation: sandbox creation failure should not be silent
  - Test manifest updates: error field should be populated on failure
  - Verify error is logged and re-thrown (not swallowed)

#### Step 8: Add Integration Test (Optional but Recommended)

<describe what this step accomplishes: validates end-to-end sandbox creation with real E2B>

- Create minimal integration test that:
  - Creates actual E2B sandbox from template
  - Runs install with both Claude and GPT configurations
  - Verifies install succeeds or timeout is caught
  - Records timing and error details
- Run manually before deployment to catch template-specific issues
- Document in test file: "Run this test to validate template changes"

#### Step 9: Update Documentation and Comments

<describe what this step accomplishes: helps future maintainers understand provider-specific logic>

- Add code comments explaining:
  - Why GPT template needs different install flags
  - When/why retries happen
  - Timeout expectations per provider
- Update `.ai/alpha/scripts/README.md` if it exists:
  - Document provider differences
  - Troubleshooting section: "Review sandbox timeouts"
  - Environment variable tuning guide

#### Step 10: Validation and Testing

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test all edge cases
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `validateSandboxEnvironment()` with valid template (all checks pass)
- ✅ `validateSandboxEnvironment()` with missing `package.json` (fails early)
- ✅ `executeInstallWithRetry()` success on first attempt (Claude provider)
- ✅ `executeInstallWithRetry()` success on second attempt after timeout (GPT provider with retry)
- ✅ `executeInstallWithRetry()` all retries exhausted (throws detailed error)
- ✅ Provider detection: Claude config uses frozen-lockfile
- ✅ Provider detection: GPT config uses no-frozen-lockfile
- ✅ Error propagation: `setupReviewSandbox()` throws on sandbox failure (not silent)
- ✅ Manifest update: error field populated on failure
- ✅ Environment variable override: custom timeout applied

**Test files**:
- `.ai/alpha/scripts/__tests__/sandbox.test.ts` - Sandbox creation unit tests
- `.ai/alpha/scripts/__tests__/completion-phase.test.ts` - Phase completion error handling

### Integration Tests

<if needed, describe integration test scenarios>

Optional but recommended:
- Create E2B sandbox from actual template
- Execute install with both providers
- Verify install timeout is properly handled
- Record timing metrics

**Test files**:
- `.ai/alpha/scripts/__tests__/sandbox.integration.test.ts` - Real E2B sandbox tests

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run Alpha with `--provider claude` - review sandbox creates successfully, dev server starts
- [ ] Run Alpha with `--provider gpt` - review sandbox creates with retry (or fails gracefully if timeout)
- [ ] Verify manifest has review sandbox ID after successful creation
- [ ] Verify manifest has error details if sandbox creation fails
- [ ] Check logs show: install attempt count, provider used, install flags
- [ ] Artificially set short timeout `ALPHA_SANDBOX_INSTALL_TIMEOUT_MS=5000` and verify retry logic triggers
- [ ] Test max retries exceeded: verify detailed error message (not silent failure)
- [ ] Verify dev server starts after sandbox creation succeeds
- [ ] Verify no regressions for Claude provider (must be faster than GPT)

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **Install Flags Change Behavior**: Using `--no-frozen-lockfile` for GPT may install different versions than expected
   - **Likelihood**: medium
   - **Impact**: medium (could cause runtime issues)
   - **Mitigation**: Use `--integrity-level lower` to still validate packages, add pre-install hash check, extensive integration testing

2. **Retry Logic Masks Real Issues**: If install keeps timing out, retries just delay failure
   - **Likelihood**: medium
   - **Impact**: low (just adds delay, still fails)
   - **Mitigation**: Log detailed metrics on each retry, alert ops if retries consistently needed, plan template rebuild

3. **Timeout Too Short**: 5 min timeout might not be enough for slow networks
   - **Likelihood**: low
   - **Impact**: low (easily tuned via env var)
   - **Mitigation**: Make timeout configurable per provider, document expected install time

4. **Logging Overhead**: Detailed logging in install loop might impact performance
   - **Likelihood**: low
   - **Impact**: low (I/O bound operation anyway)
   - **Mitigation**: Use appropriate log levels, no performance concerns expected

**Rollback Plan**:

If this fix causes issues in production:
1. Revert `.ai/alpha/scripts/lib/sandbox.ts` to previous version
2. Update manifest to mark GPT provider as unsupported (disable in orchestrator)
3. Rebuild GPT template with frozen lockfile included (Option 2 from design)
4. Re-enable GPT provider once template is rebuilt

**Monitoring** (recommended):
- Monitor sandbox creation success rate per provider
- Track install timeout frequency (should decrease)
- Alert if GPT provider consistently needs retries
- Log install duration per provider for trend analysis

## Performance Impact

**Expected Impact**: minimal

- Claude provider: no impact (uses same frozen-lockfile logic as before)
- GPT provider: slightly slower (one-time install penalty during orchestration)
- Retry logic: adds 3-12 seconds per failed install (acceptable for one-time op)
- Logging: negligible overhead (structured JSON, single write per phase)

**Performance Testing**:
- Measure install time for both providers (expect GPT ~5-10% slower due to relaxed constraints)
- Verify retry logic doesn't cause cascading timeouts (exponential backoff prevents this)
- Confirm dev server startup time unchanged

## Security Considerations

**Security Impact**: none

- Install flags don't affect package authenticity (still validates hashes)
- Error logging doesn't expose sensitive data (no API keys, tokens in logs)
- Retry logic has backoff to prevent DoS-style attacks
- Provider detection based on manifest (trusted source)

**No security review needed** - no cryptographic, auth, or data access changes

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run Alpha with GPT provider
cd apps/web
pnpm --filter web alpha:implement --provider gpt --manifest-path .ai/alpha/specs/S1918-Spec-user-dashboard/spec-manifest.json
```

**Expected Result**: Review sandbox creation fails silently, manifest shows `sandbox_ids: []`, orchestrator completes without review

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit sandbox.test completion-phase.test

# Build
pnpm build

# Manual verification - Claude provider (should work as before)
cd apps/web && pnpm --filter web alpha:implement --provider claude --manifest-path .ai/alpha/specs/S1918-Spec-user-dashboard/spec-manifest.json

# Manual verification - GPT provider (should succeed with retries or fail gracefully)
cd apps/web && pnpm --filter web alpha:implement --provider gpt --manifest-path .ai/alpha/specs/S1918-Spec-user-dashboard/spec-manifest.json

# Check logs for proper error handling
grep -i "sandbox\|install\|timeout" .ai/alpha/scripts/logs/*.log

# Verify manifest structure
cat .ai/alpha/specs/S1918-Spec-user-dashboard/spec-manifest.json | jq '.sandbox_ids, .review_sandbox_error'
```

**Expected Result**:
- Claude provider: sandbox creates, review dev server starts, validation runs
- GPT provider: sandbox creates (possibly with retry) or fails with clear error message
- No silent failures - errors are logged and surfaced in manifest
- All validation commands pass

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify Claude provider performance unchanged
time pnpm --filter web alpha:implement --provider claude [rest of args]

# Check for any new error logs
grep -i "error\|fatal" .ai/alpha/scripts/logs/*.log | wc -l  # Should not increase
```

## Dependencies

### New Dependencies (if any)

No new npm dependencies required - uses existing `pnpm`, `exec`, logging utilities.

**Dependencies added**: None

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No database migrations needed
- No config changes required (env vars are optional)
- Can deploy independently without coordinating with other changes
- Recommend deploying to staging environment first for GPT provider testing

**Feature flags needed**: no

**Backwards compatibility**: maintained
- Claude provider behavior unchanged
- GPT provider support enhanced (previously broken)
- Environment variables optional with sensible defaults
- Manifest schema extended but backward compatible (new optional `review_sandbox_error` field)

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Review sandbox creates successfully for both Claude and GPT providers
- [ ] All unit tests pass (sandbox, completion-phase)
- [ ] Integration tests pass (actual E2B sandbox creation)
- [ ] Zero regressions for Claude provider
- [ ] GPT provider errors are surfaced (not silent)
- [ ] Manifest properly tracks sandbox IDs and errors
- [ ] Dev server starts after successful sandbox creation
- [ ] Manual testing checklist complete
- [ ] Detailed logging aids diagnostics
- [ ] Code review approved

## Notes

**Future Follow-Up**:
After this fix stabilizes, schedule template rebuild (Option 2) to ensure GPT template has:
- Identical Node.js and pnpm versions as Claude template
- Pre-cached dependencies to eliminate install step
- Verified `pnpm install` during template build process
- Load tests to ensure template consistency

**Related Issues**:
- Diagnosis issue #1923 for context and telemetry data
- S1918 specification for Alpha orchestrator context

**Documentation References**:
- `.ai/ai_docs/context-docs/infrastructure/e2b-sandbox.md` - E2B template structure and debugging
- `.ai/alpha/scripts/README.md` - Alpha orchestrator architecture (if exists)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1923*
