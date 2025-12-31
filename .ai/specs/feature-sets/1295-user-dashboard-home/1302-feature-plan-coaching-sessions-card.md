# Feature Plan: Coaching Sessions Card

**Issue**: #1302
**Parent**: #1295
**Research Manifest**: #1294
**Phase**: 2
**Effort**: S (Small)
**Dependencies**: #1296 (Dashboard Data Loader)

---

## Overview

Component showing next scheduled coaching session or CTA to book a session. If sessions are booked, show next 1-2 sessions with date/time, join link, and reschedule option. Otherwise, show button to navigate to booking page.

## Solution Approach

**Component Pattern**: Server Component with Conditional Display

- Display upcoming coaching sessions if scheduled
- Show session details: date, time, join link
- Include reschedule button for each session
- Show CTA to book session if none scheduled
- Fixed height card format
- Handle missing/no sessions gracefully

**Key Design Decisions**:
- Server component for session data fetching
- Show top 1-2 upcoming sessions only
- Prioritize next session at top
- Include quick "Join" link for active sessions
- Fallback CTA for booking new session

## Research Applied

### From Manifest
- Cal.com integration for session booking
- Handle case where no sessions scheduled
- Display next 1-2 sessions with details
- Include join link and reschedule option

### From Skills
- Server components for session data
- Shadcn components for consistent styling
- Date/time formatting with date-fns

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/coaching-sessions-card.tsx` | Coaching sessions display card |

### Modified Files
| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/page.tsx` | Import and render CoachingSessionsCard in dashboard |

## Implementation Tasks

### Task 1: Create Coaching Sessions Card Component
- [ ] Import Card, Button components from shadcn
- [ ] Accept `CoachingSession[]` data as props
- [ ] Display upcoming sessions in chronological order
- [ ] Show session date, time, and join link if available
- [ ] Include reschedule button for each session
- [ ] Show CTA to book session if none scheduled
- [ ] Style with calendar/time indicators

**File**: `apps/web/app/home/(user)/_components/coaching-sessions-card.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Calendar, Clock, Link as LinkIcon, Settings2 } from 'lucide-react';
import { formatDate, formatTime } from '@kit/shared/dates';
import type { CoachingSession } from '../_lib/types/dashboard.types';

interface CoachingSessionsCardProps {
  sessions: CoachingSession[];
}

export function CoachingSessionsCard({ sessions }: CoachingSessionsCardProps) {
  const upcomingSessions = sessions
    .filter((s) => s.status === 'scheduled')
    .slice(0, 2);

  if (upcomingSessions.length === 0) {
    return (
      <Card className="h-[320px] flex flex-col">
        <CardHeader>
          <CardTitle>Coaching Sessions</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-sm text-muted-foreground text-center">
            No coaching sessions scheduled
          </p>
          <Button>Book a Session</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[320px] flex flex-col">
      <CardHeader>
        <CardTitle>Upcoming Sessions</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {upcomingSessions.map((session) => (
          <div
            key={session.id}
            className="p-3 border rounded-lg border-border hover:bg-muted/50 transition"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{formatDate(new Date(session.date))}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
              >
                <Settings2 className="w-3 h-3" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{session.time}</span>
            </div>

            {session.joinLink && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                asChild
              >
                <a href={session.joinLink} target="_blank" rel="noopener">
                  <LinkIcon className="w-4 h-4" />
                  Join Session
                </a>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

### Task 2: Handle Session Data
- [ ] Query coaching sessions from database
- [ ] Filter for scheduled/upcoming sessions
- [ ] Sort by date ascending
- [ ] Limit to 2 sessions
- [ ] Include join link and reschedule data

### Task 3: Date/Time Formatting
- [ ] Format dates in readable format (e.g., "Dec 20, 2:30 PM")
- [ ] Handle timezone considerations
- [ ] Use date-fns for consistent formatting

### Task 4: Join Link and Reschedule
- [ ] Display join link for sessions
- [ ] Make join link clickable and open in new tab
- [ ] Add reschedule button that opens modal or navigation
- [ ] Handle missing join links gracefully

### Task 5: Empty State and CTA
- [ ] Display friendly message when no sessions
- [ ] Show prominent CTA to book session
- [ ] Link to booking/Cal.com page
- [ ] Test navigation to booking

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
pnpm build
```

## Acceptance Criteria

- [ ] Component exists at `apps/web/app/home/(user)/_components/coaching-sessions-card.tsx`
- [ ] Displays upcoming coaching sessions
- [ ] Shows session date, time, and join link
- [ ] Includes reschedule button for each session
- [ ] Shows CTA to book session when none scheduled
- [ ] Component receives data from dashboard loader via props
- [ ] Fixed height prevents layout jank
- [ ] Join links open correctly
- [ ] TypeScript strict mode passes
- [ ] All validation commands pass

---
*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
