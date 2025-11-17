# Technical Constraints & Limitations

## Critical Security Constraints

### 1. API Key Management

**Constraint**: Never expose API keys in client-side code
**Rationale**: Security best practice, prevents unauthorized access
**Implementation**:

- Use server actions for all external API calls
- Store keys in environment variables only
- Validate server-side before any external requests

### 2. Row Level Security (RLS) Compliance

**Constraint**: Never bypass RLS policies in database queries
**Rationale**: Multi-tenant data isolation and security
**Implementation**:

- All queries must respect organization boundaries
- Use proper user context in all database operations
- Test RLS policies regularly

### 3. Input Validation Requirements

**Constraint**: Use Zod schemas for all input validation
**Rationale**: Runtime safety and type consistency
**Implementation**:

- Validate all user inputs at API boundaries
- Use schema-first approach for forms
- Consistent error messaging

## Architectural Constraints

### 1. Server Component Preference

**Constraint**: Prefer Server Components over Client Components
**Rationale**: Better performance, SEO, and reduced JavaScript bundle size
**Exceptions**: User interactions, real-time updates, browser APIs
**Implementation**:

- Default to Server Components
- Use `"use client"` only when necessary
- Minimize client-side state

### 2. No `any` Types Policy

**Constraint**: Prohibited use of TypeScript `any` type
**Rationale**: Type safety and better developer experience
**Implementation**:

- Define proper interfaces for all data structures
- Use generic types where appropriate
- Gradually type external libraries

### 3. Enhanced Action Pattern

**Constraint**: Use `enhanceAction` wrapper for all server actions
**Rationale**: Consistent error handling, logging, and security
**Implementation**:

```typescript
export const myAction = enhanceAction(
  async (data: MySchema) => {
    // Action implementation
  },
  {
    name: 'my-action',
    schema: MySchema,
  }
);
```

## Performance Constraints

### 1. Bundle Size Limitations

**Current Status**: Under monitoring and optimization
**Target**: < 500KB initial bundle size
**Constraints**:

- Lazy load non-critical components
- Tree-shake unused dependencies
- Monitor bundle size in CI pipeline

### 2. Database Query Optimization

**Constraint**: Prevent N+1 query patterns
**Implementation**:

- Use proper joins instead of multiple queries
- Implement query batching where possible
- Monitor query performance with New Relic

### 3. Build Time Constraints

**Current**: Monorepo builds can be lengthy
**Target**: < 5 minutes for full build
**Mitigation**:

- Turbo caching enabled
- Parallel build execution
- Incremental builds in CI

## Technology Constraints

### 1. Node.js Version Lock

**Constraint**: Node.js >= 20.x LTS
**Rationale**: Security updates, performance improvements
**Impact**: All environments must use compatible versions

### 2. Package Manager Lock

**Constraint**: Use pnpm exclusively
**Rationale**: Workspace support, performance, disk efficiency
**Impact**: No npm or yarn usage in project

### 3. Database Technology Lock

**Primary**: Supabase PostgreSQL
**Secondary**: Payload CMS database
**Constraint**: Cannot easily migrate to other database systems
**Rationale**: Deep integration with RLS, real-time features

## Known Technical Debt

### 1. Quiz Relationship Complexity

**Issue**: Bidirectional sync between Supabase and Payload
**Impact**: Complex logic, potential data inconsistency
**Priority**: High
**Estimated Effort**: 2-3 weeks
**Workaround**: Manual sync scripts when needed

### 2. Payload CMS Performance

**Issue**: Slow admin interface with large datasets
**Impact**: Poor admin user experience
**Priority**: Medium
**Mitigation**: Pagination, query optimization
**Long-term**: Consider headless CMS alternatives

### 3. Storage Architecture Migration

**Issue**: Transition from Supabase Storage to Cloudflare R2
**Impact**: Development complexity during transition
**Priority**: Medium
**Timeline**: 1-2 months
**Risk**: Potential downtime during migration

### 4. Legacy Component Patterns

**Issue**: Some components use outdated patterns
**Impact**: Inconsistent code style, harder maintenance
**Priority**: Low
**Approach**: Gradual refactoring during feature work

## External Service Dependencies

### 1. Vercel Platform Lock-in

**Constraint**: Deep integration with Vercel deployment features
**Risk**: Difficult migration to other hosting platforms
**Mitigation**: Use standard Next.js features where possible

### 2. Supabase Service Dependency

**Constraint**: Heavy reliance on Supabase features
**Services**: Database, Auth, Storage, Real-time
**Risk**: Vendor lock-in
**Mitigation**: Abstraction layers for critical features

### 3. Stripe Payment Integration

**Constraint**: Tightly coupled billing logic
**Risk**: Difficult to switch payment providers
**Mitigation**: Payment service abstraction layer (planned)

## Compliance and Security Constraints

### 1. Data Protection Requirements

**Constraint**: GDPR compliance for user data
**Implementation**:

- Data export functionality
- Right to be forgotten implementation
- Audit logging for data access

### 2. PCI Compliance

**Constraint**: No storage of payment card data
**Implementation**:

- Stripe handles all card processing
- No card data touches our systems
- Secure webhook handling

### 3. Multi-tenant Data Isolation

**Constraint**: Strict organization-based data separation
**Implementation**:

- RLS policies at database level
- API-level organization filtering
- Regular security audits

## Scalability Constraints

### 1. Single Database Instance

**Current Limitation**: No read replicas or sharding
**Impact**: Performance ceiling for high-traffic scenarios
**Planned**: Read replica implementation

### 2. Monorepo Build Complexity

**Constraint**: Build times increase with codebase size
**Mitigation**: Aggressive caching, selective builds
**Future**: Consider micro-frontend architecture

### 3. Storage Bandwidth

**Current**: Supabase storage bandwidth limits
**Planned**: Cloudflare R2 migration for improved performance

## Development Workflow Constraints

### 1. Branch Protection Rules

**Constraint**: Cannot push directly to main or staging
**Requirement**: Pull request reviews required
**Impact**: Slower emergency fixes

### 2. CI/CD Pipeline Dependencies

**Constraint**: All tests must pass before deployment
**Impact**: Can block deployments for unrelated failures
**Mitigation**: Selective test execution based on changes

### 3. Environment Synchronization

**Constraint**: Environment variables must be synced manually
**Risk**: Configuration drift between environments
**Planned**: Automated environment configuration

## Resource Constraints

### 1. Development Team Size

**Current**: Small team (1-2 developers)
**Impact**: Limited bandwidth for large refactoring
**Strategy**: Incremental improvements, technical debt prioritization

### 2. Testing Resources

**Constraint**: Limited E2E test coverage
**Impact**: Higher risk of regression bugs
**Priority**: Expand critical path coverage

### 3. Monitoring and Observability

**Current**: Basic monitoring with New Relic
**Gap**: Limited business metrics tracking
**Planned**: Enhanced analytics and reporting

## Future Constraint Considerations

### 1. International Expansion

**Potential Constraint**: Multi-region data requirements
**Preparation**: Internationalization framework ready
**Challenge**: Database distribution strategy

### 2. Enterprise Requirements

**Potential Constraint**: Advanced compliance needs
**Examples**: SOC 2, HIPAA, advanced audit logging
**Impact**: Significant architecture changes required

### 3. Mobile Application

**Potential Constraint**: API designed for web consumption
**Impact**: May need mobile-specific API endpoints
**Consideration**: GraphQL adoption for flexible queries

## Mitigation Strategies

### 1. Technical Debt Management

- **Regular Debt Reviews**: Monthly technical debt assessment
- **Incremental Fixes**: Address debt during feature development
- **Documentation**: Maintain comprehensive constraint documentation

### 2. Monitoring and Alerting

- **Performance Monitoring**: Track key metrics continuously
- **Error Tracking**: Comprehensive error logging and alerting
- **Capacity Planning**: Proactive scaling based on usage patterns

### 3. Risk Management

- **Backup Strategies**: Multiple backup systems and procedures
- **Rollback Capabilities**: Quick rollback for critical issues
- **Disaster Recovery**: Documented procedures for major outages

### 4. Knowledge Management

- **Documentation**: Keep constraints and limitations well-documented
- **Team Knowledge**: Ensure team understands critical constraints
- **Decision Tracking**: Document architectural decisions and rationale
