# Context7 Research: Cal.com API and Embedding for Next.js

**Date**: 2026-01-20
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-user-dashboard
**Libraries Researched**: calcom/cal.com

## Query Summary

Researched Cal.com integration options for a Next.js application, focusing on:
1. Embedding booking widgets in Next.js
2. API for fetching user bookings/scheduled sessions
3. Best practices for showing upcoming booked sessions
4. Webhook integration for real-time booking updates

## Findings

### 1. Embedding Cal.com Booking Widgets in Next.js

Cal.com offers multiple embedding approaches for Next.js applications:

#### Option A: Cal.com Atoms (Recommended for React/Next.js)

The `@calcom/atoms` package provides React components for deep integration.

**Installation:**
```bash
pnpm add @calcom/atoms
```

**Setup CalProvider (Required):**
```javascript
// _app.tsx or layout.tsx
import "@calcom/atoms/globals.min.css";
import { CalProvider } from '@calcom/atoms';

function MyApp({ Component, pageProps }) {
  return (
    <CalProvider
      clientId={process.env.CAL_OAUTH_CLIENT_ID ?? ""}
      options={{
        apiUrl: process.env.CAL_API_URL ?? "https://api.cal.com/v2",
        refreshUrl: "/api/refresh"
      }}
      accessToken={accessToken} // For authenticated users
    >
      <Component {...pageProps} />
    </CalProvider>
  );
}
```

**Booker Component (Main Booking Widget):**
```javascript
import { Booker } from "@calcom/atoms";

export default function BookingPage({ eventTypeSlug, calUsername }) {
  return (
    <Booker
      eventSlug={eventTypeSlug}
      username={calUsername}
      view="WEEK_VIEW" // or "COLUMN_VIEW", "MONTH_VIEW"
      onCreateBookingSuccess={() => {
        console.log("Booking created successfully!");
      }}
      defaultFormValues={{ name: "", email: "" }}
    />
  );
}
```

**BookerEmbed Component (For embedding in existing pages):**
```javascript
import { BookerEmbed } from "@calcom/atoms";

export default function EmbeddedBooker({ eventTypeSlug, calUsername }) {
  return (
    <BookerEmbed
      view="WEEK_VIEW"
      eventSlug={eventTypeSlug}
      username={calUsername}
      onCreateBookingSuccess={() => {
        console.log("Booking created!");
      }}
      customClassNames={{
        bookerContainer: "bg-[#F5F2FE] border-subtle border",
        datePickerCustomClassNames: {
          datePickerDatesActive: "bg-[#D7CEF5]",
        },
      }}
    />
  );
}
```

#### Option B: JavaScript Embed Snippet

For simpler integration without React components:

**Inline Embed:**
```javascript
// Initialize Cal.com embed
Cal("init", {
  debug: true,
  calOrigin: "https://cal.com",
});

// Embed inline in a container
Cal("inline", {
  elementOrSelector: "#my-cal-inline",
  calLink: "username/event-type",
  config: {
    theme: "dark"
  }
});
```

**Modal Embed:**
```javascript
Cal.modal({
  calLink: "username/event-type",
  config: {
    theme: "dark"
  }
});
```

**Floating Action Button:**
```javascript
Cal.floatingButton({
  calLink: "username/event-type",
  buttonText: "Book meeting",
  buttonPosition: "bottom-right"
});
```

### 2. Cal.com API for Fetching Bookings

#### API V2 Authentication

Cal.com API V2 uses Bearer token authentication:

```bash
curl https://api.cal.com/v2/bookings \
  -H "Authorization: Bearer cal_live_xxxxxx" \
  -H "cal-api-version: 2024-08-13"
```

**Note:** API V1 is deprecated and will be discontinued on February 15, 2026. Use V2.

#### Fetching Bookings with React Hooks (Atoms)

**useBookings Hook - List All Bookings:**
```javascript
import { useBookings } from "@calcom/atoms";

export default function UpcomingBookings() {
  const { isLoading, data: upcomingBookings } = useBookings({
    take: 50,
    skip: 0,
    status: ["upcoming"], // Filter by status
  });

  if (isLoading) return <p>Loading...</p>;
  if (!upcomingBookings?.length) return <p>No upcoming bookings</p>;

  return (
    <div>
      {upcomingBookings.map((booking) => (
        <div key={booking.id}>
          <h3>{booking.title}</h3>
          <p>Start: {booking.startTime}</p>
          <p>End: {booking.endTime}</p>
        </div>
      ))}
    </div>
  );
}
```

**useBooking Hook - Single Booking Details:**
```javascript
import { useBooking } from "@calcom/atoms";

export default function BookingDetails({ bookingUid }) {
  const { isLoading, data: booking } = useBooking(bookingUid);

  if (isLoading) return <p>Loading...</p>;
  if (!booking) return <p>Booking not found</p>;

  return (
    <div>
      <h2>{booking.title}</h2>
      <p>Status: {booking.status}</p>
    </div>
  );
}
```

#### Direct API Calls

**List Bookings:**
```bash
GET https://api.cal.com/v2/bookings
Authorization: Bearer cal_live_xxx
```

**Create Booking:**
```bash
POST https://api.cal.com/v2/bookings
Content-Type: application/json
Authorization: Bearer cal_live_xxx

{
  "eventTypeId": 123,
  "start": "2024-01-15T10:00:00.000Z",
  "attendee": {
    "name": "John Doe",
    "email": "john@example.com",
    "timeZone": "America/New_York"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 123,
    "uid": "cal_abc123xyz",
    "title": "Meeting",
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T11:00:00.000Z",
    "status": "accepted",
    "attendees": [...],
    "metadata": {...}
  }
}
```

**Reschedule Booking:**
```bash
POST https://api.cal.com/v2/bookings/{bookingId}/reschedule
Content-Type: application/json
Authorization: Bearer cal_live_xxx

{
  "start": "2024-01-16T14:00:00Z",
  "reschedulingReason": "Conflict with another meeting"
}
```

### 3. Best Practices for Showing Upcoming Booked Sessions

#### Component Pattern for Dashboard

```javascript
import { useBookings, useCancelBooking } from "@calcom/atoms";
import { useRouter } from "next/router";

export default function UpcomingSessionsWidget() {
  const router = useRouter();

  const { isLoading, data: bookings, refetch } = useBookings({
    take: 10,
    skip: 0,
    status: ["upcoming"],
  });

  const { mutate: cancelBooking } = useCancelBooking({
    onSuccess: () => {
      refetch(); // Refresh list after cancellation
    },
  });

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <h2>Upcoming Sessions</h2>
      {bookings?.length === 0 && (
        <EmptyState message="No upcoming sessions" />
      )}
      {bookings?.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onCancel={() => cancelBooking({
            uid: booking.uid,
            cancellationReason: "User request",
          })}
          onReschedule={() => router.push(`/reschedule/${booking.uid}`)}
        />
      ))}
    </div>
  );
}
```

#### Reschedule Flow

```javascript
import { Booker } from "@calcom/atoms";

export default function ReschedulePage({ bookingUid, eventSlug, username }) {
  return (
    <Booker
      eventSlug={eventSlug}
      username={username}
      rescheduleUid={bookingUid} // Enables reschedule mode
      onCreateBookingSuccess={() => {
        console.log("Booking rescheduled!");
        // Redirect to confirmation
      }}
    />
  );
}
```

#### Display Booking After Success

```javascript
import { useBooking } from "@calcom/atoms";
import { useRouter } from "next/router";

export default function BookingConfirmation() {
  const router = useRouter();
  const bookingUid = router.query.bookingUid as string;

  const { isLoading, data: booking, refetch } = useBooking(bookingUid);

  if (isLoading) return <p>Loading...</p>;

  // Handle both single and recurring bookings
  if (!Array.isArray(booking)) {
    return <SingleBookingConfirmation booking={booking} />;
  }

  return (
    <div>
      {booking.map((recurrence) => (
        <RecurringBookingItem key={recurrence.id} booking={recurrence} />
      ))}
    </div>
  );
}
```

### 4. Webhook Integration for Real-Time Updates

Cal.com supports webhooks for real-time booking event notifications.

#### Webhook Events

| Event | Description |
|-------|-------------|
| `BOOKING_CREATED` | New booking created |
| `BOOKING_RESCHEDULED` | Booking time changed |
| `BOOKING_CANCELLED` | Booking cancelled |
| `BOOKING_CONFIRMED` | Booking confirmed (for pending bookings) |
| `MEETING_STARTED` | Meeting has begun |

#### Subscribe to Webhooks

```bash
POST /api/integrations/zapier/addSubscription
Content-Type: application/json

{
  "webhookUrl": "https://your-app.com/api/webhooks/cal",
  "eventTriggers": ["booking.created", "booking.updated"]
}
```

**Response:**
```json
{
  "subscriptionId": "sub_abc123"
}
```

#### Webhook Payload Example (MEETING_STARTED)

```json
{
  "triggerEvent": "MEETING_STARTED",
  "id": 100,
  "uid": "unique-booking-identifier",
  "userId": 10,
  "eventTypeId": 50,
  "title": "Strategy Session",
  "startTime": "2024-01-01T10:00:00.000Z",
  "endTime": "2024-01-01T10:15:00.000Z",
  "status": "ACCEPTED",
  "user": {
    "email": "organizer@example.com",
    "name": "Organizer Name",
    "timeZone": "UTC"
  },
  "attendees": [
    {
      "id": 101,
      "email": "guest@example.com",
      "name": "Guest User",
      "timeZone": "UTC"
    }
  ]
}
```

#### Webhook Payload Example (BOOKING_RESCHEDULED)

```json
{
  "triggerEvent": "BOOKING_RESCHEDULED",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "payload": {
    "title": "Strategy Session",
    "startTime": "2024-01-10T14:30:00Z",
    "endTime": "2024-01-10T14:45:00Z",
    "eventTypeId": 100,
    "organizer": {
      "id": 1,
      "name": "Organizer Name",
      "email": "organizer@example.com",
      "timeZone": "UTC"
    }
  }
}
```

#### Next.js Webhook Handler

```typescript
// app/api/webhooks/cal/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const payload = await request.json();

  switch (payload.triggerEvent) {
    case 'BOOKING_CREATED':
      await handleBookingCreated(payload);
      break;
    case 'BOOKING_RESCHEDULED':
      await handleBookingRescheduled(payload);
      break;
    case 'BOOKING_CANCELLED':
      await handleBookingCancelled(payload);
      break;
    case 'MEETING_STARTED':
      await handleMeetingStarted(payload);
      break;
  }

  return NextResponse.json({ status: 'OK' });
}

async function handleBookingCreated(payload: any) {
  // Update database, send notifications, etc.
  const { uid, title, startTime, endTime, attendees } = payload;
  // Your logic here
}
```

#### Unsubscribe from Webhooks

```bash
DELETE /api/integrations/zapier/deleteSubscription?apiKey=YOUR_API_KEY&subscriptionId=sub_abc123
```

## Key Takeaways

1. **Use @calcom/atoms for React/Next.js** - Provides native React components with hooks for data fetching
2. **CalProvider is required** - Wrap your app with CalProvider for atoms to work
3. **API V2 is the current standard** - V1 will be deprecated February 2026
4. **useBookings hook** - Best way to fetch upcoming sessions with filtering
5. **Webhooks enable real-time updates** - Subscribe to booking events for dashboard updates
6. **Reschedule mode** - Pass `rescheduleUid` prop to Booker for reschedule flow

## Code Examples

### Complete Dashboard Integration Example

```typescript
// components/CalBookingsDashboard.tsx
'use client';

import { CalProvider, useBookings, useCancelBooking, Booker } from "@calcom/atoms";
import "@calcom/atoms/globals.min.css";
import { useState } from "react";

interface CalBookingsDashboardProps {
  clientId: string;
  accessToken: string;
  calUsername: string;
  eventSlug: string;
}

export function CalBookingsDashboard({
  clientId,
  accessToken,
  calUsername,
  eventSlug
}: CalBookingsDashboardProps) {
  return (
    <CalProvider
      clientId={clientId}
      accessToken={accessToken}
      options={{
        apiUrl: "https://api.cal.com/v2",
      }}
    >
      <DashboardContent
        calUsername={calUsername}
        eventSlug={eventSlug}
      />
    </CalProvider>
  );
}

function DashboardContent({ calUsername, eventSlug }) {
  const [showBooker, setShowBooker] = useState(false);

  const { isLoading, data: bookings, refetch } = useBookings({
    take: 20,
    status: ["upcoming"],
  });

  const { mutate: cancelBooking } = useCancelBooking({
    onSuccess: () => refetch(),
  });

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
        {isLoading && <p>Loading...</p>}
        {!isLoading && bookings?.length === 0 && (
          <p>No upcoming sessions scheduled</p>
        )}
        {bookings?.map((booking) => (
          <div key={booking.id} className="p-4 border rounded-lg mb-2">
            <h3 className="font-medium">{booking.title}</h3>
            <p className="text-sm text-gray-600">
              {new Date(booking.startTime).toLocaleString()}
            </p>
            <button
              onClick={() => cancelBooking({
                uid: booking.uid,
                cancellationReason: "User cancelled",
              })}
              className="text-red-500 text-sm mt-2"
            >
              Cancel
            </button>
          </div>
        ))}
      </section>

      <section>
        <button
          onClick={() => setShowBooker(!showBooker)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {showBooker ? "Hide Booker" : "Book New Session"}
        </button>

        {showBooker && (
          <div className="mt-4">
            <Booker
              eventSlug={eventSlug}
              username={calUsername}
              onCreateBookingSuccess={() => {
                setShowBooker(false);
                refetch();
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
```

### Server Action for Webhook Handling

```typescript
// app/api/webhooks/cal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const client = getSupabaseServerClient();

  try {
    switch (payload.triggerEvent) {
      case 'BOOKING_CREATED':
        await client.from('coaching_sessions').insert({
          cal_booking_uid: payload.uid,
          title: payload.title,
          start_time: payload.startTime,
          end_time: payload.endTime,
          status: 'scheduled',
          attendee_email: payload.attendees?.[0]?.email,
        });
        break;

      case 'BOOKING_CANCELLED':
        await client
          .from('coaching_sessions')
          .update({ status: 'cancelled' })
          .eq('cal_booking_uid', payload.uid);
        break;

      case 'BOOKING_RESCHEDULED':
        await client
          .from('coaching_sessions')
          .update({
            start_time: payload.payload.startTime,
            end_time: payload.payload.endTime,
            status: 'rescheduled',
          })
          .eq('cal_booking_uid', payload.uid);
        break;
    }

    return NextResponse.json({ status: 'OK' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

## Environment Variables Required

```env
# Cal.com Platform Configuration
CAL_OAUTH_CLIENT_ID=your_oauth_client_id
CAL_API_URL=https://api.cal.com/v2
CAL_WEBHOOK_SECRET=your_webhook_secret

# For managed users
CAL_ACCESS_TOKEN=user_access_token
```

## Sources

- Cal.com via Context7 (calcom/cal.com)
  - Embed documentation: packages/embeds/README.md
  - Atoms documentation: docs/platform/atoms/
  - API documentation: docs/api-reference/v2/
  - Webhooks documentation: docs/developing/guides/automation/webhooks.mdx
  - Bookings hooks: docs/platform/bookings-hooks.mdx
