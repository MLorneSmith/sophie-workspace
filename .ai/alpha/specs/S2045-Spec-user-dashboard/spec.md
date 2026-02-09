# Project Specification: User Dashboard

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S2045 |
| **GitHub Issue** | #2045 |
| **Document Owner** | Alpha Spec Agent |
| **Created** | 2026-02-09 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
A comprehensive personal dashboard at `/home` that gives SlideHeroes users an at-a-glance view of their course progress, self-assessment results, kanban tasks, recent activity, coaching sessions, and presentation outlines.

### Press Release Headline
> "SlideHeroes launches a unified User Dashboard enabling learners to track progress, manage tasks, and book coaching sessions from a single page"

### Elevator Pitch (30 seconds)
Currently the `/home` page is empty — users land on a blank screen after login. The User Dashboard transforms this into a rich, personalized landing page with 7 key widgets arranged in a 3-3-1 grid: course progress, self-assessment spider diagram, kanban summary, activity feed, quick actions, coaching sessions, and a full-width presentation outlines table. New users see visually engaging empty states with clear CTAs instead of hollow components.

---

## 2. Problem Statement

### Problem Description
After logging in, SlideHeroes users land on an empty `/home` page with no content. There is no single place to see an overview of their learning journey, upcoming tasks, or coaching sessions. Users must navigate to each section individually to understand their progress.

### Who Experiences This Problem?
All authenticated SlideHeroes users, but especially:
- **New users** who see a blank page and don't know what to do next
- **Active learners** who want a quick overview without navigating 5+ separate pages
- **Returning users** who want to resume where they left off

### Current Alternatives
Users navigate individually to `/home/course`, `/home/kanban`, `/home/coaching`, `/home/assessment`, and `/home/ai` to piece together their status. There is no aggregated view.

### Impact of Not Solving
- **Business impact**: Poor first impression leads to lower activation and retention
- **User impact**: Cognitive overhead navigating multiple pages; users miss important tasks
- **Competitive impact**: Every LMS competitor (Coursera, Udemy, Skillshare) provides a student dashboard

---

## 3. Vision & Goals

### Product Vision
A personalized command center that becomes the daily starting point for every SlideHeroes user — showing exactly what to do next, celebrating progress made, and making it effortless to jump into any workflow.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Increase /home page engagement | Time on /home page | +300% vs current 0s baseline (target: 30s avg) | Analytics (page view duration) |
| G2: Reduce navigation to reach primary workflows | Clicks to start next action | -60% (from 3+ clicks to 1 click) | Analytics (click tracking) |
| G3: Improve new user activation | % of new users who complete first action within 5 min | +40% over current baseline | Analytics (funnel tracking) |

### Strategic Alignment
The dashboard is a core UX improvement that increases daily active usage and supports SlideHeroes' mission to make presentation skills accessible. It connects all existing features (courses, assessments, kanban, coaching, AI tools) into a cohesive experience.

---

## 4. Target Users

### Primary Persona
**Name**: Active Learner (Alex)
**Role**: Professional enrolled in the SlideHeroes presentation course
**Goals**: Track course progress, complete tasks on time, prepare presentations
**Pain Points**: No overview of where they stand; must visit 5+ pages to understand progress
**Quote**: "I just want to log in and immediately know what I should work on next."

### Secondary Personas
- **New User (Nina)**: Just signed up, needs onboarding guidance and clear first actions
- **Returning User (Rob)**: Hasn't logged in for a week, wants to quickly see what changed and resume

### Anti-Personas (Who This Is NOT For)
- **Team admins** managing other users (they use `/home/[account]` team dashboard)
- **Anonymous visitors** (marketing pages only)

---

## 5. Solution Overview

### Proposed Solution
Replace the empty `/home` page (`apps/web/app/home/(user)/page.tsx`) with a dashboard containing 7 widget components in a responsive 3-3-1 grid layout. Each widget loads data via parallel server-side fetching and includes thoughtful empty states for new users.

### Key Capabilities

1. **Course Progress Radial Chart**: A donut/radial progress chart showing overall course completion percentage. Uses Recharts `PieChart` with `innerRadius` for the circular progress indicator. Empty state shows a grayed-out ring at 0% with "Start your course" CTA.

2. **Self-Assessment Spider Diagram**: A radar/spider chart visualizing category scores from the self-assessment survey. Reuses the existing `RadarChart` component pattern from `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`. Empty state shows the spider diagram axes with a dashed outline shape at 0 values and "Take Assessment" CTA.

3. **Kanban Summary Card**: Shows current "Doing" tasks (max 2-3) and the next "Do" task. Queries the `tasks` table filtered by `status = 'doing'` and `status = 'do'`. Empty state shows "No tasks yet" with "Go to Kanban Board" CTA.

4. **Recent Activity Feed**: A vertical timeline showing recent user actions: presentations created/updated, lessons completed, quiz scores achieved, assessments completed. Backed by a new `activity_events` table populated via database triggers on `course_progress`, `lesson_progress`, `quiz_attempts`, `survey_responses`, and `building_blocks_submissions`. Empty state shows a subtle timeline skeleton with "Your activity will appear here" message.

5. **Quick Actions Panel**: Contextual CTA buttons based on user state:
   - "Continue Course" → visible when `course_progress` has `started_at` but no `completed_at`
   - "New Presentation" → always visible, links to `/home/ai/blocks`
   - "Complete Assessment" → visible when no `survey_responses` exists for the user
   - "Review Storyboard" → visible when `building_blocks_submissions` drafts exist
   Empty state (new user): Shows all 4 actions with the most relevant highlighted.

6. **Coaching Sessions Card**: Shows a compact Cal.com booking embed for scheduling coaching sessions. Links to the existing `/home/coaching` page for full calendar view. If no session is booked, shows the embed inline. Uses the existing iframe pattern from `apps/web/app/home/(user)/coaching/_components/calendar.tsx` in a compact form.

7. **Presentation Outlines Table**: A full-width data table showing the user's `building_blocks_submissions` with columns: Title, Presentation Type, Last Updated, and an "Edit Outline" quick-action button linking to the outline editor. Uses the existing `DataTable` component from `@kit/ui/data-table`. Empty state shows "No presentations yet" with "Create Your First Presentation" CTA.

### Customer Journey

1. **New user logs in** → Sees the dashboard with engaging empty states, spider diagram shows axes at 0, progress ring at 0%, quick actions highlight "Start Course" and "Take Assessment"
2. **User starts course** → Course progress ring fills, lessons appear in activity feed, kanban tasks populate
3. **User takes assessment** → Spider diagram populates with category scores, "Complete Assessment" CTA disappears
4. **User creates presentation** → Presentation outlines table populates, activity feed shows creation event
5. **User books coaching** → Coaching card shows embed for scheduling
6. **Daily return** → Dashboard shows progress since last visit, next tasks, recent activity

### Hypothetical Customer Quote
> "The dashboard finally makes me feel like I know exactly where I stand and what to do next. I used to get lost navigating between pages."
> — Alex, Active Learner

### Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (<768px) | Single column stack: all 7 widgets stacked vertically | Priority order: Quick Actions, Course Progress, Kanban, Activity, Spider, Coaching, Table |
| Tablet (768-1024px) | 2-column grid with table full-width below | Row 1: 2 widgets, Row 2: 2 widgets, Row 3: remaining, Row 4: table |
| Desktop (>1024px) | 3-3-1 grid as designed | Row 1: Progress + Spider + Kanban, Row 2: Activity + Quick Actions + Coaching, Row 3: Table |

---

## 6. Scope Definition

### In Scope

- [x] Replace empty `/home` page with dashboard layout
- [x] Course progress radial chart component
- [x] Self-assessment spider diagram component (reuse existing RadarChart pattern)
- [x] Kanban summary card component
- [x] Recent activity feed with new `activity_events` table
- [x] Database triggers to populate activity_events from existing tables
- [x] Quick actions panel with contextual CTAs
- [x] Coaching sessions card with compact Cal.com embed
- [x] Presentation outlines data table
- [x] Server-side parallel data loading via loader pattern
- [x] Empty states for all 7 components (new user experience)
- [x] Responsive layout (mobile, tablet, desktop)
- [x] Dark mode support (using semantic color classes)

### Out of Scope

- [ ] Real-time updates (WebSocket/SSE) — data refreshes on page load only
- [ ] Drag-and-drop dashboard customization (fixed layout)
- [ ] Team dashboard (`/home/[account]`) — personal account only
- [ ] Gamification features (streaks, badges, achievements)
- [ ] Push notifications for activity events
- [ ] Cal.com V2 API integration for fetching bookings (using embed only)
- [ ] Analytics/tracking implementation
- [ ] Onboarding wizard or guided tour

### Future Considerations (v2+)

- Real-time activity feed updates via Supabase Realtime subscriptions
- Dashboard widget customization/reordering
- Achievement badges and learning streaks
- Cal.com V2 API for showing upcoming booked sessions inline
- AI-powered "Recommended next steps" widget
- Print/export dashboard summary

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| `public.course_progress` table | DB (Supabase) | Read `completion_percentage`, `current_lesson_id`, `started_at`, `completed_at` for radial chart |
| `public.survey_responses` table | DB (Supabase) | Read `category_scores` JSONB for spider diagram |
| `public.tasks` table | DB (Supabase) | Read tasks where `status = 'doing'` and `status = 'do'` for kanban summary |
| `public.activity_events` table (NEW) | DB (Supabase) | New table for activity feed; populated via triggers |
| `public.building_blocks_submissions` table | DB (Supabase) | Read for presentation outlines table |
| `public.lesson_progress` table | DB (Supabase) | Trigger source for activity events |
| `public.quiz_attempts` table | DB (Supabase) | Trigger source for activity events |
| Cal.com embed | iframe | Compact booking widget via `https://cal.com/slideheroes.com/60min?embed=true` |
| Payload CMS (`getCourses`) | HTTP API | Fetch course metadata (title) for display context |
| Recharts 3.5.1 | npm package | Charts (PieChart for radial, RadarChart for spider) via `@kit/ui/chart` |
| `@kit/ui/data-table` | npm package | DataTable for presentation outlines |

### Technical Constraints

- **Performance**: Dashboard must load in < 2s (parallel data fetching for all 7 widgets)
- **Security**: All queries scoped by RLS (`user_id = (select auth.uid())`)
- **Compliance**: No PII exposed in activity events beyond what user already sees
- **Scalability**: Activity events table should be indexed and have retention policy considerations

### Technology Preferences/Mandates

- Server Components for initial render (client components only for interactive charts)
- Recharts 3.5.1 via `@kit/ui/chart` (already installed)
- shadcn/ui Card, DataTable, Badge, Button, Skeleton components
- `enhanceAction` pattern not needed (read-only dashboard, no mutations)
- Loader pattern with `Promise.all()` for parallel data fetching

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Recharts 3.5.1 | Recharts team | Low | Already installed and working in codebase |
| Cal.com embed | Cal.com | Low | Already working in `/home/coaching` |
| Supabase triggers | SlideHeroes | Medium | New triggers need testing for race conditions |
| Payload CMS API | SlideHeroes | Low | Already working for course/lesson data |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Users have a personal account**: Dashboard is personal account only (`/home/(user)`) — *Validation: Check auth middleware*
2. **Existing tables have data**: `course_progress`, `survey_responses`, `tasks`, `building_blocks_submissions` are populated by existing features — *Validation: Check existing workflows*
3. **Cal.com embed works in compact form**: The iframe can render in a smaller card-sized container — *Validation: Test with reduced height*
4. **Activity events table won't grow unbounded**: Activity data volume is manageable per user — *Validation: Monitor row counts, consider retention policy*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Dashboard load time > 2s with 7 parallel queries | Medium | High | Use `Promise.all()`, add Supabase indexes, consider caching | Dev team |
| R2 | Activity events triggers create performance overhead on writes | Medium | Medium | Use `AFTER INSERT` triggers (async), monitor query latency | Dev team |
| R3 | Cal.com embed renders poorly in compact card | Low | Medium | Fallback to "Book Session" link to `/home/coaching` if embed is too large | Dev team |
| R4 | Empty state designs don't feel engaging enough | Medium | Medium | Iterate on design with user feedback, use illustrations/icons | Design team |

### Open Questions

1. [ ] What is the maximum number of activity events to display in the feed? (Recommend: 10 most recent)
2. [ ] Should activity events have a retention/cleanup policy? (Recommend: keep 90 days)
3. [ ] What course ID should we use for the progress radial? (Assume: the first/only course the user is enrolled in)

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [x] All 7 dashboard widgets render with real data
- [x] All 7 widgets show appropriate empty states for new users
- [x] Dashboard loads in < 2s with parallel data fetching
- [x] Responsive layout works on mobile, tablet, and desktop
- [x] Dark mode supported across all widgets
- [x] `activity_events` table created with RLS policies and triggers
- [x] TypeScript types generated and passing `pnpm typecheck`
- [x] Linting passes with `pnpm lint`
- [x] No accessibility violations (keyboard navigation, screen reader labels)

### Launch Criteria

- Dashboard renders correctly for both new and existing users
- All database queries complete in < 100ms individually
- No regression in existing page performance
- Activity event triggers don't cause > 5ms overhead on source table writes

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| /home page time on page | 0s (empty page) | 30s average | 2 weeks post-launch |
| Clicks to primary workflow | 3+ clicks | 1 click via Quick Actions | 2 weeks post-launch |
| New user first action rate | Unknown (no tracking) | 60% within 5 min | 4 weeks post-launch |

---

## 10. Decomposition Hints

### Standard Initiative Categories to Consider

1. **Foundation/Layout** (P0) - Dashboard page structure, grid layout, routing, responsive breakpoints, loader skeleton
2. **Data Layer** (P0) - Activity events table + triggers, dashboard data loader with parallel fetching, type definitions
3. **Core Widgets** (P1) - The 7 dashboard widget components (course progress, spider diagram, kanban summary, activity feed, quick actions, coaching, outlines table)
4. **Empty States & Polish** (P2) - Empty state designs for all 7 widgets, loading skeletons, error boundaries, accessibility

### Candidate Initiatives

1. **Dashboard Foundation & Layout** (P0): Page structure, responsive grid, routing update, page header, loader skeleton. Maps to overall page shell.
2. **Dashboard Data Layer** (P0): New `activity_events` table, database triggers, dashboard page loader with `Promise.all()`, Supabase type generation. Maps to data infrastructure.
3. **Dashboard Core Widgets — Row 1** (P1): Course Progress Radial Chart, Self-Assessment Spider Diagram, Kanban Summary Card. Maps to Key Capabilities 1-3.
4. **Dashboard Core Widgets — Row 2** (P1): Recent Activity Feed, Quick Actions Panel, Coaching Sessions Card. Maps to Key Capabilities 4-6.
5. **Dashboard Presentations Table** (P1): Full-width presentation outlines DataTable with edit actions. Maps to Key Capability 7.
6. **Dashboard Empty States & Polish** (P2): Empty state designs for all widgets, loading skeletons, responsive fine-tuning, dark mode verification, accessibility audit. Maps to new user experience requirement.

### Suggested Priority Order

1. **P0**: Foundation & Layout → Data Layer (must exist before widgets)
2. **P1**: Core Widgets Row 1 → Core Widgets Row 2 → Presentations Table (can partially parallelize)
3. **P2**: Empty States & Polish (depends on all widgets existing)

> Foundation and Data Layer are P0 because all widgets depend on the page structure and data availability.

### Complexity Indicators

| Area | Complexity | Rationale (based on codebase findings) |
|------|------------|----------------------------------------|
| Foundation/Layout | Low | Existing page at `apps/web/app/home/(user)/page.tsx` + established grid patterns in `dashboard-demo-charts.tsx` |
| Activity Events Table + Triggers | Medium | New table + 5 triggers on existing tables; trigger testing needed; RLS policies required |
| Course Progress Radial | Low | Recharts PieChart with innerRadius; data from single `course_progress` row |
| Spider Diagram | Low | Existing `RadarChart` component can be reused from `assessment/survey/_components/radar-chart.tsx` |
| Kanban Summary | Low | Simple query on `tasks` table filtered by status; existing schemas available |
| Activity Feed | Medium | New table, timeline UI component needs building (no existing timeline component), query ordering |
| Quick Actions | Medium | Conditional logic across 4+ tables to determine which actions to show; needs multiple data sources |
| Coaching Card | Low | Existing Cal.com iframe pattern; just needs compact sizing |
| Presentations Table | Low | Existing `DataTable` component + `building_blocks_submissions` table |
| Empty States | Medium | 7 unique empty state designs; spider diagram empty state needs zero-value data rendering |

---

## 11. Appendices

### A. Glossary

| Term | Definition |
|------|-----------|
| **Radial Chart** | A circular/donut chart showing progress as a filled arc (Recharts PieChart with innerRadius) |
| **Spider Diagram** | A radar/web chart showing multiple category scores on radiating axes (Recharts RadarChart) |
| **Kanban Summary** | A compact view of the user's task board showing current and next tasks |
| **Activity Event** | A record of a user action (lesson completed, quiz taken, etc.) stored in `activity_events` table |
| **Building Blocks** | The SCA (Situation-Complication-Answer) presentation structuring framework |
| **Empty State** | The UI shown when a widget has no data to display |

### B. Codebase Exploration Results (REQUIRED)

| Component/Pattern Found | File Path | Reusable? | Notes |
|------------------------|-----------|-----------|-------|
| RadarChart component | `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | Yes | Existing spider diagram with empty state handling; reuse pattern |
| Cal.com iframe embed | `apps/web/app/home/(user)/coaching/_components/calendar.tsx` | Pattern only | Compact version needed for dashboard card |
| Dashboard demo charts | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` | Pattern only | Grid layout pattern, card structure, chart integration |
| ChartContainer/Tooltip | `packages/ui/src/shadcn/chart.tsx` | Yes | Recharts wrapper with theming (ChartContainer, ChartTooltip, ChartConfig) |
| Card components | `packages/ui/src/shadcn/card.tsx` | Yes | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| DataTable component | `packages/ui/src/shadcn/data-table.tsx` | Yes | TanStack React Table integration with column definitions |
| EmptyState component | `packages/ui/src/makerkit/empty-state.tsx` | Yes | EmptyState, EmptyStateHeading, EmptyStateText, EmptyStateButton |
| Badge component | `packages/ui/src/shadcn/badge.tsx` | Yes | Status indicators (success, warning, info, destructive, outline) |
| Skeleton component | `packages/ui/src/shadcn/skeleton.tsx` | Yes | Loading state placeholders with pulse animation |
| Progress component | `packages/ui/src/shadcn/progress.tsx` | Yes | Horizontal progress bar (alternative to radial for mobile) |
| HomeLayoutPageHeader | `apps/web/app/home/(user)/_components/home-page-header.tsx` | Yes | Existing page header for personal account pages |
| PageBody component | `packages/ui/src/makerkit/page.tsx` | Yes | Standard page body wrapper |
| Task schemas | `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts` | Yes | TaskStatus, TaskPriority, Task, Subtask types |
| Personal nav config | `apps/web/config/personal-account-navigation.config.tsx` | Yes | Navigation already includes /home route |
| Paths config | `apps/web/config/paths.config.ts` | Yes | `pathsConfig.app.home` = `/home`, all other paths defined |
| Course API | `packages/cms/payload/src/api/course.ts` | Yes | `getCourses()`, `getCourseBySlug()` for course metadata |
| Survey API | `packages/cms/payload/src/api/survey.ts` | Yes | Survey data fetching from Payload CMS |
| loadUserWorkspace | `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts` | Yes | Cached workspace loader with user/account context |

**Tables/Schemas Identified:**

| Table Name | Location | Purpose |
|------------|----------|---------|
| `public.course_progress` | `migrations/20250319104726_web_course_system.sql` | Course completion %, current lesson, dates |
| `public.lesson_progress` | `migrations/20250319104726_web_course_system.sql` | Per-lesson completion tracking |
| `public.quiz_attempts` | `migrations/20250319104726_web_course_system.sql` | Quiz scores, answers, pass/fail |
| `public.survey_responses` | `migrations/20250319104724_web_survey_system.sql` | Category scores JSONB, completion status |
| `public.tasks` | `migrations/20250221144500_web_create_kanban_tables.sql` | Kanban tasks with status enum (do/doing/done) |
| `public.subtasks` | `migrations/20250221144500_web_create_kanban_tables.sql` | Task subtasks with completion status |
| `public.building_blocks_submissions` | `migrations/20250211000000_web_create_building_blocks_submissions.sql` | Presentation outlines (title, outline, SCA framework) |
| `public.activity_events` (NEW) | To be created | User activity timeline events |

### C. Research Integration (REQUIRED)

| Research File | Key Findings | Spec Section(s) Affected |
|--------------|--------------|-------------------------|
| `perplexity-calcom-nextjs-integration-post-platform.md` | 1. Skip @calcom/atoms (requires deprecated Platform OAuth). 2. Use iframe embed for simplicity (Option A). 3. V2 API with Bearer token for bookings (not used in v1). 4. Required env vars: NEXT_PUBLIC_CALCOM_COACH_USERNAME, CALCOM_API_KEY. 5. @calcom/embed-react NOT recommended for Next.js 15+ (hydration issues). | Section 5 (Coaching Sessions Card), Section 7 (Cal.com integration) |
| `perplexity-dashboard-empty-states-ux.md` | 1. Never leave screens blank — always provide CTAs and guidance. 2. Use inverted pyramid: KPIs top, details middle, depth bottom. 3. 3-3-1 grid follows Z-pattern eye flow. 4. Education platforms use progress circles, card grids, achievement badges. 5. Progressive disclosure reduces cognitive load 40-60%. | Section 5 (all empty states), Section 5 (Responsive Behavior), Section 10 (Priority Order) |
| `context7-recharts-radial-radar-charts.md` | 1. No RadialBarChart component — use PieChart with innerRadius (donut). 2. RadarChart well-supported with PolarGrid, PolarAngleAxis. 3. Recharts renders nothing on empty data — need conditional rendering. 4. Always wrap in ResponsiveContainer. 5. Accessibility built-in in Recharts 3.0+. | Section 5 (Course Progress Radial, Spider Diagram), Section 7 (Recharts integration) |

### D. External References

- Cal.com V2 API docs: https://cal.com/docs/api/v2
- Cal.com embed docs: https://cal.com/docs/core-features/embed
- Recharts docs: https://recharts.org
- shadcn/ui chart docs: https://ui.shadcn.com/docs/components/chart
- Nielsen Norman Group empty states: https://www.nngroup.com/articles/empty-state-interface-design/

### E. Visual Assets

**ASCII Layout Mockup:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Dashboard                                                                   │
│  Welcome back! Here's your learning overview.                                │
├───────────────────────┬───────────────────────┬──────────────────────────────┤
│ Course Progress       │ Self-Assessment        │ Kanban Summary              │
│                       │                        │                             │
│    ╭───────╮          │     ╱ Design ╲         │ 🔵 DOING                    │
│   ╱  72%    ╲         │   ╱           ╲        │ • Prepare slide deck        │
│  │           │        │  Content───Delivery    │ • Review storyboard         │
│   ╲         ╱         │   ╲           ╱        │                             │
│    ╰───────╯          │     ╲ Story ╱          │ ⬜ NEXT UP                   │
│                       │                        │ • Complete quiz 3           │
│ 12 of 16 lessons      │ Last taken: Jan 15     │                             │
│ [Continue Course →]   │ [Retake Assessment →]  │ [View Board →]              │
├───────────────────────┼───────────────────────┼──────────────────────────────┤
│ Recent Activity       │ Quick Actions          │ Coaching Sessions           │
│                       │                        │                             │
│ ● Completed Lesson 11 │ [▶ Continue Course]    │ ┌─────────────────────────┐ │
│   Today, 2:30 PM      │                        │ │  Cal.com Embed          │ │
│ ● Quiz Score: 85%     │ [+ New Presentation]   │ │  (compact booking       │ │
│   Today, 1:15 PM      │                        │ │   widget)               │ │
│ ● Created outline     │ [📋 Complete Survey]   │ │                         │ │
│   Yesterday           │                        │ │  [Book Session]         │ │
│ ● Completed Lesson 10 │ [📝 Review Storyboard] │ └─────────────────────────┘ │
│   Feb 7               │                        │                             │
│                       │                        │ [View Full Calendar →]      │
├───────────────────────┴───────────────────────┴──────────────────────────────┤
│ Presentation Outlines                                                        │
│ ┌────────────────────────┬──────────────┬──────────────┬───────────────────┐ │
│ │ Title                  │ Type         │ Last Updated │ Actions           │ │
│ ├────────────────────────┼──────────────┼──────────────┼───────────────────┤ │
│ │ Q1 Sales Review        │ Persuasive   │ Feb 8, 2026  │ [Edit Outline →]  │ │
│ │ Product Launch Talk    │ Informative  │ Feb 5, 2026  │ [Edit Outline →]  │ │
│ │ Team Retrospective     │ Consultative │ Jan 30, 2026 │ [Edit Outline →]  │ │
│ └────────────────────────┴──────────────┴──────────────┴───────────────────┘ │
│                                                    [+ New Presentation →]     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Empty State Mockup (New User):**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Dashboard                                                                   │
│  Welcome to SlideHeroes! Let's get started.                                  │
├───────────────────────┬───────────────────────┬──────────────────────────────┤
│ Course Progress       │ Self-Assessment        │ Kanban Summary              │
│                       │                        │                             │
│    ╭───────╮          │     ╱ ─ ─ ─ ╲         │                             │
│   ╱   0%    ╲         │   ╱   empty   ╲        │  No tasks yet.              │
│  │  ░░░░░░░  │        │  ─ ─ ─ ─ ─ ─ ─ ─      │                             │
│   ╲         ╱         │   ╲           ╱        │  Tasks will appear here     │
│    ╰───────╯          │     ╲ ─ ─ ─ ╱          │  when you start your        │
│                       │                        │  course.                    │
│ Start your learning   │ Discover your          │                             │
│ journey today!        │ strengths              │ [Go to Kanban →]            │
│ [Start Course →]      │ [Take Assessment →]    │                             │
├───────────────────────┼───────────────────────┼──────────────────────────────┤
│ Recent Activity       │ Quick Actions          │ Coaching Sessions           │
│                       │                        │                             │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │ [▶ Start Course]       │                             │
│ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │                        │ Book a 1-on-1 session      │
│                       │ [+ New Presentation]   │ with our presentation       │
│ Your activity will    │                        │ coach.                      │
│ appear here as you    │ [📋 Take Assessment]   │                             │
│ progress through      │                        │ [Book Session →]            │
│ the course.           │ [🧠 Explore AI Tools]  │                             │
│                       │                        │                             │
├───────────────────────┴───────────────────────┴──────────────────────────────┤
│ Presentation Outlines                                                        │
│                                                                              │
│  You haven't created any presentations yet.                                  │
│  Use our AI-powered tools to build your first presentation outline.          │
│                                                                              │
│                    [+ Create Your First Presentation →]                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Mockup Requirements Checklist:**
- [x] Component names match Key Capabilities (Section 5)
- [x] Layout matches 3-3-1 grid description
- [x] Sample content shows what each component displays
- [x] Table shows column structure (Title, Type, Last Updated, Actions)
- [x] Empty state mockup shows new user experience

### F. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-02-09 | Build dashboard into existing `/home` page | Natural landing page, avoids extra navigation | User + Agent |
| 2026-02-09 | Use Cal.com embed only (no V2 API) | Simpler implementation, V2 API deferred to v2 | User |
| 2026-02-09 | Create new `activity_events` table | Cleaner queries vs. deriving from 5+ tables; enables future real-time features | User |
| 2026-02-09 | Use Recharts PieChart with innerRadius for progress | No RadialBarChart in Recharts; donut chart is the standard pattern | Research (context7) |
| 2026-02-09 | Reuse existing RadarChart pattern | Already implemented in assessment survey; consistent codebase | Codebase exploration |
| 2026-02-09 | 3-3-1 grid layout | Follows Z-pattern eye flow; aligns with research on dashboard layouts | Research (perplexity) |
