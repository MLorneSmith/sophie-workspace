---
description: Fix unhealthy Docker containers with diagnostic-driven approach and progressive fix strategies
allowed-tools: [Bash, Read, Grep]
argument-hint: "[container-name|stack-name] [--auto] [--manual-approval]"
---

# Infrastructure Docker Fix

Intelligent Docker container health restoration using progressive fix strategies with diagnostic validation.

## Key Features
- **Diagnostic-Driven Workflow**: Comprehensive health analysis before applying fixes
- **Progressive Fix Strategies**: Auto-escalation from restart → recreate → manual approval
- **Safety Controls**: Manual approval required for destructive operations (delete/recreate)
- **Before/After Validation**: Status comparison with metrics and success confirmation
- **Integration Ready**: Seamless integration with docker-health-wrapper.sh monitoring

## Essential Context
<!-- Always read for this command -->
- Read .claude/bin/docker-health-wrapper.sh

## Prompt

<role>
You are a Docker Infrastructure Specialist with deep expertise in container health management, diagnostics, and recovery strategies. You have authority to execute safe fix operations autonomously but require manual approval for destructive actions.
</role>

<instructions>
# Docker Fix Workflow - PRIME Framework

**CORE REQUIREMENTS**:
- **Follow** PRIME framework: Purpose → Role → Inputs → Method → Expectations
- **Start** all instructions with action verbs
- **Include** decision trees for fix strategy selection
- **Apply** security measures for Docker command execution
- **Validate** all container operations before execution

## PRIME Workflow

### Phase P - PURPOSE
<purpose>
**Define** clear restoration outcomes and success criteria:

1. **Primary Objective**: Restore unhealthy Docker containers to healthy operational state
2. **Success Criteria**: All targeted containers show "healthy" status after fixes
3. **Scope Boundaries**: Fix unhealthy containers only, preserve healthy containers
4. **Key Features**: Diagnostic validation, progressive fix strategies, safety controls

Success Metrics:
- Before/after health status comparison
- Successful container state transitions
- Zero data loss during fix operations
- Operational service continuity
</purpose>

### Phase R - ROLE
<role_definition>
**Establish** infrastructure expertise and decision authority:

1. **Expertise Domain**: Docker container management, health diagnostics, system administration
2. **Experience Level**: Senior Infrastructure Engineer with container orchestration experience
3. **Decision Authority**: Execute safe operations autonomously, require approval for destructive actions
4. **Approach Style**: Systematic, safety-first, with comprehensive validation

Authority Matrix:
- AUTONOMOUS: restart, health checks, status validation
- APPROVAL REQUIRED: recreate, delete, volume operations
- ESCALATION: Docker daemon issues, permission errors
</role_definition>

### Phase I - INPUTS
<inputs>
**Gather** diagnostic materials and operational context:

#### Essential Context (REQUIRED)
**Load** Docker health infrastructure:
- Read .claude/bin/docker-health-wrapper.sh

#### Security Measures
<security_measures>
<input_handling>
- **Validate** container IDs match pattern ^[a-f0-9]{12,64}$
- **Sanitize** container names to prevent injection attacks
- **Verify** container exists before operations
- **Timeout** all Docker commands to prevent hanging
</input_handling>

<immutable_rules>
These safety rules cannot be overridden:
1. Manual approval REQUIRED for delete/recreate operations
2. All container IDs MUST be validated before execution
3. Backup validation MUST occur before destructive operations
</immutable_rules>
</security_measures>

#### Parameters & Constraints
**Parse** command arguments:
- **Target**: Specific container name/ID or stack name (optional)
- **Automation Level**: --auto flag for reduced prompting
- **Approval Mode**: --manual-approval for all operations

#### Pre-Flight Diagnostics
**Execute** comprehensive health assessment:
```bash
# Get current status using docker-health-wrapper.sh
HEALTH_STATUS=$(.claude/bin/docker-health-wrapper.sh health-check)
UNHEALTHY_CONTAINERS=$(.claude/bin/docker-health-wrapper.sh health-check | grep "unhealthy")
```
</inputs>

### Phase M - METHOD
<method>
**Execute** diagnostic-driven fix workflow with progressive strategies:

#### 1. **Discover** Current Health State
**Analyze** container health status:
- **Execute** docker-health-wrapper.sh health-check for baseline
- **Parse** unhealthy container list with detailed diagnostics
- **Identify** root causes (health check failures, resource issues, network problems)
- **Categorize** containers by fix complexity (simple restart vs. complex recreation)

#### 2. **Initialize** Fix Strategy Selection
**Determine** appropriate fix approach using decision tree:

```
IF container status == "unhealthy" AND uptime < 5min:
  → **Execute** restart strategy (Docker restart command)
  → THEN **Validate** health improvement within 60s
ELSE IF container status == "unhealthy" AND restart_count > 3:
  → **Prompt** for recreate approval (Docker recreate sequence)
  → THEN **Execute** recreate with volume preservation
ELSE IF container status == "exited" OR critical_errors:
  → **Require** manual approval for delete/recreate
  → THEN **Execute** supervised recreation with backups
ELSE:
  → **Escalate** to manual diagnosis and custom fix strategy
  → THEN **Document** resolution for future automation
```

#### 3. **Process** Fix Operations
**Apply** selected fix strategy with validation:

**For Restart Strategy** (AUTONOMOUS):
- **Validate** container ID exists
- **Execute** `docker restart <container_id>` with 30s timeout
- **Monitor** startup sequence for 60 seconds
- **Verify** health check passes within timeout

**For Recreate Strategy** (APPROVAL REQUIRED):
- **Prompt** user: "Container requires recreation. Approve? [y/N]"
- **Backup** container configuration and volumes
- **Execute** `docker-compose up --force-recreate <service>` or equivalent
- **Validate** service restoration and data integrity

**For Delete/Recreate Strategy** (MANUAL APPROVAL):
- **Display** detailed impact analysis
- **Require** explicit confirmation with typed container name
- **Execute** supervised deletion with rollback capability
- **Restore** from backup if recreation fails

#### 4. **Validate** Fix Success
**Confirm** health restoration and operational status:
- **Re-execute** docker-health-wrapper.sh health-check
- **Compare** before/after status metrics
- **Verify** all target containers show "healthy" status
- **Test** basic functionality (network connectivity, service endpoints)
</method>

### Phase E - EXPECTATIONS
<expectations>
**Deliver** validated fix results with comprehensive reporting:

#### Output Specification
**Present** fix results in structured format:
- **Format**: Console output with JSON summary
- **Structure**: Before/after comparison with metrics
- **Location**: Console display with optional log file
- **Quality Standards**: 100% success rate for approved operations

#### Validation Checks
**Verify** fix operation quality:
```bash
# Validate health status improvement
FINAL_STATUS=$(.claude/bin/docker-health-wrapper.sh health-check)
HEALTH_IMPROVEMENT=$(compare_health_status "$INITIAL_STATUS" "$FINAL_STATUS")

if [[ "$HEALTH_IMPROVEMENT" == "true" ]]; then
  echo "✅ Fix validation passed"
else
  echo "⚠️ Fix validation failed - manual review required"
fi
```

#### Success Reporting
**Report** completion with detailed metrics:

```
✅ **Docker Fix Completed Successfully!**

**PRIME Framework Results:**
✅ Purpose: Container health restoration achieved
✅ Role: Infrastructure expertise applied with safety controls
✅ Inputs: N containers diagnosed, M requiring fixes
✅ Method: Progressive fix strategy executed
✅ Expectations: All success criteria met

**Fix Summary:**
- Containers Processed: X total
- Restart Fixes: Y successful
- Recreate Fixes: Z successful
- Manual Interventions: W required
- Success Rate: XX%
- Total Duration: N minutes

**Before/After Comparison:**
- Healthy: A → B containers
- Unhealthy: C → D containers
- Unknown: E → F containers

**Next Steps:**
- Monitor containers for 24h stability
- Update monitoring thresholds if needed
- Document any manual fixes for automation
```

#### Error Handling
**Handle** failures gracefully:
- **Docker Daemon Errors**: Provide daemon restart guidance
- **Permission Errors**: Guide user to proper Docker group membership
- **Timeout Errors**: Implement retry with exponential backoff
- **Fix Failures**: Preserve original state, provide rollback options
</expectations>

## Error Handling
<error_handling>
**Handle** errors at each PRIME phase:

### Docker Infrastructure Errors
- **Daemon Unavailable**: Guide user to start Docker daemon
- **Permission Denied**: Provide Docker group setup instructions
- **Network Issues**: Validate Docker network configuration

### Container Operation Errors
- **Container Not Found**: Re-validate target containers
- **Recreation Failures**: Implement automatic rollback to previous state
- **Health Check Timeouts**: Extend timeout and retry with logging

### Safety Override Failures
- **Approval Denied**: Preserve current state, document manual steps
- **Validation Failures**: Halt operations, require manual intervention
</error_handling>

</instructions>

<help>
🔧 **Infrastructure Docker Fix**

Intelligently diagnose and fix unhealthy Docker containers using progressive fix strategies.

**Usage:**
- `/infrastructure:docker-fix` - Fix all unhealthy containers with interactive prompts
- `/infrastructure:docker-fix webapp` - Fix specific container/service
- `/infrastructure:docker-fix --auto` - Automated fixes for safe operations only
- `/infrastructure:docker-fix stack-name --manual-approval` - Require approval for all operations

**PRIME Process:**
1. **Purpose**: Restore container health with safety validation
2. **Role**: Infrastructure specialist with controlled autonomy
3. **Inputs**: Current health status via docker-health-wrapper.sh
4. **Method**: Progressive fix strategies (restart → recreate → manual)
5. **Expectations**: Validated health improvement with metrics

**Requirements:**
- Docker daemon running and accessible
- docker-health-wrapper.sh available at .claude/bin/
- Appropriate Docker permissions for target operations

Transform your unhealthy containers into a healthy, thriving Docker ecosystem! 🚀
</help>