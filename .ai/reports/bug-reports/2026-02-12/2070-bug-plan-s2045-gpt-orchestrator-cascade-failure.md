# Bug Fix: S2045 GPT Orchestrator Cascade Failure

**Related Diagnosis**: #2069 (REQUIRED)
**Severity**: critical
**Bug Type**: regression
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Typecheck scope too broad (checks all 45 packages instead of just `web`) combined with GPT behavioral non-compliance (tries to fix unrelated zod errors instead of implementing feature)
- **Fix Approach**: Scope typecheck to `pnpm --filter web`, fix prompt escaping, rebuild GPT E2B template with zod, add DNS retry logic
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Running `tsx spec-orchestrator.ts 2045 --provider gpt` completed with only 1/14 features (7% success rate). The primary root cause: when GPT runs `pnpm typecheck` in the sandbox, it discovers the orchestrator packages (which are unrelated to the feature being implemented) have a missing `zod` symlink. Instead of ignoring this, GPT tries to fix it via `pnpm install`, corrupting the workspace. After 3 retries, F1 is permanently failed, blocking 12/13 other features. Six compounding issues cascaded the failure:

1. **GPT Agent Distraction**: Spends entire context budget fixing pre-existing zod typecheck error instead of implementing feature
2. **Cascade Dependency**: 12/13 remaining features depend on F1 (the one that failed)
3. **E2B Template**: Missing `zod` symlink in `@slideheroes/orchestrator-ui` node_modules
4. **Typecheck Scope**: `pnpm typecheck` checks all 45 packages including irrelevant orchestrator code
5. **DNS Failure**: `Could not resolve host: github.com` prevents git push
6. **Prompt Escaping**: `git add <file1>` causes bash syntax error in mandatory rules

For full details, see diagnosis issue #2069.

### Solution Approaches Considered

#### Option 1: Comprehensive Multi-Layer Fix ⭐ RECOMMENDED

**Description**: Fix all 6 compounding issues in parallel with focus on the root cause (typecheck scope) first. This prevents recurrence of the entire cascade.

**Pros**:
- Addresses root cause (typecheck scope), preventing future GPT distraction
- Fixes template deficiency (zod symlink)
- Fixes prompt escaping that breaks git operations
- Adds DNS resilience for infrastructure robustness
- Prevents all 6 compounding issues from re-triggering together
- Results in stable orchestrator execution

**Cons**:
- Requires changes across 4 files + template rebuild
- More testing needed to validate each fix
- Higher complexity than single-issue fix

**Risk Assessment**: Medium - All fixes are straightforward, well-scoped changes. Template rebuild is automated. Typecheck scope change is low-risk (still validates the web package, just excludes irrelevant packages).

**Complexity**: Moderate - Multiple files but each change is surgical and well-understood.

#### Option 2: Minimal Immediate Fix (Typecheck Only)

**Description**: Fix only the typecheck scope issue, leaving DNS and prompt escaping for follow-up issues.

**Pros**:
- Quickest path to stability
- Lowest risk (single change, single focus)
- Can deploy immediately

**Cons**:
- Leaves DNS failures unresolved (will re-trigger in other runs)
- Leaves prompt escaping bug (git operations will fail in edge cases)
- Leaves template deficiency (zod symlink incomplete)
- Likely cascade failure on next S2045 run with different issue

**Why Not Chosen**: While faster, this leaves 3 known issues unresolved that will cause future failures. The comprehensive approach addresses all 6 issues with only 2x the effort but 10x the stability improvement.

#### Option 3: Skip Template Rebuild (Use Existing)

**Description**: Fix orchestrator code but skip rebuilding the GPT template (reuse existing template).

**Pros**:
- Avoids template rebuild step (5 minutes)
- Faster deployment

**Cons**:
- Zod symlink issue persists in template
- Next template instance will encounter same zod error
- Eventually GPT will encounter zod error again despite code fixes

**Why Not Chosen**: The template was built BEFORE zod was added to orchestrator packages. Reusing it guarantees the issue will recur on next feature run. Must rebuild.

### Selected Solution: Comprehensive Multi-Layer Fix

**Justification**: The diagnosis clearly shows this is not a one-issue problem. Six compounding issues created a cascade failure. Fixing only the root cause (typecheck scope) leaves 3 known infrastructure issues unresolved. The comprehensive approach addresses all 6 issues with moderate additional effort but dramatically improves system resilience. Future spec runs will be significantly more stable.

**Technical Approach**:

1. **Scope typecheck to web package only** (feature.ts, sandbox.ts)
   - Change `pnpm typecheck` → `pnpm --filter web typecheck`
   - Rationale: GPT is implementing web features. Orchestrator package health is irrelevant to feature implementation. This removes the distraction vector.

2. **Fix prompt escaping in mandatory rules** (provider.ts)
   - Replace `git add <file1> <file2>` with actual examples: `git add src/file.ts apps/file.tsx`
   - Rationale: Bash interprets `<file1>` as input redirection, causing syntax error. Examples prevent confusion.

3. **Rebuild GPT E2B template**
   - Run `pnpm e2b:build:gpt-dev` to rebuild with zod included
   - Rationale: Template was built before zod was added. Must rebuild to include zod symlink.

4. **Add DNS retry logic to E2B template** (template bootstrap)
   - Add DNS retry with exponential backoff before git operations
   - Rationale: DNS failures prevent git push. Retry logic improves resilience.

**Architecture Changes** (if any):
- No architectural changes needed
- All changes are scoped to: validation layers (typecheck), instruction clarity (prompts), infrastructure templates (E2B)
- No breaking changes to feature execution flow

**Migration Strategy** (if needed):
- No migration needed. These are preventive fixes for future runs.
- Existing S2045 spec should be re-run after fixes (current implementation is irrecoverable due to cascaded F1 failure).

## Implementation Plan

### Affected Files

List files that need modification:

- `.ai/alpha/scripts/lib/feature.ts` - Change typecheck scope to web package only
- `.ai/alpha/scripts/lib/sandbox.ts` - Change typecheck scope to web package only (line 1536)
- `.ai/alpha/scripts/lib/provider.ts` - Fix prompt escaping in git add examples (line 47)
- `.ai/alpha/scripts/lib/template.ts` (or template builder) - Add DNS retry logic to bootstrap script
- Template configuration - Rebuild GPT template with `pnpm e2b:build:gpt-dev`

### New Files

If new files are needed:
- None required. All changes are to existing files and automated template rebuild.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Identify and fix typecheck scope in feature execution (foundational)

This is the PRIMARY root cause. Fixing this removes the main distraction vector that caused GPT to waste context on unrelated errors.

- Open `.ai/alpha/scripts/lib/feature.ts` and find where typecheck is run (search for "pnpm typecheck")
- Change `pnpm typecheck` to `pnpm --filter web typecheck`
- Rationale: Orchestrator packages are not relevant to feature implementation. Excluding them prevents GPT from getting distracted.

#### Step 2: Fix typecheck scope in sandbox setup

- Open `.ai/alpha/scripts/lib/sandbox.ts` line 1536
- Find the command: `` `cd ${WORKSPACE_DIR} && pnpm typecheck` ``
- Change to: `` `cd ${WORKSPACE_DIR} && pnpm --filter web typecheck` ``
- This ensures sandbox verification also validates only the web package

**Why this step first**: Typecheck scope is the root cause. It must be fixed before other changes. This is the bottleneck fix.

#### Step 3: Fix prompt escaping in mandatory git rules

- Open `.ai/alpha/scripts/lib/provider.ts` around line 47
- Find the text: `"Always stage specific files: \`git add <file1> <file2> ...\`. "`
- Replace with: `"Always stage specific files: \`git add src/page.tsx apps/web/lib/file.ts\`. "`
- Rationale: Examples prevent bash from interpreting `<file>` as redirection operators

**Why this step now**: Fixes the git escaping bug that could cause failed commits. Prevents edge case failures.

#### Step 4: Add DNS retry logic to E2B template bootstrap

- Locate the E2B template bootstrap script (likely in `.ai/alpha/scripts/lib/template.ts` or template configuration)
- Add DNS retry function:
  ```bash
  retry_dns_command() {
    local max_attempts=3
    local timeout_sec=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
      echo "DNS retry attempt $attempt/$max_attempts..."
      if timeout $timeout_sec "$@"; then
        return 0
      fi
      if [ $attempt -lt $max_attempts ]; then
        sleep $((3 * attempt))  # Exponential backoff: 3s, 6s, 9s
      fi
      ((attempt++))
    done

    return 1
  }
  ```
- Use before git operations: `retry_dns_command git push`
- Rationale: DNS failures are transient. Retry logic improves robustness.

#### Step 5: Rebuild GPT E2B template with zod

- Run: `pnpm e2b:build:gpt-dev`
- Wait for build to complete (~5-10 minutes)
- Verify output shows zod is included in node_modules
- Rationale: Template was built before zod was added. Must rebuild to include zod symlink for future runs.

**Why this step last**: This is a long-running operation. Do it after code changes are validated.

#### Step 6: Add/update tests for validation

Test the fixes before running full orchestrator:

- Add unit test for typecheck scope change: verify `pnpm --filter web typecheck` executes without errors
- Add integration test: verify orchestrator runs F1 successfully with new typecheck scope
- Add edge case test: verify DNS retry logic recovers from transient DNS failure
- Add prompt test: verify git escaping examples don't cause bash syntax errors

#### Step 7: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test orchestrator with S2045 spec (partial run)
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Typecheck command construction - verify `pnpm --filter web typecheck` is generated correctly
- ✅ Prompt escaping - verify git commands don't contain shell redirection operators
- ✅ DNS retry logic - verify retry function works with mocked failures
- ✅ Template build - verify GPT template includes zod after rebuild
- ✅ Regression test: Original bug should not reoccur (GPT should not get distracted by zod errors)

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/feature.spec.ts` - Typecheck scope test
- `.ai/alpha/scripts/lib/__tests__/provider.spec.ts` - Prompt escaping test
- `.ai/alpha/scripts/lib/__tests__/sandbox.spec.ts` - DNS retry test

### Integration Tests

Test the complete flow:

- Run orchestrator with small spec (3-4 features)
- Verify all features execute without typecheck distraction
- Verify git commits succeed (no escaping errors)
- Verify template setup includes zod symlink

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator-integration.spec.ts` - Full orchestrator flow

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm --filter web typecheck` manually - should pass (no orchestrator errors)
- [ ] Run small orchestrator test with GPT provider: `tsx spec-orchestrator.ts 2045 --provider gpt --features 1`
- [ ] Verify F1 executes successfully (not distracted by zod errors)
- [ ] Check sandbox logs for "pnpm --filter web typecheck" command (not full typecheck)
- [ ] Verify git operations succeed with prompt examples (no syntax errors)
- [ ] Rebuild GPT template: `pnpm e2b:build:gpt-dev` and verify zod is in output
- [ ] Test DNS retry with simulated failure: `retry_dns_command false` should retry 3 times and fail

## Risk Assessment

**Overall Risk Level**: Medium

**Potential Risks**:

1. **Typecheck scope change breaks validation for orchestrator packages**
   - Likelihood: Low
   - Impact: High (orchestrator validation skipped)
   - Mitigation: Orchestrator packages are development-only tools, not shipped to production. Features should only be validated in web package. Orchestrator health is checked separately by orchestrator tests. No user-facing code affected.

2. **Template rebuild fails or doesn't include zod**
   - Likelihood: Low
   - Impact: Medium (same issue recurs)
   - Mitigation: Template build is automated and tested. Verify output shows zod in node_modules. Test template with mock feature run.

3. **DNS retry logic causes slowdown or hangs**
   - Likelihood: Very Low
   - Impact: Low (feature runs slower)
   - Mitigation: Retry logic only activates on DNS failure (rare). Normal case runs immediately. Max 9 seconds overhead on DNS failure.

4. **Prompt escaping examples confuse GPT agent**
   - Likelihood: Very Low
   - Impact: Low (GPT still has clear instructions)
   - Mitigation: Examples are crystal clear (actual file paths instead of placeholders). Instructions explicitly state "Always stage specific files".

**Rollback Plan**:

If this fix causes issues in production:

1. Revert commits for feature.ts, sandbox.ts, provider.ts
2. Rollback GPT template to previous version: `pnpm e2b:build:gpt-dev --use-cached`
3. Re-run orchestrator with Claude provider instead of GPT: `tsx spec-orchestrator.ts 2045 --provider claude`
4. Investigate root cause (may require additional diagnosis)

**Monitoring** (if needed):
- Monitor orchestrator feature completion rate for GPT provider (should improve from 7% to >80%)
- Monitor DNS failure frequency in sandbox logs (should remain low)
- Monitor typecheck execution time (should decrease due to smaller scope)

## Performance Impact

**Expected Impact**: Positive

- **Typecheck time**: Decrease by ~60% (checking 1 package instead of 45)
- **Orchestrator stability**: Increase from 7% to >80% (based on diagnosis assessment)
- **Feature execution time**: Slight decrease due to faster typecheck
- **DNS resilience**: Improve recovery from transient DNS failures

**Performance Testing**:
- Measure typecheck time before/after: `time pnpm --filter web typecheck` vs `time pnpm typecheck`
- Measure orchestrator success rate before/after: track feature completion percentage
- Measure DNS failure recovery: inject DNS failure and verify retry succeeds

## Security Considerations

**Security Impact**: None

- Typecheck scope change: No security implications (still validates web package, excludes development tools)
- Prompt escaping fix: Improves security (prevents unintended shell expansion)
- DNS retry logic: No security implications (retry is idempotent and server-side)
- Template rebuild: No security implications (rebuilds existing template with latest dependencies)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Verify the bug exists by checking typecheck scope
pnpm typecheck 2>&1 | grep -c "@slideheroes/orchestrator-ui"

# Expected Result: > 0 (orchestrator package is being checked)
# This confirms orchestrator packages are included in typecheck
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm --filter web typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (if applicable)
pnpm test:unit .ai/alpha/scripts/lib/__tests__/feature.spec.ts
pnpm test:unit .ai/alpha/scripts/lib/__tests__/provider.spec.ts
pnpm test:unit .ai/alpha/scripts/lib/__tests__/sandbox.spec.ts

# Build
pnpm build

# Verify template rebuild completed
ls -la .ai/alpha/scripts/lib/template.ts

# Run small orchestrator test
tsx .ai/alpha/scripts/spec-orchestrator.ts 2045 --provider gpt --max-features 1

# Manual verification - check logs for:
# - "pnpm --filter web typecheck" (not full typecheck)
# - Successful F1 execution
# - Git operations succeeded
```

**Expected Result**: All commands succeed, bug is resolved, zero regressions. Orchestrator completes > 80% of features for GPT provider.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run orchestrator with Claude provider (baseline)
tsx .ai/alpha/scripts/spec-orchestrator.ts 2045 --provider claude

# Run orchestrator with GPT provider (should now succeed)
tsx .ai/alpha/scripts/spec-orchestrator.ts 2045 --provider gpt

# Compare success rates (GPT should match or exceed Claude)
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**. All fixes use existing tools and libraries.

### Dependencies on Other Issues

- **#2068** (Zod null rejection) - Not directly related but zod-related
- **#2065** (UI crash from GPT) - Not directly related but GPT-related
- **#2060** (false completion) - Not directly related but GPT-related

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**:
- Rebuild GPT template before deployment: `pnpm e2b:build:gpt-dev`
- No database migrations needed
- No breaking changes to API or feature execution

**Feature flags needed**: No

**Backwards compatibility**: Maintained (all changes are internal validation layer and template)

## Success Criteria

The fix is complete when:
- [ ] Typecheck scope changed to `pnpm --filter web typecheck` in feature.ts and sandbox.ts
- [ ] Prompt escaping fixed with actual examples in provider.ts
- [ ] DNS retry logic implemented in template bootstrap
- [ ] GPT E2B template rebuilt with `pnpm e2b:build:gpt-dev`
- [ ] All validation commands pass
- [ ] Unit tests added and passing
- [ ] Integration test passes (orchestrator runs > 80% of features)
- [ ] Manual testing checklist complete
- [ ] Zero regressions detected
- [ ] Orchestrator success rate improved from 7% to >80%

## Notes

**Key Learnings**:
- Typecheck scope matters: Unrelated packages can distract GPT agents
- Prompt escaping is critical: Shell metacharacters must be escaped in string literals
- Template versions matter: Templates must be rebuilt when dependencies change
- DNS resilience is important: Transient failures should trigger retries, not cascade

**Related Documentation**:
- Diagnosis: #2069
- Prior GPT issues: #1937, #2048, #2059, #2060
- Alpha orchestrator assessment: `.ai/reports/research-reports/2026-02-06/alpha-orchestrator-comprehensive-assessment.md`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #2069*
