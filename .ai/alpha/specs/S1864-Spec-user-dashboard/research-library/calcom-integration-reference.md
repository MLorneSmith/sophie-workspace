# Cal.com Integration Reference

**Date**: 2026-01-28
**Status**: Approved
**Applies To**: S1864.I4 (Coaching Integration Initiative)

---

## Executive Summary

Cal.com deprecated their "Platform" offering on December 15, 2025. This affects the original S1864.I4 implementation plan which relied on `@calcom/atoms` with Platform OAuth credentials.

**Recommended Approach**: Use iframe embed for booking widget + V2 API with Bearer token for fetching bookings.

---

## Background

### What Was Deprecated

Cal.com Platform provided:
- OAuth client creation for managed users
- `@calcom/atoms` React components (CalProvider, Booker, BookerEmbed)
- Token-based authentication per user with refresh flow
- Managed user creation API

**As of December 2025**: New signups for Platform plans are halted. Existing Platform customers continue to receive support, but this is not viable for new implementations.

### Impact on S1864.I4

The original Context7 research (`context7-calcom.md`) recommended:
- ❌ `@calcom/atoms` with CalProvider setup
- ❌ OAuth client credentials (CAL_OAUTH_CLIENT_ID, CAL_SECRET_KEY)
- ❌ Managed users with access/refresh tokens
- ❌ Token refresh endpoint (/api/cal/refresh)

**These approaches are no longer available for new implementations.**

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Coaching Integration                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Upcoming Sessions Widget                                │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ Server Component                                 │    │    │
│  │  │  - Calls V2 API via server action                │    │    │
│  │  │  - Auth: Bearer token (CALCOM_API_KEY)           │    │    │
│  │  │  - Returns host's upcoming bookings              │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │                          ↓                               │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ Client Component                                 │    │    │
│  │  │  - Displays sessions with join/reschedule links  │    │    │
│  │  │  - Empty state with "Book Session" CTA           │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Booking Widget                                          │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ iframe Embed (Existing Pattern)                  │    │    │
│  │  │  - src: cal.com/{username}/{event-slug}          │    │    │
│  │  │  - Zero dependencies                             │    │    │
│  │  │  - Always up-to-date with Cal.com UI             │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Webhook Handler (Optional - for Activity Feed)          │    │
│  │  - BOOKING_CREATED → activity_log entry                  │    │
│  │  - BOOKING_CANCELLED → activity_log entry                │    │
│  │  - Auth: HMAC-SHA256 signature verification              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

### Required Variables (Already Configured)

| Variable | Description | Used For |
|----------|-------------|----------|
| `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | Coach's Cal.com username | Embed URL construction |
| `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | Event type slug (e.g., "60min") | Embed URL construction |
| `CALCOM_API_KEY` | V2 API key (prefixed with `cal_`) | Server-side API calls |

### Optional Variables

| Variable | Description | Used For |
|----------|-------------|----------|
| `CAL_WEBHOOK_SECRET` | Webhook signature secret | Activity feed integration |

### Removed Variables (No Longer Needed)

| Variable | Reason |
|----------|--------|
| ~~CAL_OAUTH_CLIENT_ID~~ | Platform OAuth deprecated |
| ~~CAL_SECRET_KEY~~ | Platform OAuth deprecated |
| ~~CAL_API_URL~~ | Always use https://api.cal.com/v2 |

---

## API Reference

### Fetch Upcoming Bookings

**Endpoint**: `GET https://api.cal.com/v2/bookings`

**Headers**:
```http
Authorization: Bearer cal_your_api_key_here
cal-api-version: 2024-08-13
Content-Type: application/json
```

**Query Parameters**:
| Parameter | Description | Example |
|-----------|-------------|---------|
| `status` | Filter by status | `accepted`, `pending`, `cancelled` |
| `attendeeEmail` | Filter by attendee | `user@example.com` |
| `eventTypeId` | Filter by event type | `123` |

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": 456,
      "uid": "bk_abc123xyz",
      "title": "60min Coaching Session",
      "hosts": [{ "id": 1, "name": "Coach Name", "email": "coach@example.com" }],
      "status": "accepted",
      "start": "2026-01-30T10:00:00.000Z",
      "end": "2026-01-30T11:00:00.000Z",
      "attendees": [{ "name": "John Doe", "email": "john@example.com" }],
      "meetingUrl": "https://zoom.us/j/123456789"
    }
  ]
}
```

### Reschedule URL Pattern

To reschedule a booking, link to:
```
https://cal.com/{username}/{event-slug}?rescheduleUid={booking_uid}
```

### Cancel URL Pattern

To cancel a booking, link to:
```
https://cal.com/booking/{booking_uid}?cancel=true
```

---

## Implementation Patterns

### Server Action: Fetch Bookings

```typescript
// apps/web/app/home/(user)/coaching/_lib/server/coaching-server-actions.ts
'use server';
import 'server-only';

import { z } from 'zod';

const CalComBookingSchema = z.object({
  id: z.number(),
  uid: z.string(),
  title: z.string(),
  status: z.string(),
  start: z.string(),
  end: z.string(),
  meetingUrl: z.string().nullable(),
  attendees: z.array(z.object({
    name: z.string(),
    email: z.string(),
  })),
});

export async function getUpcomingCoachingSessions() {
  const apiKey = process.env.CALCOM_API_KEY;

  if (!apiKey) {
    console.warn('CALCOM_API_KEY not configured');
    return [];
  }

  try {
    const response = await fetch(
      'https://api.cal.com/v2/bookings?status=accepted',
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'cal-api-version': '2024-08-13',
        },
        next: { revalidate: 60 }, // Cache for 1 minute
      }
    );

    if (!response.ok) {
      console.error('Cal.com API error:', response.status);
      return [];
    }

    const data = await response.json();

    // Filter for future bookings only
    const now = new Date();
    return data.data
      .filter((booking: { start: string }) => new Date(booking.start) > now)
      .sort((a: { start: string }, b: { start: string }) =>
        new Date(a.start).getTime() - new Date(b.start).getTime()
      );
  } catch (error) {
    console.error('Failed to fetch coaching sessions:', error);
    return [];
  }
}
```

### Booking Widget (iframe)

```typescript
// apps/web/app/home/(user)/coaching/_components/booking-embed.tsx
'use client';

interface BookingEmbedProps {
  layout?: 'month_view' | 'week_view' | 'column_view';
  className?: string;
}

export function BookingEmbed({
  layout = 'month_view',
  className = ''
}: BookingEmbedProps) {
  const username = process.env.NEXT_PUBLIC_CALCOM_COACH_USERNAME;
  const eventSlug = process.env.NEXT_PUBLIC_CALCOM_EVENT_SLUG;

  const embedUrl = `https://cal.com/${username}/${eventSlug}?embed=true&layout=${layout}`;

  return (
    <iframe
      title="Book a Coaching Session"
      src={embedUrl}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '600px',
        border: 'none',
        borderRadius: '8px',
      }}
      loading="lazy"
      allowFullScreen
    />
  );
}
```

### Webhook Handler (Optional)

```typescript
// apps/web/app/api/webhooks/cal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
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
      // Log to activity feed
      break;
    case 'BOOKING_CANCELLED':
      // Log to activity feed
      break;
  }

  return NextResponse.json({ status: 'OK' });
}
```

---

## Feature Updates

### F1: Cal.com Foundation (Simplified)

**Original Scope** (from feature.md):
- ❌ CalProvider setup with OAuth → Not needed
- ❌ Token refresh endpoint → Not needed
- ✅ TypeScript types for booking data → Keep
- ✅ Environment variable validation → Keep (simplify schema)
- ✅ API client service → Keep (use Bearer auth)
- ✅ Webhook signature verification → Keep (for activity feed)

### F2: Dashboard Widget (Minor Updates)

- Server action fetches via V2 API (no token management)
- Display logic unchanged
- Empty state unchanged

### F3: Session Actions (No Change)

- Reschedule link: `cal.com/{username}/{event}?rescheduleUid={uid}`
- Join meeting: use `meetingUrl` from API response
- Cancel link: `cal.com/booking/{uid}?cancel=true`

### F4: Booking Modal (Simplified)

- Use iframe embed (existing pattern) inside modal
- No @calcom/atoms dependency
- No CalProvider setup

---

## Comparison: Old vs New Approach

| Aspect | Old (Platform OAuth) | New (API Key + iframe) |
|--------|---------------------|------------------------|
| **Dependencies** | @calcom/atoms, CalProvider | None (iframe) |
| **Auth Complexity** | OAuth flow, token refresh | Simple API key |
| **Maintenance** | Token rotation, refresh endpoints | Zero |
| **User Linking** | Managed users per user | N/A (host-perspective) |
| **Booking Display** | Atoms components | Custom UI + API data |
| **Booking Creation** | BookerEmbed component | iframe embed |
| **Styling Control** | Full (customClassNames) | Limited (iframe) |
| **Stability** | Dependent on package updates | Always works |

---

## Sources

1. **Cal.com API V2 Documentation**: https://cal.com/docs/api-reference/v2/introduction
2. **Cal.com Platform Deprecation Notice**: "As of 15th December 2025, we're currently undergoing a restructuring of our 'Platform'-offering."
3. **Perplexity Research Report**: `.ai/reports/research-reports/2026-01-28/perplexity-calcom-nextjs-integration-post-platform.md`
4. **Original Context7 Research**: `context7-calcom.md` (outdated - references Platform OAuth)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-28 | Skip @calcom/atoms | Requires deprecated Platform OAuth |
| 2026-01-28 | Use iframe for embed | Zero deps, always works, existing pattern |
| 2026-01-28 | Use V2 API with Bearer auth | Simple, works with existing API key |
| 2026-01-28 | Keep webhook handler | Useful for activity feed integration |
