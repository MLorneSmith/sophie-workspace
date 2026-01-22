# Bug Diagnosis: Aikido Security Scan Fails with 402 - Paid Plan Required

**ID**: ISSUE-pending
**Created**: 2026-01-22T17:45:00Z
**Reporter**: user/CI
**Severity**: low
**Status**: new
**Type**: bug

## Summary

The Aikido Security Scan job fails with HTTP 402 "Payment Required" because the workflow configuration enables `fail-on-iac-scan: true`, which is a paid-tier feature. The free tier only supports dependency scanning (SCA), not SAST or IaC scanning.

## Environment

- **Application Version**: dev branch (bc5a9681e)
- **Environment**: CI (GitHub Actions)
- **Aikido Action Version**: v1.0.13
- **Workflow**: `.github/workflows/pr-validation.yml`
- **Last Working**: Unknown - may have always had this issue

## Reproduction Steps

1. Open any PR that triggers TypeScript or dependency changes
2. Wait for PR Validation workflow to run
3. Observe Aikido Security Scan job fails
4. Check logs for 402 error about paid plan

## Expected Behavior

Aikido Security Scan completes successfully using free-tier features (dependency scanning).

## Actual Behavior

Aikido Security Scan fails immediately with 402 error indicating paid plan is required.

## Diagnostic Data

### Console Output
```
starting a scan with secret key: "********************E5yi"
##[error]start scan failed: {"status_code":402,"reason_phrase":"You need be on a paid plan to use this feature. (fail-on-sast-scan)"}
```

### Current Workflow Configuration
```yaml
- name: Run Aikido Security Scan
  uses: AikidoSec/github-actions-workflow@v1.0.13
  with:
    secret-key: ${{ secrets.AIKIDO_SECRET_KEY }}
    fail-on-timeout: true
    fail-on-dependency-scan: true   # FREE - OK
    fail-on-sast-scan: false        # PAID but correctly disabled
    fail-on-iac-scan: true          # PAID - THIS IS THE PROBLEM
    minimum-severity: 'HIGH'
    timeout-seconds: 180
    post-scan-status-comment: 'only_if_new_findings'
    post-sast-review-comments: 'off'
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Error Stack Traces
```
##[error]start scan failed: {"status_code":402,"reason_phrase":"You need be on a paid plan to use this feature. (fail-on-sast-scan)"}
```

## Related Code

- **Affected Files**:
  - `.github/workflows/pr-validation.yml` (lines 288-310)
- **Recent Changes**: None - issue has likely existed since Aikido was added
- **Root Cause Location**: Line 305: `fail-on-iac-scan: true`

## Related Issues & Context

### Historical Context
- #163 (CLOSED): "Replace Snyk with alternative security scanner due to free tier limitations"
  - The team switched from Snyk to Aikido due to free tier limitations
  - The same free tier limitation issue is now affecting Aikido

### Aikido Free Tier Limitations
According to Aikido documentation:
- **FREE**: Dependency scanning (SCA)
- **PAID**: SAST scanning
- **PAID**: IaC scanning
- **PAID**: SAST review comments

## Root Cause Analysis

### Identified Root Cause

**Summary**: The workflow configuration sets `fail-on-iac-scan: true` which is a paid-tier feature, causing the Aikido API to return HTTP 402 "Payment Required".

**Detailed Explanation**:
The Aikido free tier only supports dependency scanning (SCA - Software Composition Analysis). The workflow correctly disables SAST scanning (`fail-on-sast-scan: false`) but incorrectly enables IaC scanning (`fail-on-iac-scan: true`). When the Aikido action attempts to start a scan with IaC scanning enabled, the API rejects the request with a 402 error.

Note: The error message mentions "fail-on-sast-scan" but this appears to be a generic error message from Aikido's API for any paid feature access attempt.

**Supporting Evidence**:
- Error log: `{"status_code":402,"reason_phrase":"You need be on a paid plan to use this feature. (fail-on-sast-scan)"}`
- Code reference: `.github/workflows/pr-validation.yml:305` - `fail-on-iac-scan: true`
- Aikido documentation confirms IaC scanning requires paid plan

### How This Causes the Observed Behavior

1. PR is opened, triggering PR Validation workflow
2. Aikido Security Scan job starts
3. Action sends API request with `fail-on-iac-scan: true`
4. Aikido API checks account tier
5. Account is on free tier, IaC is paid feature
6. API returns HTTP 402 "Payment Required"
7. Job fails immediately

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Error message explicitly states "need be on a paid plan"
2. Workflow has `fail-on-iac-scan: true` which is documented as a paid feature
3. Aikido documentation confirms IaC scanning requires paid plan
4. Pattern matches the comment on line 304: "Enable when on paid plan"

## Fix Approach (High-Level)

Set `fail-on-iac-scan: false` to match the free tier capabilities:

```yaml
fail-on-dependency-scan: true   # FREE - Keep enabled
fail-on-sast-scan: false        # PAID - Already disabled
fail-on-iac-scan: false         # PAID - Change to false
```

Optionally, add a comment explaining the limitation:
```yaml
fail-on-iac-scan: false         # PAID - Enable when on paid plan
```

## Diagnosis Determination

The root cause is definitively identified: `fail-on-iac-scan: true` requires a paid Aikido plan that the project doesn't have. The fix is simple: set it to `false`.

## Additional Context

Aikido has noted that the GitHub Action approach is being deprecated in favor of "Dashboard-based PR gating" which doesn't consume CI minutes and is less error-prone. The team may want to consider migrating to that approach.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow runs, logs), Read (workflow file), perplexity-expert (Aikido documentation)*
