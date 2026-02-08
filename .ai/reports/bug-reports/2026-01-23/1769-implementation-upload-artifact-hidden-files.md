## ✅ Implementation Complete

### Summary
- Added `include-hidden-files: true` to `upload-artifact@v6` step in `artifact-sharing.yml` (line 165)
- Added `include-hidden-files: true` to `upload-artifact@v6` step in `reusable-build.yml` (line 133)
- This fixes the breaking change introduced by Dependabot PR #1578 (v4→v6 upgrade)

### Files Changed
```
 .github/workflows/artifact-sharing.yml | 1 +
 .github/workflows/reusable-build.yml   | 3 ++-
 2 files changed, 3 insertions(+), 1 deletion(-)
```

### Commits
```
a3e027b99 fix(ci): add include-hidden-files to upload-artifact@v6 steps
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm lint` - YAML syntax validated
- Python YAML parsing - Both files are valid YAML

### Root Cause
The `actions/upload-artifact@v6` changed default behavior to exclude hidden files/directories. Since `.next` is a hidden directory (starts with `.`), it was being excluded from artifact uploads, causing the "Validate Build Artifacts" job to fail with "Web build artifacts missing!"

### Fix Applied
Added `include-hidden-files: true` parameter to all `upload-artifact@v6` steps that upload `.next` directories:
1. `artifact-sharing.yml` - Primary build artifact sharing workflow
2. `reusable-build.yml` - Reusable build workflow

### Expected Outcome
After this fix:
- Artifact uploads should include >3000 files (instead of 288)
- "Validate Build Artifacts" job should succeed
- Staging deployment should complete successfully

---
*Implementation completed by Claude*
