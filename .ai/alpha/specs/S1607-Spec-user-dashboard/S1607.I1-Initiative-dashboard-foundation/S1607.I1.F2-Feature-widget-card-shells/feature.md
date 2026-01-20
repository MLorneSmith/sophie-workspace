# Feature: Widget Card Shells

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1607.I1 |
| **Feature ID** | S1607.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Create 7 placeholder widget card components that serve as shells for future widget implementations. Each card uses the standard Card component structure with typed data interfaces. Cards display placeholder content and handle empty states gracefully.

## User Story
**As a** developer implementing dashboard widgets
**I want to** have typed card shell components in place
**So that** I can implement widget content without building structure

## Acceptance Criteria

### Must Have
- [ ] All 7 widget cards created with Card/CardHeader/CardContent structure
- [ ] TypeScript interfaces defined for all widget data types
- [ ] Each card accepts typed props and handles null data (empty state)
- [ ] data-testid attributes added for E2E testing
- [ ] Cards render placeholder content with i18n labels
- [ ] Cards integrate into dashboard-grid.tsx component slots

### Nice to Have
- [ ] Icon indicators for each widget type
- [ ] Hover effects matching Card component patterns

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | 7 widget card components | New |
| **Logic** | TypeScript interfaces | New |
| **Data** | Placeholder data structures | New |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use standard Card component from @kit/ui/card. Define clean TypeScript interfaces that will be populated by real data in future initiatives. Cards are Server Components for optimal performance.

### Key Architectural Choices
1. Single types file exports all 7 widget interfaces plus composite DashboardData
2. Each widget is a self-contained Server Component
3. Widgets handle null data gracefully with empty state UI
4. Consistent Card structure across all widgets

### Trade-offs Accepted
- Placeholder content is static text (not real data) - simplifies initial implementation

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card wrapper | `Card` | @kit/ui/card | Consistent semantic structure |
| Card sections | `CardHeader`, `CardTitle`, `CardContent` | @kit/ui/card | Standard card anatomy |
| Empty states | Custom with Trans | Local | i18n-friendly empty messages |
| Icons | Lucide React icons | lucide-react | Consistent iconography |

**Components to Install**: None - all components already available

## Dependencies

### Blocks
- None

### Blocked By
- F1: Dashboard Page & Grid Layout (provides rendering slots in grid)

### Parallel With
- F3: Unified Data Loader (can develop simultaneously after F1)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` - All widget TypeScript interfaces
- `apps/web/app/home/(user)/_components/widgets/recent-activity-card.tsx` - Last user actions
- `apps/web/app/home/(user)/_components/widgets/quick-stats-card.tsx` - Key metrics summary
- `apps/web/app/home/(user)/_components/widgets/progress-overview-card.tsx` - Visual progress
- `apps/web/app/home/(user)/_components/widgets/upcoming-events-card.tsx` - Scheduled items
- `apps/web/app/home/(user)/_components/widgets/team-status-card.tsx` - Team availability
- `apps/web/app/home/(user)/_components/widgets/resource-usage-card.tsx` - Storage/quota
- `apps/web/app/home/(user)/_components/widgets/activity-feed-card.tsx` - Activity timeline

### Modified Files
- `apps/web/app/home/(user)/_components/dashboard-grid.tsx` - Import and render widget cards

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create dashboard.types.ts**: Define all 7 widget interfaces + DashboardData composite
2. **Create widgets directory**: Scaffold _components/widgets/ structure
3. **Implement metric cards (3)**: recent-activity, quick-stats, progress-overview
4. **Implement info cards (3)**: upcoming-events, team-status, resource-usage
5. **Implement activity-feed card**: Full-width timeline widget
6. **Integrate into grid**: Update dashboard-grid.tsx to render all widgets
7. **Add i18n keys**: Widget titles and empty state messages

### Suggested Order
1. dashboard.types.ts (types first)
2. Create widgets directory structure
3. Implement cards in grid order (row 1, row 2, row 3)
4. Integrate into dashboard-grid.tsx
5. Add i18n keys

## Widget Specifications

### Row 1 (3 metric cards)
| Widget | Data Interface | Purpose |
|--------|---------------|---------|
| Recent Activity | `RecentActivityData[]` | Last 5 user actions |
| Quick Stats | `QuickStatsData` | Projects, slides, collaborators counts |
| Progress Overview | `ProgressOverviewData` | Task completion percentage |

### Row 2 (3 info cards)
| Widget | Data Interface | Purpose |
|--------|---------------|---------|
| Upcoming Events | `UpcomingEventData[]` | Next 3 scheduled items |
| Team Status | `TeamStatusData` | Online/away/offline counts |
| Resource Usage | `ResourceUsageData` | Storage percentage used |

### Row 3 (1 full-width card)
| Widget | Data Interface | Purpose |
|--------|---------------|---------|
| Activity Feed | `ActivityFeedData[]` | Scrollable activity timeline |

## Validation Commands
```bash
# Verify all 7 widget files exist
ls apps/web/app/home/\(user\)/_components/widgets/*.tsx | wc -l

# Verify types file exists
ls apps/web/app/home/\(user\)/_lib/types/dashboard.types.ts

# Verify TypeScript compiles
pnpm --filter web typecheck

# Verify data-testid attributes
grep -r "data-testid" apps/web/app/home/\(user\)/_components/widgets/
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Types: `apps/web/app/home/(user)/_lib/types/dashboard.types.ts`
