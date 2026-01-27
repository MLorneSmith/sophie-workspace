# Context7 Research: Cal.com Embed SDK for Scheduling Integration

**Date**: 2026-01-27
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-user-dashboard
**Libraries Researched**: calcom/cal.com (36,105 stars)

## Query Summary

Researched Cal.com embed SDK documentation covering:
1. Embedding scheduling widgets in React/Next.js
2. Available props and customization options
3. Displaying upcoming bookings via API
4. Webhook integration for booking events
5. Authentication and identity linking

## Findings

### 1. Embedding Cal.com in React/Next.js

Cal.com offers two primary embedding approaches:

#### Option A: Cal.com Atoms (Recommended for React/Next.js)

The `@calcom/atoms` package provides React components for deep integration.

**Installation:**
```bash
pnpm add @calcom/atoms
```

**Setup CalProvider at App Root:**
```typescript
// app/layout.tsx or _app.tsx
import "@calcom/atoms/globals.min.css";
import { CalProvider } from '@calcom/atoms';

function MyApp({ Component, pageProps }) {
  const accessToken = "managed-user-access-token"; // From your auth system

  return (
    <CalProvider
      clientId={process.env.CAL_OAUTH_CLIENT_ID ?? ""}
      options={{
        apiUrl: process.env.CAL_API_URL ?? "https://api.cal.com/v2",
        refreshUrl: "/api/cal/refresh" // Your token refresh endpoint
      }}
      accessToken={accessToken}
    >
      <Component {...pageProps} />
    </CalProvider>
  );
}
```

**Render Booker Component:**
```typescript
import { Booker } from "@calcom/atoms";

export default function BookingPage({ calUsername, eventTypeSlug }: BookerProps) {
  return (
    <Booker
      eventSlug={eventTypeSlug}
      username={calUsername}
      onCreateBookingSuccess={(data) => {
        console.log("Booking created:", data);
        // Handle payment if required
        if (data.data.paymentRequired) {
          window.location.href = `/payment/${data.data.paymentUid}`;
        }
      }}
      defaultFormValues={{ name: "", email: "" }}
    />
  );
}
```

**BookerEmbed for Inline Embedding:**
```typescript
import { BookerEmbed } from "@calcom/atoms";

export default function EmbeddedBooker(props: BookerProps) {
  return (
    <BookerEmbed
      eventSlug={props.eventTypeSlug}
      username={props.calUsername}
      view="WEEK_VIEW" // or "MONTH_VIEW", "COLUMN_VIEW"
      onCreateBookingSuccess={() => {
        console.log("Booking created successfully!");
      }}
      customClassNames={{
        bookerContainer: "bg-[#F5F2FE] border-subtle border",
        datePickerCustomClassNames: {
          datePickerDatesActive: "bg-[#D7CEF5]",
        },
        eventMetaCustomClassNames: {
          eventMetaTitle: "text-[#7151DC]",
        },
        availableTimeSlotsCustomClassNames: {
          availableTimeSlotsHeaderContainer: "bg-[#F5F2FE]",
          availableTimes: "bg-[#D7CEF5]",
        },
      }}
    />
  );
}
```

#### Option B: Embed Script (Vanilla JS/Simple Integration)

For simpler use cases or non-React frameworks:

**Inline Embed:**
```javascript
// Initialize Cal.com embed
Cal("init", {
  debug: true,
  calOrigin: "https://cal.com",
});

// Inline embed in a container
Cal("inline", {
  elementOrSelector: "#my-cal-inline",
  calLink: "username/event-type",
  config: {
    theme: "dark",
  }
});
```

**Modal Embed:**
```javascript
Cal.modal({
  calLink: "organization/event-type",
  config: {
    theme: "light",
  }
});
```

**Floating Action Button:**
```javascript
Cal.floatingButton({
  calLink: "organization/event-type",
  buttonText: "Book meeting",
  buttonPosition: "bottom-right"
});
```

**HTML Data Attributes:**
```html
<button
  data-cal-link="username/30min"
  data-cal-config='{"theme":"dark", "email":"user@example.com", "name": "User Name"}'
>
  Book a Meeting
</button>
```

### 2. Props and Customization Options

#### CalProvider Props
| Prop | Type | Description |
|------|------|-------------|
| `clientId` | string | OAuth client ID from Cal.com Platform |
| `accessToken` | string | User's access token for authenticated booking |
| `options.apiUrl` | string | API URL (default: "https://api.cal.com/v2") |
| `options.refreshUrl` | string | Your endpoint to refresh tokens |
| `language` | string | Locale code (e.g., "fr", "es") |
| `labels` | object | Custom label overrides |
| `autoUpdateTimezone` | boolean | Auto-update user timezone |
| `onTimezoneChange` | function | Callback when timezone changes |

#### Booker/BookerEmbed Props
| Prop | Type | Description |
|------|------|-------------|
| `eventSlug` | string | Event type slug |
| `username` | string | Cal.com username (for individual events) |
| `teamId` | number | Team ID (for team events) |
| `isTeamEvent` | boolean | Whether this is a team event |
| `view` | string | "WEEK_VIEW", "MONTH_VIEW", "COLUMN_VIEW" |
| `rescheduleUid` | string | Booking UID for rescheduling |
| `defaultFormValues` | object | Pre-fill form fields |
| `customClassNames` | object | CSS customization |
| `onCreateBookingSuccess` | function | Callback on successful booking |
| `handleCreateBooking` | function | Intercept booking for custom flow |

#### Embed Config Options
| Option | Type | Description |
|--------|------|-------------|
| `theme` | string | "light" or "dark" |
| `email` | string | Pre-fill attendee email |
| `name` | string | Pre-fill attendee name |
| `flag.coep` | string | Cross-Origin Embedder Policy flag |
| `rescheduleUid` | string | UID for rescheduling |

### 3. Displaying Upcoming Bookings

#### Get Bookings API (V2)
```bash
# Get a single booking
curl -X GET "https://api.cal.com/v2/bookings/bk_abc123xyz" \
  -H "Authorization: Bearer cal_live_xxxxx" \
  -H "cal-api-version: 2024-08-13"

# Response
{
  "status": "success",
  "data": {
    "id": 456,
    "uid": "bk_abc123xyz",
    "title": "30 Min Meeting",
    "hosts": [{
      "id": 1,
      "name": "Alice Smith",
      "email": "alice@example.com"
    }],
    "status": "accepted",
    "start": "2024-01-15T10:00:00.000Z",
    "end": "2024-01-15T10:30:00.000Z",
    "attendees": [{
      "name": "John Doe",
      "email": "john@example.com"
    }],
    "meetingUrl": "https://zoom.us/j/123456789"
  }
}
```

#### List Bookings (Server-Side)
```typescript
// Server action or API route
async function getUpcomingBookings(userId: string) {
  const response = await fetch(
    `https://api.cal.com/v2/bookings?status=accepted&afterStart=${new Date().toISOString()}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'cal-api-version': '2024-08-13',
      },
    }
  );
  return response.json();
}
```

### 4. Webhook Integration

#### Subscribe to Webhooks
```bash
POST /api/integrations/zapier/addSubscription
Content-Type: application/json

{
  "webhookUrl": "https://your-app.com/api/webhooks/cal",
  "eventTriggers": ["booking.created", "booking.updated", "booking.cancelled"]
}

# Response
{
  "subscriptionId": "sub_abc123"
}
```

#### Available Webhook Events
- `BOOKING_CREATED` - New booking created
- `BOOKING_RESCHEDULED` - Booking rescheduled
- `BOOKING_CANCELLED` - Booking cancelled
- `MEETING_STARTED` - Meeting has started
- `MEETING_ENDED` - Meeting has ended

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
      "timeZone": "UTC",
      "noShow": false
    }
  ]
}
```

#### Webhook Signature Verification
```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Usage in API route
export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('x-cal-signature-256') ?? '';

  if (!verifyWebhookSignature(payload, signature, process.env.CAL_WEBHOOK_SECRET!)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(payload);
  // Process event...
}
```

### 5. Authentication and Identity Linking

#### API Authentication Methods

**V2 API (Recommended):**
```bash
# Bearer Token
curl -H "Authorization: Bearer cal_live_xxxxx" \
     -H "cal-api-version: 2024-08-13" \
     https://api.cal.com/v2/bookings

# OAuth Client Credentials
curl -H "x-cal-client-id: YOUR_CLIENT_ID" \
     -H "x-cal-secret-key: YOUR_CLIENT_SECRET" \
     https://api.cal.com/v2/bookings
```

#### Managed Users (Identity Linking)

Create managed users linked to your app's users:

```bash
POST https://api.cal.com/v2/managed-users
Content-Type: application/json
Authorization: Bearer cal_live_xxxxx

{
  "email": "user@example.com",
  "name": "User Name",
  "timeZone": "America/New_York"
}

# Response
{
  "status": "success",
  "data": {
    "user": {
      "id": 1458,
      "email": "user+managed@example.com",
      "username": "user-managed-example-com",
      "name": "User Name"
    },
    "accessToken": "eyJhbG...",
    "accessTokenExpiresAt": 1745490840000,
    "refreshToken": "eyJhbG...",
    "refreshTokenExpiresAt": 1776981600000
  }
}
```

**Token Refresh Flow:**
```typescript
// Your /api/cal/refresh endpoint
export async function POST(request: Request) {
  const { refreshToken } = await request.json();

  const response = await fetch('https://api.cal.com/v2/oauth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cal-client-id': process.env.CAL_CLIENT_ID!,
      'x-cal-secret-key': process.env.CAL_SECRET_KEY!,
    },
    body: JSON.stringify({ refreshToken }),
  });

  return response;
}
```

#### Store Tokens with User Profile
```typescript
// Example: Store Cal.com tokens in your user table
interface UserCalTokens {
  calUserId: number;
  calAccessToken: string;
  calAccessTokenExpiresAt: Date;
  calRefreshToken: string;
  calRefreshTokenExpiresAt: Date;
}

// Update when creating managed user or refreshing tokens
await db.user.update({
  where: { id: userId },
  data: {
    calUserId: managedUser.id,
    calAccessToken: tokens.accessToken,
    calAccessTokenExpiresAt: new Date(tokens.accessTokenExpiresAt),
    calRefreshToken: tokens.refreshToken,
    calRefreshTokenExpiresAt: new Date(tokens.refreshTokenExpiresAt),
  },
});
```

## Key Takeaways

- **Use @calcom/atoms** for React/Next.js - provides CalProvider, Booker, BookerEmbed components
- **CalProvider setup is required** at app root with clientId, accessToken, and API options
- **Customization via customClassNames** prop allows Tailwind-style overrides on embed components
- **V2 API uses Bearer auth** in Authorization header (not query params like V1)
- **Webhooks support HMAC-SHA256** signature verification via x-cal-signature-256 header
- **Managed users** link Cal.com accounts to your app users with access/refresh tokens
- **Store and refresh tokens** - accessToken expires ~1hr, refreshToken ~1yr

## Code Examples

### Complete Dashboard Widget Implementation

```typescript
// components/coaching/coaching-widget.tsx
'use client';

import { useState, useEffect } from 'react';
import { BookerEmbed } from '@calcom/atoms';

interface CoachingSession {
  id: string;
  uid: string;
  title: string;
  start: string;
  end: string;
  status: string;
  meetingUrl?: string;
}

interface CoachingWidgetProps {
  calUsername: string;
  eventSlug: string;
  accessToken: string;
}

export function CoachingWidget({ calUsername, eventSlug, accessToken }: CoachingWidgetProps) {
  const [upcomingSessions, setUpcomingSessions] = useState<CoachingSession[]>([]);
  const [showBooker, setShowBooker] = useState(false);

  useEffect(() => {
    async function fetchSessions() {
      const res = await fetch('/api/coaching/sessions');
      const data = await res.json();
      setUpcomingSessions(data.sessions);
    }
    fetchSessions();
  }, []);

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Coaching Sessions</h3>

      {upcomingSessions.length > 0 ? (
        <div className="space-y-3">
          {upcomingSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-muted rounded">
              <div>
                <p className="font-medium">{session.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(session.start).toLocaleDateString()} at{' '}
                  {new Date(session.start).toLocaleTimeString()}
                </p>
              </div>
              {session.meetingUrl && (
                <a href={session.meetingUrl} className="btn btn-primary btn-sm">
                  Join
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No upcoming sessions</p>
      )}

      <button
        onClick={() => setShowBooker(!showBooker)}
        className="mt-4 w-full btn btn-outline"
      >
        {showBooker ? 'Hide Calendar' : 'Book New Session'}
      </button>

      {showBooker && (
        <div className="mt-4">
          <BookerEmbed
            eventSlug={eventSlug}
            username={calUsername}
            view="WEEK_VIEW"
            onCreateBookingSuccess={() => {
              setShowBooker(false);
              // Refresh sessions list
            }}
            customClassNames={{
              bookerContainer: "border rounded-lg",
            }}
          />
        </div>
      )}
    </div>
  );
}
```

### Webhook Handler

```typescript
// app/api/webhooks/cal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function verifySignature(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.CAL_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('x-cal-signature-256') ?? '';

  if (!verifySignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(payload);

  switch (event.triggerEvent) {
    case 'BOOKING_CREATED':
      // Create activity log entry
      await createActivityLog({
        type: 'coaching_booked',
        userId: event.attendees[0]?.email,
        metadata: { bookingUid: event.uid, title: event.title },
      });
      break;

    case 'BOOKING_CANCELLED':
      // Update activity log
      await createActivityLog({
        type: 'coaching_cancelled',
        userId: event.attendees[0]?.email,
        metadata: { bookingUid: event.uid },
      });
      break;

    case 'MEETING_STARTED':
      // Track session start
      break;
  }

  return NextResponse.json({ status: 'OK' });
}
```

## Environment Variables

```env
# Cal.com Platform Configuration
CAL_OAUTH_CLIENT_ID=your-client-id
CAL_SECRET_KEY=your-secret-key
CAL_API_URL=https://api.cal.com/v2
CAL_WEBHOOK_SECRET=your-webhook-secret

# For embed script (if not using atoms)
NEXT_PUBLIC_CAL_EMBED_URL=https://cal.com
```

## Sources

- Cal.com via Context7 (calcom/cal.com)
- Documentation topics: embed, webhooks, api bookings, react, authentication, atoms provider, CalProvider setup
- Total tokens retrieved: ~12,000 across 7 queries
