## ✅ Implementation Complete

### Summary
- Added fresh-clone validation to `createReviewSandbox()` that removes node_modules and runs `pnpm install --frozen-lockfile` + `pnpm typecheck` to catch dependency issues before code leaves sandbox
- Fixed `createSandbox()` to detect lockfile changes compared to origin/dev and run `pnpm install` (not `--frozen-lockfile`) when the branch added new dependencies
- Created `alpha-validation.yml` CI workflow for `alpha/spec-*` branches that runs fresh-clone validation on push
- Documented the "Dependency Installation Task Pattern" in `task-decompose.md` with best practices for tasks that add npm packages
- Added `requires_dependency_install` and `packages_added` optional fields to tasks.schema.json
- Added reminder #11 about dependency task handling to `implement.md` Important Reminders section

### Files Changed
```
 .ai/alpha/scripts/lib/sandbox.ts        | 99 ++++++----
 .ai/alpha/templates/tasks.schema.json   | 10 +
 .claude/commands/alpha/implement.md     |  5 +
 .claude/commands/alpha/task-decompose.md| 89 ++++++++
 .github/workflows/alpha-validation.yml  | 45 ++++ (new)
```

### Commits
```
2bc58d767 chore(tooling): add alpha workflow validation safeguards
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm typecheck` - 40/40 packages passed
- `pnpm --filter @slideheroes/alpha-scripts typecheck` - passed
- Documentation files exist and are valid
- Sandbox module exports unchanged (no breaking changes)
- YAML workflow file is valid

### Notes
- The biome lint has a pre-existing configuration issue unrelated to this change
- Fresh-clone validation adds ~10 minutes to review sandbox creation but catches the exact issue from #1802
- The CI workflow will start validating alpha branches immediately on next push

---
*Implementation completed by Claude*
