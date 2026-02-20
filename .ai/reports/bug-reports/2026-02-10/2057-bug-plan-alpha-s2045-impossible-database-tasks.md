# Bug Fix Plan: Alpha orchestrator task decomposition creates impossible database tasks

**ID**: ISSUE-2057
**Title**: Alpha orchestrator stalls on S2045 — impossible database tasks cause deadlock
**Created**: 2026-02-10T21:00:00Z
**Status**: planning
**Type**: bug-fix plan
**Related Diagnosis**: #2057-diagnosis-alpha-s2045-sandbox-stall-deadlock.md

---

## Problem Summary

Feature S2045.I1.F2 (Activity Events Database) contains tasks T5 and T6 with verification commands that require a **local Docker-based Supabase instance** (`supabase migration up`, `psql 127.0.0.1:54322`), which is **impossible in E2B sandboxes**. This causes the feature to fail repeatedly, wasting ~60 minutes on 4 retry attempts before reaching permanent failure. Since 12 of 14 downstream features depend on this feature, the entire spec deadlocks at 13% completion.

**Impact**:
- S2045 spec execution blocked indefinitely (2/14 features complete, 13/99 tasks completed)
- ~60 minutes wasted on deterministic retries of impossible tasks
- 2 out of 3 sandboxes occupied with failed retry cycles while sbx-c remains idle
- Demonstrates architectural vulnerability that will recur for any database-heavy specs

---

## Solution Analysis

### Option 1: Re-decompose S2045.I1.F2 with Remote Database Commands (RECOMMENDED)

**Description**: Modify tasks T5 and T6 to use remote Supabase sandbox project commands instead of local Docker commands.

**Implementation Steps**:

1. **Update T5 Verification Command**:
   - **Current**: `pnpm --filter web supabase migration up && psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'`
   - **New**: Use remote Supabase via environment variable:
     ```bash
     # Apply migration to remote sandbox project
     supabase db push --linked

     # Verify migration applied
     psql "$SUPABASE_SANDBOX_DB_URL" -c "SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE 'activity_event_%';"
     ```

2. **Update T6 Verification Command**:
   - **Current**: `pnpm supabase:web:typegen` (requires local Docker)
   - **New**: Run against remote database using environment variable:
     ```bash
     # Set SUPABASE_URL and SUPABASE_ANON_KEY for remote sandbox
     pnpm supabase:web:typegen
     ```
   - **Alternative**: Remove T6 entirely since orchestrator's post-feature `syncFeatureMigrations()` already generates types

3. **Verify Task Dependencies**:
   - Ensure T5 and T6 have correct `blockedBy` dependencies on earlier schema/migration tasks
   - Add environment variable injection in orchestrator to pass `SUPABASE_SANDBOX_DB_URL` to E2B sandboxes

**Advantages**:
- ✅ Minimal orchestrator changes required
- ✅ Leverages existing remote Supabase sandbox project (already configured)
- ✅ Follows established seeding pattern documented in alpha-implementation-system.md
- ✅ Allows S2045.I1.F2 to complete, unblocking all downstream features
- ✅ Reusable pattern for other database-heavy specs

**Disadvantages**:
- ⚠️ Requires re-running task decomposition for S2045.I1.F2
- ⚠️ Temporary: doesn't prevent similar issues in future specs
- ⚠️ Depends on environment variable availability in E2B sandboxes

**Estimated Effort**: 1-2 hours (re-decompose tasks, test, re-run orchestrator)

---

### Option 2: Remove T5 and T6 Entirely (QUICKEST)

**Description**: Delete tasks T5 (Apply migration to local database) and T6 (Generate TypeScript types) from S2045.I1.F2 since the orchestrator already handles these post-feature.

**Implementation Steps**:

1. **Edit tasks.json for S2045.I1.F2**:
   - Remove T5 and T6 from tasks array
   - Update `tasks_total` from 6 to 4
   - Remove task group entries for these tasks

2. **Verify Dependencies**:
   - Confirm no downstream tasks depend on T5/T6 completion
   - Check if any features have `blockedBy: [T5, T6]` (there shouldn't be any)

3. **Rely on Post-Feature Migration Sync**:
   - The orchestrator already calls `syncFeatureMigrations()` after feature completion
   - This automatically applies migrations to remote Supabase sandbox project
   - This automatically generates TypeScript types via `pnpm supabase:web:typegen`

**Advantages**:
- ✅ Quickest fix (< 30 minutes)
- ✅ No orchestrator changes needed
- ✅ Immediate unblock of S2045.I1.F2 and downstream features
- ✅ Removes duplicate/redundant verification steps

**Disadvantages**:
- ⚠️ Removes explicit task-level verification (less comprehensive task decomposition)
- ⚠️ Relies entirely on post-feature orchestrator logic (centralized, less transparent)
- ⚠️ Task decomposition will repeat similar issue if not addressed systematically

**Estimated Effort**: 30 minutes (edit tasks.json, re-run orchestrator)

---

### Option 3: Add Task Decomposer Guardrail (LONG-TERM)

**Description**: Add validation in the `/alpha:task-decompose` command to detect and reject verification commands that reference local infrastructure (`127.0.0.1`, `localhost`, Docker socket), and automatically suggest/replace with remote equivalents.

**Implementation Steps**:

1. **Add Validation Checks** in task decomposer:
   ```typescript
   function validateVerificationCommand(cmd: string): ValidationResult {
     const localPatterns = [
       /127\.0\.0\.1/,
       /localhost/,
       /\/var\/run\/docker\.sock/,
       /supabase migration up/,  // Requires local Docker
       /supabase start/,
     ];

     for (const pattern of localPatterns) {
       if (pattern.test(cmd)) {
         return {
           valid: false,
           error: `Verification command references local infrastructure (${pattern})`,
           suggestion: `Use remote Supabase via SUPABASE_SANDBOX_DB_URL instead`
         };
       }
     }
     return { valid: true };
   }
   ```

2. **Auto-Replace with Remote Equivalents**:
   - `supabase migration up` → `supabase db push --linked`
   - `psql 'postgresql://localhost/db'` → `psql "$SUPABASE_SANDBOX_DB_URL"`
   - `supabase start` → Use `SUPABASE_URL` environment variable

3. **Add Verification Instructions**:
   - Document that E2B sandboxes don't have Docker
   - Provide examples of correct remote database verification patterns
   - Reference existing seeding patterns in alpha-implementation-system.md

**Advantages**:
- ✅ Prevents recurrence in future specs (S2046+)
- ✅ Educational: guides task decomposer on correct E2B patterns
- ✅ Catches issues at decomposition time, not execution time
- ✅ Applies to all future specs, not just S2045

**Disadvantages**:
- ⚠️ Doesn't fix S2045 immediately (still need Option 1 or 2)
- ⚠️ Requires changes to `/alpha:task-decompose` implementation
- ⚠️ Pattern matching may miss edge cases

**Estimated Effort**: 2-3 hours (add validation, test, document)

---

## Recommended Approach: Hybrid Solution

**Phase 1 (Immediate)**: Use **Option 2** (Remove T5/T6)
- **Why**: Quickest path to unblock S2045 (30 min)
- **Action**: Edit tasks.json, re-run orchestrator

**Phase 2 (Follow-up)**: Use **Option 1** (Re-decompose with Remote Commands)
- **Why**: Proper long-term fix for this and similar features
- **Action**: Update verification commands, re-run decomposition for S2045.I1.F2 and F3+
- **Timeline**: Same day after Phase 1 completes

**Phase 3 (Prevention)**: Implement **Option 3** (Add Guardrail)
- **Why**: Prevent recurrence in S2046+ specs
- **Action**: Add validation to `/alpha:task-decompose`
- **Timeline**: Before next multi-initiative spec run

---

## Implementation Details

### Phase 1 Implementation (Remove T5/T6)

**File to Edit**: `.ai/alpha/specs/S2045-Spec-user-dashboard/S2045.I1-Initiative-foundation-data-layer/S2045.I1.F2-Feature-activity-events-database/tasks.json`

**Changes**:
1. Remove task objects for T5 and T6
2. Update group 2 (`Migration and Type Generation`) to have `tasks_total: 1` (only T4 remains)
3. Or delete group 2 entirely if T4 moves to another group
4. Update any comments referencing these tasks

**Verification**:
- Run `pnpm typecheck` to ensure no type references to missing tasks
- Verify spec-manifest.json still valid JSON

**Re-run Command**:
```bash
tsx spec-orchestrator.ts 2045 --provider gpt
```

**Expected Outcome**:
- S2045.I1.F2 should complete with 4/4 tasks ✓
- S2045.I1.F3 (Dashboard Data Loader) should unblock and begin execution
- All downstream features should progressively execute
- sbx-c should leave idle state and begin working

---

### Phase 2 Implementation (Remote Commands)

**Files to Edit**:
1. `.ai/alpha/specs/S2045-Spec-user-dashboard/S2045.I1-Initiative-foundation-data-layer/S2045.I1.F2-Feature-activity-events-database/tasks.json` — Re-add T5/T6 with corrected commands
2. `.ai/alpha/scripts/lib/feature.ts` — Environment variable injection (if needed)

**New T5 Task**:
```json
{
  "id": "S2045.I1.F2.T5",
  "name": "Apply migration to remote Supabase sandbox",
  "description": "Apply the activity events migration to the remote Supabase sandbox project using db push",
  "action_commands": [
    "supabase db push --linked"
  ],
  "verification_commands": [
    "psql \"$SUPABASE_SANDBOX_DB_URL\" -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'activity_events';\""
  ],
  "requires_database": true,
  "blockedBy": ["S2045.I1.F2.T4"]
}
```

**New T6 Task** (or remove entirely):
```json
{
  "id": "S2045.I1.F2.T6",
  "name": "Generate TypeScript types from remote database",
  "description": "Generate TypeScript type definitions from the remote Supabase database schema",
  "action_commands": [
    "SUPABASE_URL=\"$SUPABASE_SANDBOX_URL\" pnpm supabase:web:typegen"
  ],
  "verification_commands": [
    "grep -q 'export type Tables' apps/web/lib/database.types.ts"
  ],
  "requires_database": true,
  "blockedBy": ["S2045.I1.F2.T5"]
}
```

---

### Phase 3 Implementation (Add Guardrail)

**File to Create/Edit**: `.ai/alpha/scripts/lib/task-validator.ts`

**Core Validation Function**:
```typescript
export interface TaskValidationError {
  field: string;
  error: string;
  suggestion?: string;
}

export function validateTaskCommands(task: Task): TaskValidationError[] {
  const errors: TaskValidationError[] = [];

  const localInfraPatterns = [
    { pattern: /127\.0\.0\.1/, reason: 'local IP address' },
    { pattern: /localhost/, reason: 'localhost reference' },
    { pattern: /\/var\/run\/docker\.sock/, reason: 'Docker socket' },
    { pattern: /supabase migration up/, reason: 'requires local Docker' },
    { pattern: /supabase start/, reason: 'requires local Docker' },
  ];

  // Check action_commands
  for (const cmd of task.action_commands || []) {
    for (const { pattern, reason } of localInfraPatterns) {
      if (pattern.test(cmd)) {
        errors.push({
          field: 'action_commands',
          error: `Contains local infrastructure reference: ${reason}`,
          suggestion: `E2B sandboxes don't have Docker. Use remote Supabase commands with SUPABASE_SANDBOX_DB_URL`
        });
      }
    }
  }

  // Check verification_commands
  for (const cmd of task.verification_commands || []) {
    for (const { pattern, reason } of localInfraPatterns) {
      if (pattern.test(cmd)) {
        errors.push({
          field: 'verification_commands',
          error: `Contains local infrastructure reference: ${reason}`,
          suggestion: `Replace with: psql "$SUPABASE_SANDBOX_DB_URL" -c "..."`
        });
      }
    }
  }

  return errors;
}
```

**Integration Point**: Call in `/alpha:task-decompose` command before finalizing tasks.json

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Phase 1 breaks downstream tasks | Low | High | Verify spec-manifest.json valid, check for T5/T6 dependencies |
| Environment variable missing in E2B | Medium | High (Phase 2) | Test in E2B sandbox before running full spec |
| Guardrail validation too strict | Medium | Medium | Allow whitelist exceptions in config |
| Similar issue in S2046+ | High | High | Implement Phase 3 before next multi-initiative spec |

---

## Testing Strategy

### Phase 1 Testing (Remove T5/T6)

1. **Unit Test**:
   - Verify tasks.json is valid JSON
   - Verify no orphaned task references

2. **Integration Test**:
   - Run orchestrator on S2045: `tsx spec-orchestrator.ts 2045 --provider gpt`
   - Monitor progress until S2045.I1.F2 completes
   - Verify downstream features unblock and begin execution
   - Check sbx-c transitions from "idle" to "executing"

3. **Success Criteria**:
   - S2045.I1.F2 completes with 4/4 tasks ✓
   - No "Waiting for dependencies" messages for S2045.I1.F3
   - sbx-c context usage > 0
   - Run completes successfully or reaches timeout (not deadlock)

---

### Phase 2 Testing (Remote Commands)

1. **Unit Test**:
   - Verify updated tasks.json is valid
   - Verify SUPABASE_SANDBOX_DB_URL environment variable handling
   - Test verification command string interpolation

2. **Manual Test**:
   - Create local test with mocked Supabase sandbox
   - Run T5 verification command against test database
   - Verify `psql "$SUPABASE_SANDBOX_DB_URL"` can connect and execute

3. **Integration Test**:
   - Re-decompose S2045.I1.F2 with remote commands
   - Run orchestrator: `tsx spec-orchestrator.ts 2045 --provider gpt`
   - Verify T5 and T6 complete successfully
   - Verify TypeScript types generated correctly

4. **Success Criteria**:
   - T5 and T6 execute and complete
   - Verification commands pass without local Docker requirement
   - TypeScript types exist in `apps/web/lib/database.types.ts`

---

### Phase 3 Testing (Guardrail)

1. **Unit Test**:
   - Test validator against sample tasks with local references
   - Verify error messages are clear
   - Verify whitelist exceptions work

2. **Integration Test**:
   - Run task decomposer on S2045.I1.F2
   - Verify guardrail flags local infrastructure references
   - Verify suggestions are provided

3. **Regression Test**:
   - Run task decomposer on S1918 features
   - Run task decomposer on new features with remote-only commands
   - Verify no false positives

4. **Success Criteria**:
   - All features with database tasks use remote commands
   - Guardrail catches local infrastructure references
   - Suggestions are actionable and helpful

---

## Timeline & Milestones

| Phase | Task | Est. Time | Owner | Success Criteria |
|-------|------|-----------|-------|-----------------|
| 1 | Remove T5/T6 from S2045.I1.F2 | 15 min | Implementor | tasks.json valid, JSON parses |
| 1 | Re-run orchestrator on S2045 | 45-60 min | CI | S2045.I1.F2 completes, no deadlock |
| 1 | Verify downstream unblock | 30 min | Observer | S2045.I1.F3 begins execution |
| 2 | Update T5/T6 verification commands | 30 min | Implementor | Commands use $SUPABASE_SANDBOX_DB_URL |
| 2 | Re-decompose S2045.I1.F2 | 30 min | Decomposer | tasks.json updated with remote commands |
| 2 | Re-run orchestrator on S2045 | 45-60 min | CI | T5/T6 complete, types generated |
| 3 | Implement guardrail validation | 90 min | Implementor | Validation catches local references |
| 3 | Integrate into task-decompose | 30 min | Implementor | Guardrail runs before finalizing tasks |
| 3 | Document E2B patterns | 30 min | Documenter | Examples of correct remote commands |

**Total Estimated Effort**: 5-7 hours across 3 phases

---

## Success Metrics

✅ **Immediate Success** (Phase 1 + 2):
- S2045 executes without deadlock
- All 14 features attempt to execute (may fail for other reasons, but not blocked)
- Orchestrator reaches natural completion or timeout, not deadlock

✅ **Long-Term Success** (Phase 3):
- S2046+ specs with database features don't encounter same issue
- Task decomposer validation prevents local infrastructure references
- New database features use remote Supabase sandbox patterns

---

## Rollback Plan

**Phase 1 Rollback** (if unblocking causes new issues):
- Restore original tasks.json with T5/T6 from git
- Re-run orchestrator

**Phase 2 Rollback** (if remote commands fail):
- Option A: Revert to Phase 1 state (remove T5/T6)
- Option B: Investigate environment variable issues in E2B sandbox
- Option C: Use Option 1 approach with different command syntax

**Phase 3 Rollback** (if guardrail too strict):
- Disable guardrail validation
- Review false positives and add whitelist exceptions
- Re-enable with refined rules

---

## Related Issues & Context

- **Diagnosis**: #2057-diagnosis-alpha-s2045-sandbox-stall-deadlock.md
- **Previous Deadlock**: S1918 (33% completion, similar dependency bottleneck)
- **Related Fixes**: #2056 (stall recovery improvements), #2054 (progress updates)
- **Architecture Docs**: `.ai/alpha/docs/alpha-implementation-system.md`
- **Task Decomposer**: `.ai/alpha/scripts/lib/spec-decomposer.ts`

---

## Sign-Off

This bug fix plan recommends a three-phase approach:
1. **Phase 1** - Immediate unblock by removing impossible tasks (30 min)
2. **Phase 2** - Proper fix by using remote database commands (2 hours)
3. **Phase 3** - Prevention by adding task decomposer guardrails (2-3 hours)

**Recommendation**: Execute Phase 1 immediately to unblock S2045, then proceed with Phase 2 same-day, and Phase 3 before next multi-initiative spec run.

**Next Steps**:
1. Approve this plan
2. Execute Phase 1 (remove T5/T6)
3. Re-run orchestrator on S2045
4. Proceed with Phase 2 based on Phase 1 results

---

*Generated by Claude Debug Assistant*
*Based on Diagnosis Report #2057*
*Date: 2026-02-10*
