# Bug Fix: Alpha Workflow Missing Environment Variable Validation

**Related Diagnosis**: #1874
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The Alpha autonomous coding workflow (spec.md, feature-decompose.md, task-decompose.md) does not validate proposed environment variables against existing `.env` files, causing incorrect variable names to be specified
- **Fix Approach**: Add environment variable validation steps to feature-decompose.md and task-decompose.md with pre-completion checklists
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha autonomous coding workflow generates feature specifications and task decompositions that specify environment variables required for integration work (e.g., Cal.com, Stripe). However, the workflow does not validate these proposed variable names against existing environment files, leading to misnamed variables.

**Evidence**: In S1864 (coaching integration with Cal.com), the research agents proposed `CAL_API_KEY` and `NEXT_PUBLIC_CAL_USERNAME` but the actual existing variables are `CALCOM_API_KEY` and `NEXT_PUBLIC_CALCOM_COACH_USERNAME`.

This causes implementation confusion and requires manual fixes during the implementation phase.

For full details, see diagnosis issue #1874.

### Solution Approaches Considered

#### Option 1: Add validation in feature-decompose.md ⭐ RECOMMENDED

**Description**: Add a new step after credential extraction that scans existing `.env` files and maps proposed variables to actual ones, creating a reference table.

**Pros**:
- Fixes the problem at the source (feature decomposition)
- Reduces downstream errors in task-decompose.md
- Simple bash grep command (no external tools needed)
- Early validation catches naming mismatches immediately
- Reusable approach for all integration features

**Cons**:
- Requires reading multiple .env files
- May find partial matches requiring manual confirmation
- Variable naming conventions might vary by project

**Risk Assessment**: low - This is a read-only validation step with no state changes

**Complexity**: simple - Uses standard bash grep patterns

#### Option 2: Add validation only in task-decompose.md

**Description**: Check environment variables later in task decomposition before creating tasks.json

**Pros**:
- Simpler change (single file)
- Catches issues at final checkpoint

**Cons**:
- Fixes the problem too late (downstream)
- Still leaves feature-decompose.md with incorrect data
- Implementation agents get bad variable names

**Why Not Chosen**: Validation should occur early to prevent bad data from flowing downstream.

#### Option 3: Create automated env var resolver

**Description**: Build a helper function that fuzzy-matches proposed variables to existing ones

**Pros**:
- More intelligent matching (handles partial names)
- Reusable across features
- Self-correcting

**Cons**:
- Over-engineering for current need
- Requires testing edge cases
- Risk of false positives in fuzzy matching

**Why Not Chosen**: Simple grep-based approach is sufficient and has lower risk.

### Selected Solution: Add validation in feature-decompose.md

**Justification**:

The recommended approach adds environment variable validation to `feature-decompose.md` after Step 1.6 (credential extraction). This:

1. Fixes the problem at the source rather than downstream
2. Uses simple, reliable bash grep patterns
3. Creates clear documentation of variable mappings
4. Provides implementation agents with correct variable names
5. Requires minimal code changes with low risk

Additionally, validation checklists should be added to both `feature-decompose.md` and `task-decompose.md` as pre-completion gates.

**Technical Approach**:

- Search existing `.env`, `.env.local`, `apps/web/.env*` files for integration-related variable names
- Extract actual variable names using grep patterns
- Build a credential mapping table comparing proposed vs actual names
- Document any discrepancies
- Use actual variable names in subsequent steps

**Architecture Changes**: None - this is a validation/documentation step within existing workflows.

**Migration Strategy**: Not needed - this improves forward-looking feature decompositions.

## Implementation Plan

### Affected Files

- `.claude/commands/alpha/feature-decompose.md` - Add Step 1.7 for env var validation + checklist items
- `.claude/commands/alpha/task-decompose.md` - Add validation step + checklist items

### New Files

None required. All changes are additions to existing command files.

### Step-by-Step Tasks

#### Step 1: Add environment variable validation step to feature-decompose.md

**Location**: After Step 1.6 (Extract Credentials from Research), add Step 1.7

**Content to add**:

```markdown
#### Step 1.7: Validate Credentials Against Existing Environment Files

Before proceeding, validate all proposed environment variables against actual project configurations.

**Search existing .env files for actual variable names**:

```bash
# Scan all .env files for variables related to the integration
for file in .env .env.local apps/web/.env apps/web/.env.local apps/web/.env.test 2>/dev/null; do
  if [ -f "$file" ]; then
    echo "=== $file ==="
    grep -E "^[A-Z_]*=.*" "$file" | grep -i "<integration-keyword>" | cut -d= -f1 | sort -u
  fi
done
```

Replace `<integration-keyword>` with the integration name (e.g., "calcom", "stripe", "paddle").

**Create a credential mapping table** in the research findings:

| Proposed Variable | Actual Variable | Match? | Notes |
|-------------------|-----------------|--------|-------|
| `CAL_API_KEY` | `CALCOM_API_KEY` | ❌ Name differs | Use actual name |
| `CAL_USERNAME` | `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | ⚠️ Partial | Verify usage |

**Guidelines**:
- Always use actual variable names from existing .env files
- If no matching variable exists, propose new name following project conventions
- Document any missing variables needed for implementation
- Flag naming inconsistencies for review
```

**Why this step first**: Ensures all downstream features and tasks use correct variable names from the start.

#### Step 2: Add pre-completion checklist items to feature-decompose.md

**Location**: In the "Pre-Completion Verification" section (or create if missing)

**Content to add**:

```markdown
### Environment Variables Checklist

Before marking feature-decompose complete:

- [ ] All `required_env_vars` have been validated against actual `.env` files
- [ ] Credential mapping table created showing proposed vs actual names
- [ ] No duplicate or conflicting variable names
- [ ] Variable naming follows project convention (`INTEGRATION_*`, `NEXT_PUBLIC_*`)
- [ ] Missing variables clearly documented
- [ ] Validation command output included in research findings
```

#### Step 3: Add validation step to task-decompose.md

**Location**: Before the "Finalize tasks.json" section

**Content to add**:

```markdown
#### Pre-Finalization: Validate Environment Variables in tasks.json

**Verify all `required_env_vars` against feature-decompose research**:

For each task with `required_env_vars`:

```bash
# Extract variables from tasks.json
grep -o '"[A-Z_]*": true' tasks.json | cut -d'"' -f2 | sort -u

# Cross-reference against feature-decompose credential mapping
# Ensure each variable name matches the actual .env variable (not the proposed one)
```

**Validation checklist**:
- [ ] All `required_env_vars` match actual environment variables from feature research
- [ ] No proposed/intermediate variable names in tasks.json
- [ ] Variable names follow project naming conventions
- [ ] Feature-level validation was completed (Step 1.7 in feature-decompose.md)
```

#### Step 4: Update task-decompose.md pre-completion checklist

**Location**: In existing "Pre-Completion Verification" section

**Add these items**:

```markdown
### Environment Variables

- [ ] All `required_env_vars` in tasks.json match actual `.env` files
- [ ] No proposed/placeholder variable names remain
- [ ] Variables validated at feature-decompose level (step 1.7)
- [ ] Implementation agents will receive correct variable names
```

#### Step 5: Verification and Testing

**Verify the changes work correctly**:

1. Review the modified `.claude/commands/alpha/feature-decompose.md`
2. Review the modified `.claude/commands/alpha/task-decompose.md`
3. Test with a sample integration feature:
   - Follow the new Step 1.7
   - Create the credential mapping table
   - Verify it identifies any existing mismatches
   - Confirm the mapping is used in downstream steps

**Manual testing**:

```bash
# Test the grep command from Step 1.7
for file in .env .env.local apps/web/.env apps/web/.env.local 2>/dev/null; do
  if [ -f "$file" ]; then
    echo "=== $file ==="
    grep -E "^[A-Z_]*=.*" "$file" | grep -i "calcom" | cut -d= -f1 | sort -u
  fi
done

# Should output:
# CALCOM_API_KEY
# NEXT_PUBLIC_CALCOM_COACH_USERNAME
# (etc. depending on actual .env contents)
```

## Testing Strategy

### Validation Steps

**Before changes** (baseline):
- Run existing Alpha workflows with Cal.com/Stripe features
- Document any environment variable mismatches found in research

**After changes** (verification):
- Re-run the same workflows with new validation steps
- Verify the credential mapping table correctly identifies mismatches
- Confirm tasks.json uses correct variable names
- No implementation phase changes needed to fix variable names

### Regression Testing

- [ ] Existing Alpha features without env vars still work
- [ ] Non-integration features unaffected by new validation
- [ ] Validation doesn't block legitimate workflows
- [ ] Manual entry of correct variable names still works

### Documentation Testing

- [ ] Step 1.7 instructions are clear and actionable
- [ ] Bash grep command works across different shells (bash/zsh)
- [ ] Credential mapping table format is easy to follow
- [ ] Checklists are comprehensive and accurate

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Blocking legitimate new variables**: New integrations might need new variables not in .env
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Instructions explicitly note "if no matching variable exists, propose new name". Validation only flags mismatches, doesn't block.

2. **Grep pattern false positives**: grep -i might match unrelated variables
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Use specific integration keywords; manual review of results before accepting

3. **Case sensitivity issues**: Environment variable names are case-sensitive
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: grep uses exact case matching; results clearly show actual variable names

**Rollback Plan**:

If the validation steps cause issues:

1. Remove Step 1.7 from feature-decompose.md
2. Remove validation items from both checklist sections
3. Resume using previous workflow
4. No code changes needed (only documentation)

**Monitoring** (if needed):

- Track whether subsequent Alpha implementations report environment variable mismatches
- Monitor if new integration features specify correct variable names
- Review feature-decompose research findings for validation tables

## Performance Impact

**Expected Impact**: minimal

The new validation steps only add:
- One bash grep loop (reads file once)
- One table creation (manual documentation)
- No computational changes

**Total added time**: ~1-2 minutes per feature decomposition

## Security Considerations

**Security Impact**: none/low

- Validation only **reads** `.env` files (no modifications)
- No credentials exposed or logged
- Grep patterns only extract variable names, not values
- Research findings documents are internal only

## Validation Commands

### Before Fix (Baseline - Environment Variables May Mismatch)

Run an existing Alpha feature-decompose with Cal.com/Stripe:

```bash
# Check that proposed variables in research don't match actual ones
grep -r "CAL_API_KEY\|CALCOM_API_KEY" .ai/alpha/specs/**/research*.md
# May show both proposed and actual names mixed together
```

**Expected Result**: Proposed variable names may differ from actual ones.

### After Fix (Validation Complete)

```bash
# Verify the changes are in place
grep -A 20 "Step 1.7" .claude/commands/alpha/feature-decompose.md
grep "required_env_vars" .claude/commands/alpha/task-decompose.md

# Test with a sample integration
bash -c '
  for file in .env .env.local apps/web/.env* 2>/dev/null; do
    if [ -f "$file" ]; then
      echo "=== $file ==="
      grep -E "^[A-Z_]*=.*" "$file" | grep -i "calcom" | cut -d= -f1 | sort -u
    fi
  done
'
```

**Expected Result**:
- All validation steps documented in command files
- Grep command successfully extracts actual variable names from .env files
- No errors when running the command

### Regression Prevention

```bash
# Ensure Alpha commands still work
cd /home/msmith/projects/2025slideheroes

# Basic syntax check of modified files
grep -E "^(#+|- |\[|```)" .claude/commands/alpha/feature-decompose.md > /dev/null && echo "✓ feature-decompose.md syntax OK"
grep -E "^(#+|- |\[|```)" .claude/commands/alpha/task-decompose.md > /dev/null && echo "✓ task-decompose.md syntax OK"
```

## Dependencies

**New Dependencies**: None

**Existing Tools Used**:
- `bash` (grep)
- `cut`, `sort` (standard utilities)

**No package dependencies required**

## Database Changes

**Database Changes Required**: No

This fix only affects command documentation and workflow validation steps.

## Deployment Considerations

**Deployment Risk**: none

These are documentation-only changes to command files. No code deployment needed.

**Deployment Steps**:

1. Commit changes to `.claude/commands/alpha/feature-decompose.md`
2. Commit changes to `.claude/commands/alpha/task-decompose.md`
3. Changes take effect immediately in next workflow execution
4. No environment setup or migrations needed

**Feature Flags**: Not needed

**Backwards Compatibility**: Maintained

Existing workflows without environment variables are unaffected. The new validation is additive.

## Success Criteria

The fix is complete when:

- [ ] Step 1.7 added to feature-decompose.md with clear instructions
- [ ] Environment variable validation checklist added to feature-decompose.md pre-completion
- [ ] Environment variable validation checklist added to task-decompose.md pre-completion
- [ ] Bash grep command works correctly across shells
- [ ] Documentation is clear and actionable
- [ ] Changes committed and merged

## Notes

**Why this approach**:

The fix is surgical and focused on the root cause. Rather than building complex matching logic, we validate that actual environment variables exist and use those names. This ensures:

1. **Single source of truth**: Use names from actual .env files
2. **Manual review**: Research findings document the mapping
3. **Implementation clarity**: Tasks.json gets correct variable names
4. **No regressions**: Existing workflows unaffected
5. **Future-proof**: Works for any integration (Cal.com, Stripe, Paddle, etc.)

**Related issues**:

- #1872 - S1864 Cal.com incorrect env vars (symptom of this bug)
- #1864 - S1864 Initiative (uses Cal.com integration)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1874*
