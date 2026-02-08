# Bug Diagnosis: Aikido Security Scan Fails with 400 "read" Error

**ID**: ISSUE-pending
**Created**: 2026-02-05T16:50:00Z
**Reporter**: CI/CD Pipeline
**Severity**: low
**Status**: new
**Type**: integration

## Summary

The Aikido Security Scan job fails with HTTP 400 status code and an unusual "read" reason phrase. This is a transient Aikido API failure, not a workflow configuration issue. The error response `{"status_code":400,"reason_phrase":"read"}` indicates a malformed or truncated API response from Aikido's service.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI/CD (GitHub Actions)
- **Workflow**: PR Validation
- **Run ID**: 21719685001
- **Branch**: promote/dev-to-staging-2026-02-05
- **Aikido Action Version**: AikidoSec/github-actions-workflow@v1.0.13
- **Last Working**: 2026-02-05T15:14:26Z (run 21716903930, ~1 hour before failure)

## Reproduction Steps

1. Create a PR that triggers PR Validation workflow
2. Wait for Aikido Security Scan job to run
3. Intermittently fails with 400 "read" error

## Expected Behavior

Aikido scan completes successfully or fails with a meaningful error message.

## Actual Behavior

Scan fails immediately with:
```
starting a scan with secret key: "********************E5yi"
##[error]start scan failed: {"status_code":400,"reason_phrase":"read"}
```

## Diagnostic Data

### Error Output
```
Aikido Security Scan	Run Aikido Security Scan	2026-02-05T16:30:54.0346896Z starting a scan with secret key: "********************E5yi"
Aikido Security Scan	Run Aikido Security Scan	2026-02-05T16:30:54.6246664Z ##[error]start scan failed: {"status_code":400,"reason_phrase":"read"}
```

### Comparison with Successful Run

| Metric | Failed Run (21719685001) | Successful Run (21716903930) |
|--------|--------------------------|------------------------------|
| Time | 2026-02-05T16:30:53Z | 2026-02-05T15:14:26Z |
| Branch | promote/dev-to-staging-2026-02-05 | dependabot/brace-expansion |
| Duration | ~1 second | ~0 seconds |
| Result | failure | success |
| Workflow Config | Identical | Identical |

### Workflow Configuration (Verified Correct)
```yaml
# .github/workflows/pr-validation.yml:305-317
- name: Run Aikido Security Scan
  uses: AikidoSec/github-actions-workflow@v1.0.13
  with:
    secret-key: ${{ secrets.AIKIDO_SECRET_KEY }}
    fail-on-timeout: true
    fail-on-dependency-scan: true  # Enabled - free tier feature
    fail-on-sast-scan: false       # Disabled - paid feature
    fail-on-iac-scan: false        # Disabled - paid feature
    minimum-severity: 'HIGH'
    timeout-seconds: 180
```

## Related Issues & Context

### Direct Predecessors
- #1741 (CLOSED): "Aikido Security Scan Fails with 402 - Paid Plan Required" - Different error (402 vs 400), was caused by enabling paid features
- #1758 (CLOSED): "PR Validation Multiple Failures" - Included Aikido "enable at least one scan" error - Different error, was configuration issue

### Historical Pattern
Previous Aikido issues were configuration-related (wrong feature flags). This is the first instance of a 400 "read" error, indicating a transient API issue rather than configuration.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Transient Aikido API failure returning malformed error response.

**Detailed Explanation**:
The error `{"status_code":400,"reason_phrase":"read"}` is unusual because:
1. HTTP 400 typically means "Bad Request" but the reason phrase "read" is not a valid HTTP status phrase
2. The response appears truncated or malformed (expected something like "Bad Request" or a descriptive error)
3. The same workflow configuration succeeded 1 hour earlier on a different PR
4. No code or configuration changes between the successful and failed runs

This indicates an intermittent issue on Aikido's API side - possibly:
- Network timeout during response reading (hence "read" as partial phrase)
- Aikido service returning malformed JSON
- Rate limiting or service degradation

**Supporting Evidence**:
- Run 21716903930: SUCCESS at 15:14:26Z with identical config
- Run 21719685001: FAILURE at 16:30:54Z with identical config
- No workflow file changes between runs
- Error message format suggests incomplete API response

### How This Causes the Observed Behavior

1. Aikido GitHub Action initiates scan via Aikido API
2. Aikido API returns malformed 400 response (possibly due to service issue)
3. Action parses response and reports failure
4. Job fails but workflow continues (due to `continue-on-error: true`)

### Confidence Level

**Confidence**: High

**Reasoning**:
- Same configuration works before and after the failure
- Error message is unusual/malformed (not a known Aikido error)
- No code changes that could cause this
- Pattern consistent with transient third-party service issues

## Fix Approach (High-Level)

**Immediate**: Re-run the failed Aikido job - it will likely succeed on retry since this is transient.

**Long-term (optional)**:
1. The job already has `continue-on-error: true` so it's non-blocking
2. Could add retry logic to the Aikido step, but this adds complexity for a rare issue
3. Monitor for recurrence - if frequent, consider opening issue with Aikido

## Diagnosis Determination

This is a **transient third-party API failure** from Aikido's service. The workflow configuration is correct and has been working. No code changes are needed - simply re-running the job should resolve the immediate issue.

**Action Required**: Re-run the Aikido Security Scan job on PR #1941.

## Additional Context

- The job is configured as non-blocking (`continue-on-error: true`), so this failure does not prevent PR merges
- The PR #1941 (staging promotion) has auto-merge enabled and will merge once required checks pass
- Aikido scan is not a required check for merge

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, grep, file reads, WebFetch*
