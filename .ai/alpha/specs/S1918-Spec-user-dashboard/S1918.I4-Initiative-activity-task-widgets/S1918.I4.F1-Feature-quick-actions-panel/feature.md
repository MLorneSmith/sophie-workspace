# Feature: Quick Actions Panel Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I4 |
| **Feature ID** | S1918.I4.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
A widget displaying contextual call-to-action buttons based on the user's current state. Shows relevant actions like "Continue Course" (if in progress) or "Start Course" (if not started), "New Presentation", "Complete Assessment" or "Retake Assessment", and "Review Storyboard" (if drafts exist). This widget helps users immediately take their next meaningful action without thinking.

## User Story
**As a** returning learner
**I want to** see the most relevant next actions at a glance
**So that** I can quickly continue my learning journey without navigating menus

## Acceptance Criteria

### Must Have
- [ ] Widget displays in dashboard grid slot (right column, row 2)
- [ ] Shows "Continue Course" button if course is in progress (completion > 0% and < 100%)
- [ ] Shows "Start Course" button if course not started (0%)
- [ ] Shows "Complete Assessment" if no survey response exists, "Retake Assessment" if exists
- [ ] Shows "New Presentation" button always
- [ ] Shows "Review Storyboard" if user has draft presentations
- [ ] Empty state shows welcome message with "Get Started" guidance
- [ ] All buttons link to correct routes (/home/course, /home/assessment, /home/ai/blocks, /home/ai/storyboard)

### Nice to Have
- [ ] Visual hierarchy with primary action emphasized
- [ ] Subtle animations on button hover
- [ ] Tooltips explaining each action

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `quick-actions-widget.tsx` | New |
| **Logic** | Conditional rendering based on props | New |
| **Data** | Props passed from dashboard loader (I2) | Existing |
| **Database** | course_progress, survey_responses, building_blocks_submissions | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Component is simple conditional rendering. Data comes from dashboard loader (already fetched). No client state needed - purely presentational with server-passed props.

### Key Architectural Choices
1. Server component receiving pre-fetched data as props (no client-side data fetching)
2. Use existing Button and Card components from shadcn/ui
3. Conditional rendering based on boolean flags from loader

### Trade-offs Accepted
- Props-based design couples widget to specific loader shape (acceptable - dashboard is single use case)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Container | Card, CardHeader, CardContent | shadcn/ui | Consistent with other dashboard widgets |
| Action Buttons | Button | shadcn/ui | Standard interactive element |
| Icons | Lucide icons | lucide-react | Consistent icon library |

**Components to Install**: None required - all components already in packages/ui

## Required Credentials
> Environment variables required for this feature to function.

None required - uses only internal database data.

## Dependencies

### Blocks
- F2, F3, F4 (provides pattern for other widgets)

### Blocked By
- S1918.I1.F1: Dashboard Page & Grid (provides grid slot)
- S1918.I2.F1: Dashboard Types (provides QuickActionsData type)
- S1918.I2.F2: Dashboard Loader (provides hasStartedCourse, hasSurveyResponse, hasDraftPresentations flags)

### Parallel With
- None (simplest widget, should be implemented first in I4)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/quick-actions-widget.tsx` - Widget component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and render widget in grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create QuickActionsData type**: Define TypeScript interface for widget props
2. **Create quick-actions-widget.tsx**: Build the widget component with conditional rendering
3. **Add widget to dashboard page**: Import and place in grid slot
4. **Style and polish**: Ensure visual consistency with design system

### Suggested Order
1. Types → 2. Component → 3. Integration → 4. Polish

## Validation Commands
```bash
# Verify widget file exists
test -f apps/web/app/home/\(user\)/_components/quick-actions-widget.tsx && echo "✓ Quick actions widget exists"

# Type check
pnpm typecheck

# Lint check
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `packages/ui/src/shadcn/card.tsx`
- Reference: `packages/ui/src/shadcn/button.tsx`
- Pattern: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
