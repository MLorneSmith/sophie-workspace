# Bug Diagnosis: PR Validation Workflow Multiple Failures After Bug Fixes

**ID**: ISSUE-1749
**Created**: 2026-01-22T19:00:00Z
**Reporter**: User
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The PR Validation workflow continues to fail despite implementing bug fixes for issues #1740, #1743, #1744, and #1748. Analysis reveals multiple distinct root causes: (1) TypeScript check fails due to incomplete test file updates, (2) Aikido Security Scan finds real dependency vulnerabilities (not covered by #1744 which only disabled IaC scan), (3) Docker Security Scan fails due to GitHub permissions issues with SARIF uploads, and (4) Accessibility Tests timeout due to E2E database setup.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI/CD (GitHub Actions)
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase)
- **CI Runner**: runs-on (AWS spot instances)
- **Last Working**: N/A (workflow has multiple issues)

## Reproduction Steps

1. Create a PR targeting `staging` branch from `dev` branch
2. Observe PR Validation workflow run
3. Multiple jobs fail: TypeScript Check, Aikido Security Scan, Docker Security Scan, Accessibility Tests

## Expected Behavior

PR Validation workflow should pass after implementing fixes from issues #1740, #1743, #1744, and #1748.

## Actual Behavior

Five jobs fail in the workflow:
1. **TypeScript Check**: Fails with type error in orchestrator-events.spec.ts
2. **Aikido Security Scan**: Detects HIGH severity dependency vulnerabilities
3. **Docker Security Scan**: SARIF upload fails with permissions error
4. **Accessibility Tests**: E2E database setup times out
5. **PR Status Check**: Fails because dependent jobs failed

## Diagnostic Data

### TypeScript Check Error
```
lib/__tests__/orchestrator-events.spec.ts(72,8): error TS2740: Type '{ task_start: string; task_complete: string; task_failed: string; feature_start: string; feature_complete: string; group_complete: string; commit: string; push: string; error: string; health_warning: string; ... 14 more ...; db_verify: string; }' is missing the following properties from type 'Record<OrchestratorEventType, string>': completion_phase_start, sandbox_killing, review_sandbox_creating, dev_server_starting, and 2 more.
```

### Aikido Security Scan Errors
```
##[error]New issue detected with severity >=HIGH. Check it out at: https://app.aikido.dev/queue?sidebarIssue=12646656
##[error]New issue detected with severity >=HIGH. Check it out at: https://app.aikido.dev/queue?sidebarIssue=12646657
... (60+ HIGH severity issues detected)
##[error]dependency scan completed: found 0 new issues with severity >=HIGH.
```

Note: The message says "0 new issues" but still fails because existing issues exceed the threshold.

### Docker Security Scan Error
```
##[error]Resource not accessible by integration - https://docs.github.com/rest/actions/workflow-runs#get-a-workflow-run
```

### Accessibility Tests Timeout
The job starts E2E Supabase instance which pulls 13+ Docker images, causing significant startup time on spot instances.

## Error Stack Traces

### TypeScript Error Location
```
.ai/alpha/scripts/lib/__tests__/orchestrator-events.spec.ts:72
```

## Related Code

### Affected Files
1. `.ai/alpha/scripts/lib/__tests__/orchestrator-events.spec.ts` - Missing 6 event types in `messages` Record
2. `.ai/alpha/scripts/ui/types.ts` - Source of truth for `OrchestratorEventType`
3. `.github/workflows/pr-validation.yml` - Workflow configuration

### Recent Changes
- `3016d1c9b` - fix(ci): enable dependabot auto-rebase (Issue #1748)
- `915afc1d5` - fix(tooling): save manifest immediately on completion (#1747)
- `2bcdf69b3` - fix(tooling): fix arithmetic syntax error in build-wrapper.sh (Issue #1743)
- `7254e6447` - fix(ci): add PAYLOAD_SECRET env vars (Issue #1740)
- `8b8e4d8d7` - fix(ci): disable Aikido IaC scan (Issue #1744)

### Suspected Functions
- `getOrchestratorEventMessage()` in orchestrator-events.spec.ts (line 78-110)

## Related Issues & Context

### Direct Predecessors
- #1740 (CLOSED): "Bug Fix: PR Validation Workflow Fails - Missing PAYLOAD_SECRET" - Fixed PAYLOAD_SECRET but didn't address other failures
- #1743 (CLOSED): "Bug Fix: build-wrapper.sh Syntax Error" - Fixed but unrelated to current failures
- #1744 (CLOSED): "Bug Fix: Aikido Security Scan Fails with 402" - Disabled IaC scan only, dependency scan still active
- #1748 (CLOSED): "Bug Fix: PR Validation Fails on Dependabot PRs" - Fixed Dependabot rebase issues

### Infrastructure Issues
- Docker image pulling causes slow E2E setup in CI
- CodeQL SARIF upload permissions issue for PR contexts

### Same Component
- The orchestrator-events.spec.ts test was added recently and not fully updated to match types.ts

## Root Cause Analysis

### Identified Root Cause

**Summary**: Four independent root causes are preventing PR Validation from passing:

#### Root Cause 1: TypeScript Test File Out of Sync
**Location**: `.ai/alpha/scripts/lib/__tests__/orchestrator-events.spec.ts:78-110`

The `getOrchestratorEventMessage()` function defines a `messages` object typed as `Record<OrchestratorEventType, string>`, but it only contains 24 of the 30 event types defined in `types.ts`. Missing:
- `completion_phase_start`
- `sandbox_killing`
- `review_sandbox_creating`
- `dev_server_starting`
- `dev_server_ready`
- `dev_server_failed`

**Evidence**: TypeScript error TS2740 explicitly lists the missing properties.

#### Root Cause 2: Aikido Dependency Vulnerabilities
**Location**: Aikido Security Dashboard / package dependencies

Issue #1744 only disabled the IaC (Infrastructure as Code) scan with `fail-on-iac-scan: false`. The dependency scan (`fail-on-dependency-scan: true`) is still enabled and detecting real HIGH severity vulnerabilities in project dependencies.

**Evidence**: 60+ HIGH severity issues detected in Aikido scan output.

#### Root Cause 3: GitHub Permissions for SARIF Upload
**Location**: `.github/workflows/pr-validation.yml` - Docker Security Scan job

The CodeQL SARIF upload action requires `actions: read` permission to access workflow run information. While the workflow has this permission, pull requests from forked repositories or certain PR contexts have restricted access.

**Evidence**: Error message "Resource not accessible by integration" from github/codeql-action/upload-sarif@v4.

#### Root Cause 4: E2E Database Setup Slow
**Location**: Accessibility Tests job

The job runs `supabase start` which pulls 13+ Docker images. On CI spot instances, this can take significant time and may timeout or cause cascading delays.

**Evidence**: Logs show pulling postgres, kong, gotrue, imgproxy, realtime, logflare, postgrest, postgres-meta, storage-api, edge-runtime, studio, vector, mailpit containers.

### How This Causes the Observed Behavior

1. TypeScript Check job runs `pnpm typecheck` which fails on the spec file type mismatch
2. Aikido scan detects existing vulnerabilities and fails per configuration
3. Docker Security Scan's SARIF upload hits GitHub API permission limits
4. Accessibility Tests job eventually fails due to database setup or cascading effects
5. PR Status Check fails because upstream jobs failed

### Confidence Level

**Confidence**: High

**Reasoning**:
- TypeScript error message explicitly identifies the missing properties
- Aikido scan output shows dependency vulnerabilities (not IaC issues)
- Docker scan error message confirms permissions issue
- All evidence is directly from CI logs

## Fix Approach (High-Level)

1. **TypeScript Test Fix**: Add the 6 missing event type messages to `orchestrator-events.spec.ts` at line 103 (after `db_verify`):
   - `completion_phase_start: "Starting completion phase"`
   - `sandbox_killing: "Killing sandboxes"`
   - `review_sandbox_creating: "Creating review sandbox"`
   - `dev_server_starting: "Starting development server"`
   - `dev_server_ready: "Development server ready"`
   - `dev_server_failed: "Development server failed"`

2. **Aikido Vulnerabilities**: Either:
   - Address the dependency vulnerabilities by updating affected packages
   - Or temporarily set `fail-on-dependency-scan: false` if these are false positives or acceptable risks
   - Or increase `minimum-severity` to CRITICAL if HIGH findings are acceptable

3. **Docker Security Scan**: Add condition to skip SARIF upload for contexts where permissions are limited:
   ```yaml
   if: github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository
   ```

4. **Accessibility Tests**: Consider caching Docker images or using pre-built Supabase containers for CI.

## Diagnosis Determination

The PR Validation workflow fails due to four independent issues, only partially addressed by the previous bug fixes:

1. **Issues #1740, #1743, #1748 were correctly fixed** for their specific problems
2. **Issue #1744 only partially fixed** - disabled IaC scan but dependency scan still fails
3. **New TypeScript error** introduced when event types were added without updating the test file
4. **Pre-existing infrastructure issues** with Docker permissions and E2E setup timing

The most impactful fix is adding the missing event types to the test file, as this is blocking the TypeScript check which is a required status check.

## Additional Context

The failing runs are on the "Promote Dev to Staging" PR, which runs the full validation suite. Recent successful runs (at 16:48, 16:33, 16:26, 16:15, 16:11) were likely skipped due to the check-skip job detecting recent successful dev branch runs.

The Dependabot PR for tar package update is also failing with the same issues, confirming these are systematic failures not specific to the promotion PR.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view, gh issue view, Read, Grep, Bash*
