# Cal.com Embed Integration Research (Updated)

**Date**: 2026-01-26 (Updated)
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/S1823-Spec-user-dashboard
**Status**: Updated to use Embed approach (Platform deprecated Dec 2025)

## Important Notice

**Cal.com Platform has been deprecated** as of December 15, 2025. The `@calcom/atoms` package and CalProvider approach are no longer recommended for new integrations. This research has been updated to use:

1. **`@calcom/embed-react`** - For booking flow (popup modal)
2. **Cal.com V2 API** - For fetching upcoming bookings

---

## 1. Embed Integration (Recommended Approach)

### Installation

```bash
pnpm add @calcom/embed-react
```

### Embed Types

Cal.com offers four embedding methods:

| Type | Use Case | Implementation |
|------|----------|----------------|
| **Inline** | Display calendar at specific location | `<Cal calLink="..." />` |
| **Popup via Element Click** | Trigger popup on any element click | `data-cal-link` attribute |
| **Floating Button** | Persistent booking button | Floating action button |
| **Email Link** | Booking links in emails | Direct URL |

### React/Next.js Implementation

```tsx
'use client';

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export function BookingEmbed({ coachUsername, eventSlug }: {
  coachUsername: string;
  eventSlug: string;
}) {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        theme: "light",
        styles: { branding: { brandColor: "#000000" } },
        hideEventTypeDetails: false,
      });
    })();
  }, []);

  return (
    <Cal
      calLink={`${coachUsername}/${eventSlug}`}
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
      config={{ theme: "light" }}
    />
  );
}
```

### Popup Modal Trigger

```tsx
'use client';

import { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";
import { Button } from "@kit/ui/button";

export function BookSessionButton({ coachUsername, eventSlug }: {
  coachUsername: string;
  eventSlug: string;
}) {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", { theme: "light" });
    })();
  }, []);

  const openBookingModal = async () => {
    const cal = await getCalApi();
    cal("modal", {
      calLink: `${coachUsername}/${eventSlug}`,
    });
  };

  return (
    <Button onClick={openBookingModal}>
      Book a Coaching Session
    </Button>
  );
}
```

---

## 2. V2 API for Fetching Bookings

### Authentication

Use API Key authentication with Bearer token:

```typescript
const headers = {
  'Authorization': `Bearer ${process.env.CALCOM_API_KEY}`,
  'Content-Type': 'application/json',
  'cal-api-version': '2024-08-13',
};
```

**API Key Formats:**
- Test/Development: `cal_test_xxxxx`
- Production: `cal_live_xxxxx`

**Rate Limits:** 120 requests/minute (can be increased to 200 on request)

### Fetching User Bookings

```typescript
// Server action or API route
import 'server-only';

interface CalBooking {
  id: number;
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'ACCEPTED' | 'PENDING' | 'CANCELLED' | 'REJECTED';
  attendees: Array<{
    email: string;
    name: string;
  }>;
  metadata?: Record<string, unknown>;
}

export async function fetchUpcomingBookings(userEmail: string): Promise<CalBooking[]> {
  const response = await fetch(
    `https://api.cal.com/v2/bookings?status=upcoming&attendeeEmail=${encodeURIComponent(userEmail)}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    }
  );

  if (!response.ok) {
    console.error('Cal.com API error:', response.status);
    return [];
  }

  const data = await response.json();
  return data.data || [];
}
```

### Get Single Booking

```typescript
export async function getBooking(bookingUid: string): Promise<CalBooking | null> {
  const response = await fetch(
    `https://api.cal.com/v2/bookings/${bookingUid}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
      },
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  return data.data;
}
```

---

## 3. Dashboard Widget Implementation

### Coaching Sessions Widget (Server Component)

```tsx
import { fetchUpcomingBookings } from './_lib/server/calcom.loader';
import { BookSessionButton } from './_components/book-session-button';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Calendar, Video, Clock } from 'lucide-react';

interface CoachingSessionsWidgetProps {
  userEmail: string;
  coachUsername: string;
  eventSlug: string;
}

export async function CoachingSessionsWidget({
  userEmail,
  coachUsername,
  eventSlug,
}: CoachingSessionsWidgetProps) {
  const bookings = await fetchUpcomingBookings(userEmail);
  const upcomingSessions = bookings.slice(0, 2); // Show max 2

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Coaching Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingSessions.length > 0 ? (
          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <div
                key={session.uid}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{session.title}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(session.startTime), "PPP 'at' p")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Video className="h-4 w-4 mr-1" />
                    Join
                  </Button>
                  <Button size="sm" variant="ghost">
                    Reschedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              No upcoming coaching sessions
            </p>
            <BookSessionButton
              coachUsername={coachUsername}
              eventSlug={eventSlug}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 4. Environment Variables

```env
# Cal.com API Configuration
CALCOM_API_KEY="cal_live_xxxxxxxxxxxxx"

# Coach Configuration (can be per-environment or from database)
NEXT_PUBLIC_CALCOM_COACH_USERNAME="coach-name"
NEXT_PUBLIC_CALCOM_EVENT_SLUG="30min-coaching"
```

---

## 5. Reschedule and Cancel

### Reschedule via Embed

Open the embed with reschedule parameter:

```typescript
const openRescheduleModal = async (bookingUid: string) => {
  const cal = await getCalApi();
  cal("modal", {
    calLink: `reschedule/${bookingUid}`,
  });
};
```

### Cancel via API

```typescript
export async function cancelBooking(
  bookingUid: string,
  reason?: string
): Promise<boolean> {
  const response = await fetch(
    `https://api.cal.com/v2/bookings/${bookingUid}/cancel`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CALCOM_API_KEY}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
      },
      body: JSON.stringify({
        cancellationReason: reason || 'Cancelled by user',
      }),
    }
  );

  return response.ok;
}
```

---

## Key Takeaways

1. **Use `@calcom/embed-react`** for booking flows - handles the entire UX
2. **Use V2 API with API key** to fetch existing bookings - no OAuth needed
3. **Server-side fetching** for bookings list - keeps API key secure
4. **Client-side embed** for booking modal - user interaction required
5. **Rate limit: 120/min** - cache responses to avoid hitting limits
6. **Required header**: `cal-api-version: 2024-08-13` for bookings endpoints

## Complexity Assessment

| Task | Complexity | Notes |
|------|------------|-------|
| Install embed package | Low | Single npm package |
| Booking modal | Low | Standard React component |
| Fetch bookings API | Low | Simple fetch with API key |
| Reschedule flow | Low | Embed handles it |
| Cancel booking | Low | Single API call |

**Overall: Medium complexity** (down from High with platform approach)

---

## Sources

- [Cal.com Help - Adding Embed](https://cal.com/help/embedding/adding-embed)
- [Cal.com V2 API Introduction](https://cal.com/docs/api-reference/v2/introduction)
- [Cal.com Embed Page](https://cal.com/embed)
- [Medium - Integrating Cal.com with React](https://medium.com/@hamzabhf00/integrating-cal-com-into-your-website-using-react-a-step-by-step-guide-b9886b8e175f)
