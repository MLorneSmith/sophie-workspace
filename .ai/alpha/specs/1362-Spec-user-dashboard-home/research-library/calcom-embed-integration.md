# Context7 Research: Cal.com Embed SDK for Next.js Integration

**Date**: 2025-12-31
**Agent**: alpha-context7
**Spec Directory**: .ai/alpha/specs/pending-Spec-user-dashboard-home
**Libraries Researched**: calcom/cal.com

## Query Summary

Researched Cal.com embed SDK documentation for Next.js integration, focusing on:
1. Embedding scheduling widgets in React/Next.js
2. Inline vs modal embed options
3. Displaying upcoming scheduled events via API
4. Authentication and account linking
5. Reschedule functionality

## Findings

### 1. Cal.com Embedding Options

Cal.com provides three main embedding methods for React/Next.js applications:

#### Option A: Vanilla JavaScript Embed (Recommended for Simplicity)

The embed-core package provides a lightweight JavaScript-based approach.

**Inline Embed**:
```javascript
Cal("inline", {
  elementOrSelector: "#my-cal-inline",
  calLink: "username/30min",
  config: { theme: "light" }
});
```

**Modal Embed** (for "Book Coaching Session" button):
```javascript
Cal("modal", {
  calLink: "username/coaching-session",
  config: { theme: "dark" }
});
```

**Floating Action Button**:
```typescript
Cal.floatingButton({
  calLink: "organization/event-type",
  buttonText: "Book meeting",
  buttonPosition: "bottom-right"
});
```

#### Option B: React Atoms Package (@calcom/atoms)

**BookerEmbed Component**:
```javascript
import { BookerEmbed } from "@calcom/atoms";

export default function BookingPage(props) {
  return (
    <BookerEmbed
      eventSlug="coaching-session"
      username="coach-username"
      view="WEEK_VIEW"
      onCreateBookingSuccess={() => console.log("Booking created!")}
      defaultFormValues={{ name: "Name", email: "email@example.com" }}
    />
  );
}
```

### 2. Inline vs Modal Embed Comparison

| Feature | Inline Embed | Modal Embed |
|---------|--------------|-------------|
| Use Case | Dedicated booking page | Button trigger on any page |
| UX | Full page/section integration | Overlay popup |
| Best For | Booking landing pages | Dashboard "Book Session" buttons |

### 3. Displaying Upcoming Scheduled Events

Use the Cal.com API v2:

**List Bookings API**:
```
GET /v2/bookings?status=upcoming&limit=2
Authorization: Bearer cal_live_xxxxxx
cal-api-version: 2024-08-13
```

**Response Structure**:
```json
{
  "status": "success",
  "data": [{
    "id": 456,
    "uid": "bk_abc123xyz",
    "title": "Coaching Session",
    "status": "accepted",
    "start": "2024-01-15T10:00:00.000Z",
    "end": "2024-01-15T10:30:00.000Z"
  }]
}
```

### 4. Authentication

Use API key server-side only via server actions. Never expose API keys client-side.

### 5. Reschedule Functionality

**Reschedule with React BookerEmbed**:
```javascript
<BookerEmbed
  eventSlug={eventSlug}
  username={username}
  rescheduleUid={rescheduleUid}
  onCreateBookingSuccess={() => console.log("Rescheduled!")}
/>
```

## Key Takeaways

1. For "Book Coaching Session" button: Use vanilla JS modal embed
2. For displaying upcoming sessions: Use Cal.com API v2 with server actions
3. For reschedule: Pass rescheduleUid (booking UID) to modal embed
4. Authentication: Use API key server-side only
5. Custom styling: Both approaches support theme and custom class names

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| GET /v2/bookings | GET | List upcoming bookings |
| GET /v2/bookings/{uid} | GET | Get single booking details |
| POST /v2/bookings | POST | Create new booking |

## Sources

- Cal.com Embed Core Documentation via Context7 (calcom/cal.com)
- Cal.com Platform Atoms Documentation via Context7 (calcom/cal.com)
- Cal.com API v2 Migration Guide via Context7 (calcom/cal.com)
