# Feature: Fix Docker Statusline Health Checks for Supabase External Containers

## Feature Description

Fix the Claude Code statusline Docker health indicator to properly detect and display health status for the two Supabase containers that lack native Docker health checks: `supabase_rest_2025slideheroes-db` (PostgREST) and `supabase_edge_runtime_2025slideheroes-db` (Edge Runtime). Currently, the statusline shows 15/16 healthy because these containers are counted as "unknown" rather than "healthy" even when they are functioning correctly.

The fix involves:
1. Correcting the health check endpoint for PostgREST (currently using wrong port 3001 instead of 54521 via Kong)
2. Adding native Docker health checks to these containers via Supabase compose override
3. Ensuring the docker-health-wrapper.sh properly counts process-validated containers as healthy

## User Story

As a developer using Claude Code
I want the Docker statusline to accurately show 16/16 healthy containers
So that I have confidence that my entire infrastructure is operational without false warnings

## Problem Statement

The Claude Code statusline shows "15/16 healthy" for Docker containers even when all containers are actually healthy. This is because:

1. **PostgREST container** (`supabase_rest_2025slideheroes-db`): The health check in `docker-health-wrapper.sh` (line 1222) attempts to reach `http://localhost:3001/live` which is incorrect. PostgREST is accessible via Kong gateway at port 54521, not directly on port 3001.

2. **Edge Runtime container** (`supabase_edge_runtime_2025slideheroes-db`): While the process check for Deno works, the container is still counted as "unknown" in some cases because it lacks a native Docker HEALTHCHECK directive.

3. **Health counting logic**: When external health checks return "unknown" (due to unreachable endpoints), the statusline counts these containers differently than "healthy" containers.

## Solution Statement

Implement a two-pronged approach:

1. **Fix the docker-health-wrapper.sh external health checks**:
   - Update PostgREST health check to use correct endpoint: `http://127.0.0.1:54521/rest/v1/` (Kong gateway)
   - Improve Edge Runtime health detection reliability
   - Ensure successful process checks are counted as "healthy" not "unknown"

2. **Add native Docker health checks via Supabase compose override**:
   - Create `docker-compose.override.yml` in `apps/web/supabase/` to add HEALTHCHECK directives
   - PostgREST: HTTP check via Kong gateway
   - Edge Runtime: Process-based check for Deno

This dual approach ensures reliability - native Docker health checks will be used when available, with process-based fallback for robustness.

## Relevant Files

Use these files to implement the feature:

### Files to Modify

- `.claude/bin/docker-health-wrapper.sh` (lines 1220-1238) - Fix the external health check endpoints and logic:
  - Line 1222: Change `http://localhost:3001/live` to `http://127.0.0.1:54521/rest/v1/`
  - Lines 1226, 1236: Change "unknown" to "healthy" for successful process checks (fallback)

- `.ai/ai_scripts/supabase-external-health.sh` - Already has correct endpoint (`http://localhost:54521/rest/v1/`), verify consistency

### Files to Create

- `apps/web/supabase/docker-compose.override.yml` - Add native Docker health checks for the two containers

### Reference Files (read-only)

- `.claude/statusline/statusline.sh` (lines 340-441) - Reads from docker status file, no changes needed
- `.ai/ai_docs/context-docs/infrastructure/docker-setup.md` - Documents Kong gateway on port 54521
- `.ai/ai_docs/context-docs/infrastructure/docker-troubleshooting.md` - Documents health check patterns

## Impact Analysis

### Dependencies Affected

- **docker-health-wrapper.sh**: Core Docker health monitoring script
- **Claude Code statusline**: Consumes health data from wrapper script
- **Supabase CLI**: Will pick up docker-compose.override.yml automatically
- No new dependencies required

### Risk Assessment

**Low Risk**:
- Changes are isolated to health checking logic
- No impact on actual container functionality
- Fallback mechanisms already exist
- Easy to test and verify

### Backward Compatibility

- Fully backward compatible
- Native Docker health checks are additive
- Process-based checks remain as fallback
- No breaking changes to existing functionality

### Performance Impact

- Minimal: Health checks run every 30 seconds (existing interval)
- HTTP check to Kong gateway adds ~10-50ms latency per check
- No impact on container performance or application behavior

### Security Considerations

- Health check endpoints are already exposed locally
- No authentication required for basic health endpoints
- No new attack surface introduced
- All checks use localhost/127.0.0.1 only

## Pre-Feature Checklist

Before starting implementation:
- [x] Verify that you have read the recommended context documents
- [ ] Create feature branch: `feature/docker-statusline-health-checks`
- [x] Review existing similar features for patterns (docker-health-wrapper.sh, supabase-external-health.sh)
- [x] Identify all integration points (statusline.sh, docker-health-wrapper.sh)
- [x] Define success metrics (16/16 healthy shown in statusline)
- [x] Confirm feature doesn't duplicate existing functionality
- [x] Verify all required dependencies are available
- [ ] Plan feature flag strategy (if needed) - Not needed, direct fix

## Documentation Updates Required

- Update `.ai/ai_docs/context-docs/infrastructure/docker-troubleshooting.md`:
  - Add section on Supabase container health check configuration
  - Document the compose override approach

- Update `.ai/ai_docs/context-docs/infrastructure/docker-setup.md`:
  - Document the docker-compose.override.yml file location
  - Note health check patterns for custom containers

## Rollback Plan

If issues arise:

1. **Revert docker-health-wrapper.sh changes**:
   - Git revert the health check endpoint changes
   - Containers will return to showing as "unknown" (15/16)

2. **Remove docker-compose.override.yml**:
   - Delete the override file
   - Restart Supabase: `cd apps/web && npx supabase stop && npx supabase start`
   - Native health checks will be removed

3. **Monitoring**:
   - Watch statusline for correct display
   - Check docker logs for health check failures
   - Verify container functionality is unaffected

## Implementation Plan

### Phase 1: Foundation

1. Create feature branch
2. Analyze current health check behavior
3. Verify correct endpoints are accessible

### Phase 2: Core Implementation

1. Fix docker-health-wrapper.sh external health checks
2. Create Supabase docker-compose.override.yml with native health checks
3. Update health counting logic to treat process-validated containers as healthy

### Phase 3: Integration

1. Test with Supabase restart to verify override is applied
2. Verify statusline displays 16/16 healthy
3. Test edge cases (container restart, process death, network issues)

## Step by Step Tasks

### Step 1: Create Feature Branch

```bash
git checkout -b feature/docker-statusline-health-checks
```

### Step 2: Fix PostgREST Health Check Endpoint

Edit `.claude/bin/docker-health-wrapper.sh` line 1222:

**Before**:
```bash
if timeout 2s curl -s -f http://localhost:3001/live >/dev/null 2>&1; then
```

**After**:
```bash
if timeout 2s curl -s -f http://127.0.0.1:54521/rest/v1/ >/dev/null 2>&1; then
```

### Step 3: Fix Health Status Return Values

Edit `.claude/bin/docker-health-wrapper.sh` lines 1226 and 1236:

Change from returning "unknown" to "healthy" when process checks succeed (these are valid health confirmations):

**Line 1226** (PostgREST fallback):
```bash
# Before
health_status="unknown"
# After
health_status="healthy"
```

**Line 1236** (Edge Runtime):
```bash
# Before
health_status="unknown"
# After
health_status="healthy"
```

### Step 4: Create Supabase Docker Compose Override

Create file `apps/web/supabase/docker-compose.override.yml`:

```yaml
# Docker Compose override for Supabase containers
# Adds native health checks for containers that don't have them
# These containers are managed by Supabase CLI but lack native HEALTHCHECK directives

version: '3.8'

services:
  rest:
    # PostgREST API server
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s

  edge-runtime:
    # Supabase Edge Functions runtime (Deno)
    healthcheck:
      test: ["CMD-SHELL", "pgrep -x deno || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s
```

### Step 5: Verify Supabase CLI Recognizes Override

Test that the override file is picked up:

```bash
cd apps/web
npx supabase stop
npx supabase start
```

Check container health status:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "rest|edge"
```

### Step 6: Test Health Check Endpoints

Verify the correct endpoints are accessible:

```bash
# PostgREST via Kong (should return 200)
curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:54521/rest/v1/"

# Edge Runtime process check
docker top supabase_edge_runtime_2025slideheroes-db | grep deno
```

### Step 7: Trigger Docker Health Cache Refresh

Force a refresh of the Docker health cache:

```bash
# Clear the cached status
GIT_ROOT_HASH=$(echo "/home/msmith/projects/2025slideheroes" | sha256sum | cut -d' ' -f1 | head -c16)
rm -f "/tmp/.claude_docker_status_${GIT_ROOT_HASH}"

# Trigger health check
.claude/bin/docker-health-wrapper.sh health-check
```

### Step 8: Verify Statusline Shows 16/16

Check the statusline output directly:

```bash
echo '{"model": {"display_name": "Test"}}' | .claude/statusline/statusline.sh | grep docker
```

Expected output should show `docker (16/16)` instead of `docker (15/16)`.

### Step 9: Run Validation Commands

Execute the validation commands to ensure no regressions.

## Testing Strategy

### Unit Tests

- No unit tests needed - this is infrastructure configuration
- The wrapper script uses shell functions that are tested via integration

### Integration Tests

- Verify docker-health-wrapper.sh correctly identifies all 16 containers as healthy
- Verify statusline.sh correctly displays 16/16
- Test with containers stopped/started to verify state transitions

### E2E Tests

- Start full stack with `npx supabase start`
- Verify Claude Code statusline shows correct count
- Stop a container and verify count decreases
- Restart container and verify recovery

### Edge Cases

- Container restart during health check
- Network timeout on health endpoint
- Process dies but container running
- Kong gateway unavailable (fallback to process check)
- Docker daemon restart

## Acceptance Criteria

1. Claude Code statusline shows `docker (16/16)` when all containers are healthy
2. `docker ps` shows both `supabase_rest_*` and `supabase_edge_runtime_*` as "(healthy)"
3. Process-based fallback works when HTTP health check fails
4. No performance degradation in statusline updates
5. Health check works after Supabase restart

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

```bash
# 1. Verify PostgREST endpoint is accessible
curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:54521/rest/v1/" | grep -q "200" && echo "PASS: PostgREST endpoint" || echo "FAIL: PostgREST endpoint"

# 2. Verify Edge Runtime Deno process
docker top supabase_edge_runtime_2025slideheroes-db 2>/dev/null | grep -q "deno" && echo "PASS: Edge Runtime process" || echo "FAIL: Edge Runtime process"

# 3. Verify docker-health-wrapper.sh health check
.claude/bin/docker-health-wrapper.sh health-check 2>/dev/null && echo "PASS: Health wrapper" || echo "FAIL: Health wrapper"

# 4. Verify statusline shows 16/16 (or correct count)
echo '{"model": {"display_name": "Test"}}' | .claude/statusline/statusline.sh 2>/dev/null | grep -q "docker (16/16)" && echo "PASS: Statusline 16/16" || echo "FAIL: Statusline not 16/16"

# 5. Verify all containers show healthy status
UNHEALTHY=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" | wc -l)
[ "$UNHEALTHY" -eq 0 ] && echo "PASS: No unhealthy containers" || echo "FAIL: $UNHEALTHY unhealthy containers"

# 6. Verify no containers show as unknown (should be 0 or only non-monitored)
# Run typecheck to ensure no TypeScript issues introduced
pnpm typecheck
```

## Notes

### Supabase CLI Docker Compose Override

The Supabase CLI supports `docker-compose.override.yml` files in the `supabase/` directory. This allows customization of container configurations without modifying the CLI's generated compose files.

Key considerations:
- The override must use Supabase's internal service names (`rest`, `edge-runtime`), not the full container names
- The override is merged with the CLI-generated configuration
- Health check commands must use tools available inside the container (wget, curl, pgrep)

### Port 54521 vs 3000/3001

- PostgREST internally listens on port 3000
- Kong gateway exposes it on port 54521 (mapped to 8000 inside Kong)
- Direct container port 3000 is not exposed to host
- Health checks must go through Kong at 54521 or use internal Docker networking

### Process-Based Health Checks

For containers without native Docker HEALTHCHECK or accessible HTTP endpoints, process-based checks are reliable:
- `docker top <container> | grep <process>` verifies the main process is running
- This is especially useful for Edge Runtime (Deno) which doesn't expose a health endpoint

### Future Considerations

- Consider adding health check endpoints to Edge Functions for more detailed status
- Monitor Supabase CLI updates that might add native health checks
- Consider adding response time metrics to health checks
