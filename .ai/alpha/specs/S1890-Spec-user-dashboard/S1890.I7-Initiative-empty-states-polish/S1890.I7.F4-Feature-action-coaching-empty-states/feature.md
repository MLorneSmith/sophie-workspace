# Feature: Action & Coaching Empty States

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I7 |
| **Feature ID** | S1890.I7.F4 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 4 |

## Description
Design and implement engaging empty states for the Presentation Outline Table and Coaching Sessions Widget. The Presentation Table shows a CTA to create the first presentation. The Coaching Widget displays a value proposition and "Book Session" CTA. Note: Quick Actions Panel always shows actions, so no empty state needed.

## User Story
**As a** new user with no presentations or coaching sessions
**I want to** see compelling empty states that explain these features
**So that** I understand their value and am motivated to engage

## Acceptance Criteria

### Must Have
- [ ] Presentation Table empty state displays "Create your first presentation" heading
- [ ] Presentation Table empty state shows sample table structure (greyed headers)
- [ ] Presentation Table empty state has "New Presentation" CTA linking to `/home/ai`
- [ ] Coaching Widget empty state displays "Accelerate your learning with coaching" heading
- [ ] Coaching Widget empty state includes brief value proposition text
- [ ] Coaching Widget empty state has "Book Session" CTA triggering Cal.com embed or linking to `/home/coaching`
- [ ] Both empty states use consistent EmptyState component styling
- [ ] Both empty states render correctly in dark mode

### Nice to Have
- [ ] Presentation Table shows sample row preview (greyed out)
- [ ] Coaching Widget shows coach avatar/name for personalization

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | 2 empty state components + visual placeholders | New |
| **Logic** | Conditional rendering in parent widgets | Modify |
| **Data** | N/A (uses existing data from I2/I6) | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Empty states inline with extracted visual preview components
**Rationale**: Presentation Table benefits from showing structure preview. Coaching Widget should promote value and make booking frictionless. Both serve distinct conversion goals.

### Key Architectural Choices
1. Presentation Table empty state shows greyed-out table headers as preview
2. Coaching Widget empty state embeds value proposition from research findings
3. "Book Session" CTA can open Cal.com modal directly (same as booking page)

### Trade-offs Accepted
- Table preview requires maintaining sync with actual table structure
- Coaching empty state is more marketing-focused than other technical empty states

## Required Credentials
> None required - uses existing routing and Cal.com embed.

## Dependencies

### Blocks
- None

### Blocked By
- F1: Loading Skeletons (skeleton patterns inform empty state structure)
- S1890.I5.F2: Presentation Outline Table (widget must exist to add empty state)
- S1890.I6.F2: Coaching Sessions Widget (widget must exist to add empty state)

### Parallel With
- F2: Progress Empty States (independent widgets)
- F3: Task/Activity Empty States (independent widgets)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/empty-states/table-structure-preview.tsx` - Table headers preview
- `apps/web/app/home/(user)/_components/empty-states/coaching-value-prop.tsx` - Coaching benefits

### Modified Files
- `apps/web/app/home/(user)/_components/presentation-table.tsx` - Add empty state condition
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Add empty state condition

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Table Structure Preview**: Create greyed-out table headers component
2. **Coaching Value Proposition**: Create benefit highlights component
3. **Presentation Table Empty State**: Integrate preview + messaging + CTA
4. **Coaching Widget Empty State**: Integrate value prop + messaging + CTA
5. **Dark mode verification**: Test both states in dark mode

### Suggested Order
1. Table structure preview component (T1)
2. Presentation Table empty state (T2)
3. Coaching value proposition component (T3)
4. Coaching Widget empty state (T4)
5. Dark mode and accessibility verification (T5)

## Validation Commands
```bash
# Verify empty state components
test -f apps/web/app/home/\(user\)/_components/empty-states/table-structure-preview.tsx && echo "✓ Table preview exists"
test -f apps/web/app/home/\(user\)/_components/empty-states/coaching-value-prop.tsx && echo "✓ Coaching value prop exists"

# Check for empty state logic in widgets
grep -q "presentations.length === 0\|isEmpty" apps/web/app/home/\(user\)/_components/presentation-table.tsx && echo "✓ Table empty state logic"
grep -q "sessions.length === 0\|isEmpty\|!hasBookings" apps/web/app/home/\(user\)/_components/coaching-sessions-widget.tsx && echo "✓ Coaching empty state logic"

# Typecheck and lint
pnpm typecheck && pnpm lint

# Visual verification
# Create test account with no presentations/bookings and verify empty states render
```

## Empty State Design Details

### Presentation Table Empty State
| Element | Value |
|---------|-------|
| **Heading** | "Create your first presentation" |
| **Description** | "Build AI-powered presentation outlines and track them here" |
| **CTA** | "New Presentation" |
| **CTA Target** | `/home/ai` |
| **Visual** | Greyed-out table headers: Title, Last Updated, Slides, Status, Actions |

### Coaching Widget Empty State
| Element | Value |
|---------|-------|
| **Heading** | "Accelerate your learning with coaching" |
| **Description** | "Book a 1:1 session with our presentation experts to get personalized feedback and guidance" |
| **CTA** | "Book Session" |
| **CTA Target** | Cal.com embed modal or `/home/coaching` |
| **Visual** | None or subtle coaching-related icon |

### Note on Quick Actions Panel
The Quick Actions Panel always displays contextual actions based on user state and does NOT have an empty state. It shows different actions:
- Course not started → "Start Your Journey"
- Course in progress → "Continue Course"
- No assessment → "Take Skills Assessment"
- Has drafts → "Review Storyboard"
- Always → "New Presentation"

## Related Files
- Initiative: `../initiative.md`
- EmptyState component: `packages/ui/src/makerkit/empty-state.tsx`
- DataTable component: `packages/ui/src/makerkit/data-table.tsx`
- Existing Cal.com embed: `apps/web/app/home/(user)/coaching/_components/calendar.tsx`
- Research: `../../../research-library/perplexity-dashboard-empty-states.md`
- Tasks: `./tasks.json` (created in next phase)
