---
# Identity
id: "auth-overview"
title: "Authentication System Overview"
version: "3.0.0"
category: "implementation"

# Discovery
description: "MakerKit authentication overview using Supabase Auth with team-based RBAC"
tags: ["authentication", "supabase", "rbac", "mfa", "server-actions"]

# Relationships
dependencies: ["supabase-client", "server-actions", "team-accounts"]
cross_references:
  - id: "auth-implementation"
    type: "related"
    description: "Detailed code examples and patterns"
  - id: "auth-troubleshooting"
    type: "related"
    description: "Common issues and solutions"
  - id: "auth-configuration"
    type: "related"
    description: "Environment variables and setup"

# Maintenance
created: "2025-01-09"
last_updated: "2025-09-13"
author: "create-context"
---

# Authentication Overview

## Core Architecture

The SlideHeroes platform uses **Supabase Auth** as the authentication provider with:
- JWT-based sessions stored in secure HTTP-only cookies
- Team-based RBAC via `accounts_memberships` table with hierarchical roles
- Server actions wrapped with `enhanceAction` for consistent auth/validation
- Row-level security (RLS) enforcement at database level
- Multiple authentication methods (OAuth, email/password, magic links, MFA)

**Security Note**: Always use `getClaims()` instead of `getSession()` for server-side validation as it provides stronger security guarantees.

## Authentication Methods

### Available Methods
- **Email/Password**: Traditional authentication with `useSignInWithEmailPassword`
- **OAuth Providers**: Google, GitHub, Facebook, Twitter/X, Discord via `useSignInWithProvider`
- **Magic Links**: Passwordless auth with `useSignInWithOtp`
- **Multi-Factor Authentication**: TOTP-based 2FA via authenticator apps

## Key Functions

### Server-Side Authentication

```typescript
// Enforce authentication in server components (uses getClaims internally)
requireUser(client: SupabaseClient, options?: {
  verifyMfa?: boolean;
  next?: string;
}): Promise<
  | { error: null; data: JWTUserData }
  | { error: AuthenticationError | MultiFactorAuthError; data: null; redirectTo: string }
>

// Wrap server actions with auth/validation
enhanceAction(handler, config: {
  auth?: boolean;      // default: true
  captcha?: boolean;   // default: false
  schema?: ZodSchema;  // validation schema
})

// Get authenticated Supabase client
getSupabaseServerClient(): SupabaseClient
```

### Client-Side Hooks

```typescript
// User state and authentication
useUser()                    // Current user data
useSignOut()                 // Sign out functionality
useSupabase()               // Supabase client access

// Team context
useTeamAccountWorkspace()   // { account, role, permissions }
```

## Authorization Model

### Team-Based RBAC

```typescript
interface AccountMembership {
  account_id: string;
  user_id: string;
  account_role: 'owner' | 'admin' | 'member';
}
```

### Role Permissions
- **owner**: Full access to all team features (hierarchy_level: 1 - highest privilege)
- **admin**: Manage members, settings, view billing (hierarchy_level: 2)
- **member**: View and create content (hierarchy_level: 3)

Note: Lower hierarchy_level values indicate higher privileges. Primary account owners bypass all permission checks.

### Data Access Control
- All data access enforced through Supabase RLS policies
- Policies check user's team membership before granting access
- Cannot be bypassed at application layer

## Common Patterns

### Protected Server Components
```typescript
// Use requireUser() and redirect on auth failure
const auth = await requireUser(client);
if (auth.error) redirect(auth.redirectTo);
```

### Protected Server Actions
```typescript
// Wrap with enhanceAction for automatic auth
export const action = enhanceAction(
  async (params, user) => { /* user guaranteed */ },
  { schema: ParamsSchema }
);
```

### Team Authorization
```typescript
// Check role in components
const { role } = useTeamAccountWorkspace();
if (role !== 'owner' && role !== 'admin') return <Unauthorized />;
```

## Security Features

- **CAPTCHA Protection**: Optional on auth actions via `captcha: true` in enhanceAction
- **Password Security**: Supabase handles password hashing internally with configurable policies
- **Token Management**: Automatic refresh, secure cookies, session invalidation
- **MFA Support**: Optional TOTP-based 2FA with enrollment/challenge flows

## Related Documentation

- [[auth-implementation]]: Detailed code examples and implementation patterns
- [[auth-troubleshooting]]: Common issues and debugging guide
- [[auth-configuration]]: Environment variables and setup instructions
- [[server-actions]]: Server action patterns with enhanceAction
- [[team-accounts]]: Team membership and role management
- [[database-rls]]: Row-level security implementation