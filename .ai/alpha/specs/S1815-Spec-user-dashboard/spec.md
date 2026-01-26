# Project Specification: User Dashboard

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S1815 |
| **GitHub Issue** | #1815 |
| **Document Owner** | Alpha Spec Agent |
| **Created** | 2026-01-26 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
A comprehensive user dashboard at `/home` providing at-a-glance visibility into course progress, skill assessments, tasks, activities, presentations, and coaching sessions.

### Press Release Headline
> "SlideHeroes announces User Dashboard enabling learners to track their complete learning journey in one unified view"

### Elevator Pitch (30 seconds)
SlideHeroes users currently navigate between multiple pages to understand their progress. The new User Dashboard consolidates seven key widgets - course progress, skill assessment spider chart, kanban summary, activity feed, quick actions, coaching sessions, and presentations table - into a single, actionable home screen that reduces time-to-insight from minutes to seconds.

---

## 2. Problem Statement

### Problem Description
Users currently have no centralized view of their learning progress and activities. To understand their overall status, they must navigate to multiple separate pages: the course page for progress, assessment page for survey results, kanban for tasks, and presentations list for outlines. This fragmented experience creates friction and reduces engagement.

### Who Experiences This Problem?
- **Active learners**: Users engaged in the presentation skills course who want to track their progress
- **Returning users**: Users who haven't logged in recently and need to quickly re-orient themselves
- **Coaching clients**: Users with scheduled coaching sessions who need quick access to session details

### Current Alternatives
Users currently:
- Navigate to `/home/course` for course progress
- Navigate to `/home/assessment` for survey/skill data
- Navigate to `/home/kanban` for task status
- Navigate to `/home/presentations` for presentation outlines
- Use external calendar for coaching session tracking

### Impact of Not Solving
- **Business impact**: Lower engagement metrics, higher churn risk, reduced course completion rates
- **User impact**: Frustration from fragmented experience, difficulty tracking progress, missed coaching sessions
- **Competitive impact**: Modern learning platforms provide unified dashboards; lack of one positions SlideHeroes as dated

---

## 3. Vision & Goals

### Product Vision
A personalized command center where users instantly see their learning journey, upcoming tasks, recent activities, and next actions - eliminating the need to hunt for information across multiple pages.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Increase home page engagement | /home page views per user per week | +50% vs baseline (estimate 2 → 3 views/user/week) | Analytics dashboard |
| G2: Reduce navigation clicks to key features | Average clicks to reach key info | -60% (from 3+ clicks to 1 click) | User session recording analysis |
| G3: Improve course completion rate | Users completing course modules | +15% increase in weekly module completions | Course progress database metrics |
| G4: Increase coaching session attendance | Booking show-up rate | +20% improvement in session attendance | Cal.com booking analytics |

### Strategic Alignment
This dashboard supports the core business objective of improving user engagement and course completion rates. Engaged users who complete the course are more likely to upgrade to premium features and refer others.

---

## 4. Target Users

### Primary Persona
**Name**: Learning Lisa
**Role**: Professional preparing for an important presentation
**Goals**: Complete the presentation skills course, track improvement in specific areas, schedule coaching to refine delivery
**Pain Points**: Forgets where she left off, doesn't know which skills need work, loses track of coaching sessions
**Quote**: "I want to log in and immediately know what I should focus on today."

### Secondary Personas
1. **Returning Roger**: A user who completed some course work weeks ago and needs to quickly remember their progress and next steps
2. **Coaching Chris**: A premium user who primarily uses the platform for coaching sessions and presentation review

### Anti-Personas (Who This Is NOT For)
- **Admin users**: This dashboard is for end-users, not administrators
- **Anonymous visitors**: Dashboard requires authentication
- **Team managers**: Team-level dashboards are out of scope (uses `/home/[account]` route)

---

## 5. Solution Overview

### Proposed Solution
A 3-row, 7-widget dashboard grid at `/home/(user)` that aggregates data from existing database tables and external services (Cal.com) into a unified, responsive interface.

### Key Capabilities

1. **Course Progress Radial Widget**: Circular progress indicator showing overall course completion percentage with current lesson context
2. **Spider Chart Assessment Widget**: Radar chart visualization of self-assessment survey scores across skill categories
3. **Kanban Summary Widget**: Card showing current "Doing" tasks and the next prioritized task from the kanban board
4. **Activity Feed Widget**: Timeline of recent user activities including presentations, lessons, quizzes, and assessments
5. **Quick Actions Panel**: Contextual call-to-action buttons based on user state (continue course, new presentation, etc.)
6. **Coaching Sessions Widget**: Display upcoming coaching sessions with join/reschedule options, or booking CTA if none scheduled
7. **Presentations Table Widget**: Full-width table of user presentations with quick edit access to outlines

### Customer Journey

1. User logs into SlideHeroes and lands on `/home`
2. User immediately sees their course progress (radial) and skill assessment (spider chart) in the first row
3. User notices their current task and activity history in the second row
4. User takes a contextual quick action (e.g., "Continue Course")
5. User scrolls down to review or edit recent presentations in the table
6. User returns daily, building engagement habits through clear progress visibility

### Hypothetical Customer Quote
> "Finally! I can see everything I need in one place. I know exactly where I am in the course and what to do next."
> — Learning Lisa, Marketing Manager

### Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (<768px) | Single column, stacked widgets | Widgets stack vertically, table becomes horizontally scrollable |
| Tablet (768-1024px) | 2-column grid for top rows, full-width table | Spider chart and radial side-by-side, kanban stacks with activity |
| Desktop (>1024px) | 3-3-1 grid layout | Three widgets per row, table full width |

---

## 6. Scope Definition

### In Scope

- [x] Course progress radial widget (read-only display)
- [x] Spider chart widget from survey_responses.category_scores
- [x] Kanban summary widget (tasks with status 'do' and 'doing')
- [x] Activity feed showing last 10 user activities
- [x] Quick actions panel with contextual CTAs
- [x] Coaching sessions widget with Cal.com integration
- [x] Presentations table with edit outline links
- [x] Responsive layout (mobile, tablet, desktop)
- [x] Skeleton loading states for all widgets
- [x] Empty states for widgets without data
- [x] Server-side data loading with parallel fetching

### Out of Scope

- [ ] Drag-and-drop widget customization
- [ ] Widget preferences/personalization settings
- [ ] Real-time WebSocket updates (use client-side refresh)
- [ ] Admin dashboard views
- [ ] Team dashboard views (separate `/home/[account]` route)
- [ ] Notification center or badge counts
- [ ] Data export functionality
- [ ] Charts with historical trend lines
- [ ] Gamification elements (badges, streaks, leaderboards)

### Future Considerations (v2+)

- User-configurable widget layout via drag-and-drop
- Achievement badges for course milestones
- Streak tracking for daily engagement
- AI-powered next-step recommendations
- Real-time activity feed via Supabase subscriptions
- Performance trend charts over time

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| `public.course_progress` | DB Query | User's course completion percentage, current_lesson_id |
| `public.lesson_progress` | DB Query | Individual lesson completion tracking |
| `public.survey_responses` | DB Query | `category_scores` JSONB field for spider chart data |
| `public.tasks` | DB Query | Filter by account_id and status ('do', 'doing') |
| `public.building_blocks_submissions` | DB Query | User presentations ordered by updated_at |
| `public.quiz_attempts` | DB Query | Recent quiz completions for activity feed |
| `payload.courses` / `payload.course_lessons` | DB Query | Course/lesson metadata for display names |
| Cal.com API | External API | `@calcom/atoms` package for booking display and actions |

### Technical Constraints

- **Performance**: Dashboard must achieve < 1.5s LCP; use parallel data fetching with `Promise.all()`
- **Security**: All data queries protected by RLS; no admin client usage needed
- **Compliance**: No PII displayed beyond user's own data
- **Scalability**: Widget queries should use indexed columns; avoid N+1 query patterns

### Technology Preferences/Mandates

- **Charts**: Recharts (already installed, v3.5.1) with existing `ChartContainer` wrapper
- **Tables**: Existing `@kit/ui/data-table` component from Makerkit
- **Coaching**: `@calcom/atoms` package for native React integration
- **Loading States**: `@kit/ui/skeleton` component
- **Cards**: `@kit/ui/card` component

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Cal.com API availability | External | Medium | Graceful degradation if API unavailable |
| `@calcom/atoms` package | External | Low | Well-maintained, 36k+ GitHub stars |
| Recharts library | External | Low | Already in use, stable |
| Survey response data | Internal | Low | Required: user must complete assessment |
| Course progress data | Internal | Low | Required: user must start course |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Users have started the course**: Course progress widget assumes `course_progress` record exists — *Validation: Check for null/empty and show empty state*
2. **Assessment survey completed**: Spider chart assumes `survey_responses` with `category_scores` exists — *Validation: Check completed flag and show CTA if not*
3. **Cal.com configured**: Coaching widget assumes Cal.com integration is set up — *Validation: Feature flag or environment variable check*
4. **Single course model**: Dashboard assumes one primary course per user — *Validation: Query first/active course record*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Cal.com API rate limits or downtime | Medium | Medium | Cache booking data, show graceful error state | Backend |
| R2 | Large number of presentations slows table | Low | Low | Implement pagination, limit initial load to 10 | Frontend |
| R3 | No assessment data for spider chart | Medium | Low | Display compelling CTA to complete assessment | Frontend |
| R4 | Mobile layout complexity | Medium | Medium | Thorough responsive testing across devices | Frontend |
| R5 | Course structure changes break progress widget | Low | Medium | Use defensive coding for course metadata lookups | Frontend |

### Open Questions

1. [x] What Cal.com event type slug should be used for coaching bookings? — *Requires Spike: Check Cal.com configuration*
2. [x] Should activity feed include AI usage events or just learning activities? — *Decision: Learning activities only for v1*
3. [ ] What is the coach username for Cal.com booking integration? — *Requires: Configuration or environment variable*

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [x] All 7 widgets implemented and functional
- [x] Responsive layout works on mobile, tablet, and desktop
- [x] Loading states (skeletons) display during data fetch
- [x] Empty states display when no data available
- [x] All widgets fetch data in parallel for performance
- [x] Accessibility: keyboard navigation and screen reader support
- [x] Unit tests for data loading functions
- [x] E2E test for dashboard happy path

### Launch Criteria

- All widgets render without errors for users with data
- Empty states display correctly for new users
- Cal.com widget gracefully handles API unavailability
- Performance: LCP < 1.5s on desktop, < 2.5s on mobile
- No TypeScript errors or lint warnings
- Code review approved

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| /home page views per user | 2/week (estimate) | 3/week (+50%) | 4 weeks post-launch |
| Time on /home page | 15 seconds (estimate) | 45 seconds (+200%) | 4 weeks post-launch |
| Course module completion rate | Current baseline | +15% | 8 weeks post-launch |
| Coaching session attendance | Current baseline | +20% | 8 weeks post-launch |

---

## 10. Decomposition Hints

### Standard Initiative Categories to Consider

1. **Foundation/Layout** (P0) - Dashboard page shell, responsive grid, routing
2. **Data Layer** (P0/P1) - Unified loader with parallel fetching, type definitions
3. **Progress/Assessment Widgets** (P1) - Course progress radial, spider chart
4. **Activity/Task Widgets** (P1) - Kanban summary, activity feed, quick actions
5. **External Integration** (P2) - Coaching sessions with Cal.com (higher risk)
6. **Polish & Edge Cases** (P2) - Presentations table, empty states, loading states, accessibility

### Candidate Initiatives

1. **Dashboard Foundation**: Page shell, responsive grid layout, skeleton loading (maps to Key Capabilities 1-7 layout)
2. **Progress & Assessment Widgets**: Course progress radial chart, spider chart from survey data (maps to Key Capabilities 1, 2)
3. **Activity & Task Widgets**: Kanban summary, activity feed, quick actions panel (maps to Key Capabilities 3, 4, 5)
4. **Coaching Integration**: Cal.com widget with booking display, join links, reschedule (maps to Key Capability 6)
5. **Presentation Table & Polish**: Full-width presentation table, empty states, accessibility (maps to Key Capability 7)

### Suggested Priority Order

1. **P0 - Foundation**: Dashboard shell with responsive grid (blocking all widgets)
2. **P0 - Data Layer**: Dashboard loader with parallel fetching, TypeScript types
3. **P1 - Progress Widgets**: Course progress, spider chart (core value)
4. **P1 - Activity Widgets**: Kanban summary, activity feed, quick actions (engagement)
5. **P2 - Coaching Integration**: Cal.com widget (external dependency, higher risk)
6. **P2 - Polish**: Presentations table, empty states, loading states, accessibility

### Complexity Indicators

| Area | Complexity | Rationale (based on codebase findings) |
|------|------------|----------------------------------------|
| Dashboard Layout | Low | Existing patterns in `dashboard-demo-charts.tsx`, standard Tailwind grid |
| Data Loading | Medium | Need to aggregate 5+ tables; existing loader patterns in `_lib/server/` |
| Course Progress Radial | Medium | No existing radial component; may need custom or shadcn addition |
| Spider Chart | Low | Existing `radar-chart.tsx` in assessment; Recharts already configured |
| Kanban Summary | Low | Simple query on `tasks` table; existing badge components |
| Activity Feed | Medium | No existing component; need to aggregate multiple event types |
| Quick Actions | Low | Conditional rendering of Button components based on state |
| Cal.com Integration | High | New external dependency `@calcom/atoms`; API configuration needed |
| Presentations Table | Low | Existing `data-table` component; simple query |
| Empty/Loading States | Low | Existing `Skeleton` and `EmptyState` components in @kit/ui |

---

## 11. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **Radial Progress** | Circular/ring-shaped progress indicator showing percentage completion |
| **Spider Chart** | Radar chart with multiple axes radiating from center, showing scores across categories |
| **Kanban** | Task management system with columns representing workflow stages (Do, Doing, Done) |
| **SCQAi** | Situation-Complication-Question-Answer-Implementation framework for presentation structure |
| **Building Blocks** | Term for presentation outlines in SlideHeroes |
| **Cal.com Atoms** | React component library for Cal.com booking integration |

### B. Codebase Exploration Results (REQUIRED)

| Component/Pattern Found | File Path | Reusable? | Notes |
|------------------------|-----------|-----------|-------|
| RadarChart component | `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | Yes | Existing spider chart for assessments |
| Dashboard demo with charts | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` | Pattern only | Reference for card layout and chart integration |
| Progress bar | `packages/ui/src/shadcn/progress.tsx` | Yes | Linear progress; need radial variant |
| Card components | `packages/ui/src/shadcn/card.tsx` | Yes | CardHeader, CardContent, CardTitle, etc. |
| Chart container | `packages/ui/src/shadcn/chart.tsx` | Yes | Recharts wrapper with theme support |
| Data table | `packages/ui/src/makerkit/data-table.tsx` | Yes | Full-featured table with sorting, pagination |
| Skeleton loader | `packages/ui/src/shadcn/skeleton.tsx` | Yes | Loading placeholder component |
| Empty state | `packages/ui/src/makerkit/empty-state.tsx` | Yes | Empty data state with CTA |
| Badge component | `packages/ui/src/shadcn/badge.tsx` | Yes | Status indicators (success, warning, etc.) |
| User workspace loader | `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts` | Pattern only | Server-side data loading pattern |
| Home page header | `apps/web/app/home/(user)/_components/home-page-header.tsx` | Yes | Existing page header component |

**Tables/Schemas Identified:**

| Table Name | Location | Purpose |
|------------|----------|---------|
| `course_progress` | `migrations/20250319104726_web_course_system.sql` | User course completion percentage, current lesson |
| `lesson_progress` | `migrations/20250319104726_web_course_system.sql` | Individual lesson completion tracking |
| `survey_responses` | `migrations/20250319104724_web_survey_system.sql` | Spider chart data in `category_scores` JSONB |
| `tasks` | `migrations/20250221144500_web_create_kanban_tables.sql` | Kanban tasks with status enum |
| `building_blocks_submissions` | `migrations/20250211000000_web_create_building_blocks_submissions.sql` | User presentations |
| `quiz_attempts` | `migrations/20250319104726_web_course_system.sql` | Quiz completion for activity feed |

### C. Research Integration (REQUIRED)

| Research File | Key Findings | Spec Section(s) Affected |
|--------------|--------------|-------------------------|
| `context7-calcom.md` | Use `@calcom/atoms` package with `useBookings` hook for fetching; `Booker` component for scheduling; `rescheduleUid` prop for rescheduling; `meetingUrl` field for join links | Section 7 Technical Context, Section 10 Decomposition (Coaching Initiative) |
| `perplexity-dashboard-ux.md` | Mobile-first responsive design; 5-second rule for key metrics; gamification drives 40-50% retention; action cards with clear CTAs; activity feed with 5-7 items per view | Section 5 Solution Overview (Responsive Behavior), Section 6 Scope (Future Considerations for gamification) |
| `context7-recharts-radar.md` | Use `ResponsiveContainer` with fixed height; `outerRadius="70%"` for mobile; CSS variables `hsl(var(--primary))` for theming; custom tooltip via `content` prop | Section 7 Technical Context (Technology Mandates), Section 10 Complexity (Spider Chart = Low) |

### D. External References

- [Cal.com Atoms Documentation](https://cal.com/docs/platform/atoms)
- [Recharts Radar Chart API](https://recharts.org/en-US/api/RadarChart)
- [Shadcn/UI Components](https://ui.shadcn.com/docs/components)

### E. Visual Assets

**ASCII Layout Mockup:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           User Dashboard (/home)                                 │
├────────────────────────┬────────────────────────┬───────────────────────────────┤
│ Course Progress        │ Skill Assessment       │ Kanban Summary                │
│ ┌─────────────────┐    │ ┌─────────────────┐    │ ┌─────────────────────────┐  │
│ │    ╭─────╮      │    │ │   Structure     │    │ │ DOING                   │  │
│ │   ╱       ╲     │    │ │      ★          │    │ │ ☐ Create slide deck     │  │
│ │  │   68%   │    │    │ │ Timing  Content │    │ │ ☐ Practice delivery     │  │
│ │   ╲       ╱     │    │ │   ★   ╳   ★    │    │ ├─────────────────────────┤  │
│ │    ╰─────╯      │    │ │ Engage  Visuals │    │ │ NEXT UP                 │  │
│ │ Module 4 of 6   │    │ │   ★       ★     │    │ │ → Review storyboard     │  │
│ │ "Story Structure"│    │ │     Delivery    │    │ └─────────────────────────┘  │
│ └─────────────────┘    │ └─────────────────┘    │                               │
├────────────────────────┼────────────────────────┼───────────────────────────────┤
│ Recent Activity        │ Quick Actions          │ Coaching Sessions             │
│ ┌─────────────────┐    │ ┌─────────────────┐    │ ┌─────────────────────────┐  │
│ │ ● Completed quiz│    │ │ [Continue Course]│    │ │ Next Session            │  │
│ │   Score: 85%    │    │ │                  │    │ │ Jan 28, 2026 - 2:00 PM  │  │
│ │ ● Updated pres. │    │ │ [New Presentation]│   │ │ [Join] [Reschedule]     │  │
│ │   "Q1 Strategy" │    │ │                  │    │ ├─────────────────────────┤  │
│ │ ● Finished L3   │    │ │ [Complete Survey]│    │ │ Following Session       │  │
│ │   "Visual Design│    │ │ (if not done)    │    │ │ Feb 4, 2026 - 2:00 PM   │  │
│ │ ● Created pres. │    │ └─────────────────┘    │ └─────────────────────────┘  │
│ └─────────────────┘    │                        │                               │
├────────────────────────┴────────────────────────┴───────────────────────────────┤
│ My Presentations                                                                 │
│ ┌───────────────────────────────────────────────────────────────────────────┐   │
│ │ Title              │ Audience     │ Type        │ Updated     │ Actions   │   │
│ ├────────────────────┼──────────────┼─────────────┼─────────────┼───────────┤   │
│ │ Q1 Strategy Review │ Leadership   │ Persuasive  │ 2 hours ago │ [Edit]    │   │
│ │ Product Launch     │ Customers    │ Informative │ Yesterday   │ [Edit]    │   │
│ │ Team Onboarding    │ New Hires    │ Educational │ 3 days ago  │ [Edit]    │   │
│ └────────────────────┴──────────────┴─────────────┴─────────────┴───────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Mockup Requirements Checklist:**
- [x] Component names match Key Capabilities (Section 5)
- [x] Layout matches 3-3-1 grid description
- [x] Sample content shows what each component displays
- [x] Tables show column headers
- [x] Responsive breakpoints documented in Section 5

### F. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-01-26 | Use `@calcom/atoms` over embed SDK | Native React components provide better DX and type safety | Research |
| 2026-01-26 | Limit activity feed to 10 items | Research shows 5-7 items per view optimal; 10 provides buffer | UX Research |
| 2026-01-26 | Exclude gamification from v1 | Keep scope manageable; add in v2 based on engagement data | Scope |
| 2026-01-26 | Single course model assumption | Current product supports one primary course; simplifies queries | Product |
| 2026-01-26 | Server Components for initial load | Reduces client bundle, improves LCP, follows Next.js 15 patterns | Architecture |
