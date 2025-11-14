# Infrastructure Documentation

Deployment, CI/CD, security, authentication, and operational patterns for SlideHeroes.

## Overview

This directory contains documentation for infrastructure, deployment pipelines, security patterns, authentication, monitoring, and operational procedures.

## Files in This Category

### CI/CD & Deployment

#### [ci-cd-complete.md](./ci-cd-complete.md)
Comprehensive CI/CD guide covering pipeline design, workflow patterns, testing strategies, security scanning, and deployment automation.

**When to use**: Understanding CI/CD workflows, adding new pipelines, troubleshooting build failures, optimizing deployment speed.

#### [production-security.md](./production-security.md)
Solo developer deployment safety workflow for private repositories with branch protection and validation.

**When to use**: Setting up production protection, configuring branch rules, preventing accidental deployments.

#### [vercel-deployment.md](./vercel-deployment.md)
Comprehensive Vercel deployment guide for monorepo with configuration, environment variables, and troubleshooting.

**When to use**: Deploying to Vercel, configuring projects, managing environments, troubleshooting deployments.

### Docker

#### [docker-setup.md](./docker-setup.md)
Docker architecture covering hybrid setup, container orchestration, Supabase services, test containers, and development workflows.

**When to use**: Setting up local development, configuring Supabase, understanding container architecture, managing services.

#### [docker-troubleshooting.md](./docker-troubleshooting.md)
Docker debugging guide for WSL2 issues, permissions, networking, health checks, and emergency recovery.

**When to use**: Debugging Docker issues, fixing container problems, resolving networking conflicts, emergency recovery.

### Database

#### [database-seeding.md](./database-seeding.md)
Dual-mode database seeding strategy for development and testing with factory patterns and RLS-compliant data.

**When to use**: Seeding databases, creating test data, populating development environments, ensuring RLS compliance.

### Authentication

#### [auth-overview.md](./auth-overview.md)
Supabase Auth overview with RBAC, multi-tenant architecture, and permission model.

**When to use**: Understanding auth architecture, implementing RBAC, designing permission systems.

#### [auth-implementation.md](./auth-implementation.md)
Auth implementation with code examples including middleware, RLS policies, and role checks.

**When to use**: Implementing auth flows, writing RLS policies, protecting routes, checking permissions.

#### [auth-configuration.md](./auth-configuration.md)
Auth configuration guide for environment variables, Supabase setup, and provider configuration.

**When to use**: Configuring auth, setting up providers, managing environment variables.

#### [auth-security.md](./auth-security.md)
Comprehensive security model covering RLS, session management, CSRF protection, and security best practices.

**When to use**: Implementing security patterns, hardening auth, protecting against attacks, auditing security.

#### [auth-troubleshooting.md](./auth-troubleshooting.md)
Auth debugging guide for common issues, session problems, RLS failures, and permission errors.

**When to use**: Debugging auth issues, fixing login problems, troubleshooting permissions, resolving session errors.

### Monitoring & Logging

#### [enhanced-logger.md](./enhanced-logger.md)
Async logging system with Pino, structured logging, and monitoring integration.

**When to use**: Implementing logging, debugging production issues, integrating monitoring tools.

#### [newrelic-monitoring.md](./newrelic-monitoring.md)
New Relic MCP server setup for application monitoring and performance tracking.

**When to use**: Setting up New Relic, monitoring production, analyzing performance.

## Common Workflows

### Deploying a New Feature

1. **Development**: [docker-setup.md](./docker-setup.md) - Local environment
2. **CI/CD**: [ci-cd-complete.md](./ci-cd-complete.md) - Automated testing
3. **Deployment**: [vercel-deployment.md](./vercel-deployment.md) - Production deploy
4. **Monitoring**: [enhanced-logger.md](./enhanced-logger.md) - Track deployment

### Setting Up New Environment

1. [docker-setup.md](./docker-setup.md) - Container infrastructure
2. [database-seeding.md](./database-seeding.md) - Seed database
3. [auth-configuration.md](./auth-configuration.md) - Configure auth
4. [vercel-deployment.md](./vercel-deployment.md) - Deploy to Vercel

### Implementing Authentication

1. [auth-overview.md](./auth-overview.md) - Understand architecture
2. [auth-implementation.md](./auth-implementation.md) - Write code
3. [auth-security.md](./auth-security.md) - Implement security
4. [auth-configuration.md](./auth-configuration.md) - Configure providers
5. [auth-troubleshooting.md](./auth-troubleshooting.md) - Debug issues

### Debugging Production Issues

1. [enhanced-logger.md](./enhanced-logger.md) - Check logs
2. [newrelic-monitoring.md](./newrelic-monitoring.md) - Review metrics
3. [docker-troubleshooting.md](./docker-troubleshooting.md) - Container issues
4. [auth-troubleshooting.md](./auth-troubleshooting.md) - Auth issues

## Prerequisites

Before working with infrastructure:

- **Required reading**: [CLAUDE.md](./../../CLAUDE.md) for project conventions
- **Access**: Vercel account, Supabase project, repository permissions
- **Tools**: Docker Desktop, Vercel CLI, Supabase CLI installed
- **Knowledge**: Basic understanding of containerization, CI/CD concepts

## Quick Reference

### Key Services

- **Hosting**: Vercel (Next.js apps)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with custom RBAC
- **Storage**: Supabase Storage
- **Monitoring**: New Relic, Vercel Analytics
- **Logging**: Pino with structured logging

### Common Commands

```bash
# Docker
docker-compose up -d        # Start services
docker-compose logs -f      # View logs
docker-compose down         # Stop services

# Supabase
pnpm supabase:web:start     # Start local Supabase
pnpm supabase:web:reset     # Reset database
pnpm supabase:web:typegen   # Generate types

# Vercel
vercel                      # Deploy preview
vercel --prod               # Deploy production
vercel env pull             # Pull environment variables
```

See [../tools/cli-references.md](../tools/cli-references.md) for complete command reference.

## Security Best Practices

### General Security

- **Never commit secrets**: Use environment variables
- **Enable RLS**: All tables must have RLS enabled
- **Validate input**: Use Zod schemas everywhere
- **Audit logs**: Track sensitive operations
- **HTTPS only**: Enforce secure connections

### Auth Security

- **Row Level Security**: Enforce at database level
- **Session management**: Short-lived tokens, secure storage
- **CSRF protection**: Use built-in Next.js protections
- **Rate limiting**: Implement for auth endpoints
- **MFA**: Support multi-factor authentication

### Deployment Security

- **Branch protection**: Required reviews, status checks
- **Environment separation**: Dev, staging, production
- **Secrets management**: Use Vercel/Supabase secret stores
- **Security scanning**: Automated vulnerability checks
- **Audit trail**: Log all deployments

## Troubleshooting

### Common Issues

| Issue | Solution | Reference |
|-------|----------|-----------|
| Docker won't start | Check WSL2, ports, permissions | [docker-troubleshooting.md](./docker-troubleshooting.md) |
| Deployment fails | Check build logs, env vars | [vercel-deployment.md](./vercel-deployment.md) |
| Auth not working | Verify configuration, check RLS | [auth-troubleshooting.md](./auth-troubleshooting.md) |
| CI/CD pipeline slow | Optimize caching, parallelize | [ci-cd-complete.md](./ci-cd-complete.md) |
| Database seed fails | Check RLS policies, permissions | [database-seeding.md](./database-seeding.md) |

### Emergency Procedures

1. **Production down**: Check Vercel status, review logs via [enhanced-logger.md](./enhanced-logger.md)
2. **Database issues**: Rollback migration, check Supabase status
3. **Auth compromised**: Rotate secrets, force logout all sessions
4. **Container issues**: Emergency recovery via [docker-troubleshooting.md](./docker-troubleshooting.md)

## Related Documentation

- **Development**: [../development/](../development/) - Feature implementation
- **Testing**: [../testing+quality/](../testing+quality/) - Test strategies
- **Tools**: [../tools/](../tools/) - CLI tools and utilities

## Monitoring & Observability

### What to Monitor

- **Performance**: Response times, Core Web Vitals
- **Errors**: Error rates, stack traces, failed requests
- **Auth**: Login success/failure, session duration
- **Database**: Query performance, connection pool
- **Resources**: CPU, memory, disk usage

### Monitoring Tools

- **New Relic**: APM and infrastructure monitoring
- **Vercel Analytics**: Core Web Vitals, traffic
- **Supabase**: Database performance, auth metrics
- **Pino Logs**: Structured application logs

---

*Last updated: 2025-11-14*
