# Initiative: Data Layer

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1918 |
| **Initiative ID** | S1918.I2 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 2 |

---

## Description
Create TypeScript types, data loader functions, and parallel fetching infrastructure for all dashboard widgets. This includes the unified dashboard loader that fetches course progress, assessment scores, tasks, activity, and presentations in parallel.

## Business Value
Efficient data fetching reduces page load time by 60-80% (parallel vs sequential). Typed loaders ensure type safety and maintainability across all widgets.

---

## Scope

### In Scope
- [x] Dashboard TypeScript types (DashboardData, widget-specific types)
- [x] Main dashboard loader (`dashboard-page.loader.ts`) with `Promise.all()`
- [x] Course progress query function
- [x] Survey scores query function (reuse existing hook pattern)
- [x] Tasks summary query function (count by status, next task)
- [x] Activity aggregation query (UNION-style from multiple tables)
- [x] Presentations query function
- [x] Type exports for widget components

### Out of Scope
- [ ] Cal.com API client (I5 - separate external dependency)
- [ ] Widget UI components (I3, I4)
- [ ] Error handling UI (I6)

---

## Dependencies

### Blocks
- S1918.I3: Progress Widgets (needs typed data)
- S1918.I4: Activity & Task Widgets (needs typed data)
- S1918.I6: Polish (needs loader for error states)

### Blocked By
- S1918.I1: Dashboard Foundation (loader needs page to call it)

### Parallel With
- S1918.I5: Coaching Integration (independent data source)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Activity aggregation from 4+ tables |
| External dependencies | Low | All internal Supabase queries |
| Unknowns | Low | Existing patterns for loaders |
| Reuse potential | High | Query functions can be reused elsewhere |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Dashboard Types**: Create TypeScript interfaces for all dashboard data
2. **Dashboard Loader**: Main loader with parallel fetching
3. **Activity Aggregation**: Query function for recent activity feed

### Suggested Order
1. Types (foundational, blocks other features)
2. Individual query functions (course, survey, tasks, presentations)
3. Activity aggregation (most complex, aggregates from multiple sources)
4. Main loader integrating all queries

---

## Validation Commands
```bash
# Verify types file exists
test -f apps/web/app/home/\(user\)/_lib/types/dashboard.types.ts && echo "✓ Types exist"

# Verify loader exists
test -f apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts && echo "✓ Loader exists"

# Type check
pnpm typecheck
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Reference: `apps/web/app/home/[account]/members/_lib/server/members-page.loader.ts`
- Reference: `apps/web/app/home/(user)/kanban/_lib/api/tasks.ts`
