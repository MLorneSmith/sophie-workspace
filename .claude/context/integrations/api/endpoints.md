---
id: "api-endpoints"
title: "API Endpoints and Server Actions Reference"
version: "3.0.0"
category: "api"
description: "Streamlined SlideHeroes API and server actions reference"
tags: ["api", "endpoints", "server-actions", "makerkit"]
dependencies: ["authentication-patterns", "api-patterns"]
cross_references:
  - id: "api-patterns"
    type: "related"
    description: "Detailed implementation patterns and examples"
  - id: "authentication-patterns"
    type: "prerequisite"
    description: "Authentication flow documentation"
created: "2025-09-12"
last_updated: "2025-09-12"
---

# API Endpoints and Server Actions Reference

## Overview

SlideHeroes uses Next.js App Router with server actions (via `enhanceAction`) and minimal API routes. Built on MakerKit SaaS template with Supabase.

> **Note**: For detailed implementation examples and patterns, see [[api-patterns]]

## Core Patterns

### Server Action Pattern
```typescript
import { enhanceAction } from "@kit/next/actions";
export const action = enhanceAction(
  async (data, user) => { /* implementation */ },
  { schema: ZodSchema, auth: true, captcha: false }
);
```

### Authentication Clients
- **Client**: `createBrowserClient` from `@kit/supabase/browser-client`
- **Server**: `getSupabaseServerClient` from `@kit/supabase/server-client`
- **Admin**: `getSupabaseServerAdminClient` from `@kit/supabase/server-admin-client`

## API Routes (Minimal)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/health` | GET | None | Health check |
| `/api/billing/webhook` | POST | Signature | Stripe/Lemon webhooks |
| `/api/db/webhook` | POST | Signature | Supabase webhooks |
| `/api/ai-usage/session-cost` | POST | Bearer | AI usage tracking |
| `/api/courses/[id]/lessons` | GET | Bearer | Course lessons |
| `/api/graphql` | POST | Bearer | GraphQL queries |

## Server Actions Directory

### Contact & Marketing
| Action | Location | Auth | Purpose |
|--------|----------|------|---------|
| `sendContactEmail` | `app/(marketing)/contact/_lib/server/` | No | Contact form |

### Team Management 
| Action | Location | Auth | Purpose |
|--------|----------|------|---------|
| `createTeamAccountAction` | `packages/features/team-accounts/` | Yes | Create team |
| `*InvitationAction` | `.../team-invitations-server-actions` | Yes | Invites |
| `*MemberAction` | `.../team-members-server-actions` | Yes | Members |

### Billing
| Action | Location | Auth | Purpose |
|--------|----------|------|---------|
| `createPersonalAccountCheckoutSession` | `app/home/(user)/billing/_lib/server/` | Yes | Checkout |
| `createPersonalAccountBillingPortalSession` | Same | Yes | Portal |

### Course System
| Action | Location | Auth | Purpose |
|--------|----------|------|---------|
| `updateCourseProgressAction` | `app/home/(user)/course/_lib/server/` | Yes | Progress + cert |
| `updateLessonProgressAction` | Same | Yes | Lesson tracking |
| `submitQuizAttemptAction` | Same | Yes | Quiz submission |

### AI Canvas
| Action | Location | Auth | Purpose |
|--------|----------|------|---------|
| `generateOutlineAction` | `app/home/(user)/ai/canvas/_actions/` | Yes | Generate outline |
| `simplifyTextAction` | Same | Yes | Simplify text |
| `generateIdeasAction` | Same | Yes | Generate ideas |
| `getOutlineSuggestionsAction` | Same | Yes | Suggestions |

### Admin
| Action | Location | Auth | Purpose |
|--------|----------|------|---------|
| Admin actions | `packages/features/admin/` | Admin | User mgmt |
| `fetchUsageDataAction` | `app/home/(user)/admin/ai-usage/` | Admin | AI analytics |

## Security Configuration

### Authentication
- Default: `auth: true` on all server actions
- Admin actions require `admin:panel` permission
- Public actions need `auth: false` + optional `captcha: true`

### Validation
All actions use Zod schemas. Example:
```typescript
const Schema = z.object({
  field: z.string().min(1).max(100)
});
```

### Rate Limits
- **Public**: 100 req/min/IP
- **Authenticated**: 1000 req/hr/user
- **Admin**: 5000 req/hr/user
- **AI**: Based on subscription
- **Webhooks**: No limit (signature required)

## Error Handling

### Format
```typescript
{ error: true, message?: string, code?: string, details?: any }
```

### Common Codes
`validation_failed`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `rate_limit_exceeded`, `internal_error`, `invalid_credentials`

## Database Patterns

```typescript
// User context
const client = getSupabaseServerClient();
// Admin bypass RLS
const admin = getSupabaseServerAdminClient();
```

## Common Patterns

### Redirect After Action
```typescript
redirect(`/success?id=${result.id}`);
```

### Revalidation
```typescript
revalidatePath('/home/[account]', 'layout');
```

### Pagination
Standard params: `page`, `limit`, `cursor`, `orderBy`, `order`

## Environment Variables

```bash
# Core
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Billing
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# AI
OPENAI_API_KEY=
PORTKEY_API_KEY=

# Contact
CONTACT_EMAIL=
```

## Architecture Notes

- **Prefer server actions** over API routes
- **API routes only for**: webhooks, health checks, file ops, 3rd party integrations
- **All actions use** `enhanceAction` wrapper
- **RLS enforced** unless using admin client

## See Also

- [[api-patterns]] - Detailed implementation patterns
- [[authentication-patterns]] - Auth flows
- [[service-patterns]] - Service architecture