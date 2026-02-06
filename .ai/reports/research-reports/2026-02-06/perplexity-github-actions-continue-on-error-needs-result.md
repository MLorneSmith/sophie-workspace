# Perplexity Research: GitHub Actions continue-on-error and needs.result Behavior

**Date**: 2026-02-06
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (multiple queries)

## Query Summary
Investigated what value `needs.<job_id>.result` reports when a job has `continue-on-error: true` at the job level and the job fails. Specifically needed to distinguish job-level vs step-level behavior.

## Findings

### Answer: `needs.<job_id>.result` reports `"success"` when a job with `continue-on-error: true` fails

When a job has `continue-on-error: true` set at the **job level** (not step level) and the job fails:
- `needs.<job_id>.result` evaluates to `"success"`
- The `success()` status check function returns `true` for that job
- The `failure()` status check function returns `false` for that job
- Downstream dependent jobs proceed as if the job succeeded

This follows the same conclusion/outcome pattern as steps:
- **Steps**: `steps.<id>.outcome` = `"failure"`, `steps.<id>.conclusion` = `"success"`
- **Jobs**: `needs.<job_id>.result` uses the "conclusion" equivalent = `"success"`

### Key Documentation References

1. **Workflow Syntax - job-level continue-on-error**: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idcontinue-on-error
   - Documents that when `continue-on-error: true`, GitHub Actions does not consider the job as failed even if steps fail

2. **Contexts Reference - needs context**: https://docs.github.com/en/actions/learn-github-actions/contexts#needs-context
   - `needs.<job_id>.result` possible values: `success`, `failure`, `cancelled`, `skipped`
   - Does NOT explicitly document interaction with `continue-on-error` (documentation gap)

3. **Contexts Reference - steps context**: https://docs.github.com/en/actions/learn-github-actions/contexts#steps-context
   - Explicitly documents conclusion vs outcome for steps with continue-on-error
   - Quote: "When a continue-on-error step fails, the outcome is failure, but the final conclusion is success."

### Important Caveat: Documentation Gap
The official GitHub documentation does NOT explicitly state what `needs.<job_id>.result` returns when combined with job-level `continue-on-error: true`. This is a known documentation gap. The behavior is confirmed through:
- Community testing and discussions (GitHub Community #15452)
- The workflow syntax page's statement that the job is not considered failed
- Consistent behavior observed in practice

### Practical Implications

If you need to detect the actual failure of a job that has `continue-on-error: true`, you cannot rely on `needs.<job_id>.result` because it will show `"success"`. Workarounds include:
- Having the job output its actual status via job outputs
- Using step-level `continue-on-error` instead and checking `steps.<id>.outcome`
- Passing failure information through job outputs explicitly

## Sources & Citations
- [GitHub Docs - Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idcontinue-on-error)
- [GitHub Docs - Contexts Reference](https://docs.github.com/en/actions/learn-github-actions/contexts#needs-context)
- [GitHub Community Discussion #15452](https://github.com/orgs/community/discussions/15452) - Extensive discussion on continue-on-error UI and behavior
- [GitHub actions/toolkit #1034](https://github.com/actions/toolkit/issues/1034) - Bug report on continue-on-error and failure() interaction

## Key Takeaways
- Job-level `continue-on-error: true` makes `needs.<job_id>.result` report `"success"` even when the job fails
- This mirrors step-level behavior where `conclusion` = `"success"` despite `outcome` = `"failure"`
- The official docs have a gap: they don't explicitly document this interaction for the `needs` context
- If you need to detect actual job failure through `needs`, do NOT use `continue-on-error: true` at the job level; instead use step-level continue-on-error with outcome checks and explicit job outputs

## Related Searches
- GitHub Actions allow-failures feature request (not yet implemented as separate feature)
- Matrix strategy with continue-on-error for experimental builds
- Workarounds for detecting actual failure status with continue-on-error jobs
