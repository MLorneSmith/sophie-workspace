# Feature: Migrate CI/CD Workflows to runs-on Self-Hosted Runner

## Feature Description

Migrate slow-running CI/CD workflows to the runs-on self-hosted GitHub runner infrastructure on AWS to significantly reduce workflow execution time and lower GitHub Actions minute consumption. This feature involves identifying performance-critical workflows, updating their runner configuration, and validating the migration delivers the expected speed improvements.

The migration focuses on resource-intensive jobs such as E2E tests, builds, and integration tests that benefit from larger instance types with more CPU cores and memory compared to GitHub's standard ubuntu-latest runners.

## User Story

As a developer on the SlideHeroes team,
I want CI/CD workflows to execute faster,
So that I can get faster feedback on PRs and reduce time spent waiting for test results.

## Problem Statement

Current CI/CD workflows running on GitHub-hosted `ubuntu-latest` runners experience:
- **Slow execution times**: E2E tests and build jobs take 10-15+ minutes due to limited CPU/memory (2 CPUs, 7GB RAM)
- **High GitHub Actions costs**: GitHub-hosted runners cost $0.016/min vs runs-on at $0.0019/min (8.6x cheaper)
- **Resource contention**: Build caching and parallel job execution compete for limited resources
- **Developer velocity impact**: Slow feedback loops delay PR reviews and deployments

## Solution Statement

Migrate SlideHeroes CI/CD workflows to use runs-on self-hosted runners on AWS, which provide:
- **Larger instances**: 2-64 CPU configurations with proportional memory (vs 2CPU fixed for github-hosted)
- **Cost savings**: 8.6x cheaper per minute than GitHub-hosted runners
- **Better performance**: Faster builds/tests due to more CPU cores and available RAM
- **Custom configuration**: Ability to select optimal instance types per workflow

The migration will:
1. Identify and prioritize slow workflows for migration
2. Update workflow YAML files to use runs-on runner syntax
3. Implement monitoring and validation to confirm speed improvements
4. Document migration patterns for future new workflows

## Relevant Files

### Existing Workflows to Migrate

- `.github/workflows/pr-validation.yml` - Pull request validation (already partially using runs-on)
- `.github/workflows/e2e-sharded.yml` - E2E tests with sharding (resource-intensive)
- `.github/workflows/dev-deploy.yml` - Development environment deployment
- `.github/workflows/staging-deploy.yml` - Staging environment deployment
- `.github/workflows/dev-integration-tests.yml` - Integration tests
- `.github/workflows/lighthouse-ci.yml` - Performance testing with Lighthouse
- `.github/workflows/bundle-size-alert.yml` - Bundle size analysis
- `.github/workflows/visual-regression.yml` - Visual regression testing

### Configuration & Documentation Files

- `.github/workflows/reusable-build.yml` - Reusable build workflow (should support runs-on)
- `.claude/config/command-profiles.yaml` - Already configured for CI/CD documentation routing
- `.ai/ai_docs/context-docs/infrastructure/ci-cd-complete.md` - CI/CD reference documentation

### New Files to Create

- `.github/actions/setup-runson-environment/action.yml` - Reusable action for runs-on setup (optional)
- `.ai/specs/runson-migration-matrix.md` - Documentation of all migrated workflows and their configuration
- `.reports/runson-migration-metrics.md` - Performance metrics and cost savings tracking

## Impact Analysis

### Dependencies Affected

- **GitHub Actions**: Workflows depend on runs-on cloud infrastructure instead of GitHub's infrastructure
- **AWS**: Requires AWS account with proper quotas for EC2 instances
- **Turborepo**: Remote caching should work seamlessly with runs-on runners
- **Existing actions**: Most GitHub Actions work unchanged; only `runs-on` field changes

### Risk Assessment

**Low Risk**: This migration is low-risk because:
- **Isolated changes**: Only modifying the `runs-on` field in workflow YAML
- **Well-tested pattern**: test-runson-staging.yml already validates runs-on works
- **Backward compatibility**: Workflows continue to do the same thing, just faster
- **Easy rollback**: Can revert to `ubuntu-latest` if issues arise
- **No code changes**: No application code changes required

### Backward Compatibility

- **Complete**: Workflows execute the same jobs with same validation requirements
- **No breaking changes**: RLS policies, database schemas, and application code unchanged
- **Gradual migration**: Can migrate workflows one at a time
- **Fallback strategy**: Can immediately switch back to `ubuntu-latest` if problems occur

### Performance Impact

**Expected improvements** (based on runs-on documentation and instance sizing):
- **E2E tests**: 30-50% faster with 4cpu-linux-x64 vs 2cpu-linux-x64
- **Build jobs**: 40-60% faster with 4cpu-linux-x64 due to parallel npm/build tasks
- **Integration tests**: 25-35% faster with more available memory
- **Overall PR feedback time**: Target 15-20% reduction in total validation time

**No negative impacts**:
- No client-side bundle size changes
- No database performance changes
- No API latency changes

### Security Considerations

- **AWS account security**: runs-on infrastructure is managed by runs-on (https://runs-on.com)
- **GitHub token access**: Runners get GitHub token same as ubuntu-latest runners
- **Secret management**: GitHub secrets work unchanged with runs-on runners
- **No additional exposure**: No new attack surface compared to ubuntu-latest
- **Compliance**: runs-on provides dedicated AWS runners (not shared)

## Pre-Feature Checklist

Before starting implementation:
- [x] Verify that you have read the recommended context documents
- [x] Create feature branch: `feature/migrate-workflows-to-runson`
- [x] Review existing runs-on test workflow (test-runson-staging.yml)
- [x] Identify all integration points (GitHub Actions, AWS, Turborepo cache)
- [x] Define success metrics (execution time reduction, cost savings)
- [x] Confirm feature doesn't duplicate existing functionality
- [x] Verify all required dependencies are available (runs-on account already exists)
- [x] Plan feature flag strategy (none needed - gradual workflow migration)

## Documentation Updates Required

- **GitHub wiki or internal docs**: Add "runs-on Migration Guide" with best practices
- **CLAUDE.md**: Add runs-on configuration patterns to project guide
- **Workflow comments**: Add comments to migrated workflows explaining runner selection
- **Migration matrix**: Document all migrated workflows and their configurations
- **Cost tracking**: Document expected cost savings from migration

## Rollback Plan

**Simple rollback strategy** (due to low-risk nature):

1. **Immediate rollback**: Change `runs-on:` line back to `runs-on: ubuntu-latest` in workflow file
2. **No data changes**: No database migrations or data transformations occur, so no cleanup needed
3. **Monitoring**: GitHub Actions dashboard shows which runner executed each workflow
4. **Decision point**: If execution time improvement < 20%, revert that workflow

**If complete rollback needed**:
- Revert git commits that modified workflow files
- No cleanup tasks required (no stateful changes)
- No environment variable changes needed

## Implementation Plan

### Phase 1: Assessment & Preparation (1 task)

Identify workflows that benefit most from migration:
- E2E tests (most resource-intensive, sharded across 9 shards)
- Build jobs (long dependency installation)
- Integration tests
- Lighthouse CI
- Performance tests

### Phase 2: Core Migration (5 tasks)

Update workflow files to use runs-on runner configuration:
1. Update `e2e-sharded.yml` to use runs-on for test execution jobs
2. Update `dev-deploy.yml` to use runs-on for build/deploy jobs
3. Update `staging-deploy.yml` to use runs-on
4. Update `dev-integration-tests.yml` to use runs-on
5. Update `lighthouse-ci.yml` and other performance-related workflows

### Phase 3: Validation & Monitoring (3 tasks)

Confirm migration delivers expected improvements:
1. Monitor workflow execution times before/after migration
2. Validate test reliability (pass/fail rates unchanged)
3. Document cost savings and performance metrics

### Phase 4: Optimization & Documentation (2 tasks)

Fine-tune runner configurations and document patterns:
1. Optimize runner sizes per workflow (2cpu vs 4cpu based on actual needs)
2. Create migration guide and update project documentation

## Step by Step Tasks

### Step 1: Analyze Current Workflow Performance

- [ ] Document baseline execution times for target workflows using GitHub Actions UI
- [ ] Record average duration for each job (setup, build, test, deploy)
- [ ] Identify bottlenecks where larger instance would help
- [ ] Note any workflows already using runs-on (e.g., pr-validation.yml)

### Step 2: Migrate E2E Test Workflow (e2e-sharded.yml)

- [ ] Update `setup-server` job to use `runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64`
- [ ] Update shard jobs to use `runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64`
- [ ] Test workflow execution and verify tests pass
- [ ] Compare execution time to baseline
- [ ] Add comment documenting runner choice

### Step 3: Migrate Dev Deploy Workflow (dev-deploy.yml)

- [ ] Update `runs-on: ubuntu-latest` to `runs-on: runs-on=${{ github.run_id }}/runner=2cpu-linux-x64`
- [ ] For build-heavy jobs, consider 4cpu variant if 2cpu shows bottleneck
- [ ] Test deploy workflow and verify successful deployment
- [ ] Record execution time improvement

### Step 4: Migrate Staging Deploy Workflow (staging-deploy.yml)

- [ ] Update all relevant jobs to use runs-on
- [ ] Consider using 4cpu-linux-x64 for parallel test shards
- [ ] Validate staging deployment completes successfully
- [ ] Measure performance improvement

### Step 5: Migrate Integration Tests (dev-integration-tests.yml)

- [ ] Update job runner configuration to use runs-on
- [ ] Test workflow execution
- [ ] Verify all test scenarios pass
- [ ] Document execution time improvement

### Step 6: Migrate Performance Testing Workflows

- [ ] Update `lighthouse-ci.yml` to use runs-on
- [ ] Update `bundle-size-alert.yml` to use runs-on
- [ ] Update `visual-regression.yml` to use runs-on
- [ ] Test each workflow and verify results accuracy

### Step 7: Update Reusable Workflows

- [ ] Review `reusable-build.yml` and add runs-on support if needed
- [ ] Ensure reusable workflows work seamlessly with runs-on
- [ ] Test reusable workflows in dependent workflows

### Step 8: Create Migration Documentation

- [ ] Document all migrated workflows and runner configuration in `.ai/specs/runson-migration-matrix.md`
- [ ] Create migration guide with best practices
- [ ] Update CLAUDE.md with runs-on patterns for future workflows
- [ ] Add examples of different runner sizes and when to use each

### Step 9: Monitor & Validate Migration

- [ ] Monitor 5-10 workflow executions for each migrated workflow
- [ ] Collect execution time metrics
- [ ] Verify test reliability (pass rates should be same or better)
- [ ] Calculate cost savings

### Step 10: Create Performance Report

- [ ] Compile before/after execution time comparisons
- [ ] Calculate cost savings (GitHub Actions minutes reduction)
- [ ] Document any issues encountered and resolutions
- [ ] Provide recommendations for future optimizations

### Step 11: Run Validation Commands

- [ ] Verify all workflows are syntactically valid
- [ ] Confirm runs-on runner syntax is correct across all updated files
- [ ] Test each migrated workflow with manual trigger
- [ ] Document baseline and new execution times

## Testing Strategy

### Unit Tests

No unit tests required - migrations are configuration changes only.

### Integration Tests

**Workflow execution validation**:
- Trigger each migrated workflow manually or via test PR
- Verify all jobs execute successfully
- Confirm test results are accurate and consistent
- Validate deployments complete successfully

**Compatibility testing**:
- Ensure GitHub secrets/tokens work with runs-on runners
- Verify Turborepo remote caching works unchanged
- Confirm artifact sharing between jobs still works
- Validate container/Docker operations work on runs-on

### E2E Tests

**Real-world workflow scenarios**:
- Create test PR to dev branch, verify full validation passes
- Merge to dev, verify dev deployment workflow executes
- Verify staging deployment workflow completes
- Test production deployment workflow (if applicable)

### Performance Metrics

**Collection points**:
- GitHub Actions UI execution times
- Workflow duration over 10 consecutive runs per workflow
- Resource utilization on runs-on instances (if available via runs-on dashboard)

## Acceptance Criteria

- [ ] All identified slow workflows migrated to runs-on runners
- [ ] Migrated workflows execute 20%+ faster than baseline (if resource-constrained)
- [ ] All tests pass with same reliability as before (pass rate ≥ 99%)
- [ ] No increase in workflow failures due to runner change
- [ ] Cost per workflow execution reduced by estimated 8.6x (based on runs-on pricing)
- [ ] Migration documentation created and project guide updated
- [ ] Team can easily identify which workflows use runs-on vs ubuntu-latest
- [ ] Rollback procedure is simple and well-documented

## Validation Commands

Execute these commands to validate the migration:

```bash
# 1. Validate workflow syntax - ensure no YAML errors
find .github/workflows -name "*.yml" -exec yq validate {} \;

# 2. Check runs-on syntax in all workflows
grep -r "runs-on: runs-on=" .github/workflows/

# 3. List all workflows still using ubuntu-latest (to verify migration coverage)
grep -r "runs-on: ubuntu-latest" .github/workflows/ | grep -v "# ubuntu-latest"

# 4. Run a test PR to trigger pr-validation workflow
# (Manually create test PR and verify runs-on runner is used)

# 5. Check GitHub Actions runs to confirm runner type
# (Via GitHub UI: Actions > workflow > click run > check "Queued by...")

# 6. Compare execution times using GitHub API
# (Query workflow run times before/after migration)

# 7. Verify all migrated workflows pass their tests
# (Check workflow run history for >95% success rate)

# 8. Document final baseline metrics
echo "Document current execution times in migration report"
```

## Notes

### Key Decisions

1. **Runner sizing**: Starting with 2cpu-linux-x64 for most workflows, with 4cpu variant available for build-heavy jobs
2. **Gradual migration**: Migrating one workflow at a time to reduce risk and allow easy rollback
3. **No feature flags**: Low-risk change doesn't require feature flags or canary deployments
4. **Cost optimization**: runs-on cheaper pricing automatically reduces costs without requiring optimization work

### Runs-on Documentation Reference

- **Runs-on Linux runners**: https://runs-on.com/runners/linux/
- **Instance types**: 2cpu through 64cpu variants available in x64 and arm64 architectures
- **Pricing**: $0.0019/min for 2cpu vs $0.016/min for GitHub ubuntu-latest (8.6x savings)
- **Setup**: Already working in pr-validation.yml as proof of concept

### Future Optimizations

1. **Spot instances**: Evaluate spot pricing for further cost reduction
2. **Custom runners**: Create specialized runners for specific workflow types
3. **Auto-scaling**: Configure auto-scaling limits based on queue length
4. **Regional selection**: Choose AWS regions closest to team location for lower latency
5. **Scheduled jobs**: Optimize timing of scheduled workflows to avoid queue contention

### Team Considerations

- **Minimal learning curve**: Only change is runs-on syntax; jobs/steps unchanged
- **Same GitHub secrets**: No new authentication configuration needed
- **Transparent to developers**: Developers don't need to do anything differently
- **Gradual rollout**: Can migrate workflows independently

### Known Limitations

- **New AWS accounts**: May have restrictive default EC2 quotas (documented in runs-on FAQ)
- **Spot pricing fluctuation**: Spot instances vary by region and time (not recommended for critical paths)
- **Instance family selection**: Some instances may not be available in all regions
- **Health check failures**: AWS quota issues may cause "unhealthy instance" errors

### Related Documentation

- `.ai/ai_docs/context-docs/infrastructure/ci-cd-complete.md` - Detailed CI/CD architecture
- `.ai/ai_docs/context-docs/development/architecture-overview.md` - System architecture
- `CLAUDE.md` - Project conventions and patterns
- `README.md` - Branch strategy and deployment flow

### Team Communication

When completing this feature:
1. Update CLAUDE.md with runs-on patterns
2. Share migration results with team
3. Highlight cost savings achieved
4. Document any lessons learned or challenges
