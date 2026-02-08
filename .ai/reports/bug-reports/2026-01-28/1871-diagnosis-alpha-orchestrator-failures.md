# Bug Diagnosis: Alpha Orchestrator S1864 Implementation Failures

**ID**: ISSUE-1871
**Created**: 2026-01-28T09:15:00.000Z
**Updated**: 2026-01-28
**Reporter**: user
**Severity**: high
**Status**: in_progress
**Type**: bug (process improvement)

## Summary

The Alpha Autonomous Coding workflow encountered two distinct issues during the S1864 (User Dashboard) implementation:
1. The review sandbox failed to start, displaying "No review sandbox available - could not start dev server"
2. The alpha-validation GitHub workflow failed consistently due to TypeScript compilation errors in the generated code

**This diagnosis focuses on PROCESS FAILURES in the Alpha workflow commands** that allowed these issues to occur, with recommendations for improving the workflow to prevent similar issues in the future.

## Environment

- **Application Version**: Current dev branch
- **Environment**: Development (E2B sandboxes + GitHub Actions)
- **Node Version**: 22
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown (new spec implementation)
- **Orchestrator Run ID**: run-mkx1vh2q-x1z1
- **Branch**: alpha/spec-S1864

## Root Cause Analysis

### Issue A: No Review Sandbox Available

**Summary**: The `setupReviewSandbox()` function returned null because `createReviewSandbox()` either timed out (15-minute limit) or threw an exception during sandbox provisioning.

**Root Cause**: Infrastructure/timeout issue in `.ai/alpha/scripts/lib/completion-phase.ts`

**Recommended Fix**:
1. Add detailed error logging/capture in `setupReviewSandbox()` to understand specific failure reasons
2. Add retry logic for transient E2B failures
3. Consider increasing the 15-minute timeout for large codebases

**No process change needed** - this is a runtime infrastructure issue, not a workflow gap.

---

### Issue B: TypeScript Errors in Generated Code - PROCESS FAILURE ANALYSIS

**Summary**: Tasks were marked "completed" despite TypeScript errors that would be caught by `pnpm typecheck`. This indicates gaps in the Alpha workflow validation process.

**TypeScript Errors Observed**:
```
activity.schema.ts(20,14): error TS2554: Expected 2-3 arguments, but got 1.
activity.schema.ts(31,14): error TS2554: Expected 2-3 arguments, but got 1.
activity-logger.ts(21,39): error TS2769: 'activity_logs' not valid table
course/_lib/server/server-actions.ts(13,29): error TS2307: Cannot find module
kanban/_lib/server/server-actions.ts(9,29): error TS2307: Cannot find module
page.tsx(115,8): error TS2741: Property 'data' missing
```

---

## Process Gap Analysis by Workflow Stage

### Gap 1: Feature Decomposition (`/alpha:feature-decompose`)

**Location**: `.claude/commands/alpha/feature-decompose.md`

**Current Behavior**: Features are decomposed with INVEST-V validation, but there's no explicit requirement for features involving database tables to include a mandatory "schema creation" feature that must precede features using that schema.

**Failure Pattern**: S1864.I3.F2 (Activity Data Aggregation) was decomposed to include tasks that USE the `activity_logs` table, but either:
- The task to CREATE the database schema was missing
- The schema creation task wasn't properly ordered as a prerequisite

**Recommendation**: Add a validation rule in feature-decompose.md:
```markdown
### Database Feature Prerequisites
When decomposing features that involve new database tables:
1. MUST include a "Schema Foundation" feature (or equivalent) as a PREDECESSOR
2. Schema features MUST be marked with `requires_database: true` at feature level
3. Feature dependency graph MUST show schema features blocking data-consuming features
```

---

### Gap 2: Task Decomposition (`/alpha:task-decompose`)

**Location**: `.claude/commands/alpha/task-decompose.md`

**Current Behavior**: The command documents database task handling (lines 375+) with `requires_database: true` flag and proper verification, but this wasn't enforced for S1864.I3.F2.

**Failure Pattern**: The Activity Data Aggregation tasks either:
1. Were missing `requires_database: true` flags
2. Had verification commands that didn't include `pnpm typecheck`
3. Had no task to generate the database migration before type-dependent tasks

**Evidence from task-decompose.md (lines 675-710)**:
```markdown
**Database Task Workflow**:
IF task.requires_database == true:
    1. Create/modify schema file
    2. Generate migration: pnpm --filter web supabase:db:diff
    3. Push to sandbox: pnpm exec supabase db push
    4. Generate types: pnpm supabase:web:typegen
    5. Verification MUST include: Type generation succeeded
```

This workflow exists but wasn't followed for S1864.I3.F2.

**Recommendation**: Add mandatory validation in task-decompose.md:
```markdown
### Database Task Validation (MANDATORY)
Before finalizing tasks.json for any feature that references database tables:

1. **Table Reference Check**: Search task outputs and context for table names
   - If any task references a table name, verify there's a `requires_database: true` task

2. **Type Dependency Chain**: For tasks importing from `database.types.ts`:
   - MUST have a preceding task with `requires_database: true`
   - That task MUST include type generation in verification_command

3. **Verification Command Validation**:
   - ALL tasks with code outputs MUST include `pnpm typecheck` in verification_command
   - Database tasks MUST verify types exist: `grep 'table_name' apps/web/lib/database.types.ts`
```

---

### Gap 3: Task Implementation (`/alpha:implement`)

**Location**: `.claude/commands/alpha/implement.md`

**Current Behavior**: Each task runs its `verification_command`, but:
- If the verification_command doesn't include `pnpm typecheck`, type errors pass
- There's no global typecheck before marking a feature complete
- Post-batch verification (line 627) only runs when parallel batches are used

**Failure Pattern**: Tasks were marked "completed" with this flow:
1. Task implements code
2. Task runs `verification_command` (likely just file existence check)
3. Verification passes (file exists)
4. Task marked complete
5. TypeScript errors only caught later by alpha-validation workflow

**Evidence from implement.md (lines 620-633)**:
```markdown
### Verification After Batch (Parallel Only)
After parallel batch completes:
    pnpm typecheck
    If typecheck fails: Fix type errors
```

This only runs for parallel batches, not for sequential execution.

**Recommendation**: Add mandatory typecheck in implement.md:

```markdown
### Mandatory Typecheck Verification (ALL TASKS)

After EVERY task completion (not just parallel batches):

1. **Task-Level Verification**:
   - Run verification_command from tasks.json
   - If task creates/modifies .ts/.tsx files: ALSO run `pnpm typecheck --filter [affected-packages]`

2. **Group-Level Verification** (before commit):
   - Run `pnpm typecheck` for full project
   - If typecheck fails: DO NOT commit, fix errors first
   - Only mark group complete when typecheck passes

3. **Feature-Level Verification** (before marking feature done):
   - Run `pnpm typecheck && pnpm lint`
   - Verify all module imports resolve
   - Verify no "Cannot find module" errors
```

---

### Gap 4: Cross-Feature Type Dependencies

**Location**: Not currently addressed in any workflow command

**Current Behavior**: Features are implemented in parallel batches across sandboxes. Feature A might create types that Feature B needs, but there's no coordination.

**Failure Pattern**:
- S1864.I3.F2 should have created `activity_logs` table and generated types
- S1864.I3.F3 used those types (ActivityFeedWidget with `data` prop)
- The type generation in F2 never happened, breaking F3

**Recommendation**: Add cross-feature type validation:

```markdown
### Cross-Feature Type Coordination

For features with database tasks that generate types:

1. **Mark as Type Provider**: Features creating database schemas should have:
   ```json
   {
     "provides_types": ["activity_logs", "user_activities"],
     "type_generation_task": "T3"
   }
   ```

2. **Mark as Type Consumer**: Features using those types should have:
   ```json
   {
     "requires_types_from": ["S1864.I3.F2"],
     "type_validation": "grep 'activity_logs' apps/web/lib/database.types.ts"
   }
   ```

3. **Orchestrator Validation**: Before starting a type-consuming feature:
   - Verify type-providing feature is complete
   - Verify type generation succeeded (run the grep check)
```

---

## Summary of Process Gaps

| Gap | Location | Current State | Impact | Fix Priority |
|-----|----------|---------------|--------|--------------|
| Missing schema prerequisite | feature-decompose.md | No enforcement | Database references break | High |
| Missing `requires_database` flag | task-decompose.md | Optional, not enforced | No migration created | High |
| No mandatory typecheck | implement.md | Only post-parallel-batch | Type errors pass | Critical |
| No global typecheck before commit | implement.md | Missing | Broken code committed | Critical |
| No cross-feature type validation | N/A | Not addressed | Cascading failures | Medium |

---

## Recommended Fix Sequence

### Phase 1: Critical Fixes (Immediate)

1. **Update `/alpha:implement`** to add mandatory typecheck:
   - After every task that modifies .ts/.tsx files
   - Before every git commit
   - Block completion if typecheck fails

2. **Update `/alpha:task-decompose`** to validate:
   - All database-referencing tasks have `requires_database: true`
   - All verification_commands include `pnpm typecheck`

### Phase 2: Structural Improvements

3. **Update `/alpha:feature-decompose`** to enforce:
   - Schema features as mandatory predecessors for data features
   - Feature-level `requires_database` flag when any task has it

4. **Add type-dependency tracking** to orchestrator:
   - Track which features provide types
   - Validate type providers complete before consumers start

### Phase 3: Validation Enhancements

5. **Add pre-commit validation script**:
   - Run `pnpm typecheck`
   - Run `pnpm lint`
   - Verify all imports resolve
   - Block commit on failure

6. **Add feature completion validation**:
   - Global typecheck for all modified packages
   - Integration test smoke check
   - Visual regression check (if UI changes)

---

## Affected Workflow Files

| File | Changes Needed |
|------|----------------|
| `.claude/commands/alpha/feature-decompose.md` | Add database prerequisite validation |
| `.claude/commands/alpha/task-decompose.md` | Add mandatory `requires_database` enforcement |
| `.claude/commands/alpha/implement.md` | Add mandatory typecheck at task/group/feature levels |
| `.ai/alpha/scripts/spec-orchestrator.ts` | Add type-dependency tracking |
| `.ai/alpha/scripts/lib/completion-phase.ts` | Keep: Add error logging to setupReviewSandbox() |

---

## Validation Checklist for Future Runs

Before running `/alpha:spec-orchestrator`:

- [ ] All features with database tasks have schema-creating features as prerequisites
- [ ] All tasks with database references have `requires_database: true`
- [ ] All verification_commands include `pnpm typecheck`
- [ ] Database tasks include type generation verification
- [ ] Cross-feature type dependencies are documented

---

## Immediate Next Steps

1. **Create bug-plan issue** for implementing the mandatory typecheck fix in implement.md
2. **Create bug-plan issue** for implementing the database task validation in task-decompose.md
3. **Fix S1864 branch**: Either create the `activity_logs` migration or remove references to it

---

*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, Grep, Read, Glob, Bash*
*Focus: Process failure analysis in Alpha workflow commands*
