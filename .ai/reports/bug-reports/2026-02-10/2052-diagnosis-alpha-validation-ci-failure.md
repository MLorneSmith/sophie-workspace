# Bug Diagnosis: Alpha validation CI workflow fails at pnpm setup + GPT template not rebuilt

**ID**: ISSUE-2052
**Created**: 2026-02-10T16:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The `alpha-validation.yml` GitHub Actions workflow fails immediately at the "Setup pnpm" step for all pushes to `alpha/spec-S2045`. The root cause is `pnpm/action-setup@v4` rejecting dual pnpm version specification (workflow YAML + `package.json` `packageManager` field). Additionally, the E2B sandbox template (`template.ts`) was updated with agent-browser but never rebuilt, and the GPT template Dockerfile installs `pnpm@9` while the project requires `pnpm@10.29.2`.

## Environment

- **Application Version**: dev branch (commit 4b89c7dbf)
- **Environment**: CI (GitHub Actions) + E2B sandboxes
- **Node Version**: 22 (CI), 20 (E2B template)
- **Database**: PostgreSQL (Supabase sandbox)
- **Last Working**: 2026-02-05 (run 21730254190 on alpha/spec-S1918 succeeded)

## Reproduction Steps

1. Push any commit to a branch matching `alpha/spec-*`
2. GitHub Actions triggers `alpha-validation.yml`
3. Workflow fails at "Setup pnpm" step within ~34 seconds

## Expected Behavior

CI should install pnpm, run typecheck, and build successfully.

## Actual Behavior

CI fails immediately with:
```
Error: Multiple versions of pnpm specified:
  - version 10.29.2 in the GitHub Action config with the key "version"
  - version pnpm@10.29.2+sha512.bef43fa... in the package.json with the key "packageManager"
Remove one of these versions to avoid version mismatch errors like ERR_PNPM_BAD_PM_VERSION
```

## Diagnostic Data

### Console Output
```
Run pnpm/action-setup@v4
Error: Multiple versions of pnpm specified:
  - version 10.29.2 in the GitHub Action config with the key "version"
  - version pnpm@10.29.2+sha512.bef43fa759d91fd2da4b319a5a0d13ef7a45bb985a3d7342058470f9d2051a3ba8674e629672654686ef9443ad13a82da2beb9eeb3e0221c87b8154fff9d74b8 in the package.json with the key "packageManager"
Remove one of these versions to avoid version mismatch errors like ERR_PNPM_BAD_PM_VERSION
```

### CI Run History
| Run ID | Date | Branch | Result | Duration |
|--------|------|--------|--------|----------|
| 21869340596 | 2026-02-10 14:40 | alpha/spec-S2045 | failure | 34s |
| 21839162302 | 2026-02-09 20:20 | alpha/spec-S2045 | failure | 36s |
| 21730254190 | 2026-02-05 22:05 | alpha/spec-S1918 | success | 5m40s |

### E2B Template Status
| Template | Alias | Built | Template ID | Issue |
|----------|-------|-------|-------------|-------|
| Claude (dev) | slideheroes-claude-agent-dev | 2025-11-27 | uoqh571cufkj91c7855s | Not rebuilt since agent-browser added |
| GPT (dev) | slideheroes-gpt-agent-dev | 2026-02-03 | 3gil4oz7vo9ij2ki9zmm | Dockerfile uses pnpm@9 |

### GPT Template Dockerfile Issue
```dockerfile
# .ai/alpha/e2b-templates/slideheroes-gpt-agent-dev/e2b.Dockerfile
RUN npm install -g pnpm@9    # <-- Project requires pnpm@10.29.2!
```

## Error Stack Traces
```
N/A - Configuration error, not a runtime exception
```

## Related Code
- **Affected Files**:
  - `.github/workflows/alpha-validation.yml` (line 36-38)
  - `.github/workflows/bundle-size-alert.yml` (line 40-42) - same pattern
  - `.ai/alpha/e2b-templates/slideheroes-gpt-agent-dev/e2b.Dockerfile` (line 18)
  - `packages/e2b/e2b-template/template.ts` (updated, not rebuilt)
- **Recent Changes**: Issues #1955, #1956, #1957, #1959, #1961, #1962 refactored orchestrator
- **Suspected Functions**: pnpm/action-setup@v4 version detection

## Related Issues & Context

### Direct Predecessors
- #1955 (CLOSED): "Centralize feature status transitions" - Orchestrator refactor
- #1956 (CLOSED): "Extract shared createLogger" - Code cleanup
- #1957 (CLOSED): "Runtime validation for progress file status" - GPT status fix
- #1959 (CLOSED): "Reduce sandbox stagger" - Performance improvement
- #1961 (CLOSED): "Phase support for orchestrator" - Phase execution
- #1962 (CLOSED): "Max 12 tasks per feature" - Task limit enforcement

### Same Component
- #2048: agent-browser integration (updated template.ts, needs rebuild)

### Historical Context
The `pnpm/action-setup@v4` action changed behavior to enforce single-source version specification. When `package.json` has a `packageManager` field, the action no longer accepts a separate `version` parameter. Most workflows in this repo already omit the version parameter, but `alpha-validation.yml` and `bundle-size-alert.yml` still pass it explicitly.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Three interrelated issues - (1) CI workflow passes redundant pnpm version, (2) Claude template not rebuilt after agent-browser addition, (3) GPT template Dockerfile has stale pnpm version.

**Detailed Explanation**:

**Issue 1 (CI Failure - PRIMARY)**: The `alpha-validation.yml` workflow at line 36-38 passes `version: ${{ env.PNPM_VERSION }}` (10.29.2) to `pnpm/action-setup@v4`. However, `package.json` also specifies `"packageManager": "pnpm@10.29.2+sha512..."`. The `pnpm/action-setup@v4` action now enforces that only ONE source can specify the version. Other workflows in the repo (`dev-deploy.yml`, `dependabot-auto-merge.yml`, `scheduled-maintenance.yml`) already omit the version parameter and work correctly.

**Issue 2 (Template Not Rebuilt)**: `packages/e2b/e2b-template/template.ts` was updated to include `agent-browser` installation (line 264, 275-277), but the Claude dev template (`slideheroes-claude-agent-dev`) was last built on 2025-11-27 (over 2 months ago). E2B templates are immutable - changes to `template.ts` only take effect when rebuilt via `pnpm e2b:build:dev`. Currently running with GPT template so this doesn't block S2045.

**Issue 3 (GPT pnpm Mismatch)**: The GPT template Dockerfile (`.ai/alpha/e2b-templates/slideheroes-gpt-agent-dev/e2b.Dockerfile`) installs `pnpm@9` while the project's `packageManager` field requires `pnpm@10.29.2`. The sandbox setup code works around this by running `pnpm install` at runtime, but this creates a version mismatch. Currently non-blocking because `corepack` isn't enabled in the GPT template.

**Supporting Evidence**:
- CI log: "Multiple versions of pnpm specified" error at setup step
- `alpha-validation.yml:36-38`: `version: ${{ env.PNPM_VERSION }}` passed to action
- `package.json`: `"packageManager": "pnpm@10.29.2+sha512..."`
- E2B template list: Claude dev template created 2025-11-27, GPT dev template created 2026-02-03
- GPT Dockerfile line 18: `RUN npm install -g pnpm@9`

### How This Causes the Observed Behavior

1. **CI**: Every push to `alpha/spec-*` triggers the workflow. `pnpm/action-setup@v4` reads both version sources and rejects the ambiguity. The workflow never reaches typecheck/build steps. This means NO code pushed by the Alpha orchestrator to `alpha/spec-S2045` has been validated by CI.

2. **Template**: Sandboxes created from the current GPT template work because the runtime setup clones the repo and runs `pnpm install`. But the template hasn't been updated with latest tooling (agent-browser for visual verification), and the pnpm version mismatch could cause subtle issues.

### Confidence Level

**Confidence**: High

**Reasoning**: The CI error message is unambiguous and the fix is deterministic. The template issues are confirmed by E2B template list timestamps and Dockerfile inspection. All 5 other workflows that omit the version parameter succeed.

## Fix Approach (High-Level)

**Issue 1 (CI - immediate fix)**: Remove the `version: ${{ env.PNPM_VERSION }}` parameter from `pnpm/action-setup@v4` in `alpha-validation.yml` (and `bundle-size-alert.yml`). Remove the `PNPM_VERSION` env var. Let the action auto-detect from `package.json`'s `packageManager` field.

**Issue 2 (Claude Template - recommended)**: Run `pnpm e2b:build:dev` to rebuild the Claude dev template with agent-browser and latest tooling. Not urgent since S2045 uses GPT provider.

**Issue 3 (GPT Template - recommended)**: Update the GPT Dockerfile to use `pnpm@10` or preferably enable corepack to match `packageManager` field. Then rebuild via `e2b template build` in the GPT template directory.

## Diagnosis Determination

The primary blocker (CI failure) has a clear, simple root cause: redundant pnpm version specification in the workflow file. This is a 2-line fix. The template issues are secondary and don't block the current S2045 run but should be addressed to prevent future problems.

## Additional Context

- S2045 orchestrator is currently running with 9 active sandboxes (3 from current run + 6 from previous attempts)
- The orchestrator itself is functioning correctly - the refactors from #1955-#1962 are working
- Skill YAML parsing errors appear in Codex logs (10 skills) but are non-blocking (graceful degradation)
- The sandboxes are actively implementing features (I1.F1 and I1.F2 both in_progress)

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view --log-failed, gh issue view, npx e2b sandbox list, npx e2b template list, grep, glob, read*
