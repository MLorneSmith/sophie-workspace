# Project Specification: User Dashboard Home

## Metadata
| Field | Value |
|-------|-------|
| **Document Owner** | Claude |
| **Created** | 2025-12-30 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
A comprehensive personal dashboard at `/home/(user)` providing users an at-a-glance view of their course progress, assessments, tasks, activities, and presentations.

### Press Release Headline
> "SlideHeroes announces User Dashboard enabling presenters to track their learning journey, manage tasks, and access presentations from a single unified view"

### Elevator Pitch (30 seconds)
The User Dashboard consolidates the user's entire SlideHeroes experience into one actionable home screen. Instead of navigating between multiple pages to check course progress, review assessment results, or find presentations, users see everything they need immediately upon login. The dashboard surfaces what's most relevant—current tasks, upcoming coaching sessions, and quick actions—so users spend less time navigating and more time improving their presentation skills.

---

## 2. Problem Statement

### Problem Description
Users currently land on an empty home page (`<PageBody />`) after logging in. To understand their learning progress, they must navigate to separate pages: `/course` for course progress, `/assessment` for survey results, `/kanban` for tasks, and `/coaching` for sessions. This fragmented experience makes it difficult to maintain momentum and understand overall progress at a glance.

### Who Experiences This Problem?
- **Active learners** who want to quickly resume their course or see their next steps
- **Returning users** who need to remember where they left off
- **Busy professionals** with limited time who need efficient access to their presentations and tasks

### Current Alternatives
Today, users must:
1. Navigate to `/home/course` to see course completion percentage
2. Navigate to `/home/assessment/survey` to review their assessment spider diagram
3. Navigate to `/home/kanban` to see their tasks
4. Navigate to `/home/coaching` to book or view sessions
5. Navigate to `/home/building-blocks` to find their presentations

Each context switch requires mental overhead and reduces engagement.

### Impact of Not Solving
- **Business impact**: Lower user engagement and course completion rates; users may churn before completing their learning journey
- **User impact**: Frustration from fragmented experience; difficulty maintaining learning momentum
- **Competitive impact**: Modern learning platforms provide unified dashboards; SlideHeroes appears less polished without one

---

## 3. Vision & Goals

### Product Vision
A unified dashboard that becomes the user's "home base" in SlideHeroes—a place where they can instantly understand their progress, see what to do next, and take action without navigation overhead. The dashboard should feel personalized and actionable, surfacing the most relevant information for each user's current state.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Reduce navigation to key features | Clicks to access course/tasks/presentations | 1 click (from dashboard) | Analytics tracking |
| G2: Increase course completion visibility | Users who view progress daily | 60% of active users | Dashboard page views |
| G3: Improve task management engagement | Tasks marked "done" from dashboard | 30% of task completions | Server action tracking |
| G4: Accelerate time-to-action | Time from login to first meaningful action | < 10 seconds | Session analytics |

### Strategic Alignment
This project directly supports SlideHeroes' mission to help presenters improve systematically. By consolidating progress tracking and next actions, the dashboard reinforces the learning loop and keeps users engaged with their presentation improvement journey.

---

## 4. Target Users

### Primary Persona
**Name**: Learning Linda
**Role**: Professional who is actively progressing through the SlideHeroes course
**Goals**: Complete the course, track her improvement, and apply skills to upcoming presentations
**Pain Points**: Forgets where she left off; loses momentum between sessions; struggles to find her draft presentations
**Quote**: "I wish I could see my progress and what I should do next without clicking around everywhere."

### Secondary Personas
1. **Task-Oriented Tom**: Uses SlideHeroes primarily for presentation creation; wants quick access to his presentations and storyboards without course distractions
2. **Assessment Alex**: Has completed the assessment survey and wants to see his strengths/weaknesses at a glance before coaching sessions

### Anti-Personas (Who This Is NOT For)
- **Team administrators** looking for team-wide analytics (team dashboard at `/home/[account]`)
- **First-time visitors** who haven't started any courses (onboarding flow handles this)
- **Content creators/admins** managing course content (Payload CMS handles this)

---

## 5. Solution Overview

### Proposed Solution
Build a comprehensive personal dashboard at `/home/(user)/page.tsx` with seven key components arranged in a responsive grid layout:
- **Row 1 (3 cards)**: Course Progress, Assessment Spider, Kanban Summary
- **Row 2 (3 cards)**: Recent Activity, Quick Actions, Coaching Sessions
- **Row 3 (full-width)**: Presentations Table

### Key Capabilities

1. **Course Progress Radial Card**: Single radial progress chart showing overall course completion percentage with current lesson indicator
2. **Assessment Spider Card**: Radar/spider chart displaying category scores from the most recent self-assessment survey
3. **Kanban Summary Card**: Compact view showing current "Doing" tasks and next "Do" task with quick status update actions
4. **Recent Activity Feed**: Chronological timeline of recent user actions (presentations, lessons, quizzes, assessments)
5. **Quick Actions Panel**: Contextual CTAs that adapt based on user state (continue course, new presentation, complete assessment)
6. **Coaching Sessions Card**: Cal.com API integration showing upcoming sessions or booking CTA
7. **Presentations Table**: Basic table of user presentations with direct edit links

### Customer Journey

1. **User logs in** → lands on dashboard showing their current state
2. **User scans dashboard** → immediately sees course progress %, assessment scores, and pending tasks
3. **User takes action** → clicks "Continue Course" or selects a presentation to edit
4. **User returns next session** → dashboard shows updated progress and new activity

### Hypothetical Customer Quote
> "Finally! I can see everything in one place. The moment I log in, I know exactly where I left off and what to do next. No more hunting through menus."
> — Learning Linda, Marketing Manager

---

## 6. Scope Definition

### In Scope

- [x] Course Progress radial chart (single course, overall completion %)
- [x] Assessment Spider/Radar chart (most recent survey results by category)
- [x] Kanban Summary showing "Doing" and next "Do" task
- [x] Recent Activity Feed (page-load refresh, not real-time)
- [x] Quick Actions Panel with state-aware CTAs
- [x] Coaching Sessions Card with Cal.com API integration
- [x] Presentations Table (basic: title, date, edit button)
- [x] Responsive layout (stacked single column on mobile)
- [x] Placeholder cards for empty states ("No data yet" messaging)
- [x] Server-side data loading with parallel fetching
- [x] RLS-protected data access

### Out of Scope

- [ ] Real-time activity updates (WebSocket/SSE subscriptions)
- [ ] Multi-course progress tracking (only single course supported currently)
- [ ] Team account dashboard (separate implementation)
- [ ] Presentation table filtering, sorting, or pagination
- [ ] Bulk actions on presentations
- [ ] Dashboard customization/widget reordering
- [ ] Notifications system integration
- [ ] Gamification elements (streaks, badges, leaderboards)

### Future Considerations (v2+)
- Real-time activity feed using Supabase subscriptions
- Dashboard widget customization (drag-and-drop layout)
- Multi-course progress comparison
- Learning streaks and gamification
- Push notifications for coaching reminders
- Advanced presentation filtering and search

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| Supabase | Database queries | course_progress, lesson_progress, quiz_attempts, survey_responses, tasks, building_blocks_submissions |
| Payload CMS | Content API | Course and lesson metadata for display |
| Cal.com | REST API | Fetch upcoming coaching sessions |
| @kit/ui | Components | Card, Chart, Table, Progress, Badge from shadcn |
| Recharts | Charting | Radar chart for assessment, radial chart for progress |

### Technical Constraints

- **Performance**: Dashboard must load in < 3 seconds with parallel data fetching
- **Security**: All data fetched via RLS-protected queries; no admin client usage
- **Scalability**: Efficient queries that scale with user activity history
- **Accessibility**: WCAG 2.1 AA compliance for all components

### Technology Preferences/Mandates

- **Server Components**: Use RSC for initial data loading
- **Parallel Fetching**: `Promise.all()` for all dashboard data loaders
- **UI Components**: shadcn/ui Card, Table, Progress, Badge, Chart
- **Charts**: Recharts RadarChart, RadialBarChart
- **Cal.com SDK**: Official Cal.com API client or REST API

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Cal.com API | External | Medium | API availability, rate limits, authentication |
| Payload CMS | Internal | Low | Course content dependency |
| Supabase | Internal | Low | Core database infrastructure |
| Recharts | NPM | Low | Already used in assessment feature |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Single course assumption**: Users are enrolled in only one course at a time — *Validation: Check course_progress table for multi-enrollment patterns*
2. **Assessment completed**: Users have completed at least one assessment survey for spider chart — *Validation: Query survey_responses for user*
3. **Cal.com API access**: We have API credentials to fetch user bookings — *Validation: Confirm Cal.com API key exists*
4. **Presentations exist**: Users have created at least one presentation — *Validation: Query building_blocks_submissions*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Cal.com API rate limits or downtime | Medium | Medium | Graceful degradation to booking button only | Backend |
| R2 | Slow dashboard load with large activity history | Low | High | Limit activity feed to recent 10 items; add pagination later | Backend |
| R3 | Empty state overwhelms new users | Medium | Medium | Design friendly placeholder cards with clear CTAs | Frontend |
| R4 | Mobile layout too cramped | Medium | Medium | Early mobile testing; prioritize critical widgets | Design |

### Open Questions

1. [ ] What is the Cal.com API endpoint for fetching user bookings?
2. [ ] Should we cache Cal.com session data or fetch fresh on each load?
3. [ ] What activity types should appear in the Recent Activity Feed? (Current assumption: presentations, lessons, quizzes, assessments)
4. [ ] Should clicking on activity items navigate to the related page?

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] All 7 dashboard components render correctly on desktop and mobile
- [ ] Data loads in parallel with < 3 second total load time
- [ ] Empty states display placeholder cards with helpful CTAs
- [ ] All components use RLS-protected queries (no admin client)
- [ ] TypeScript strict mode compliance (no type errors)
- [ ] Linting and formatting pass (`pnpm lint && pnpm format`)
- [ ] Component tests written for each dashboard widget
- [ ] E2E test for dashboard page load and basic interactions

### Launch Criteria

- [ ] Dashboard page loads without errors for users with varying data states
- [ ] Cal.com integration works in production environment
- [ ] Mobile responsiveness verified on iOS Safari and Android Chrome
- [ ] No console errors or warnings in production build
- [ ] Performance budget: LCP < 2.5s, TBT < 200ms

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| Dashboard page views | 0 (new feature) | 80% of logged-in users | 2 weeks post-launch |
| Course page direct navigation | 100% of course views | 30% reduction | 4 weeks post-launch |
| Average time on dashboard | N/A | > 30 seconds | 2 weeks post-launch |
| User feedback rating | N/A | > 4/5 stars | 4 weeks post-launch |

---

## 10. Decomposition Hints

> **Note**: This section provides guidance for the next phase (initiative/feature decomposition).

### Candidate Initiatives

1. **Dashboard Data Layer**: Create server-side data loaders for all 7 components with parallel fetching and caching
2. **Dashboard UI Components**: Build the 7 dashboard card components using shadcn/ui and Recharts
3. **Cal.com Integration**: Implement Cal.com API client for coaching session data
4. **Activity Feed System**: Design activity feed data model and aggregation logic
5. **Dashboard Page Assembly**: Wire up components with layout grid and responsive design

### Suggested Priority Order

1. **Data Layer First**: Create loaders before UI (enables component development in parallel)
2. **Core Widgets**: Course Progress + Assessment Spider (most valuable for users)
3. **Kanban + Quick Actions**: Enable immediate actions from dashboard
4. **Activity Feed**: Provides context but lower priority
5. **Coaching Sessions**: Depends on Cal.com API integration
6. **Presentations Table**: Straightforward, can be done in parallel

### Complexity Indicators

| Area | Complexity | Rationale |
|------|------------|-----------|
| Cal.com Integration | High | External API, authentication, error handling |
| Assessment Spider Chart | Medium | Recharts RadarChart with dynamic data |
| Course Progress Radial | Medium | Custom radial chart implementation |
| Activity Feed | Medium | Data aggregation from multiple tables |
| Kanban Summary | Low | Simple query and display |
| Quick Actions | Low | Conditional UI based on user state |
| Presentations Table | Low | Basic table component |

---

## 11. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **Course Progress** | Percentage of required lessons completed in the main SlideHeroes course |
| **Assessment Spider** | Radar chart showing user's self-assessment scores across skill categories |
| **Kanban** | Task board with Do/Doing/Done columns for presentation preparation tasks |
| **Building Blocks** | Presentation scaffolding system (Situation-Complication-Answer framework) |
| **Cal.com** | External scheduling platform used for coaching session booking |

### B. Research & References

- **Codebase Exploration**: Existing patterns in `/home/(user)/course`, `/home/(user)/assessment`, `/home/(user)/kanban`
- **UI Components**: shadcn/ui component library at `packages/ui/src/shadcn`
- **Database Schema**: Supabase migrations in `apps/web/supabase/migrations/`
- **Cal.com API**: https://cal.com/docs/api-reference

### C. Visual Assets

**Dashboard Layout (Desktop)**:
```
┌─────────────────┬─────────────────┬─────────────────┐
│  Course Progress│  Assessment     │  Kanban Summary │
│  (Radial Chart) │  (Spider Chart) │  (Tasks)        │
├─────────────────┼─────────────────┼─────────────────┤
│  Recent Activity│  Quick Actions  │  Coaching       │
│  (Timeline)     │  (CTAs)         │  (Sessions)     │
├─────────────────┴─────────────────┴─────────────────┤
│  Presentations Table (Full Width)                    │
│  [Title] [Date] [Edit Button]                       │
└──────────────────────────────────────────────────────┘
```

**Dashboard Layout (Mobile)**:
```
┌─────────────────┐
│ Course Progress │
├─────────────────┤
│ Assessment      │
├─────────────────┤
│ Kanban Summary  │
├─────────────────┤
│ Recent Activity │
├─────────────────┤
│ Quick Actions   │
├─────────────────┤
│ Coaching        │
├─────────────────┤
│ Presentations   │
└─────────────────┘
```

### D. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2025-12-30 | Personal users only (no team dashboard) | Simpler scope; team dashboard has different needs | User Interview |
| 2025-12-30 | Page-load refresh (no real-time) | Reduces complexity; activity doesn't change frequently | User Interview |
| 2025-12-30 | Cal.com API integration (not local sync) | Avoid data duplication; Cal.com is source of truth | User Interview |
| 2025-12-30 | Basic presentations table | Keep initial scope minimal; add features in v2 | User Interview |
| 2025-12-30 | Overall completion % (single radial) | Users currently enrolled in one course only | User Interview |
| 2025-12-30 | Placeholder cards for empty states | Friendly experience; clear CTAs to get started | User Interview |
| 2025-12-30 | Stacked single column on mobile | Standard responsive pattern; prioritize readability | User Interview |

### E. Existing Code References

**Relevant Files**:
- Current home page: `apps/web/app/home/(user)/page.tsx`
- Course dashboard: `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx`
- Assessment radar chart: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Kanban board: `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx`
- Coaching calendar: `apps/web/app/home/(user)/coaching/_components/calendar.tsx`
- User workspace loader: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`

**Database Tables**:
- `course_progress` - User course completion tracking
- `lesson_progress` - Individual lesson completion
- `quiz_attempts` - Quiz scores and attempts
- `survey_responses` - Assessment survey results with category scores
- `tasks` / `subtasks` - Kanban task management
- `building_blocks_submissions` - Presentation outlines and storyboards

**UI Components Available**:
- `@kit/ui/card` - Card, CardHeader, CardTitle, CardContent, CardFooter
- `@kit/ui/chart` - ChartContainer, ChartTooltip (Recharts wrapper)
- `@kit/ui/table` - Table, TableHeader, TableBody, TableRow, TableCell
- `@kit/ui/progress` - Progress bar component
- `@kit/ui/badge` - Status badges
- `@kit/ui/button` - Button variants
