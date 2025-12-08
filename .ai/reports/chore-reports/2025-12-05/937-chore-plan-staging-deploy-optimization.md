# Chore: Optimize Staging Deploy Workflow Performance

**Type**: chore
**Priority**: medium
**Complexity**: moderate
**Estimated Effort**: medium

## Quick Reference

- **Problem**: Staging deploy workflow takes 5-8+ minutes due to sequential Full Test Suite
- **Solution**: Skip redundant tests on PR merges, parallelize service startup, improve caching
- **Expected Savings**: 5-10 minutes per workflow run
- **Breaking Changes**: no

## Background

The staging-deploy.yml workflow currently runs the Full Test Suite job sequentially, taking 5-8+ minutes. This is inefficient because:

1. **Redundant testing**: PRs already run comprehensive e2e-sharded tests before merging
2. **Sequential execution**: Services (Supabase, Stripe, build) start one after another
3. **Poor caching**: Playwright and Docker images not cached effectively
4. **Duplicate builds**: App is built in test job, then rebuilt in build job

See full analysis: `.ai/reports/research-reports/2025-12-05/staging-deploy-performance-analysis.md`

## Implementation Plan

### Affected Files

- `.github/workflows/staging-deploy.yml` - Main workflow optimization
- `.github/workflows/e2e-sharded.yml` - Reference for sharding patterns (read-only)

### Step-by-Step Tasks

#### Step 1: Skip Full Test Suite for PR Merges (Highest Impact)

**File**: `.github/workflows/staging-deploy.yml`

The `check-validation` job already detects PR merges and sets `should-validate=false`. Leverage this to skip the test-full job for validated commits.

**Changes**:
```yaml
# Line 122-123: Update the test-full job condition
test-full:
  name: Full Test Suite
  runs-on: runs-on=${{ github.run_id }}/runner=4cpu-linux-x64
  needs: [check-validation, validate]
  # OLD: if: always() && !failure() && !cancelled()
  # NEW: Only run tests when validation is needed (direct pushes, not PR merges)
  if: |
    always() && !failure() && !cancelled() &&
    needs.check-validation.outputs.should-validate == 'true'
```

**Impact**: Saves 5-8 minutes for most staging deploys (PR merges)

#### Step 2: Update Build Job Dependencies

**File**: `.github/workflows/staging-deploy.yml`

Since test-full may be skipped, the build job needs to handle this gracefully.

**Changes**:
```yaml
# Line 209-212: Update build job to not require test-full when skipped
build:
  name: Build Application
  needs: [check-validation, validate, test-full]
  # Handle skipped test-full job
  if: |
    always() &&
    (needs.validate.result == 'success' || needs.validate.result == 'skipped') &&
    (needs.test-full.result == 'success' || needs.test-full.result == 'skipped') &&
    !failure() && !cancelled()
```

#### Step 3: Parallelize Service Startup in test-full

**File**: `.github/workflows/staging-deploy.yml`

Combine Supabase startup, Stripe CLI, and app build into parallel background processes.

**Changes**: Replace steps 157-188 with a consolidated parallel startup:

```yaml
      - name: Start Supabase services
        run: pnpm run supabase:web:start -- -x studio,migra,deno-relay,pgadmin-schema-diff,imgproxy,logflare

      - name: Export Supabase environment variables
        run: |
          # Get Supabase status and extract URLs and keys
          # NOTE: Supabase CLI status output format (table-based as of v1+)
          cd apps/web
          SUPABASE_URL=$(npx supabase status | grep "Project URL" | sed 's/│//g' | awk '{print $3}')
          SUPABASE_ANON_KEY=$(npx supabase status | grep "Publishable" | sed 's/│//g' | awk '{print $2}')
          SUPABASE_SERVICE_KEY=$(npx supabase status | grep -E "^│ Secret" | sed 's/│//g' | awk '{print $2}')

          echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL" >> $GITHUB_ENV
          echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> $GITHUB_ENV
          echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY" >> $GITHUB_ENV

          echo "✅ Exported NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL"
          echo "✅ Exported NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:0:20}..."
          echo "✅ Exported SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY:0:20}..."

      - name: Build and start services in parallel
        run: |
          # Start Stripe CLI in background (doesn't need Supabase env vars)
          docker run --add-host=host.docker.internal:host-gateway --rm -it --name=stripe -d \
            stripe/stripe-cli:latest listen \
            --forward-to http://host.docker.internal:3000/api/billing/webhook \
            --skip-verify --api-key "$STRIPE_SECRET_KEY" --log-level debug &

          # Build application (can run while Stripe starts)
          pnpm turbo build:test --filter=web

          # Start application
          pnpm --filter web start:test &

          # Wait for application to be ready
          npx wait-on http://localhost:3000 -t 60000
```

**Impact**: Saves ~30 seconds by overlapping Stripe startup with build

#### Step 4: Improve Playwright Cache Key

**File**: `.github/workflows/staging-deploy.yml`

Make the Playwright cache key more specific to improve cache hit rate.

**Changes**:
```yaml
# Lines 143-148: Update cache key
      - name: Cache Playwright browsers
        id: playwright-cache
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          # More specific cache key including playwright version from package.json
          key: playwright-${{ runner.os }}-${{ hashFiles('apps/e2e/package.json') }}-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            playwright-${{ runner.os }}-${{ hashFiles('apps/e2e/package.json') }}-
            playwright-${{ runner.os }}-
```

**Impact**: Better cache hits, saves 30-40 seconds when cache works

#### Step 5: Add Workflow Summary with Timing

**File**: `.github/workflows/staging-deploy.yml`

Add a job summary to track performance improvements over time.

**Changes**: Add at end of deploy-web job:
```yaml
      - name: Add workflow summary
        run: |
          echo "## Staging Deployment Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Metric | Value |" >> $GITHUB_STEP_SUMMARY
          echo "|--------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| Commit | \`${{ github.sha }}\` |" >> $GITHUB_STEP_SUMMARY
          echo "| Tests Skipped | ${{ needs.test-full.result == 'skipped' }} |" >> $GITHUB_STEP_SUMMARY
          echo "| Deploy URL | ${{ steps.deploy.outputs.url }} |" >> $GITHUB_STEP_SUMMARY
```

## Testing Strategy

### Manual Testing Checklist

- [ ] Push directly to staging (should run full tests)
- [ ] Merge PR to staging (should skip tests)
- [ ] Verify build job succeeds when test-full is skipped
- [ ] Verify deploy-web and deploy-payload succeed
- [ ] Check workflow timing improvements in Actions UI
- [ ] Verify Playwright cache hits on subsequent runs

### Validation Commands

```bash
# Validate YAML syntax
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/staging-deploy.yml'))"

# Check workflow structure
act --list --workflows .github/workflows/staging-deploy.yml

# Trigger test run (after pushing changes)
git push origin dev:staging --force
```

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Tests skipped when they shouldn't be**
   - **Likelihood**: low
   - **Impact**: medium (bugs could reach staging)
   - **Mitigation**: The check-validation logic is already tested and working. PR tests still run.

2. **Build job fails when test-full is skipped**
   - **Likelihood**: low
   - **Impact**: medium (deployment blocked)
   - **Mitigation**: Updated condition handles skipped jobs explicitly

3. **Parallel service startup causes race conditions**
   - **Likelihood**: low
   - **Impact**: low (tests fail, easy to debug)
   - **Mitigation**: wait-on ensures app is ready before tests

**Rollback Plan**:

1. Revert the commit: `git revert <commit-sha>`
2. Push to staging: `git push origin dev:staging --force`
3. Previous behavior restored

## Success Criteria

The optimization is complete when:
- [ ] YAML syntax validates
- [ ] PR merge to staging skips test-full job
- [ ] Direct push to staging still runs test-full job
- [ ] Build and deploy jobs succeed when tests are skipped
- [ ] Workflow runtime reduced by 5+ minutes for PR merges
- [ ] Playwright cache shows improved hit rate

## Expected Outcomes

| Scenario | Before | After |
|----------|--------|-------|
| PR merge to staging | 8-12 min | 3-5 min |
| Direct push to staging | 8-12 min | 7-10 min |
| Cache warm runs | 8-12 min | 6-9 min |

## Notes

### Future Improvements (Not in Scope)

1. **Sharded E2E tests for staging**: Use matrix strategy like e2e-sharded.yml
2. **Docker layer caching**: Cache Supabase Docker images
3. **Pre-built runner images**: Custom AMI with dependencies pre-installed
4. **Build artifact sharing**: Upload from test-full, download in build job

These are more complex changes that could be done in a follow-up optimization.

---
*Generated by Chore Planning*
*Based on: staging-deploy-performance-analysis.md*
