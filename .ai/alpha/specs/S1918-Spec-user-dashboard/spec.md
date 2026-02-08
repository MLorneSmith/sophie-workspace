# Project Specification: User Dashboard

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S1918 |
| **GitHub Issue** | #1918 |
| **Document Owner** | Alpha Workflow |
| **Created** | 2026-02-03 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
A comprehensive user dashboard at `/home` providing at-a-glance progress tracking, activity monitoring, task management, and quick actions for presentation skill development.

### Press Release Headline
> "SlideHeroes launches Personal Dashboard enabling learners to track their presentation mastery journey with radial progress charts, skill assessments, and contextual guidance"

### Elevator Pitch (30 seconds)
SlideHeroes users currently lack a central hub to understand their learning progress and next steps. The new User Dashboard consolidates course progress, self-assessment results, task management, recent activity, and coaching sessions into a single, visually engaging interface. New users see helpful empty states with clear CTAs rather than blank widgets, ensuring the dashboard remains valuable from day one.

---

## 2. Problem Statement

### Problem Description
Users have no centralized view of their presentation skill development journey. Progress data is scattered across course pages, assessment results, kanban boards, and separate booking flows. Users must navigate multiple pages to understand where they are and what to do next.

### Who Experiences This Problem?
- **Active learners** who want to track course progress and see their skill improvements
- **New users** who don't know where to start or what's available
- **Returning users** who want to quickly resume where they left off
- **Users with coaching sessions** who need to see upcoming appointments

### Current Alternatives
Users currently:
- Navigate to `/home/course` to see course progress
- Navigate to `/home/assessment` to see survey results
- Navigate to `/home/kanban` to see tasks
- Navigate to `/home/coaching` to book sessions
- Have no unified activity timeline

### Impact of Not Solving
- **Business impact**: Lower engagement and course completion rates; reduced coaching bookings
- **User impact**: Cognitive overload from scattered information; unclear next steps lead to abandonment
- **Competitive impact**: Modern SaaS dashboards set user expectations; lack of dashboard feels outdated

---

## 3. Vision & Goals

### Product Vision
A personalized command center where users instantly understand their presentation skill journey, see what they've accomplished, and know exactly what to do next. The dashboard adapts to each user's stage - welcoming new users with guidance while empowering active learners with detailed progress metrics.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Increase /home page views | Weekly page views | +50% vs baseline (from 0 to meaningful engagement) | PostHog analytics |
| G2: Improve course completion | Completion percentage | +15% within 30 days of launch | Supabase course_progress table |
| G3: Increase coaching bookings | Bookings per user | +20% from dashboard CTA | Cal.com API booking count |
| G4: Reduce navigation to find next action | Clicks to start activity | -40% (from 3+ clicks to 1 click) | PostHog funnel analysis |

### Strategic Alignment
Aligns with SlideHeroes' mission to make presentation skill development engaging and accessible. A polished dashboard increases perceived product value and drives feature discovery.

---

## 4. Target Users

### Primary Persona
**Name**: Sarah the Self-Improver
**Role**: Marketing professional learning presentation skills
**Goals**: Complete the course, improve assessment scores, prepare for important presentations
**Pain Points**: Doesn't know her progress at a glance; forgets where she left off; misses coaching session deadlines
**Quote**: "I want to open the app and immediately know what I should work on today."

### Secondary Personas
1. **Alex the New User**: Just signed up, hasn't started anything yet. Needs clear guidance on first steps.
2. **Jordan the Busy Professional**: Limited time, needs to quickly see next task and continue where they left off.

### Anti-Personas (Who This Is NOT For)
- **Team administrators** looking for team-wide analytics (separate feature)
- **Content creators** managing courses (admin interface)
- **Anonymous visitors** (dashboard requires authentication)

---

## 5. Solution Overview

### Proposed Solution
Build a comprehensive dashboard at `/home/(user)/page.tsx` using a responsive 3-row grid layout with seven widget components. The dashboard aggregates data from course progress, assessments, tasks, presentations, and coaching sessions into a unified view with thoughtful empty states for new users.

### Key Capabilities

1. **Course Progress Radial Widget**: Circular progress chart showing overall course completion percentage using RadialBarChart from Recharts. Empty state shows 0% with "Start Learning" CTA.

2. **Skills Spider Diagram Widget**: RadarChart visualizing self-assessment category scores across 6+ skill dimensions. Empty state shows muted spider web outline with "Take Assessment" CTA.

3. **Kanban Summary Widget**: Card showing current "Doing" tasks and next task in queue. Links to full Kanban board. Empty state shows "No active tasks" with task creation guidance.

4. **Recent Activity Feed Widget**: Timeline of last 5-8 activities (lessons completed, quizzes passed, presentations updated, assessments finished). Empty state shows "Your activity will appear here" with suggested first action.

5. **Quick Actions Panel Widget**: Contextual CTAs based on user state:
   - "Continue Course" (if in progress) or "Start Course" (if not started)
   - "New Presentation"
   - "Complete Assessment" (if not done) or "Retake Assessment"
   - "Review Storyboard" (if drafts exist)

6. **Coaching Sessions Widget**: Shows next 1-2 upcoming coaching sessions with date/time, join link, reschedule option. If no sessions booked, shows "Book a Session" button linking to booking page. Uses Cal.com V2 API for fetching bookings and iframe embed for booking.

7. **Presentations Table Widget**: Full-width table showing user's presentations with columns for title, type, last modified, and quick "Edit Outline" button. Empty state shows "Create your first presentation" CTA.

### Customer Journey

1. **New user lands on dashboard** → Sees welcoming empty states with clear first-step CTAs (Start Course, Take Assessment)
2. **User starts engaging** → Progress widgets begin populating; Activity feed shows first actions
3. **Active user returns daily** → Dashboard shows current tasks, course progress, upcoming sessions
4. **User achieves milestones** → Progress charts fill up; Activity feed celebrates completions
5. **User books coaching** → Upcoming sessions widget shows scheduled appointments

### Hypothetical Customer Quote
> "I love opening SlideHeroes now. In five seconds I can see my progress, what I'm working on, and what's next. It makes me want to keep going!"
> — Sarah, Marketing Professional

### Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (<768px) | Single column, stacked widgets | Progress widgets side-by-side on wider phones; table horizontally scrollable |
| Tablet (768-1024px) | 2 columns for top rows; full-width table | Grid adjusts to 2-col layout |
| Desktop (>1024px) | 3-3-1 grid layout as specified | Full layout with all widgets visible |

---

## 6. Scope Definition

### In Scope

- [x] Dashboard page at `/home/(user)/page.tsx` replacing current empty shell
- [x] Course Progress Radial widget with RadialBarChart
- [x] Skills Spider Diagram widget with RadarChart
- [x] Kanban Summary widget with task counts and next task
- [x] Recent Activity Feed widget aggregating multiple sources
- [x] Quick Actions Panel with contextual CTAs
- [x] Coaching Sessions widget with Cal.com V2 API integration
- [x] Presentations Table widget with edit links
- [x] Empty states for all widgets (new user experience)
- [x] Loading skeletons for async data
- [x] Server-side data fetching with parallel queries
- [x] Responsive grid layout (mobile, tablet, desktop)
- [x] Dark mode support for all components

### Out of Scope

- [ ] Drag-and-drop widget reordering/customization
- [ ] Widget collapse/expand functionality
- [ ] Real-time updates via WebSocket subscriptions
- [ ] Team/organization dashboard (separate feature)
- [ ] Dashboard analytics/tracking implementation (separate task)
- [ ] Cal.com booking modal within dashboard (link to booking page instead)
- [ ] Certificate display widget (future enhancement)
- [ ] Gamification elements (badges, streaks)

### Future Considerations (v2+)
- Customizable widget layout
- Additional widgets (certificates, leaderboard, tips of the day)
- Dashboard tour for first-time users
- Push notifications for upcoming sessions
- AI-powered recommendations widget

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| `course_progress` table | DB Query | Fetch user's course completion percentage via Supabase |
| `lesson_progress` table | DB Query | Count completed lessons for progress calculation |
| `quiz_attempts` table | DB Query | Fetch recent quiz completions for activity feed |
| `survey_responses` table | DB Query | Fetch category_scores for spider diagram |
| `tasks` table | DB Query | Fetch tasks with status='doing' and next 'do' task |
| `building_blocks_submissions` table | DB Query | Fetch presentations for table and activity |
| Cal.com V2 API | REST API | Fetch upcoming bookings with Bearer token auth |
| Existing RadarChart | Component | Reuse from `assessment/survey/_components/radar-chart.tsx` |
| Existing RadialProgress | Component Pattern | Adapt from `course/_components/RadialProgress.tsx` |

### Technical Constraints

- **Performance**: Dashboard must load in <1.5s LCP; use parallel data fetching with `Promise.all()`
- **Security**: All data fetching uses RLS-protected Supabase queries; Cal.com API key server-side only
- **Scalability**: Activity feed limited to 10 items; pagination for presentations table if >10 rows
- **Compatibility**: Must work with Next.js 16, React 19, Recharts 3.x

### Technology Preferences/Mandates

- **Charts**: Recharts (already installed) - RadialBarChart, RadarChart
- **UI Components**: shadcn/ui Card, Table, Badge, Skeleton, Button
- **Data Fetching**: Server Component with cached loader pattern
- **Styling**: Tailwind CSS with CSS variables for theming
- **Cal.com Integration**: V2 API with Bearer token + iframe embed (no @calcom/atoms)

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Cal.com V2 API | External | Medium | API stability; requires CALCOM_API_KEY env var |
| Recharts 3.x | npm | Low | Already installed and working |
| User authentication | Internal | Low | RLS handles automatically |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Users want a dashboard**: Users will find value in aggregated progress view — *Validation: User interviews, analytics on dashboard usage*
2. **Cal.com API is stable**: V2 API won't have breaking changes — *Validation: Monitor Cal.com changelog*
3. **Existing data is sufficient**: Current tables contain enough activity data for meaningful feed — *Validation: Query existing data variety*
4. **Empty states are acceptable**: New users will accept empty widgets with CTAs vs requiring onboarding first — *Validation: UX testing*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Cal.com API rate limits exceeded | Low | Medium | Implement caching (5-min TTL); fallback to "Check booking page" | Developer |
| R2 | Activity feed query too slow with many activities | Medium | Medium | Limit to 10 items; add index on timestamp columns; use UNION ALL | Developer |
| R3 | Recharts SSR hydration issues | Low | High | Use `initialDimension` prop; wrap in client component | Developer |
| R4 | Empty dashboard overwhelming for new users | Medium | Medium | Design engaging empty states; progressive disclosure | Designer |

### Open Questions

1. [ ] Should activity feed show activities from all time or last 30 days?
2. [ ] What is the Cal.com event type ID/slug for coaching sessions?
3. [ ] Should Quick Actions show all 4 CTAs or only contextually relevant ones?

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] Dashboard renders at `/home` with all 7 widgets
- [ ] All widgets handle loading, empty, and populated states
- [ ] Responsive layout works on mobile, tablet, and desktop
- [ ] Dark mode properly themed for all components
- [ ] Performance: LCP < 1.5s on 3G connection
- [ ] Accessibility: All widgets keyboard navigable, proper ARIA labels
- [ ] Tests: Unit tests for loader functions; E2E test for dashboard render

### Launch Criteria

- [ ] Code review approved
- [ ] QA sign-off on all breakpoints
- [ ] No console errors in production build
- [ ] Cal.com API key configured in production environment
- [ ] Feature flag enabled for gradual rollout (optional)

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| /home page views | 0 (empty page) | 500+ weekly | 2 weeks |
| Dashboard bounce rate | N/A | <40% | 2 weeks |
| Course completion rate | Current baseline | +15% | 4 weeks |
| Coaching bookings via dashboard | 0 | 10+ monthly | 4 weeks |

---

## 10. Decomposition Hints

### Standard Initiative Categories to Consider

1. **Foundation/Layout** (P0) - Page structure, responsive grid, routing, PageHeader
2. **Data Layer** (P0/P1) - Loaders, type definitions, parallel data fetching patterns
3. **Progress Widgets** (P1) - Course progress radial, Skills spider diagram
4. **Task & Activity Widgets** (P1) - Kanban summary, Activity feed, Quick actions
5. **Integrations** (P2) - Cal.com coaching sessions widget (higher risk, can parallel)
6. **Polish & Edge Cases** (P2) - Empty states, loading skeletons, error boundaries, accessibility
7. **Presentations Table** (P1) - Full-width table component

### Candidate Initiatives

1. **Dashboard Foundation**: Page layout, responsive grid, navigation integration, PageHeader
2. **Data Layer**: Types, loader functions, parallel fetching pattern
3. **Progress & Assessment Widgets**: Course progress radial + Skills spider diagram (share charting patterns)
4. **Activity & Task Widgets**: Kanban summary + Activity feed + Quick actions (share data aggregation)
5. **Coaching Integration**: Cal.com API client + Coaching sessions widget
6. **Presentation Table & Polish**: Presentations table + Empty states + Accessibility audit

### Suggested Priority Order

1. **P0 - Foundation**: Dashboard page shell, grid layout, types (blocks everything else)
2. **P0 - Data Layer**: Loader functions with parallel fetching (required for all widgets)
3. **P1 - Progress Widgets**: High visual impact, uses existing patterns
4. **P1 - Task & Activity Widgets**: Core engagement features
5. **P1 - Presentations Table**: Full-width component, straightforward
6. **P2 - Coaching Integration**: External API, can be done in parallel
7. **P2 - Polish**: Empty states, skeletons, error handling, accessibility

### Complexity Indicators

| Area | Complexity | Rationale |
|------|------------|-----------|
| Dashboard Layout | Low | CSS Grid + existing PageHeader pattern from team dashboard |
| Course Progress Radial | Low | Existing RadialProgress component can be adapted |
| Skills Spider Diagram | Low | Existing RadarChart at `assessment/survey/_components/radar-chart.tsx` |
| Kanban Summary | Low | Reuse `useTasks()` hook from kanban feature |
| Activity Feed | Medium | Aggregates from 4+ tables; needs UNION query or parallel fetches |
| Quick Actions | Low | Conditional rendering based on user state checks |
| Coaching Sessions | Medium | External Cal.com V2 API integration; server-side fetch |
| Presentations Table | Low | Standard table with existing `building_blocks_submissions` data |
| Empty States | Low | Follow patterns from dashboard-demo-charts.tsx |

---

## 11. Appendices

### A. Glossary

- **RadialBarChart**: Recharts component for circular progress visualization
- **RadarChart**: Recharts component for spider/radar diagram visualization
- **RLS**: Row Level Security - PostgreSQL feature for automatic data access control
- **Cal.com V2 API**: Current Cal.com REST API with Bearer token authentication
- **Empty State**: UI shown when widget has no data; includes guidance/CTA

### B. Codebase Exploration Results (REQUIRED)

| Component/Pattern Found | File Path | Reusable? | Notes |
|------------------------|-----------|-----------|-------|
| RadarChart component | `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | Yes | 81 lines, uses ChartContainer |
| RadialProgress component | `apps/web/app/home/(user)/course/_components/RadialProgress.tsx` | Pattern only | Custom SVG, adapt to RadialBarChart |
| Dashboard demo charts | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` | Pattern only | 900+ lines, shows chart patterns |
| useTasks hook | `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts` | Yes | React Query hook for task data |
| Personal page shell | `apps/web/app/home/(user)/page.tsx` | Replace | Currently 33 lines, empty PageBody |
| PageHeader component | `packages/ui/src/makerkit/page.tsx` | Yes | Page, PageHeader, PageBody exports |
| Card component | `packages/ui/src/shadcn/card.tsx` | Yes | Card widget container |
| Skeleton component | `packages/ui/src/shadcn/skeleton.tsx` | Yes | Loading states |
| Table component | `packages/ui/src/shadcn/table.tsx` | Yes | Presentations table |
| ChartContainer | `packages/ui/src/shadcn/chart.tsx` | Yes | Recharts wrapper with theming |

**Tables/Schemas Identified:**

| Table Name | Location | Purpose |
|------------|----------|---------|
| `course_progress` | `migrations/20250319104726_web_course_system.sql` | Overall course completion (completion_percentage) |
| `lesson_progress` | `migrations/20250319104726_web_course_system.sql` | Individual lesson completions (completed_at) |
| `quiz_attempts` | `migrations/20250319104726_web_course_system.sql` | Quiz scores and passes (score, passed, completed_at) |
| `survey_responses` | `migrations/20250319104724_web_survey_system.sql` | Assessment scores (category_scores JSONB) |
| `tasks` | `migrations/20250221144500_web_create_kanban_tables.sql` | Kanban tasks (status, title) |
| `building_blocks_submissions` | `migrations/20250211000000_web_create_building_blocks_submissions.sql` | Presentations (title, updated_at) |

### C. Research Integration (REQUIRED)

| Research File | Key Findings | Spec Section(s) Affected |
|--------------|--------------|-------------------------|
| `perplexity-calcom-nextjs-integration-post-platform.md` | Use iframe/embed for booking; V2 API with Bearer token for fetching bookings; skip @calcom/atoms; required headers: Authorization + cal-api-version | Section 7 Technical Context, Section 5 Coaching Sessions Widget |
| `perplexity-dashboard-ux.md` | Empty states need ONE clear CTA; show structure hints; widget states: loading/empty/error/populated; mobile-first grid with breakpoints; CTAs should be action-oriented | Section 5 Empty States, Section 5 Responsive Behavior, Section 6 In Scope |
| `context7-recharts-radar.md` | RadarChart requires PolarGrid + PolarAngleAxis + Radar; RadialBarChart uses innerRadius/outerRadius percentages; always wrap in ResponsiveContainer with height; use initialDimension for SSR | Section 5 Progress Widgets, Section 7 Technical Constraints |

### D. External References

- [Cal.com V2 API Documentation](https://cal.com/docs/api/v2)
- [Cal.com Embed Documentation](https://cal.com/docs/core-features/embed)
- [Recharts RadarChart API](https://recharts.org/en-US/api/RadarChart)
- [Recharts RadialBarChart API](https://recharts.org/en-US/api/RadialBarChart)
- [Shadcn/ui Components](https://ui.shadcn.com/docs/components)

### E. Visual Assets

**ASCII Layout Mockup:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           User Dashboard                                      │
│                     Welcome back, Sarah!                                      │
├──────────────────────┬──────────────────────┬────────────────────────────────┤
│ Course Progress      │ Skills Assessment    │ Kanban Summary                 │
│ ┌────────────────┐   │ ┌────────────────┐   │ ┌────────────────────────────┐ │
│ │    ╭───╮       │   │ │     ╱╲         │   │ │ Doing (2)                  │ │
│ │   ╱  68% ╲     │   │ │   ╱    ╲       │   │ │ • Practice delivery        │ │
│ │  │       │     │   │ │ ─┼──────┼─     │   │ │ • Review slides            │ │
│ │   ╲     ╱      │   │ │   ╲    ╱       │   │ │                            │ │
│ │    ╰───╯       │   │ │     ╲╱         │   │ │ Next Up                    │ │
│ │                │   │ │                │   │ │ • Record presentation      │ │
│ │ 15/22 lessons  │   │ │ Content: 85    │   │ │                            │ │
│ └────────────────┘   │ │ Delivery: 72   │   │ │ [View Kanban Board →]      │ │
│ [Continue Course]    │ └────────────────┘   │ └────────────────────────────┘ │
├──────────────────────┼──────────────────────┼────────────────────────────────┤
│ Recent Activity      │ Quick Actions        │ Coaching Sessions              │
│ ┌────────────────┐   │ ┌────────────────┐   │ ┌────────────────────────────┐ │
│ │ ● Completed    │   │ │ [Continue      │   │ │ Upcoming Session           │ │
│ │   Lesson 14    │   │ │  Course    ▶]  │   │ │ Feb 15, 2:00 PM            │ │
│ │   2 hours ago  │   │ │                │   │ │ with Coach Michael         │ │
│ │                │   │ │ [New           │   │ │ [Join] [Reschedule]        │ │
│ │ ● Quiz passed  │   │ │  Presentation] │   │ │                            │ │
│ │   Score: 85%   │   │ │                │   │ │ ─────────────────────────  │ │
│ │   Yesterday    │   │ │ [Retake        │   │ │                            │ │
│ │                │   │ │  Assessment]   │   │ │ Feb 22, 10:00 AM           │ │
│ │ ● Presentation │   │ │                │   │ │ with Coach Sarah           │ │
│ │   updated      │   │ │ [Review        │   │ │ [Join] [Reschedule]        │ │
│ │   3 days ago   │   │ │  Storyboard]   │   │ │                            │ │
│ └────────────────┘   │ └────────────────┘   │ │ [Book New Session]         │ │
│                      │                      │ └────────────────────────────┘ │
├──────────────────────┴──────────────────────┴────────────────────────────────┤
│ My Presentations                                                              │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │ Title                    │ Type        │ Last Modified │ Actions           ││
│ ├──────────────────────────┼─────────────┼───────────────┼───────────────────┤│
│ │ Q4 Sales Kickoff         │ Persuasive  │ Feb 1, 2026   │ [Edit Outline]    ││
│ │ Product Launch 2026      │ Informative │ Jan 28, 2026  │ [Edit Outline]    ││
│ │ Team Retrospective       │ Persuasive  │ Jan 15, 2026  │ [Edit Outline]    ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│ [Create New Presentation]                                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Empty State Mockup (New User):**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           User Dashboard                                      │
│                     Welcome to SlideHeroes!                                   │
├──────────────────────┬──────────────────────┬────────────────────────────────┤
│ Course Progress      │ Skills Assessment    │ Kanban Summary                 │
│ ┌────────────────┐   │ ┌────────────────┐   │ ┌────────────────────────────┐ │
│ │    ╭───╮       │   │ │     ╱╲         │   │ │                            │ │
│ │   ╱  0%  ╲     │   │ │   ╱    ╲       │   │ │ No active tasks            │ │
│ │  │ Start! │    │   │ │ ─┼──────┼─     │   │ │                            │ │
│ │   ╲     ╱      │   │ │   ╲    ╱       │   │ │ Tasks will appear here     │ │
│ │    ╰───╯       │   │ │     ╲╱         │   │ │ as you progress through    │ │
│ │                │   │ │   (empty)      │   │ │ your learning journey.     │ │
│ │ Begin your     │   │ │                │   │ │                            │ │
│ │ learning       │   │ │ Discover your  │   │ │ [View Kanban Board →]      │ │
│ │ journey        │   │ │ strengths      │   │ └────────────────────────────┘ │
│ └────────────────┘   │ └────────────────┘   │                                │
│ [Start Course]       │ [Take Assessment]    │                                │
├──────────────────────┼──────────────────────┼────────────────────────────────┤
│ Recent Activity      │ Quick Actions        │ Coaching Sessions              │
│ ┌────────────────┐   │ ┌────────────────┐   │ ┌────────────────────────────┐ │
│ │                │   │ │ [Start         │   │ │                            │ │
│ │ Your activity  │   │ │  Course    ▶]  │   │ │ No sessions scheduled      │ │
│ │ will appear    │   │ │                │   │ │                            │ │
│ │ here as you    │   │ │ [New           │   │ │ Get personalized coaching  │ │
│ │ progress.      │   │ │  Presentation] │   │ │ to accelerate your         │ │
│ │                │   │ │                │   │ │ presentation skills.       │ │
│ │ [Start Course] │   │ │ [Take          │   │ │                            │ │
│ │                │   │ │  Assessment]   │   │ │ [Book a Session]           │ │
│ └────────────────┘   │ └────────────────┘   │ └────────────────────────────┘ │
├──────────────────────┴──────────────────────┴────────────────────────────────┤
│ My Presentations                                                              │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │                                                                            ││
│ │                    You haven't created any presentations yet.              ││
│ │                                                                            ││
│ │              Start by creating your first presentation outline.            ││
│ │                                                                            ││
│ │                       [Create Your First Presentation]                     ││
│ │                                                                            ││
│ └────────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

### F. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-02-03 | Use iframe for Cal.com booking, not @calcom/atoms | @calcom/atoms requires deprecated Platform OAuth; iframe works with Next.js 16/React 19 | Research findings |
| 2026-02-03 | 3-3-1 grid layout for dashboard | Matches user request; provides clear visual hierarchy with full-width table | User requirement |
| 2026-02-03 | Empty states with CTAs, not blank widgets | Research shows empty screens feel broken; CTAs drive engagement | UX research |
| 2026-02-03 | Server-side data fetching with parallel queries | 60-80% performance improvement; follows project patterns | Architecture pattern |
| 2026-02-03 | Limit activity feed to 10 items | Performance concern; prevents slow queries; sufficient for dashboard view | Technical constraint |
