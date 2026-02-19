# Initiative: Dashboard Foundation & Data Layer

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2045 |
| **Initiative ID** | S2045.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 1 |

---

## Description
Create the dashboard page shell with responsive 3-3-1 grid layout, the new `activity_events` database table with triggers, RLS policies, and the parallel data loader that fetches all widget data via `Promise.all()`. This initiative establishes all infrastructure needed before widget components can be built.

## Business Value
Transforms the empty `/home` page into a functional dashboard skeleton and creates the data pipeline that all 7 widgets depend on. Without this foundation, no widget can render real data. The parallel loader pattern ensures the dashboard loads in < 2s.

---

## Scope

### In Scope
- [ ] Replace empty `/home/(user)/page.tsx` with dashboard page component
- [ ] Create responsive 3-3-1 grid layout (mobile, tablet, desktop breakpoints)
- [ ] Add `HomeLayoutPageHeader` with dashboard title and welcome description
- [ ] Create dashboard page loader with `Promise.all()` for 7 parallel queries
- [ ] Create `activity_events` table with schema, indexes, and RLS policies
- [ ] Create 5 database triggers (course_progress, lesson_progress, quiz_attempts, survey_responses, building_blocks_submissions)
- [ ] Generate Supabase TypeScript types
- [ ] Add page metadata and i18n keys
- [ ] Create loading skeleton layout matching 3-3-1 grid
- [ ] Add `export const dynamic = "force-dynamic"` for user-specific data

### Out of Scope
- [ ] Individual widget component implementations (I2, I3)
- [ ] Empty state designs (I4)
- [ ] Real-time updates / WebSocket subscriptions
- [ ] Analytics tracking

---

## Dependencies

### Blocks
- S2045.I2: Visualization widgets need the page layout and data loader
- S2045.I3: Interactive widgets need the page layout, data loader, and activity_events table
- S2045.I4: Empty states need all widgets to exist first

### Blocked By
- None (this is the root initiative)

### Parallel With
- None (must complete before I2/I3 can start)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | New table + 5 triggers + RLS policies; parallel loader is straightforward |
| External dependencies | Low | All data from existing Supabase tables; no external APIs |
| Unknowns | Low | Grid layout patterns well-established in codebase; trigger patterns are standard PostgreSQL |
| Reuse potential | High | Existing page patterns (withI18n, HomeLayoutPageHeader, PageBody), loader patterns from billing/members pages |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Dashboard Page & Grid Layout**: Page component, responsive grid, header, metadata, i18n, loading skeleton
2. **Activity Events Database**: New table schema, RLS policies, indexes, 5 AFTER INSERT triggers on source tables
3. **Dashboard Data Loader**: Server-side loader function with `Promise.all()` for 7 parallel Supabase queries, TypeScript types for loader return data

### Suggested Order
1. Dashboard Page & Grid Layout (no data dependency)
2. Activity Events Database (independent of page, can parallel with #1)
3. Dashboard Data Loader (depends on page structure and activity_events table existing)

---

## Validation Commands
```bash
# Verify page renders
curl -s http://localhost:3000/home | grep -c "Dashboard"

# Verify activity_events table exists
pnpm --filter web supabase migration up
pnpm supabase:web:typegen
grep 'activity_events' apps/web/lib/database.types.ts

# Verify TypeScript compiles
pnpm typecheck

# Verify triggers exist
psql -c "SELECT tgname FROM pg_trigger WHERE tgname LIKE 'activity_%';"
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Existing page: `apps/web/app/home/(user)/page.tsx`
- Grid pattern: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
- Loader pattern: `apps/web/app/home/(user)/billing/_lib/server/personal-account-billing-page.loader.ts`
- Page header: `apps/web/app/home/(user)/_components/home-page-header.tsx`
