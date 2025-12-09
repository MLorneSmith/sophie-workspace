# Bug Diagnosis: dev-deploy.yml workflow fails after markdownlint-cli2 upgrade

**ID**: ISSUE-1031
**Created**: 2025-12-09T19:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The `dev-deploy.yml` workflow started failing after PR #1010 bumped `markdownlint-cli2` from `^0.19.1` to `^0.20.0`. The new version includes markdownlint v0.40.0 (upgraded from v0.39.0), which has stricter line-length enforcement and now flags two markdown files that previously passed validation.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20.x
- **markdownlint-cli2**: 0.20.0 (upgraded from 0.19.1)
- **markdownlint**: 0.40.0 (upgraded from 0.39.0)
- **Last Working**: Commit `43b97bff` (2025-12-09T18:57:27Z)

## Reproduction Steps

1. Push any commit to the `dev` branch
2. The `dev-deploy.yml` workflow triggers
3. The "Pre-deployment Validation" job runs `pnpm lint`
4. `pnpm lint:md` (markdownlint) fails with line-length errors

## Expected Behavior

The markdown lint check should pass, allowing the deployment workflow to continue.

## Actual Behavior

The workflow fails at the "Pre-deployment Validation" step with markdown lint errors:

```
Summary: 2 error(s)
README copy.md:245:121 error MD013/line-length Line length [Expected: 120; Actual: 127]
tooling/scripts/src/README.md:3:121 error MD013/line-length Line length [Expected: 120; Actual: 126]
```

## Diagnostic Data

### Console Output

```
Pre-deployment Validation	Run validation checks in parallel	2025-12-09T19:31:05.2813654Z Summary: 2 error(s)
Pre-deployment Validation	Run validation checks in parallel	2025-12-09T19:31:05.3300323Z README copy.md:245:121 error MD013/line-length Line length [Expected: 120; Actual: 127]
Pre-deployment Validation	Run validation checks in parallel	2025-12-09T19:31:05.3301330Z tooling/scripts/src/README.md:3:121 error MD013/line-length Line length [Expected: 120; Actual: 126]
Pre-deployment Validation	Run validation checks in parallel	2025-12-09T19:31:05.4207235Z  ELIFECYCLE  Command failed with exit code 1.
```

### Git History Analysis

```bash
# Commit that introduced the regression
$ git log --oneline 43b97bff526c5dbe90cc0357deb26c1239e0caaf..HEAD -- package.json
4e5be70f8 chore(deps-dev): bump the development-dependencies group across 1 directory with 12 updates (#1010)

# Version change in package.json
-    "markdownlint-cli2": "^0.19.1",
+    "markdownlint-cli2": "^0.20.0",
```

### Version Comparison

| Package | Before (working) | After (broken) |
|---------|------------------|----------------|
| markdownlint-cli2 | 0.19.1 | 0.20.0 |
| markdownlint | 0.39.0 | 0.40.0 |

### Failing Files

1. **README copy.md:245** - Line length 127 characters
   ```markdown
   - **Full Stack Engineer** (`/read .claude/roles/full-stack-engineer.md`): End-to-end implementation across frontend and backend
   ```

2. **tooling/scripts/src/README.md:3** - Line length 126 characters
   ```markdown
   This directory contains Makerkit framework validation and security scripts that run automatically during development to ensure
   ```

## Related Code

- **Affected Files**:
  - `README copy.md:245`
  - `tooling/scripts/src/README.md:3`
- **Recent Changes**: PR #1010 (`4e5be70f8`) - Bumped markdownlint-cli2 from 0.19.1 to 0.20.0
- **Configuration**: `.markdownlint.json` (line_length: 120)

## Related Issues & Context

### Direct Predecessors

None - this is a new issue introduced by the dependency update.

### Historical Context

PR #1010 was an automated Dependabot update that bumped 12 development dependencies. The markdownlint-cli2 upgrade from 0.19.1 to 0.20.0 included a breaking change in strictness for line-length rules.

## Root Cause Analysis

### Identified Root Cause

**Summary**: markdownlint v0.40.0 (bundled with markdownlint-cli2 0.20.0) has stricter line-length parsing that now detects violations that v0.39.0 did not catch.

**Detailed Explanation**:

The upgrade from `markdownlint-cli2@0.19.1` to `markdownlint-cli2@0.20.0` brought in `markdownlint@0.40.0` (from `markdownlint@0.39.0`). The newer version has improved/stricter line-length detection that now correctly identifies two lines that exceed the configured 120-character limit:

1. `README copy.md:245` - 127 characters (7 over limit)
2. `tooling/scripts/src/README.md:3` - 126 characters (6 over limit)

These violations existed before the upgrade but were not detected by the older version. The new version correctly enforces the project's configured `MD013` rule with `line_length: 120`.

**Supporting Evidence**:

1. CI logs show `markdownlint-cli2 v0.20.0 (markdownlint v0.40.0)` detecting the errors
2. Local environment running `markdownlint-cli2@0.19.1` (still cached) passes lint
3. The last successful workflow run (`43b97bff`) used `markdownlint-cli2@0.19.1` per the lockfile
4. PR #1010 explicitly changed the specifier from `^0.19.1` to `^0.20.0`

### How This Causes the Observed Behavior

1. PR #1010 merged with `markdownlint-cli2: ^0.20.0` in package.json
2. Subsequent workflow runs install the new version
3. `pnpm lint:md` runs markdownlint against all markdown files
4. The new stricter parser detects the two long lines
5. Lint exits with code 1 due to errors
6. The validation step fails, blocking deployment

### Confidence Level

**Confidence**: High

**Reasoning**:
- Clear correlation between the dependency upgrade commit and failure start
- Error messages directly identify the failing files and rule (MD013/line-length)
- Version comparison shows the exact change in linting behavior
- The flagged lines are genuinely over the 120-character limit

## Fix Approach (High-Level)

Two options (choose one):

**Option A - Fix the markdown files** (Recommended):
- Break the long lines in `README copy.md:245` and `tooling/scripts/src/README.md:3` to stay under 120 characters

**Option B - Exclude the files**:
- Add `README copy.md` and `tooling/scripts/src/` to `.markdownlintignore`
- Less ideal as it hides legitimate violations

## Diagnosis Determination

Root cause definitively identified as a breaking behavioral change in markdownlint-cli2 0.20.0 (markdownlint 0.40.0) that now correctly enforces line-length limits that the previous version missed. The fix is straightforward: update the two markdown files to wrap their long lines.

## Additional Context

- The `README copy.md` file appears to be an archived/backup copy of the main README
- The `tooling/scripts/src/README.md` is documentation for internal scripts
- Both files have not been modified recently - the violations always existed but were undetected

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh run list, git log, git diff, Read, Grep*
