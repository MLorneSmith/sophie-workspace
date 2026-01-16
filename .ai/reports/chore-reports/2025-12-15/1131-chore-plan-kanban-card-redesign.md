# Chore: Redesign Kanban Task Card UI

## Chore Description

Redesign the kanban task card to improve the visual layout and remove unused functionality:

1. **Phase Badge Repositioning**: Currently, the task description field contains a phase prefix like `[Phase 1: The Start] Determine who the hero...`. Instead of displaying this full description in the card, extract the phase name (e.g., "The Start") and display it as a badge in the top-right corner of the card. The description field should no longer be displayed in the kanban column card view.

2. **Remove Image Field**: Tasks currently support image uploads via Vercel Blob storage. This feature is not needed and should be removed entirely from the database, schema, server actions, and UI components.

## Relevant Files

Use these files to resolve the chore:

### Core Schema & Types
- `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts` - Zod schemas and TypeScript types for Task, CreateTaskInput, UpdateTaskInput. Must add `phase` field and remove `image`/`image_url` fields.
- `apps/web/supabase/migrations/20250221144500_web_create_kanban_tables.sql` - Original migration creating tasks table with `image_url` column.

### UI Components
- `apps/web/app/home/(user)/kanban/_components/task-card.tsx` - Main card component displayed in kanban columns. Must add phase badge, remove description display, remove image display.
- `apps/web/app/home/(user)/kanban/_components/task-dialog.tsx` - Edit/create dialog for tasks. Must add phase field, remove image upload UI.
- `apps/web/app/home/(user)/kanban/_components/task-form.tsx` - Form component (simpler version). Remove image field.

### Server Actions
- `apps/web/app/home/(user)/kanban/_lib/server/server-actions.ts` - CRUD actions for tasks. Must update CreateTaskSchema and UpdateTaskSchema to add `phase` and remove `image`/`image_url`.
- `apps/web/app/home/(user)/kanban/_lib/server/image-actions.ts` - Image upload/delete actions. Will be deleted entirely.

### Data Hooks
- `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts` - React Query hooks for task operations. Remove image-related imports if any.

### Seed Data
- `apps/web/app/home/(user)/kanban/_lib/config/presentation-tasks.ts` - Default presentation tasks with phase metadata. Must update task structure to add `phase` field directly to tasks.
- `apps/web/app/home/(user)/kanban/_lib/config/default-tasks.ts` - Re-exports from presentation-tasks.ts. May need updates for new types.

### New Files

None required - all changes are modifications to existing files.

## Impact Analysis

### Dependencies Affected
- **Database schema**: `tasks` table in PostgreSQL - removing `image_url` column
- **Supabase Storage**: `task-images` bucket - will be orphaned (manual cleanup needed)
- **TypeScript types**: `Task`, `CreateTaskInput`, `UpdateTaskInput` types change shape
- **React Query cache**: Query data shape changes for `["tasks", userId]` key
- **Seed data**: `PRESENTATION_TASKS` constant needs restructuring

### Risk Assessment
**Medium Risk**
- Touches database schema (requires migration)
- Modifies core data types used throughout kanban feature
- Existing user data needs migration (parse description to extract phase)
- Storage bucket cleanup needed post-migration

### Backward Compatibility
- **Breaking Change**: Existing tasks will have `image_url` removed (data loss for any uploaded images)
- **Data Migration Required**: Existing task descriptions containing `[Phase N: Name]` pattern need to be parsed and `phase` field populated
- No deprecation warnings needed - this is a complete removal
- No API versioning needed - internal feature only

## Pre-Chore Checklist
Before starting implementation:
- [ ] Create feature branch: `chore/kanban-card-redesign`
- [ ] Backup any uploaded task images from `task-images` bucket if needed
- [ ] Verify no external consumers of task API (internal feature only)
- [ ] Run database backup before migration

## Documentation Updates Required
- No external documentation affected
- Code comments in task-card.tsx explaining phase badge logic
- No CHANGELOG entry needed for internal UI chore

## Rollback Plan
- **Database Rollback**: Create down migration to re-add `image_url` column and drop `phase` column
- **Code Rollback**: Revert git branch to previous state
- **Data Recovery**: Image URLs will be lost permanently - cannot be recovered unless backed up before migration
- **Monitoring**: Check kanban page loads successfully after deployment

## Step by Step Tasks

### Step 1: Create Database Migration for Schema Changes

Add a new migration to:
1. Add `phase` column (text, nullable initially) to `tasks` table
2. Migrate existing data: parse `description` field to extract phase name and populate `phase` column
3. Remove `image_url` column from `tasks` table

```sql
-- Add phase column
ALTER TABLE public.tasks ADD COLUMN phase text;

-- Migrate existing data: extract phase from description
-- Pattern: [Phase N: Phase Name] -> extract "Phase Name"
UPDATE public.tasks
SET phase = regexp_replace(
  description,
  '^\[Phase \d+: ([^\]]+)\].*$',
  '\1'
)
WHERE description ~ '^\[Phase \d+:';

-- Clean description: remove phase prefix
UPDATE public.tasks
SET description = regexp_replace(
  description,
  '^\[Phase \d+: [^\]]+\]\s*',
  ''
)
WHERE description ~ '^\[Phase \d+:';

-- Drop image_url column
ALTER TABLE public.tasks DROP COLUMN image_url;
```

### Step 2: Update Zod Schemas and TypeScript Types

Modify `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`:
- Add `phase` field to CreateTaskSchema (optional string)
- Remove `image` and `image_url` fields from CreateTaskSchema
- Update UpdateTaskSchema similarly
- Update Task type to include `phase: string | null` and remove `image_url`

### Step 3: Update Presentation Tasks Seed Data

Modify `apps/web/app/home/(user)/kanban/_lib/config/presentation-tasks.ts`:
- Add `phase` property to each task in PRESENTATION_TASKS array
- The phase value should match the phase name from PRESENTATION_PHASES (e.g., "The Start", "The Art of Storytelling")
- Update description field to remove the `[Phase N: Name]` prefix

Example transformation:
```typescript
// Before
{
  title: "A. Identify WHO your audience is",
  description: "[Phase 1: The Start] Determine who the hero...",
  // ...
}

// After
{
  title: "A. Identify WHO your audience is",
  description: "Determine who the hero of your presentation is - your audience",
  phase: "The Start",
  // ...
}
```

### Step 4: Update Server Actions

Modify `apps/web/app/home/(user)/kanban/_lib/server/server-actions.ts`:
- Remove import of `uploadTaskImageAction` and `deleteTaskImageAction`
- Update CreateTaskSchema: add `phase` field, remove `image` field
- Update UpdateTaskSchema: add `phase` field, remove `image` and `image_url` fields
- Remove all image upload/delete logic from `createTaskAction`, `updateTaskAction`, `deleteTaskAction`, `resetTasksAction`, `seedDefaultTasksAction`
- Add `phase` field to insert/update operations

### Step 5: Delete Image Actions File

Delete `apps/web/app/home/(user)/kanban/_lib/server/image-actions.ts` entirely - no longer needed.

### Step 6: Update Task Card Component

Modify `apps/web/app/home/(user)/kanban/_components/task-card.tsx`:
- Remove Next.js Image import
- Remove image display block (lines 87-97)
- Remove CardDescription block displaying description (lines 98-102)
- Add phase badge in top-right corner of card header using Badge component from shadcn/ui
- Badge should display `task.phase` with appropriate styling (e.g., secondary variant, small size)

```tsx
// Add to CardHeader, positioned absolute in top-right
{task.phase && (
  <Badge
    variant="secondary"
    className="absolute top-2 right-2 text-xs"
  >
    {task.phase}
  </Badge>
)}
```

### Step 7: Update Task Dialog Component

Modify `apps/web/app/home/(user)/kanban/_components/task-dialog.tsx`:
- Remove Image import from next/image
- Remove ImageIcon, TrashIcon imports (if only used for image)
- Remove imagePreview state
- Remove imageUploadId
- Remove image from form defaultValues
- Remove handleImageChange and handleRemoveImage callbacks
- Remove entire FormField for image (lines 259-319)
- Add FormField for phase (text input or select dropdown)
- Update form defaultValues to include `phase: task?.phase ?? ""`

### Step 8: Update Task Form Component

Modify `apps/web/app/home/(user)/kanban/_components/task-form.tsx`:
- This is a simpler form not using image fields
- Verify no image-related code exists; if it does, remove it
- Add phase field if this form is used anywhere

### Step 9: Update Data Hooks

Modify `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`:
- Update the select query in `getTasks` function to include `phase` column
- Remove `image_url` from the select query
- No other changes needed as hooks just call server actions

### Step 10: Generate TypeScript Types

After migration is applied:
```bash
pnpm supabase:web:typegen
```

This will regenerate `apps/web/lib/database.types.ts` with the updated `tasks` table schema.

### Step 11: Add i18n Translation Keys

Add translation keys for the phase field label in:
- `apps/web/public/locales/en/kanban.json`

```json
{
  "task": {
    "form": {
      "phase": "Phase",
      "phasePlaceholder": "Select phase"
    }
  }
}
```

### Step 12: Run Validation Commands

Execute all validation commands to ensure zero regressions.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# 1. Apply database migration
pnpm --filter web supabase migrations up

# 2. Generate updated TypeScript types
pnpm supabase:web:typegen

# 3. Run TypeScript type checking - must pass with zero errors
pnpm typecheck

# 4. Run linter - must pass with zero errors
pnpm lint

# 5. Run formatter - fix any formatting issues
pnpm format:fix

# 6. Run unit tests for kanban feature
pnpm --filter web test:unit -- --grep kanban

# 7. Start development server and manually verify:
#    - Kanban page loads correctly
#    - Tasks display with phase badges in top-right
#    - No description shown in card view
#    - Task dialog can edit phase field
#    - Creating new task works with phase field
#    - Subtask toggling still works
#    - Drag and drop still works
pnpm dev

# 8. Run E2E tests if available for kanban
pnpm --filter web-e2e test:e2e -- --grep kanban
```

## Notes

- **Storage Cleanup**: After successful deployment, the `task-images` Supabase storage bucket can be manually deleted to clean up orphaned storage. This is not automated in the migration.

- **Phase Values**: The valid phase values are defined in `PRESENTATION_PHASES` constant:
  - "The Start"
  - "The Art of Storytelling"
  - "The Harmony of Design"
  - "The Science of Fact-based Persuasion"
  - "The How"

- **Badge Component**: Use the existing Badge component from `@kit/ui/badge`. If not available, it may need to be added via shadcn CLI: `pnpm --filter @kit/ui ui:add badge`

- **Card Layout**: The task card currently uses relative positioning on the Card component. The phase badge should be positioned absolutely within the CardHeader using `absolute top-2 right-2` classes.

- **Description in Dialog**: While the description is hidden from the kanban card view, it should still be visible and editable in the task edit dialog for users who want to add additional notes.
