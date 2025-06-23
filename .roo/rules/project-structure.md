---
description: Detailed Project Structure of the app
globs: apps/**
alwaysApply: false
---

# Project Structure

```
apps/web/app/                          # Root directory (apps/web/app)
│
├── (marketing)/              # Marketing pages group
│   ├── _components/          # Shared components for marketing routes
│   │   ├── site-footer.tsx
│   │   ├── site-header.tsx
│   │   ├── site-navigation.tsx
│   │   └── site-page-header.tsx
│   │
│   ├── (legal)/              # Legal pages subgroup
│   │   ├── cookie-policy/
│   │   │   └── page.tsx
│   │   ├── privacy-policy/
│   │   │   └── page.tsx
│   │   └── terms-of-service/
│   │       └── page.tsx
│   │
│   ├── blog/                 # Blog section
│   │   ├── _components/      # Blog-specific components
│   │   │   ├── blog-pagination.tsx
│   │   │   ├── post-header.tsx
│   │   │   └── post-preview.tsx
│   │   ├── [slug]/           # Dynamic route for blog posts
│   │   │   └── page.tsx
│   │   └── page.tsx          # Blog listing page
│   │
│   ├── contact/              # Contact page
│   │   ├── _components/
│   │   │   └── contact-form.tsx
│   │   ├── _lib/             # Contact page utilities
│   │   │   ├── contact-email.schema.ts
│   │   │   └── server/
│   │   │       └── server-actions.ts
│   │   └── page.tsx
│   │
│   ├── docs/                 # Documentation pages
│   │   ├── _components/
│   │   ├── _lib/
│   │   │   ├── server/
│   │   │   │   └── docs.loader.ts
│   │   │   └── utils.ts
│   │   ├── [slug]/
│   │   │   └── page.tsx
│   │   ├── layout.tsx        # Layout specific to docs section
│   │   └── page.tsx
│   │
│   ├── faq/
│   │   └── page.tsx
│   │
│   ├── pricing/
│   │   └── page.tsx
│   │
│   ├── layout.tsx            # Layout for all marketing pages
│   ├── loading.tsx           # Loading state for marketing pages
│   └── page.tsx              # Home/landing page
│
├── (auth)/                   # Authentication pages group
│   ├── callback/             # Auth callback routes
│   │   ├── error/
│   │   │   └── page.tsx
│   │   └── route.ts          # API route handler for auth callback
│   │
│   ├── confirm/
│   │   └── route.ts
│   │
│   ├── password-reset/
│   │   └── page.tsx
│   │
│   ├── sign-in/
│   │   └── page.tsx
│   │
│   ├── sign-up/
│   │   └── page.tsx
│   │
│   ├── verify/
│   │   └── page.tsx
│   │
│   ├── layout.tsx            # Layout for auth pages
│   └── loading.tsx           # Loading state for auth pages
│
├── admin/                    # Admin section
│   ├── _components/
│   │   ├── admin-sidebar.tsx
│   │   └── mobile-navigation.tsx
│   │
│   ├── accounts/
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   │
│   ├── layout.tsx
│   ├── loading.tsx
│   └── page.tsx
│
├── api/                      # API routes
│   ├── billing/
│   │   └── webhook/
│   │       └── route.ts
│   │
│   └── db/
│       └── webhook/
│           └── route.ts
│
├── home/                     # User dashboard area
│   ├── (user)/               # Personal user routes
│   │   ├── _components/      # User dashboard components
│   │   │   ├── home-account-selector.tsx
│   │   │   └── home-sidebar.tsx
│   │   │
│   │   ├── _lib/             # User dashboard utilities
│   │   │   └── server/
│   │   │       └── load-user-workspace.ts
│   │   │
│   │   ├── billing/          # Personal account billing
│   │   │   ├── _components/
│   │   │   ├── _lib/
│   │   │   │   ├── schema/
│   │   │   │   │   └── personal-account-checkout.schema.ts
│   │   │   │   └── server/
│   │   │   │       ├── personal-account-billing-page.loader.ts
│   │   │   │       ├── server-actions.ts
│   │   │   │       └── user-billing.service.ts
│   │   │   │
│   │   │   ├── error.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── return/
│   │   │       └── page.tsx
│   │   │
│   │   ├── settings/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   └── page.tsx
│   │
│   ├── [account]/            # Team account routes (dynamic)
│   │   ├── _components/      # Team account components
│   │   │   ├── dashboard-demo.tsx
│   │   │   ├── team-account-accounts-selector.tsx
│   │   │   └── team-account-layout-sidebar.tsx
│   │   │
│   │   ├── _lib/             # Team account utilities
│   │   │   └── server/
│   │   │       ├── team-account-billing-page.loader.ts
│   │   │       └── team-account-workspace.loader.ts
│   │   │
│   │   ├── billing/          # Team billing section
│   │   │   ├── _components/
│   │   │   ├── _lib/
│   │   │   │   ├── schema/
│   │   │   │   │   └── team-billing.schema.ts
│   │   │   │   └── server/
│   │   │   │       ├── server-actions.ts
│   │   │   │       └── team-billing.service.ts
│   │   │   │
│   │   │   ├── error.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── return/
│   │   │       └── page.tsx
│   │   │
│   │   ├── members/          # Team members management
│   │   │   ├── _lib/
│   │   │   │   └── server/
│   │   │   │       └── members-page.loader.ts
│   │   │   └── page.tsx
│   │   │
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   │
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   └── page.tsx
│   │
│   └── loading.tsx
│
├── join/                     # Team join page
│   └── page.tsx
│
├── update-password/
│   └── page.tsx
│
├── error.tsx                 # Global error page
├── global-error.tsx          # Global error component
├── layout.tsx                # Root layout
├── not-found.tsx             # 404 page
├── robots.ts                 # Robots.txt config
├── sitemap.xml/              # Sitemap generation
│   └── route.ts
└── version/                  # Version info endpoint
    └── route.ts
```

## Key Organization Patterns

1. **Route Groups**

   - `(marketing)` - Groups all marketing/public pages
   - `(auth)` - Groups all authentication related pages
   - `(user)` - Groups all personal user dashboard pages

2. **Component Organization**

   - `_components/` - Route-specific components
   - Global components are in the root `/components` directory (not shown)

3. **Utilities & Data**

   - `_lib/` - Route-specific utilities, types, and helpers
   - `_lib/server/` - Server-side utilities including data loaders
   - `/lib/` - Global utilities (not shown)

4. **Data Fetching**

   - Use of React's `cache()` function for request deduplication

5. **Server Actions**

   - `server-actions.ts` - Server-side actions for mutating data
   - Follows 'use server' directive pattern

6. **Special Files**

   - `layout.tsx` - Define layouts for routes
   - `loading.tsx` - Loading UI for routes
   - `error.tsx` - Error handling for routes
   - `page.tsx` - Page component for routes
   - `route.ts` - API route handlers

7. **Dynamic Routes**
   - `[account]` - Dynamic route for team accounts. The [account] property is the account slug in the table `public.accounts`.
   - `[slug]` - Dynamic route for blog posts and documentation
