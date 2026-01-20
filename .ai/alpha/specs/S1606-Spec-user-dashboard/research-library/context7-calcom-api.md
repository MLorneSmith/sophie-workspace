# Context7 Research: Cal.com API Integration

**Date**: 2026-01-20
**Agent**: alpha-context7
**Spec Directory**: /home/msmith/projects/2025slideheroes/.ai/alpha/specs/pending-Spec-user-dashboard
**Libraries Researched**: calcom/cal.com

## Query Summary

Researched Cal.com API v2 integration for fetching upcoming bookings/sessions, including:
1. API v2 endpoints for listing bookings
2. Authentication methods (API key vs OAuth)
3. Webhook events for booking lifecycle
4. Required API scopes for reading user bookings
5. Rate limits and caching recommendations

## Findings

### 1. Cal.com API v2 Endpoints for Listing Bookings

The Cal.com API v2 provides comprehensive endpoints for managing bookings.

#### List All Bookings

```bash
GET /v2/bookings
```

**Query Parameters:**
- `cal-api-version` (required): API version string (e.g., "2024-08-13")
- `status` (optional): Filter by status ("upcoming", "past")
- `limit` (optional): Max bookings to return (default ~10)
- `cursor` (optional): Pagination cursor
- `afterStart` (optional): Filter bookings starting after ISO 8601 timestamp
- `beforeEnd` (optional): Filter bookings ending before ISO 8601 timestamp
- `eventTypeIds` (optional): Comma-separated list of event type IDs

**Example Request:**
```bash
# List upcoming bookings with pagination
curl -X GET "https://api.cal.com/v2/bookings?status=upcoming&limit=20" \
  -H "cal-api-version: 2024-08-13" \
  -H "Authorization: Bearer cal_live_***"

# Filter by date range and event type
curl -X GET "https://api.cal.com/v2/bookings?afterStart=2024-01-01T00:00:00Z&beforeEnd=2024-01-31T23:59:59Z&eventTypeIds=123,456" \
  -H "cal-api-version: 2024-08-13" \
  -H "Authorization: Bearer cal_live_***"
```

**Response Structure:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 456,
      "uid": "bk_abc123xyz",
      "title": "30 Min Meeting",
      "status": "accepted",
      "start": "2024-01-15T10:00:00.000Z",
      "end": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "nextCursor": 120,
    "prevCursor": 80,
    "totalItems": 123,
    "currentPage": 2,
    "totalPages": 13,
    "hasNextPage": true
  }
}
```

#### Get Single Booking

```bash
GET /v2/bookings/{uid}
```

**Response includes:**
- `id`: Booking internal ID
- `uid`: Unique booking identifier
- `title`: Event title
- `hosts`: Array of host objects (id, name, email)
- `status`: Booking status ("accepted", etc.)
- `start`/`end`: ISO 8601 timestamps
- `attendees`: Array of attendee objects
- `meetingUrl`: Video meeting URL
- `duration`: Meeting duration in minutes
- `eventTypeId`: Associated event type

#### Additional Booking Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v2/bookings` | POST | Create new booking |
| `/v2/bookings/{uid}/confirm` | POST | Confirm pending booking |
| `/v2/bookings/{uid}/decline` | POST | Decline booking request |
| `/v2/bookings/{uid}/mark-absent` | POST | Mark as no-show |
| `/v2/bookings/{uid}/reassign` | POST | Reassign to different host |
| `/v2/bookings/{uid}/guests` | POST | Add guests to booking |
| `/v2/bookings/{uid}/calendar-links` | GET | Get "Add to Calendar" links |
| `/v2/bookings/{uid}/transcripts` | GET | Get Cal Video transcripts |

### 2. Authentication Methods

Cal.com API v2 supports two primary authentication methods:

#### Method 1: Bearer Token (Recommended for User Access)

```bash
curl -X GET "https://api.cal.com/v2/bookings" \
  -H "Authorization: Bearer cal_live_xxxxxx" \
  -H "cal-api-version: 2024-08-13"
```

**API Key Types:**
- Test mode: Keys start with `cal_test_`
- Live mode: Keys start with `cal_live_`

**Key Management:**
- API keys can have expiration dates (default 30 days)
- Keys can be set to never expire with `apiKeyNeverExpires: true`
- Refresh keys via `POST /v2/api-keys/refresh`

#### Method 2: OAuth Client Credentials (For Platform/Organization Access)

```bash
curl -X GET "https://api.cal.com/v2/bookings" \
  -H "x-cal-client-id: YOUR_CLIENT_ID" \
  -H "x-cal-secret-key: YOUR_CLIENT_SECRET" \
  -H "cal-api-version: 2024-08-13"
```

**OAuth Token Management:**
- Access tokens valid for 60 minutes
- Refresh tokens valid for 1 year
- Refresh via `POST /v2/oauth/refresh`

```json
// Refresh request
{
  "refreshToken": "your_refresh_token"
}

// Response
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

#### V1 vs V2 Authentication Comparison

| Aspect | V1 (Deprecated) | V2 (Current) |
|--------|-----------------|--------------|
| API Key Location | Query parameter | Authorization header |
| Format | `?apiKey=cal_xxx` | `Bearer cal_xxx` |
| Version Header | Not required | Required: `cal-api-version` |
| Deprecation | Feb 15, 2026 | Current |

### 3. Webhook Events

Cal.com provides webhooks for real-time booking notifications.

#### Available Webhook Trigger Events

```typescript
enum WebhookTriggerEvents {
  BOOKING_CREATED = "BOOKING_CREATED"
  BOOKING_RESCHEDULED = "BOOKING_RESCHEDULED"
  BOOKING_CANCELLED = "BOOKING_CANCELLED"
  BOOKING_CONFIRMED = "BOOKING_CONFIRMED"
  BOOKING_REJECTED = "BOOKING_REJECTED"
  BOOKING_NO_SHOW_UPDATED = "BOOKING_NO_SHOW_UPDATED"
  FORM_SUBMITTED = "FORM_SUBMITTED"
  MEETING_ENDED = "MEETING_ENDED"
  MEETING_STARTED = "MEETING_STARTED"
  RECORDING_READY = "RECORDING_READY"
  RECORDING_TRANSCRIPTION_GENERATED = "RECORDING_TRANSCRIPTION_GENERATED"
  INSTANT_MEETING_CREATED = "INSTANT_MEETING_CREATED"
}
```

#### Webhook Payload Structure (BOOKING_CREATED Example)

```json
{
  "triggerEvent": "BOOKING_CREATED",
  "createdAt": "2024-01-15T09:00:00.000Z",
  "payload": {
    "type": "30 Min Meeting",
    "title": "30 Min Meeting between Alice Smith and John Doe",
    "description": "Discussion about project",
    "customInputs": {},
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T10:30:00.000Z",
    "organizer": {
      "id": 1,
      "name": "Alice Smith",
      "email": "alice@example.com",
      "timeZone": "America/Los_Angeles",
      "language": { "locale": "en" },
      "utcOffset": -480
    },
    "attendees": [
      {
        "email": "john@example.com",
        "name": "John Doe",
        "timeZone": "America/New_York",
        "language": { "locale": "en" },
        "utcOffset": -300
      }
    ],
    "location": "https://zoom.us/j/123456789",
    "uid": "bk_abc123xyz",
    "bookingId": 456,
    "eventTypeId": 123,
    "status": "ACCEPTED",
    "metadata": {
      "videoCallUrl": "https://zoom.us/j/123456789"
    }
  }
}
```

#### Webhook Subscriber Interface

```typescript
interface WebhookSubscriber {
  id: string
  subscriberUrl: string
  eventTriggers: WebhookTriggerEvents[]
  appId: string | null
  payloadTemplate: string | null
  secret: string | null
}
```

#### Subscribing to Webhooks (via Zapier Integration)

```bash
POST /api/integrations/zapier/addSubscription?apiKey=cal_xxx

{
  "webhookUrl": "https://your-app.com/webhook",
  "eventTriggers": ["BOOKING_CREATED", "BOOKING_CANCELLED", "BOOKING_RESCHEDULED"]
}
```

### 4. Required API Scopes

For reading user bookings, the following access is needed:

**Personal API Key:**
- Generated from Cal.com settings
- Automatically grants access to user's own bookings
- No explicit scopes required for personal data

**OAuth Client (Platform/Organization):**
- Use `permissions: ["*"]` for full access
- Or specify granular permissions for booking read access
- OAuth clients created via `POST /v2/oauth-clients`

**Managed Organization Access:**
- Requires OAuth client credentials
- Each managed org gets its own API key
- Keys can be refreshed programmatically

### 5. Rate Limits and Caching Recommendations

#### Rate Limit Headers

All API responses include rate limit information:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Max requests in current window |
| `X-RateLimit-Remaining` | Requests remaining |
| `X-RateLimit-Reset` | UTC epoch seconds when window resets |

#### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "too_many_requests",
    "message": "Rate limit exceeded"
  }
}
```

HTTP Status: `429 Too Many Requests`

#### Caching Recommendations

1. **Cache booking lists**: Bookings don't change frequently; cache for 5-15 minutes
2. **Use pagination**: Fetch only needed data with `limit` parameter
3. **Filter server-side**: Use `status=upcoming` and date filters to reduce payload
4. **Implement exponential backoff**: On 429 errors, wait and retry
5. **Use webhooks for updates**: Subscribe to booking events instead of polling
6. **Store booking UIDs**: Cache individual bookings by UID for quick lookups

#### Recommended Integration Pattern

```typescript
// Pseudocode for optimal Cal.com integration
async function getUpcomingBookings(userId: string) {
  // Check cache first (5 min TTL)
  const cached = await cache.get(`calcom:bookings:${userId}`);
  if (cached) return cached;

  // Fetch from Cal.com API
  const response = await fetch('https://api.cal.com/v2/bookings', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'cal-api-version': '2024-08-13'
    },
    params: {
      status: 'upcoming',
      limit: 10,
      afterStart: new Date().toISOString()
    }
  });

  // Handle rate limiting
  if (response.status === 429) {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    // Implement backoff strategy
  }

  const data = await response.json();

  // Cache results
  await cache.set(`calcom:bookings:${userId}`, data, { ttl: 300 });

  return data;
}
```

## Key Takeaways

- **Use API v2**: V1 is deprecated and will be discontinued Feb 15, 2026
- **Bearer token auth**: Use `Authorization: Bearer cal_xxx` header (not query params)
- **Version header required**: Always include `cal-api-version: 2024-08-13`
- **Pagination built-in**: Use `limit`, `cursor`, and filter parameters
- **Rich webhook support**: Subscribe to BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED for real-time updates
- **Rate limits apply**: Monitor headers and implement caching/backoff strategies
- **OAuth for platforms**: Use OAuth client credentials for multi-tenant/organization access

## Code Examples

### TypeScript: Fetch Upcoming Sessions

```typescript
import type { CalcomBooking, CalcomResponse } from './types';

const CALCOM_API_BASE = 'https://api.cal.com/v2';
const API_VERSION = '2024-08-13';

interface FetchBookingsOptions {
  apiKey: string;
  status?: 'upcoming' | 'past';
  limit?: number;
  afterStart?: string;
}

async function fetchUpcomingBookings(options: FetchBookingsOptions): Promise<CalcomBooking[]> {
  const { apiKey, status = 'upcoming', limit = 10, afterStart } = options;

  const params = new URLSearchParams({
    status,
    limit: String(limit),
    ...(afterStart && { afterStart })
  });

  const response = await fetch(`${CALCOM_API_BASE}/bookings?${params}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'cal-api-version': API_VERSION,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 429) {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      throw new Error(`Rate limited. Reset at: ${resetTime}`);
    }
    throw new Error(`Cal.com API error: ${response.status}`);
  }

  const result: CalcomResponse = await response.json();
  return result.data;
}
```

### Webhook Handler (Next.js Server Action)

```typescript
'use server';

import { z } from 'zod';

const WebhookPayloadSchema = z.object({
  triggerEvent: z.enum([
    'BOOKING_CREATED',
    'BOOKING_CANCELLED',
    'BOOKING_RESCHEDULED'
  ]),
  createdAt: z.string(),
  payload: z.object({
    uid: z.string(),
    title: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    status: z.string(),
    organizer: z.object({
      email: z.string(),
      name: z.string()
    }),
    attendees: z.array(z.object({
      email: z.string(),
      name: z.string()
    }))
  })
});

export async function handleCalcomWebhook(request: Request) {
  const body = await request.json();
  const parsed = WebhookPayloadSchema.parse(body);

  switch (parsed.triggerEvent) {
    case 'BOOKING_CREATED':
      // Handle new booking
      await notifyUser(parsed.payload);
      break;
    case 'BOOKING_CANCELLED':
      // Handle cancellation
      await removeFromCalendar(parsed.payload.uid);
      break;
    case 'BOOKING_RESCHEDULED':
      // Handle reschedule
      await updateCalendarEvent(parsed.payload);
      break;
  }

  return { status: 'OK' };
}
```

## Sources

- Cal.com via Context7 (calcom/cal.com)
- API Reference: https://cal.com/docs/api-reference/v2
- Migration Guide: https://github.com/calcom/cal.com/blob/main/docs/api-reference/v2/migration-guide.mdx
- Webhooks Documentation: https://github.com/calcom/cal.com/blob/main/docs/developing/guides/automation/webhooks.mdx
