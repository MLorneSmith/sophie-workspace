# SlideHeroes Architecture Context

## System Overview
SlideHeroes is a modern SaaS platform for creating and managing PowerPoint presentations with AI assistance, built on a distributed microservices architecture using Next.js, Supabase, and Payload CMS.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Content CMS   │    │   Database      │
│   (Next.js)     │────│   (Payload)     │────│   (Supabase)    │
│   Web App       │    │   Content Mgmt  │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   File Storage  │              │
         └──────────────│   (Cloudflare   │──────────────┘
                        │    R2/Supabase) │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │   External APIs │
                        │   (AI Services, │
                        │   Stripe, etc.) │
                        └─────────────────┘
```

## Application Structure

### Monorepo Organization
```
apps/
├── web/           # Main Next.js application (Customer-facing)
├── payload/       # Payload CMS (Content management)
├── e2e/           # Playwright E2E tests
└── dev-tool/      # Development utilities

packages/          # Shared packages (planned/partial)
```

### Core Applications

#### 1. Web App (`apps/web/`)
- **Framework**: Next.js 15 with App Router
- **Purpose**: Main customer-facing application
- **Key Features**:
  - User authentication and team management
  - Course/lesson system with quizzes
  - PowerPoint generation with AI
  - Billing and subscription management
  - Multi-tenant organization support

#### 2. Payload CMS (`apps/payload/`)
- **Framework**: Payload CMS 3.x
- **Purpose**: Content management and admin interface
- **Key Features**:
  - Course and lesson content management
  - Media and file management
  - User and organization data
  - Survey and quiz systems
  - Custom admin interface

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **Shadcn/UI**: Component library
- **React Query**: Server state management
- **Zustand**: Client state management (where needed)

### Backend
- **Supabase**: PostgreSQL database with auth, RLS, and real-time
- **Payload CMS**: Headless CMS for content management
- **Server Actions**: Next.js server-side API layer
- **Zod**: Runtime schema validation

### Infrastructure
- **Vercel**: Hosting and deployment
- **Cloudflare R2**: File storage (planned migration from Supabase Storage)
- **GitHub Actions**: CI/CD pipeline
- **New Relic**: Application monitoring

### External Services
- **Stripe**: Payment processing and billing
- **AI Services**: Various LLM providers for content generation
- **Email**: Supabase Auth with custom templates

## Data Architecture

### Database Design
- **Primary DB**: Supabase PostgreSQL with Row Level Security (RLS)
- **CMS DB**: Payload CMS with separate schema/database
- **Relationship Strategy**: Dual storage with sync mechanisms

### Key Data Models
- **Users & Organizations**: Multi-tenant architecture
- **Courses & Lessons**: Educational content structure
- **Quizzes & Surveys**: Assessment systems
- **Certificates**: Generated PDF achievements
- **Billing**: Stripe integration for subscriptions

### Security Model
- **Row Level Security (RLS)**: Database-level access control
- **Multi-tenant isolation**: Organization-based data segregation
- **API key management**: Secure external service integration
- **Authentication**: Supabase Auth with MFA support

## Key Architectural Decisions

### 1. Dual CMS Strategy
- **Supabase**: Real-time user data, authentication, billing
- **Payload CMS**: Content management, admin interface, media handling
- **Sync Strategy**: Custom hooks and migrations to maintain consistency

### 2. Server-First Architecture
- **Server Components**: Default for all components
- **Client Components**: Only when interactivity required
- **Server Actions**: Primary API pattern with `enhanceAction` wrapper
- **Progressive Enhancement**: Works without JavaScript

### 3. Type Safety Everywhere
- **Database Types**: Auto-generated from Supabase
- **API Validation**: Zod schemas for all inputs
- **End-to-end Types**: TypeScript across full stack
- **No `any` Types**: Strict typing enforced

### 4. Performance Optimization
- **Edge Functions**: Vercel Edge Runtime where applicable
- **Caching**: Multiple layers (Vercel, React, custom)
- **Bundle Optimization**: Turbo build system with caching
- **Image Optimization**: Vercel Image with Cloudflare R2

## Current Technical Debt & Constraints

### Known Issues
1. **Quiz Relationship Complexity**: Bidirectional sync between Supabase and Payload
2. **Storage Migration**: Transitioning from Supabase Storage to Cloudflare R2
3. **Bundle Size**: Monitoring and optimization in progress
4. **Legacy Code**: Some components need refactoring to new patterns

### Performance Constraints
- **Payload CMS**: Can be slow for large datasets
- **Database Queries**: Some N+1 query patterns exist
- **Build Times**: Monorepo builds can be lengthy

### Security Considerations
- **API Key Exposure**: Strict server-side handling required
- **RLS Complexity**: Complex policies across multi-tenant data
- **Content Validation**: User-generated content requires sanitization

## Development Patterns

### Code Organization
- **Feature-based folders**: Group related components/logic
- **Shared utilities**: Common functions in `lib/` directories
- **Type definitions**: Co-located with implementations
- **Configuration**: Centralized config files

### Error Handling
- **Server Actions**: `enhanceAction` wrapper for consistent error handling
- **Client Components**: Error boundaries and fallbacks
- **Database**: Graceful handling of RLS policy violations
- **External APIs**: Retry logic and fallback strategies

### Testing Strategy
- **Unit Tests**: Vitest for business logic
- **Integration Tests**: API route testing
- **E2E Tests**: Playwright for critical user flows
- **Type Tests**: TypeScript compiler as first line of defense

## Deployment Architecture

### Environment Strategy
- **Development**: Feature testing (`dev.slideheroes.com`)
- **Staging**: Pre-production validation (`staging.slideheroes.com`)
- **Production**: Live application (`slideheroes.com`)

### Scaling Considerations
- **Vercel**: Auto-scaling serverless functions
- **Supabase**: Managed PostgreSQL with connection pooling
- **CDN**: Cloudflare for static assets and caching
- **Database**: Read replicas and connection pooling planned

## Future Architecture Plans

### Short-term (1-2 months)
- Complete Cloudflare R2 storage migration
- Optimize quiz relationship management
- Implement comprehensive monitoring
- Bundle size optimization

### Medium-term (3-6 months)
- Microservices extraction (AI services)
- Advanced caching strategies
- Real-time collaboration features
- Enhanced security scanning

### Long-term (6+ months)
- Multi-region deployment
- Advanced analytics and reporting
- Machine learning pipeline integration
- Enterprise-grade compliance features