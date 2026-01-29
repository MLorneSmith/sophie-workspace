# Bug Fix Plan: Alpha Workflow Process Failures (Issue #1871)

**ID**: 1871-BUG-PLAN-ALPHA-WORKFLOW-TYPECHECK
**Created**: 2026-01-28
**Issue**: #1871
**Severity**: High
**Complexity**: Medium
**Risk Level**: Medium
**Estimated Hours**: 8-12
**Status**: Pending Implementation

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Problem** | TypeScript compilation errors bypass Alpha workflow validation, allowing broken code to be committed |
| **Root Cause** | Missing mandatory typecheck verification at task, group, and feature levels in `/alpha:implement` |
| **Impact** | Features fail downstream validation; database references break; type dependencies are unverified |
| **Solution** | Add three-tier validation: task-level typecheck, group-level typecheck, feature-level typecheck |
| **Files to Modify** | `.claude/commands/alpha/implement.md`, `.claude/commands/alpha/task-decompose.md`, `.claude/commands/alpha/feature-decompose.md` |
| **Testing** | Re-run S1864 implementation with fixes; verify no TypeScript errors in final code |

---

## Problem Recap

### What Happened

During the S1864 (User Dashboard) Alpha implementation, tasks were marked as "completed" despite containing TypeScript errors that would fail the `pnpm typecheck` command:

```
activity.schema.ts(20,14): error TS2554: Expected 2-3 arguments, but got 1
activity.schema.ts(31,14): error TS2554: Expected 2-3 arguments, but got 1
activity-logger.ts(21,39): error TS2769: 'activity_logs' not valid table
course/_lib/server/server-actions.ts(13,29): error TS2307: Cannot find module
kanban/_lib/server/server-actions.ts(9,29): error TS2307: Cannot find module
page.tsx(115,8): error TS2741: Property 'data' missing
```

### Why It Happened

**Gap 1: No Task-Level Typecheck**
- The `/alpha:implement` command runs each task's `verification_command` but doesn't validate TypeScript
- Verification commands (e.g., file existence checks) pass even if the code has type errors
- No `pnpm typecheck --filter [package]` requirement for tasks that create/modify `.ts`/`.tsx` files

**Gap 2: No Group-Level Typecheck**
- After parallel execution batches complete, only some batches run `pnpm typecheck` (lines 620-633)
- Sequential task execution has no post-group validation
- Broken code is committed without validation

**Gap 3: No Feature-Level Typecheck**
- No global typecheck before marking a feature "complete"
- No verification that all imports resolve
- Database types not verified to exist before features using them complete

**Gap 4: No Database Task Enforcement**
- `/alpha:task-decompose` documents `requires_database: true` flag (lines 675-710) but doesn't enforce it
- Features that reference database tables may have no schema creation task
- Type generation step may be skipped

**Gap 5: No Schema Prerequisite Validation**
- `/alpha:feature-decompose` doesn't require schema features to precede data-consuming features
- Features decomposed without ensuring database foundations are in place

---

## Solution Approaches

### Option A: Minimal Fix (Quick, Less Comprehensive)

**Approach**: Add mandatory typecheck only at critical validation points

**Implementation**:
1. Add `pnpm typecheck --filter [affected-package]` to every task's verification step
2. Add global `pnpm typecheck` before feature completion
3. Don't change task decomposition validation

**Pros**:
- Fastest to implement (2-3 hours)
- Minimal changes to workflow commands
- Catches TypeScript errors immediately

**Cons**:
- Doesn't prevent database task issues (missing migrations)
- Schema features still not enforced as prerequisites
- Cross-feature type dependencies still unverified
- May fail features late (after hours of implementation)

---

### Option B: Comprehensive Fix (Recommended)

**Approach**: Three-tier validation + database task enforcement + schema prerequisites

**Implementation**:
1. **Add mandatory typecheck** at task, group, and feature levels in `/alpha:implement`
2. **Enforce database task flags** in `/alpha:task-decompose` with validation
3. **Require schema prerequisites** in `/alpha:feature-decompose` for database features
4. **Validate type dependencies** across features

**Pros**:
- Catches all classes of errors (type, database, schema, dependencies)
- Prevents features from even starting if prerequisites are missing
- Gives early feedback (before implementation begins)
- Ensures database types exist before features use them
- More robust long-term

**Cons**:
- More implementation work (8-12 hours total)
- Requires changes to three workflow commands
- Takes longer to validate upfront

---

## Selected Solution: Option B (Comprehensive)

**Rationale**:
- Option A only masks the symptom at the end
- Database task gaps will continue to cause failures silently
- Schema prerequisite issues will cause cascading feature failures
- Given the Alpha workflow complexity, comprehensive validation prevents recurring issues
- The 4-8 hour additional time investment saves many debug cycles

---

## Implementation Plan

### Phase 1: Mandatory Typecheck in `/alpha:implement` (3 hours)

**File**: `.claude/commands/alpha/implement.md`

#### Task 1.1: Add Task-Level Typecheck Validation

After the `verification_command` runs for any task, add a conditional typecheck:

**Location**: In the "Execute Single Task" section (around line 350+)

**Changes**:
```markdown
### Task Execution & Verification

After running the task implementation:

1. **Run Verification Command**:
   - Execute the `verification_command` from tasks.json
   - If verification fails: Fix and retry (max 3 attempts)

2. **Conditional Typecheck** (NEW):
   - IF task contains modified/created .ts or .tsx files:
     - Determine affected package(s): `grep -r "path/to/file" apps/web/package.json packages/*/package.json`
     - Run: `pnpm typecheck --filter [affected-packages]`
     - IF typecheck fails:
       * Log ALL errors to console
       * DO NOT proceed to next task
       * Fix type errors in implementation
       * Re-run typecheck to validate fix
       * Only mark task complete when typecheck passes

   - IF task only modifies non-TS files (docs, config, etc.):
     - Typecheck not required, proceed normally
```

**Validation Logic to Add**:
- Track which files task modified (from git diff or task output)
- Filter to `.ts` and `.tsx` files only
- Extract package name from file path (e.g., `apps/web/` → `web`, `packages/ui/` → `@kit/ui`)
- Run typecheck for affected package only (faster than full check)

---

#### Task 1.2: Add Group-Level Typecheck Before Commit

**Location**: In the "Commit Task Group" section (around line 600+)

**Current behavior** (lines 620-633):
```markdown
### Verification After Batch (Parallel Only)
After parallel batch completes:
    pnpm typecheck
    If typecheck fails: Fix type errors
```

**Changes**:
```markdown
### Group-Level Verification (MANDATORY - Before Commit)

Before committing task group completion:

1. **Run Global Typecheck**:
   - Execute: `pnpm typecheck`
   - This validates all packages (not just affected ones)
   - Catches cross-package type errors

2. **Fix Errors** (if needed):
   - If typecheck fails: FIX before committing
   - Re-run typecheck to confirm fix
   - Log all fixes to progress file

3. **Conditional Lint Check**:
   - Run: `pnpm lint --filter [affected-packages]`
   - If lint fails: Consider auto-fix with `pnpm lint:fix`

4. **Commit Only When Clean**:
   - Only proceed to git commit when:
     * verification_commands all passed
     * pnpm typecheck succeeded
     * pnpm lint passed (warnings OK, errors not OK)
   - If validation fails: DO NOT commit, fix errors first

**Applies to BOTH parallel and sequential execution**
```

---

#### Task 1.3: Add Feature-Level Validation Before Completion

**Location**: In the "Complete Feature" section (around line 700+)

**New section to add**:
```markdown
### Feature-Level Validation (Before Marking Feature Complete)

Before reporting feature as complete:

1. **Full Typecheck**:
   - Run: `pnpm typecheck`
   - Verify: Zero TypeScript errors across all packages
   - Log result with timestamp

2. **Lint Validation**:
   - Run: `pnpm lint`
   - Warnings are acceptable
   - Errors MUST be fixed

3. **Database Type Verification** (if feature uses databases):
   - For any task with `requires_database: true`:
     * Extract table names from task context
     * Verify types exist: `grep '[table_name]' apps/web/lib/database.types.ts`
     * If types missing: Regenerate with `pnpm supabase:web:typegen`
     * Verify types re-appear after generation

4. **Module Import Verification**:
   - Run: `pnpm typecheck 2>&1 | grep "Cannot find module"`
   - Count of these errors must be zero
   - If any "Cannot find module": Fix imports before feature completion

5. **Report Summary**:
   - Log all validation results to `.initiative-progress.json`
   - Include:
     * Typecheck: PASS|FAIL (error count if fail)
     * Lint: PASS|FAIL (warning/error counts)
     * Database types: VERIFIED (table count)
     * Imports: RESOLVED (module count)

**IF any validation fails**: DO NOT complete feature, fix issues first
```

---

### Phase 2: Database Task Enforcement in `/alpha:task-decompose` (2.5 hours)

**File**: `.claude/commands/alpha/task-decompose.md`

#### Task 2.1: Add Database Task Validation Section

**Location**: Create new "Validation: Database Tasks" section after the decomposition logic (around line 300+)

**Existing documentation** (lines 675-710):
```markdown
**Database Task Workflow**:
IF task.requires_database == true:
    1. Create/modify schema file
    2. Generate migration: pnpm --filter web supabase:db:diff
    3. Push to sandbox: pnpm exec supabase db push
    4. Generate types: pnpm supabase:web:typegen
    5. Verification MUST include: Type generation succeeded
```

**Changes** - Add new validation section:
```markdown
### Mandatory Database Task Validation

Before finalizing tasks.json for any feature, validate database consistency:

#### Step 1: Detect Database References

Search task outputs and context for table names:
```bash
grep -r "table\|schema\|migration\|database\|activity_logs\|user_activities" \
  tasks.json feature-plan.md implementation-notes.md 2>/dev/null
```

Capture any table name references (e.g., `activity_logs`, `user_activities`)

#### Step 2: Verify `requires_database: true` Tasks Exist

For each detected table name:
- MUST have a corresponding task with `requires_database: true`
- That task MUST include:
  ```json
  {
    "requires_database": true,
    "verification_command": "pnpm supabase:web:typegen && grep 'activity_logs' apps/web/lib/database.types.ts"
  }
  ```

#### Step 3: Validate Verification Commands

For ALL tasks with `requires_database: true`:
- `verification_command` MUST include both:
  1. `pnpm --filter web supabase migration up` (apply migrations)
  2. `pnpm supabase:web:typegen` (generate types)
  3. `grep '[table_name]' apps/web/lib/database.types.ts` (verify existence)

Example:
```json
{
  "verification_command": "pnpm --filter web supabase migration up && pnpm supabase:web:typegen && grep 'activity_logs' apps/web/lib/database.types.ts"
}
```

#### Step 4: Enforce for Type-Dependent Tasks

For any task that imports from `database.types.ts`:
- MUST have a `blockedBy` dependency
- That dependency must be a `requires_database: true` task
- Cannot execute until types are generated

Example:
```json
{
  "id": "S1864.I3.F2.T2",
  "name": "Implement Activity Logger",
  "blockedBy": ["S1864.I3.F2.T1"],  // T1 creates schema, generates types
  "imports_from_types": "activity_logs"
}
```

#### Step 5: Validate Imports Match Types

For any task importing types:
```bash
grep -r "import.*from.*database.types" tasks.json
# Extract: activity_logs, user_activities, etc.
# Verify each appears in database.types.ts validation step
```

#### Validation Failure Handling

If validation fails (missing tasks, broken dependencies):
- DO NOT create tasks.json
- Return validation errors to orchestrator
- Require manual fixes before proceeding
- Document specific issues in the error report
```

---

#### Task 2.2: Update Task Decomposer Agent Instructions

**Location**: Instruction text that task decomposer receives (around line 200+)

**Add to decomposer prompt**:
```markdown
### CRITICAL: Database Tasks

IF the feature involves creating or using database tables:

1. **MUST have a schema creation task** (requires_database: true)
   - Create/modify schema file
   - Generate migration
   - Push migration to sandbox
   - Generate TypeScript types

2. **Table references in other tasks MUST be in blockedBy**
   - Feature F2 uses table X
   - Feature F3 uses results from F2
   - F3 cannot start until F2's type generation completes

3. **All verification_commands for database tasks MUST include**:
   - `pnpm --filter web supabase migration up`
   - `pnpm supabase:web:typegen`
   - Grep verification that types exist

4. **Fail the entire decomposition** if:
   - Table references with no creates_database task
   - Tasks import from database.types.ts without blockedBy
   - Verification commands don't include type generation
```

---

### Phase 3: Schema Prerequisite Enforcement in `/alpha:feature-decompose` (2.5 hours)

**File**: `.claude/commands/alpha/feature-decompose.md`

#### Task 3.1: Add Database Feature Prerequisites Section

**Location**: Create new section after INVEST-V criteria (around line 60+)

**New section**:
```markdown
### Database Feature Prerequisites

When decomposing features that involve new database tables:

#### Prerequisite: Schema Feature MUST Exist

For each new table referenced in the initiative:
1. Create a "Schema Foundation" feature (or equivalent)
2. This feature MUST:
   - Create the schema file(s)
   - Generate the database migration
   - Include type generation task
   - Have `requires_database: true` flag at feature level
3. This feature MUST be ordered BEFORE any feature using that table

#### Example: Correct Decomposition

```
Initiative S1864.I3 (Activity Aggregation):

F1: Schema Foundation - Activity Tables
    - Tasks: Create schema, migration, types
    - requires_database: true
    - blockedBy: [] (no dependencies)

F2: Activity Data Aggregation (uses activity_logs table)
    - blockedBy: [S1864.I3.F1]
    - Cannot start until F1 types are generated

F3: Activity Feed Widget (uses activity data from F2)
    - blockedBy: [S1864.I3.F2]
    - Cannot start until F2's types and data structures exist
```

#### Validation During Decomposition

Before finalizing feature list, check:

1. **Table Reference Detection**:
   ```bash
   grep -r "CREATE TABLE\|activity_logs\|user_activities" feature-plan.md
   ```

2. **Schema Feature Check**:
   - For each table found, verify it has a schema feature
   - Schema features MUST come before data features
   - Schema features MUST be named consistently (e.g., "Schema Foundation", "Database Setup")

3. **Feature Ordering**:
   - Feature dependency graph must show:
     * Schema features with no dependencies
     * Data features blocking consumption features
   - No cycles
   - Correct topological order

#### Feature-Level `requires_database` Flag

For features with schema creation tasks:
```json
{
  "id": "S1864.I3.F1",
  "name": "Schema Foundation - Activity Tables",
  "requires_database": true,
  "provides_types": ["activity_logs", "user_activities"],
  "blocks": ["S1864.I3.F2"]
}
```

For features consuming those types:
```json
{
  "id": "S1864.I3.F2",
  "name": "Activity Data Aggregation",
  "requires_types_from": ["S1864.I3.F1"],
  "blockedBy": ["S1864.I3.F1"]
}
```
```

---

#### Task 3.2: Update Feature Decomposer Instructions

**Location**: Agent instructions (around line 150+)

**Add to decomposer guidance**:
```markdown
### Database-First Decomposition

If the initiative creates new database tables:

1. **Create schema feature FIRST**
   - Must be F1 or explicitly ordered first
   - Include all migration and type generation steps
   - Mark as `requires_database: true`

2. **Block data features on schema feature**
   - Any feature using those tables must have:
     ```json
     "blockedBy": ["S1864.I3.F1"],
     "requires_types_from": ["S1864.I3.F1"]
     ```

3. **Document table names in feature metadata**
   - Makes validation easier for downstream steps
   - Prevents feature decomposition gaps

4. **Fail decomposition if**:
   - Table references found without schema feature
   - Features using tables don't block on schema feature
   - Blocking relationships create cycles
```

---

### Phase 4: Integration & Documentation (1.5 hours)

#### Task 4.1: Update Implementation Sequence Documentation

**Location**: `.claude/commands/alpha/implement.md` - Phase 1 section

**Add to "Load Context" section**:
```markdown
### Validation Setup

Before starting task execution:

1. **Log Typecheck Baseline**:
   - Run: `pnpm typecheck`
   - Log result: "BASELINE: X errors, Y warnings"
   - This is the starting point

2. **Verify Database Types**:
   - Run: `grep -c "^export type" apps/web/lib/database.types.ts`
   - Log count: "Database types: X exports"
   - These may increase during execution if tasks include type generation

3. **Document Affected Packages**:
   - Analyze tasks to determine which packages will be modified
   - Log list: `["web", "@kit/ui", "@kit/supabase"]`
   - Use this for targeted typecheck during execution
```

---

#### Task 4.2: Update Specification in Alpha Command Documentation

**Location**: Create reference section in `.claude/commands/alpha/implement.md`

**Add new reference section**:
```markdown
## Typecheck Verification Reference

### When to Run `pnpm typecheck`

| Situation | Command | Blocking |
|-----------|---------|----------|
| Task modifies .ts/.tsx files | `pnpm typecheck --filter [package]` | YES - must pass |
| After each task group | `pnpm typecheck` | YES - must pass |
| Before feature completion | `pnpm typecheck` | YES - must pass |
| Task modifies only docs/config | Not required | NO |

### Package Detection

To determine affected packages for targeted typecheck:
```bash
# Get package name from file path
file_path="apps/web/src/components/foo.tsx"
if [[ $file_path =~ ^apps/([^/]+) ]]; then
  package="${BASH_REMATCH[1]}"
else
  package=$(echo "$file_path" | grep -o '@[^/]*/[^/]*' | head -1)
fi
echo "pnpm typecheck --filter $package"
```

### Database Type Verification

For tasks with `requires_database: true`:
```bash
# Before task starts
before=$(grep -c "^export type" apps/web/lib/database.types.ts)

# [Task executes and generates types]

# After task completes
after=$(grep -c "^export type" apps/web/lib/database.types.ts)

if [ $after -le $before ]; then
  echo "ERROR: Type generation failed - no new types exported"
  exit 1
fi
```
```

---

#### Task 4.3: Create Validation Checklist

**Location**: Add to CLAUDE.md project instructions

**New section**:
```markdown
## Alpha Workflow Validation Checklist

Use this before running `/alpha:spec-orchestrator`:

### Feature Decomposition (`/alpha:feature-decompose`)
- [ ] All features with database tasks have `requires_database: true`
- [ ] Schema features ordered before data features
- [ ] Features using tables have `blockedBy` on schema features
- [ ] Feature dependency graph has no cycles
- [ ] All features pass INVEST-V criteria

### Task Decomposition (`/alpha:task-decompose`)
- [ ] All database-referencing tasks have `requires_database: true`
- [ ] All verification_commands include `pnpm typecheck`
- [ ] Database tasks include type generation steps
- [ ] Tasks importing database types have `blockedBy` dependencies
- [ ] Feature tasks.json has correct execution groups and parallelization

### Implementation (`/alpha:implement`)
- [ ] After each task: typecheck passes for modified packages
- [ ] Before each commit: global typecheck passes
- [ ] Before feature completion: typecheck, lint, imports all pass
- [ ] Database types verified to exist after generation
- [ ] Progress file updated with validation results
```

---

## Testing Strategy

### Test 1: Re-run S1864 Implementation with Fixes

**Objective**: Verify that with fixes applied, the S1864 feature completes without TypeScript errors

**Steps**:
1. Apply all changes to `.claude/commands/alpha/implement.md`
2. Apply all changes to `.claude/commands/alpha/task-decompose.md`
3. Apply all changes to `.claude/commands/alpha/feature-decompose.md`
4. Run `/alpha:feature-decompose S1864.I3` to decompose with new validation
5. Run `/alpha:task-decompose S1864.I3` to decompose tasks with database task enforcement
6. Run `/alpha:implement S1864.I3.F1` through `.F3` sequentially
7. Verify each feature completes with:
   - Zero TypeScript errors
   - All database types generated and present
   - All imports resolved
   - Feature marked "complete" in orchestrator

**Success Criteria**:
- All features complete without typecheck failures
- No "Cannot find module" errors
- All database tables and types exist
- Code is production-ready (lint passes, types pass)

---

### Test 2: Validate Database Task Enforcement

**Objective**: Verify that features referencing tables without schema creation tasks fail validation early

**Steps**:
1. Create a test initiative with a feature that references a table
2. Decompose without a schema creation feature
3. Run `/alpha:task-decompose` on the feature
4. Verify it rejects the tasks.json with clear error message

**Success Criteria**:
- Task decomposition fails with error message
- Error message identifies missing schema feature
- Error message specifies which table is referenced but not created

---

### Test 3: Validate Schema Prerequisite Enforcement

**Objective**: Verify that feature decomposition prevents schema features from being ordered after data features

**Steps**:
1. Create a test initiative with incorrect ordering (data feature F1, schema feature F2)
2. Run `/alpha:feature-decompose` with the test initiative
3. Verify it reorganizes or rejects the decomposition

**Success Criteria**:
- Feature decomposition rejects incorrect ordering
- Schema features automatically ordered first
- Clear message explains dependency requirements

---

### Test 4: End-to-End Integration Test

**Objective**: Verify all three fixes work together in a complete workflow

**Steps**:
1. Create a new test spec with a feature that creates a database schema
2. Create a dependent feature that uses that schema
3. Run full Alpha workflow: `/alpha:spec` → `/alpha:initiative-decompose` → `/alpha:feature-decompose` → `/alpha:task-decompose` → `/alpha:implement`
4. Monitor validation at each stage
5. Verify final code passes all validation

**Success Criteria**:
- Workflow completes without errors
- Each stage validates correctly
- Final implementation has zero TypeScript errors
- Database types properly generated and used
- All tests pass (if unit/integration tests exist)

---

## Risk Assessment

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Typecheck adds significant overhead | Medium | Each task slower | Add `--filter` for targeted checks; use parallel batches |
| Database task validation too strict | Medium | Blocks valid features | Test with actual projects; allow documented overrides |
| Feature decomposition fails on older specs | Low | Cannot decompose existing initiatives | Add backward compatibility; document migration path |
| Validation messages unclear | Low | Developers confused | Write detailed error messages; provide examples |

### Mitigation Strategies

1. **Performance**: Use `pnpm typecheck --filter [package]` at task level, full check at group level
2. **Flexibility**: Allow `requires_database: false` override in tasks.json with justification
3. **Compatibility**: Test on S1864 before applying to other specs
4. **Documentation**: Add examples in each command's error messages

---

## Implementation Tasks

### Task Group 1: Implement Mandatory Typecheck (3 hours)

- [ ] **1.1** Add Task-Level Typecheck Validation to `/alpha:implement`
  - Add conditional typecheck for .ts/.tsx files
  - Implement package detection logic
  - Add error handling and retry logic

- [ ] **1.2** Add Group-Level Typecheck Before Commit
  - Add global typecheck before git commit
  - Add lint validation (optional auto-fix)
  - Document blocking on validation failure

- [ ] **1.3** Add Feature-Level Validation Before Completion
  - Add full typecheck verification
  - Add database type verification
  - Add import resolution check
  - Add progress file logging

---

### Task Group 2: Enforce Database Tasks (2.5 hours)

- [ ] **2.1** Add Database Task Validation Section to `/alpha:task-decompose`
  - Document table reference detection
  - Document `requires_database: true` requirements
  - Document verification command requirements
  - Document type-dependent task blocking

- [ ] **2.2** Update Task Decomposer Agent Instructions
  - Add database task critical rules
  - Add validation failure handling
  - Update example task structure

---

### Task Group 3: Enforce Schema Prerequisites (2.5 hours)

- [ ] **3.1** Add Database Feature Prerequisites to `/alpha:feature-decompose`
  - Document schema feature requirement
  - Document feature blocking requirements
  - Add validation during decomposition
  - Update feature-level metadata

- [ ] **3.2** Update Feature Decomposer Instructions
  - Add database-first decomposition rules
  - Add failure criteria
  - Add example feature structures

---

### Task Group 4: Integration & Documentation (1.5 hours)

- [ ] **4.1** Update Implementation Sequence Documentation
  - Add validation setup section
  - Add baseline logging
  - Add database type verification

- [ ] **4.2** Update Specification in Alpha Command Documentation
  - Add typecheck verification reference
  - Add package detection examples
  - Add database type verification examples

- [ ] **4.3** Create Validation Checklist
  - Add to CLAUDE.md
  - Document pre-orchestrator checks
  - Create feature/task/implementation checklists

---

## Validation Commands

### Pre-Implementation Checks

```bash
# Verify existing implementation works
pnpm typecheck
pnpm lint
cd apps/e2e && pnpm test:unit

# Check current file count (baseline)
wc -l .claude/commands/alpha/implement.md
wc -l .claude/commands/alpha/task-decompose.md
wc -l .claude/commands/alpha/feature-decompose.md
```

### Post-Implementation Checks

```bash
# Verify no syntax errors in modified files
grep -n "ERROR\|TODO\|FIXME" .claude/commands/alpha/implement.md
grep -n "ERROR\|TODO\|FIXME" .claude/commands/alpha/task-decompose.md
grep -n "ERROR\|TODO\|FIXME" .claude/commands/alpha/feature-decompose.md

# Test typecheck command validity
pnpm typecheck --help
pnpm typecheck --filter web

# Verify grep patterns work
grep -r "CREATE TABLE" apps/web/supabase/schemas/
grep "^export type" apps/web/lib/database.types.ts | wc -l
```

### Feature Implementation Verification

```bash
# After implementing S1864 with fixes
cd apps/web
pnpm typecheck --filter web

# Verify database types exist
grep "activity_logs\|activity_feed" lib/database.types.ts

# Verify no "Cannot find module" errors
pnpm typecheck 2>&1 | grep -c "Cannot find module"  # Should be 0

# Verify schema migration applied
pnpm supabase:web:typegen
pnpm typecheck
```

---

## Success Criteria

### Phase 1: Mandatory Typecheck Implementation

- [ ] `/alpha:implement` modified with task-level typecheck verification
- [ ] `/alpha:implement` modified with group-level typecheck before commit
- [ ] `/alpha:implement` modified with feature-level validation
- [ ] Test S1864.I3.F2 with implementation completes without type errors
- [ ] Test shows typecheck failures block task completion
- [ ] Test shows fix-and-retry workflow works

### Phase 2: Database Task Enforcement

- [ ] `/alpha:task-decompose` includes database task validation section
- [ ] Task decomposer agent instructions updated
- [ ] Test shows missing schema task rejected
- [ ] Test shows type-dependent tasks properly blocked
- [ ] Test shows verification commands validated

### Phase 3: Schema Prerequisites

- [ ] `/alpha:feature-decompose` includes database feature prerequisites section
- [ ] Feature decomposer instructions updated
- [ ] Test shows schema feature required for data features
- [ ] Test shows correct ordering enforced
- [ ] Test shows metadata properly created

### Phase 4: Integration

- [ ] CLAUDE.md updated with validation checklist
- [ ] All command documentation consistent
- [ ] Full S1864 re-implementation completes without errors
- [ ] Database types properly generated and verified
- [ ] No manual fixes needed after implementation

---

## Post-Implementation

### Documentation Updates

1. **CLAUDE.md**: Add Alpha Workflow Validation Checklist section
2. **Command Help**: Update command descriptions to mention typecheck requirements
3. **Examples**: Add example tasks.json showing `requires_database: true` and `blockedBy`
4. **Error Messages**: Update orchestrator to provide clear guidance when validation fails

### Monitoring & Iteration

1. **Track Next Implementation**: Run S1864 or another initiative with fixes applied
2. **Monitor Validation Overhead**: Track time spent on typecheck vs implementation
3. **Collect Feedback**: Note any validation too strict or too loose
4. **Adjust Thresholds**: If typecheck takes >10% of execution time, consider lazy validation

### Future Improvements (Out of Scope)

- Parallel typecheck execution (check multiple packages in parallel)
- Incremental compilation (cache type information between tasks)
- Cross-feature type validation in orchestrator (prevent schema deadlocks)
- Automated schema generation from feature descriptions

---

## Summary

This bug fix plan addresses critical gaps in the Alpha workflow's validation process by introducing three-tier typecheck validation, mandatory database task enforcement, and schema prerequisite validation. The changes are surgical and focused on preventing the specific failures observed in S1864 while improving the overall robustness of the Alpha autonomous coding workflow.

**Total Implementation Time**: 8-12 hours
**Risk Level**: Medium (validation may be overly strict initially, will iterate)
**Impact**: High (prevents silent failures, catches errors early, ensures code quality)

---

*Created by Claude Code - Bug Fix Planning*
*Diagnosis Reference: 1871-diagnosis-alpha-orchestrator-failures.md*
