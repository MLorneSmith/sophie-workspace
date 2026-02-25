# SOP: Loops Integration in SlideHeroes

**Created:** 2026-02-20
**Status:** Active
**Scope:** How Loops is integrated into the 2025slideheroes app

---

## Overview

Loops (loops.so) is our email automation platform, replacing ActiveCampaign. It handles transactional emails, event-based automation, and audience management.

## Architecture

### Package: `@kit/loops`

**Location:** `packages/loops/`
**SDK:** `loops` npm package (v6.2.0)
**Auth:** `LOOPS_API_KEY` env var (validated via Zod at import time)

The integration is a standalone workspace package following the Makerkit `@kit/*` convention.

### Key Files

| File | Purpose |
|------|---------|
| `packages/loops/src/client.ts` | Singleton `LoopsClient` factory (lazy init) |
| `packages/loops/src/loops.service.ts` | `LoopsService` class with `sendTransactionalEmail()` and `sendEvent()` |
| `packages/loops/src/schemas/loops.schema.ts` | Zod schemas for input validation |
| `packages/loops/src/types.ts` | TypeScript types derived from schemas |
| `packages/loops/src/index.ts` | Public exports |
| `apps/web/app/onboarding/_lib/server/loops-events.ts` | App-level event definitions |
| `apps/web/app/onboarding/_lib/server/server-actions.ts` | Onboarding server action that fires events |

### Service API

```typescript
import { createLoopsService } from "@kit/loops";

const loopsService = createLoopsService();

// Send transactional email
await loopsService.sendTransactionalEmail({
  transactionalId: "welcome-email",   // Loops template ID
  email: "user@example.com",
  addToAudience: true,                // optional
  dataVariables: { firstName: "John" } // optional template vars
});

// Send event (triggers Loops automations)
await loopsService.sendEvent({
  eventName: "userSignedUp",
  email: "user@example.com",     // email OR userId required
  userId: "uuid-here",           // email OR userId required
  contactProperties: { firstName: "John" }, // updates contact record
  eventProperties: { plan: "pro" }          // event-specific data
});
```

### Current Events Fired

| Event | Trigger Point | Contact Properties | Notes |
|-------|--------------|-------------------|-------|
| `userSignedUp` | Onboarding completion | `firstName` | Fire-and-forget (void), non-blocking |

### Error Handling

- All calls are wrapped in try/catch with structured logging (`@kit/shared/logger`)
- Errors return `{ success: false, error: string }` — never throw
- Onboarding event is fire-and-forget (`void` prefix) to avoid blocking the user flow

### Environment

```bash
# .env.local
LOOPS_API_KEY=your_loops_api_key_here
```

The API key is validated at module import time via Zod. If missing/empty, the app will fail to start (which is correct — fail fast).

### Testing

Full unit test suite in `packages/loops/src/__tests__/`:
- `loops.schema.test.ts` — Schema validation (valid/invalid inputs)
- `loops.service.test.ts` — Service methods with mocked LoopsClient (success, failure, validation errors, API errors)

All tests mock `server-only`, `@kit/shared/logger`, and the `loops` SDK.

---

## What's NOT Implemented Yet

See "Gaps" section in the audit performed 2026-02-20.

---

## Loops API Capabilities (Reference)

| Capability | API Endpoint | Status in Our App |
|-----------|-------------|-------------------|
| Create/update contacts | `POST /contacts/create`, `PUT /contacts/update` | ❌ Not used (contacts created implicitly via events) |
| Send events | `POST /events/send` | ✅ Via `sendEvent()` |
| Send transactional email | `POST /transactional` | ✅ Via `sendTransactionalEmail()` |
| Webhooks (outbound) | Settings → Webhooks | ❌ Not configured |
| Contact properties | Via events or API | ⚠️ Only `firstName` sent currently |

## Loops Webhook Events Available

Loops can push these events to our endpoint:
- **Contact:** `contact.created`, `contact.updated`, `contact.deleted`
- **Email:** `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`, `email.unsubscribed`
- **Loop:** (automation triggers)

These are critical for the BigQuery data ecosystem — they provide email engagement data.
