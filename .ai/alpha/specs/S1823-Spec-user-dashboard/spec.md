# Project Specification: User Dashboard

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S1823 |
| **GitHub Issue** | #1823 |
| **Document Owner** | Claude Code |
| **Created** | 2026-01-26 |
| **Status** | Draft |
| **Version** | 0.2 |

---

## 1. Executive Summary

### One-Line Description
A comprehensive user dashboard at `/home` providing at-a-glance visibility into course progress, assessment results, tasks, activities, coaching sessions, and presentations.

### Press Release Headline
> "SlideHeroes announces User Dashboard enabling learners to track their entire presentation journey from a single, intuitive home screen"

### Elevator Pitch (30 seconds)
The User Dashboard transforms the `/home/(user)` route from an empty page into a rich, actionable hub. Users see their course progress via radial charts, self-assessment strengths via spider diagrams, current tasks from the kanban board, recent activities, contextual quick actions, upcoming coaching sessions, and a table of all their presentation outlines. This single screen eliminates navigation friction and surfaces the most important information at a glance.

---

## 2. Problem Statement

### Problem Description
Currently, the `/home/(user)` page renders an empty `<PageBody />` component. Users landing on their home route have no visibility into their learning progress, pending tasks, upcoming sessions, or presentation drafts. They must navigate to multiple different sections to understand their current state.

### Who Experiences This Problem?
- **Primary users**: Learners actively progressing through the "Decks for Decision Makers" course
- **Secondary users**: Users who have completed the course and are building presentations
- **All users**: Anyone returning to the platform needs a "home base" to orient themselves

### Current Alternatives
Users must manually navigate to:
- `/home/(user)/course` for course progress
- `/home/(user)/assessment` for survey results
- `/home/(user)/kanban` for task board
- `/home/(user)/ai/canvas` for presentations

This fragmented experience increases cognitive load and reduces engagement.

### Impact of Not Solving
- **Business impact**: Lower engagement, higher churn, reduced time-on-platform
- **User impact**: Frustration, difficulty tracking progress, missed coaching sessions
- **Competitive impact**: Competing platforms offer consolidated dashboards as standard

---

## 3. Vision & Goals

### Product Vision
A beautiful, responsive dashboard that serves as the user's command center - providing instant clarity on where they are in their learning journey and what they should do next.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Increase home page engagement | Time spent on /home | +40% vs current (0s baseline) | Analytics tracking |
| G2: Reduce navigation to key features | Clicks to reach course/kanban/presentations | -60% (direct access from dashboard) | User flow analysis |
| G3: Improve coaching session attendance | Session no-show rate | -25% via dashboard visibility | Cal.com analytics |
| G4: Accelerate course completion | Average completion time | -15% via progress visibility | Course progress timestamps |

### Strategic Alignment
This dashboard is foundational for user engagement and retention. It directly supports:
- Course completion rates (visibility drives progress)
- Premium feature adoption (coaching sessions)
- Platform stickiness (daily return visits)

---

## 4. Target Users

### Primary Persona
**Name**: Alex the Active Learner
**Role**: Professional preparing important presentations, mid-course
**Goals**: Complete the course efficiently, apply learnings to real presentations
**Pain Points**: Loses track of progress, forgets coaching sessions, wants to know "what's next"
**Quote**: "I want to open the app and immediately know what I should focus on today."

### Secondary Personas
1. **Sam the Starter**: Just enrolled, needs guidance on first steps
2. **Jordan the Graduate**: Completed course, focused on creating presentations

### Anti-Personas (Who This Is NOT For)
- Team administrators (they use the team dashboard at `/home/[account]`)
- Instructors or coaches (separate admin interface)
- Users who haven't logged in (auth required)

---

## 5. Solution Overview

### Proposed Solution
Build a comprehensive dashboard at `/home/(user)/page.tsx` with 7 widget components arranged in a 3-3-1 responsive grid layout:

**Row 1 (3 widgets):**
1. Course Progress Radial Graph
2. Self-Assessment Spider Diagram
3. Kanban Summary Card

**Row 2 (3 widgets):**
4. Recent Activity Feed
5. Quick Actions Panel
6. Coaching Sessions Widget

**Row 3 (full width):**
7. Presentation Outline Table

### Key Capabilities

1. **Course Progress Radial Widget**: Circular progress indicator showing course completion percentage with lesson counts
2. **Assessment Spider Chart Widget**: Radar chart visualizing category scores from self-assessment survey
3. **Kanban Summary Card**: Shows current "Doing" tasks and next "Do" task with quick links
4. **Recent Activity Feed**: Timeline of presentations, lessons, quizzes, and assessments
5. **Quick Actions Panel**: Contextual CTAs based on user state (Continue Course, New Presentation, etc.)
6. **Coaching Sessions Widget**: Upcoming bookings with join/reschedule links, or booking CTA
7. **Presentation Outline Table**: List of all user presentations with direct edit links

### Customer Journey

1. User logs in and lands on `/home` route
2. Dashboard loads with parallel data fetching (server component)
3. User sees their current state at a glance (progress, tasks, sessions)
4. User clicks a quick action or widget to dive deeper
5. User returns to dashboard after completing work to see updated state

### Hypothetical Customer Quote
> "Finally! I can see everything I need in one place. The progress ring motivates me, the spider chart shows my strengths, and I never miss a coaching session anymore."
> — Alex, Active Learner

### Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (<768px) | Single column, stacked widgets | All widgets full-width, vertical scroll |
| Tablet (768-1024px) | 2-column grid | Row 1 & 2 become 2x2, table full-width |
| Desktop (>1024px) | 3-3-1 grid as designed | Primary design target |

---

## 6. Scope Definition

### In Scope

- [x] Dashboard page shell with responsive grid layout
- [x] Course Progress Radial Widget (reads from `course_progress` table)
- [x] Assessment Spider Chart Widget (reads from `survey_responses` table)
- [x] Kanban Summary Card (reads from `tasks` table)
- [x] Recent Activity Feed (aggregates multiple tables)
- [x] Quick Actions Panel (contextual CTAs)
- [x] Coaching Sessions Widget (Cal.com integration)
- [x] Presentation Outline Table (reads from `building_blocks_submissions` table)
- [x] Loading skeleton states for all widgets
- [x] Empty states for widgets with no data
- [x] Server component data loading with parallel fetching

### Out of Scope

- [ ] Drag-and-drop widget rearrangement
- [ ] User-customizable widget visibility toggles
- [ ] Real-time data updates (polling/subscriptions)
- [ ] Push notifications
- [ ] Team/organization dashboard (separate route)
- [ ] Mobile native app
- [ ] Analytics tracking implementation (separate initiative)

### Future Considerations (v2+)

- Personalized widget ordering based on user behavior
- Dark mode optimizations
- Embedded mini-course player widget
- Gamification elements (streaks, badges)
- AI-powered "Next Best Action" suggestions

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| `public.course_progress` | DB Query | Reads `completion_percentage`, `current_lesson_id` |
| `public.lesson_progress` | DB Query | Counts completed lessons for radial display |
| `public.survey_responses` | DB Query | Reads `category_scores` JSONB for spider chart |
| `public.tasks` | DB Query | Filters by `status` enum ('do', 'doing', 'done') |
| `public.quiz_attempts` | DB Query | Activity feed - quiz completions |
| `public.building_blocks_submissions` | DB Query | Presentation table data |
| Cal.com V2 API | External API | `@calcom/embed-react` for booking modal + V2 API for fetching bookings |
| Payload CMS | API | Course/lesson metadata (titles) |

### Technical Constraints

- **Performance**: All widgets must load within 1.5s LCP target; use parallel fetching
- **Security**: All data access via RLS-enforced queries; no admin client
- **Compliance**: WCAG 2.1 AA accessibility compliance required
- **Scalability**: Queries must remain performant with 10k+ users

### Technology Preferences/Mandates

- **Charts**: Recharts (already in use for radar chart at `/assessment`)
- **UI Components**: Shadcn/ui Card, Table, Progress, Badge
- **Data Fetching**: Server Components with `Promise.all()` parallel fetching
- **External Integration**: `@calcom/embed-react` for booking modal + Cal.com V2 API with API key for fetching bookings
- **Styling**: Tailwind CSS with existing design system tokens

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Cal.com API availability | Cal.com | Medium | Fallback: show "Check coaching" link without embed |
| Payload CMS for lesson titles | Internal | Low | Data is cached, rarely changes |
| Supabase RLS policies | Internal | Low | Already implemented for all tables |
| `@calcom/embed-react` package | Cal.com | Low | Simple embed package, no OAuth or CalProvider needed |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Users have course progress data**: Most users accessing dashboard are enrolled — *Validation: Check enrollment funnel*
2. **Cal.com integration is feasible**: V2 API with API key authentication works for fetching bookings — *Validation: API key obtained, tested*
3. **Existing components are reusable**: RadialProgress and radar-chart can be adapted — *Validation: Code review completed*
4. **Data volume is manageable**: Activity feed pagination handles history — *Validation: Test with synthetic data*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Cal.com API rate limits during peak usage | Medium | Medium | Implement caching, graceful degradation | Development |
| R2 | Activity feed query performance with large datasets | Medium | High | Add database indexes, limit to recent N items | Development |
| R3 | Radial chart doesn't render correctly on Safari | Low | Medium | Test cross-browser, use tested Recharts patterns | QA |
| R4 | Users confused by empty dashboard (new users) | Medium | Medium | Design compelling empty states with CTAs | Design |

### Open Questions

1. [x] ~~What Cal.com event types should be displayed?~~ — Resolved: All upcoming bookings for user
2. [ ] Should activity feed show team activity or personal only? — Assumption: Personal only for v1
3. [ ] How many recent activities to show by default? — Recommendation: 8 items with "View All" link

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] Dashboard page loads at `/home/(user)` route
- [ ] All 7 widgets render with real data
- [ ] Responsive layout works on mobile, tablet, desktop
- [ ] Loading skeletons display during data fetch
- [ ] Empty states display when no data available
- [ ] Cal.com integration shows upcoming sessions or booking CTA
- [ ] All widgets pass accessibility audit (axe-core)
- [ ] E2E tests cover happy path and empty states
- [ ] Performance: LCP < 1.5s, CLS < 0.1

### Launch Criteria

- [ ] Feature flag enabled for beta users
- [ ] No P0/P1 bugs in staging
- [ ] Performance metrics within targets
- [ ] Accessibility audit passed
- [ ] Documentation updated

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| Daily Active Users on /home | 0 (page empty) | +500 DAU | 2 weeks |
| Avg. time on dashboard | 0s | > 30s | 2 weeks |
| Click-through to course | N/A | > 40% | 4 weeks |
| Coaching session bookings | Current baseline | +20% | 4 weeks |

---

## 10. Decomposition Hints

### Standard Initiative Categories to Consider

1. **Foundation/Layout** (P0) - Dashboard page shell, grid system, responsive breakpoints
2. **Data Layer** (P0) - Unified dashboard loader with parallel fetching, type definitions
3. **Core Widgets** (P1) - Progress radial, spider chart, kanban summary, activity feed, quick actions, presentation table
4. **External Integration** (P2) - Cal.com coaching sessions widget (higher risk, can be parallel)
5. **Polish & Accessibility** (P2) - Empty states, loading states, a11y compliance, E2E tests

### Candidate Initiatives

1. **Dashboard Foundation**: Page shell, responsive grid, loader infrastructure → Maps to Foundation/Layout + Data Layer
2. **Progress & Assessment Widgets**: Course radial + Spider chart → Core visualization widgets
3. **Activity & Task Widgets**: Kanban summary + Activity feed + Quick actions → Activity-focused widgets
4. **Coaching Integration**: Cal.com widget with booking flow → External integration
5. **Presentation Table & Polish**: Table widget + empty states + a11y → Completion & polish

### Suggested Priority Order

1. P0: Foundation (layout, grid, types, loader) — Must be first
2. P1: Progress/Assessment widgets — High visibility, existing patterns
3. P1: Activity/Task widgets — Core functionality
4. P2: Coaching Integration — External dependency, can parallel with P1
5. P2: Presentation Table & Polish — Depends on foundation

### Complexity Indicators

| Area | Complexity | Rationale (based on codebase findings) |
|------|------------|----------------------------------------|
| Radial Progress | Low | Existing `RadialProgress.tsx` component at `/course/_components/` |
| Spider Chart | Low | Existing `radar-chart.tsx` at `/assessment/survey/_components/` |
| Kanban Summary | Low | Simple query on `tasks` table with status filter |
| Activity Feed | Medium | Requires aggregating 4+ tables, sorting by timestamp |
| Quick Actions | Low | Conditional rendering based on existing data |
| Cal.com Integration | Medium | Embed package for booking modal + simple API fetch for bookings list (no OAuth needed) |
| Presentation Table | Low | Simple query, existing table patterns |
| Responsive Grid | Low | Standard Tailwind CSS Grid patterns |

---

## 11. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **Radial Progress** | Circular progress indicator showing completion percentage |
| **Spider/Radar Chart** | Multi-axis chart showing values across categories |
| **Kanban** | Task management system with columns (Do, Doing, Done) |
| **LCP** | Largest Contentful Paint - Core Web Vital metric |
| **RLS** | Row Level Security - Supabase data access control |
| **Cal.com Embed** | `@calcom/embed-react` package for embedding booking UI |

### B. Codebase Exploration Results (REQUIRED)

| Component/Pattern Found | File Path | Reusable? | Notes |
|------------------------|-----------|-----------|-------|
| RadialProgress | `apps/web/app/home/(user)/course/_components/RadialProgress.tsx` | Yes | SVG circular progress, takes `value`, `size`, `strokeWidth` |
| Radar Chart | `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | Yes | Recharts RadarChart with category_scores |
| Card Widget Pattern | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` | Pattern only | Card/CardHeader/CardContent structure |
| Course Progress Loader | `apps/web/app/home/(user)/course/page.tsx` | Pattern only | Inline fetching pattern, needs extraction |
| User Workspace Loader | `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts` | Pattern only | Uses `cache()` wrapper, `Promise.all()` |
| Trend Component | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` (L473-499) | Yes | Shows up/down trends with color |
| Figure Component | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` (L465-471) | Yes | Large number display |

**Tables/Schemas Identified:**

| Table Name | Location | Purpose |
|------------|----------|---------|
| `course_progress` | `migrations/20250319104726_web_course_system.sql` | Course completion percentage, current lesson |
| `lesson_progress` | `migrations/20250319104726_web_course_system.sql` | Individual lesson completion |
| `quiz_attempts` | `migrations/20250319104726_web_course_system.sql` | Quiz scores for activity feed |
| `survey_responses` | `migrations/20250319104724_web_survey_system.sql` | `category_scores` JSONB for spider chart |
| `tasks` | `migrations/20250221144500_web_create_kanban_tables.sql` | Kanban tasks with status enum |
| `building_blocks_submissions` | `migrations/20250211000000_web_create_building_blocks_submissions.sql` | User presentations with outline/storyboard |

### C. Research Integration (REQUIRED)

| Research File | Key Findings | Spec Section(s) Affected |
|--------------|--------------|-------------------------|
| `context7-calcom.md` | Use `@calcom/embed-react` for booking modal; V2 API with API key for fetching bookings; no OAuth/CalProvider needed (platform deprecated Dec 2025) | Section 7 (Technical Context), Section 10 (Complexity) |
| `perplexity-dashboard-ux.md` | Linear progress bars preferred for LMS; CSS Grid for layout; F-pattern hierarchy; 5-7 widgets max; touch targets 48px+ | Section 5 (Responsive Behavior), Section 6 (Out of Scope - no drag/drop v1) |
| `context7-recharts-radar.md` | `ResponsiveContainer` required; multiple `<Radar>` for series; `PolarRadiusAxis` with `domain` and `tickFormatter` | Section 7 (Technology Preferences) |

### D. External References

- [Cal.com Embed Documentation](https://cal.com/help/embedding/adding-embed)
- [Cal.com V2 API Introduction](https://cal.com/docs/api-reference/v2/introduction)
- [Recharts RadarChart API](https://recharts.org/en-US/api/RadarChart)
- [Shadcn/ui Card Component](https://ui.shadcn.com/docs/components/card)
- [Tailwind CSS Grid](https://tailwindcss.com/docs/grid-template-columns)

### E. Visual Assets

**ASCII Layout Mockup:**

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              User Dashboard                                       │
├──────────────────────────┬──────────────────────────┬────────────────────────────┤
│ Course Progress Radial   │ Assessment Spider Chart  │ Kanban Summary             │
│ ┌────────┐               │         ◢ Structure      │ ┌─────────────────────────┐│
│ │  72%   │               │     ◢       ◣            │ │ DOING:                  ││
│ │ ░░░░░  │               │   ◢    ●      ◣          │ │ • Build argument map    ││
│ └────────┘               │ Story ●   ● Style        │ │                         ││
│ 17 of 23 lessons         │   ◣    ●      ◢          │ │ NEXT:                   ││
│                          │     ◣       ◢            │ │ • Develop outline       ││
│ [Continue Course]        │       ◣ Delivery         │ │                         ││
│                          │                          │ │ [View Board →]          ││
├──────────────────────────┼──────────────────────────┼────────────────────────────┤
│ Recent Activity          │ Quick Actions            │ Coaching Sessions          │
│ ┌─────────────────────┐  │                          │ ┌─────────────────────────┐│
│ │ 📝 Updated outline  │  │ [Continue Course]        │ │ Jan 28 @ 2:00 PM        ││
│ │ 2 hours ago         │  │                          │ │ 30-min Coaching Call    ││
│ │                     │  │ [New Presentation]       │ │                         ││
│ │ ✓ Completed Lesson 8│  │                          │ │ [Join] [Reschedule]     ││
│ │ Yesterday           │  │ [Complete Assessment]    │ │                         ││
│ │                     │  │                          │ └─────────────────────────┘│
│ │ 🎯 Quiz: 85%        │  │ [Review Storyboard]      │                            │
│ │ 2 days ago          │  │                          │ [Book a Session]           │
│ └─────────────────────┘  │                          │                            │
├──────────────────────────┴──────────────────────────┴────────────────────────────┤
│ Presentation Outlines                                                             │
│ ┌────────────────────────────────────────────────────────────────────────────────┐│
│ │ Title                    │ Audience        │ Last Updated  │ Actions           ││
│ ├──────────────────────────┼─────────────────┼───────────────┼───────────────────┤│
│ │ Q4 Board Presentation    │ Board Directors │ 2 hours ago   │ [Edit Outline]    ││
│ │ Product Launch Deck      │ Sales Team      │ Yesterday     │ [Edit Outline]    ││
│ │ Investor Pitch           │ VCs             │ 3 days ago    │ [Edit Outline]    ││
│ └────────────────────────────────────────────────────────────────────────────────┘│
│                                                                   [+ New Pres.]   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Mockup Requirements Checklist:**
- [x] Component names match Key Capabilities (Section 5)
- [x] Layout matches 3-3-1 grid description
- [x] Sample content shows what each component displays
- [x] Table shows column headers
- [x] CTAs visible for quick actions

### F. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-01-26 | Use linear progress for lesson count, radial for percentage | Research shows linear is more scannable; radial adds visual interest for single KPI | Spec Author |
| 2026-01-26 | Cal.com via embed + V2 API | Platform deprecated Dec 2025; use `@calcom/embed-react` for booking modal + V2 API with API key for fetching bookings | Research (Updated) |
| 2026-01-26 | 8 activity items as default | Balance between information density and scroll; "View All" for more | UX Best Practice |
| 2026-01-26 | Server Components for all widgets | Reduces client JS, better performance, RLS automatically enforced | Architecture Pattern |
| 2026-01-26 | No drag-and-drop in v1 | Out of scope to reduce complexity; can add in v2 | Scope Management |
