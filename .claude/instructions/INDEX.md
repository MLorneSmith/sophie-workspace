# Implementation Instructions Index

This directory contains specific implementation patterns, guides, and best practices for the SlideHeroes project.

## Core Implementation Patterns

### Database & Content Management
- **[Payload Reference Setup](./payload-reference-setup.md)** - Setting up Payload CMS with proper configurations
- **[React Query Patterns](./react-query-patterns.md)** - Server state management best practices
- **[Relationship Tables Management](./relationship-tables-management.md)** - Handling complex data relationships
- **[Local Database Reset Guide](./local-db-reset/)** - Complete database reset procedures

### Migration & Data Management
- **[Content Migration System](./content-migration-system/)** - Comprehensive content migration strategies
- **[Supabase Content Migration](./supabase-content-migration.md)** - Supabase-specific migration patterns
- **[Remote Payload Migration](./remote-payload-migration/)** - Production migration guides

### Deployment & Infrastructure
- **[Vercel Deployment Guide](./vercel-deployment-guide.md)** - Complete deployment setup and configuration
- **[Update Payload Version](./update-payload-version.md)** - Safe Payload CMS upgrade procedures

### Web Content & Extraction
- **[Web Content Extraction Techniques](./web-content-extraction-techniques.md)** - Methods for extracting and processing web content

### Custom Development
- **[Create Payload Custom Component](./create-payload-custom-component.md)** - Building custom Payload CMS components
- **[Historical Commit Test Environment](./historical-commit-test-environment.md)** - Testing against historical codebase states

### Troubleshooting & Fixes
- **[Scripts Failing Silently Quiz Verification Fix](./scripts-failing-silently-quiz-verification-fix.md)** - Debugging silent script failures
- **[Payload CMS Migrations Limitations Analysis](./Payload%20CMS%20Migrations%20Limitations%20Analysis)** - Understanding Payload migration constraints

## Implementation Guidelines

### When to Use These Instructions
1. **Starting new features** - Check for existing patterns first
2. **Integrating external services** - Follow established integration patterns
3. **Database changes** - Use migration guides to avoid data loss
4. **Deployment issues** - Reference deployment troubleshooting guides
5. **Performance optimization** - Apply proven optimization techniques

### Pattern Hierarchy
1. **Project Constraints** (from `../context/constraints.md`) - Always follow these first
2. **Architecture Decisions** (from `../context/architecture.md`) - Understand the system design
3. **Specific Instructions** (this directory) - Detailed implementation guidance
4. **External Documentation** (from `../docs/`) - Library-specific details

## Common Implementation Workflows

### New Feature Development
1. Check `../context/current-focus.md` for project priorities
2. Review `../context/constraints.md` for limitations
3. Look for similar patterns in this directory
4. Reference external library docs in `../docs/`
5. Follow the development flow from `../context/development-flow.md`

### Database Changes
1. Review `../context/database-schema.md` for current structure
2. Use migration patterns from relevant guides
3. Test locally with reset procedures
4. Follow deployment pipeline for production changes

### Content Management
1. Understand Payload CMS setup from setup guides
2. Use relationship management patterns for complex data
3. Follow content migration procedures for data changes
4. Reference Payload documentation in `../docs/payload/`

### Performance & Optimization
1. Check current performance constraints in `../context/constraints.md`
2. Apply React Query patterns for efficient data fetching
3. Follow bundle optimization guidelines
4. Use monitoring tools mentioned in `../context/cicd-pipeline.md`

## Best Practices Summary

### Code Quality
- Always use TypeScript with proper types
- Follow the `enhanceAction` pattern for server actions
- Implement comprehensive error handling
- Use Zod schemas for all input validation

### Security
- Never expose API keys in client code
- Always respect RLS policies
- Validate all user inputs
- Use proper authentication patterns

### Performance
- Prefer Server Components over Client Components
- Implement proper caching strategies
- Monitor bundle sizes
- Optimize database queries

### Maintenance
- Document all custom patterns
- Update instructions when patterns change
- Keep external documentation current
- Maintain comprehensive test coverage

## Related Documentation

### External References
- **[Payload CMS Documentation](../docs/payload/)** - Complete Payload reference
- **[Supabase Documentation](../docs/supabase/)** - Database and backend services
- **[Makerkit Documentation](../docs/makerkit/)** - SaaS framework patterns

### Project Context
- **[Architecture Overview](../context/architecture.md)** - System design decisions
- **[Development Flow](../context/development-flow.md)** - Daily development workflows
- **[CI/CD Pipeline](../context/cicd-pipeline.md)** - Deployment and testing processes

### Historical Context
- **[Archive Plans](../archive/plans/)** - Historical implementation decisions
- **[Quiz System Work](../archive/plans/quizzes/)** - Complex relationship management examples
- **[PowerPoint Generation](../archive/plans/pptx/)** - Feature implementation examples