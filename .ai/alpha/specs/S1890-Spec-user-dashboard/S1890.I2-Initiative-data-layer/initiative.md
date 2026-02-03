# Initiative: Data Layer

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1890 |
| **Initiative ID** | S1890.I2 |
| **Status** | Draft |
| **Estimated Weeks** | 1-2 |
| **Priority** | 2 |

---

## Description
Create a consolidated server-side data loader that fetches all dashboard data in parallel using `Promise.all()`. This includes course progress, lesson progress, quiz attempts, survey responses, tasks with subtasks, and building blocks submissions. Establishes TypeScript types for dashboard data structures.

## Business Value
Enables performant data fetching (60-80% faster than sequential) and provides a single source of truth for all dashboard widgets. Ensures type safety across the entire dashboard feature and leverages Supabase RLS for security.

---

## Scope

### In Scope
- [x] Create consolidated `user-dashboard.loader.ts` in `_lib/server/`
- [x] Implement parallel data fetching with `Promise.all()`
- [x] Define TypeScript interfaces for dashboard data structures
- [x] Query 6 Supabase tables: course_progress, lesson_progress, quiz_attempts, survey_responses, tasks, building_blocks_submissions
- [x] Use React `cache()` for per-request memoization
- [x] Handle null/empty data cases gracefully
- [x] Add 'server-only' directive for tree-shaking

### Out of Scope
- [ ] Cal.com V2 API integration (handled by I6)
- [ ] Client-side data hooks (use server components)
- [ ] Real-time subscriptions (refresh-based for v1)
- [ ] Data mutations (use existing server actions)

---

## Dependencies

### Blocks
- S1890.I3: Progress Widgets (needs course/lesson/survey data)
- S1890.I4: Task & Activity Widgets (needs tasks/activity data)
- S1890.I5: Action Widgets (needs state data for contextual CTAs)
- S1890.I6: Coaching Integration (needs dashboard data context)
- S1890.I7: Empty States & Polish (needs data availability flags)

### Blocked By
- None (foundation initiative)

### Parallel With
- S1890.I1: Dashboard Foundation (can develop concurrently)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Aggregating 6 tables requires understanding each schema; existing patterns available |
| External dependencies | Low | All internal Supabase tables with existing RLS policies |
| Unknowns | Low | All tables documented in migrations; types auto-generated |
| Reuse potential | High | Existing loader patterns in billing/, course/ directories |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Dashboard Data Loader**: Create consolidated loader with parallel fetching
2. **Dashboard Types**: Define TypeScript interfaces for UserDashboardData
3. **Activity Aggregation**: Build activity feed query across multiple tables

### Suggested Order
1. Dashboard Types (F1) - define interfaces first
2. Dashboard Data Loader (F2) - implement with types
3. Activity Aggregation (F3) - complex cross-table query

---

## Validation Commands
```bash
# Verify loader exists
test -f apps/web/app/home/\(user\)/_lib/server/user-dashboard.loader.ts && echo "✓ Loader exists"

# Check for server-only directive
grep -q "import 'server-only'" apps/web/app/home/\(user\)/_lib/server/user-dashboard.loader.ts && echo "✓ Server-only"

# Check for Promise.all pattern
grep -q "Promise.all" apps/web/app/home/\(user\)/_lib/server/user-dashboard.loader.ts && echo "✓ Parallel fetching"

# Run typecheck
pnpm typecheck
```

---

## Related Files
- Spec: `../spec.md`
- Existing loader: `apps/web/app/home/(user)/billing/_lib/server/personal-account-billing-page.loader.ts`
- Database types: `apps/web/lib/database.types.ts`
- Features: `./<feature-#>-<slug>/` (created in next phase)

## Table References
| Table | Purpose |
|-------|---------|
| `course_progress` | User's overall course completion percentage |
| `lesson_progress` | Individual lesson completion status |
| `quiz_attempts` | Quiz scores for activity feed |
| `survey_responses` | Self-assessment category scores for spider diagram |
| `tasks` | Kanban tasks for summary card |
| `building_blocks_submissions` | Presentation outlines for table |
