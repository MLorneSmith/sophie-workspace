# Project Specification: User Dashboard

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S[pending] |
| **GitHub Issue** | #[pending] |
| **Document Owner** | Claude Agent |
| **Created** | 2026-01-29 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
A comprehensive user dashboard at `/home` providing learners with an at-a-glance view of their course progress, skills assessment, tasks, activity, coaching sessions, and presentations.

### Press Release Headline
> "SlideHeroes launches Personal Dashboard enabling presentation learners to track their complete learning journey in one place"

### Elevator Pitch (30 seconds)
The SlideHeroes User Dashboard transforms the empty personal home page into a command center for presentation skill development. Users see their course progress visualized as a radial chart, skills mapped on a spider diagram from self-assessments, current tasks from their kanban board, recent activity timeline, quick action buttons contextual to their state, upcoming coaching sessions, and a table of their presentation outlines - all designed to engage new users even before they have data.

---

## 2. Problem Statement

### Problem Description
Currently, the personal home page at `/home/(user)/page.tsx` is essentially empty, showing only a basic page body with no actionable content. Users must navigate to separate pages to check course progress, view tasks, access presentations, or book coaching sessions. This fragmented experience makes it difficult to understand overall progress and decide what to do next.

### Who Experiences This Problem?
- **New users** who log in and see an empty, uninviting page
- **Active learners** who need to track progress across multiple areas
- **Returning users** who want a quick status update before continuing their work

### Current Alternatives
Today, users must:
1. Navigate to `/home/course` to check course progress
2. Navigate to `/home/assessment` to review skill assessment results
3. Navigate to `/home/kanban` to see their tasks
4. Navigate to `/home/coaching` to book/view sessions
5. Navigate to `/home/ai` to access presentations

### Impact of Not Solving
- **Business impact**: Lower user engagement, higher churn, reduced course completion rates
- **User impact**: Frustration from navigation overhead, unclear next steps, sense of being "lost"
- **Competitive impact**: Modern SaaS products provide rich dashboards; an empty home page feels outdated

---

## 3. Vision & Goals

### Product Vision
A personalized dashboard that serves as the "command center" for each user's presentation skill development journey - showing them where they are, what they've accomplished, and what to do next, while delighting new users with engaging empty states rather than blank components.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Increase home page engagement | Time on /home page | +150% vs baseline (currently ~5s) | PostHog session duration |
| G2: Improve course completion | Weekly course lesson completions | +25% vs current baseline | Supabase analytics query |
| G3: Reduce navigation clicks | Clicks to reach key features | -40% from home (max 1 click) | PostHog event tracking |
| G4: Increase coaching bookings | Sessions booked per active user | +30% within 90 days | Cal.com API + Supabase |

### Strategic Alignment
This dashboard supports SlideHeroes' core mission to make presentation skill development accessible and engaging. It directly supports the product strategy of increasing user activation, course completion, and coaching session utilization.

---

## 4. Target Users

### Primary Persona
**Name**: Sarah the Skill Developer
**Role**: Professional (consultant, manager, team lead) improving presentation skills
**Goals**: Complete the course curriculum, track improvement over time, prepare for upcoming presentations
**Pain Points**: Loses track of where she left off, doesn't know her relative strengths/weaknesses, forgets about coaching opportunities
**Quote**: "I want to see my progress at a glance and know exactly what I should work on next."

### Secondary Personas
1. **Alex the New User**: Just signed up, exploring the platform - needs engaging empty states and clear onboarding
2. **Jordan the Power User**: Regular user with multiple presentations in progress - needs quick access to active work

### Anti-Personas (Who This Is NOT For)
- **Team administrators** managing multiple users (use team dashboard instead)
- **Anonymous visitors** (requires authentication)
- **API consumers** (this is a UI feature)

---

## 5. Solution Overview

### Proposed Solution
Replace the existing empty `/home/(user)/page.tsx` with a comprehensive dashboard featuring seven main components arranged in a 3-3-1 grid layout:

**Row 1 (3 widgets):**
1. Course Progress Radial Chart
2. Self-Assessment Spider Diagram
3. Kanban Summary Card

**Row 2 (3 widgets):**
4. Recent Activity Feed
5. Quick Actions Panel
6. Coaching Sessions Widget

**Row 3 (full width):**
7. Presentation Outline Table

### Key Capabilities

1. **Course Progress Radial Chart**: Circular visualization showing percentage of required lessons completed with breakdown of completed/in-progress/not-started segments. Empty state shows an outline of the chart with "Start your journey" CTA.

2. **Self-Assessment Spider Diagram**: Radar chart displaying scores across 5S framework dimensions (Structure, Story, Style, Substance, Self-Confidence). Empty state shows the spider web grid with zero values and "Take Assessment" CTA.

3. **Kanban Summary Card**: Displays current "Doing" task(s) and next queued task from the kanban board. Empty state shows onboarding checklist or "Create your first task" CTA.

4. **Recent Activity Feed**: Timeline of last 30 days showing presentations created/updated, lessons completed, quiz scores, assessments completed. Empty state shows "Your activity will appear here" with sample activity format preview.

5. **Quick Actions Panel**: Contextual CTAs based on user state - "Continue Course" (if in progress), "New Presentation", "Complete Assessment" (if not done), "Review Storyboard" (if drafts exist). Always shows at least 2-3 relevant actions.

6. **Coaching Sessions Widget**: Shows upcoming 1-2 sessions with date/time, join link, and reschedule option if booked. Shows "Book a Session" CTA with Cal.com embed if no sessions booked. Uses iframe embed + V2 API approach per research.

7. **Presentation Outline Table**: Full-width table listing user's presentations with quick "Edit Outline" button for each. Empty state shows sample row structure with "Create your first presentation" CTA.

### Customer Journey

1. **Discovery**: User logs in and lands on dashboard at `/home`
2. **Orientation**: Sees all progress indicators and current status at a glance
3. **Decision**: Quick Actions panel suggests most relevant next step
4. **Engagement**: One-click access to continue course, edit presentation, or book coaching
5. **Return**: Dashboard becomes habitual landing point showing accumulated progress

### Hypothetical Customer Quote
> "I used to dread logging into SlideHeroes because I never knew where I left off. Now my dashboard shows me exactly where I am and what to do next. It's like having a personal assistant for my presentation skills journey."
> — Sarah, Senior Consultant

### Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (<768px) | Single column, stacked widgets | Charts scale down, table becomes card list |
| Tablet (768-1024px) | 2-column grid, table full width | Radial/Spider charts side by side |
| Desktop (>1024px) | 3-3-1 grid as designed | Primary design target |

---

## 6. Scope Definition

### In Scope

- [x] Dashboard page replacing `/home/(user)/page.tsx`
- [x] Course Progress Radial Chart component with empty state
- [x] Self-Assessment Spider Diagram component with empty state
- [x] Kanban Summary Card component with empty state
- [x] Recent Activity Feed component (30 days, paginated) with empty state
- [x] Quick Actions Panel component with contextual logic
- [x] Coaching Sessions Widget with Cal.com V2 API integration
- [x] Presentation Outline Table component with empty state
- [x] Server-side data loader with parallel fetching
- [x] Responsive layout for mobile/tablet/desktop
- [x] Dark mode support via semantic colors

### Out of Scope

- [ ] Team account dashboard (future: separate spec)
- [ ] Dashboard customization/widget rearrangement
- [ ] Dashboard preferences/settings persistence
- [ ] Real-time updates via websockets (use refresh for now)
- [ ] Dashboard export/reporting features
- [ ] Analytics/metrics beyond what's displayed
- [ ] Admin view of user dashboards

### Future Considerations (v2+)

- Customizable widget arrangement (drag-and-drop)
- Additional widgets (achievements, certificates, social features)
- Dashboard themes/personalization
- Real-time activity feed via Supabase subscriptions
- Team dashboard with aggregated metrics
- Widget-level preferences (collapsed/expanded states)

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| `course_progress` table | DB Query | User's course completion percentage |
| `lesson_progress` table | DB Query | Lesson-level completion data |
| `quiz_attempts` table | DB Query | Quiz scores for activity feed |
| `survey_responses` table | DB Query | Self-assessment category scores for spider diagram |
| `tasks` table | DB Query | Kanban tasks for summary card |
| `building_blocks_submissions` table | DB Query | Presentation outlines for table |
| Cal.com V2 API | REST API | Fetch upcoming bookings (Bearer token auth) |
| Payload CMS `courses` | API Query | Course metadata (title, lesson count) |

### Technical Constraints

- **Performance**: Dashboard must load in <2s (LCP target: 1.5s)
- **Security**: All data fetched server-side with RLS enforcement
- **Scalability**: Support users with 100+ presentations, 1000+ activity items
- **Compatibility**: Support Next.js 16, React 19, Recharts for charts

### Technology Preferences/Mandates

- **Charts**: Recharts (already installed) with RadialBarChart and RadarChart
- **Layout**: Tailwind CSS grid with shadcn/ui Card components
- **Data Loading**: Server Component with parallel `Promise.all()` fetching
- **Cal.com**: iframe embed for booking + V2 API for fetching sessions (no @calcom/atoms)
- **Empty States**: Custom components with illustrations and CTAs

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Cal.com V2 API | External | Medium | API key already configured; monitor for breaking changes |
| Recharts | npm package | Low | Stable, widely used charting library |
| Payload CMS | Internal | Low | Course content already integrated |
| Supabase RLS | Internal | Low | Existing policies cover required tables |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Users have the 5S course**: Dashboard assumes users are enrolled in the main SlideHeroes course — *Validation: Check course_progress table on load*
2. **Cal.com API remains stable**: V2 API with Bearer token auth works as documented — *Validation: Integration test with live API*
3. **Activity volume is manageable**: Most users have <1000 activity items — *Validation: Query performance testing*
4. **Spider diagram needs 5 dimensions**: Self-assessment surveys use the 5S framework — *Validation: Check survey structure in Payload*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Cal.com API rate limiting | Low | Medium | Cache booking data, implement retry logic | Developer |
| R2 | Slow dashboard load (many widgets) | Medium | High | Parallel fetching, Suspense boundaries, skeleton loading | Developer |
| R3 | Chart rendering issues on SSR | Medium | Medium | Use `initialDimension` for ResponsiveContainer, dynamic imports | Developer |
| R4 | Empty state confusion | Low | Medium | User testing of empty state messaging and CTAs | Design |

### Open Questions

1. [x] Should the dashboard replace `/home/(user)` or be a new route? **Answer: Replace**
2. [x] What time period for activity feed? **Answer: 30 days with pagination**
3. [x] Personal accounts only or also team? **Answer: Personal only for v1**
4. [ ] Should we track which widgets users interact with most for future optimization?

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] All 7 dashboard widgets implemented and functional
- [ ] Empty states designed and implemented for all widgets
- [ ] Responsive layout works on mobile, tablet, and desktop
- [ ] Dark mode support verified
- [ ] Page load time <2s (measured with Lighthouse)
- [ ] All data loads via server-side with RLS enforcement
- [ ] Cal.com integration fetches real booking data
- [ ] Unit tests for widget components
- [ ] E2E test for dashboard happy path
- [ ] Code passes `pnpm typecheck && pnpm lint`

### Launch Criteria

- [ ] Staging environment validation with real user data
- [ ] Performance audit passes (LCP <1.5s, CLS <0.1)
- [ ] Accessibility audit passes (WCAG 2.1 AA)
- [ ] Product owner sign-off on all empty states
- [ ] Documentation updated for new components

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| /home page session duration | ~5 seconds | >12 seconds | 2 weeks post-launch |
| Course lesson completions/week | Current baseline | +25% | 4 weeks post-launch |
| Coaching session bookings | Current baseline | +30% | 8 weeks post-launch |
| User satisfaction (survey) | N/A | >4.0/5.0 | 4 weeks post-launch |

---

## 10. Decomposition Hints

### Standard Initiative Categories to Consider

1. **Foundation/Layout** (P0) - Dashboard page structure, grid layout, responsive breakpoints
2. **Data Layer** (P0/P1) - Consolidated loader, parallel fetching, type definitions
3. **Core Components** (P1) - 7 main widget components
4. **Integrations** (P2) - Cal.com API integration (higher risk, can be parallel)
5. **Polish & Edge Cases** (P3) - Empty states, loading states, error handling, accessibility

### Candidate Initiatives

1. **I1: Dashboard Foundation** (P0): Page structure, layout grid, navigation, basic server component — maps to Foundation/Layout
2. **I2: Data Layer** (P0): Consolidated loader function, parallel data fetching, TypeScript types — maps to Data Layer
3. **I3: Progress Widgets** (P1): Course Progress Radial Chart + Self-Assessment Spider Diagram — maps to Key Capabilities 1-2
4. **I4: Task & Activity Widgets** (P1): Kanban Summary Card + Activity Feed — maps to Key Capabilities 3-4
5. **I5: Action Widgets** (P1): Quick Actions Panel + Presentation Outline Table — maps to Key Capabilities 5, 7
6. **I6: Coaching Integration** (P2): Coaching Sessions Widget with Cal.com API — maps to Key Capability 6
7. **I7: Empty States & Polish** (P3): All empty state designs, loading skeletons, error boundaries — maps to Polish

### Suggested Priority Order

1. **P0**: I1 (Foundation) → I2 (Data Layer) — Must complete first, all other initiatives depend on these
2. **P1**: I3, I4, I5 can proceed in parallel after P0
3. **P2**: I6 (Coaching) can proceed in parallel with P1 (external integration, higher risk)
4. **P3**: I7 (Polish) after all widgets implemented

### Complexity Indicators

| Area | Complexity | Rationale (based on codebase findings) |
|------|------------|----------------------------------------|
| Dashboard Layout | Low | Existing Page/Card components in @kit/ui; grid layout is straightforward |
| Data Loader | Medium | Need to aggregate 6 tables + 1 API; existing loader patterns to follow |
| Radial Chart | Medium | RadialBarChart from Recharts, no existing component - need to build |
| Spider Diagram | Low | Existing RadarChart in `/assessment/survey/_components/radar-chart.tsx` |
| Kanban Summary | Low | Existing `useTasks` hook can be reused from kanban feature |
| Activity Feed | Medium | Need new query across multiple tables; timeline UI to build |
| Quick Actions | Low | Simple conditional rendering based on data state |
| Coaching Widget | Medium | Cal.com V2 API integration new; iframe embed exists |
| Presentation Table | Low | Existing data queries; DataTable component available |
| Empty States | Medium | 7 unique empty states with illustrations/CTAs |

---

## 11. Appendices

### A. Glossary

- **5S Framework**: SlideHeroes' presentation skill dimensions - Structure, Story, Style, Substance, Self-Confidence
- **Radial Chart**: Circular bar chart showing progress as arc segments
- **Spider Diagram**: Radar/web chart showing multi-dimensional data
- **Kanban**: Task management board with do/doing/done columns
- **Building Blocks**: SlideHeroes' methodology for creating presentation outlines

### B. Codebase Exploration Results (REQUIRED)

| Component/Pattern Found | File Path | Reusable? | Notes |
|------------------------|-----------|-----------|-------|
| RadarChart component | `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | Yes | Wrap with new empty state logic |
| useTasks hook | `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts` | Yes | Query tasks with subtasks |
| CourseProgressBar | `apps/web/app/home/(user)/course/_components/CourseProgressBar.tsx` | Pattern only | Linear, need radial version |
| RadialProgress | `apps/web/app/home/(user)/course/_components/RadialProgress.tsx` | Yes | Existing radial component |
| useSurveyScores hook | `apps/web/app/home/(user)/assessment/_lib/client/hooks/use-survey-scores.ts` | Yes | Fetch assessment scores |
| Page layout system | `packages/ui/src/makerkit/page.tsx` | Yes | Page, PageHeader, PageBody |
| Card components | `packages/ui/src/shadcn/card.tsx` | Yes | Card, CardHeader, CardContent |
| ChartContainer | `packages/ui/src/shadcn/chart.tsx` | Yes | Recharts wrapper with theming |
| DataTable | `packages/ui/src/shadcn/data-table.tsx` | Yes | For presentation outline table |
| Cal.com iframe | `apps/web/app/home/(user)/coaching/_components/calendar.tsx` | Pattern only | Basic iframe, need widget version |
| Dashboard demo | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` | Pattern only | Reference for chart patterns |

**Tables/Schemas Identified:**

| Table Name | Location | Purpose |
|------------|----------|---------|
| `course_progress` | `migrations/20250319104726_web_course_system.sql` | User's overall course completion |
| `lesson_progress` | `migrations/20250319104726_web_course_system.sql` | Individual lesson completion |
| `quiz_attempts` | `migrations/20250319104726_web_course_system.sql` | Quiz scores and attempts |
| `survey_responses` | `migrations/20250319104724_web_survey_system.sql` | Self-assessment category scores |
| `tasks` | `migrations/20250221144500_web_create_kanban_tables.sql` | Kanban tasks |
| `building_blocks_submissions` | `migrations/20250211000000_web_create_building_blocks_submissions.sql` | Presentation outlines |

### C. Research Integration (REQUIRED)

| Research File | Key Findings | Spec Section(s) Affected |
|--------------|--------------|-------------------------|
| `perplexity-calcom-nextjs-integration-post-platform.md` | 1. Skip @calcom/atoms (requires deprecated OAuth) 2. Use iframe embed + V2 API with Bearer token 3. API key prefix must be `cal_` 4. Required headers: `Authorization: Bearer cal_<key>`, `cal-api-version: 2024-08-13` | Section 7 (Technical Context), Section 5 (Coaching Widget) |
| `perplexity-dashboard-empty-states.md` | 1. Replace blank screens with contextual illustrations + CTAs 2. Single focused CTA better than multiple options 3. Progressive disclosure: essential → intermediate → advanced 4. Activity feed empty states should explain what will appear 5. Autopilot saw 50% churn from poor empty states | Section 5 (Empty State Design), Section 8 (Risks) |
| `context7-recharts-radial-radar.md` | 1. RadialBarChart ideal for progress (bars radiate from center) 2. RadarChart needs 3+ points for meaningful shape 3. Always wrap in ResponsiveContainer 4. Use `initialDimension` for SSR/Next.js 5. Empty states must be handled manually (conditional render) | Section 5 (Charts), Section 7 (Technology Preferences) |

### D. External References

- Cal.com V2 API Documentation: https://cal.com/docs/api/v2
- Cal.com Embed Documentation: https://cal.com/docs/core-features/embed
- Recharts Documentation: https://recharts.org/en-US/
- Shadcn/ui Charts: https://ui.shadcn.com/charts

### E. Visual Assets

**ASCII Layout Mockup:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           User Dashboard                                      │
├──────────────────────┬──────────────────────┬────────────────────────────────┤
│ Course Progress      │ Skills Assessment    │ Kanban Summary                 │
│ ┌────────────┐       │ ┌────────────┐       │ ┌────────────────────────────┐ │
│ │   65%      │       │ │ Structure  │       │ │ DOING:                     │ │
│ │  ████░░    │       │ │    ╱╲      │       │ │ • Review lesson 12 notes   │ │
│ │ Completed  │       │ │   ╱  ╲     │       │ │                            │ │
│ └────────────┘       │ │  ╱────╲    │       │ │ NEXT:                      │ │
│ 15/23 lessons        │ │ Style  Story│       │ │ • Practice pitch delivery  │ │
│ [Continue Course]    │ │             │       │ │                            │ │
│                      │ │ Substance   │       │ │ [View Board →]             │ │
│                      │ └────────────┘       │ └────────────────────────────┘ │
├──────────────────────┼──────────────────────┼────────────────────────────────┤
│ Recent Activity      │ Quick Actions        │ Coaching Sessions             │
│ ┌────────────────┐   │ ┌────────────────┐   │ ┌────────────────────────────┐ │
│ │ ● Quiz: 85%    │   │ │ [Continue      │   │ │ Thu, Feb 6 @ 2:00 PM      │ │
│ │   Lesson 12    │   │ │  Course]       │   │ │ 60-min Strategy Session   │ │
│ │ ○ Completed    │   │ │                │   │ │ [Join] [Reschedule]       │ │
│ │   Lesson 11    │   │ │ [New           │   │ │                            │ │
│ │ ○ Updated      │   │ │  Presentation] │   │ │ ─────────────────────────  │ │
│ │   "Q1 Pitch"   │   │ │                │   │ │ No other sessions          │ │
│ │ [Show more]    │   │ │ [Review        │   │ │ [Book New Session]         │ │
│ └────────────────┘   │ │  Storyboard]   │   │ └────────────────────────────┘ │
│                      │ └────────────────┘   │                                │
├──────────────────────┴──────────────────────┴────────────────────────────────┤
│ Presentation Outlines                                                         │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │ Title              │ Last Updated    │ Slides  │ Status    │ Actions       ││
│ ├────────────────────┼─────────────────┼─────────┼───────────┼───────────────┤│
│ │ Q1 Sales Pitch     │ Jan 28, 2026    │ 12      │ Draft     │ [Edit Outline]││
│ │ Team Retrospective │ Jan 25, 2026    │ 8       │ Complete  │ [Edit Outline]││
│ │ Product Launch     │ Jan 20, 2026    │ 15      │ Draft     │ [Edit Outline]││
│ └────────────────────┴─────────────────┴─────────┴───────────┴───────────────┘│
│                                                    [+ New Presentation]        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Empty State Mockup (New User):**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Welcome to SlideHeroes!                             │
├──────────────────────┬──────────────────────┬────────────────────────────────┤
│ Course Progress      │ Skills Assessment    │ Your Tasks                     │
│ ┌────────────┐       │ ┌────────────┐       │ ┌────────────────────────────┐ │
│ │    0%      │       │ │ Structure  │       │ │ Getting Started:           │ │
│ │  ░░░░░░    │       │ │    ╱╲      │       │ │ ☐ Take skills assessment   │ │
│ │ Not Started│       │ │   ╱  ╲     │       │ │ ☐ Start first lesson       │ │
│ └────────────┘       │ │  ╱----╲    │       │ │ ☐ Create a presentation    │ │
│ 0/23 lessons         │ │ [dashed]   │       │ │                            │ │
│ [Start Your Journey] │ │ Take the   │       │ │                            │ │
│                      │ │ assessment │       │ │ [View Task Board →]        │ │
│                      │ │ to reveal  │       │ └────────────────────────────┘ │
│                      │ │ your skills│       │                                │
│                      │ └────────────┘       │                                │
├──────────────────────┼──────────────────────┼────────────────────────────────┤
│ Your Activity        │ Quick Actions        │ Coaching Sessions             │
│ ┌────────────────┐   │ ┌────────────────┐   │ ┌────────────────────────────┐ │
│ │                │   │ │ [Take Skills   │   │ │                            │ │
│ │  📊 Activity   │   │ │  Assessment]   │   │ │ Book a coaching session   │ │
│ │  will appear   │   │ │                │   │ │ with our presentation     │ │
│ │  here as you   │   │ │ [Start First   │   │ │ experts to accelerate     │ │
│ │  learn         │   │ │  Lesson]       │   │ │ your learning.            │ │
│ │                │   │ │                │   │ │                            │ │
│ │                │   │ │ [Create        │   │ │ [Book Session]             │ │
│ └────────────────┘   │ │  Presentation] │   │ └────────────────────────────┘ │
│                      │ └────────────────┘   │                                │
├──────────────────────┴──────────────────────┴────────────────────────────────┤
│ Your Presentations                                                            │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │                                                                            ││
│ │   📑 No presentations yet                                                  ││
│ │   Create your first presentation to start building your portfolio          ││
│ │                                                                            ││
│ │                        [+ Create First Presentation]                       ││
│ │                                                                            ││
│ └────────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### F. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-01-29 | Replace /home/(user) rather than new route | Simplifies navigation, makes dashboard the default landing | User (via interview) |
| 2026-01-29 | Activity feed covers 30 days with pagination | Balances recency with historical context | User (via interview) |
| 2026-01-29 | Personal accounts only for v1 | Reduces scope, team dashboard is separate initiative | User (via interview) |
| 2026-01-29 | Use iframe + V2 API for Cal.com | @calcom/atoms requires deprecated Platform OAuth | Research findings |
| 2026-01-29 | All widgets have custom empty states | Research shows 50% churn improvement with good empty states | Research findings |
| 2026-01-29 | Use existing RadarChart from assessment | Proven component, consistent with existing code | Codebase exploration |
