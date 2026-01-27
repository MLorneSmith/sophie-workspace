# Initiative: Dashboard Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1864 |
| **Initiative ID** | S1864.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 1 |

---

## Description
Establish the foundational infrastructure for the user dashboard including the page shell, responsive grid layout, TypeScript type definitions, and a parallel-fetching data loader. This initiative creates the structural foundation that all other dashboard widgets will build upon.

## Business Value
Enables rapid development of all subsequent dashboard features by providing a consistent page structure, reusable layout patterns, and performant data loading infrastructure. Without this foundation, each widget would need to independently solve layout and data fetching problems.

---

## Scope

### In Scope
- [ ] Dashboard page shell at `/home/(user)/page.tsx` with PageHeader integration
- [ ] Responsive 3-3-1 grid layout (mobile: 1-col, tablet: 2-col, desktop: 3-col)
- [ ] TypeScript type definitions for all dashboard data structures
- [ ] Dashboard data loader with parallel fetching (`Promise.all` pattern)
- [ ] Skeleton loading containers for each widget position
- [ ] Translation keys and i18n setup for dashboard strings

### Out of Scope
- [ ] Individual widget implementations (handled in I2-I5)
- [ ] Database migrations (new tables handled in I3)
- [ ] External API integrations (Cal.com handled in I4)
- [ ] E2E tests (handled in I5)

---

## Dependencies

### Blocks
- S1864.I2: Progress & Assessment Widgets (requires grid layout)
- S1864.I3: Activity & Task Widgets (requires page shell, data loader)
- S1864.I4: Coaching Integration (requires page shell)
- S1864.I5: Presentation Table & Polish (requires grid layout)

### Blocked By
- None (this is the foundation initiative)

### Parallel With
- None (must complete before other initiatives start)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Existing patterns in codebase (dashboard-demo-charts.tsx, page.tsx primitives) |
| External dependencies | Low | No external APIs or services |
| Unknowns | Low | Clear requirements, established patterns |
| Reuse potential | High | Layout, types, and loader used by all widgets |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Types and Data Loader**: Create dashboard types (`DashboardData`, widget-specific types) and parallel-fetching loader function
2. **Dashboard Page Shell**: Implement page.tsx with header, empty grid structure, and Suspense boundaries
3. **Responsive Grid Layout**: 3-3-1 grid with mobile/tablet/desktop breakpoints
4. **Skeleton Loading States**: Widget-shaped skeleton containers for progressive loading

### Suggested Order
1. Types and loader (foundation for data flow)
2. Page shell (container for content)
3. Grid layout (widget positioning)
4. Skeleton states (loading UX)

---

## Validation Commands
```bash
# Verify page renders
curl -s http://localhost:3000/home | grep -q "dashboard" && echo "Page renders"

# Check TypeScript types compile
pnpm --filter web typecheck

# Verify loader function exists
grep -r "loadDashboardData" apps/web/app/home/\(user\)/_lib/server/
```

---

## Related Files
- Spec: `../spec.md`
- Reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
- Page primitives: `packages/ui/src/makerkit/page.tsx`
- Features: `./S1864.I1.F*-Feature-*/` (created in next phase)
