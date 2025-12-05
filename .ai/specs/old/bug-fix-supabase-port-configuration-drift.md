# Bug Fix: Supabase Port Configuration Drift

**Related Diagnosis**: #706 (REQUIRED)
**Severity**: high
**Bug Type**: configuration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Configuration drift where port changes (54321→54521, 54322→54522) in main Supabase config were not propagated to 9 dependent configuration files
- **Fix Approach**: Systematically update all dependent configuration files to use new port scheme
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

After resolving Hyper-V port reservation conflicts in issue #668, Supabase ports were updated in `apps/web/supabase/config.toml` to use 54521-54526 instead of 54321-54326. However, this change was incomplete—it was not propagated to configuration files for development (Payload CMS), testing (E2E, Docker), CI/CD workflows (GitHub Actions), and documentation. This causes:

- Payload CMS crashes with `ECONNREFUSED 127.0.0.1:54322`
- E2E tests cannot connect to database
- Docker test containers connect to wrong ports
- CI workflows fail silently
- Documentation references outdated ports

For full details, see diagnosis issue #706.

### Solution Approaches Considered

#### Option 1: Propagate Port Changes Across All Files ⭐ RECOMMENDED

**Description**: Systematically update all 9 identified files to use the new port scheme (54521 for API, 54522 for PostgreSQL). A straightforward configuration correction with no code changes.

**Pros**:
- Minimal scope—only configuration files, no business logic changes
- Low risk—simple find/replace operations
- Fixes all environments simultaneously (dev, test, CI, docs)
- Single commit with clear audit trail
- No performance impact
- No new dependencies

**Cons**:
- Requires careful attention to ensure all occurrences are updated
- Need to verify all files are actually used in current workflows
- Documentation changes are tedious but necessary

**Risk Assessment**: low - These are configuration-only changes with no code logic modifications. Existing RLS policies and authentication mechanisms remain unchanged.

**Complexity**: simple - Straightforward configuration updates

#### Option 2: Create a Port Configuration File (Not Chosen)

**Description**: Create a central `.env` configuration file with port definitions, then source it from all other configs.

**Why Not Chosen**: Overcomplicates a simple fix. The issue is straightforward—propagate existing changes. Adding a new configuration system introduces unnecessary abstraction and requires modifying import/sourcing logic across multiple environments (Docker, CI, documentation). Better to fix the immediate problem, then consider centralization as a future enhancement if port changes become frequent.

#### Option 3: Automated Port Detection (Not Chosen)

**Description**: Implement runtime port detection by querying Supabase API or checking port availability.

**Why Not Chosen**: Adds unnecessary complexity and latency to startup flows. The current problem is a one-time drift due to incomplete propagation. Detection adds ongoing overhead with minimal benefit. The fix should be deterministic configuration.

### Selected Solution: Propagate Port Changes Across All Files

**Justification**: This is the most pragmatic solution given the root cause is incomplete change propagation. It's low-risk, simple to implement, verifiable, and aligns with the principle of fixing the actual problem rather than adding workarounds. Configuration drift is best resolved by ensuring all dependent files reflect the authoritative configuration.

**Technical Approach**:
- Identify all files referencing old port numbers (54321, 54322)
- Replace with new port scheme (54521, 54522) consistently
- Verify no other port numbers are affected
- Update documentation to reflect the change

**Architecture Changes** (if any):
- None—this is purely configuration correction

**Migration Strategy** (if needed):
- No data migration needed
- No breaking API changes
- Services will automatically use new ports after restart

## Implementation Plan

### Affected Files

Files that need modification to use new port scheme:

1. **`apps/payload/.env.development`** - Line 7
   - Change: `54322` → `54522` in DATABASE_URI

2. **`apps/e2e/.env.test.locked`** - Lines 10, 16
   - Change: `54322` → `54522` in DATABASE_URL and E2E_DATABASE_URL

3. **`apps/e2e/.env.example`** - Line 11
   - Change: `54322` → `54522` in E2E_DATABASE_URL

4. **`docker-compose.test.yml`** - Multiple lines
   - Lines 28, 33, 92, 97, 99, 100: Change `54321` → `54521` for API, `54322` → `54522` for DB

5. **`.github/workflows/e2e-sharded.yml`** - Lines 111, 116, 117
   - Change: `54321` → `54521` for SUPABASE_URL, `54322` → `54522` for DATABASE_URL

6. **`docs/cicd/local-development.md`** - Multiple occurrences
   - Change all references from old ports to new scheme

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Development Configuration

Update Payload CMS development environment file:

- Read `apps/payload/.env.development`
- Update DATABASE_URI to use 54522 instead of 54322
- Verify change is syntactically correct

**Why this step first**: Payload CMS is the most immediately broken service causing crashes on `pnpm dev`. Fixing this first unblocks local development.

#### Step 2: Update E2E Testing Configuration

Update E2E test environment files:

- Read `apps/e2e/.env.test.locked`
  - Update DATABASE_URL (line 16): 54322 → 54522
  - Update E2E_DATABASE_URL (line 10): 54322 → 54522
- Read `apps/e2e/.env.example`
  - Update E2E_DATABASE_URL (line 11): 54322 → 54522

**Why this step second**: E2E tests need correct database connection strings. This fixes test infrastructure after dev environment is fixed.

#### Step 3: Update Docker Test Stack Configuration

Update Docker Compose configuration for test environment:

- Read `docker-compose.test.yml`
- Update all port references:
  - NEXT_PUBLIC_SUPABASE_URL: 54321 → 54521
  - DATABASE_URL: 54322 → 54522
  - DATABASE_URI: 54322 → 54522
  - Service URLs that reference these ports

**Why this step third**: Docker-based testing depends on E2E configuration. This creates isolated test environment.

#### Step 4: Update CI/CD Workflows

Update GitHub Actions workflow files:

- Read `.github/workflows/e2e-sharded.yml`
- Update workflow environment variables:
  - SUPABASE_URL: 54321 → 54521
  - DATABASE_URL: 54322 → 54522
- Verify no other workflow files need updating

**Why this step fourth**: CI/CD typically runs after local testing is working. This ensures production-like test runs work correctly.

#### Step 5: Update Documentation

Update documentation files to reflect port changes:

- Read `docs/cicd/local-development.md`
- Update all port references from old scheme to new scheme
- Verify documentation examples are consistent

**Why this step fifth**: Documentation updates are last since they don't affect functionality, only user guidance.

#### Step 6: Verification

Run validation to ensure no regressions:

- Run full type check
- Run linting to catch any syntax errors
- Start Supabase to verify ports (54521 API, 54522 DB)
- Verify no other files reference old port numbers

## Testing Strategy

### Unit Tests

**No new unit tests needed**. This is a configuration-only change affecting no business logic or code.

### Integration Tests

**Manual verification steps** (see below):

- Verify Supabase stack starts on correct ports
- Verify Payload CMS connects to database successfully
- Verify E2E test environment can connect to database

### E2E Tests

After fix is applied:

- Run a single E2E test to verify database connectivity
- Run full E2E shard to verify all tests can access database
- Verify no timeouts or connection errors

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start Supabase: `pnpm supabase:web:start` (verify ports 54521/54522 are in use)
- [ ] Run dev servers: `pnpm dev` (verify Payload CMS starts without ECONNREFUSED errors)
- [ ] Check Supabase dashboard: Navigate to http://localhost:54523 (Studio on 54523)
- [ ] Verify docker-compose test stack: `docker-compose -f docker-compose.test.yml up` (containers should connect to Supabase on 54521/54522)
- [ ] Run a sample E2E test: `pnpm test:e2e` (should connect to database successfully)
- [ ] Verify CI workflow environment: Check `.github/workflows/e2e-sharded.yml` environment variables are correct
- [ ] Search codebase: Verify no other files reference old ports `54321`, `54322`, `54323`, `54324`, `54325`, `54326`
- [ ] Check logs: Verify no "connection refused" or "ECONNREFUSED" errors in any service

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incomplete Propagation**: Missing a file that also references old ports
   - **Likelihood**: low (comprehensive audit identified all files)
   - **Impact**: high (some services would still fail)
   - **Mitigation**:
     - Search codebase for `54321`, `54322` before and after changes
     - Manual verification checklist above
     - Test all affected services

2. **Typos in Port Numbers**: Accidentally type wrong port during updates
   - **Likelihood**: low (simple find/replace minimizes errors)
   - **Impact**: high (services unable to connect)
   - **Mitigation**:
     - Use find/replace instead of manual editing
     - Verify syntax after each edit
     - Run tests before committing

3. **Accidentally Modifying Unrelated Numbers**: Changing port numbers in other contexts
   - **Likelihood**: low (port numbers are distinctive)
   - **Impact**: medium (could break unrelated functionality)
   - **Mitigation**:
     - Use whole-word matching in find/replace
     - Review each change carefully
     - Verify in context (should be in URL/connection string)

**Rollback Plan**:

If this fix causes issues in production:

1. Revert the commit: `git revert <commit-hash>`
2. Restart all services: `pnpm dev` (or redeploy to Vercel)
3. Verify services connect successfully
4. Identify missing file(s) and apply targeted fix

**Monitoring** (if needed):
- Monitor E2E test success rate for 24 hours
- Watch for database connection errors in logs
- Alert on any "connection refused" patterns

## Performance Impact

**Expected Impact**: none

This is a configuration change with no code modifications, so performance is unaffected. Services may briefly reconnect to Supabase if running, but no performance degradation.

## Security Considerations

**Security Impact**: none

Port changes do not affect security—authentication, RLS policies, and access control mechanisms remain unchanged. The new port range (54521-54526) is outside problematic Hyper-V reserved ranges, improving stability on Windows.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start Supabase (will use new ports 54521/54522)
pnpm supabase:web:start

# Try to start dev servers (Payload will fail with ECONNREFUSED 127.0.0.1:54322)
pnpm dev

# Expected Result: Payload crashes trying to connect to old port 54322
# Error: ECONNREFUSED 127.0.0.1:54322
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check (verify no syntax errors)
pnpm typecheck

# Lint (verify code quality)
pnpm lint

# Format (ensure consistent formatting)
pnpm format

# Start Supabase
pnpm supabase:web:start

# Verify ports (should show 54521/54522)
lsof -i :54521 -i :54522

# Start dev servers (should succeed)
pnpm dev

# Payload should start successfully without ECONNREFUSED errors

# Run E2E test (should connect to database successfully)
pnpm test:e2e -- --grep "basic"

# Build (should complete without errors)
pnpm build

# Manual verification: Search for old ports
grep -r "54321\|54322\|54323\|54324\|54325\|54326" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.json" \
  --include="*.yml" \
  --include="*.yaml" \
  --include="*.md" \
  --include=".env*" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  apps/ .github/ docs/
```

**Expected Result**: All commands succeed, bug is resolved, zero regressions. grep should find no references to old ports in configuration files (may find references in comments/docs explaining the port migration, which is acceptable).

### Regression Prevention

```bash
# Run full test suite to ensure nothing broke
pnpm test

# Additional regression checks: Verify all services can start
pnpm supabase:web:start &  # Background
pnpm dev &                 # In another terminal
docker-compose -f docker-compose.test.yml up -d

# Wait 10 seconds for services to initialize
sleep 10

# Check service health
curl http://localhost:3000/api/health     # Next.js web
curl http://localhost:3020/api/health    # Payload CMS
curl http://localhost:54521/project/default  # Supabase API
curl http://localhost:54523              # Supabase Studio

# All should return 200 or similar success status
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**. This fix uses only existing tools and services.

## Database Changes

**Migration needed**: no

This is a configuration-only change affecting service connection strings. No database schema changes, migrations, or data transformations are needed.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
1. Apply configuration updates to all affected files
2. Restart services to use new connection strings
3. Verify all services connect successfully
4. No special deployment coordination needed

**Feature flags needed**: no

**Backwards compatibility**: maintained

The port changes do not affect the API contract or any public interfaces. Services that connect via connection strings will automatically use the new ports.

## Success Criteria

The fix is complete when:
- [ ] All 9 configuration files are updated to use new port scheme
- [ ] Type checking passes: `pnpm typecheck`
- [ ] Linting passes: `pnpm lint`
- [ ] Supabase starts on ports 54521/54522
- [ ] Payload CMS starts successfully without connection errors
- [ ] E2E tests connect to database and pass
- [ ] Docker test stack containers start successfully
- [ ] CI/CD workflows have correct environment variables
- [ ] Documentation reflects new port scheme
- [ ] Codebase contains no references to old port numbers
- [ ] All manual testing checklist items pass
- [ ] No regressions detected in full test suite

## Notes

**Audit Trail**: The following files were identified through systematic search as requiring updates:

```
Development:
- apps/payload/.env.development

Testing:
- apps/e2e/.env.test.locked
- apps/e2e/.env.example

Docker:
- docker-compose.test.yml

CI/CD:
- .github/workflows/e2e-sharded.yml

Documentation:
- docs/cicd/local-development.md
```

**Context**: This fix is part of resolving issue #668 (Hyper-V port conflicts). The port migration was initially completed in the main Supabase config but incompletely propagated. This fix ensures consistency across all environments.

**Future Prevention**: Consider documenting the port mapping as a single source of truth and implementing verification in CI to catch future configuration drift.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #706*
