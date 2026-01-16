# Initiative Workflow Analysis: User Dashboard Home (#1280)

**Date**: 2025-12-18
**Initiative**: User Dashboard Home with 7 components
**Master Issue**: #1280
**Manifest Issue**: #1279
**Feature Issues**: #1281-#1289 (9 features)

---

## Executive Summary

The `/initiative` workflow successfully completed the user dashboard implementation, but encountered significant issues during the implementation phase that resulted in lost work and required manual intervention. This analysis identifies root causes and provides actionable recommendations.

### Quick Stats
| Metric | Value |
|--------|-------|
| Total Features | 9 |
| Successfully Planned | 9/9 ✓ |
| Sandbox Failures | 2 (session terminations) |
| Work Lost | ~7 features worth of uncommitted code |
| Final Outcome | Success (after manual batch implementation) |

---

## Issue Analysis

### Issue A: Label Error (User-Reported)

**User Claim**: `type:research` label doesn't exist
**Investigation Result**: **CONFIRMED** - Label does NOT exist

**Available Labels**:
```
type:bug, type:feature, type:chore, type:docs, type:performance, type:security
status:triage, status:needs-info, status:planning, status:ready,
status:blocked, status:in-progress, status:review
```

**Root Cause**: The orchestrator attempted to use `type:research` which was assumed to exist but was never created.

**Impact**: Low - The command failed with "label not found" but we recovered by using `type:feature` instead.

**Recommendation**:
1. Add `type:research` label to repo, OR
2. Update `initiative-decomposition.md` to use `type:feature` for manifest issues

---

### Issue B: Sandbox Expiration/Termination (User-Reported)

**Observations**:
- Sandbox `iimjuehvry7zhs9652ozi` terminated after ~6 minutes during feature #1288
- Error: `SandboxError: 2: [unknown] terminated`
- New sandbox `ilvlbgp8h4j5sdl8i4a2x` created, required batch reimplementation

**Session Timeline**:
```
Session mjbt8na7: Started 18:37:10 → Failed 18:47:24 (#1283 Assessment Spider Card)
Session mjbt8na7: Started 19:05:14 → Failed 19:11:34 (#1288 Presentations Table)
Session mjbti75y: Started 19:12:40 → Success 19:19:22 (batch all remaining)
```

**Root Cause Analysis**:

1. **E2B Command Timeout**: The `sandbox.commands.run()` has a default 60-second timeout for individual commands. Long-running Claude Code sessions can exceed this.

2. **E2B Sandbox Lifetime**: Pro accounts have 1-hour sandbox lifetime, but the sandbox died after only ~6 minutes. This suggests either:
   - Memory/resource exhaustion in the sandbox
   - Network connectivity issues
   - E2B platform issues

3. **Uncommitted Work Loss**: The orchestrator was implementing features sequentially WITHOUT committing between features. When the sandbox died, ALL uncommitted changes were lost.

**Evidence from sandbox-cli.ts** (line 618-619):
```typescript
const result = await sandbox.commands.run(
  `run-claude "${prompt.replace(/"/g, '\\"')}"`,
  {
    timeoutMs: 0, // No timeout for long-running Claude tasks
```
The CLI correctly sets `timeoutMs: 0` for no timeout, but the sandbox itself can still terminate.

**Impact**: HIGH - Lost ~7 features worth of work, required manual recovery.

---

### Issue C: No Preview URL (User-Reported)

**Observations**: User asked for preview URL but none was provided.

**Investigation**:

1. **URL Command EXISTS** in sandbox-cli.ts (line 1927-1988):
```typescript
const host = sandbox.getHost(port);
// ...
/sandbox url abc123  Get dev server URL (port 3000)
```

2. **Initiative.md Step 4.3.2** documents the preview URL flow:
```bash
# Get the public URL for port 3000
${SANDBOX_CLI} url ${sandboxId} 3000
```

3. **Why It Wasn't Executed**: Step 4.3.2 is a "User Review Gate" that should run AFTER each feature implementation. Because the sandbox kept dying during implementation, we never reached the review gate.

**Root Cause**: The review gate is gated behind successful implementation. When implementation fails or is batched, the URL is never retrieved.

**Impact**: MEDIUM - User couldn't preview changes before PR creation.

---

## Additional Issues Identified

### Issue D: No Commit-Per-Feature Strategy

**Problem**: The initiative.md Step 4.3.3 shows "Commit Feature" happens AFTER user review, but in practice:
1. Multiple features implemented before any commit
2. Sandbox death = all uncommitted work lost
3. No incremental save points

**Recommendation**: Implement auto-commit after each feature (before review gate), then squash on PR.

---

### Issue E: Progress Communication Gap

**Problem**: The orchestrator has no visibility into sandbox implementation progress.

**Current State**:
- sandbox-cli.ts streams output via `onStdout` callback
- `/sandbox/initiative-implement` outputs `[PROGRESS]` markers
- Initiative.md Step 4.3.1 has parsing code for progress markers
- BUT: Progress parsing is documented but NOT IMPLEMENTED in actual orchestrator

**Evidence**: The initiative.md shows this code but it's pseudocode:
```typescript
// Note: Actual parsing happens via onStdout callback in sandbox CLI
```
The sandbox CLI writes to `process.stdout.write(data)` but there's no mechanism for the orchestrator to receive parsed progress.

**Recommendation**: Implement progress file or webhook for real-time status updates.

---

### Issue F: Single Point of Failure Architecture

**Problem**: Current architecture uses:
1. Single sandbox for ALL features
2. Sequential implementation within that sandbox
3. Single Claude Code context window for entire initiative

**Failure Modes**:
- Sandbox death = complete restart required
- Long sessions increase timeout/memory risk
- No parallelization possible

---

## Recommendations

### Priority 1: Implement Commit-Per-Feature (P1)

**Change**: Auto-commit immediately after each feature implementation, before user review.

**Implementation**:
```bash
# After each feature implementation succeeds
${SANDBOX_CLI} exec ${sandboxId} "cd /home/user/project && \
  git add -A && \
  git commit -m 'wip(#${featureIssue}): implement ${featureName}' --no-verify"
```

**Benefits**:
- Work is saved incrementally
- Sandbox death only loses current feature
- Can resume from last commit

### Priority 2: Add Preview URL to Implementation Output (P2)

**Change**: Always output preview URL after sandbox operations, not just in review gate.

**Implementation**: Add to `/sandbox/initiative-implement` output:
```json
{
  "success": true,
  "preview_url": "https://<sandbox-host>:3000",
  // ... existing fields
}
```

**Alternative**: Add `--with-url` flag to run-claude command that outputs URL at end.

### Priority 3: Implement Progress File Communication (P3)

**Change**: Use a progress file instead of stdout parsing.

**Implementation**:
```bash
# Sandbox writes progress to file
echo '{"feature": "1288", "status": "in_progress", "task": "Creating component"}' \
  >> /home/user/project/.initiative-progress.json

# Orchestrator polls file
${SANDBOX_CLI} exec ${sandboxId} "cat /home/user/project/.initiative-progress.json | tail -10"
```

### Priority 4: Multi-Sandbox Architecture for Large Initiatives (P4)

**Current**: Single sandbox, sequential features
**Proposed**: Multiple sandboxes for Phase 2 features (which can parallelize)

**Architecture**:
```
Phase 1: Single sandbox (foundation features, sequential)
         ↓
         Commit & Push
         ↓
Phase 2: Multiple sandboxes (independent features, parallel)
         ├── Sandbox A: Feature 3
         ├── Sandbox B: Feature 4
         └── Sandbox C: Feature 5
         ↓
         Merge branches
         ↓
Phase 3: Single sandbox (integration features, sequential)
```

**Benefits**:
- Parallelization of independent features
- Isolated failure domains
- Faster overall completion

**Complexity**: HIGH - Requires branch management, merge conflict resolution.

---

## Answers to User Questions

### Q: Should planning be per-feature with separate agents vs single coordinator?

**Recommendation**: Keep single coordinator (current architecture).

**Rationale**:
- Research manifest only needs to load ONCE
- Skills only need to load ONCE
- Conditional docs only need to load ONCE
- Sequential planning prevents context overflow from parallel outputs
- Each plan builds on shared context

**What to improve**:
- Add checkpointing (save progress to file after each feature plan)
- Add resume capability if planning agent dies mid-way

---

### Q: Should implementation use sub-agents per feature?

**Recommendation**: HYBRID approach.

**For Small-Medium Initiatives (≤5 features)**:
- Single sandbox, sequential implementation
- Commit after each feature (P1 fix)

**For Large Initiatives (>5 features)**:
- Phase 1: Single sandbox for foundation
- Phase 2: Parallel sandboxes for independent features
- Phase 3: Single sandbox for integration

**Key insight**: The problem isn't single vs multi-agent, it's the lack of incremental commits. With commit-per-feature, single sandbox is fine for most initiatives.

---

### Q: How to improve communication/progress from sandbox?

**Recommendation**: Three-tier communication.

1. **Real-time stdout** (existing): Keep for verbose logs
2. **Progress file** (new): Structured JSON progress for orchestrator
3. **Post-implementation summary** (existing but enhance): Add preview URL, commit hash

**Implementation Priority**:
1. Add preview URL to all sandbox operations (quick win)
2. Implement progress file polling (medium effort)
3. Consider WebSocket for real-time (future, high effort)

---

## Implementation Priorities

| Priority | Issue | Effort | Impact | Recommendation |
|----------|-------|--------|--------|----------------|
| P1 | Work loss on sandbox death | M | HIGH | Commit-per-feature |
| P2 | No preview URL | S | MEDIUM | Add URL to output |
| P3 | Progress communication | M | MEDIUM | Progress file |
| P4 | Single point of failure | L | LOW | Multi-sandbox (defer) |
| P5 | Label error | S | LOW | Add type:research label |

---

## Action Items

1. **Immediate** (before next initiative):
   - [ ] Add `type:research` label to repo OR update decomposition to use `type:feature`
   - [ ] Modify initiative.md Step 4.3.1 to auto-commit before review gate

2. **Short-term** (next iteration):
   - [ ] Add preview URL to `/sandbox/initiative-implement` JSON output
   - [ ] Create progress file mechanism in sandbox

3. **Long-term** (future consideration):
   - [ ] Design multi-sandbox architecture for large initiatives
   - [ ] Implement resume capability for interrupted initiatives

---

*Analysis generated by Claude Code orchestrator review*
