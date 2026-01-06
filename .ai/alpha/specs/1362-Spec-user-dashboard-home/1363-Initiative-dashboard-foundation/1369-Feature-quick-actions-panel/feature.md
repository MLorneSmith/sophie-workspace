# Feature: Quick Actions Panel

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | #1363 |
| **Feature ID** | 1363-F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Display a panel of 3-4 contextual quick action cards on the dashboard. Each action shows an icon, title, brief description with stats (e.g., "3 in progress"), and navigates to the relevant section. Actions are contextually prioritized based on user state (e.g., highlight "Create Presentation" for new users, "Continue Course" for users with progress).

## User Story
**As a** SlideHeroes user
**I want to** see quick action buttons on my dashboard
**So that** I can immediately take the next most relevant action without navigating menus

## Acceptance Criteria

### Must Have
- [ ] Panel displays 4 action cards in 2x2 grid (1 column on mobile)
- [ ] Each card shows: Icon, Title, Description with stat count, Click to navigate
- [ ] Actions include: Create Presentation, Continue Learning, View Submissions, Take Assessment
- [ ] Stats display correctly (e.g., "2 in progress", "0 presentations")
- [ ] Links navigate to correct destination pages
- [ ] Passes `pnpm typecheck` with no errors

### Nice to Have
- [ ] Highlight recommended next action with accent border
- [ ] Animate card hover state
- [ ] Show "New" badge for recently available actions

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | QuickActionsPanel, ActionCard components | New |
| **Logic** | Stats derivation, priority ordering | New |
| **Data** | Aggregated counts from loader | Existing (from F1 loader) |
| **Database** | course_progress, building_blocks_submissions, survey_responses | Existing |

## Architecture Decision

**Approach**: Pragmatic - Simple card grid with conditional styling
**Rationale**: Quick actions are static in structure, only stats are dynamic. Using basic Card components with minimal logic keeps this straightforward.

### Key Architectural Choices
1. Client component for hover interactions and navigation
2. Stats computed in loader, passed as props
3. Action config defined as static array with dynamic stat injection

### Trade-offs Accepted
- Fixed action list (no user customization in v1)
- All actions always visible (no conditional show/hide based on state)

## Dependencies

### Blocks
- None

### Blocked By
- 1363-F1: Dashboard Page & Grid (needs grid slot and loader data)

### Parallel With
- 1363-F2: Presentation Outline Table (both render in grid)
- 1363-F4: Empty State System (can develop in parallel)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/quick-actions-panel.tsx` - Panel component
- `apps/web/app/home/(user)/_components/action-card.tsx` - Individual action card
- `apps/web/app/home/(user)/_components/__tests__/quick-actions-panel.test.tsx` - Tests

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Render panel in grid slot
- `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` - Add QuickActionsStats type
- `apps/web/public/locales/en/common.json` - Add action translations

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create action card component**: Icon + title + description layout
2. **Create quick actions panel**: 2x2 grid of action cards
3. **Define action configuration**: Static config array with routes, icons
4. **Implement stats display**: Pass stats from loader, inject into config
5. **Add hover/focus states**: Visual feedback on interaction
6. **Wire to dashboard page**: Render in grid slot with loader data
7. **Add translations**: i18n keys for action titles/descriptions
8. **Write component tests**: Test rendering, stats display, navigation

### Suggested Order
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

## Validation Commands
```bash
# Check TypeScript types
pnpm typecheck

# Run component tests
pnpm --filter web test:unit -- quick-actions-panel

# Visual check (manual)
# Visit http://localhost:3000/home and verify panel renders

# Navigation test (manual)
# Click each action and verify correct destination
```

## Related Files
- Initiative: `../initiative.md`
- Card component: `packages/ui/src/shadcn/card.tsx`
- CardButton component: `packages/ui/src/makerkit/card-button.tsx`
- Lucide icons: `lucide-react`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
