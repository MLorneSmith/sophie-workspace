# Perplexity Research: Cal.com Integration Best Practices Post-Platform Deprecation

**Date**: 2026-01-28
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro)

## Query Summary

Researched current best practices for integrating Cal.com scheduling in a Next.js application after Cal.com Platform was deprecated in December 2025. Focused on:
1. @calcom/atoms usage without Platform OAuth
2. Simplest embed approach for single coach event type
3. V2 API for fetching bookings with API key (not OAuth)
4. Embed script vs React package comparison
5. Server-side API authentication methods

## Executive Summary

**Recommended Approach for SlideHeroes**: Use a hybrid strategy combining:
1. **Embed Script** for booking widget (simplest, most stable)
2. **V2 API with API Key** for fetching/managing bookings server-side

This avoids the deprecated Platform OAuth entirely while providing full functionality.

---

## Findings

### 1. Can @calcom/atoms Be Used Without Platform OAuth?

**Answer: No, not practically.**

The @calcom/atoms package requires Cal.com Platform OAuth credentials:
- Atoms require managed users created via OAuth client
- Each user needs access/refresh tokens from Platform OAuth flow
- A dedicated backend endpoint must handle token refresh
- This is the deprecated path - avoid for new implementations

**Recommendation**: Skip @calcom/atoms entirely. Use embed script + V2 API instead.

---

### 2. Simplest Approach for Embedding a Booking Widget

**Answer: Use the embed script with data-cal-link attribute.**

#### Option A: iframe Embed (Current Implementation - Simplest)

Your existing implementation is actually the simplest viable approach. The iframe approach has:

**Pros**: Zero dependencies, always up-to-date, no hydration issues
**Cons**: Limited styling control, no programmatic access to booking events

#### Option B: Inline Embed Script (More Control)

Load the Cal.com embed script dynamically in a useEffect and use data-cal-link attribute.

#### Option C: @calcom/embed-react (NOT Recommended for Next.js 15+)

**Issues**:
- React dispatcher errors during SSR in Next.js 15+
- Package not fully updated for React 19
- GitHub issues #15772, Next.js #71995 report rendering failures

**Recommendation**: Use Option A (iframe) for maximum simplicity or Option B (embed script) if you need more control.

---

### 3. Fetching Upcoming Bookings with V2 API (API Key Only)

**Answer: Yes, fully supported with Bearer token authentication.**

#### API Endpoint
GET https://api.cal.com/v2/bookings?status=accepted

#### Required Headers
Authorization: Bearer cal_<your_api_key>
cal-api-version: 2024-08-13

**Important**: The API key must be prefixed with cal_ (e.g., cal_abc123xyz).

#### Query Parameters for Filtering

| Parameter | Description | Example |
|-----------|-------------|---------|
| status | Filter by status (comma-separated) | accepted,pending |
| attendeeEmail | Filter by attendee email | user@example.com |
| eventTypeId | Filter by event type | 123 |

---

### 4. Is the Embed Script Still Best for Simple Use Cases?

**Answer: Yes, the embed script remains the recommended approach for simple booking widgets.**

#### Comparison Table

| Aspect | iframe | Embed Script | @calcom/embed-react | @calcom/atoms |
|--------|--------|--------------|---------------------|---------------|
| Setup Complexity | Trivial | Simple | Medium | Complex (deprecated) |
| Next.js 15+ Support | Excellent | Excellent | Buggy | N/A |
| Styling Control | None | Limited | Medium | Full |
| Dependencies | None | None | npm package | npm + OAuth |
| Maintenance | Zero | Zero | Package updates | Token refresh |

---

### 5. Recommended Authentication for Server-Side API Calls

**Answer: V2 API with Bearer token (API key prefixed with cal_).**

#### Key Points
- API key authenticates as the account owner (host perspective)
- Returns all bookings where you are the host
- No OAuth flow required - direct API access
- V2 API is the forward-compatible path

---

## Environment Variables Required

Add to your server environment configuration:
- NEXT_PUBLIC_CALCOM_COACH_USERNAME - Coach Cal.com username
- NEXT_PUBLIC_CALCOM_EVENT_SLUG - Event type slug (e.g., 60min)
- CALCOM_API_KEY - V2 API key (prefixed with cal_)

---

## Sources & Citations

1. Cal.com Platform Quickstart Documentation - https://cal.com/docs/platform/quickstart
2. Cal.com V2 API Documentation - https://cal.com/docs/api/v2
3. Cal.com Embed Documentation - https://cal.com/docs/core-features/embed
4. GitHub: Cal.com atoms-examples repository
5. GitHub Issues: #15772 (embed-react Next.js 15 compatibility)
6. Next.js GitHub Issues: #71995 (React hydration with Cal.com)

---

## Key Takeaways

1. Skip @calcom/atoms: Requires deprecated Platform OAuth
2. Use iframe or embed script: Both work reliably in Next.js 15+
3. V2 API with API key is the way forward: No OAuth needed
4. Required headers: Authorization: Bearer cal_<key>, cal-api-version: 2024-08-13
5. Your current iframe implementation is valid
