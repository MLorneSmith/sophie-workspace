## ✅ Implementation Complete

### Summary
- Replaced RunsOn dynamic labels with `ubuntu-latest` in the `test-shards` job
- Added comprehensive documentation comment explaining the runner configuration choice
- Referenced diagnosis issue #1896 and historical issues (#951, #952, #959, #961, #1709, #1710)
- Configuration now matches the proven working `e2e-sharded.yml` workflow

### Files Changed
```
.github/workflows/staging-deploy.yml | 16 ++++++++++++++--
1 file changed, 14 insertions(+), 2 deletions(-)
```

### Key Change
```yaml
# Before (broken):
runs-on: "runs-on=${{ github.run_id }}-job-${{ strategy.job-index }}/runner=4cpu-linux-x64"

# After (fixed):
runs-on: ubuntu-latest
```

### Commits
```
798c1db04 fix(ci): align staging-deploy E2E runners with working e2e-sharded config
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - 40 tasks completed, all passed
- `pnpm lint` - All checks passed (biome, manypkg, yaml-lint, markdownlint)
- YAML syntax validated

### Expected Behavior After Fix
- All 12 E2E test shards will start immediately (not stuck in "queued")
- Shards will complete with pass/fail status (no PGRST301 JWT errors)
- Deployment to staging will proceed successfully after E2E tests

### Follow-up Items
- None required - this is a proven configuration from `e2e-sharded.yml`
- Monitor first staging deployment to confirm all shards run successfully

---
*Implementation completed by Claude*
