# Current Development Focus

## Active Branch: `dev`

## Recent Activity Summary
Based on recent commits and git status:

### Recently Completed
- ✅ Bundle size monitoring and optimization documentation
- ✅ Security vulnerability fixes (Issue #82 - 4 vulnerabilities resolved)
- ✅ CI/CD documentation comprehensive update
- ✅ Scheduled maintenance issue resolution (Issue #75)

### Current Working State
- **Uncommitted Changes**: `.claude/settings.local.json` (local configuration)
- **New Issue**: `.claude/issues/2025-06-17-ISSUE-51.md` (untracked)

## Primary Development Priorities

### 1. Documentation Consolidation (Current Task)
**Status**: In Progress
**Goal**: Consolidate scattered documentation into `.claude/` structure for optimal AI assistant support
**Impact**: Improves development velocity and context awareness

### 2. Bundle Size Optimization
**Status**: Monitoring Phase
**Context**: Documentation completed, now implementing monitoring tools
**Next Steps**: 
- Implement bundlewatch integration
- Set up bundle size regression detection in CI
- Optimize large dependencies

### 3. Security Improvements
**Status**: Ongoing
**Recent**: Fixed 4 vulnerabilities in dependencies
**Next Steps**:
- Implement security scanning in CI pipeline
- Review and rotate API keys
- Enhanced secret management

## Known Technical Debt

### High Priority
1. **Quiz Relationship Management**: Complex bidirectional sync between Supabase and Payload CMS
2. **Storage Migration**: Transition from Supabase Storage to Cloudflare R2
3. **Performance Optimization**: Address N+1 query patterns in database access

### Medium Priority
1. **Component Refactoring**: Some legacy components need modernization
2. **Error Handling**: Standardize error handling patterns across applications
3. **Testing Coverage**: Increase unit and integration test coverage

## Design & UX Work in Progress

### Current Design Reviews
Based on files in context:
- **Typography System**: Review and standardization
- **Homepage Design 2025**: Recommendations and improvements
- **General Design Review**: Comprehensive UI/UX evaluation

## Technology Decisions in Flight

### 1. AI Gateway Strategy
**Context**: Considering Portkey integration for AI service management
**Status**: Research phase
**Impact**: Better cost control, fallback strategies, and monitoring for AI features

### 2. Storage Architecture
**Context**: Migration from Supabase Storage to Cloudflare R2
**Reason**: Better performance, cost optimization, CDN integration
**Status**: Planning and documentation phase

### 3. Monorepo Optimization
**Context**: Improving build times and development experience
**Tools**: Turbo, pnpm workspaces, caching strategies
**Status**: Ongoing optimization

## Immediate Next Actions

### This Week
1. **Complete Documentation Consolidation**: Finish `.claude/` structure setup
2. **Bundle Size Implementation**: Set up monitoring and alerting
3. **Issue #51 Resolution**: Address the new issue identified

### Next Week
1. **Security Scanning**: Implement automated security scanning in CI
2. **Performance Audit**: Identify and fix performance bottlenecks
3. **Storage Migration Planning**: Detailed plan for Cloudflare R2 transition

## Development Context

### Current Environment Setup
- **Node.js**: 20.x LTS
- **Package Manager**: pnpm 9.x
- **Build System**: Turbo with caching
- **Testing**: Vitest + Playwright
- **Linting**: Biome (replacing ESLint/Prettier)

### Key Configuration Files Modified
- **CI/CD**: GitHub Actions workflows updated
- **Dependencies**: Package.json security updates
- **Documentation**: Comprehensive CI/CD guide created

### Development Workflow
1. Feature development in `dev` branch
2. Continuous deployment to `dev.slideheroes.com`
3. Regular merges to `staging` for pre-production testing
4. Production releases via `main` branch

## Collaboration & Communication

### Documentation Strategy
- **Claude-First**: Optimize all documentation for AI assistant consumption
- **Human-Readable**: Maintain essential docs for human developers
- **Cross-Referenced**: Comprehensive linking between related documents

### Code Review Focus
- **Security**: No API key exposure, proper RLS implementation
- **Performance**: Bundle size impact, query optimization
- **Type Safety**: No `any` types, comprehensive interfaces
- **Testing**: Adequate coverage for new features

## Monitoring & Metrics

### Current Monitoring
- **New Relic**: Application performance monitoring
- **Vercel Analytics**: Deployment and performance metrics
- **GitHub Actions**: CI/CD pipeline monitoring

### Planned Monitoring
- **Bundle Size**: Automated regression detection
- **Security**: Dependency vulnerability scanning
- **Performance**: Lighthouse CI integration
- **Error Tracking**: Enhanced error reporting and alerting

## Notes for AI Assistants

### Coding Preferences
- **Server Components**: Default choice, client components only when necessary
- **Server Actions**: Use `enhanceAction` wrapper for all server actions
- **Validation**: Zod schemas for all input validation
- **Styling**: Tailwind CSS with Shadcn/UI components
- **State Management**: React Query for server state, minimal client state

### Common Patterns
- **Error Handling**: User-friendly messages, proper logging
- **Database Access**: RLS-compliant queries, proper TypeScript types
- **API Integration**: Server-side only, proper secret management
- **Testing**: Unit tests for business logic, E2E for critical flows

### Avoid
- **Direct Database Access**: Always use proper service layers
- **API Key Exposure**: Never in client-side code
- **`any` Types**: Always provide proper TypeScript interfaces
- **Client-Heavy Components**: Prefer server components when possible