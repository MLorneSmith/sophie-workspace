# Initiative: Dashboard Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | #1362 |
| **Initiative ID** | #1363 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 1 |

---

## Description
Build the foundational infrastructure for the User Dashboard Home page at `/home`. This includes the 3-3-1 bento grid layout, centralized data loader with parallel fetching, responsive design system, empty state handling for all 7 dashboard cards, and the Quick Actions panel with contextual CTAs.

## Business Value
Establishes the technical foundation that all other dashboard initiatives depend on. Provides immediate value through:
- Quick Actions panel reducing navigation friction (Goal G2)
- Responsive grid layout enabling mobile access
- Empty states guiding new users to take action (mitigates Risk R3)
- Presentation Outline Table for direct access to user work

---

## Scope

### In Scope
- [x] Dashboard page structure at `/home` with page header
- [x] 3-3-1 bento grid layout using CSS Grid (responsive to single column on mobile)
- [x] Dashboard data loader (`dashboard-page.loader.ts`) with parallel fetching via `Promise.all()`
- [x] Skeleton loading states for each card using shadcn Skeleton
- [x] Empty state components for each card with guiding CTAs
- [x] Quick Actions Panel with contextual buttons based on user state
- [x] Presentation Outline Table with edit navigation using shadcn Table
- [x] TypeScript types for dashboard data structures
- [x] Unit tests for data loader

### Out of Scope
- [x] Chart components (Progress Visualization initiative)
- [x] Activity tracking system (Activity & Task Tracking initiative)
- [x] Kanban summary card (Activity & Task Tracking initiative)
- [x] Cal.com integration (Cal.com Coaching initiative)
- [x] Dashboard customization/widget rearrangement (v2+)

---

## Dependencies

### Blocks
- I2: Progress Visualization (needs dashboard cards to render into)
- I3: Activity & Task Tracking (needs dashboard cards and layout)
- I4: Cal.com Coaching Integration (needs dashboard card)

### Blocked By
- None (foundation initiative)

### Parallel With
- None (must complete before Group 1 initiatives)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Standard CSS Grid, existing loader patterns, shadcn components |
| External dependencies | Low | No external APIs; uses existing Supabase tables |
| Unknowns | Low | All patterns exist in codebase (team dashboard, members page) |
| Reuse potential | High | Loader pattern, table components, card layouts all reusable |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Dashboard Page Layout**: Grid structure, page header, responsive breakpoints
2. **Data Loader Infrastructure**: Parallel fetching, caching, error handling
3. **Empty State System**: Configurable empty states with CTAs for each card
4. **Quick Actions Panel**: Contextual CTA buttons based on user state
5. **Presentation Outline Table**: List presentations with status, edit navigation

### Suggested Order
1. Dashboard Page Layout (foundation for all cards)
2. Data Loader Infrastructure (required for any data display)
3. Presentation Outline Table (demonstrates data loading pattern)
4. Quick Actions Panel (provides immediate engagement value)
5. Empty State System (polish for new user experience)

---

## Technical Notes

### Existing Patterns to Follow
- **Loader pattern**: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
- **Page structure**: `apps/web/app/home/[account]/page.tsx` (team dashboard)
- **Table component**: `@kit/ui/table` with shadcn styling
- **Card component**: `@kit/ui/card` for dashboard cards

### Data Sources
| Card | Data Source | Query |
|------|-------------|-------|
| Quick Actions | course_progress, survey_responses, building_blocks_submissions | Status checks |
| Presentations | building_blocks_submissions | List with pagination |

### Layout Specifications
```
Desktop (>=1024px): 3-3-1 grid
Tablet (>=768px): 2-2-1 grid
Mobile (<768px): 1-1-1 stack
Gap: 16px (md:24px)
```

---

## Validation Commands
```bash
# Verify page loads at /home
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/home

# Run unit tests for loader
pnpm --filter web test:unit -- dashboard

# Check TypeScript types
pnpm typecheck

# Lighthouse performance check (target >80)
npx lighthouse http://localhost:3000/home --output=json --chrome-flags="--headless"
```

---

## Related Files
- Spec: `../spec.md`
- Research: `../research-library/perplexity-dashboard-design-patterns.md`
- Existing loader: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
- Features: `./<feature-#>-<slug>/` (created in next phase)
