# Bug Fix: Orchestrator sandboxes blocked after restart - missing --reset option

**Related Diagnosis**: #1702 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Orchestrator lacks `--reset` option to clear stale manifest state after interrupted runs; manifest state becomes inconsistent with actual feature completion status
- **Fix Approach**: Add `--reset` CLI flag to delete existing spec-manifest.json before loading, forcing regeneration from scratch
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

After the orchestrator is interrupted (hung, crashed, or manually stopped) and then restarted with `--force-unlock`, the spec-manifest.json retains stale state:
- `next_feature_id: null` even though features are available
- `last_completed_feature_id` doesn't match actual completed work
- Sandboxes appear "blocked by dependencies" when they should pick up available work

The workaround is to manually delete `spec-manifest.json`, but this is error-prone and not documented. Users must remember to delete the file before restarting.

For full details, see diagnosis issue #1702.

### Solution Approaches Considered

#### Option 1: Add `--reset` CLI Flag ⭐ RECOMMENDED

**Description**: Add a new `--reset` flag that deletes the existing spec-manifest.json file before the orchestrator loads/generates the manifest. This forces regeneration from the task.json files found in feature directories, ensuring a clean slate.

**Pros**:
- Solves the root problem: users can now explicitly reset manifest state
- Simple to implement: 3-5 lines in CLI parsing + 2 lines in orchestration logic
- No breaking changes: existing behavior unchanged, flag is optional
- Mirrors common CLI patterns (git reset, npm cache clean, etc.)
- Pairs naturally with `--force-unlock`: both address recovery from interrupted runs
- No database/data loss: only deletes the state file, not actual progress

**Cons**:
- Requires user to remember the flag (though help text and error messages can prompt)
- Doesn't prevent the root cause (users still need to restart with the flag)
- Manual operation (not automatic detection)

**Risk Assessment**: low - Simple flag addition, no side effects, only affects the manifest state file

**Complexity**: simple - Core changes are straightforward CLI parsing and file deletion

#### Option 2: Auto-detect and Fix Inconsistent State

**Description**: On manifest load, validate that `last_completed_feature_id` matches actual feature status and recalculate `next_feature_id` from current state. Auto-repair obvious inconsistencies.

**Pros**:
- Automatic: no user action needed
- More robust: catches edge cases beyond just interruptions
- Transparent: fixes issues silently

**Cons**:
- More complex validation logic needed
- Could mask real problems (concealing bugs rather than fixing them)
- Requires heuristics to determine what's "inconsistent"
- Harder to debug when things go wrong
- Might "fix" things in unexpected ways

**Why Not Chosen**: Over-engineered for the immediate problem. Auto-detection adds complexity without proportional benefit. The explicit `--reset` flag gives users control and clarity. If auto-detection is needed later, it can be added as a separate enhancement.

#### Option 3: Add `--reset-manifest` Confirmation Prompt

**Description**: On startup, if manifest exists and looks potentially stale (e.g., old last_checkpoint), prompt user asking if they want to reset the manifest.

**Pros**:
- User-friendly for novices
- Catches likely problem cases automatically

**Cons**:
- Interactive prompt breaks unattended/scripted runs
- False positives (prompting when not needed)
- Complex logic to determine "stale"
- Slower startup experience

**Why Not Chosen**: The explicit flag approach is cleaner. Users experiencing the problem will see the symptom (blocked sandboxes) and can look at help text or error messages that mention `--reset`.

### Selected Solution: Add `--reset` CLI Flag

**Justification**: This approach is:
1. **Minimal**: 3 lines of code in CLI parser + 1-2 lines in orchestration
2. **Explicit**: Users opt-in to reset, maintaining control
3. **Safe**: Only deletes the manifest state file, doesn't touch actual data
4. **Discoverable**: Help text documents the flag, error messages can guide users
5. **Testable**: Easy to verify the flag works correctly
6. **Non-breaking**: Existing behavior unchanged when flag not provided

**Technical Approach**:
- Add `reset: boolean` field to `OrchestratorOptions` type
- Parse `--reset` flag in `parseArgs()` function (cli/index.ts)
- Check flag before loading manifest in `orchestrate()` function (lib/index.ts)
- If `--reset` is true, delete spec-manifest.json before loading
- Manifest will be regenerated from feature task.json files on next load call
- Log confirmation message that reset was performed

**Architecture Changes**: None - no architectural modifications, purely additive CLI option

**Migration Strategy**: Not needed - backward compatible

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/types/index.ts` - Add `reset` field to `OrchestratorOptions`
- `.ai/alpha/scripts/cli/index.ts` - Parse `--reset` CLI flag and update help text
- `.ai/alpha/scripts/lib/index.ts` - Delete manifest if `--reset` flag is true before loading

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add reset field to OrchestratorOptions type

<describe what this step accomplishes>

Add `reset: boolean` field to the `OrchestratorOptions` interface so the orchestrator can track whether user requested a manifest reset.

- Open `types/index.ts`
- Find the `OrchestratorOptions` interface definition
- Add new field: `reset: boolean;`
- Initialize to `false` in `parseArgs()` default options

**Why this step first**: The type definition must exist before parsing logic can use it

#### Step 2: Parse --reset flag in CLI argument parser

<describe what this step accomplishes>

Add `--reset` flag parsing to the argument parser so users can request manifest reset via command line.

- Open `cli/index.ts` in the `parseArgs()` function
- Find the argument parsing loop (around line 36-70)
- Add condition for `--reset` flag: if arg === "--reset", set `options.reset = true`
- Update help text in `showHelp()` function to document the new flag

**Why this step follows**: Need to parse the flag before the orchestrator can use it

#### Step 3: Delete manifest file if --reset flag is set

<describe what this step accomplishes>

Implement the actual reset logic that deletes the manifest file when the flag is provided, forcing regeneration.

- Open `lib/index.ts` in the `orchestrate()` function
- Find where manifest is loaded (likely around the manifest loading section)
- Add check: if `options.reset === true`, delete the spec-manifest.json file
- Log message: "🔄 Resetting manifest as requested..."
- Call existing manifest loading/generation code after deletion
- Manifest will be auto-regenerated from feature directories

**Why this step follows**: Only after parsing is complete can we execute the reset logic

#### Step 4: Test the --reset flag works

<describe what this testing strategy accomplishes>

Verify the flag is properly recognized and the manifest is properly reset/regenerated.

- Run orchestrator with `--reset` flag: `tsx spec-orchestrator.ts 1692 --reset`
- Verify manifest file is deleted before loading
- Verify new manifest is generated from feature directories
- Verify features are no longer "blocked"
- Verify sandboxes pick up available work
- Verify help output mentions `--reset` flag

#### Step 5: Update help text and documentation

<describe what this step accomplishes>

Ensure users can discover the `--reset` flag through help text.

- Update help in `showHelp()` function in `cli/index.ts`
- Add to "Options" section: `--reset             Reset manifest state (delete and regenerate)`
- Add to "Examples" section: example showing `tsx spec-orchestrator.ts 1692 --reset`
- Add to top-level JSDoc comment in spec-orchestrator.ts if examples are listed there

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `--reset` flag is parsed correctly
- ✅ Reset flag defaults to false when not provided
- ✅ Manifest file is deleted when reset flag is true
- ✅ Manifest is regenerated after deletion
- ✅ Sandbox work queue resets when manifest is regenerated

**Test files**:
- `.ai/alpha/scripts/__tests__/cli.test.ts` - Test flag parsing
- `.ai/alpha/scripts/__tests__/manifest.test.ts` - Test manifest deletion

### Integration Tests

Test the full flow:
- ✅ Run orchestrator, interrupt mid-run
- ✅ Restart with `--force-unlock --reset`
- ✅ Verify sandboxes are no longer blocked
- ✅ Verify available features are picked up correctly

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator without any flags (should work as before)
- [ ] Run orchestrator with `--reset` flag (manifest should be deleted and regenerated)
- [ ] Run help text: `tsx spec-orchestrator.ts --help` (should show `--reset` in options)
- [ ] Create scenario: run orchestrator, interrupt it, check manifest state is stale
- [ ] Restart with `--reset --force-unlock` (should clear stale state)
- [ ] Verify sandboxes no longer show "Blocked by dependencies" when features are available
- [ ] Verify no errors during manifest regeneration
- [ ] Verify manifest is valid JSON after regeneration

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **User Accidentally Loses Progress Data**: If manifest deletion also affected actual progress
   - **Likelihood**: low
   - **Impact**: high
   - **Mitigation**: Manifest is only state file; actual feature work/git repos are unaffected. Clearly document that flag only resets orchestrator state, not actual work.

2. **Flag Parsing Error**: Incorrect parsing of `--reset` flag
   - **Likelihood**: very low
   - **Impact**: low (flag just wouldn't work)
   - **Mitigation**: Simple string matching in existing parsing loop, follows same pattern as other flags

3. **Manifest Regeneration Failure**: Feature directories missing/corrupt
   - **Likelihood**: low
   - **Impact**: medium (orchestrator can't load manifest)
   - **Mitigation**: Existing error handling for manifest generation failures; no new error cases introduced

**Rollback Plan**:

If this fix causes issues in production:
1. Simply don't use the `--reset` flag when running orchestrator
2. No deployment needed, purely optional CLI flag
3. Existing behavior unchanged when flag not provided
4. If problematic, the flag parsing code can be removed (no dependencies on it)

**Monitoring**: None needed - this is a CLI tool used locally

## Performance Impact

**Expected Impact**: none

No performance implications. The flag only affects initialization; the actual orchestration loop is unchanged.

## Security Considerations

**Security Impact**: none

The `--reset` flag only deletes the orchestrator state file (spec-manifest.json), not user data or code repositories. No security implications.

## Validation Commands

### Before Fix (Manifest Reset Requires Manual File Deletion)

Before implementing the fix, the workaround requires:
```bash
# Current workaround: manually delete manifest
rm .ai/alpha/specs/S1692-Spec-user-dashboard/spec-manifest.json
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692
```

Expected Result: Manifest must be manually deleted before restart

### After Fix (--reset Flag Automates Manifest Deletion)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Test CLI parsing
tsx .ai/alpha/scripts/spec-orchestrator.ts --help | grep -i reset

# Verify --reset flag works
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692 --reset --dry-run

# Run full orchestrator with reset
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692 --reset
```

**Expected Result**: All commands succeed, `--reset` flag is recognized, manifest is regenerated, sandboxes pick up available work

### Regression Prevention

```bash
# Verify existing behavior unchanged (without --reset flag)
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692 --dry-run

# Verify other flags still work
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692 --force-unlock --dry-run
tsx .ai/alpha/scripts/spec-orchestrator.ts 1692 --skip-db-reset --dry-run
```

## Dependencies

No new dependencies required.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: low

This is purely a local CLI tool change. No deployment to production servers needed.

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: maintained - flag is optional, existing behavior unchanged

## Success Criteria

The fix is complete when:
- [ ] `--reset` flag is added to OrchestratorOptions type
- [ ] CLI parser recognizes `--reset` flag
- [ ] Manifest file is deleted when flag is provided
- [ ] Help text documents the new flag
- [ ] `tsx spec-orchestrator.ts --help` shows `--reset` in options
- [ ] Manual test: running with `--reset` deletes and regenerates manifest
- [ ] Manual test: sandboxes no longer blocked after reset
- [ ] All validation commands pass
- [ ] No regressions in existing CLI behavior (without flag)

## Notes

**Paired with --force-unlock**: The `--reset` flag naturally pairs with the existing `--force-unlock` flag:
- `--force-unlock`: Releases stale orchestrator lock (process-level recovery)
- `--reset`: Clears stale manifest state (data-level recovery)

Together, they provide complete recovery from interrupted runs. Consider updating error messages to suggest using both flags when recovering from failures.

**Future Enhancement**: Auto-detection of stale state (Option 2 above) could be added later if users find they frequently forget the `--reset` flag. For now, the explicit flag is the right balance of simplicity and control.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1702*
