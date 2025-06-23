# System Design

## Monorepo Structure

Our project follows a monorepo structure using pnpm workspaces and Turbo:

```
/
├── apps/
│   ├── web/             # Main Next.js SaaS application
│   ├── payload/         # Payload CMS for content management
│   ├── e2e/             # End-to-end tests with Playwright
│   └── dev-tool/        # Development utilities
├── packages/
│   ├── features/        # Feature-specific packages
│   │   ├── accounts/    # Personal account management
│   │   ├── team-accounts/ # Team workspace management
│   │   ├── auth/        # Authentication flows
│   │   ├── admin/       # Admin panel features
│   │   └── notifications/ # Notification system
│   ├── ui/              # Shared UI components (Shadcn + custom)
│   ├── supabase/        # Supabase client and utilities
│   ├── ai-gateway/      # AI service integration with Portkey
│   ├── cms/             # CMS abstractions (Payload, Keystatic)
│   ├── billing/         # Billing integrations (Stripe, LemonSqueezy)
│   ├── i18n/            # Internationalization
│   ├── monitoring/      # Error tracking and analytics
│   ├── mailers/         # Email service abstractions
│   └── shared/          # Shared utilities and types
├── tooling/             # Development tools (ESLint, TypeScript configs)
├── scripts/             # Database migration and setup scripts
└── turbo.json           # Turbo build configuration
```

## Service Architecture

Our system consists of these main services:

1. **Web Application (Next.js)**

   - Server-rendered React application
   - API routes for backend functionality
   - Server Actions for form handling
   - Client-side interactivity where needed

2. **Supabase Backend**

   - PostgreSQL database
   - Authentication service
   - Storage service
   - Realtime subscriptions
   - Edge Functions

3. **Payload CMS**

   - Content management system
   - Admin interface
   - Content API
   - Media management

4. **AI Gateway**
   - Abstraction over AI providers
   - Prompt management
   - Response handling
   - Caching and fallbacks

## Data Flow

1. **Authentication Flow**

   - User signs in via Supabase Auth
   - JWT token stored in cookies
   - Server validates token on requests
   - RLS policies enforce access control

2. **Content Flow**

   - Content created in Payload CMS
   - Content stored in PostgreSQL
   - Content accessed via Payload API or direct database queries
   - Content rendered in Next.js application

3. **AI Integration Flow**
   - User input collected in UI
   - Input sent to server via Server Action
   - Server calls AI Gateway
   - AI Gateway calls appropriate AI provider
   - Response processed and returned to client

## Deployment Architecture

1. **Web Application**

   - Deployed on Vercel
   - Edge functions for global distribution
   - Serverless functions for API routes
   - Static assets on CDN

2. **Supabase**

   - Managed Supabase instance
   - Database backups and replication
   - Realtime enabled for collaborative features

3. **Payload CMS**
   - Deployed on dedicated server
   - Connected to same PostgreSQL database
   - Media stored in Supabase Storage

## Integration Points

1. **Web <-> Supabase**

   - Direct database access
   - Authentication service
   - Storage service

2. **Web <-> Payload CMS**

   - Content API
   - Media API

3. **Web <-> AI Gateway**
   - Server-side integration
   - No direct client access to AI providers

## Provider Architecture

### React Provider Chain

The application uses a nested provider pattern for dependency injection:

```tsx
// apps/web/components/root-providers.tsx
<MonitoringProvider>
  {' '}
  // Error tracking and analytics
  <AppEventsProvider>
    {' '}
    // Application event system
    <AnalyticsProvider>
      {' '}
      // User analytics tracking
      <ReactQueryProvider>
        {' '}
        // Server state management
        <I18nProvider>
          {' '}
          // Internationalization
          <CaptchaProvider>
            {' '}
            // Anti-bot protection
            <AuthProvider>
              {' '}
              // Authentication state
              <ThemeProvider>
                {' '}
                // Theme management
                {children}
              </ThemeProvider>
            </AuthProvider>
          </CaptchaProvider>
        </I18nProvider>
      </ReactQueryProvider>
    </AnalyticsProvider>
  </AppEventsProvider>
</MonitoringProvider>
```

### MakerKit Service Pattern

Services are organized as functional modules rather than classes:

```tsx
// Service function pattern
export async function createTeamAccount(data: TeamAccountData) {
  const supabase = getSupabaseServerClient();
  // Implementation using server client
}

// Used in server actions
export const createTeamAction = enhanceAction(
  async (data, user) => {
    return createTeamAccount({ ...data, userId: user.id });
  },
  { schema: createTeamSchema },
);
```
