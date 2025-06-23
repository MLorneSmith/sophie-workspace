# Development Flow Context

## Local Development Setup

### Prerequisites
```bash
# Required tools
node >= 20          # LTS version
pnpm >= 9.12.0     # Package manager
git                # Version control
```

### Initial Setup
```bash
# Clone repository
git clone https://github.com/MLorneSmith/2025slideheroes.git
cd 2025slideheroes

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Fill in required values

# Start development servers
pnpm dev
```

### Environment Configuration

#### Required Environment Variables
```bash
# Database
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# AI Services
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Email
SMTP_FROM=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

## Development Commands

### Core Development
```bash
# Start all development servers
pnpm dev                    # Runs web app, payload, and dev tools

# Individual applications
pnpm --filter web dev       # Web app only
pnpm --filter payload dev   # Payload CMS only
pnpm --filter dev-tool dev  # Development tools

# Build for production
pnpm build                  # Build all applications
pnpm --filter web build     # Build web app only
```

### Database Management
```bash
# Supabase local development
pnpm supabase:web:start     # Start local Supabase stack
pnpm supabase:web:stop      # Stop local Supabase
pnpm supabase:web:reset     # Reset local database
pnpm supabase:web:typegen   # Generate TypeScript types

# Payload CMS migrations
pnpm payload:migrate:ssl    # Run migrations with SSL
pnpm payload:migrate:production # Production migration mode
```

### Testing
```bash
# Unit tests
pnpm test                   # All unit tests
pnpm --filter web test      # Web app tests only

# E2E tests
pnpm --filter e2e test      # Full E2E suite
pnpm --filter e2e test:ui   # E2E with UI (headed mode)

# Type checking
pnpm typecheck              # All applications
pnpm --filter web typecheck # Web app only

# Accessibility testing
pnpm a11y:test              # Run accessibility tests
pnpm a11y:report            # Generate accessibility report
```

### Code Quality
```bash
# Linting and formatting
pnpm lint                   # Run all linters
pnpm lint:fix               # Auto-fix lint issues
pnpm format                 # Check formatting
pnpm format:fix             # Auto-fix formatting

# Specific linters
pnpm lint:yaml              # YAML file linting
pnpm lint:md                # Markdown linting
pnpm lint:md:fix            # Fix markdown issues
```

### Package Management
```bash
# Dependency management
pnpm update                 # Update all dependencies
pnpm syncpack:list          # List version mismatches
pnpm syncpack:fix           # Fix version mismatches
pnpm manypkg:check          # Check package structure
pnpm manypkg:fix            # Fix package issues

# Cleanup
pnpm clean                  # Clean build artifacts
pnpm clean:workspaces       # Clean all workspace builds
```

## Monorepo Workflow

### Workspace Structure
```
apps/
├── web/              # Next.js main application
├── payload/          # Payload CMS application
├── e2e/              # Playwright E2E tests
└── dev-tool/         # Development utilities

packages/             # Shared packages (minimal currently)
├── eslint/           # ESLint configuration
├── prettier/         # Prettier configuration
├── typescript/       # TypeScript configurations
└── scripts/          # Build and utility scripts
```

### Turbo Configuration
- **Build Caching**: Aggressive caching with remote cache support
- **Parallel Execution**: Independent tasks run concurrently
- **Dependency Awareness**: Respects package dependencies

### Workspace Commands
```bash
# Target specific workspaces
pnpm --filter web [command]      # Web app only
pnpm --filter payload [command]  # Payload CMS only
pnpm --filter e2e [command]      # E2E tests only

# Pattern matching
pnpm --filter "*web*" [command]  # All workspaces with "web"
pnpm --filter "./apps/*" [command] # All apps
```

## Git Workflow

### Branch Strategy
```bash
# Main branches
main         # Production releases
staging      # Pre-production testing
dev          # Development integration

# Feature development
git checkout dev
git checkout -b feature/your-feature-name
# ... make changes
git push origin feature/your-feature-name
# Create PR to dev branch
```

### Commit Conventions
```bash
# Conventional commits
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks

# Examples
feat(web): add course creation flow
fix(payload): resolve quiz relationship sync
docs(cicd): update deployment guide
```

### Pre-commit Hooks
```bash
# Automated via husky
npm run lint-staged    # Runs on git commit
npm run commit         # Conventional commit helper
```

## Application-Specific Development

### Web App (`apps/web/`)

#### Development Server
```bash
# Development with hot reload
pnpm --filter web dev

# Environment-specific
NODE_ENV=development pnpm --filter web dev
NODE_ENV=staging pnpm --filter web build
```

#### Key Directories
```
app/                  # Next.js App Router pages
components/           # React components
lib/                  # Utilities and configurations
supabase/            # Database migrations and schemas
middleware.ts        # Next.js middleware
```

#### Common Development Tasks
```bash
# Database operations
pnpm supabase:web:reset         # Reset local DB
pnpm supabase:web:typegen       # Update types

# Authentication testing
# Use Supabase local auth UI at http://localhost:54323

# API testing
# Server actions available in development
```

### Payload CMS (`apps/payload/`)

#### Development Server
```bash
# Payload development
pnpm --filter payload dev

# Access admin interface
# http://localhost:3001/admin
```

#### Configuration
```typescript
// payload.config.ts
export default buildConfig({
  admin: {
    bundler: webpackBundler(),
    user: Users.slug,
  },
  collections: [
    // Collection definitions
  ],
  // ... other config
});
```

#### Common Tasks
```bash
# Run migrations
pnpm --filter payload payload migrate

# Generate types
pnpm --filter payload payload generate:types

# Clear cache
rm -rf apps/payload/.next
```

### E2E Testing (`apps/e2e/`)

#### Test Development
```bash
# Run tests
pnpm --filter e2e test

# Interactive mode
pnpm --filter e2e test:ui

# Debug mode
pnpm --filter e2e test:debug
```

#### Test Structure
```
tests/
├── account/          # Account management tests
├── admin/            # Admin functionality tests
├── authentication/   # Auth flow tests
├── team-accounts/    # Team management tests
└── utils/            # Test utilities and helpers
```

## Development Tools

### Available Tools
```bash
# Development utilities
pnpm --filter dev-tool dev      # Developer dashboard
# Accessible at http://localhost:3002

# Features:
# - Environment variable management
# - Translation management
# - Email template testing
# - Connectivity testing
```

### Debugging

#### Browser DevTools
- **React DevTools**: Component inspection
- **Network Tab**: API request monitoring
- **Console**: Server action debugging

#### VSCode Setup
```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome"
}
```

#### Environment Debugging
```bash
# Check environment variables
pnpm --filter web run env:validate

# Database connectivity
pnpm --filter web run db:check

# External API connectivity
pnpm --filter web run api:check
```

## Performance Optimization

### Development Performance
- **Turbo Cache**: Enabled by default
- **pnpm**: Fast package installation
- **Hot Reload**: Fast refresh for React components
- **TypeScript**: Incremental compilation

### Build Optimization
```bash
# Analyze bundle size
pnpm --filter web run build:analyze

# Check bundle composition
pnpm --filter web run bundle:analyze

# Performance profiling
pnpm --filter web run build:profile
```

## Common Development Issues

### Database Connection
```bash
# If Supabase won't start
pnpm supabase:web:stop
rm -rf apps/web/supabase/.branches
pnpm supabase:web:start
```

### Type Errors
```bash
# Regenerate database types
pnpm supabase:web:typegen

# Clear TypeScript cache
rm -rf apps/web/.next
rm -rf tsconfig.tsbuildinfo
```

### Package Issues
```bash
# Clear node_modules
pnpm clean
pnpm install

# Fix package mismatches
pnpm syncpack:fix
pnpm manypkg:fix
```

### Port Conflicts
```bash
# Default ports
# Web app: 3000
# Payload: 3001  
# Dev tool: 3002
# Supabase: 54321-54329

# Change ports if needed
PORT=3003 pnpm --filter web dev
```

## Environment-Specific Considerations

### Development Environment
- **Hot Reload**: Enabled for fast iteration
- **Source Maps**: Full source maps for debugging
- **Error Overlay**: Detailed error information
- **Development Database**: Separate from production

### Staging Environment
- **Production Build**: Optimized bundles
- **Real Services**: Connected to staging services
- **E2E Testing**: Full test suite execution
- **Performance Testing**: Lighthouse CI

### Production Environment
- **Optimized Builds**: Minimal bundle sizes
- **Error Tracking**: Production error monitoring
- **Performance Monitoring**: Real-time metrics
- **Security**: Enhanced security measures

## Best Practices

### Code Quality
- **TypeScript**: Strict mode enabled
- **Linting**: Biome for consistent code style
- **Testing**: Unit tests for business logic
- **Documentation**: Code comments for complex logic

### Performance
- **Server Components**: Default choice
- **Client Components**: Only when necessary
- **Bundle Analysis**: Regular size monitoring
- **Database Queries**: Optimized with proper indexing

### Security
- **Environment Variables**: Never commit secrets
- **API Keys**: Server-side only
- **Input Validation**: Zod schemas for all inputs
- **RLS Policies**: Proper database-level security