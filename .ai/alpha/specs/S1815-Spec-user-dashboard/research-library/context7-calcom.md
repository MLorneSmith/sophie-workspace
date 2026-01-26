# Context7 Research: Cal.com Embed/Booking Integration for Next.js

**Date**: 2026-01-26
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-user-dashboard
**Libraries Researched**: calcom/cal.com (36,105 stars)

## Query Summary

Researched Cal.com integration patterns for a Next.js dashboard, focusing on:
1. Embed SDK and iframe integration options
2. Displaying upcoming bookings for users
3. Booking widget integration patterns
4. Reschedule functionality
5. Join link generation

## Findings

### 1. Integration Approaches

Cal.com offers three primary integration methods for Next.js applications:

#### A. Embed SDK (Vanilla JavaScript)
The traditional embed approach using the Cal.com snippet:

```javascript
// Initialize the Cal.com embed snippet
(function (C, A, L) {
  let p = function (a, ar) { a.q.push(ar); };
  let d = C.document;
  C.Cal = C.Cal || function () {
    let cal = C.Cal;
    let ar = arguments;
    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      d.head.appendChild(d.createElement("script")).src = A;
      cal.loaded = true;
    }
    if (ar[0] === L) {
      const api = function () { p(api, arguments); };
      const namespace = ar[1];
      api.q = api.q || [];
      if (typeof namespace === "string") {
        cal.ns[namespace] = cal.ns[namespace] || api;
        p(cal.ns[namespace], ar);
        p(cal, ['initNamespace', namespace]);
      } else p(cal, ar);
      return;
    }
    p(cal, ar);
  };
})(window, "https://app.cal.com/embed/embed.js", "init");

// Initialize
Cal("init", { debug: true });
```

**Embed Types:**
- **Inline**: `Cal("inline", { elementOrSelector: "#my-cal", calLink: "user/event" })`
- **Modal**: `Cal.modal({ calLink: "user/event" })`
- **Floating Button**: `Cal.floatingButton({ calLink: "user/event", buttonText: "Book", buttonPosition: "bottom-right" })`

#### B. React Atoms Package (RECOMMENDED for Next.js)
The `@calcom/atoms` package provides native React components:

```bash
pnpm add @calcom/atoms
```

**Setup in _app.tsx or layout.tsx:**
```javascript
import "@calcom/atoms/globals.min.css";

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
```

**Important**: Set `<html dir="ltr">` for toggle animations to work correctly.

#### C. BookerEmbed Atom (Platform Customers)
For deeper integration with custom styling:

```javascript
import { BookerEmbed } from "@calcom/atoms";

export default function BookerEmbedPage(props: BookerProps) {
  return (
    <BookerEmbed
      eventSlug={props.eventTypeSlug}
      username={props.calUsername}
      onCreateBookingSuccess={() => {
        console.log("Booking created successfully!");
      }}
      defaultFormValues={{ name: " ", email: " " }}
    />
  );
}
```

### 2. Displaying Upcoming Bookings

#### Using React Hooks (Platform Customers)

```javascript
import { useBookings, useBooking } from "@calcom/atoms";

// Fetch all bookings with filters
export default function Bookings() {
  const { isLoading, data: upcomingBookings } = useBookings({
    take: 50,
    skip: 0,
    status: ["upcoming"],
  });

  return (
    <>
      <h1>Upcoming bookings</h1>
      {isLoading && <p>Loading...</p>}
      {!isLoading && !upcomingBookings && <p>No upcoming bookings found</p>}
      {!isLoading && upcomingBookings?.map((booking) => (
        <div key={booking.id}>
          <h1>{booking.title}</h1>
          <p>Start: {booking.startTime}</p>
          <p>End: {booking.endTime}</p>
        </div>
      ))}
    </>
  );
}

// Fetch specific booking by UID
export default function BookingDetail() {
  const { isLoading, data: booking } = useBooking("bookingUid123");

  if (isLoading) return <p>Loading...</p>;
  if (!booking) return <p>No booking found</p>;

  return <div>Title: {booking.title}</div>;
}
```

#### Using REST API (V2)

```bash
# List bookings via API
curl https://api.cal.com/v2/bookings \
  -H "Authorization: Bearer cal_live_xxx" \
  -H "cal-api-version: 2024-08-13"
```

**Zapier Integration Endpoint:**
```http
GET /api/integrations/zapier/listBookings?apiKey=YOUR_API_KEY
```

Response structure:
```json
{
  "bookings": [
    {
      "id": "booking_id_1",
      "startTime": "2023-10-27T10:00:00Z",
      "endTime": "2023-10-27T11:00:00Z",
      "attendeeName": "John Doe"
    }
  ]
}
```

### 3. Booking Widget Integration Patterns

#### Basic Booker Atom
```javascript
import { Booker } from "@calcom/atoms";

export default function BookingPage({ eventTypeSlug, calUsername }) {
  return (
    <Booker
      eventSlug={eventTypeSlug}
      username={calUsername}
      onCreateBookingSuccess={() => {
        console.log("Booking created successfully!");
      }}
    />
  );
}
```

#### Week View Layout
```javascript
<Booker
  view="WEEK_VIEW"  // or "COLUMN_VIEW" - both support Overlay Calendar
  eventSlug={eventTypeSlug}
  username={calUsername}
  onCreateBookingSuccess={() => console.log("Booking created!")}
/>
```

#### Team Events
```javascript
<Booker
  eventSlug={eventTypeSlug}
  isTeamEvent={true}
  teamId={teamId}
  onCreateBookingSuccess={() => console.log("Team booking created!")}
/>
```

#### Custom Booking Flow Interception
```javascript
import { Booker, UseCreateBookingInput } from "@calcom/atoms";
import { useCallback } from "react";

export function BookingPage({ calUsername, calEmail }) {
  const interceptBooking = useCallback((data: UseCreateBookingInput) => {
    console.log(data);
    // Custom logic: payment processing, confirmation modal, etc.
    // Then POST to create booking endpoint
  }, []);

  return (
    <Booker
      handleCreateBooking={interceptBooking}
      eventSlug="30min"
      username={calUsername}
    />
  );
}
```

#### Custom Styling (BookerEmbed)
```javascript
<BookerEmbed
  eventSlug={eventTypeSlug}
  username={calUsername}
  customClassNames={{
    bookerContainer: "bg-[#F5F2FE]! border-subtle border",
    datePickerCustomClassNames: {
      datePickerDatesActive: "bg-[#D7CEF5]!",
    },
    eventMetaCustomClassNames: {
      eventMetaTitle: "text-[#7151DC]",
    },
    availableTimeSlotsCustomClassNames: {
      availableTimeSlotsHeaderContainer: "bg-[#F5F2FE]!",
      availableTimes: "bg-[#D7CEF5]!",
    },
    confirmStep: {
      confirmButton: "bg-purple-700!",
      backButton: "text-purple-700 hover:bg-purple-700! hover:text-white!",
    },
  }}
/>
```

### 4. Reschedule Functionality

#### Using Booker Atom (Individual Booking)
```javascript
import { Booker } from "@calcom/atoms";

export default function ReschedulePage({ eventTypeSlug, calUsername, rescheduleUid }) {
  return (
    <Booker
      eventSlug={eventTypeSlug}
      username={calUsername}
      rescheduleUid={rescheduleUid}  // The booking UID from original booking
      onCreateBookingSuccess={() => {
        console.log("Booking rescheduled successfully!");
      }}
    />
  );
}
```

#### Using Booker Atom (Team Event)
```javascript
<Booker
  eventSlug={eventTypeSlug}
  rescheduleUid={rescheduleUid}
  isTeamEvent={true}
  teamId={teamId}
  onCreateBookingSuccess={() => console.log("Team booking rescheduled!")}
/>
```

#### Using Embed SDK (Button)
```javascript
// Using reschedule path
document.write(`
  <button
    data-cal-namespace="popupReschedule"
    data-cal-config='{"flag.coep":"true"}'
    data-cal-link="reschedule/${rescheduleUid}">
    Reschedule Event
  </button>
`);

// Using rescheduleUid param
document.write(`
  <button
    data-cal-namespace="popupReschedule"
    data-cal-config='{"flag.coep":"true", "rescheduleUid": "${rescheduleUid}"}'
    data-cal-link="${calLink}">
    Reschedule Event
  </button>
`);
```

#### Using REST API (V2)
```bash
curl -X POST https://api.cal.com/v2/bookings/{bookingId}/reschedule \
  -H "Content-Type: application/json" \
  -H "cal-api-version: 2024-08-13" \
  -H "Authorization: Bearer cal_live_***" \
  -d '{
    "start": "2024-01-16T14:00:00Z",
    "reschedulingReason": "Conflict with another meeting"
  }'
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": 789,
    "uid": "bk_new789xyz",
    "title": "30 Min Meeting",
    "status": "accepted",
    "start": "2024-01-16T14:00:00.000Z",
    "end": "2024-01-16T14:30:00.000Z",
    "hosts": [{ "id": 1, "name": "Alice Smith", "email": "alice@example.com" }],
    "attendees": [{ "name": "John Doe", "email": "john@example.com" }]
  }
}
```

### 5. Join Link Generation

#### From Booking Response
When a booking is created, the response includes the meeting URL:

```json
{
  "status": "success",
  "data": {
    "id": 456,
    "uid": "bk_abc123xyz",
    "title": "30 Min Meeting",
    "location": "https://zoom.us/j/123456789",
    "meetingUrl": "https://zoom.us/j/123456789",
    // ... other fields
  }
}
```

#### Booking Structure Fields
- `location` - The meeting location (Zoom URL, Google Meet, etc.)
- `meetingUrl` - Direct meeting URL for video calls
- `hosts[].email` - Host contact information
- `attendees[].email` - Attendee contact information

### 6. Cancellation Functionality

#### Using React Hook
```javascript
import { useBooking, useCancelBooking } from "@calcom/atoms";

export default function BookingActions() {
  const { isLoading, data: booking, refetch } = useBooking("bookingUid");
  const { mutate: cancelBooking } = useCancelBooking({
    onSuccess: () => refetch(),
  });

  if (!booking) return null;

  return (
    <button
      onClick={() => {
        cancelBooking({
          id: booking.id,
          cancellationReason: "User request",
        });
      }}
    >
      Cancel Booking
    </button>
  );
}
```

#### Using Embed SDK (Button)
```javascript
document.write(`
  <button
    data-cal-namespace="popupCancelBooking"
    data-cal-config='{"flag.coep":"true"}'
    data-cal-link="booking/${bookingUid}?cancel=true">
    Cancel Booking
  </button>
`);
```

### 7. Webhook Integration

Subscribe to booking events for real-time updates:

```bash
# Subscribe to webhooks
curl -X POST /api/integrations/zapier/addSubscription?apiKey=YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://your-app.com/api/webhooks/calcom",
    "eventTriggers": ["booking.created", "booking.rescheduled", "booking.cancelled"]
  }'
```

**Webhook Event Payload (BOOKING_RESCHEDULED):**
```json
{
  "triggerEvent": "BOOKING_RESCHEDULED",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "payload": {
    "bookerUrl": "https://app.example.com",
    "title": "Strategy Session: Organizer & Guest",
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

### 8. API Authentication

#### V2 API (Recommended)
```bash
curl https://api.cal.com/v2/event-types \
  -H "Authorization: Bearer cal_live_xxxxxx"
```

#### OAuth Client Credentials
```http
x-cal-client-id: YOUR_CLIENT_ID
x-cal-secret-key: YOUR_CLIENT_SECRET
```

### 9. Additional Atoms for Dashboard

#### Calendar View
```javascript
import { CalendarView } from "@calcom/atoms";

// Individual event
<CalendarView username={calUsername} eventSlug={eventSlug} />

// Team event
<CalendarView teamId={teamId} eventSlug={eventSlug} />
```

#### Availability Settings
```javascript
import { AvailabilitySettings, ListSchedules } from "@calcom/atoms";

// List all schedules
<ListSchedules getRedirectUrl={(scheduleId) => `/availability/${scheduleId}`} />

// Edit specific schedule
<AvailabilitySettings
  id={scheduleId}
  onUpdateSuccess={() => console.log("Updated!")}
  onDeleteSuccess={() => console.log("Deleted!")}
/>
```

## Key Takeaways

1. **Use `@calcom/atoms` for Next.js** - Native React components provide better DX and type safety than embed SDK
2. **`useBookings` hook** - Best way to fetch and display upcoming bookings with filtering
3. **`rescheduleUid` prop** - Pass the original booking UID to Booker component for rescheduling
4. **`meetingUrl` field** - Contains the join link for video meetings in booking response
5. **Webhook events** - Use BOOKING_CREATED, BOOKING_RESCHEDULED for real-time sync
6. **Custom styling** - BookerEmbed supports comprehensive customClassNames for branding
7. **API v2** - Use Bearer token auth; v1 deprecated (discontinuing Feb 2026)

## Recommended Implementation for Dashboard Widget

```typescript
// components/dashboard/coaching-widget.tsx
import { useBookings, Booker, useCancelBooking } from "@calcom/atoms";

interface CoachingWidgetProps {
  userId: string;
  coachUsername: string;
}

export function CoachingWidget({ userId, coachUsername }: CoachingWidgetProps) {
  const { data: bookings, isLoading, refetch } = useBookings({
    status: ["upcoming"],
    take: 5,
  });

  const { mutate: cancelBooking } = useCancelBooking({
    onSuccess: refetch,
  });

  if (isLoading) return <WidgetSkeleton />;

  const nextSession = bookings?.[0];

  return (
    <div className="widget">
      {nextSession ? (
        <UpcomingSession
          booking={nextSession}
          onReschedule={() => /* open reschedule modal */}
          onCancel={() => cancelBooking({ id: nextSession.id })}
          onJoin={() => window.open(nextSession.meetingUrl)}
        />
      ) : (
        <EmptyState>
          <Booker
            eventSlug="coaching-session"
            username={coachUsername}
            onCreateBookingSuccess={refetch}
          />
        </EmptyState>
      )}
    </div>
  );
}
```

## Sources

- Cal.com via Context7 (calcom/cal.com)
- Topics: embed, booking, api, react, atoms, webhook
- Total tokens retrieved: ~11,500
