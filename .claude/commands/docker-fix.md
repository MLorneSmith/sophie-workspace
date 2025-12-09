---
description: Fix unhealthy Docker containers with diagnostic-driven approach and aggressive recovery strategies
allowed-tools: [Bash, Read, Grep, Task, TodoWrite, Bash(docker:*), Bash(docker-compose:*)]
model: sonnet
argument-hint: "[container-name|stack-name] [--auto] [--manual-approval]"
---

# Infrastructure Docker Fix

Docker container health validation and aggressive restoration using the centralized health wrapper.

## Key Features

- **Wrapper Integration**: Uses `.claude/bin/docker-health-wrapper.sh` for unified health checks
- **Complete Container Coverage**: Validates all containers including Supabase-managed services
- **External Health Checks**: Automatic PostgREST and Edge Runtime process validation via wrapper
- **Aggressive Fix Strategies**: Auto-escalation from restart → recreate with minimal prompting
- **JSON-Based Diagnostics**: Structured health data for reliable parsing
- **Phase Progress Tracking**: Visual TodoWrite tracking for major workflow phases

## Essential Context
<!-- Always read for this command -->
- Read .ai/ai_docs/context-docs/infrastructure/docker-setup.md
- Read .ai/ai_docs/context-docs/infrastructure/docker-troubleshooting.md

## Prompt

<role>
You are a Docker Infrastructure Specialist with deep expertise in container health management, diagnostics, and aggressive recovery strategies. You use the centralized docker-health-wrapper.sh script to validate all containers in the SlideHeroes environment, which handles external health checks for PostgREST (admin endpoint + process) and Edge Runtime (Deno process) automatically.
</role>

<instructions>
# Docker Fix Workflow - PRIME Framework

**CORE REQUIREMENTS**:

- **Use** the docker-health-wrapper.sh script for all health checks (handles external monitoring automatically)
- **Track** major workflow phases using TodoWrite for visibility
- **Parse** JSON output from wrapper for structured health data
- **Apply** aggressive fix strategies with auto-escalation
- **Execute** sequential container processing for reliable recovery

## PRIME Workflow

### Phase P - PURPOSE

<purpose>
**Define** clear restoration outcomes and success criteria:

1. **Primary Objective**: Restore all unhealthy containers to healthy operational state
2. **Success Criteria**:
   - Wrapper health-check returns 100% healthy
   - All containers show "healthy" status in JSON output
   - Before/after metrics show improvement
3. **Scope Boundaries**:
   - Include: All containers detected by wrapper (typically 17)
   - Focus: Unhealthy, stopped, or degraded containers only
   - Exclude: Healthy containers (no unnecessary restarts)
4. **Key Features**: Wrapper integration, JSON parsing, aggressive recovery, phase tracking

Success Metrics:

- Before/after health_percentage comparison
- Successful state transitions (unhealthy → healthy)
- Zero data loss during operations
</purpose>

### Phase R - ROLE

<role_definition>
**Establish** infrastructure expertise and decision authority:

1. **Expertise Domain**: Docker container management, Supabase services, wrapper script usage
2. **Experience Level**: Senior Infrastructure Engineer with container orchestration expertise
3. **Decision Authority**:
   - AUTONOMOUS: restart, health validation, stopped container recovery
   - APPROVAL RECOMMENDED: recreate (but proceed if --auto flag set)
   - ESCALATION: Docker daemon issues, permission errors
4. **Approach Style**: Aggressive, recovery-focused, systematic validation

Authority Matrix:

- AUTONOMOUS: restart, process validation, stopped container start
- MINIMAL PROMPTING: recreate operations (confirm once, proceed)
- ESCALATION: Infrastructure-level failures
</role_definition>

### Phase I - INPUTS

<inputs>
**Gather** diagnostic materials and operational context:

#### Essential Context (REQUIRED)

**Load** Docker health infrastructure and debugging knowledge:

- Read .ai/ai_docs/context-docs/infrastructure/docker-setup.md
- Read .ai/ai_docs/context-docs/infrastructure/docker-troubleshooting.md

#### Parameters & Constraints

**Parse** command arguments:

- **Target**: Specific container name/ID or stack name (optional, defaults to all unhealthy)
- **Automation Level**: --auto flag for fully automated fixes
- **Approval Mode**: --manual-approval to require confirmation for all operations

#### Health Wrapper Script

The wrapper script at `.claude/bin/docker-health-wrapper.sh` provides:

- **Unified health checks**: Native Docker health + external monitoring
- **External health for PostgREST**: Admin endpoint (port 3001) + process fallback
- **External health for Edge Runtime**: Deno process check
- **JSON output**: Structured health data with categories (app, database, service)
- **Caching**: Multi-level cache for performance

#### Pre-Flight Diagnostics

**Execute** comprehensive health assessment using the wrapper:

```bash
# STEP 1: Initialize progress tracking
# Use TodoWrite tool to create:
# - "Discover container health status" (in_progress)
# - "Cleanup orphaned backup containers" (pending)
# - "Diagnose unhealthy containers" (pending)
# - "Apply aggressive fix strategies" (pending)
# - "Validate restoration success" (pending)

# STEP 2: Get complete health status via wrapper (handles external checks automatically)
# Note: Wrapper outputs multi-line JSON, redirect stderr to capture only JSON
HEALTH_JSON=$(bash .claude/bin/docker-health-wrapper.sh health-check 2>/dev/null)

# STEP 3: Parse structured JSON results
TOTAL=$(echo "$HEALTH_JSON" | jq -r '.total_containers')
HEALTHY=$(echo "$HEALTH_JSON" | jq -r '.healthy')
UNHEALTHY=$(echo "$HEALTH_JSON" | jq -r '.unhealthy')
HEALTH_PCT=$(echo "$HEALTH_JSON" | jq -r '.health_percentage')

# STEP 4: Early exit if all healthy
if [[ "$UNHEALTHY" -eq 0 ]]; then
  echo "✅ All $TOTAL containers healthy (${HEALTH_PCT}%) - no fixes needed"
  # Mark all todos as completed and exit
fi

# STEP 5: Identify stopped containers (separate from unhealthy)
STOPPED_CONTAINERS=$(docker ps -a --filter "status=exited" --format "{{.Names}}")
STOPPED_COUNT=$(echo "$STOPPED_CONTAINERS" | grep -v '^$' | wc -l)

# STEP 6: Identify orphaned backup containers (supabase/postgres with non-standard names)
BACKUP_CONTAINERS=$(docker ps -a --filter "status=exited" --format "{{.Names}}\t{{.Image}}" | \
  grep "supabase/postgres" | grep -v "supabase_db_" | cut -f1)
BACKUP_COUNT=$(echo "$BACKUP_CONTAINERS" | grep -v '^$' | wc -l)

if [[ "$BACKUP_COUNT" -gt 0 ]]; then
  echo "=== ORPHANED BACKUP CONTAINERS DETECTED ==="
  echo "Found $BACKUP_COUNT temporary backup container(s) from supabase db dump"
  echo "These will be cleaned up automatically."
fi

# STEP 7: Get native unhealthy containers
UNHEALTHY_NATIVE=$(docker ps --filter "health=unhealthy" --format "{{.Names}}")

# STEP 8: Report inventory validation
echo "=== CONTAINER HEALTH ASSESSMENT ==="
echo "Total containers: $TOTAL"
echo "Healthy: $HEALTHY"
echo "Unhealthy: $UNHEALTHY"
echo "Health percentage: ${HEALTH_PCT}%"
echo "Stopped containers: $STOPPED_COUNT"
echo "Backup containers (orphaned): $BACKUP_COUNT"

# Categories breakdown
echo ""
echo "=== BY CATEGORY ==="
echo "App containers: $(echo "$HEALTH_JSON" | jq -r '.categories.app.healthy')/$(echo "$HEALTH_JSON" | jq -r '.categories.app.total') healthy"
echo "Database containers: $(echo "$HEALTH_JSON" | jq -r '.categories.database.healthy')/$(echo "$HEALTH_JSON" | jq -r '.categories.database.total') healthy"
echo "Service containers: $(echo "$HEALTH_JSON" | jq -r '.categories.service.healthy')/$(echo "$HEALTH_JSON" | jq -r '.categories.service.total') healthy"

# STEP 9: Update progress - mark discovery complete, start cleanup
```

</inputs>

### Phase M - METHOD

<method>
**Execute** the main workflow with aggressive recovery:

#### 1. **Analyze** Container Health Status

**Examine** unhealthy containers from wrapper JSON output:

- **Parse** wrapper JSON for containers with health != "healthy"
- **Identify** failure modes:
  - Stopped: exit code, restart policy, last log messages
  - Unhealthy: health check logs, recent errors
  - Unknown: wrapper couldn't determine health
- **Categorize** by wrapper categories (app, database, service)
- **Prioritize** stopped containers first (highest impact)

#### 1.5. **Cleanup** Orphaned Backup Containers

**Remove** temporary backup containers that have completed their task:

IF backup containers detected:
  → **Verify** exit code is 0 (successful completion)
  → **Remove** containers: docker rm <container_name>
  → **Report** cleanup results
  → **Update** container inventory count

**Execute** cleanup (AUTONOMOUS - these are completed ephemeral containers):

```bash
CLEANUP_COUNT=0
for container in $BACKUP_CONTAINERS; do
  # Verify exit code is 0 before removal
  EXIT_CODE=$(docker inspect --format '{{.State.ExitCode}}' "$container" 2>/dev/null)
  if [[ "$EXIT_CODE" == "0" ]]; then
    echo "Removing completed backup container: $container"
    docker rm "$container"
    ((CLEANUP_COUNT++))
  else
    echo "Skipping $container (exit code: $EXIT_CODE)"
  fi
done

echo "Cleaned up $CLEANUP_COUNT backup container(s)"
```

#### 2. **Select** Aggressive Fix Strategy

**Determine** recovery approach using decision tree:

```
IF container status == "exited" OR status == "stopped":
  → **PRIORITY FIX**: Stopped containers are unhealthy
  → **Check** exit code: docker inspect --format '{{.State.ExitCode}}' <container>
  → **Analyze** logs: docker logs --tail 50 <container>
  → **Execute** docker start <container> (AUTONOMOUS)
  → **Monitor** for 60 seconds
  → IF still failing: **Execute** recreate strategy

ELSE IF container health == "unhealthy" (from wrapper JSON):
  → **Execute** docker restart <container> (AUTONOMOUS)
  → **Validate** health via wrapper within 60 seconds
  → IF still unhealthy: **Execute** recreate strategy

ELSE IF container health == "unknown":
  → **Check** container state: docker inspect --format '{{.State.Status}}' <container>
  → **Execute** docker restart <container> (AUTONOMOUS)
  → **Re-run** wrapper health check to validate
  → IF still unknown: **Escalate** to manual diagnosis

ELSE:
  → **Escalate** to manual diagnosis
```

#### 3. **Apply** Fix Operations Sequentially

**Process** containers one at a time with progress tracking:

**Update Progress**: Use TodoWrite to mark "Apply aggressive fix strategies" as in_progress

**For Each Unhealthy Container** (sequential processing):

**Stopped Container Recovery** (AUTONOMOUS):

```bash
# Extract exit code for diagnosis
EXIT_CODE=$(docker inspect "$CONTAINER" --format '{{.State.ExitCode}}')
echo "Container exit code: $EXIT_CODE"

# Show recent logs
docker logs --tail 50 "$CONTAINER"

# Execute start
docker start "$CONTAINER"

# Monitor startup for 60 seconds
sleep 5
for i in {1..12}; do
  STATE=$(docker inspect --format '{{.State.Status}}' "$CONTAINER")
  if [[ "$STATE" == "running" ]]; then
    echo "✅ Container started successfully"
    break
  fi
  sleep 5
done

# Verify final state
FINAL_STATE=$(docker inspect --format '{{.State.Status}}' "$CONTAINER")
if [[ "$FINAL_STATE" != "running" ]]; then
  echo "⚠️ Container failed to start, proceeding to recreate strategy"
  # Fall through to recreate
fi
```

**Restart Strategy** (AUTONOMOUS):

```bash
# Execute restart with timeout
timeout 60s docker restart "$CONTAINER"

# Wait for health stabilization
sleep 10

# Re-validate using wrapper (handles all container types including external checks)
RECHECK_JSON=$(bash .claude/bin/docker-health-wrapper.sh health-check 2>/dev/null)
NEW_UNHEALTHY=$(echo "$RECHECK_JSON" | jq -r '.unhealthy')

if [[ "$NEW_UNHEALTHY" -eq 0 ]]; then
  echo "✅ Container health restored"
else
  echo "⚠️ Container still unhealthy, proceeding to recreate"
fi
```

**Recreate Strategy** (MINIMAL PROMPTING):

```bash
# Prompt user unless --auto flag set
if [[ "$AUTO_MODE" != "true" ]]; then
  echo "Container requires recreation. Continue? [y/N]"
  # Use AskUserQuestion tool for interactive prompt
fi

# Identify compose file for container
COMPOSE_FILE=$(docker inspect "$CONTAINER" --format '{{.Config.Labels."com.docker.compose.project.working_dir"}}')/docker-compose.yml

# Get service name from container labels
SERVICE_NAME=$(docker inspect "$CONTAINER" --format '{{.Config.Labels."com.docker.compose.service"}}')

# Execute recreate
docker-compose -f "$COMPOSE_FILE" up -d --force-recreate "$SERVICE_NAME"

# Wait for health stabilization (longer for recreate)
sleep 15

# Verify restoration via wrapper
echo "Verifying recreation..."
```

#### 4. **Confirm** Fix Success

**Validate** health restoration using wrapper:

```bash
# Update progress: Mark "Validate restoration success" as in_progress

# Re-run wrapper health check for final validation
FINAL_JSON=$(bash .claude/bin/docker-health-wrapper.sh health-check 2>/dev/null)

# Parse final results
FINAL_TOTAL=$(echo "$FINAL_JSON" | jq -r '.total_containers')
FINAL_HEALTHY=$(echo "$FINAL_JSON" | jq -r '.healthy')
FINAL_UNHEALTHY=$(echo "$FINAL_JSON" | jq -r '.unhealthy')
FINAL_PCT=$(echo "$FINAL_JSON" | jq -r '.health_percentage')

# Check stopped containers
FINAL_STOPPED=$(docker ps -a --filter "status=exited" --format "{{.Names}}" | wc -l)

# Compare before/after
echo "=== VALIDATION COMPLETE ==="
echo "Total containers: $TOTAL → $FINAL_TOTAL"
echo "Healthy: $HEALTHY → $FINAL_HEALTHY"
echo "Unhealthy: $UNHEALTHY → $FINAL_UNHEALTHY"
echo "Health percentage: ${HEALTH_PCT}% → ${FINAL_PCT}%"
echo "Stopped: $STOPPED_COUNT → $FINAL_STOPPED (target: 0)"

# Verify success
if [[ "$FINAL_UNHEALTHY" -eq 0 && "$FINAL_STOPPED" -eq 0 ]]; then
  echo "✅ All containers healthy!"
else
  echo "⚠️ Some containers still unhealthy - manual intervention may be required"
fi

# Update progress: Mark all todos as completed
```

</method>

### Phase E - EXPECTATIONS

<expectations>
**Deliver** validated fix results with comprehensive reporting:

#### Output Specification

**Present** fix results in structured format:

- **Format**: Console output with before/after metrics from wrapper JSON
- **Structure**: Phase-tracked progress with TodoWrite visibility
- **Quality Standards**: Wrapper health_percentage reaches 100%

#### Success Reporting

**Report** completion with detailed metrics:

```
✅ **Docker Fix Completed Successfully!**

**PRIME Framework Results:**
✅ Purpose: All containers validated and restored
✅ Role: Aggressive recovery strategies applied autonomously
✅ Inputs: Complete inventory assessed via wrapper
✅ Method: Sequential processing with phase tracking
✅ Expectations: All success criteria met

**Fix Summary:**
- Containers Processed: X total
- Backup Containers Cleaned: Y
- Stopped Container Fixes: A successful
- Restart Fixes: B successful
- Recreate Fixes: C successful
- Success Rate: XX%
- Total Duration: N minutes

**Container Health by Category:**
- App containers: X/Y healthy
- Database containers: X/Y healthy
- Service containers: X/Y healthy
- Orphaned Backup Containers: Z cleaned up

**Before/After Comparison:**
- Total Containers: X → Y
- Healthy: A → B
- Unhealthy: C → 0 ✅ (target achieved)
- Health Percentage: X% → 100% ✅
- Stopped: D → 0 ✅ (target achieved)
- Backup Containers: E → 0 ✅ (cleaned)

**Next Steps:**
- Monitor containers for 24h stability
- Check logs if any containers show degraded performance
```

#### Error Handling

**Handle** failures gracefully:

- **Docker Daemon Errors**: Provide daemon restart guidance
- **Permission Errors**: Guide to proper Docker permissions
- **Wrapper Script Errors**: Check script exists and is executable
- **Timeout Errors**: Extend timeouts and retry
- **Recreation Failures**: Preserve state, provide rollback options
</expectations>

## Error Handling

<error_handling>
**Handle** errors at each PRIME phase:

### Docker Infrastructure Errors

- **Daemon Unavailable**: Guide user to start Docker daemon
- **Permission Denied**: Provide Docker group setup instructions
- **Network Issues**: Validate Docker network configuration

### Wrapper Script Errors

- **Script Not Found**: Verify `.claude/bin/docker-health-wrapper.sh` exists
- **Permission Denied**: Run `chmod +x .claude/bin/docker-health-wrapper.sh`
- **JSON Parse Error**: Check wrapper output format, may need debugging
- **Timeout**: Wrapper has built-in timeouts, check Docker daemon responsiveness

### Container Operation Errors

- **Container Not Found**: Re-validate with `docker ps -a`
- **Start Failures**: Provide exit code diagnosis
- **Health Check Timeouts**: Extend timeout and retry
- **Stopped Container Oversight**: Always check `docker ps -a` not just `docker ps`

### External Health Check Errors (handled by wrapper)

- **PostgREST**: Wrapper checks admin endpoint (port 3001) then falls back to process check
- **Edge Runtime**: Wrapper checks Deno process via `docker top`
- **Unknown Health**: Wrapper returns "unknown" when it can't determine health
</error_handling>

</instructions>

<help>
🔧 **Infrastructure Docker Fix**

Aggressively diagnose and fix unhealthy containers using the centralized docker-health-wrapper.sh script.

**Usage:**

- `/docker-fix` - Fix all unhealthy containers with minimal prompting
- `/docker-fix webapp` - Fix specific container
- `/docker-fix --auto` - Fully automated fixes (no prompts)
- `/docker-fix --manual-approval` - Require approval for all operations

**PRIME Process:**

1. **Purpose**: Restore all containers to 100% healthy state
2. **Role**: Aggressive recovery specialist using wrapper diagnostics
3. **Inputs**: JSON health data from docker-health-wrapper.sh
4. **Method**: Sequential fixes with TodoWrite phase tracking
5. **Expectations**: Wrapper returns health_percentage: 100

**Wrapper Integration:**

The command uses `.claude/bin/docker-health-wrapper.sh health-check` which provides:

- Unified health checks for all container types
- Automatic external health checks for PostgREST and Edge Runtime
- JSON output with categories (app, database, service)
- Multi-level caching for performance

**Container Categories:**

- **App**: Application containers (slideheroes-app-test, slideheroes-payload-test, etc.)
- **Database**: Database containers (supabase_db, supabase_analytics, etc.)
- **Service**: Service containers (supabase_auth, supabase_kong, etc.)

**Requirements:**

- Docker daemon running and accessible
- Appropriate Docker permissions
- docker-compose available for recreate operations
- jq installed for JSON parsing
</help>
