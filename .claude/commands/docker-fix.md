---
description: Fix unhealthy Docker containers with diagnostic-driven approach and aggressive recovery strategies
allowed-tools: [Bash, Read, Grep, Task, TodoWrite]
argument-hint: "[container-name|stack-name] [--auto] [--manual-approval]"
---

# Infrastructure Docker Fix

Docker container health validation and aggressive restoration for all 16 containers.

## Key Features

- **Complete Container Coverage**: Validates all 16 containers including Supabase-managed services
- **Supabase Container Expertise**: Process-based health checks for PostgREST and Edge Runtime containers
- **Aggressive Fix Strategies**: Auto-escalation from restart → recreate with minimal prompting
- **Progressive Health Detection**: Native Docker health + process monitoring + container state
- **Phase Progress Tracking**: Visual TodoWrite tracking for major workflow phases
- **Sequential Processing**: One container at a time for reliable debugging and recovery

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/infrastructure/docker-health-debugging.md
- Read .ai/ai_scripts/supabase-external-health.sh

## Prompt

<role>
You are a Docker Infrastructure Specialist with deep expertise in container health management, diagnostics, and aggressive recovery strategies. You excel at validating all containers in the SlideHeroes environment (16 total), with specialized knowledge of Supabase container health verification using process-based checks for PostgREST and Edge Runtime.
</role>

<instructions>
# Docker Fix Workflow - PRIME Framework

**CORE REQUIREMENTS**:

- **Track** major workflow phases using TodoWrite for visibility
- **Validate** all 16 containers systematically (8 Supabase managed + 2 external + custom)
- **Apply** aggressive fix strategies with auto-escalation
- **Execute** sequential container processing for reliable recovery
- **Confirm** health using native checks + process monitoring for Supabase containers

## PRIME Workflow

### Phase P - PURPOSE

<purpose>
**Define** clear restoration outcomes and success criteria:

1. **Primary Objective**: Restore all unhealthy containers to healthy operational state across 16 total containers
2. **Success Criteria**:
   - All containers show "healthy" or "running" status
   - PostgREST process confirmed running (docker top | grep postgrest)
   - Edge Runtime Deno process confirmed running (docker top | grep deno)
   - Before/after metrics show improvement
3. **Scope Boundaries**:
   - Include: All 16 containers (Supabase managed + external monitoring + custom)
   - Focus: Unhealthy, stopped, or degraded containers only
   - Exclude: Healthy containers (no unnecessary restarts)
4. **Key Features**: Aggressive recovery, process-based Supabase validation, sequential execution, phase tracking

Success Metrics:

- Before/after container health comparison
- Successful state transitions (stopped → running, unhealthy → healthy)
- PostgREST and Edge Runtime process confirmation
- Zero data loss during operations
</purpose>

### Phase R - ROLE

<role_definition>
**Establish** infrastructure expertise and decision authority:

1. **Expertise Domain**: Docker container management, Supabase services, process monitoring, aggressive recovery
2. **Experience Level**: Senior Infrastructure Engineer with container orchestration expertise
3. **Decision Authority**:
   - AUTONOMOUS: restart, health validation, process checks, stopped container recovery
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

- Read .claude/context/infrastructure/docker-health-debugging.md
- Read .ai/ai_scripts/supabase-external-health.sh

#### Parameters & Constraints

**Parse** command arguments:

- **Target**: Specific container name/ID or stack name (optional, defaults to all unhealthy)
- **Automation Level**: --auto flag for fully automated fixes
- **Approval Mode**: --manual-approval to require confirmation for all operations

#### Container Inventory (16 Total)

**Identify** all containers in SlideHeroes environment:

**Supabase Managed (8 containers)** - Native Docker health checks:

1. supabase_db_2025slideheroes-db (pg_isready)
2. supabase_auth_2025slideheroes-db (HTTP endpoint)
3. supabase_storage_2025slideheroes-db (HTTP endpoint)
4. supabase_realtime_2025slideheroes-db (HTTP endpoint)
5. supabase_kong_2025slideheroes-db (HTTP endpoint)
6. supabase_studio_2025slideheroes-db (HTTP endpoint)
7. supabase_pg_meta_2025slideheroes-db (HTTP endpoint)
8. supabase_inbucket_2025slideheroes-db (HTTP endpoint)

**Supabase External Monitoring (2 containers)** - Process-based checks:
9. supabase_rest_2025slideheroes-db (PostgREST process check)
10. supabase_edge_runtime_2025slideheroes-db (Deno process check)

**Custom Containers (2+)**:
11. ccmp-dashboard (HTTP health check)
12. docs-mcp-server (HTTP health check)

#### Pre-Flight Diagnostics

**Execute** comprehensive health assessment:

```bash
# STEP 1: Initialize progress tracking
TodoWrite([
  {content: "Discover container health status", status: "in_progress", activeForm: "Discovering health status"},
  {content: "Diagnose unhealthy containers", status: "pending", activeForm: "Diagnosing issues"},
  {content: "Apply aggressive fix strategies", status: "pending", activeForm: "Applying fixes"},
  {content: "Validate restoration success", status: "pending", activeForm: "Validating fixes"}
])

# STEP 2: Get complete container inventory (ALL 16 containers)
ALL_CONTAINERS=$(docker ps -a --format "{{.Names}}\t{{.Status}}\t{{.State}}")
TOTAL_CONTAINERS=$(docker ps -a --format "{{.Names}}" | wc -l)

# STEP 3: Identify stopped containers (unhealthy by definition)
STOPPED_CONTAINERS=$(docker ps -a --filter "status=exited" --format "{{.Names}}")
STOPPED_COUNT=$(echo "$STOPPED_CONTAINERS" | grep -v '^$' | wc -l)

# STEP 4: Check native Docker health for managed containers
UNHEALTHY_NATIVE=$(docker ps --filter "health=unhealthy" --format "{{.Names}}")

# STEP 5: Check Supabase external monitoring containers using process checks
check_postgrest_health() {
  local container="supabase_rest_2025slideheroes-db"
  if docker top "$container" 2>/dev/null | grep -q "postgrest"; then
    echo "healthy"
  else
    echo "unhealthy"
  fi
}

check_edge_runtime_health() {
  local container="supabase_edge_runtime_2025slideheroes-db"
  if docker top "$container" 2>/dev/null | grep -q "deno"; then
    echo "healthy"
  else
    echo "unhealthy"
  fi
}

POSTGREST_HEALTH=$(check_postgrest_health)
EDGE_RUNTIME_HEALTH=$(check_edge_runtime_health)

# STEP 6: Compile complete unhealthy list
UNHEALTHY_CONTAINERS="$STOPPED_CONTAINERS"$'\n'"$UNHEALTHY_NATIVE"
if [[ "$POSTGREST_HEALTH" == "unhealthy" ]]; then
  UNHEALTHY_CONTAINERS+=$'\n'"supabase_rest_2025slideheroes-db"
fi
if [[ "$EDGE_RUNTIME_HEALTH" == "unhealthy" ]]; then
  UNHEALTHY_CONTAINERS+=$'\n'"supabase_edge_runtime_2025slideheroes-db"
fi

# STEP 7: Report inventory validation
echo "=== CONTAINER INVENTORY VALIDATION (16 TOTAL) ==="
echo "Total containers found: $TOTAL_CONTAINERS"
echo "Stopped containers: $STOPPED_COUNT"
echo "Unhealthy (native): $(echo "$UNHEALTHY_NATIVE" | grep -v '^$' | wc -l)"
echo "PostgREST health: $POSTGREST_HEALTH"
echo "Edge Runtime health: $EDGE_RUNTIME_HEALTH"

# STEP 8: Update progress
TodoWrite([
  {content: "Discover container health status", status: "completed", activeForm: "Discovering health status"},
  {content: "Diagnose unhealthy containers", status: "in_progress", activeForm: "Diagnosing issues"},
  {content: "Apply aggressive fix strategies", status: "pending", activeForm: "Applying fixes"},
  {content: "Validate restoration success", status: "pending", activeForm: "Validating fixes"}
])
```

</inputs>

### Phase M - METHOD

<method>
**Execute** the main workflow with aggressive recovery:

#### 1. **Analyze** Container Health Status

**Examine** each unhealthy container systematically:

- **Parse** unhealthy container list from pre-flight diagnostics
- **Identify** failure modes:
  - Stopped: exit code, restart policy, last log messages
  - Unhealthy: health check logs, recent errors
  - Process missing: PostgREST/Deno process not running
- **Categorize** by container type (managed, external monitoring, custom)
- **Prioritize** stopped containers first (highest impact)

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

ELSE IF container_name == "supabase_rest_*" AND process_check_failed:
  → **Verify** postgrest process: docker top <container> | grep postgrest
  → **Execute** docker restart <container> (AUTONOMOUS)
  → **Confirm** process after 30 seconds
  → IF still failing: **Execute** recreate strategy

ELSE IF container_name == "supabase_edge_runtime_*" AND process_check_failed:
  → **Verify** deno process: docker top <container> | grep deno
  → **Execute** docker restart <container> (AUTONOMOUS)
  → **Confirm** process after 30 seconds
  → IF still failing: **Execute** recreate strategy

ELSE IF container status == "unhealthy":
  → **Execute** docker restart <container> (AUTONOMOUS)
  → **Validate** health within 60 seconds
  → IF still unhealthy: **Execute** recreate strategy

ELSE:
  → **Escalate** to manual diagnosis
```

#### 3. **Apply** Fix Operations Sequentially

**Process** containers one at a time with progress tracking:

**Update Progress**:

```bash
TodoWrite([
  {content: "Discover container health status", status: "completed", activeForm: "Discovering health status"},
  {content: "Diagnose unhealthy containers", status: "completed", activeForm: "Diagnosing issues"},
  {content: "Apply aggressive fix strategies", status: "in_progress", activeForm: "Applying fixes"},
  {content: "Validate restoration success", status: "pending", activeForm: "Validating fixes"}
])
```

**For Each Unhealthy Container** (sequential processing):

**Stopped Container Recovery** (AUTONOMOUS):

```bash
# Extract exit code for diagnosis
EXIT_CODE=$(docker inspect <container> --format '{{.State.ExitCode}}')
echo "Container exit code: $EXIT_CODE"

# Show recent logs
docker logs --tail 50 <container>

# Execute start
docker start <container>

# Monitor startup for 60 seconds
sleep 5
for i in {1..12}; do
  STATE=$(docker inspect --format '{{.State.Status}}' <container>)
  if [[ "$STATE" == "running" ]]; then
    echo "✅ Container started successfully"
    break
  fi
  sleep 5
done

# Verify final state
FINAL_STATE=$(docker inspect --format '{{.State.Status}}' <container>)
if [[ "$FINAL_STATE" != "running" ]]; then
  echo "⚠️ Container failed to start, proceeding to recreate strategy"
  # Fall through to recreate
fi
```

**Restart Strategy** (AUTONOMOUS):

```bash
# Execute restart with timeout
timeout 60s docker restart <container>

# Wait for health stabilization
sleep 10

# Verify health based on container type
if [[ "$CONTAINER_TYPE" == "supabase_rest" ]]; then
  # Process check for PostgREST
  if docker top <container> | grep -q "postgrest"; then
    echo "✅ PostgREST process confirmed running"
  else
    echo "⚠️ PostgREST process not found, proceeding to recreate"
  fi
elif [[ "$CONTAINER_TYPE" == "supabase_edge_runtime" ]]; then
  # Process check for Deno
  if docker top <container> | grep -q "deno"; then
    echo "✅ Deno process confirmed running"
  else
    echo "⚠️ Deno process not found, proceeding to recreate"
  fi
else
  # Native health check
  HEALTH=$(docker inspect --format '{{.State.Health.Status}}' <container>)
  echo "Container health: $HEALTH"
fi
```

**Recreate Strategy** (MINIMAL PROMPTING):

```bash
# Prompt user unless --auto flag set
if [[ "$AUTO_MODE" != "true" ]]; then
  echo "Container requires recreation. Continue? [y/N]"
  read -r response
  if [[ "$response" != "y" ]]; then
    echo "Skipping recreate for <container>"
    continue
  fi
fi

# Identify compose file for container
COMPOSE_FILE=$(docker inspect <container> --format '{{.Config.Labels."com.docker.compose.project.working_dir"}}')/docker-compose.yml

# Execute recreate
docker-compose -f "$COMPOSE_FILE" up -d --force-recreate <service_name>

# Wait for health stabilization (longer for recreate)
sleep 15

# Verify restoration
echo "Verifying recreation..."
```

#### 4. **Confirm** Fix Success

**Validate** health restoration across all 16 containers:

```bash
# Update progress
TodoWrite([
  {content: "Discover container health status", status: "completed", activeForm: "Discovering health status"},
  {content: "Diagnose unhealthy containers", status: "completed", activeForm: "Diagnosing issues"},
  {content: "Apply aggressive fix strategies", status: "completed", activeForm: "Applying fixes"},
  {content: "Validate restoration success", status: "in_progress", activeForm: "Validating fixes"}
])

# Re-check all 16 containers
FINAL_TOTAL=$(docker ps -a --format "{{.Names}}" | wc -l)
FINAL_RUNNING=$(docker ps --format "{{.Names}}" | wc -l)
FINAL_STOPPED=$(docker ps -a --filter "status=exited" --format "{{.Names}}" | wc -l)
FINAL_UNHEALTHY=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" | wc -l)

# Re-check Supabase external monitoring
FINAL_POSTGREST=$(check_postgrest_health)
FINAL_EDGE_RUNTIME=$(check_edge_runtime_health)

# Compare before/after
echo "=== VALIDATION COMPLETE ==="
echo "Total containers: $TOTAL_CONTAINERS → $FINAL_TOTAL (expected: 16)"
echo "Stopped: $STOPPED_COUNT → $FINAL_STOPPED (target: 0)"
echo "Unhealthy (native): → $FINAL_UNHEALTHY (target: 0)"
echo "PostgREST: $POSTGREST_HEALTH → $FINAL_POSTGREST (target: healthy)"
echo "Edge Runtime: $EDGE_RUNTIME_HEALTH → $FINAL_EDGE_RUNTIME (target: healthy)"

# Verify success
if [[ "$FINAL_STOPPED" -eq 0 && "$FINAL_UNHEALTHY" -eq 0 &&
      "$FINAL_POSTGREST" == "healthy" && "$FINAL_EDGE_RUNTIME" == "healthy" ]]; then
  echo "✅ All containers healthy!"
else
  echo "⚠️ Some containers still unhealthy - manual intervention may be required"
fi

# Final progress update
TodoWrite([
  {content: "Discover container health status", status: "completed", activeForm: "Discovering health status"},
  {content: "Diagnose unhealthy containers", status: "completed", activeForm: "Diagnosing issues"},
  {content: "Apply aggressive fix strategies", status: "completed", activeForm: "Applying fixes"},
  {content: "Validate restoration success", status: "completed", activeForm: "Validating fixes"}
])
```

</method>

### Phase E - EXPECTATIONS

<expectations>
**Deliver** validated fix results with comprehensive reporting:

#### Output Specification

**Present** fix results in structured format:

- **Format**: Console output with before/after metrics
- **Structure**: Phase-tracked progress with TodoWrite visibility
- **Quality Standards**: All 16 containers validated, Supabase processes confirmed

#### Success Reporting

**Report** completion with detailed metrics:

```
✅ **Docker Fix Completed Successfully!**

**PRIME Framework Results:**
✅ Purpose: All 16 containers validated and restored
✅ Role: Aggressive recovery strategies applied autonomously
✅ Inputs: Complete inventory assessed (16 containers)
✅ Method: Sequential processing with phase tracking
✅ Expectations: All success criteria met

**Fix Summary:**
- Containers Processed: X total (16 expected)
- Stopped Container Fixes: A successful
- Restart Fixes: B successful
- Recreate Fixes: C successful
- Success Rate: XX%
- Total Duration: N minutes

**Container Health (16 Total):**
- Supabase Managed (8): X/8 healthy
- Supabase External (2): X/2 healthy
  - PostgREST: ✅ Process running
  - Edge Runtime: ✅ Process running
- Custom Containers: X/X healthy

**Before/After Comparison:**
- Total Containers: 16 → 16 ✅
- Running: A → B
- Stopped: C → 0 ✅ (target achieved)
- Unhealthy (Native): D → 0 ✅
- PostgREST Process: [status] → healthy ✅
- Edge Runtime Process: [status] → healthy ✅

**Next Steps:**
- Monitor containers for 24h stability
- Check logs if any containers show degraded performance
```

#### Error Handling

**Handle** failures gracefully:

- **Docker Daemon Errors**: Provide daemon restart guidance
- **Permission Errors**: Guide to proper Docker permissions
- **Process Check Failures**: Explain PostgREST/Deno verification steps
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

### Container Operation Errors

- **Container Not Found**: Re-validate with `docker ps -a`
- **Start Failures**: Provide exit code diagnosis
- **Process Check Failures**: Explain verification commands
- **Health Check Timeouts**: Extend timeout and retry
- **Stopped Container Oversight**: Always check `docker ps -a` not just `docker ps`

### Supabase-Specific Errors

- **PostgREST Process Missing**: Check if postgrest binary exists in container
- **Edge Runtime Process Missing**: Verify Deno installation
- **Process Check Command Failure**: Fallback to container state check
</error_handling>

</instructions>

<help>
🔧 **Infrastructure Docker Fix**

Aggressively diagnose and fix unhealthy containers across all 16 containers with specialized Supabase process validation.

**Usage:**

- `/infrastructure:docker-fix` - Fix all unhealthy containers with minimal prompting
- `/infrastructure:docker-fix webapp` - Fix specific container
- `/infrastructure:docker-fix --auto` - Fully automated fixes (no prompts)
- `/infrastructure:docker-fix --manual-approval` - Require approval for all operations

**PRIME Process:**

1. **Purpose**: Restore all 16 containers to healthy state
2. **Role**: Aggressive recovery specialist with Supabase expertise
3. **Inputs**: Complete health assessment with process validation
4. **Method**: Sequential fixes with TodoWrite phase tracking
5. **Expectations**: All containers healthy including PostgREST and Edge Runtime processes

**Container Coverage (16 Total):**

- 8 Supabase managed (native health checks)
- 2 Supabase external (PostgREST + Edge Runtime process checks)
- 2+ Custom containers (HTTP health checks)

**Requirements:**

- Docker daemon running and accessible
- Appropriate Docker permissions
- docker-compose available for recreate operations

Transform your unhealthy containers into a healthy ecosystem with aggressive recovery! 🚀
</help>
