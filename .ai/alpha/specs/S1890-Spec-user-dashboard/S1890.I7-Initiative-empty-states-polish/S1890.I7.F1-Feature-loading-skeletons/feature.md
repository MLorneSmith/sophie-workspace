# Feature: Loading Skeletons

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I7 |
| **Feature ID** | S1890.I7.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Implement skeleton loading animations for all 7 dashboard widgets. Each skeleton matches the layout of its corresponding widget, providing visual continuity during data fetching and preventing layout shift.

## User Story
**As a** returning user loading the dashboard
**I want to** see placeholder skeletons that match widget layouts
**So that** I understand content is loading and the page feels responsive

## Acceptance Criteria

### Must Have
- [ ] Skeleton component for Course Progress Radial Chart (circular placeholder)
- [ ] Skeleton component for Skills Spider Diagram (pentagon/radar placeholder)
- [ ] Skeleton component for Kanban Summary Card (list item placeholders)
- [ ] Skeleton component for Recent Activity Feed (timeline placeholders)
- [ ] Skeleton component for Quick Actions Panel (button placeholders)
- [ ] Skeleton component for Coaching Sessions Widget (card placeholders)
- [ ] Skeleton component for Presentation Table (row placeholders)
- [ ] All skeletons use consistent pulse animation from @kit/ui/skeleton
- [ ] Skeletons maintain widget card structure (CardHeader, CardContent)

### Nice to Have
- [ ] Staggered animation timing for visual interest
- [ ] Skeleton shimmer effect instead of pulse

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | 7 skeleton components in `_components/skeletons/` | New |
| **Logic** | Re-export barrel file for imports | New |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Create dedicated skeleton components that mirror widget structure
**Rationale**: Dedicated components ensure skeletons evolve with widgets and maintain layout consistency. Using existing Skeleton primitive from @kit/ui ensures animation consistency.

### Key Architectural Choices
1. Create `_components/skeletons/` directory with one file per widget skeleton
2. Export all skeletons from `_components/skeletons/index.ts` barrel file
3. Use CSS Grid/Flexbox matching actual widget layouts for zero layout shift

### Trade-offs Accepted
- 7 separate skeleton files increases file count but improves maintainability
- Could have used inline skeletons but dedicated components are more testable

## Required Credentials
> None required - skeletons are purely presentational components with no external dependencies.

## Dependencies

### Blocks
- F2: Progress Empty States (needs skeleton patterns established)
- F3: Task/Activity Empty States (needs skeleton patterns established)
- F4: Action/Coaching Empty States (needs skeleton patterns established)
- F5: Error Boundaries (needs skeleton patterns established)

### Blocked By
- S1890.I3.F1: Skills Spider Diagram (needs widget structure reference)
- S1890.I3.F2: Course Progress Radial Chart (needs widget structure reference)
- S1890.I4.F1: Kanban Summary Card (needs widget structure reference)
- S1890.I4.F3: Activity Feed Timeline (needs widget structure reference)
- S1890.I5.F1: Quick Actions Panel (needs widget structure reference)
- S1890.I5.F2: Presentation Outline Table (needs widget structure reference)
- S1890.I6.F2: Coaching Sessions Widget (needs widget structure reference)

### Parallel With
- None (F1 is foundation for all other I7 features)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/skeletons/index.ts` - Barrel export
- `apps/web/app/home/(user)/_components/skeletons/course-progress-skeleton.tsx` - Radial chart skeleton
- `apps/web/app/home/(user)/_components/skeletons/skills-spider-skeleton.tsx` - Radar chart skeleton
- `apps/web/app/home/(user)/_components/skeletons/kanban-summary-skeleton.tsx` - Task list skeleton
- `apps/web/app/home/(user)/_components/skeletons/activity-feed-skeleton.tsx` - Timeline skeleton
- `apps/web/app/home/(user)/_components/skeletons/quick-actions-skeleton.tsx` - Button group skeleton
- `apps/web/app/home/(user)/_components/skeletons/coaching-sessions-skeleton.tsx` - Sessions card skeleton
- `apps/web/app/home/(user)/_components/skeletons/presentation-table-skeleton.tsx` - Table rows skeleton

### Modified Files
- May need to update widget components from I3-I6 to accept skeleton prop or use Suspense

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create skeletons directory structure**: Set up folder and barrel export
2. **Chart widget skeletons**: Radial progress + spider diagram skeletons
3. **Card widget skeletons**: Kanban + activity + coaching skeletons
4. **Table widget skeletons**: Quick actions + presentation table skeletons
5. **Integration with Suspense**: Wire skeletons as Suspense fallbacks

### Suggested Order
1. Directory structure and barrel (T1)
2. Chart skeletons (T2) - highest complexity due to circular/radar shapes
3. Card skeletons (T3) - straightforward list/card layouts
4. Table skeletons (T4) - data table patterns
5. Suspense integration (T5) - final wiring

## Validation Commands
```bash
# Verify skeleton directory exists
test -d apps/web/app/home/\(user\)/_components/skeletons && echo "✓ Skeletons directory exists"

# Verify all 7 skeleton files
ls apps/web/app/home/\(user\)/_components/skeletons/*.tsx 2>/dev/null | wc -l | xargs -I {} test {} -ge 7 && echo "✓ All skeleton files exist"

# Verify barrel export
test -f apps/web/app/home/\(user\)/_components/skeletons/index.ts && echo "✓ Barrel export exists"

# Typecheck
pnpm typecheck

# Visual verification in dev
# Navigate to /home and observe skeleton states during loading
```

## Related Files
- Initiative: `../initiative.md`
- Skeleton component: `packages/ui/src/shadcn/skeleton.tsx`
- Card component: `packages/ui/src/shadcn/card.tsx`
- Tasks: `./tasks.json` (created in next phase)
