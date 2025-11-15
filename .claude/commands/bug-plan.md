---
description: Create a bug fix plan from a GitHub diagnosis issue. Fetches diagnosis, analyzes root cause, and creates structured fix plan with reproduction steps and validation
argument-hint: <diagnosis-issue-number>
model: sonnet
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite]
---

# Bug Fix Planning

Create a solution-focused implementation plan to resolve a diagnosed bug. This command focuses on **solution design and implementation strategy**, not diagnosis. The diagnosis should already exist from `/diagnose`.

## Prerequisites

**REQUIRED**: A completed bug diagnosis from `/diagnose` command.

If you don't have a diagnosis issue:
1. Run `/diagnose` first to investigate and document the bug
2. Then return here with the diagnosis issue number

## Instructions

IMPORTANT: You're designing a **solution** to fix a diagnosed bug, not investigating the problem.
IMPORTANT: Focus on solution design, alternative approaches, risk assessment, and implementation strategy.
IMPORTANT: The diagnosis has already identified the root cause - your job is to design the best fix.

### 1. Fetch and Validate Diagnosis

**Fetch the diagnosis issue from GitHub**:
```bash
# Extract issue number from $ARGUMENTS and fetch diagnosis
gh issue view <issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --json body,title,labels,number \
  --jq '{body: .body, title: .title, labels: [.labels[].name], number: .number}'
```

**Validate it's a diagnosis issue**:
- Check for "Bug Diagnosis:" prefix in title OR "needs-investigation" label
- If not a diagnosis issue, instruct user to run `/diagnose` first
- If diagnosis is missing key information, request user update it before planning

### 2. Validate Diagnosis Quality

Before creating a fix plan, ensure the diagnosis contains:
- [ ] Root cause clearly identified
- [ ] Reproduction steps documented
- [ ] Affected files/components identified
- [ ] Environment/context captured
- [ ] Expected vs actual behavior described

If diagnosis is incomplete, ask user to update the diagnosis issue before proceeding.

### 3. Extract Key Information

Parse the diagnosis and extract:
```typescript
const diagnosisIssueNumber = '[issue-number]'; // From $ARGUMENTS
const bugTitle = '[Brief description for fix plan title]'; // e.g., "Fix authentication timeout"
const severity = '[critical|high|medium|low]'; // From diagnosis labels
const bugType = '[bug|performance|error|regression|integration]'; // From diagnosis labels
const rootCause = '[One-sentence summary of root cause from diagnosis]';
const affectedFiles = ['file1.ts', 'file2.tsx']; // From diagnosis
```

### 4. Solution Design Process

THINK HARD about the best approach to fix this bug:

1. **Analyze the root cause** from the diagnosis
2. **Identify 2-3 potential solution approaches**
   - Consider different technical strategies
   - Think about immediate fixes vs long-term solutions
   - Consider complexity vs risk trade-offs
3. **Evaluate each approach**:
   - Pros and cons
   - Complexity (simple|moderate|complex)
   - Risk level (low|medium|high)
   - Performance impact
   - Maintainability
4. **Select the recommended approach** with clear justification
5. **Design the implementation strategy**:
   - What files need changes and why
   - What new code/files are needed
   - What tests will prevent regressions
6. **Assess risks and create mitigation plan**
7. **Plan rollback strategy** if needed

### 5. Create the Fix Plan

Create the plan in `.ai/specs/bug-fix-<slug>.md` using the **Plan Format** below:
- IMPORTANT: Replace every <placeholder> with actual solution design
- Focus on **solution architecture and implementation strategy**
- Be surgical: minimal changes that fix the root cause
- Include comprehensive testing strategy
- Add risk assessment and rollback plan
- Name the plan: `Bug Fix: <bugTitle>`

### 6. Create GitHub Issue

Use the **GitHub Issue Creation** process to:
- Create fix plan issue with appropriate labels
- Link back to diagnosis issue
- Close diagnosis issue as "diagnosed"

### 7. Report Results

Follow the **Report** section to summarize your work.

## Plan Format

```md
# Bug Fix: <bug name>

**Related Diagnosis**: #<diagnosis_issue_number> (REQUIRED)
**Severity**: <critical|high|medium|low>
**Bug Type**: <bug|performance|error|regression|integration>
**Risk Level**: <low|medium|high>
**Complexity**: <simple|moderate|complex>

## Quick Reference

- **Root Cause**: <one-sentence summary from diagnosis>
- **Fix Approach**: <one-sentence summary of chosen solution>
- **Estimated Effort**: <small|medium|large>
- **Breaking Changes**: <yes|no>

## Solution Design

### Problem Recap

<1-2 sentences summarizing the problem from diagnosis>

For full details, see diagnosis issue #<diagnosis_issue_number>.

### Solution Approaches Considered

#### Option 1: <approach name> ⭐ RECOMMENDED

**Description**: <how this approach works>

**Pros**:
- <advantage 1>
- <advantage 2>
- <advantage 3>

**Cons**:
- <disadvantage 1>
- <disadvantage 2>

**Risk Assessment**: <low|medium|high> - <explanation>

**Complexity**: <simple|moderate|complex> - <explanation>

#### Option 2: <alternative approach>

**Description**: <how this approach works>

**Pros**:
- <advantage 1>
- <advantage 2>

**Cons**:
- <disadvantage 1>
- <disadvantage 2>

**Why Not Chosen**: <clear reasoning>

#### Option 3: <alternative approach> (if applicable)

**Description**: <how this approach works>

**Why Not Chosen**: <clear reasoning>

### Selected Solution: <chosen approach name>

**Justification**: <why this approach is best given the constraints, risks, and requirements>

**Technical Approach**:
- <key technical detail 1>
- <key technical detail 2>
- <key technical detail 3>

**Architecture Changes** (if any):
- <describe any architectural modifications>
- <explain impact on existing code>

**Migration Strategy** (if needed):
- <how to migrate existing data/code>

## Implementation Plan

### Affected Files

List files that need modification:
- `path/to/file1.ts` - <specific changes needed and why>
- `path/to/file2.tsx` - <specific changes needed and why>
- `path/to/file3.sql` - <specific changes needed and why>

### New Files

If new files are needed:
- `path/to/new-file.ts` - <purpose and rationale>
- `path/to/new-test.spec.ts` - <test coverage>

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: <foundational changes>

<describe what this step accomplishes>

- <specific subtask 1>
- <specific subtask 2>
- <specific subtask 3>

**Why this step first**: <explain the sequencing>

#### Step 2: <core fix implementation>

<describe what this step accomplishes>

- <specific subtask 1>
- <specific subtask 2>
- <specific subtask 3>

#### Step 3: <add/update tests>

<describe the testing strategy>

- Add unit tests for <specific scenario>
- Add integration tests for <specific scenario>
- Update E2E tests if needed for <specific scenario>
- Add regression test for the original bug

#### Step 4: <documentation updates> (if needed)

- Update code comments in <files>
- Update README/docs if API changes
- Add inline documentation for complex logic

#### Step 5: <validation>

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Test all edge cases
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ <specific scenario 1>
- ✅ <specific scenario 2>
- ✅ Edge case: <specific case>
- ✅ Edge case: <specific case>
- ✅ Regression test: Original bug should not reoccur

**Test files**:
- `path/to/test.spec.ts` - <what will be tested>

### Integration Tests

<if needed, describe integration test scenarios>

**Test files**:
- `path/to/integration-test.spec.ts` - <what will be tested>

### E2E Tests

<if UI or critical user journey affected>

**Test files**:
- `apps/e2e/tests/feature.spec.ts` - <what will be tested>

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug (should fail before fix)
- [ ] Apply fix and verify bug is resolved
- [ ] Test edge case: <specific case>
- [ ] Test edge case: <specific case>
- [ ] Verify no UI regressions (if UI bug)
- [ ] Test in <specific environment>
- [ ] Verify performance is acceptable
- [ ] Check browser console for new errors

## Risk Assessment

**Overall Risk Level**: <low|medium|high>

**Potential Risks**:

1. **<Risk 1>**: <description>
   - **Likelihood**: <low|medium|high>
   - **Impact**: <low|medium|high>
   - **Mitigation**: <how to prevent/handle>

2. **<Risk 2>**: <description>
   - **Likelihood**: <low|medium|high>
   - **Impact**: <low|medium|high>
   - **Mitigation**: <how to prevent/handle>

**Rollback Plan**:

If this fix causes issues in production:
1. <rollback step 1>
2. <rollback step 2>
3. <rollback step 3>

**Monitoring** (if needed):
- Monitor <specific metric> for <timeframe>
- Watch for <specific error pattern>
- Alert on <specific condition>

## Performance Impact

**Expected Impact**: <none|minimal|moderate|significant>

<describe any performance implications>

**Performance Testing**:
- <how to verify performance is acceptable>

## Security Considerations

<if security implications exist, describe them>

**Security Impact**: <none|low|medium|high>

<if applicable>:
- Security review needed: <yes|no>
- Penetration testing needed: <yes|no>
- Security audit checklist: <specific items>

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Commands to reproduce the bug before applying fix
<command to demonstrate bug exists>
```

**Expected Result**: <what should happen when bug exists>

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit <specific-test-file>

# Integration tests (if applicable)
pnpm test:integration <specific-test-file>

# E2E tests (if applicable)
pnpm test:e2e <specific-test-file>

# Build
pnpm build

# Manual verification
<specific commands to verify fix works>
```

**Expected Result**: All commands succeed, bug is resolved, zero regressions.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Additional regression checks
<specific commands to verify nothing else broke>
```

## Dependencies

### New Dependencies (if any)

```bash
# Install command
pnpm --filter <workspace> add <package>

# Justification
<why this dependency is needed>
```

**Dependencies added**:
- `<package-name>@<version>` - <purpose>

OR

**No new dependencies required**

## Database Changes

<if database schema or migrations needed>

**Migration needed**: <yes|no>

**Changes**:
- <describe schema changes>
- <describe data migration needs>

**Migration file**: `apps/web/supabase/migrations/<timestamp>_<description>.sql`

OR

**No database changes required**

## Deployment Considerations

**Deployment Risk**: <low|medium|high>

**Special deployment steps**:
- <step 1 if any>
- <step 2 if any>

**Feature flags needed**: <yes|no>

**Backwards compatibility**: <maintained|breaking change>

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero regressions detected
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete
- [ ] Performance acceptable
- [ ] Security considerations addressed

## Notes

<any additional context, decisions, or considerations that will help during implementation>

<links to relevant documentation, similar fixes, or external resources>

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #<diagnosis_issue_number>*
```

## GitHub Issue Creation

Use the GitHub CLI (`gh`) to create the bug fix issue:

```bash
# First, validate the diagnosis issue exists and is a diagnosis
gh issue view <diagnosisIssueNumber> \
  --repo MLorneSmith/2025slideheroes \
  --json labels,title \
  --jq '{labels: [.labels[].name], title: .title}'

# Verify it has "needs-investigation" label or "Bug Diagnosis:" title prefix
# If not, warn user and ask them to run /diagnose first

# Extract severity and bug type from diagnosis labels
SEVERITY=$(gh issue view <diagnosisIssueNumber> --repo MLorneSmith/2025slideheroes --json labels --jq '.labels[].name' | grep -E '^(critical|high|medium|low)$' | head -1)
BUG_TYPE=$(gh issue view <diagnosisIssueNumber> --repo MLorneSmith/2025slideheroes --json labels --jq '.labels[].name' | grep -E '^(bug|performance|error|regression|integration)$' | head -1)

# Determine risk and complexity from your analysis
RISK_LEVEL="<low|medium|high>"  # From your risk assessment
COMPLEXITY="<simple|moderate|complex>"  # From your complexity analysis

# Create bug fix issue with comprehensive labels
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Bug Fix: <bugTitle>" \
  --body "<full-plan-content>" \
  --label "bug-fix" \
  --label "ready-to-implement" \
  --label "${SEVERITY}" \
  --label "${BUG_TYPE}" \
  --label "risk-${RISK_LEVEL}" \
  --label "complexity-${COMPLEXITY}"

# Capture the issue URL and number from output
FIX_ISSUE_NUMBER=<captured-from-output>

# Link back to diagnosis issue with detailed summary
gh issue comment <diagnosisIssueNumber> \
  --repo MLorneSmith/2025slideheroes \
  --body "✅ **Fix Plan Created**: #${FIX_ISSUE_NUMBER}

**Solution Approach**: <one-sentence summary of chosen solution>
**Risk Level**: ${RISK_LEVEL}
**Complexity**: ${COMPLEXITY}
**Estimated Effort**: <small|medium|large>

The fix plan is ready for implementation. See #${FIX_ISSUE_NUMBER} for full details."

# Add "diagnosed" label to diagnosis issue
gh issue edit <diagnosisIssueNumber> \
  --repo MLorneSmith/2025slideheroes \
  --add-label "diagnosed"

# Close the diagnosis issue
gh issue close <diagnosisIssueNumber> \
  --repo MLorneSmith/2025slideheroes \
  --comment "🔍 Diagnosis complete. Proceeding with fix plan: #${FIX_ISSUE_NUMBER}"
```

## Bug Diagnosis Input

From diagnosis issue: #$ARGUMENTS

## Report

After creating the fix plan, report:

- ✅ **Fix plan created**: `.ai/specs/bug-fix-<slug>.md`
- 🔗 **GitHub issue**: #<fix-issue-number>
- 🎯 **Solution approach**: <one-sentence summary>
- ⚠️ **Risk level**: <low|medium|high>
- 🔧 **Complexity**: <simple|moderate|complex>
- 📋 **Diagnosis issue**: #<diagnosis-issue-number> (closed)
- 🚀 **Ready for**: `/implement <fix-issue-number>`

**Next steps**:
1. Review the fix plan in the GitHub issue
2. Run `/implement <fix-issue-number>` when ready to execute
