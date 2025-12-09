# Bug Fix: dev-deploy workflow fails after markdownlint-cli2 upgrade

**Related Diagnosis**: #1031 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: markdownlint-cli2 upgraded from 0.19.1 to 0.20.0 (including markdownlint 0.40.0), which correctly detects 2 lines that exceed the 120-character limit in markdown files
- **Fix Approach**: Fix the two markdown files by breaking long lines to comply with the 120-character limit
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `dev-deploy.yml` workflow started failing after PR #1010 bumped markdownlint-cli2 from ^0.19.1 to ^0.20.0. The new version includes markdownlint v0.40.0, which has stricter/improved line-length parsing that now correctly detects violations that the older version missed.

Two markdown files have lines exceeding the 120-character limit:
- `README copy.md:245` - 127 characters (7 characters over limit)
- `tooling/scripts/src/README.md:3` - 126 characters (6 characters over limit)

The linting failure blocks the pre-deployment validation job in `dev-deploy.yml`.

For full details, see diagnosis issue #1031.

### Solution Approaches Considered

#### Option 1: Fix the markdown files ⭐ RECOMMENDED

**Description**: Break the long lines in the two affected markdown files to stay within the 120-character limit. This complies with the project's markdown linting standards and is the idiomatic solution.

**Pros**:
- Fixes the root cause (lines genuinely exceed the limit)
- Maintains code quality standards
- No additional configuration needed
- Minimal, surgical changes (2 lines affected)
- Aligns with project's strict formatting standards
- Educational - maintainers learn the standard exists

**Cons**:
- Requires identifying where to break each line
- May affect readability if not broken carefully

**Risk Assessment**: low - Simple text editing, no functional impact, non-breaking change

**Complexity**: simple - Text wrapping only, no code logic involved

#### Option 2: Ignore the files in .markdownlintignore

**Description**: Add the two problematic files to `.markdownlintignore` to exempt them from linting.

**Pros**:
- Quick fix (2 lines in ignore file)
- Avoids modifying the markdown content

**Cons**:
- Silences the linter rather than fixing the issue
- Allows technical debt to accumulate
- Other linting issues in these files would be missed
- Doesn't address the underlying problem
- Breaks the project's commitment to consistent formatting

**Why Not Chosen**: This approach would lower code quality standards and create exceptions that make the codebase harder to maintain. The project has intentionally set a 120-character limit, and these lines genuinely violate it.

#### Option 3: Lower the line-length limit

**Description**: Update the markdownlint configuration to allow longer lines (e.g., 130 or 150 characters).

**Pros**:
- Single configuration change

**Cons**:
- Changes project standards for all markdown
- Affects future files
- Defeats the purpose of strict formatting
- Inconsistent with original intent

**Why Not Chosen**: The 120-character limit is intentional and applies to the entire project. Changing it would affect all future markdown and reduce code quality standards across the board.

### Selected Solution: Fix the markdown files

**Justification**: This approach directly fixes the root cause by ensuring the two flagged lines comply with the 120-character limit. It maintains project quality standards, requires minimal changes, and has zero risk. The lines genuinely exceed the limit, and breaking them maintains readability while adhering to the project's formatting standards.

**Technical Approach**:
- Identify the exact content of each long line
- Determine appropriate break points that maintain semantic meaning
- Update each line to stay within 120 characters
- Verify the changes don't affect functionality (markdown files are documentation only)
- Run linting to confirm fixes resolve the issue

**Architecture Changes**: None

**Migration Strategy**: Not needed (no data or code changes)

## Implementation Plan

### Affected Files

- `README copy.md` - Line 245 is 127 characters (7 over limit)
- `tooling/scripts/src/README.md` - Line 3 is 126 characters (6 over limit)

### New Files

None required

### Step-by-Step Tasks

#### Step 1: Read and analyze the two affected markdown files

Read the exact content of the long lines to understand what needs to be broken:

- Read `README copy.md` and locate line 245
- Read `tooling/scripts/src/README.md` and locate line 3
- Determine appropriate break points that maintain clarity

**Why this step first**: Understanding the content helps identify the best places to break lines without damaging meaning or formatting.

#### Step 2: Fix README copy.md line 245

- Edit line 245 in `README copy.md`
- Break it into multiple lines that each stay under 120 characters
- Ensure the markdown structure is preserved (proper indentation, list formatting, links, etc.)

#### Step 3: Fix tooling/scripts/src/README.md line 3

- Edit line 3 in `tooling/scripts/src/README.md`
- Break it into multiple lines that each stay under 120 characters
- Ensure the markdown structure is preserved

#### Step 4: Verify fixes with markdownlint

Run the linting command to confirm both files now pass:

```bash
pnpm lint:md
```

Expected output: Zero errors from the two previously flagged lines

#### Step 5: Run full validation

Run the complete code quality suite to ensure no regressions:

```bash
pnpm lint
pnpm typecheck
pnpm format
```

All commands must pass with no errors.

#### Step 6: Verify CI/CD would pass

Simulate the `dev-deploy.yml` workflow's pre-deployment validation:

- Run `pnpm lint` locally (includes markdown linting)
- Confirm no markdown lint errors
- This ensures the workflow will pass on next push

## Testing Strategy

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Read the two affected files to identify long lines
- [ ] Break line 245 in `README copy.md` appropriately
- [ ] Break line 3 in `tooling/scripts/src/README.md` appropriately
- [ ] Run `pnpm lint:md` and confirm no errors
- [ ] Run `pnpm lint` and confirm no errors
- [ ] Run `pnpm typecheck` and confirm no errors
- [ ] Run `pnpm format` and confirm no changes needed
- [ ] Verify markdown files still render correctly in GitHub/editor
- [ ] Push to dev branch and verify workflow passes (if possible)

### No Additional Tests Needed

This is a documentation-only fix with no code changes, so unit/integration/E2E tests are not needed.

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Breaking markdown syntax accidentally**: Unlikely - we're just wrapping text
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Review the markdown after changes, verify no formatting is lost

2. **Losing meaning in wrapped lines**: Very unlikely with careful break point selection
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Choose break points that preserve semantic units (end of phrases, before punctuation)

**Rollback Plan**:

If changes cause issues:
1. `git revert <commit-hash>`
2. Revert will restore original long lines
3. No data loss or functionality impact possible

**Monitoring**: None needed (documentation-only changes)

## Performance Impact

**Expected Impact**: none

Documentation changes have zero performance impact.

## Security Considerations

**Security Impact**: none

Markdown files are documentation only and have no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run just markdown linting
pnpm lint:md

# Or run the full linting suite
pnpm lint
```

**Expected Result**:
```
README copy.md:245:121 error MD013/line-length Line length [Expected: 120; Actual: 127]
tooling/scripts/src/README.md:3:121 error MD013/line-length Line length [Expected: 120; Actual: 126]
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format
```

**Expected Result**: All commands succeed with zero markdown lint errors. No violations reported for the two previously flagged lines.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify the specific linting passes
pnpm lint:md
```

## Dependencies

### No new dependencies required

The existing markdownlint configuration and tools handle the validation.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a documentation fix that doesn't affect code

**Feature flags needed**: no

**Backwards compatibility**: maintained - Zero breaking changes

## Success Criteria

The fix is complete when:
- [ ] Both markdown files have all lines under 120 characters
- [ ] `pnpm lint:md` passes with zero errors
- [ ] `pnpm lint` passes completely
- [ ] `pnpm typecheck` passes
- [ ] `pnpm format` produces no changes
- [ ] Markdown files render correctly in GitHub
- [ ] No regressions in other markdown files
- [ ] `dev-deploy.yml` workflow would pass on next push

## Notes

This is a straightforward fix for a validation regression. The newer markdownlint version is actually correct - the two lines do exceed the 120-character limit. Rather than lowering standards or creating exceptions, we fix the content to meet the standard.

The fix is non-breaking and has zero risk since it only affects documentation.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1031*
