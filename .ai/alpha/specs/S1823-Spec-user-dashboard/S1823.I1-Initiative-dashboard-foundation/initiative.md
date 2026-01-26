# Initiative: Dashboard Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1823 |
| **Initiative ID** | S1823.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 1 |

---

## Description
Establish the foundational infrastructure for the user dashboard including the page shell, responsive 3-3-1 grid layout system, TypeScript type definitions for all dashboard data, and a unified data loader with parallel fetching. This initiative provides the architectural foundation that all subsequent widget initiatives depend on.

## Business Value
Enables the entire dashboard feature by providing the page structure, layout system, and data infrastructure. Without this foundation, no widgets can be displayed. Establishes patterns that accelerate development of all subsequent initiatives.

---

## Scope

### In Scope
- [x] Dashboard page shell at `/home/(user)/page.tsx`
- [x] Responsive CSS Grid layout (3-3-1 desktop, 2-column tablet, 1-column mobile)
- [x] TypeScript interfaces for all dashboard data types
- [x] Unified dashboard data loader with `Promise.all()` parallel fetching
- [x] Page header with `HomeLayoutPageHeader` component
- [x] Skeleton loading components for grid layout
- [x] Integration with `UserWorkspaceContextProvider`

### Out of Scope
- [ ] Individual widget implementations (I2-I5)
- [ ] Cal.com integration (I4)
- [ ] E2E tests (I5)
- [ ] Accessibility audit (I5)

---

## Dependencies

### Blocks
- S1823.I2 (Progress/Assessment Widgets)
- S1823.I3 (Activity/Task Widgets)
- S1823.I4 (Coaching Integration)
- S1823.I5 (Presentation Table & Polish)

### Blocked By
- None

### Parallel With
- None (must complete before Group 1)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Standard Next.js patterns, existing layout components |
| External dependencies | Low | No external APIs, all internal infrastructure |
| Unknowns | Low | Patterns established in team dashboard |
| Reuse potential | High | `PageBody`, `Card`, loader patterns from existing pages |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Dashboard TypeScript Types**: Define interfaces for all widget data (course progress, survey responses, tasks, activity, presentations)
2. **Dashboard Page Shell**: Create page.tsx with metadata, header, and PageBody wrapper
3. **Responsive Grid Layout**: Implement 3-3-1 CSS Grid with responsive breakpoints
4. **Skeleton Loading States**: Create grid-aware skeleton components for streaming

### Suggested Order
1. Types first (unblocks loader development)
2. Page shell (basic structure)
3. Grid layout (widget containers)
4. Skeleton loading (UX polish)

---

## Validation Commands
```bash
# Verify page renders at correct route
curl -s http://localhost:3000/home | grep -q "Dashboard"

# TypeScript compilation check
pnpm --filter web typecheck

# Verify responsive grid breakpoints (manual or E2E)
pnpm --filter web-e2e test:shard1 -- --grep "dashboard"
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Existing patterns: `apps/web/app/home/(user)/course/page.tsx`
- Grid reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
