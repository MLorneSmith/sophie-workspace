---
name: docker-health
status: backlog
created: 2025-09-26T13:21:18Z
progress: 0%
specification: .claude/tracking/specs/docker-health.md
github:
type: implementation-plan
---

# Implementation Plan: docker-health

## Overview

The docker-health feature adds real-time Docker container health monitoring to the Claude Code statusline, providing immediate visibility into container status during development. This plan outlines the technical implementation of a high-performance, shell-based monitoring system that integrates seamlessly with existing statusline infrastructure while maintaining minimal overhead.

## Architecture Decisions

### Decision 1: Shell-Based Implementation with Caching
- **Choice**: Pure Bash implementation following existing wrapper patterns
- **Rationale**: Consistency with current statusline architecture, minimal dependencies, fastest integration
- **Alternatives Considered**: Node.js backend (rejected for added complexity), Python script (rejected for dependency requirements)

### Decision 2: Multi-Level Caching Strategy
- **Choice**: Three-tier cache (in-memory → file-based → stale fallback)
- **Rationale**: Balances performance requirements (<100ms statusline updates) with freshness needs
- **Alternatives Considered**: Single file cache (insufficient performance), API calls on every refresh (too slow)
⚠️ **Warning**: Cache invalidation timing may need tuning based on actual usage patterns

### Decision 3: Batch Docker API Calls
- **Choice**: Single `docker inspect` call for all containers with JSON output
- **Rationale**: Reduces API overhead from N calls to 1, enables parallel processing
- **Alternatives Considered**: Individual container checks (too slow), docker-compose ps (limited to compose stacks)

### Decision 4: Progressive Health Check Strategy
- **Choice**: Native HEALTHCHECK → Port availability → Process status
- **Rationale**: Provides comprehensive coverage for containers with and without health checks
- **Alternatives Considered**: Only native health checks (incomplete coverage), Deep service checks (too complex)

### Decision 5: Background Process Management
- **Choice**: Detached background process with PID tracking and cleanup
- **Rationale**: Non-blocking execution prevents statusline delays, automatic cleanup prevents zombies
- **Alternatives Considered**: Synchronous checks (blocks statusline), systemd timer (overcomplicated)

## Technical Components

### Frontend Components
- Statusline integration point in `statusline.sh`
- Visual indicators following emoji patterns (🟢🟡🔴⚪⟳)
- Aggregated health display format: `🟢 docker (5/5)`
- Freshness indicators with time-based coloring

### Backend Services
- `docker-health-wrapper.sh`: Main health check orchestrator
- Background health check process with 30-second intervals
- Docker API interaction layer using JSON format
- Process management for cleanup and zombie prevention

### Data Layer
- Status file at `/tmp/.claude_docker_status_${GIT_ROOT}`
- Cache files for API response optimization
- PID file for background process tracking
- Container state tracking with timestamps

### Infrastructure
- Integration with existing wrapper script patterns
- Support for multiple Docker environments (Desktop, Engine, WSL2)
- Cross-platform path normalization
- Error handling for permission and daemon issues

## Implementation Phases

### Phase 1: Foundation (4 hours)
- [ ] Create `docker-health-wrapper.sh` following existing patterns
- [ ] Implement basic Docker daemon detection and availability checks
- [ ] Add status file management with proper file locking
- [ ] Create integration point in `statusline.sh`
- [ ] Implement emoji-based status display logic

### Phase 2: Core Features (5 hours)
- [ ] Implement batch Docker container health checks
- [ ] Add multi-level caching mechanism with TTL
- [ ] Create background process management with PID tracking
- [ ] Implement progressive health check strategies
- [ ] Add container categorization (app, database, service)

### Phase 3: Enhancement (3 hours)
- [ ] Add support for multiple Docker Compose stacks
- [ ] Implement intelligent aggregation with service categorization
- [ ] Add cross-platform compatibility (WSL2, macOS, Linux)
- [ ] Optimize performance with change detection
- [ ] Add detailed error messages for troubleshooting

### Phase 4: Polish & Deploy (2 hours)
- [ ] Complete comprehensive testing across Docker configurations
- [ ] Add performance monitoring and metrics collection
- [ ] Create documentation and troubleshooting guide
- [ ] Implement cleanup routines and resource management
- [ ] Add configuration options for thresholds and intervals

## Task Categories (Preview)
High-level task categories for decomposition:
- [ ] Wrapper Script Creation: Build main health check wrapper following patterns
- [ ] Docker API Integration: Implement efficient container status retrieval
- [ ] Cache Management: Multi-level caching with intelligent invalidation
- [ ] Background Processing: Non-blocking health checks with process management
- [ ] Statusline Integration: Seamless integration with existing display system
- [ ] Testing & Validation: Cross-platform testing with various Docker setups

## Dependencies

### External Dependencies
- Docker Engine 20.x+ or Docker Desktop 4.x+
- Bash 4.0+ for associative arrays
- Standard Unix tools (grep, awk, sed, timeout)
- Git for repository root detection

### Internal Dependencies
- Claude Code statusline infrastructure (`statusline.sh`)
- Existing wrapper script patterns (codecheck-wrapper.sh as reference)
- Temporary file management system
- Git repository detection logic

### Optional Dependencies
- `jq` for enhanced JSON parsing (with grep/sed fallback)
- `docker-compose` for compose-specific features
- Network utilities (nc, curl) for advanced health checks

## Risk Mitigation

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| Docker API changes | Low | Medium | Use stable API features, version detection |
| Performance degradation | Medium | High | Multi-level caching, background processing |
| Cross-platform issues | Medium | Medium | Platform detection, graceful fallbacks |
| False positive health reports | Low | High | Multiple check strategies, validation |
| Resource exhaustion | Low | Medium | Process limits, cleanup routines |
| Permission errors | Medium | Low | Clear error messages, documentation |

⚠️ **Architecture Warnings**:
- Cache invalidation timing may need adjustment based on container restart patterns
- Background process management requires careful cleanup to prevent orphans
- WSL2 Docker Desktop integration may have unique networking quirks

## Success Criteria (Technical)
- [ ] Health check execution completes within 2 seconds
- [ ] Statusline update latency remains under 100ms
- [ ] Cache hit ratio exceeds 90% during normal operation
- [ ] CPU usage stays below 5% for background monitoring
- [ ] Zero false negatives for unhealthy containers
- [ ] Accurate detection of all container state changes
- [ ] Graceful handling of Docker daemon unavailability
- [ ] Cross-platform compatibility verified

## Estimated Effort

### By Phase
- Phase 1 (Foundation): 4 hours
- Phase 2 (Core Features): 5 hours
- Phase 3 (Enhancement): 3 hours
- Phase 4 (Polish & Deploy): 2 hours
- **Total**: 14 hours

### By Resource Type
- Shell Script Development: 7 hours
- Docker API Integration: 3 hours
- Testing & Validation: 2 hours
- Documentation: 2 hours

## Implementation Details

### Docker API Command Strategy

```bash
# Optimal command for batch health retrieval
docker ps --format json | while read container; do
  docker inspect "$(echo "$container" | jq -r '.Names')" \
    --format '{{.Name}}:{{.State.Health.Status}}:{{.State.Running}}'
done

# Fallback without jq
docker ps --format "{{.Names}}" | while read name; do
  docker inspect "$name" \
    --format '{{.Name}}:{{.State.Health.Status}}:{{.State.Running}}'
done
```

### Cache Management Architecture

```
┌─────────────────────────────────────┐
│         Statusline Request          │
└──────────────┬──────────────────────┘
               ▼
       ┌───────────────┐
       │ Memory Cache  │ ◄── 30s TTL
       │  (Fastest)    │
       └───────┬───────┘
               ▼ Miss
       ┌───────────────┐
       │  File Cache   │ ◄── 90s TTL
       │ (Persistent)  │
       └───────┬───────┘
               ▼ Miss
       ┌───────────────┐
       │ Background    │
       │ Health Check  │ ◄── Async
       └───────┬───────┘
               ▼
       ┌───────────────┐
       │ Stale Fallback│ ◄── 5min max
       └───────────────┘
```

### Error Handling Flow

```
Docker Daemon Check → Available?
  ├─ No → Display "⚪ docker:offline"
  └─ Yes → Container Check
           ├─ No Containers → "⚪ docker:none"
           ├─ Permission Error → "🔴 docker:permission"
           └─ Success → Health Aggregation
                        ├─ All Healthy → "🟢 docker (X/X)"
                        ├─ Some Issues → "🟡 docker (Y/X)"
                        └─ Critical → "🔴 docker (Z/X)"
```

### Performance Optimization Techniques

1. **Change Detection**: Only perform full health check when container list changes
2. **Batch Processing**: Single Docker API call for all containers
3. **Background Execution**: Non-blocking health checks every 30 seconds
4. **Smart Caching**: Multi-level cache with intelligent TTL management
5. **Process Pooling**: Limit concurrent Docker API calls to prevent exhaustion

## Tasks Created - 2025-09-26T13:29:37Z

### Task Overview
Total Tasks: 12
- Parallel Tasks: 8 (66.7% - can run simultaneously)
- Sequential Tasks: 4 (33.3% - must run in order)
- Total Effort: 31 hours
- Optimal Execution: ~10 hours (with 3-4 parallel agents)
- Speedup Factor: 3.1x with parallel execution

### Task List
| ID | Task Name | Hours | Dependencies | Parallel |
|----|-----------|-------|--------------|----------|
| 001 | Create docker-health-wrapper.sh shell script | 2 | None | ❌ |
| 002 | Implement Docker daemon detection | 2 | 001 | ❌ |
| 003 | Implement status file management | 2 | 002 | ❌ |
| 004 | Add statusline integration | 2 | 003 | ✅ |
| 005 | Implement batch Docker health checks | 3 | 002 | ✅ |
| 006 | Create multi-level caching mechanism | 3 | 003 | ✅ |
| 007 | Implement background process management | 3 | 005 | ✅ |
| 008 | Add progressive health check strategies | 3 | 005 | ✅ |
| 009 | Support multiple Docker Compose stacks | 2 | 005, 008 | ✅ |
| 010 | Add cross-platform compatibility | 3 | 007 | ✅ |
| 011 | Create comprehensive test suite | 4 | 001-010 | ❌ |
| 012 | Create documentation and guides | 2 | 011 | ✅ |

### Execution Strategy
#### Batch 1 - Foundation (Sequential, 6 hours)
- Tasks: 001, 002, 003
- Agents: bash-expert → docker-expert → general-purpose
- Critical path - must complete before parallel work begins

#### Batch 2 - Core Features (Parallel, 3-4 hours)
- Tasks: 004, 005, 006, 007, 008
- Agents: general-purpose (2), docker-expert (2), bash-expert
- Can run simultaneously after foundation complete

#### Batch 3 - Enhancement (Parallel, 3 hours)
- Tasks: 009, 010
- Agents: docker-expert, devops-expert
- Can run while Batch 2 is executing

#### Batch 4 - Validation & Documentation (4 hours)
- Tasks: 011, 012
- Agents: testing-expert, documentation-expert
- Task 011 must wait for all implementation
- Task 012 can start after 011

### Dependency Graph Validation
✅ No circular dependencies detected
✅ All task references valid
✅ Critical path clearly defined
✅ Parallel opportunities maximized

### Risk Factors
- File conflicts: None identified (tasks work on single main file)
- Complexity: 6/10 (moderate - well-understood domain)
- Dependencies: Maximum chain depth of 4 tasks
- Integration points: 2 (statusline.sh integration, background process)

### Performance Estimates
- Sequential execution: 31 hours
- Parallel execution (3 agents): ~10 hours
- Time saved: 21 hours (67.7% reduction)
- Optimal agent count: 3-4 for this feature

## Next Steps

1. Review tasks: `ls -la .claude/tracking/implementations/docker-health/*.md`
2. Sync to GitHub: `/features:4-sync docker-health`
3. Start execution: `/features:4-start docker-health`
4. Monitor progress: `/features:4-status docker-health`