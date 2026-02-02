# Feature: Progress Widget Empty States

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I7 |
| **Feature ID** | S1890.I7.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Design and implement engaging empty states for the Course Progress Radial Chart and Skills Spider Diagram widgets. These empty states guide new users to begin their learning journey with contextual messaging and clear CTAs.

## User Story
**As a** new user with no course progress or skills assessment
**I want to** see helpful empty states with guidance
**So that** I understand what these widgets will show and am motivated to take action

## Acceptance Criteria

### Must Have
- [ ] Course Progress empty state shows radial chart outline at 0%
- [ ] Course Progress empty state displays "Start your learning journey" heading
- [ ] Course Progress empty state has "Begin Course" CTA linking to `/home/course`
- [ ] Skills Spider empty state shows spider web grid with dashed lines (no data points)
- [ ] Skills Spider empty state displays "Discover your presentation strengths" heading
- [ ] Skills Spider empty state has "Take Assessment" CTA linking to `/home/assessment`
- [ ] Both empty states use consistent styling with EmptyState component
- [ ] Both empty states render correctly in dark mode
- [ ] CTAs are accessible with proper focus states

### Nice to Have
- [ ] Subtle animation on empty chart outlines
- [ ] Different copy for "no data yet" vs "data cleared"

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | 2 empty state components + visual placeholders | New |
| **Logic** | Conditional rendering in parent widgets | Modify |
| **Data** | N/A (uses existing data from I2) | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Inline empty states within widget components with extracted reusable elements
**Rationale**: Empty states are tightly coupled to widget data logic. Keeping them inline reduces prop drilling while extracting the visual placeholder (chart outline) for reuse.

### Key Architectural Choices
1. Each widget component contains its own empty state rendering logic
2. Extract `RadialProgressOutline` and `SpiderWebOutline` as separate visual components
3. Use standard EmptyState wrapper for consistency but add custom chart visuals inside

### Trade-offs Accepted
- Empty state visuals are widget-specific, limiting reuse
- Chart outlines are custom SVG/Recharts elements requiring design effort

## Required Credentials
> None required - empty states use existing routing and no external APIs.

## Dependencies

### Blocks
- None

### Blocked By
- F1: Loading Skeletons (skeleton patterns inform empty state structure)
- S1890.I3.F1: Skills Spider Diagram (widget must exist to add empty state)
- S1890.I3.F2: Course Progress Radial Chart (widget must exist to add empty state)

### Parallel With
- F3: Task/Activity Empty States (independent widgets)
- F4: Action/Coaching Empty States (independent widgets)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/empty-states/radial-progress-outline.tsx` - Empty chart visual
- `apps/web/app/home/(user)/_components/empty-states/spider-web-outline.tsx` - Empty radar visual

### Modified Files
- `apps/web/app/home/(user)/_components/course-progress-chart.tsx` - Add empty state condition
- `apps/web/app/home/(user)/_components/skills-spider-diagram.tsx` - Add empty state condition

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create empty-states directory**: Set up folder structure
2. **Radial Progress Outline**: SVG outline showing 0% progress circle
3. **Spider Web Outline**: Radar chart grid with no data points
4. **Course Progress Empty State**: Integrate outline + messaging + CTA
5. **Skills Spider Empty State**: Integrate outline + messaging + CTA
6. **Dark mode verification**: Test both states in dark mode

### Suggested Order
1. Directory setup (T1)
2. Radial outline component (T2)
3. Course Progress empty state (T3)
4. Spider web outline component (T4)
5. Skills Spider empty state (T5)
6. Dark mode verification (T6)

## Validation Commands
```bash
# Verify empty states directory
test -d apps/web/app/home/\(user\)/_components/empty-states && echo "✓ Empty states directory exists"

# Verify outline components
test -f apps/web/app/home/\(user\)/_components/empty-states/radial-progress-outline.tsx && echo "✓ Radial outline exists"
test -f apps/web/app/home/\(user\)/_components/empty-states/spider-web-outline.tsx && echo "✓ Spider outline exists"

# Check for empty state logic in widgets
grep -q "length === 0\|isEmpty\|no data" apps/web/app/home/\(user\)/_components/course-progress-chart.tsx && echo "✓ Course empty state logic"
grep -q "length === 0\|isEmpty\|no data" apps/web/app/home/\(user\)/_components/skills-spider-diagram.tsx && echo "✓ Spider empty state logic"

# Typecheck and lint
pnpm typecheck && pnpm lint

# Visual verification
# Create test account with no progress/assessment and verify empty states render
```

## Empty State Design Details

### Course Progress Empty State
| Element | Value |
|---------|-------|
| **Heading** | "Start your learning journey" |
| **Description** | "Complete lessons to track your progress here" |
| **CTA** | "Begin Course" |
| **CTA Target** | `/home/course` |
| **Visual** | Radial chart outline at 0% with dashed stroke |

### Skills Spider Empty State
| Element | Value |
|---------|-------|
| **Heading** | "Discover your presentation strengths" |
| **Description** | "Take the skills assessment to reveal your 5S profile" |
| **CTA** | "Take Assessment" |
| **CTA Target** | `/home/assessment` |
| **Visual** | Pentagon spider web grid with dashed lines, no data points |

## Related Files
- Initiative: `../initiative.md`
- EmptyState component: `packages/ui/src/makerkit/empty-state.tsx`
- Existing RadarChart: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Existing RadialProgress: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- Research: `../../../research-library/perplexity-dashboard-empty-states.md`
- Tasks: `./tasks.json` (created in next phase)
