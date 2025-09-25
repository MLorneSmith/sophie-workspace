---
id: "makerkit-template-usage"
title: "MakerKit SaaS Template - Architecture & Usage Patterns"
version: "1.0.0"
category: "implementation"
description: "Comprehensive guide to SlideHeroes usage of the MakerKit Next.js Supabase Turbo template as upstream foundation"
tags: ["makerkit", "saas-template", "next.js", "supabase", "monorepo", "architecture", "turbo", "@kit-packages"]
dependencies: ["upstream-sync"]
cross_references:
  - id: "upstream-sync"
    type: "related"
    description: "Synchronization patterns for MakerKit template updates"
  - id: "code-standards"
    type: "prerequisite"
    description: "TypeScript and React standards that extend MakerKit patterns"
created: "2025-09-23"
last_updated: "2025-09-23"
author: "create-context"
---

# MakerKit SaaS Template - Architecture & Usage Patterns

## Overview

SlideHeroes is built on the **MakerKit Next.js Supabase Turbo template** (v2.13.1), a comprehensive SaaS starter that provides authentication, multi-tenancy, billing, and administrative features. This context explains how we use MakerKit as our upstream foundation while customizing for presentation intelligence needs.

**Template Repository**: `github.com/makerkit/next-supabase-saas-kit-turbo`
**Current Version**: v2.13.1
**Architecture**: Turborepo monorepo with Next.js 15 + Supabase + TypeScript

## Key Concepts

### @kit Package System
MakerKit organizes functionality into scoped workspace packages (`@kit/*`) that provide modular, reusable components:

```typescript
// Core UI components
import { Button } from '@kit/ui/button';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

// Authentication utilities
import { requireUser } from '@kit/supabase/require-user';
import { createAccountsApi } from '@kit/accounts/api';

// Billing integration
import { createBillingApi } from '@kit/billing/api';
```

### Template Architecture Layers

1. **Foundation Layer**: Next.js 15, Supabase, TypeScript, Tailwind CSS
2. **Framework Layer**: Authentication, RLS, multi-tenancy, billing
3. **Component Layer**: UI components, forms, layouts, patterns
4. **Feature Layer**: Account management, admin panels, user flows
5. **Customization Layer**: SlideHeroes-specific features and business logic

### Multi-Tenant Account System
MakerKit provides sophisticated multi-tenant architecture:

- **Personal Accounts**: Individual user workspaces
- **Team Accounts**: Collaborative workspaces with role-based access
- **Account Switching**: Seamless context switching between accounts
- **Invitation System**: Team member management with roles

## Implementation Patterns

### Authentication & Authorization
MakerKit integrates deeply with Supabase Auth:

```typescript
// Server Components - User requirement
import { requireUser } from '@kit/supabase/require-user';

export default async function ProtectedPage() {
  const user = await requireUser();
  // Component logic
}

// Client Components - Auth state
import { useUserProvider } from '@kit/supabase/hooks';

function ClientComponent() {
  const { user, accounts } = useUserProvider();
  // Component logic
}
```

### Row Level Security (RLS) Patterns
MakerKit includes optimized RLS patterns for multi-tenancy:

```sql
-- Performant RLS with subquery wrapper
user_id = (select auth.uid())

-- Account-based access control
account_id IN (
  SELECT account_id FROM memberships
  WHERE user_id = (select auth.uid())
)
```

### Component Architecture
MakerKit follows specific component patterns:

```typescript
// Conditional rendering with If component
import { If } from '@kit/ui/if';

<If condition={isLoading} fallback={<Content />}>
  <Spinner />
</If>

// Internationalization with Trans
import { Trans } from '@kit/ui/trans';

<Trans
  i18nKey="user:welcomeMessage"
  values={{ name: user.name }}
/>

// Lazy loading with LazyRender
import { LazyRender } from '@kit/ui/lazy-render';

<LazyRender threshold={0.1}>
  <HeavyComponent />
</LazyRender>
```

### Form Handling Patterns
MakerKit standardizes form patterns with React Hook Form + Zod:

```typescript
// Schema definition (reusable)
export const CreateNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

// Form component
const form = useForm({
  resolver: zodResolver(CreateNoteSchema),
});

const onSubmit = (data) => {
  startTransition(async () => {
    await toast.promise(createNoteAction(data), {
      loading: 'Creating...',
      success: 'Created!',
      error: 'Failed!',
    });
  });
};
```

## Architecture Decisions

### Monorepo Structure
MakerKit uses Turborepo for optimized monorepo management:

```
/
├── apps/
│   ├── web/              # Main Next.js application
│   ├── payload/          # CMS application
│   └── e2e/              # End-to-end tests
├── packages/
│   ├── @kit/             # Core MakerKit packages
│   ├── billing/          # Billing integrations
│   ├── features/         # Feature modules
│   └── ui/               # UI components
└── turbo.json            # Build pipeline configuration
```

### Database Architecture
MakerKit 2025 uses **declarative schema** approach:

- **Schema Files**: `/supabase/schemas/` instead of migrations
- **Helper Functions**: SQL functions for common operations
- **RLS Policies**: Comprehensive row-level security
- **Test Coverage**: Database tests in `/supabase/tests/`

### Styling System
MakerKit integrates multiple styling approaches:

```css
/* apps/web/styles/makerkit.css - Template-specific styles */
[data-radix-popper-content-wrapper] {
  @apply w-full md:w-auto;
}

/* Semantic color variables for dark mode */
.bg-background .text-foreground .border-border
```

## Customization Patterns

### SlideHeroes Extensions
We extend MakerKit in these areas:

1. **Presentation Intelligence**: AI-powered slide analysis and recommendations
2. **Content Management**: Payload CMS integration for slide templates
3. **Analytics**: Custom analytics beyond MakerKit's base offering
4. **Workflow Automation**: Presentation creation and optimization workflows

### Preserving Template Updates
Key strategies for maintaining upstream compatibility:

```bash
# Upstream remote configuration
git remote add upstream https://github.com/makerkit/next-supabase-saas-kit-turbo.git

# Safe update pattern
git fetch upstream
git pull upstream main  # MakerKit recommended approach
```

### Package Customization Hierarchy
1. **Use @kit packages** when functionality exists
2. **Extend @kit packages** for additional features
3. **Create custom packages** only for SlideHeroes-specific needs
4. **Override carefully** with documented rationale

## Key Components & Utilities

### Essential MakerKit Components
```typescript
// Conditional rendering
import { If } from '@kit/ui/if';

// Internationalization
import { Trans } from '@kit/ui/trans';

// User avatars with fallbacks
import { ProfileAvatar } from '@kit/ui/profile-avatar';

// Toast notifications
import { toast } from '@kit/ui/sonner';

// Performance optimization
import { LazyRender } from '@kit/ui/lazy-render';
```

### Authentication Utilities
```typescript
// Server-side user requirement
import { requireUser } from '@kit/supabase/require-user';

// Account context and switching
import { useUserProvider } from '@kit/supabase/hooks';

// Account management APIs
import { createAccountsApi } from '@kit/accounts/api';
```

### Database Helpers
```sql
-- MakerKit helper functions
SELECT has_role_on_account(user_id, account_id, role);
SELECT is_account_owner(user_id, account_id);

-- Performance-optimized RLS patterns
WHERE user_id = (select auth.uid())
```

## Development Workflow

### Daily Development
1. **Follow @kit patterns** for consistency with template
2. **Use semantic versioning** to track template updates
3. **Test against MakerKit patterns** for upgrade compatibility
4. **Document customizations** that deviate from template

### Update Management
1. **Regular upstream checks** using version scripts
2. **Selective merging** based on file classification
3. **Automated conflict resolution** using project-specific rules
4. **Validation pipeline** for template compatibility

### Testing Integration
MakerKit provides test utilities and patterns:

```typescript
// Test helpers for auth
import { createMockUser } from '@kit/supabase/test-utils';

// Database test patterns
import { createMockAccount } from '@kit/accounts/test-utils';
```

## Troubleshooting

### Common Integration Issues

**Type Conflicts**: MakerKit uses strict TypeScript - follow `@kit` type exports
**Component Styling**: Use semantic Tailwind classes compatible with MakerKit themes
**RLS Performance**: Apply MakerKit's optimized patterns for large datasets
**Build Errors**: Ensure compatibility with MakerKit's Turbo pipeline configuration

### Update Conflicts
When upstream updates conflict with customizations:

1. **Identify conflict type**: Configuration, component, or business logic
2. **Apply conflict resolution rules** from merge automation
3. **Validate against template patterns** to ensure compatibility
4. **Document resolution decisions** for future updates

### Package Resolution
MakerKit's @kit packages require specific resolution patterns:

```json
// package.json workspace configuration
{
  "pnpm": {
    "overrides": {
      "react-is": "19.0.0"
    }
  }
}
```

## Best Practices

### Template Adherence
- **Leverage @kit packages** before building custom solutions
- **Follow MakerKit naming conventions** for consistency
- **Use template's TypeScript patterns** for type safety
- **Adopt template's testing approaches** for maintainability

### Customization Guidelines
- **Document all deviations** from template patterns
- **Create feature flags** for experimental customizations
- **Maintain upgrade compatibility** through careful abstraction
- **Test template updates** in isolated environments first

### Performance Optimization
- **Use MakerKit's LazyRender** for expensive components
- **Follow RLS performance patterns** for database queries
- **Leverage template's caching strategies** in Turbo pipeline
- **Apply template's bundle optimization** techniques

This context enables AI agents to understand how SlideHeroes leverages MakerKit as its foundational template while maintaining the ability to receive upstream updates and extend functionality for presentation intelligence use cases.