# Initiative: Dashboard Foundation & Data Layer

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1607 |
| **Initiative ID** | S1607.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 1 |

---

## Description
Establish the foundational page structure, responsive grid layout, and unified data layer for the user dashboard. This initiative creates the scaffolding that all widget initiatives depend on, including the 3-3-1 responsive grid, page routing, header integration, and parallel data fetching infrastructure.

## Business Value
Enables the entire dashboard by providing the technical foundation. Without this initiative, no widgets can be rendered or data displayed. This is the critical infrastructure that unblocks all other dashboard work.

---

## Scope

### In Scope
- [x] Create `/home` page.tsx with Server Component pattern
- [x] Implement 3-3-1 responsive grid layout (3 cols row 1, 3 cols row 2, 1 full-width row 3)
- [x] Integrate HomeLayoutPageHeader with title/description
- [x] Create unified dashboard data loader with `Promise.all()` parallel fetching
- [x] Define TypeScript types for all 7 widget data structures
- [x] Create placeholder widget card components (shells for content)
- [x] Implement responsive breakpoints (mobile: 1 col, tablet: 2 col, desktop: 3 col)
- [x] Add i18n keys for dashboard page metadata
- [x] Create loading skeleton states for page-level loading

### Out of Scope
- [ ] Individual widget implementations (deferred to I2-I5)
- [ ] Widget-specific data queries (only loader skeleton in I1)
- [ ] Cal.com integration (I5)
- [ ] Empty state designs (part of individual widgets)

---

## Dependencies

### Blocks
- S1607.I2: Progress & Assessment Visualization
- S1607.I3: Task & Activity Awareness
- S1607.I4: Quick Actions & Presentations
- S1607.I5: Coaching Integration

### Blocked By
- None (foundation initiative)

### Parallel With
- None (must complete before other initiatives start)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Uses existing patterns from team dashboard |
| External dependencies | None | No external APIs or services |
| Unknowns | Low | Page/layout patterns well-documented in codebase |
| Reuse potential | High | Page, PageBody, PageHeader, Card all exist |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Dashboard Page & Grid Layout**: Create the base page.tsx, implement responsive grid
2. **Unified Data Loader**: Create dashboard-page.loader.ts with parallel fetching
3. **Widget Card Shells**: Create placeholder cards for all 7 positions
4. **Loading States**: Implement page-level and per-widget skeletons

### Suggested Order
1. Dashboard Page & Grid Layout (provides rendering target)
2. Widget Card Shells (provides component structure)
3. Unified Data Loader (provides data infrastructure)
4. Loading States (polish)

---

## Validation Commands
```bash
# Verify page renders
curl -s http://localhost:3000/home | head -20

# Verify TypeScript compiles
pnpm --filter web typecheck

# Verify responsive grid at breakpoints
# Manual browser testing at 375px, 768px, 1024px, 1280px

# Verify data loader function exists
grep -r "loadDashboardData" apps/web/app/home/\(user\)/
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-slug>/` (created in next phase)
- Reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
- Reference: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
