# Bug Fix: Aikido Security Scan Fails with 402 - Paid Plan Required

**Related Diagnosis**: #1741
**Severity**: low
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Workflow enables `fail-on-iac-scan: true`, which requires a paid Aikido plan. Free tier only supports dependency scanning (SCA).
- **Fix Approach**: Disable the paid-tier feature by setting `fail-on-iac-scan: false` in the workflow configuration
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Aikido Security Scan job in `.github/workflows/pr-validation.yml` fails with HTTP 402 "Payment Required" because the workflow is configured with `fail-on-iac-scan: true`, which is a paid-only feature. The free tier only includes dependency scanning (SCA).

For full details, see diagnosis issue #1741.

### Solution Approaches Considered

#### Option 1: Disable IaC Scanning ⭐ RECOMMENDED

**Description**: Set `fail-on-iac-scan: false` in the Aikido workflow configuration to use only free-tier features (dependency scanning).

**Pros**:
- Immediate fix with minimal code change (1 line)
- Maintains dependency scanning (SCA) functionality
- Zero risk of breaking other features
- No cost implications
- Trivial to implement and verify

**Cons**:
- Loses Infrastructure-as-Code (IaC) vulnerability scanning
- Limited to free-tier security capabilities

**Risk Assessment**: low - This is simply disabling a feature we don't have access to

**Complexity**: simple - One-line YAML configuration change

#### Option 2: Upgrade to Aikido Paid Plan

**Description**: Purchase a paid Aikido plan to enable IaC scanning and other premium features.

**Pros**:
- Full security scanning capabilities
- Enhanced vulnerability detection

**Cons**:
- Financial cost
- Requires approval and procurement
- Adds recurring operational expense
- Solves a different problem (monetization vs. CI fix)

**Why Not Chosen**: This is a business decision, not a technical fix. The diagnosis clearly indicates we need to align configuration with our current free-tier plan.

#### Option 3: Switch to Alternative Security Scanner

**Description**: Replace Aikido with another security scanning tool that supports IaC scanning for free.

**Pros**:
- Could potentially get IaC scanning at no cost
- Reduces vendor lock-in

**Cons**:
- Large effort to integrate new tool
- Risk of breaking existing workflows
- Related issue #163 discusses this, no decision made
- Out of scope for this bug fix

**Why Not Chosen**: This is a separate architectural decision. The immediate fix is to disable the unsupported feature.

### Selected Solution: Disable IaC Scanning

**Justification**: This is the simplest, lowest-risk solution that immediately resolves the CI failure while maintaining our current dependency scanning capabilities. IaC scanning is a premium feature we're not paying for; disabling it aligns our configuration with our free-tier plan. If IaC scanning becomes a requirement, that's a separate initiative to evaluate paid plans or alternative tools (related to issue #163).

**Technical Approach**:
- Change `fail-on-iac-scan: true` to `fail-on-iac-scan: false`
- Keep `fail-on-dependency-scan: true` (free tier, working feature)
- Keep `fail-on-sast-scan: false` (paid tier, correctly disabled)
- This matches the free tier feature matrix documented in the diagnosis

**Architecture Changes**: None - This is a configuration alignment, not an architectural change.

**Migration Strategy**: No migration needed. The change is purely a workflow configuration update with no data or state implications.

## Implementation Plan

### Affected Files

- `.github/workflows/pr-validation.yml` - Set `fail-on-iac-scan: false` on line ~308

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Verify Current Configuration

Confirm the current problematic configuration:

- Read `.github/workflows/pr-validation.yml` around line 298-310
- Verify `fail-on-iac-scan: true` is present
- Verify `fail-on-dependency-scan: true` is present (we want to keep this)
- Verify `fail-on-sast-scan: false` is present (correctly disabled)

**Why this step first**: Establishes the baseline before making changes

#### Step 2: Update Workflow Configuration

Edit `.github/workflows/pr-validation.yml`:

- Change `fail-on-iac-scan: true` to `fail-on-iac-scan: false`
- Keep all other Aikido configuration unchanged
- Keep all other workflow steps unchanged

**Specific change**:
```yaml
# BEFORE:
- name: Run Aikido Security Scan
  uses: AikidoSec/github-actions-workflow@v1.0.13
  with:
    fail-on-dependency-scan: true   # FREE - Keep enabled
    fail-on-sast-scan: false        # PAID - Already disabled
    fail-on-iac-scan: true          # PAID - Change this to false

# AFTER:
- name: Run Aikido Security Scan
  uses: AikidoSec/github-actions-workflow@v1.0.13
  with:
    fail-on-dependency-scan: true   # FREE - Keep enabled
    fail-on-sast-scan: false        # PAID - Already disabled
    fail-on-iac-scan: false         # PAID - Now disabled
```

#### Step 3: Verify Configuration Syntax

- Ensure YAML indentation is correct (2 spaces)
- Verify the boolean `false` value is lowercase (YAML spec)
- Confirm no trailing whitespace or syntax errors

#### Step 4: Test Against Previous Failure

- Check git history or test logs to understand what PR trigger the 402 failure
- Create a test PR or re-run the workflow to verify the 402 error is resolved
- Confirm the workflow completes successfully
- Verify dependency scanning still runs (the free feature we kept enabled)

**Why verify this way**: Ensures the fix actually resolves the original error

#### Step 5: Commit and Document

- Commit the change with appropriate message
- Reference issue #1741 in commit message
- No code review or testing beyond the workflow completion needed

## Testing Strategy

### No Unit/Integration Tests Needed

This is a configuration change, not code. No unit tests required.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Read the current `.github/workflows/pr-validation.yml` to verify problematic configuration
- [ ] Make the one-line change: `fail-on-iac-scan: false`
- [ ] Verify YAML syntax is correct (proper indentation, lowercase boolean)
- [ ] Create a test PR or manually trigger the workflow
- [ ] Verify the workflow completes without HTTP 402 error
- [ ] Verify dependency scanning still appears in workflow output
- [ ] Verify no other workflow steps are affected
- [ ] Check that all other security checks pass normally

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Reduced security coverage**: We lose IaC scanning capability
   - **Likelihood**: high (this is intentional)
   - **Impact**: low (free tier doesn't support IaC anyway)
   - **Mitigation**: If IaC scanning becomes critical, escalate to decision on paid plan or alternative tool (issue #163)

2. **YAML syntax error during editing**: Accidentally introduce syntax error
   - **Likelihood**: low (one simple line change)
   - **Impact**: medium (would break CI)
   - **Mitigation**: Carefully validate YAML indentation and syntax; test the workflow

3. **Unexpected side effects**: Other workflow elements break
   - **Likelihood**: very low (isolated change)
   - **Impact**: medium (CI pipeline failure)
   - **Mitigation**: Test the workflow after change; review git diff before committing

**Rollback Plan**:

If this change causes issues:
1. Revert the commit: `git revert <commit-hash>`
2. The original HTTP 402 error will return, but the code itself is safe
3. Re-evaluate approach (paid plan or tool replacement)

**Monitoring**: None needed. This is a one-time configuration fix.

## Performance Impact

**Expected Impact**: none

No performance implications. This is a configuration change that disables a feature we weren't using.

## Security Considerations

**Security Impact**: low - slight reduction in coverage

We lose IaC scanning (a paid feature we weren't using anyway). Dependency scanning (SCA) continues, which is the primary free-tier security capability.

**Security review needed**: no

The change simply aligns our configuration with our free-tier subscription level. No security vulnerabilities introduced.

## Validation Commands

### Before Fix (Bug Should Reproduce)

The HTTP 402 error occurs when the workflow runs on any PR. Historical evidence exists in CI logs showing the failure.

### After Fix (Bug Should Be Resolved)

```bash
# Syntax validation (no special tools needed for YAML)
grep -A 5 "Run Aikido Security Scan" .github/workflows/pr-validation.yml

# Look for the corrected line:
# fail-on-iac-scan: false

# The real test: Create or trigger a PR to run the workflow
# Expected result: Workflow completes successfully without HTTP 402 error
```

**Expected Result**: Workflow completes, dependency scanning runs, no 402 error.

## Dependencies

**No new dependencies required**

The Aikido action version remains the same (`v1.0.13`). We're just adjusting its configuration parameters.

## Database Changes

**No database changes required**

This is a GitHub Actions workflow configuration, not application code.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

The workflow configuration change takes effect immediately on the next PR after the commit is merged.

**Feature flags needed**: no

**Backwards compatibility**: maintained

This doesn't change any code compatibility; it just adjusts CI behavior.

## Success Criteria

The fix is complete when:
- [ ] `.github/workflows/pr-validation.yml` has `fail-on-iac-scan: false`
- [ ] YAML syntax is correct (proper indentation, lowercase `false`)
- [ ] A test PR or workflow run completes without HTTP 402 error
- [ ] Dependency scanning still runs and completes
- [ ] No other workflow steps are affected
- [ ] Commit message references issue #1741

## Notes

- **Related issue**: #163 discusses replacing Snyk and evaluating security tools - this fix buys us time while that decision is made
- **Aikido documentation**: Free tier includes SCA (dependency scanning) only
- **Simple fix**: This is a one-line configuration change with zero code impact

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1741*
