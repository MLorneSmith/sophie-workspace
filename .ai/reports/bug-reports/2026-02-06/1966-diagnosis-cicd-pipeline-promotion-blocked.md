# Bug Diagnosis: CI/CD Pipeline - Staging Promotion Blocked & Workflow Audit

**ID**: ISSUE-pending
**Created**: 2026-02-06T17:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

After pushing commit `4fb6d28` (fixing the dev-promotion-readiness 403 and staging E2E Payload build issues from #1965), the dev pipeline now succeeds end-to-end. However, the automated staging promotion is blocked because PR #1958 (dev -> staging) has merge conflicts caused by squash-merge history divergence. Additionally, the pipeline has 34 workflows—many of which are dead, duplicated, or experimental—creating maintenance burden and confusion about pipeline health. A secondary issue is that the Lighthouse performance baseline job in dev-integration-tests fails due to Chrome not launching on RunsOn self-hosted runners.

## Environment

- **Application Version**: dev branch at commit 4fb6d2844
- **Environment**: CI/CD (GitHub Actions)
- **Node Version**: 20.x
- **Last Working**: 2026-02-04 (PR #1928 was the last successful staging promotion)

## Reproduction Steps

1. Push any commit to `dev` branch
2. Observe full dev pipeline completes (deploy, integration tests, promotion readiness)
3. Dev Promotion Readiness creates/updates PR #1958 (dev -> staging) with auto-merge enabled
4. PR #1958 shows `mergeStateStatus: DIRTY`, `mergeable: CONFLICTING`
5. Auto-merge cannot proceed, staging deploy never triggers

## Expected Behavior

After dev pipeline succeeds and promotion readiness score >= 75, PR #1958 should auto-merge into staging, triggering the staging deploy pipeline.

## Actual Behavior

PR #1958 is stuck in CONFLICTING state. Three files have merge conflicts. The staging promotion chain is completely blocked.

## Diagnostic Data

### PR #1958 Conflict Analysis

Three files conflict between `dev` and `staging`:

1. **`.github/workflows/dev-promotion-readiness.yml`** - Staging has old GITHUB_TOKEN approval pattern; dev has new Approval Bot token pattern (fix from #1965)
2. **`.github/workflows/staging-deploy.yml`** - Staging has static RunsOn label; dev has dynamic `github.run_id` label (correct pattern)
3. **`.ai/alpha/specs/S1918-Spec-user-dashboard/spec-manifest.json`** - Orchestrator state divergence

**Root cause of conflicts**: PRs #1928 and #1941 were squash-merged into staging, creating synthetic commits that differ from dev's individual commits. When dev then got more commits (including #1965 fixes that modified the same files), Git cannot reconcile the squashed vs unsquashed histories.

### Branch Divergence

- Commits in dev but not staging: **88**
- Commits in staging but not dev: **2** (squash merge commits from PRs #1928, #1941)

### Promotion Readiness Assessment (Latest Run)

```
successRate: 100%
codeCoverage: 85% (placeholder)
recentFailures: 0
pendingCommits: 88
changedFiles: 140 (exceeds 100 file limit - notTooManyChanges: false)
Score: 80/100 (passes 75 threshold)
Decision: Ready for promotion
```

### Lighthouse Chrome Failure (Dev Integration Tests)

```
Run #1...failed!
Error: Lighthouse failed with exit code 1
LH:ChromeLauncher Waiting for browser............... (60+ seconds)
```

Chrome cannot launch on RunsOn self-hosted runners. The job runs `treosh/lighthouse-ci-action@v12` which needs Chrome/Chromium installed, but RunsOn images may not have it pre-installed.

### Workflow Inventory (34 total)

**Active**: 28 workflows
**Disabled**: 6 workflows (Claude Code Review, CodeQL x2, Deploy to Dev Simple, Deploy to Dev v2, Test Ubicloud Runner)

**Candidates for removal (8)**:
- Legacy Workflow (To Be Deprecated) - name says it all
- Deploy to Dev Simple - disabled, superseded
- Deploy to Dev v2 - disabled, superseded
- Test Ubicloud Runner - disabled experiment
- Deploy to Staging (Simple Test) - active test, should be temporary
- Test RunsOn Staging - active test, should be temporary
- CodeQL - disabled, Semgrep covers this
- CodeQL Security Analysis - disabled, duplicate

**Candidates for consolidation (5 -> 2)**:
- E2E Test Matrix + E2E Tests (Sharded) + E2E Smart Tests -> one E2E strategy
- Reusable Build + Reusable Build or Reuse + Build Artifact Sharing -> one build strategy

## Related Issues & Context

### Direct Predecessors
- #1965 (OPEN): "CI/CD Pipeline Comprehensive Assessment" - parent diagnosis, fixes applied
- #1942 (CLOSED): "CI/CD Configuration Drift" - partially fixed

### Related Infrastructure Issues
- #1848: PR conflicts due to squash merge history divergence (same root cause)
- #1897: Dynamic job-index labels caused shards to get stuck
- #1896: RunsOn staging shard scheduling failures

### Historical Context
- #417: CI/CD Critical 57% Success Rate (Sep 2025)
- #168: Inconsistent deployment approaches (Jul 2025)
- Pattern: CI/CD complexity has been growing unchecked since mid-2025

## Root Cause Analysis

### Identified Root Cause

**Summary**: PR #1958 has merge conflicts because squash-merge creates synthetic commits on staging that diverge from dev's individual commit history, and commit `4fb6d28` modified the same files that were previously squash-merged.

**Detailed Explanation**:
The `sync-dev-with-staging` job in `staging-deploy.yml` is supposed to prevent this by merging staging back into dev after each promotion. However, the last two staging deployments (PRs #1928, #1941) both failed during the staging deploy step (E2E failures), so the sync job never ran. This means staging has 2 squash-merge commits that dev doesn't know about, and dev has 88 commits that staging doesn't have—including modifications to the exact same workflow files.

**Supporting Evidence**:
- `git log origin/dev..origin/staging` shows 2 squash commits
- PR #1958 `mergeable: CONFLICTING`, `mergeStateStatus: DIRTY`
- Conflict in all three files confirmed via `git merge --no-commit`

### How This Causes the Observed Behavior

1. Dev pipeline succeeds and promotion readiness creates PR #1958
2. PR has conflicts -> GitHub cannot auto-merge
3. No merge -> no push to staging branch
4. No push to staging -> Deploy to Staging never triggers
5. No staging deploy -> Staging Promotion Readiness never triggers
6. Entire staging -> production pipeline is blocked

### Confidence Level

**Confidence**: High

**Reasoning**: Confirmed conflicts via test merge. All three conflict files and their resolution strategies are verified. The squash-merge divergence pattern is well-documented (#1848).

## Fix Approach (High-Level)

1. **Immediate**: Close PR #1958. Force-push staging to match dev (since staging's 2 extra squash commits are already in dev's history). Or: merge dev into staging locally, resolve 3 conflicts (all favor dev), push to staging.
2. **Lighthouse fix**: Add `continue-on-error: true` to the Capture Performance Baseline job in dev-integration-tests.yml, or install Chrome dependencies in the job.
3. **Workflow cleanup**: Disable/delete the 8 identified dead workflows. Consolidate the 5 duplicate workflows into 2.

## Diagnosis Determination

The staging promotion pipeline is blocked by merge conflicts in PR #1958, caused by squash-merge history divergence between dev and staging. The fix is to resolve the conflicts (all three favor dev's version) and merge. The secondary Lighthouse issue and workflow bloat should be addressed as follow-up items.

## Additional Context

The `notTooManyChanges` check (140 files > 100 limit) is failing but doesn't block promotion since the overall score is 80/100 (above 75 threshold). However, the 140-file diff size suggests staging is significantly behind dev and promotions should happen more frequently.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, git merge-tree, git merge --no-commit, workflow run inspection*
