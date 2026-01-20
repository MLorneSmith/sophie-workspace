# Project Specification: User Dashboard

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S1607 |
| **GitHub Issue** | #1607 |
| **Document Owner** | Claude Code |
| **Created** | 2026-01-20 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
A comprehensive personal user dashboard at `/home` providing at-a-glance visibility into course progress, self-assessment results, tasks, recent activity, quick actions, coaching sessions, and presentation outlines.

### Press Release Headline
> "SlideHeroes launches User Dashboard enabling learners to track their presentation mastery journey from a single, actionable view"

### Elevator Pitch (30 seconds)
The User Dashboard transforms the currently empty `/home` page into a command center for presentation skills development. Users can see their course completion at a glance with a radial progress chart, understand their strengths via a spider diagram from self-assessments, manage their kanban tasks, review recent activity across the platform, take contextual quick actions, book or view upcoming coaching sessions, and jump directly into editing their presentation outlines - all from one unified interface.

---

## 2. Problem Statement

### Problem Description
Currently, the personal account home page (`/home/(user)/page.tsx`) is essentially empty - it shows only a header with no content in the `PageBody`. Users must navigate to individual sections (course, kanban, assessment, coaching) to understand their progress, creating a fragmented experience that reduces engagement and makes it difficult to maintain momentum in their learning journey.

### Who Experiences This Problem?
- **Primary learners** completing the presentation skills course who need visibility into their overall progress
- **Active users** juggling multiple activities (presentations, assessments, coaching) who need a unified view
- **Returning users** who want to quickly resume where they left off without navigating multiple pages

### Current Alternatives
Users must visit individual pages to gather information:
- `/home/course` for course progress
- `/home/assessment` for self-assessment results
- `/home/kanban` for task status
- `/home/coaching` for session booking
- Individual presentation pages for outline editing

This requires 5+ page visits to get a complete picture of their status.

### Impact of Not Solving
- **Business impact**: Lower engagement and course completion rates; users may churn without clear progress visibility
- **User impact**: Frustration from fragmented experience; difficulty maintaining momentum in learning journey
- **Competitive impact**: Modern learning platforms provide unified dashboards; SlideHeroes risks appearing outdated

---

## 3. Vision & Goals

### Product Vision
A personalized, actionable dashboard that becomes the user's primary destination, surfacing the most relevant information and enabling quick actions to maintain learning momentum. The dashboard should feel like a "mission control" for their presentation mastery journey.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Increase home page engagement | Daily active users on /home | +50% vs current baseline (estimated 200/day) | Analytics pageview tracking |
| G2: Improve course completion rate | Users completing 100% course progress | +25% improvement over 90-day period | Course completion events |
| G3: Reduce navigation friction | Clicks to access key features from home | Reduce from 5+ to 1 click | User journey analytics |
| G4: Increase coaching session bookings | Users who book sessions from dashboard | +30% booking rate | Cal.com booking events |

### Strategic Alignment
This dashboard directly supports SlideHeroes' core mission of helping users develop presentation skills by:
- Making progress visible and motivating (course progress, assessment results)
- Reducing friction to continue learning (quick actions, presentation outlines table)
- Encouraging comprehensive skill development (coaching sessions, assessment completion)

---

## 4. Target Users

### Primary Persona
**Name**: Alex, the Ambitious Professional
**Role**: Mid-career professional preparing for high-stakes presentations
**Goals**: Complete the course efficiently, develop well-structured presentations, get coaching feedback
**Pain Points**: Limited time, needs to quickly see what to do next, loses momentum when progress isn't visible
**Quote**: "I want to see my progress and know exactly what I should work on next, without hunting through multiple pages."

### Secondary Personas
1. **Taylor, the Team Lead**: Uses SlideHeroes to improve team presentation skills, needs to track personal progress while managing team
2. **Jordan, the New User**: Just started the course, needs clear guidance on next steps and motivation to continue

### Anti-Personas (Who This Is NOT For)
- **Team administrators** viewing team-wide analytics (separate team dashboard exists)
- **Content creators** managing course content (Payload CMS handles this)
- **Casual browsers** who haven't started any course or activities

---

## 5. Solution Overview

### Proposed Solution
A responsive dashboard page at `/home` featuring 7 widgets arranged in a 3-3-1 grid layout:
- **Row 1**: Course Progress Radial Chart, Spider Diagram (Self-Assessment), Kanban Summary Card
- **Row 2**: Recent Activity Feed, Quick Actions Panel, Coaching Sessions Widget
- **Row 3**: Presentation Outlines Table (full-width)

### Key Capabilities

1. **Course Progress Radial Chart**: Circular progress visualization showing overall course completion percentage with quick navigation to continue learning

2. **Spider Diagram (Self-Assessment)**: Radar chart displaying category scores from the user's most recent self-assessment survey, highlighting strengths and areas for improvement

3. **Kanban Summary Card**: Compact view showing current "Doing" tasks and next "Do" task, with quick link to full kanban board

4. **Recent Activity Feed**: Reverse-chronological timeline showing last 30 days of:
   - Presentations created/updated
   - Lessons completed
   - Quiz scores achieved
   - Assessments completed

5. **Quick Actions Panel**: Contextual CTAs based on user state:
   - "Continue Course" (if course in progress)
   - "New Presentation"
   - "Complete Assessment" (if not done)
   - "Review Storyboard" (if drafts exist)

6. **Coaching Sessions Widget**:
   - If sessions booked: Display next 1-2 upcoming sessions with date/time, join link, reschedule option
   - If no sessions: Show CTA button to Cal.com booking page

7. **Presentation Outlines Table**: Sortable table of user's presentation outlines with quick "Edit" button to jump directly to outline editing

### Customer Journey

1. **User logs in** and lands on `/home` dashboard
2. **Sees progress at a glance**: Course completion %, assessment strengths, current tasks
3. **Identifies next action**: Quick actions panel highlights most relevant CTA
4. **Takes action**: One click to continue course, book coaching, or edit presentation
5. **Returns regularly**: Dashboard becomes habitual starting point for all activities

### Hypothetical Customer Quote
> "Finally! I can see everything in one place. The quick actions panel knows exactly what I need to do next, and I love being able to jump into my presentation outlines without navigating around."
> — Alex, Mid-career Professional

### Responsive Behavior (if UI feature)

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (<768px) | Single column, stacked widgets | All widgets stack vertically; table becomes horizontally scrollable |
| Tablet (768-1024px) | 2-column grid for rows 1-2; full-width row 3 | Widgets pair up; table spans full width |
| Desktop (>1024px) | 3-3-1 grid as designed | Primary design target |

---

## 6. Scope Definition

### In Scope

- [x] Course Progress Radial Chart component using Recharts RadialBarChart
- [x] Spider Diagram component reusing existing `RadarChart` from assessment
- [x] Kanban Summary Card showing current "Doing" and next "Do" task
- [x] Recent Activity Feed with last 30 days, grouped by time periods
- [x] Quick Actions Panel with contextual CTAs
- [x] Coaching Sessions Widget with Cal.com embed for booking
- [x] Presentation Outlines Table with "Edit" quick action
- [x] Server-side data loader with parallel fetching for all widgets
- [x] Responsive 3-3-1 grid layout
- [x] Empty states for all widgets when no data exists
- [x] Loading skeletons for each widget

### Out of Scope

- [ ] Real-time updates (refresh on page load only)
- [ ] Widget customization/reordering by users
- [ ] Team-level dashboard views
- [ ] Gamification elements (badges, streaks, leaderboards)
- [ ] Push notifications for activity
- [ ] Activity feed filtering by type
- [ ] Dashboard analytics/heatmaps

### Future Considerations (v2+)
- Real-time activity feed updates via Supabase Realtime
- User-customizable widget arrangement (drag-and-drop)
- Additional widgets: Weekly learning goals, achievement badges, peer comparisons
- Export dashboard data to PDF

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| `public.course_progress` | DB/RLS | Course completion percentage, current lesson |
| `public.lesson_progress` | DB/RLS | Lesson completion status for activity feed |
| `public.quiz_attempts` | DB/RLS | Quiz scores for activity feed |
| `public.survey_responses` | DB/RLS | Category scores for spider diagram |
| `public.tasks` | DB/RLS | Kanban tasks filtered by status |
| `public.building_blocks_submissions` | DB/RLS | Presentation outlines with timestamps |
| Cal.com | External API/Embed | Booking widget and upcoming sessions display |

### Technical Constraints

- **Performance**: Page must load with all widgets in <2s (parallel data fetching required)
- **Security**: All data fetched via RLS-protected Supabase client (no admin bypass)
- **Compliance**: User can only see their own data (multi-tenant isolation)
- **Scalability**: Activity feed limited to 30 days to prevent query performance issues

### Technology Preferences/Mandates

- **Charts**: Recharts (already in codebase) - RadialBarChart for progress, RadarChart for spider
- **Layout**: CSS Grid with Tailwind responsive classes
- **Components**: Shadcn/ui Card, Table, Button, Badge components
- **Data Fetching**: Server Component with `Promise.all()` parallel loading
- **Booking**: Cal.com embed widget (external service integration)

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Cal.com API availability | External | Medium | Need fallback UI if Cal.com unavailable |
| Existing course progress tracking | Internal | Low | Tables already exist with data |
| Survey response data structure | Internal | Low | `category_scores` JSONB already populated |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Users have started the course**: Dashboard assumes most users have some course progress data — *Validation: Empty state designs for new users*
2. **Cal.com integration is feasible**: Assuming Cal.com provides embeddable widgets and API for upcoming sessions — *Validation: Spike research on Cal.com SDK*
3. **Activity data exists in timestamps**: Assuming `created_at`/`updated_at` fields provide sufficient activity tracking — *Validation: Query existing tables for timestamp coverage*
4. **Survey responses have category_scores**: Assuming self-assessment populates `category_scores` JSONB for spider diagram — *Validation: Verify survey_responses data structure*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Cal.com embed may not support all required features | Medium | Medium | Design fallback "Book on Cal.com" link if embed fails | Developer |
| R2 | Activity feed query may be slow with many records | Low | High | Add database indexes on created_at, limit to 30 days | Developer |
| R3 | No existing activity tracking table | Medium | Medium | Use existing timestamps on tables; consider adding events table in v2 | Developer |
| R4 | Spider diagram empty for users without assessment | High | Low | Design engaging empty state encouraging assessment completion | Designer |

### Open Questions

1. [ ] Does Cal.com provide an API to fetch upcoming sessions, or only embed widgets?
2. [ ] Should the activity feed include AI workspace activities (presentation generation)?
3. [ ] What is the exact URL/route for the Cal.com booking page to link to?

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] All 7 widgets render correctly with real data
- [ ] Empty states display appropriately when no data exists
- [ ] Page loads in <2s with all widgets populated
- [ ] Responsive layout works on mobile, tablet, and desktop
- [ ] All widgets link to appropriate detail pages
- [ ] Cal.com booking widget integrates successfully
- [ ] E2E tests cover critical user flows
- [ ] Accessibility audit passes (WCAG 2.1 AA)

### Launch Criteria

- [ ] No critical bugs in QA testing
- [ ] Performance budget met (LCP <2.5s, CLS <0.1)
- [ ] Analytics tracking implemented for widget interactions
- [ ] Feature flag available for gradual rollout

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| Daily /home page views | ~200 (estimated) | 300 | 30 days post-launch |
| Course completion rate | Current rate | +25% | 90 days post-launch |
| Session bookings from dashboard | 0 | 20+ per week | 30 days post-launch |
| Average time on dashboard | N/A | >60 seconds | 30 days post-launch |

---

## 10. Decomposition Hints

### Standard Initiative Categories to Consider

1. **Foundation/Layout** (P0) - Page structure, responsive grid, routing, shell with loading states
2. **Data Layer** (P0/P1) - Unified dashboard loader with parallel fetching, type definitions
3. **Core Components** - The 7 widgets that deliver primary value
4. **Integrations** (P2) - Cal.com external API integration (higher risk, can be parallel)
5. **Polish & Edge Cases** - Empty states, loading skeletons, error handling, accessibility

### Candidate Initiatives

| Priority | Initiative | Description | Maps to Key Capability |
|----------|------------|-------------|----------------------|
| P0 | Foundation & Layout | Page structure, grid system, header, responsive shell | Overall dashboard structure |
| P0 | Data Layer | Unified loader with parallel fetching for all 7 widgets | All widgets |
| P1 | Course Progress Widget | RadialBarChart component with center label | Key Capability 1 |
| P1 | Assessment Spider Widget | Reuse/adapt existing RadarChart | Key Capability 2 |
| P1 | Kanban Summary Widget | Task summary card with "Doing"/"Next" | Key Capability 3 |
| P1 | Activity Feed Widget | Timeline component with time grouping | Key Capability 4 |
| P1 | Quick Actions Widget | Contextual CTA panel | Key Capability 5 |
| P2 | Coaching Sessions Widget | Cal.com integration (external API) | Key Capability 6 |
| P1 | Outlines Table Widget | Sortable table with edit actions | Key Capability 7 |
| P2 | Polish & Accessibility | Empty states, skeletons, ARIA, keyboard nav | All widgets |

### Suggested Priority Order

1. **P0: Foundation** - Must have page structure before widgets
2. **P0: Data Layer** - Loaders enable all widget development
3. **P1: Core Widgets** (can parallelize) - Progress, Spider, Kanban, Activity, Quick Actions, Outlines
4. **P2: Coaching Widget** - External integration, higher risk, can be developed in parallel
5. **P2: Polish** - After core functionality works

### Complexity Indicators

| Area | Complexity | Rationale (based on codebase findings) |
|------|------------|----------------------------------------|
| Course Progress Widget | Low | RadialBarChart pattern documented; simple data structure from `course_progress` table |
| Spider Diagram Widget | Low | Existing `RadarChart` component at `assessment/survey/_components/radar-chart.tsx` can be reused |
| Kanban Summary Widget | Low | Simple query on `tasks` table with status filter; existing kanban patterns in codebase |
| Activity Feed Widget | Medium | Requires aggregating data from multiple tables; time grouping logic; no existing component |
| Quick Actions Widget | Low | Simple conditional rendering based on user state; existing Button/Card components |
| Coaching Widget | High | External Cal.com integration; API research needed; fallback handling required |
| Outlines Table Widget | Low | Existing `Table` components; simple query on `building_blocks_submissions` |
| Data Layer | Medium | Parallel fetching pattern exists but need to aggregate 7+ data sources |

---

## 11. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| Radial Progress | Circular chart showing completion percentage (0-100%) |
| Spider Diagram | Radar/web chart showing multiple category scores on axes |
| Kanban | Task management system with columns (Do, Doing, Done) |
| Activity Feed | Reverse-chronological list of user actions/events |
| Cal.com | External scheduling/booking service for coaching sessions |
| SCQ Framework | Situation-Complication-Question presentation structure |

### B. Codebase Exploration Results (REQUIRED)

| Component/Pattern Found | File Path | Reusable? | Notes |
|------------------------|-----------|-----------|-------|
| RadarChart component | `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | Yes | Directly reusable for spider diagram |
| DashboardDemo charts | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` | Pattern only | Reference for chart patterns, Card layout |
| HomeLayoutPageHeader | `apps/web/app/home/(user)/_components/home-page-header.tsx` | Yes | Page header wrapper |
| Page/PageBody | `packages/ui/src/makerkit/page.tsx` | Yes | Standard page layout primitives |
| Card components | `packages/ui/src/shadcn/card.tsx` | Yes | Card, CardHeader, CardTitle, CardContent |
| Table components | `packages/ui/src/shadcn/table.tsx` | Yes | Table, TableHeader, TableRow, TableCell |
| Badge component | `packages/ui/src/shadcn/badge.tsx` | Yes | Status indicators with variants |
| ChartContainer | `packages/ui/src/shadcn/chart.tsx` | Yes | Recharts wrapper with theming |
| Progress component | `packages/ui/src/shadcn/progress.tsx` | Yes | Linear progress (backup for radial) |
| EmptyState component | `packages/ui/src/makerkit/empty-state.tsx` | Yes | EmptyStateHeading, EmptyStateText, EmptyStateButton |
| Workspace loader pattern | `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts` | Pattern only | Cached parallel data fetching pattern |

**Tables/Schemas Identified:**

| Table Name | Location | Purpose |
|------------|----------|---------|
| `course_progress` | `migrations/20250319104726_web_course_system.sql` | Course completion %, current lesson |
| `lesson_progress` | `migrations/20250319104726_web_course_system.sql` | Individual lesson completion |
| `quiz_attempts` | `migrations/20250319104726_web_course_system.sql` | Quiz scores and timestamps |
| `survey_responses` | `migrations/20250319104724_web_survey_system.sql` | Assessment category_scores JSONB |
| `tasks` | `migrations/20250221144500_web_create_kanban_tables.sql` | Kanban tasks with status enum |
| `building_blocks_submissions` | `migrations/20250211000000_web_create_building_blocks_submissions.sql` | Presentation outlines |

### C. Research Integration (REQUIRED)

| Research File | Key Findings | Spec Section(s) Affected |
|--------------|--------------|-------------------------|
| `context7-recharts-radial.md` | RadialBarChart with startAngle=90, endAngle=-270 for top-start; background prop for track; cornerRadius for rounded; center label via absolute positioning | Section 5 (Course Progress Widget), Section 7 (Tech Constraints) |
| `perplexity-dashboard-patterns.md` | F/Z scanning pattern for quick actions; time grouping for activity feeds; 44x44px touch targets; progressive disclosure | Section 5 (Quick Actions, Activity Feed), Section 6 (Responsive), Section 10 (Decomposition) |

### D. External References

- [Recharts RadialBarChart Documentation](https://recharts.org/en-US/api/RadialBarChart)
- [Cal.com Embed Documentation](https://cal.com/docs/embed)
- [Shadcn/ui Components](https://ui.shadcn.com/docs/components)
- Existing dashboard reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`

### E. Visual Assets

**ASCII Layout Mockup:**
```
+------------------------------------------------------------------+
|                        User Dashboard                              |
|  [HomeLayoutPageHeader: "Dashboard" / "Your presentation journey"] |
+------------------------------------------------------------------+
|                                                                    |
| +--------------------+ +--------------------+ +------------------+ |
| | Course Progress    | | Spider Diagram     | | Kanban Summary   | |
| |   [RadialChart]    | |   [RadarChart]     | | Doing: Task X    | |
| |       68%          | |   [5-axis web]     | | Next: Task Y     | |
| |   "Continue"       | |   View Assessment  | | View Board ->    | |
| +--------------------+ +--------------------+ +------------------+ |
|                                                                    |
| +--------------------+ +--------------------+ +------------------+ |
| | Recent Activity    | | Quick Actions      | | Coaching         | |
| | Today              | | [Continue Course]  | | Next Session:    | |
| |   * Quiz: 85%      | | [New Presentation] | | Jan 25, 2pm      | |
| |   * Lesson done    | | [Complete Assess]  | | [Join] [Resched] | |
| | Yesterday          | | [Review Storyboard]| | or               | |
| |   * Outline saved  | |                    | | [Book Session]   | |
| +--------------------+ +--------------------+ +------------------+ |
|                                                                    |
| +----------------------------------------------------------------+ |
| | Presentation Outlines                                          | |
| | +----------+----------+----------+----------+-----------------+ | |
| | | Title    | Audience | Type     | Updated  | Actions         | | |
| | +----------+----------+----------+----------+-----------------+ | |
| | | Q4 Sales | Execs    | Persuade | Jan 19   | [Edit Outline]  | | |
| | | Team Upd | Team     | Inform   | Jan 15   | [Edit Outline]  | | |
| | | Product  | Clients  | Explain  | Jan 10   | [Edit Outline]  | | |
| | +----------+----------+----------+----------+-----------------+ | |
| +----------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

**Mockup Requirements Met:**
- Component names match Key Capabilities (Section 5)
- 3-3-1 grid layout shown
- Sample content shows what each component displays
- Table shows column headers

### F. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-01-20 | Use Cal.com embed for booking | User preference; avoids building custom booking system | User |
| 2026-01-20 | No real-time updates for activity feed | Simplifies implementation; refresh on load is sufficient for v1 | User |
| 2026-01-20 | 30-day activity feed range | Balance between context and query performance | User |
| 2026-01-20 | Reuse existing RadarChart | Component already exists and matches requirements | Codebase exploration |
| 2026-01-20 | Parallel data fetching pattern | Existing pattern in codebase; 60-80% performance improvement | Architecture docs |
