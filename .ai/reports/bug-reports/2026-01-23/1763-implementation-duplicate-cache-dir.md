## Implementation Complete

### Summary
- Removed duplicate `--cache-dir=.turbo` argument from `.github/workflows/artifact-sharing.yml` line 126
- Found and fixed same issue in `.github/workflows/reusable-build.yml` (3 occurrences)
- Found and fixed same issue in `.github/workflows/e2e-smart.yml` (1 occurrence)
- Package.json build script remains the single source of truth for `--cache-dir` configuration

### Root Cause
The `--cache-dir=.turbo` flag was being passed twice to Turbo CLI:
1. In the package.json build script: `"build": "./.claude/statusline/build-wrapper.sh turbo build --cache-dir=.turbo"`
2. In workflow files when calling `pnpm build --cache-dir=.turbo`

This caused Turbo CLI to fail with: "the argument '--cache-dir <CACHE_DIR>' cannot be used multiple times"

### Files Changed
```
.github/workflows/artifact-sharing.yml | 2 +-
.github/workflows/e2e-smart.yml        | 2 +-
.github/workflows/reusable-build.yml   | 6 +++---
```

### Commits
```
ce6a5ff89 fix(ci): remove duplicate --cache-dir argument from workflow files
```

### Validation Results
All validation commands passed successfully:
- Verified no more `pnpm build --cache-dir` patterns exist in workflow files
- Verified package.json still has the `--cache-dir=.turbo` flag
- Pre-commit hooks passed (yamllint, trufflehog)
- Commit follows conventional commit format

### Follow-up Items
- Monitor the next Deploy to Staging workflow run to confirm the fix works in CI
- No other follow-up work needed

---
*Implementation completed by Claude*
