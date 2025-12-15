# Chore: Restructure Kanban Seed Data to Include Subtasks

## Chore Description

Reorganize and structure the kanban seed data to support both tasks and subtasks. Currently, all 69 presentation workflow items are seeded as flat tasks. The system already supports subtasks in the schema (`SubtaskSchema` in `task.schema.ts`) and database (`subtasks` table), but the seed data in `presentation-tasks.ts` doesn't utilize this capability.

The goal is to restructure the seed data so that:
1. High-level workflow phases become parent tasks
2. Individual steps within each phase become subtasks of their parent
3. The hierarchical structure provides better organization and progress tracking

## Relevant Files

Use these files to resolve the chore:

### Primary Files to Modify

- **`apps/web/app/home/(user)/kanban/_lib/config/presentation-tasks.ts`** - Contains the 69 flat tasks organized by 9 phases. Needs restructuring to use the subtask model. Currently exports `PRESENTATION_TASKS: CreateTaskInput[]` and `PRESENTATION_PHASES: PresentationPhase[]`.

- **`apps/web/app/home/(user)/kanban/_lib/config/default-tasks.ts`** - Re-exports from `presentation-tasks.ts`. May need updates if export structure changes.

### Supporting Files (Reference)

- **`apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`** - Defines `CreateTaskInput` with optional `subtasks: z.array(SubtaskSchema)` field. Already supports subtask seeding.

- **`apps/web/app/home/(user)/kanban/_lib/server/server-actions.ts`** - Contains `seedDefaultTasksAction` and `resetTasksAction` which already handle batch insertion of tasks AND subtasks (lines 391-415, 466-490).

- **`apps/web/supabase/migrations/20250221144500_web_create_kanban_tables.sql`** - Database schema showing tasks and subtasks tables with proper foreign key relationship (`subtasks.task_id` references `tasks.id` with cascade delete).

### New Files

None required. The existing structure supports the changes.

## Impact Analysis

### Dependencies Affected

- **`seedDefaultTasksAction`** - Already handles subtasks correctly; will automatically seed them when present in `DEFAULT_TASKS`
- **`resetTasksAction`** - Already handles subtasks correctly; no changes needed
- **React Query cache** - Same cache key `["tasks", user.id]` will be used
- **Kanban UI components** - Task cards already render subtasks; will display the new hierarchical structure

### Risk Assessment

**Low Risk** - This is a data restructuring with no schema or logic changes:
- No database migration required (subtasks table already exists)
- No API changes (existing seeding actions already support subtasks)
- No breaking changes to existing users (only affects new seeds/resets)
- Existing subtask UI components already render subtasks correctly

### Backward Compatibility

- **Existing users**: Their current tasks remain unchanged
- **New users**: Will receive the restructured hierarchical tasks
- **Reset functionality**: Will reset to the new hierarchical structure
- **No migration needed**: Data structure is compatible with existing schema

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/kanban-subtask-seeding`
- [ ] Review current `PRESENTATION_PHASES` structure in `presentation-tasks.ts`
- [ ] Verify subtask rendering works in the UI (test with manual subtask creation)
- [ ] Understand the `SubtaskSchema` requirements: `{ title: string, is_completed: boolean }`

## Documentation Updates Required

- **Code comments**: Update JSDoc in `presentation-tasks.ts` to explain the hierarchical structure
- **PRESENTATION_TASKS_SUMMARY**: Update statistics to reflect tasks vs subtasks counts
- No external documentation updates needed (internal implementation detail)

## Rollback Plan

1. **Immediate rollback**: Revert changes to `presentation-tasks.ts` to restore flat task structure
2. **No database rollback needed**: Tasks are user-specific and seeded on-demand
3. **Verification**: Test with "Reset Tasks" to confirm rollback works

## Step by Step Tasks

### Step 1: Analyze Current Task Structure and Design New Hierarchy

Review the current 69 tasks across 9 phases and design the parent-child relationship:

**Current structure** (flat):
```typescript
PRESENTATION_TASKS: CreateTaskInput[] = [
  { title: "Research your topic deeply", description: "[Phase 1: Discovery & Research] ...", status: "do", priority: "high" },
  { title: "Analyze competing presentations", ... },
  // ... 67 more flat tasks
]
```

**Proposed structure** (hierarchical):
```typescript
PRESENTATION_TASKS: CreateTaskInput[] = [
  {
    title: "Phase 1: Discovery & Research",
    description: "Understand your topic, audience, and context before planning",
    status: "do",
    priority: "high",
    subtasks: [
      { title: "Research your topic deeply", is_completed: false },
      { title: "Analyze competing or similar presentations", is_completed: false },
      { title: "Identify constraints and logistics", is_completed: false },
      { title: "Define success metrics", is_completed: false },
    ]
  },
  // ... 8 more phase tasks with their subtasks
]
```

**Key decisions**:
- 9 parent tasks (one per phase) instead of 69 flat tasks
- Each phase task contains 4-11 subtasks based on existing phase breakdown
- Parent task titles use phase names from `PRESENTATION_PHASES`
- Parent task descriptions use phase descriptions
- Subtask titles are the original task titles
- Original task descriptions can be dropped (or kept as subtask titles if short enough)

### Step 2: Create Helper Types for Better Organization

Add types to support the hierarchical structure in `presentation-tasks.ts`:

```typescript
/**
 * Subtask input for seeding - matches SubtaskSchema structure
 */
interface SubtaskInput {
  title: string;
  is_completed: boolean;
}

/**
 * Task input with subtasks for phase-based organization
 */
interface PhaseTaskInput extends CreateTaskInput {
  subtasks: SubtaskInput[];
}
```

### Step 3: Restructure PRESENTATION_TASKS Array

Transform the existing 69 flat tasks into 9 hierarchical phase tasks:

1. Create a new `PRESENTATION_TASKS_HIERARCHICAL` constant
2. For each phase in `PRESENTATION_PHASES`:
   - Create a parent task with the phase name and description
   - Set priority to "high" for all phases (critical path)
   - Set status to "do"
   - Add subtasks array with all tasks belonging to that phase

**Phase-to-subtask mapping** (based on current data):
| Phase | Name | Subtask Count |
|-------|------|---------------|
| 1 | Discovery & Research | 4 |
| 2 | The Start | 10 |
| 3 | Structure | 10 |
| 4 | Storytelling | 8 |
| 5 | Design | 9 |
| 6 | Data Visualization | 6 |
| 7 | Review & Refinement | 6 |
| 8 | Performance | 11 |
| 9 | Follow-Up | 5 |
| **Total** | | **69** |

### Step 4: Update Export and Summary Statistics

Update the exports in `presentation-tasks.ts`:

```typescript
// Main export - hierarchical structure
export const PRESENTATION_TASKS: CreateTaskInput[] = [
  // 9 phase tasks with subtasks
];

// Update summary statistics
export const PRESENTATION_TASKS_SUMMARY = {
  totalPhases: 9,
  totalTasks: 9,  // Changed from 69 - now 9 parent tasks
  totalSubtasks: 69,  // New field - original tasks are now subtasks
  subtasksByPhase: {
    "discovery-research": 4,
    "the-start": 10,
    "structure": 10,
    "storytelling": 8,
    "design": 9,
    "data-visualization": 6,
    "review-refinement": 6,
    "performance": 11,
    "follow-up": 5,
  },
};
```

### Step 5: Verify default-tasks.ts Compatibility

Ensure `default-tasks.ts` continues to work without changes:

```typescript
// This should continue to work as-is
export { PRESENTATION_TASKS as DEFAULT_TASKS } from "./presentation-tasks";
```

The re-export pattern doesn't need changes since `PRESENTATION_TASKS` maintains the same type (`CreateTaskInput[]`).

### Step 6: Test Locally

1. Reset the local database: `pnpm supabase:web:reset`
2. Start the dev server: `pnpm dev`
3. Navigate to kanban page
4. Click "Reset Tasks" to seed with new structure
5. Verify:
   - 9 task cards appear (one per phase)
   - Each task card shows subtasks
   - Subtask checkboxes are functional
   - Subtask completion persists

### Step 7: Run Validation Commands

Execute validation commands to ensure zero regressions.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# 1. Type checking - ensure no TypeScript errors
pnpm typecheck

# 2. Linting - ensure code style compliance
pnpm lint

# 3. Format check
pnpm format

# 4. Unit tests - run kanban-related tests
pnpm --filter web vitest run --grep "kanban" --passWithNoTests

# 5. Task schema tests
pnpm --filter web vitest run apps/web/app/home/\(user\)/kanban/_lib/schema/task.schema.test.ts

# 6. Server actions tests
pnpm --filter web vitest run apps/web/app/home/\(user\)/kanban/_lib/server/server-actions.test.ts

# 7. Full unit test suite - ensure no regressions
pnpm test:unit

# 8. Build verification - ensure production build succeeds
pnpm build
```

## Notes

### Alternative Approaches Considered

**Option A: Keep Flat Tasks, Add Phase Metadata** (Not Recommended)
- Add `phaseId` field to each task for filtering
- Requires schema changes and migration
- Doesn't utilize existing subtask capability

**Option B: Hybrid Structure** (Alternative)
- Keep some tasks flat (high-priority items)
- Group lower-priority items as subtasks
- More complex to implement and maintain

**Option C: Full Hierarchical (Recommended - This Plan)**
- Clean 9-task structure with clear phases
- Utilizes existing subtask system
- Better progress tracking per phase
- Simpler kanban view with expandable details

### UI Considerations

The kanban UI already supports subtasks in task cards. With 9 tasks (vs 69), the board will be:
- Less cluttered and easier to navigate
- Better suited for the 3-column layout
- Each card provides a clear phase overview
- Progress visible at both task and subtask level

### Future Enhancements

After this chore:
- Add phase progress indicators (e.g., "3/10 subtasks complete")
- Consider phase-based filtering if needed
- Add "expand all" / "collapse all" subtasks feature
