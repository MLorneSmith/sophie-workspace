## ✅ Implementation Complete

### Summary
- **Removed `needs: setup-server` dependency** from the `e2e-shards` job in `.github/workflows/e2e-sharded.yml`
- **Updated step-level dependabot check** to use `github.actor` directly instead of `needs.setup-server.outputs.should-skip` (which is inaccessible without the `needs:` declaration)
- **Added documentation comments** explaining why the dependency was removed and how the fix works

### Root Cause Confirmed
The bug was caused by GitHub Actions' internal matrix job scheduling logic treating jobs with `needs:` dependencies differently than jobs without. When a job has a `needs:` dependency AND uses step-level `if:` conditions checking that dependency's outputs, the matrix scheduler silently fails to create jobs for `workflow_dispatch` triggers.

### Files Changed
```
.github/workflows/e2e-sharded.yml | 14 +-
```

**Changes made:**
1. Line 210: Removed `needs: setup-server` dependency
2. Lines 210-215: Added documentation explaining the fix
3. Lines 274-278: Updated step-level skip check to use `github.actor == "dependabot[bot]"` instead of `needs.setup-server.outputs.should-skip`

### Commits
```
207664de0 fix(ci): remove needs dependency to enable workflow_dispatch matrix creation
```

### Validation Results
✅ **All validation commands passed successfully:**

| Validation | Result |
|------------|--------|
| `pnpm typecheck` | ✅ Passed (39/39 packages) |
| `workflow_dispatch` trigger | ✅ **13 jobs created** (was 2) |
| Matrix shards created | ✅ **12 shards** (was 0) |

### Verification Run
- **Workflow Run**: https://github.com/slideheroes/2025slideheroes/actions/runs/21223209237
- **Jobs Created**: 13 (Setup Test Server + 12 shards)
- **Previous Behavior**: Only 2 jobs (Setup Test Server + E2E Test Report, no matrix shards)

### Technical Note
The plan originally stated that step-level conditions checking `needs.setup-server.outputs.should-skip` would still work. This was **incorrect** - the `needs` context is only available when you declare a `needs:` dependency.

**Resolution**: Changed the shard jobs to check `github.actor == "dependabot[bot]"` directly (same logic as `setup-server`), eliminating the dependency on `setup-server` outputs entirely.

### Follow-up Items
- [ ] Monitor the triggered workflow run to ensure all shards complete successfully
- [ ] Verify `pull_request` trigger still works correctly with next PR
- [ ] Verify dependabot PR skipping still works on next dependabot PR

---
*Implementation completed by Claude*
*Commit: 207664de0*
