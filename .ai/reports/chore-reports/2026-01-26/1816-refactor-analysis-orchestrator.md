# Refactoring Analysis: Alpha Orchestrator System

**Generated**: 2026-01-26
**Target**: `.ai/alpha/scripts/lib/` (full directory)
**Analyst**: Claude Refactoring Specialist

## Executive Summary

The Alpha Orchestrator system at `.ai/alpha/scripts/lib/` contains **12,335 lines** across 26 TypeScript files. Four files exceed the CRITICAL threshold of 800 lines, with `orchestrator.ts` at **2,320 lines** being the most severe. The codebase has grown organically with bug fixes (#1567, #1688, #1699, #1727, #1746, #1767, #1777, #1782, #1786, #1799, #1803) leading to accumulated complexity.

**Recommendation**: YES, refactor. The `orchestrator.ts` file is nearly 3x the CRITICAL threshold and contains multiple distinct responsibilities that should be extracted into focused modules.

## Target Overview

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Total Files | 26 | - | - |
| Total Lines | 12,335 | - | - |
| Files >800 lines | 4 | 0 | ❌ CRITICAL |
| Files >400 lines | 10 | 0 | ⚠️ HIGH |
| `if` statements (orchestrator.ts) | 126 | <30 | ❌ CRITICAL |
| `try` blocks (orchestrator.ts) | 25 | <10 | ❌ HIGH |

### File Size Distribution

| File | Lines | Severity | Primary Concern |
|------|-------|----------|-----------------|
| `orchestrator.ts` | 2,320 | 🔴 CRITICAL | Main orchestration, multiple responsibilities |
| `manifest.ts` | 1,101 | 🔴 CRITICAL | Manifest generation + persistence |
| `sandbox.ts` | 958 | 🔴 CRITICAL | Creation, keepalive, review sandbox |
| `feature.ts` | 850 | 🔴 CRITICAL | Feature implementation with retry loops |
| `database.ts` | 741 | 🟠 HIGH | Database operations |
| `work-queue.ts` | 537 | 🟠 HIGH | Queue management |
| `progress.ts` | 491 | 🟠 HIGH | Progress tracking |
| `visual-validation.ts` | 453 | 🟠 HIGH | Visual validation |
| `heartbeat-monitor.ts` | 453 | 🟠 HIGH | Heartbeat monitoring |
| `state-machine.ts` | 438 | 🟠 HIGH | State machine |

## Complexity Analysis: orchestrator.ts

### Exported Functions

| Function | Lines | Start Line | Cyclomatic Est. | Risk |
|----------|-------|------------|-----------------|------|
| `orchestrate()` | ~930 | 1391 | >50 | 🔴 CRITICAL |
| `runWorkLoop()` | ~745 | 643 | >35 | 🔴 CRITICAL |
| `detectAndHandleDeadlock()` | ~195 | 432 | ~15 | 🟠 HIGH |
| `printSummary()` | ~65 | 340 | ~5 | 🟢 OK |
| `printDryRun()` | ~55 | 271 | ~5 | 🟢 OK |

### Internal Functions

| Function | Lines | Risk |
|----------|-------|------|
| `startEventServer()` | ~75 | 🟠 MEDIUM |
| `stopEventServer()` | ~7 | 🟢 OK |
| `waitForUIReady()` | ~30 | 🟢 OK |
| `createLogger()` | ~10 | 🟢 OK |

### Distinct Responsibilities in orchestrator.ts

The file handles **at least 8 distinct concerns**:

1. **Event Server Management** (lines 117-259)
   - Starting Python event server
   - Port management and cleanup
   - UI ready polling

2. **Output/Summary Generation** (lines 261-408)
   - Dry run printing
   - Final summary generation

3. **Deadlock Detection & Recovery** (lines 410-627)
   - Phantom completion detection
   - Failed feature retry logic
   - Initiative failure handling

4. **Work Loop Orchestration** (lines 629-1379)
   - Health check intervals
   - Keepalive intervals
   - PTY fallback recovery
   - Stuck task detection
   - Phantom completion detection (duplicated!)

5. **Main Orchestration Flow** (lines 1380-2320)
   - Pre-flight checks
   - Python dependency validation
   - Sandbox initialization
   - Database operations
   - Reconnection logic
   - Documentation generation
   - Completion phase
   - Review sandbox creation

### Anti-Patterns Detected

| Anti-Pattern | Count | Locations |
|--------------|-------|-----------|
| Deep nesting (>4 levels) | 15+ | Work loop, completion phase |
| Duplicated phantom completion logic | 2 | Lines 454-526, 1294-1367 |
| Mixed sync/async code | Many | Throughout `orchestrate()` |
| Giant if-else chains | 3 | Startup, completion phase |
| Magic numbers | 10+ | Timeouts, intervals |

## Complexity Analysis: feature.ts

### Primary Function: `runFeatureImplementation()`

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Total Lines | ~700 | <100 | ❌ CRITICAL |
| Retry Loop Depth | 3 | <2 | 🟠 HIGH |
| try/catch Blocks | 8 | <3 | 🟠 HIGH |

### Distinct Responsibilities

1. **Git Operations** (lines 184-219)
2. **PTY Management** (lines 400-575)
3. **Startup Monitoring** (lines 294-353, 369-616)
4. **Progress Polling** (lines 248-291)
5. **Stall Detection** (lines 275-291)
6. **Result Parsing** (lines 625-780)
7. **Manifest Updates** (lines 685-750)

## Recommended Refactoring Strategy

### Phase 1: Extract Event Server Module (PRIORITY: HIGH)

**Create**: `lib/event-server.ts`

Extract from `orchestrator.ts`:
- `startEventServer()`
- `stopEventServer()`
- `waitForUIReady()`
- `eventServerProcess` module state

**Estimated reduction**: ~140 lines from orchestrator.ts

### Phase 2: Extract Deadlock Handler (PRIORITY: HIGH)

**Create**: `lib/deadlock-handler.ts`

Extract:
- `detectAndHandleDeadlock()`
- Phantom completion recovery logic
- Initiative failure handling

**Estimated reduction**: ~200 lines from orchestrator.ts

### Phase 3: Extract Completion Phase Handler (PRIORITY: HIGH)

**Create**: `lib/completion-phase.ts`

Extract:
- Review sandbox creation
- Dev server startup
- Documentation generation
- Sandbox cleanup
- Review URL collection

**Estimated reduction**: ~350 lines from orchestrator.ts

### Phase 4: Extract Work Loop into Class (PRIORITY: MEDIUM)

**Create**: `lib/work-loop.ts`

Refactor `runWorkLoop()` to:
- `WorkLoop` class with clear state
- Extract health check interval to method
- Extract keepalive interval to method
- Extract stuck task detection to method

**Estimated reduction**: ~500 lines from orchestrator.ts, cleaner separation

### Phase 5: Extract Sandbox Lifecycle (PRIORITY: MEDIUM)

**Create**: `lib/sandbox-lifecycle.ts`

Move from `sandbox.ts`:
- `createReviewSandbox()` (distinct from implementation sandbox)
- Reconnection logic
- Keepalive coordination

### Phase 6: Refactor feature.ts (PRIORITY: MEDIUM)

**Create**: `lib/feature-runner.ts`

Extract:
- PTY session management
- Startup retry logic into dedicated class
- Progress parsing to separate module

## Implementation Checklist

### Immediate Actions (Week 1)

```json
[
  {"content": "Create backup branch: refactor/alpha-orchestrator", "priority": "high"},
  {"content": "Extract event-server.ts from orchestrator.ts", "priority": "high"},
  {"content": "Extract deadlock-handler.ts from orchestrator.ts", "priority": "high"},
  {"content": "Add unit tests for extracted modules", "priority": "high"}
]
```

### Short-term (Week 2-3)

```json
[
  {"content": "Extract completion-phase.ts from orchestrator.ts", "priority": "high"},
  {"content": "Refactor runWorkLoop() to WorkLoop class", "priority": "medium"},
  {"content": "Extract sandbox lifecycle management", "priority": "medium"},
  {"content": "Add integration tests for refactored code", "priority": "medium"}
]
```

### Longer-term (Week 4+)

```json
[
  {"content": "Refactor feature.ts into FeatureRunner class", "priority": "medium"},
  {"content": "Consolidate duplicate phantom completion logic", "priority": "low"},
  {"content": "Extract magic numbers to config constants", "priority": "low"}
]
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing spec runs | Medium | High | Feature flags, gradual rollout |
| Regression in edge cases | Medium | Medium | Add tests before refactoring |
| Merge conflicts with ongoing work | Low | Medium | Coordinate with team |
| Performance degradation | Low | Low | Benchmark before/after |

## Validation Commands

```bash
# After each extraction:
pnpm typecheck
pnpm lint:fix
pnpm test:unit --filter=alpha

# Integration validation:
./spec-orchestrator.ts 1692 --dry-run
```

## Recommended Target Structure

```
.ai/alpha/scripts/lib/
├── index.ts                    # Re-exports
├── orchestrator.ts             # ~600 lines (down from 2,320)
├── work-loop.ts                # ~400 lines (new)
├── completion-phase.ts         # ~350 lines (new)
├── deadlock-handler.ts         # ~200 lines (new)
├── event-server.ts             # ~150 lines (new)
├── feature.ts                  # ~400 lines (down from 850)
├── feature-runner.ts           # ~300 lines (new)
├── sandbox.ts                  # ~500 lines (down from 958)
├── sandbox-lifecycle.ts        # ~300 lines (new)
├── manifest.ts                 # Keep or split if needed
├── database.ts                 # Keep
├── work-queue.ts               # Keep
├── progress.ts                 # Keep
└── ... (remaining utility modules)
```

## Final Recommendation

**YES, refactor the Alpha Orchestrator system.**

The `orchestrator.ts` file at 2,320 lines is nearly 3x the CRITICAL threshold. The high concentration of bug fix comments (#1567, #1688, #1699, #1727, etc.) indicates the code has accumulated technical debt through incremental patches.

**Recommended approach**:
1. Start with low-risk extractions (event-server, deadlock-handler)
2. Add tests for the extracted modules
3. Progressively extract larger pieces (completion-phase, work-loop)
4. Maintain backward compatibility with existing spec runs

**Expected outcomes**:
- `orchestrator.ts` reduced from 2,320 to ~600 lines
- Improved testability of individual components
- Clearer separation of concerns
- Easier bug isolation and fixing

---
*Generated by Claude Refactoring Analyst*
