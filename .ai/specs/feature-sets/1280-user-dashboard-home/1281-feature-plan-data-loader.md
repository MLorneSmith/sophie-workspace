# Feature Plan: Dashboard Data Loader

**Issue**: #1281
**Parent**: #1280
**Research Manifest**: #1279
**Phase**: 1 - Foundation
**Effort**: M (Medium)
**Dependencies**: None

---

## Overview

Create server-side parallel data fetching infrastructure for the user dashboard. This foundation enables all subsequent dashboard components by providing a single `loadDashboardData()` function that fetches course progress, survey scores, task counts, recent activity, and presentations data efficiently using `Promise.all()`.

The loader follows the existing pattern from `members-page.loader.ts` with server-only execution, type-safe returns, and proper error handling with logging.

## Solution Approach

### Architecture Pattern

**Server Component Data Fetching** using async server components with parallel Promise resolution:

```typescript
// Pattern: Server-only loader returning typed data tuple
// Benefits: Type safety, parallel fetching, clean composition

export async function loadDashboardData(
  client: SupabaseClient<Database>,
  userId: string,
) {
  // Parallel fetch all required data sources
  return Promise.all([
    loadCourseProgress(client, userId),
    loadSurveyScores(client, userId),
    loadKanbanSummary(client, userId),
    loadRecentActivity(client, userId),
    loadPresentations(client, userId),
  ]);
}
```

### Key Implementation Details

1. **Server-Only Execution**: Add `import 'server-only'` directive to prevent client-side imports
2. **Parallel Data Fetching**: Use `Promise.all()` instead of sequential awaits (60-80% performance improvement)
3. **Typed Returns**: Return tuple with explicit types for destructuring in components
4. **Error Handling**: Implement proper error logging without throwing (components handle empty states)
5. **No Admin Client**: Use standard Supabase client (RLS applies automatically)

### Data Fetching Logic per Component

#### Course Progress
- Source: `course_progress` table
- Filter: `user_id = current_user_id` (RLS enforced)
- Return: Single record with `completion_percentage`
- Fallback: Return `0` if no course in progress

```typescript
async function loadCourseProgress(
  client: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await client
    .from('course_progress')
    .select('completion_percentage, course_id, started_at')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to load course progress', { userId, error });
  }

  return data ?? { completion_percentage: 0 };
}
```

#### Survey Scores
- Source: `survey_responses` table
- Filter: `user_id = current_user_id` (RLS enforced)
- Return: Latest response with category_scores JSONB field
- Structure: `{ [category]: score, ... }`

```typescript
async function loadSurveyScores(
  client: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await client
    .from('survey_responses')
    .select('category_scores, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to load survey scores', { userId, error });
  }

  return data?.category_scores ?? {};
}
```

#### Kanban Summary
- Source: `tasks` table
- Filter: `user_id = current_user_id`, aggregated by status
- Return: Counts per status + current task + next task
- Statuses: `todo`, `in_progress`, `done`

```typescript
async function loadKanbanSummary(
  client: SupabaseClient<Database>,
  userId: string,
) {
  const { data: tasks, error } = await client
    .from('tasks')
    .select('id, title, status, priority, order')
    .eq('user_id', userId)
    .order('order', { ascending: true });

  if (error) {
    logger.error('Failed to load kanban summary', { userId, error });
    return {
      todo: 0,
      in_progress: 0,
      done: 0,
      currentTask: null,
      nextTask: null,
    };
  }

  const counts = {
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  const currentTask = tasks.find(t => t.status === 'in_progress');
  const nextTask = tasks.find(t => t.status === 'todo');

  return {
    ...counts,
    currentTask: currentTask ?? null,
    nextTask: nextTask ?? null,
  };
}
```

#### Recent Activity
- Source: Union of `lesson_progress`, `quiz_attempts`, `building_blocks_submissions`
- Filter: `user_id = current_user_id`
- Return: List of activities with type, timestamp, details
- Sort: By completion_at/created_at descending, limit 10

```typescript
async function loadRecentActivity(
  client: SupabaseClient<Database>,
  userId: string,
) {
  const [lessons, quizzes, presentations] = await Promise.all([
    client
      .from('lesson_progress')
      .select('id, course_id, completed_at')
      .eq('user_id', userId)
      .eq('completed_at', null, { not: true }),
    client
      .from('quiz_attempts')
      .select('id, quiz_id, score, passed, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(10),
    client
      .from('building_blocks_submissions')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const activities = [
    ...((lessons.data ?? []).map(l => ({
      type: 'lesson_completed',
      id: l.id,
      timestamp: l.completed_at,
    }))),
    ...((quizzes.data ?? []).map(q => ({
      type: q.passed ? 'quiz_passed' : 'quiz_attempted',
      id: q.id,
      timestamp: q.completed_at,
      score: q.score,
    }))),
    ...((presentations.data ?? []).map(p => ({
      type: 'presentation_created',
      id: p.id,
      title: p.title,
      timestamp: p.created_at,
    }))),
  ];

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
}
```

#### Presentations
- Source: `building_blocks_submissions` table
- Filter: `user_id = current_user_id`
- Return: Array of presentations with title, outline, created_at
- Sort: By created_at descending

```typescript
async function loadPresentations(
  client: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await client
    .from('building_blocks_submissions')
    .select('id, title, outline, storyboard, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to load presentations', { userId, error });
  }

  return data ?? [];
}
```

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` | Main data loader with parallel fetching |

## Implementation Tasks

### Task 1: Create loader structure with error handling
- [ ] Create file `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts`
- [ ] Add `import 'server-only'` directive
- [ ] Import `SupabaseClient<Database>` type
- [ ] Import `getLogger` utility
- [ ] Define TypeScript interfaces for all return types

### Task 2: Implement individual data loaders
- [ ] Implement `loadCourseProgress()` function
- [ ] Implement `loadSurveyScores()` function
- [ ] Implement `loadKanbanSummary()` function
- [ ] Implement `loadRecentActivity()` function
- [ ] Implement `loadPresentations()` function
- [ ] Add proper error logging for each loader

### Task 3: Implement main loader with Promise.all()
- [ ] Create `loadDashboardData()` that calls all loaders in parallel
- [ ] Return typed tuple for destructuring
- [ ] Handle errors gracefully (return defaults, not throw)

### Task 4: Add TypeScript types and validation
- [ ] Define `DashboardData` type (tuple of all return types)
- [ ] Ensure all functions have proper return type annotations
- [ ] Add JSDoc comments with descriptions and parameter info

### Task 5: Testing and validation
- [ ] Run `pnpm typecheck` and verify no type errors
- [ ] Run `pnpm lint:fix` and ensure code style compliance
- [ ] Verify all error paths return sensible defaults (no thrown errors)

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
pnpm --filter web test:unit
```

## Acceptance Criteria

- [ ] All 5 data sources fetched in parallel using `Promise.all()`
- [ ] Type-safe return values with explicit TypeScript types
- [ ] Error handling with logging (no thrown errors)
- [ ] Graceful fallbacks for missing data
- [ ] All validation commands pass without errors
- [ ] RLS policies respected (no admin client usage)
- [ ] No TypeScript `any` types used

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
