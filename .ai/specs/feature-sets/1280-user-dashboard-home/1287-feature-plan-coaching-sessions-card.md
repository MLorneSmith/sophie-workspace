# Feature Plan: Coaching Sessions Card

**Issue**: #1287
**Parent**: #1280
**Research Manifest**: #1279
**Phase**: 2 - Core Components
**Effort**: M (Medium)
**Dependencies**: None

---

## Overview

Display upcoming coaching sessions or booking button. If sessions are booked, show next 1-2 sessions with date/time, join link, and reschedule option. Otherwise, show a button to navigate to the booking page.

This component bridges the coaching booking system with the dashboard, providing quick access to upcoming sessions and booking interface.

## Solution Approach

### Component Structure

**Two States**:

1. **With Upcoming Sessions**:
   - Header: "Coaching Sessions"
   - Session list: Next 1-2 sessions
   - Each session: Date/time, coach name (if available), join button, reschedule link
   - Footer: "See all sessions" link

2. **No Upcoming Sessions**:
   - Header: "Coaching Sessions"
   - Empty message: "No sessions booked"
   - Booking button: "Book a Session" → `/home/coaching`

### Data Handling

This component can be implemented two ways:

**Option A: Static (Simpler)**
- No data loading required
- Always show booking button
- Can be upgraded later to show sessions

**Option B: With Data Loading** (Recommended for full feature)
- Load upcoming sessions from coaching/bookings API
- Show sessions if available
- Show booking button as fallback

### Key Implementation Details

1. **Client Component**
   - Add `"use client"` directive (for interactivity)
   - Accept optional `sessions` prop (can be undefined)
   - Handle loading state while fetching

2. **Session Display**
   - Format date/time in user's timezone
   - Show coach name if available
   - Display join link (if session is upcoming)
   - Reschedule link (if applicable)
   - Use Badge for session status (upcoming, today, etc.)

3. **Date/Time Formatting**
   - Format: "Today at 2:00 PM" or "Wed, Dec 19 at 2:00 PM"
   - Use formatDistanceToNow for "in X days" format
   - Display timezone info if different from user's

4. **Action Buttons**
   - "Join" button (if session is now or within 15 mins)
   - "Reschedule" link
   - "Book a Session" button (if no sessions)
   - "See all sessions" link (if multiple sessions exist)

### Code Pattern

```typescript
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Calendar, Clock, Video, ArrowRight } from 'lucide-react';
import { If } from '@kit/ui/if';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';

interface CoachingSession {
  id: string;
  coachName: string;
  startTime: string; // ISO date
  endTime: string;
  joinUrl?: string;
  reschedulePath?: string;
}

interface CoachingSessionsCardProps {
  sessions?: CoachingSession[];
  isLoading?: boolean;
}

export function CoachingSessionsCard({
  sessions = [],
  isLoading = false,
}: CoachingSessionsCardProps) {
  const hasSessions = sessions && sessions.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Coaching Sessions</CardTitle>
          <CardDescription>Book and manage sessions</CardDescription>
        </div>
        <If condition={hasSessions}>
          <Button variant="ghost" size="sm" asChild>
            <a href="/home/coaching">
              View all
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </Button>
        </If>
      </CardHeader>

      <CardContent className="space-y-3">
        <If condition={isLoading}>
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading sessions...</p>
          </div>
        </If>

        <If condition={hasSessions && !isLoading}>
          {sessions.slice(0, 2).map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </If>

        <If condition={!hasSessions && !isLoading}>
          <NoSessionsState />
        </If>
      </CardContent>
    </Card>
  );
}

function SessionRow({ session }: { session: CoachingSession }) {
  const startDate = new Date(session.startTime);
  const isToday_ = isToday(startDate);
  const isPast_ = isPast(startDate);
  const formattedDate = isToday_
    ? format(startDate, "'Today at' h:mm a")
    : format(startDate, 'EEE, MMM d h:mm a');

  const timeUntilSession = formatDistanceToNow(startDate, { addSuffix: true });
  const canJoin = !isPast_ && timeUntilSession.includes('less than') || isToday_;

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">{session.coachName}</p>
        <Badge variant="outline" className="text-xs">
          {timeUntilSession}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span>{formattedDate}</span>
      </div>

      <div className="flex gap-2">
        <If condition={canJoin && session.joinUrl}>
          <Button size="sm" variant="default" asChild>
            <a href={session.joinUrl} target="_blank" rel="noopener noreferrer">
              <Video className="w-4 h-4 mr-1" />
              Join Now
            </a>
          </Button>
        </If>

        <If condition={session.reschedulePath}>
          <Button size="sm" variant="outline" asChild>
            <a href={session.reschedulePath}>
              Reschedule
            </a>
          </Button>
        </If>

        <If condition={!canJoin && !session.joinUrl}>
          <p className="text-xs text-muted-foreground">Join link will appear soon</p>
        </If>
      </div>
    </div>
  );
}

function NoSessionsState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
      <Calendar className="w-8 h-8 text-muted-foreground opacity-50" />
      <div>
        <p className="font-medium text-sm">No sessions booked</p>
        <p className="text-xs text-muted-foreground">Schedule a coaching session</p>
      </div>
      <Button size="sm" variant="default" asChild>
        <a href="/home/coaching">
          <Calendar className="w-4 h-4 mr-2" />
          Book a Session
        </a>
      </Button>
    </div>
  );
}
```

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/_components/dashboard/coaching-sessions-card.tsx` | Upcoming sessions display with booking option |

### Reference Files
| File | Why Reference |
|------|----------------|
| `apps/web/app/home/(user)/coaching/_components/calendar.tsx` | Existing coaching calendar pattern |
| `apps/web/app/home/(user)/coaching/` | Coaching section structure |

## Implementation Tasks

### Task 1: Create component scaffold
- [ ] Create file `apps/web/app/home/(user)/_components/dashboard/coaching-sessions-card.tsx`
- [ ] Add `"use client"` directive
- [ ] Import Card, Button, Badge components from @kit/ui
- [ ] Import icons (Calendar, Clock, Video, ArrowRight) from lucide-react
- [ ] Import date utilities from date-fns
- [ ] Define TypeScript interfaces for props and sessions

### Task 2: Implement session list display
- [ ] Create `SessionRow` component for individual session
- [ ] Display coach name
- [ ] Format and display session date/time
- [ ] Show time remaining (e.g., "in 2 hours")
- [ ] Use Badge for timing display

### Task 3: Implement session actions
- [ ] Show "Join Now" button if session is upcoming and join URL available
- [ ] Show "Reschedule" link if available
- [ ] Show "Join link will appear soon" message if not ready
- [ ] Limit display to 2 most upcoming sessions

### Task 4: Implement no sessions state
- [ ] Show empty state message
- [ ] Display "Book a Session" button
- [ ] Link to `/home/coaching`
- [ ] Use calendar icon for visual consistency

### Task 5: Implement loading state
- [ ] Show loading message while fetching sessions
- [ ] Optional: Add skeleton loading for better UX

### Task 6: Testing and validation
- [ ] Run `pnpm typecheck` and verify no type errors
- [ ] Run `pnpm lint:fix` and ensure code style compliance
- [ ] Test with 0 sessions (empty state)
- [ ] Test with 1-2 upcoming sessions
- [ ] Test with sessions in different timezones
- [ ] Test "Join Now" button visibility based on time
- [ ] Verify links work correctly

## Validation Commands

```bash
pnpm typecheck
pnpm lint:fix
pnpm format:fix
```

## Acceptance Criteria

- [ ] Displays upcoming coaching sessions when available
- [ ] Shows coach name and formatted date/time
- [ ] Shows time remaining (e.g., "in 2 hours")
- [ ] "Join Now" button appears for ready sessions
- [ ] "Reschedule" button available
- [ ] No sessions state shows booking CTA
- [ ] Limits display to 2 upcoming sessions
- [ ] Loading state handled
- [ ] Links navigate correctly
- [ ] All validation commands pass without errors
- [ ] No TypeScript `any` types used

---

*Plan generated by initiative-planning agent*
*Skills used: frontend-design*
*Research conducted: no*
