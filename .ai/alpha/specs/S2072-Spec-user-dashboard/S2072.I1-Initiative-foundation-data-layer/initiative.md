# Initiative: Foundation & Data Layer

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2072 |
| **Initiative ID** | S2072.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 1 |

---

## Description

Establishes the foundational infrastructure for the user dashboard, including the page shell at `/home`, responsive 3-3-1 grid layout, and a parallel data loader that aggregates all 6+ data sources. This initiative is the prerequisite for all other dashboard initiatives.

## Business Value

Provides the structural foundation that enables all dashboard widgets. Without this, no dashboard content can be displayed. Delivers the core page architecture that users will interact with immediately after login.

---

## Scope

### In Scope
- [ ] Dashboard page at `/home` route (personal account context)
- [ ] Page shell with header and layout components
- [ ] Responsive 3-3-1 grid layout (3-3-1 pattern: Row1=3 cols, Row2=3 cols, Row3=1 full-width)
- [ ] Parallel data loader function aggregating all data sources
- [ ] TypeScript types for dashboard data structure
- [ ] Widget placeholder slots in grid layout

### Out of Scope
- [ ] Actual widget implementations (delegated to I2-I5)
- [ ] Empty states and loading skeletons (delegated to I6)
- [ ] Cal.com API integration (delegated to I4)
- [ ] Activity feed aggregation logic (delegated to I3)

---

## Dependencies

### Blocks
- S2072.I2 (Progress Visualization Widgets)
- S2072.I3 (Activity & Actions Widgets)
- S2072.I4 (Coaching Integration)
- S2072.I5 (Presentations Table)

### Blocked By
- None

### Parallel With
- None (this is the foundation)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Aggregating 6+ data sources with parallel fetching |
| External dependencies | Low | No external APIs, only Supabase |
| Unknowns | Low | Page patterns well-established in codebase |
| Reuse potential | High | Loader pattern reusable across features |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Dashboard Page Shell**: Page component, route setup, metadata
2. **Responsive Grid Layout**: 3-3-1 grid with Tailwind, responsive breakpoints
3. **Dashboard Data Loader**: Parallel fetching from 6+ tables
4. **Dashboard Types**: TypeScript interfaces for all data structures
5. **Widget Placeholder Slots**: Empty Card components for each widget area

### Suggested Order
1. Dashboard Types (enables type-safe development)
2. Dashboard Page Shell (establishes route)
3. Responsive Grid Layout (visual structure)
4. Dashboard Data Loader (data infrastructure)
5. Widget Placeholder Slots (ready for I2-I5)

---

## Validation Commands
```bash
# Verify page renders
pnpm dev
# Navigate to /home

# Type checking
pnpm typecheck

# Verify loader returns expected data structure
pnpm --filter web test -- --grep "dashboard"
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./S2072.I1.F*-Feature-*/` (created in next phase)
- Reference: `apps/web/app/home/(user)/course/page.tsx` (parallel fetching pattern)
- Reference: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts` (loader pattern)
