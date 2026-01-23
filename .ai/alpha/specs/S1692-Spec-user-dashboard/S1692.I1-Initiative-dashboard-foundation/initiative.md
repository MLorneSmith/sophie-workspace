# Initiative: Dashboard Foundation & Data Layer

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1692 |
| **Initiative ID** | S1692.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 3-4 |
| **Priority** | 1 |

---

## Description
Establish the foundational infrastructure for the User Dashboard including page layout, responsive grid system, data fetching architecture, and shell components. This initiative creates the container and data pipeline that all subsequent widget initiatives will plug into.

## Business Value
Enables rapid parallel development of dashboard widgets by providing a stable foundation. Users will see a visually complete (but empty) dashboard that demonstrates the intended layout and navigation, building confidence in the feature's progress.

---

## Scope

### In Scope
- [x] Dashboard page route at `/home` (personal account)
- [x] Page layout with `PageBody` and `HomeLayoutPageHeader`
- [x] Responsive 3-3-1 grid layout (mobile → tablet → desktop)
- [x] Unified data loader with parallel `Promise.all()` fetching
- [x] Empty Card placeholders for all 7 widgets
- [x] Loading skeleton states for grid layout
- [x] TypeScript types for dashboard data
- [x] Metadata and i18n setup

### Out of Scope
- [ ] Individual widget implementations (I2-I5)
- [ ] Cal.com integration (I4)
- [ ] E2E tests (I5)
- [ ] Widget customization/reordering

---

## Dependencies

### Blocks
- S1692.I2: Progress & Assessment Widgets
- S1692.I3: Activity & Task Widgets
- S1692.I4: Coaching Integration
- S1692.I5: Presentation Table & Polish

### Blocked By
- None (foundation initiative)

### Parallel With
- None (must complete first)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Follows established page patterns from `dashboard-demo-charts.tsx` |
| External dependencies | Low | No external APIs in this initiative |
| Unknowns | Low | All patterns are documented in codebase |
| Reuse potential | High | Grid layout, loaders, and types reusable across widgets |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Dashboard Page & Route**: Create page.tsx at `/home/(user)/`, metadata, i18n
2. **Responsive Grid Layout**: Implement 3-3-1 grid with Tailwind responsive classes
3. **Unified Data Loader**: Create `dashboard-page.loader.ts` with parallel fetching
4. **Dashboard Types**: Define TypeScript interfaces for all dashboard data
5. **Skeleton Loading States**: Create loading.tsx with grid skeletons

### Suggested Order
1. Dashboard Page & Route (minimal page shell)
2. Dashboard Types (defines data contracts)
3. Responsive Grid Layout (visual structure)
4. Unified Data Loader (data pipeline)
5. Skeleton Loading States (polish)

---

## Validation Commands
```bash
# Verify page renders
pnpm dev && curl -s http://localhost:3000/home | grep -q "dashboard"

# Type check
pnpm typecheck

# Verify loader exists
ls apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-slug>/` (created in next phase)
- Reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
- Page patterns: `apps/web/app/home/[account]/page.tsx`
- Loader patterns: `apps/web/app/home/[account]/members/_lib/server/members-page.loader.ts`
