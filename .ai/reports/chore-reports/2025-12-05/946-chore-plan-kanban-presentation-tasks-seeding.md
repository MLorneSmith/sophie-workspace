# Chore: Integrate Presentation Development Tasks into Kanban Seeding

## Chore Description

Integrate the 69 presentation development workflow tasks from `.ai/specs/presentation-development-steps-enhanced.json` into the kanban board seeding process. When new users access the kanban board for the first time, they should see the structured presentation development tasks instead of the current generic tutorial tasks.

The current system uses a simple `DEFAULT_TASKS` array in `apps/web/app/home/(user)/kanban/_lib/config/default-tasks.ts` with 4 generic tutorial tasks. This needs to be replaced with the comprehensive 69-task workflow organized by 9 phases, while maintaining the existing task schema and database structure.

## Relevant Files

Use these files to resolve the chore:

### Existing Files to Modify

- **`apps/web/app/home/(user)/kanban/_lib/config/default-tasks.ts`** - Current default tasks configuration (4 tutorial tasks). This will be replaced with the presentation workflow tasks.
- **`apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`** - Task schema definition. May need to extend to support phase/lesson metadata.
- **`apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`** - Uses `DEFAULT_TASKS` to seed new users. Logic may need adjustment for larger task set.
- **`apps/web/app/home/(user)/kanban/_lib/server/server-actions.ts`** - Contains `resetTasksAction` that uses `DEFAULT_TASKS`. Will need to handle the larger dataset.

### Reference Files (Read-Only)

- **`.ai/specs/presentation-development-steps-enhanced.json`** - Source data with 69 tasks across 9 phases
- **`apps/web/supabase/migrations/20250221144500_web_create_kanban_tables.sql`** - Database schema for tasks/subtasks tables

### New Files

- **`apps/web/app/home/(user)/kanban/_lib/config/presentation-tasks.ts`** - New file containing the transformed presentation tasks in `CreateTaskInput[]` format
- **`apps/web/app/home/(user)/kanban/_lib/config/task-templates.ts`** - (Optional) Configuration to switch between tutorial mode and presentation mode

## Impact Analysis

### Dependencies Affected

- **`use-tasks.ts` hook** - Imports and uses `DEFAULT_TASKS` for initial seeding
- **`server-actions.ts`** - Imports `DEFAULT_TASKS` for the reset functionality
- **React Query cache** - Task queries keyed by `["tasks", user.id]`
- **Kanban UI components** - Will display more tasks (69 vs 4)

### Risk Assessment

**Low Risk** - This is a data-only change with no schema modifications:
- No database migration required (tasks/subtasks schema unchanged)
- No API changes (same `createTaskAction` used)
- No breaking changes to existing users (their existing tasks are preserved)
- Only affects new users or users who click "Reset Tasks"

### Backward Compatibility

- **Existing users**: Their current tasks remain unchanged (stored in Supabase)
- **New users**: Will receive the new 69-task workflow instead of 4 tutorial tasks
- **Reset functionality**: Will reset to the new presentation workflow tasks
- **No migration needed**: Existing task data structure is compatible

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/kanban-presentation-tasks-seeding`
- [ ] Review the enhanced JSON file structure in `.ai/specs/presentation-development-steps-enhanced.json`
- [ ] Verify current default tasks work correctly (test reset functionality)
- [ ] Understand the `CreateTaskInput` type requirements

## Documentation Updates Required

- **CLAUDE.md**: No updates needed (internal implementation detail)
- **Code comments**: Add JSDoc comments explaining the task generation logic
- **README in kanban folder**: Consider adding a README explaining the task configuration

## Rollback Plan

1. **Immediate rollback**: Revert the changes to `default-tasks.ts` to restore the 4 tutorial tasks
2. **No database rollback needed**: Tasks are user-specific and seeded on-demand
3. **Monitoring**: Check for errors in task creation during first user access
4. **Verification**: Test with a new user account to confirm tasks seed correctly

## Step by Step Tasks

### Step 1: Create the Presentation Tasks Data File

Create a new file `apps/web/app/home/(user)/kanban/_lib/config/presentation-tasks.ts` that:
- Imports the JSON data from `.ai/specs/presentation-development-steps-enhanced.json`
- Transforms the data into `CreateTaskInput[]` format
- Groups tasks by phase for better organization
- Uses task title as the main title
- Uses task description as the description
- Maps priority (high/medium/low) directly
- All tasks start with status "do"
- Generates meaningful subtasks from phase information

```typescript
// Key transformation logic:
// - Each phase becomes a "section header" task with high priority
// - Each task within phase becomes a regular task
// - Subtasks can be derived from task descriptions or left empty
```

### Step 2: Update the Task Schema (Optional Enhancement)

Consider extending `CreateTaskInput` in `task.schema.ts` to support optional metadata:
- `phaseId?: string` - For filtering/grouping by phase
- `lessonId?: string` - For linking to course lessons
- `order?: number` - For maintaining task sequence

**Decision point**: This step is optional. The current schema works fine, but metadata would enable future features like phase filtering.

### Step 3: Update Default Tasks Configuration

Modify `apps/web/app/home/(user)/kanban/_lib/config/default-tasks.ts`:
- Import the new `PRESENTATION_TASKS` from `presentation-tasks.ts`
- Export as `DEFAULT_TASKS` (maintains backward compatibility with imports)
- Alternatively, create a configuration switch for tutorial vs presentation mode

```typescript
// Option A: Direct replacement
export { PRESENTATION_TASKS as DEFAULT_TASKS } from './presentation-tasks';

// Option B: Configuration-based
export const DEFAULT_TASKS =
  config.kanbanMode === 'tutorial'
    ? TUTORIAL_TASKS
    : PRESENTATION_TASKS;
```

### Step 4: Optimize Task Seeding for Larger Dataset

Update `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`:
- The current implementation creates tasks one-by-one in a loop
- For 69 tasks, this could cause performance issues
- Consider batching the task creation or using a transaction

```typescript
// Current (slow for 69 tasks):
for (const task of DEFAULT_TASKS) {
  await createTaskAction(task);
}

// Improved: Create a batch seeding action
await seedDefaultTasksAction(); // New server action
```

### Step 5: Create Batch Seeding Server Action

Add to `apps/web/app/home/(user)/kanban/_lib/server/server-actions.ts`:
- Create `seedDefaultTasksAction` that inserts all tasks in a single transaction
- Use Supabase's batch insert capability
- Handle subtasks creation efficiently

```typescript
const seedDefaultTasksAction = enhanceAction(
  async (_, user) => {
    const client = getSupabaseServerClient();

    // Batch insert all tasks
    const { data: tasks, error } = await client
      .from("tasks")
      .insert(DEFAULT_TASKS.map(t => ({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        image_url: t.image_url,
        account_id: user.id,
      })))
      .select();

    if (error) throw error;

    // Batch insert all subtasks
    const subtasks = tasks.flatMap((task, idx) =>
      (DEFAULT_TASKS[idx].subtasks || []).map(st => ({
        task_id: task.id,
        title: st.title,
        is_completed: st.is_completed,
      }))
    );

    if (subtasks.length > 0) {
      await client.from("subtasks").insert(subtasks);
    }

    return { success: true };
  },
  { auth: true }
);
```

### Step 6: Update Reset Tasks Action

Modify `resetTasksAction` in `server-actions.ts`:
- Use the same batch insert logic from Step 5
- Ensure it handles the larger dataset efficiently

### Step 7: Add Phase Header Tasks (Visual Organization)

Create phase "header" tasks to visually separate the workflow in the kanban:
- One task per phase with the phase name as title
- High priority to stand out
- Description explains the phase purpose
- Could use a special format like "📋 Phase 1: Discovery & Research"

### Step 8: Test the Implementation

Write tests and manually verify:
- Unit test for task transformation logic
- Integration test for batch seeding
- Manual test: Create new user and verify all 69 tasks appear
- Manual test: Click "Reset Tasks" and verify tasks reset correctly
- Performance test: Verify seeding completes in reasonable time (<5 seconds)

### Step 9: Run Validation Commands

Execute validation commands to ensure zero regressions.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# 1. Type checking - ensure no TypeScript errors
pnpm typecheck

# 2. Linting - ensure code style compliance
pnpm lint

# 3. Unit tests - run kanban-related tests
pnpm --filter web test -- --grep "kanban"

# 4. Full test suite - ensure no regressions
pnpm test:unit

# 5. Build verification - ensure production build succeeds
pnpm build

# 6. E2E tests for kanban (if available)
pnpm --filter web-e2e test -- --grep "kanban"
```

## Notes

### Performance Considerations

- 69 tasks with potential subtasks could slow initial load
- Consider lazy loading or pagination if UI becomes sluggish
- Batch database operations are critical for seeding performance

### Future Enhancements

- Add phase filtering to kanban UI
- Link tasks to course lessons for contextual help
- Allow users to choose between tutorial and presentation modes
- Track task completion progress across the workflow

### Task Data Structure Decision

The JSON file has a nested structure (phases → tasks). Two approaches:

1. **Flatten all tasks**: 69 individual tasks in the kanban, losing phase context
2. **Phase headers + tasks**: Create "header" tasks for each phase, then regular tasks under them

Recommendation: Option 2 provides better visual organization and maintains the workflow structure.

### Subtask Strategy

Each task in the JSON has a description but no subtasks. Options:

1. **No subtasks**: Keep tasks simple, description provides context
2. **Generated subtasks**: Break descriptions into actionable subtasks
3. **Phase-based subtasks**: Group related tasks as subtasks under phase headers

Recommendation: Option 1 for MVP, Option 3 for future enhancement.
