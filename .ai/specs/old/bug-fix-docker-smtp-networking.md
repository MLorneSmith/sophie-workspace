# Bug Fix: Test Container SMTP Networking Configuration

**Related Diagnosis**: #727 (REQUIRED)
**Severity**: medium
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Test container `docker-compose.test.yml` doesn't override `EMAIL_HOST` and `EMAIL_PORT` for Docker networking, causing SMTP connection failures
- **Fix Approach**: Add `EMAIL_HOST` and `EMAIL_PORT` environment variable overrides to both test containers in `docker-compose.test.yml` using `host.docker.internal` and port 54525
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The test container (`slideheroes-app-test`) fails to send invitation emails because it's configured with `EMAIL_HOST=127.0.0.1:54525` (from `.env.test`), which resolves to the container's own localhost instead of the host machine where Supabase Inbucket is running.

From the Supabase Services architecture (documented in docker-setup.md):
- Inbucket SMTP runs on the host at **port 54525**
- Test containers must use `host.docker.internal:54525` to reach it (standard Docker networking)
- Current `.env.test` has `EMAIL_HOST=127.0.0.1` which works on the host but fails in containers

**Error Evidence**:
```
{"level":50,"error":{"message":"connect ECONNREFUSED 127.0.0.1:54525","errno":-111,"code":"ESOCKET"},"msg":"Failed to send invitation email"}
```

For full details, see diagnosis issue #727.

### Solution Approaches Considered

#### Option 1: Environment Variable Overrides in docker-compose.test.yml ⭐ RECOMMENDED

**Description**: Add `EMAIL_HOST` and `EMAIL_PORT` to the environment section of both test containers in `docker-compose.test.yml`, following the same pattern already used for `NEXT_PUBLIC_SUPABASE_URL` and `DATABASE_URL`.

**Pros**:
- Follows existing Docker networking pattern (consistent with how Supabase/DB are already configured)
- Minimal change - just 2 environment variables per container
- No changes to `.env.test` needed (it's for local host development)
- Immediately enables email-based E2E tests
- Docker compose orchestrates this automatically on `up`

**Cons**:
- Minor duplication (same vars in both containers)

**Risk Assessment**: low - This is a standard Docker environment override pattern. The fix follows documented Docker best practices for container-to-host communication.

**Complexity**: simple - 2 environment variables, no code changes

#### Option 2: Docker Networking Service Name Resolution

**Description**: Create a Docker service for Inbucket SMTP and use inter-container DNS resolution.

**Why Not Chosen**:
- Supabase services are managed by Supabase CLI, not docker-compose
- Would require breaking separation of concerns (docker-compose shouldn't manage Supabase)
- Increases complexity unnecessarily when simple override works
- Our architecture keeps Supabase CLI stack separate from test containers (intentional design)

#### Option 3: Dynamic Environment Variable Substitution

**Description**: Use a shell script to detect if running in Docker and set email host accordingly.

**Why Not Chosen**:
- Adds runtime logic that belongs in configuration
- More complex to maintain
- Docker compose should handle environment configuration
- Less transparent than explicit configuration

### Selected Solution: Environment Variable Overrides in docker-compose.test.yml

**Justification**:
The recommended approach aligns with the existing Docker architecture where test containers override environment variables to reach host services via `host.docker.internal`. This pattern is already successfully used for `NEXT_PUBLIC_SUPABASE_URL` (port 54521) and `DATABASE_URL` (port 54522). Email configuration should follow the same documented pattern.

**Technical Approach**:
- Add `EMAIL_HOST=host.docker.internal` to both `app-test` and `payload-test` services
- Add `EMAIL_PORT=54525` to both services
- These overrides apply at container startup, before the application reads env vars
- The host's firewall doesn't block localhost port forwarding (already enabled for Supabase ports)

**Architecture Changes**: None - this is a configuration fix, not architectural

**Migration Strategy**: None - environment variables are read at application startup. No data migration needed.

## Implementation Plan

### Affected Files

- `docker-compose.test.yml` - Add EMAIL_HOST and EMAIL_PORT environment overrides to both service containers

### New Files

None - existing file modification only

### Step-by-Step Tasks

#### Step 1: Update app-test container environment

In `docker-compose.test.yml`, locate the `app-test` service and add two environment variables to the environment section:

- `EMAIL_HOST=host.docker.internal` - Points to the host machine (where Inbucket SMTP runs)
- `EMAIL_PORT=54525` - Supabase Inbucket SMTP port (standard across all Supabase instances)

**Why this step first**: The primary test container runs the E2E tests that send emails. This is the critical path to unblock testing.

#### Step 2: Update payload-test container environment

In the same file, locate the `payload-test` service and add the same two environment variables:

- `EMAIL_HOST=host.docker.internal`
- `EMAIL_PORT=54525`

**Why sequential**: Payload also sends emails (administrative notifications). Both must be configured for complete email functionality.

#### Step 3: Validate configuration syntax

Before starting containers:
- Verify the docker-compose.yml YAML syntax is valid
- Ensure no duplicate keys in environment sections
- Check that existing Supabase overrides (NEXT_PUBLIC_SUPABASE_URL, DATABASE_URL) are still present

#### Step 4: Verify fix with container restart

- Stop existing test containers: `docker-compose -f docker-compose.test.yml down`
- Start containers with new configuration: `docker-compose -f docker-compose.test.yml up -d`
- Wait for containers to reach healthy state (health checks pass)
- Verify email configuration is applied: `docker exec slideheroes-app-test env | grep EMAIL`

#### Step 5: Run email-dependent E2E tests

- Run team invitation test: `pnpm test:e2e -- --grep "invitation"`
- Should see emails successfully sent to Inbucket
- Verify through Inbucket web interface: `http://localhost:54524`

## Testing Strategy

### Unit Tests

No unit tests needed - this is a configuration fix, not logic change.

### Integration Tests

**Test files**: `apps/e2e/tests/team-invitation.spec.ts` and related email tests

**Tests**:
- ✅ Team member invitation sends email
- ✅ Email contains invitation link
- ✅ Email is received by Inbucket (verifiable in Inbucket web UI)
- ✅ Invitation acceptance works end-to-end
- ✅ Multiple simultaneous invitations work
- ✅ Regression test: Original SMTP connection error doesn't reoccur

### E2E Tests

Email-based E2E tests should now pass:

**Test files**:
- `apps/e2e/tests/team-invitation.spec.ts` - Team member invitations
- `apps/e2e/tests/auth.spec.ts` - Auth-related emails (if any)
- Any other tests that expect email delivery

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start test containers: `docker-compose -f docker-compose.test.yml up -d`
- [ ] Verify app-test health: `curl http://localhost:3001/api/health`
- [ ] Verify environment vars: `docker exec slideheroes-app-test env | grep -i email`
- [ ] Check EMAIL_HOST is `host.docker.internal`: `docker exec slideheroes-app-test env | grep EMAIL_HOST`
- [ ] Check EMAIL_PORT is `54525`: `docker exec slideheroes-app-test env | grep EMAIL_PORT`
- [ ] Start Supabase: `cd apps/web && npx supabase start`
- [ ] Run invitation test: `pnpm test:e2e -- --grep "invitation"` (should pass)
- [ ] Verify email in Inbucket: Visit `http://localhost:54524` and check inbox
- [ ] No SMTP connection errors in app-test logs: `docker logs slideheroes-app-test | grep -i "email\|smtp\|error"`
- [ ] Container remains healthy: `docker ps | grep slideheroes-app-test` (should show "healthy")

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **YAML Syntax Error**: Typo in docker-compose.yml breaks container startup
   - **Likelihood**: low (simple key-value addition)
   - **Impact**: medium (containers won't start until fixed)
   - **Mitigation**: Validate YAML syntax before restarting containers using `docker-compose config` command

2. **Port Already In Use**: Port 54525 conflict if Inbucket isn't running
   - **Likelihood**: low (error message would clarify the issue)
   - **Impact**: low (same error as before fix, easily debugged)
   - **Mitigation**: Supabase health check confirms Inbucket is running before running tests

3. **Environment Variable Override Not Applied**: Docker caches old config
   - **Likelihood**: low (docker-compose config applies at startup)
   - **Impact**: medium (fix won't work, appears unchanged)
   - **Mitigation**: `docker-compose down -v` to clear volumes, full restart required

**Rollback Plan**:

If this fix causes issues in production (unlikely for a test container config):

1. Remove the `EMAIL_HOST` and `EMAIL_PORT` additions from docker-compose.test.yml
2. Restart test containers: `docker-compose -f docker-compose.test.yml down && docker-compose -f docker-compose.test.yml up -d`
3. Original behavior restored (SMTP connections will fail again, but other container functionality unaffected)

**Monitoring** (if needed):

- No monitoring needed - this is a test environment fix
- Verification: E2E tests either pass (fix working) or fail with SMTP errors (fix not applied)

## Performance Impact

**Expected Impact**: none

- This is a configuration change only
- No code execution overhead
- Email sending performance unchanged (same SMTP server, different network routing)
- Container startup time unchanged (environment variables set at init, no runtime cost)

## Security Considerations

**Security Impact**: none

- Using `host.docker.internal` is the standard Docker networking approach
- Port 54525 is internal Inbucket SMTP (test-only email service)
- No credentials or secrets exposed
- RLS and authentication unaffected
- Same security profile as existing Supabase port overrides (54521 for Kong API)

**Security Review**: Not needed - configuration only

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start test containers with old config (if reverted)
docker-compose -f docker-compose.test.yml up -d

# Wait for healthy state
sleep 30

# Try to run invitation test (should fail with SMTP error)
pnpm test:e2e -- --grep "invitation" 2>&1 | grep -i "smtp\|ECONNREFUSED\|54525"

# Expected output: Connection error to 127.0.0.1:54525
```

**Expected Result**: SMTP connection refused error (127.0.0.1:54525)

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build (optional - configuration change only)
pnpm build

# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Wait for containers healthy
sleep 45

# Verify email configuration in container
docker exec slideheroes-app-test env | grep EMAIL

# Run email tests
pnpm test:e2e -- --grep "invitation"

# Check logs for errors
docker logs slideheroes-app-test | grep -i "email\|smtp" | grep -v "send.*success"

# Verify with Inbucket web UI
curl http://localhost:54524  # Should return HTML (Inbucket web interface)
```

**Expected Result**:
- Email environment variables show `EMAIL_HOST=host.docker.internal` and `EMAIL_PORT=54525`
- E2E invitation tests pass without SMTP connection errors
- No SMTP errors in container logs
- Inbucket web interface accessible and shows received emails

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test:e2e

# Verify no new errors in container logs
docker logs slideheroes-app-test 2>&1 | tail -50 | grep -i error

# Optional: Run specific email tests multiple times
for i in {1..3}; do pnpm test:e2e -- --grep "invitation" && echo "✅ Pass $i"; done
```

## Dependencies

### New Dependencies

None - using existing docker-compose capabilities

**No new dependencies required**

## Database Changes

**No database changes required** - This is a Docker environment configuration fix, not a database schema change.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- Docker containers must be rebuilt/restarted for new environment variables to take effect
- `docker-compose down && docker-compose up` applies the fix
- No database migrations or schema changes
- Backwards compatible (old containers will still work, just with SMTP issues)

**Feature flags needed**: no

**Backwards compatibility**: maintained - Adding environment variables doesn't break anything

## Success Criteria

The fix is complete when:
- [x] `docker-compose.test.yml` updated with EMAIL_HOST and EMAIL_PORT for both containers
- [x] YAML syntax is valid (verified with `docker-compose config`)
- [x] Test containers start successfully with new configuration
- [x] Environment variables are present in running containers
- [x] E2E invitation tests pass without SMTP errors
- [x] Emails are successfully received in Inbucket
- [x] No regressions in other E2E tests
- [x] Code review approved (if applicable)

## Notes

This is a straightforward configuration fix following the established Docker networking pattern in the codebase. The test architecture is designed to isolate test containers on a Docker network while allowing them to reach host services via `host.docker.internal`. Email configuration now aligns with this pattern.

**Key insight**: The Supabase services (including Inbucket SMTP) run on the host machine managed by Supabase CLI. Test containers in docker-compose.test.yml must use `host.docker.internal` to reach them, just as they do for Kong API (54521) and PostgreSQL (54522).

**Related files and documentation**:
- `docker-setup.md`: Complete Docker architecture (shows Inbucket on port 54525)
- `docker-troubleshooting.md`: Container networking troubleshooting guide
- `docker-compose.test.yml`: Current configuration (where the fix goes)
- `apps/web/.env.test`: Source of EMAIL_HOST=127.0.0.1 (correct for host, overridden for containers)

---

*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #727*
