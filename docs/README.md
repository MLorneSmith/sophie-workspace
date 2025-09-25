# SlideHeroes Documentation

Welcome to the SlideHeroes project documentation. This directory contains essential human-readable documentation for
the project.

## 📚 Documentation Structure

### For Developers & Contributors

This `docs/` directory contains:

- **[CI/CD Documentation](./cicd/)** - Deployment processes and pipeline information
- **[Bundle Optimization](./bundle-optimization.md)** - Performance optimization strategies
- **[Vercel Setup](./vercel-setup.md)** - Hosting and deployment configuration

### For AI Coding Assistants

For comprehensive project context optimized for AI assistants (Claude Code, etc.), see:

- **[`.claude/` Directory](../.claude/)** - Complete project context and implementation guidance

## 🎯 Quick Navigation

### Human-Focused Documentation (This Directory)

- **[CI/CD Pipeline](./cicd/README.md)** - Complete deployment workflow documentation
- **[Bundle Optimization](./bundle-optimization.md)** - Performance monitoring and optimization
- **[Vercel Setup](./vercel-setup.md)** - Production hosting configuration

### AI Assistant Context (`.claude/` Directory)

- **[Project Overview](../.claude/context/project-overview.md)** - High-level project understanding
- **[Current Focus](../.claude/context/current-focus.md)** - Active development priorities
- **[Architecture](../.claude/context/architecture.md)** - System design and technology stack
- **[Development Flow](../.claude/context/development-flow.md)** - Local setup and workflows
- **[Implementation Patterns](../.claude/instructions/)** - Detailed coding guidelines

## 🚀 Getting Started

### For New Developers

1. **Read the [CI/CD Documentation](./cicd/README.md)** to understand our deployment process
2. **Follow the [Development Setup](../.claude/context/development-flow.md)** for local environment configuration
3. **Review [Project Constraints](../.claude/context/constraints.md)** for critical requirements

### For Project Management

1. **Check [Current Focus](../.claude/context/current-focus.md)** for active priorities
2. **Review [Architecture Overview](../.claude/context/architecture.md)** for system understanding
3. **Monitor [Bundle Optimization](./bundle-optimization.md)** for performance metrics

## 🔄 Documentation Strategy

### This Directory (`docs/`)

**Purpose**: Official project documentation for human readers
**Content**: High-level overviews, process documentation, setup guides
**Audience**: Developers, project managers, stakeholders
**Maintenance**: Updated with major changes and new processes

### AI Context Directory (`.claude/`)

**Purpose**: Comprehensive context for AI coding assistants
**Content**: Detailed implementation guidance, current state, constraints
**Audience**: AI assistants (Claude Code, etc.) and developers
**Maintenance**: Updated frequently as project evolves

### Content Philosophy

- **No Duplication**: Each piece of information has a single source of truth
- **Cross-References**: Documents link to related information in other directories
- **Optimization**: Each directory optimized for its primary audience
- **Completeness**: AI assistants get comprehensive context, humans get essential information

## 📊 Project Overview

**SlideHeroes** is a modern SaaS platform for creating and managing PowerPoint presentations with AI assistance.

### Technology Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase PostgreSQL, Payload CMS
- **Infrastructure**: Vercel, GitHub Actions CI/CD
- **Monitoring**: New Relic, Vercel Analytics

### Current Status

- **Version**: 2.11.0
- **Branch**: `dev` (active development)
- **Focus**: Documentation consolidation, performance optimization, security improvements

### Environments

- **Production**: `slideheroes.com`
- **Staging**: `staging.slideheroes.com`
- **Development**: `dev.slideheroes.com`

## 🛠️ Development Resources

### Essential Commands

```bash
# Development
pnpm dev                    # Start development servers
pnpm test                   # Run unit tests
pnpm typecheck              # TypeScript validation
pnpm lint                   # Code quality checks

# Database
pnpm supabase:web:start     # Start local Supabase
pnpm supabase:web:reset     # Reset local database

# Build & Deploy
pnpm build                  # Build all applications
# Deployment via git push to respective branches
```

### Key Configuration Files

- **[package.json](../package.json)** - Project dependencies and scripts
- **[turbo.json](../turbo.json)** - Monorepo build configuration
- **[biome.json](../biome.json)** - Code formatting and linting
- **[CLAUDE.md](../CLAUDE.md)** - AI assistant guidance

## 🔗 Related Resources

### Internal Documentation

- **[Complete AI Context](../.claude/README.md)** - Comprehensive project context for AI assistants
- **[Implementation Instructions](../.claude/instructions/)** - Detailed coding patterns and guidelines
- **[Historical Archive](../.claude/archive/)** - Past decisions and completed work

### External Resources

- **[Next.js Documentation](https://nextjs.org/docs)** - React framework
- **[Supabase Documentation](https://supabase.com/docs)** - Backend platform
- **[Payload CMS Documentation](https://payloadcms.com/docs)** - Content management
- **[Vercel Documentation](https://vercel.com/docs)** - Hosting platform

## 📝 Contributing

### Documentation Updates

1. **Human-facing docs** (this directory): Update for process changes, new features
2. **AI context** (`.claude/` directory): Update for implementation changes, constraints
3. **Cross-references**: Ensure links between directories remain accurate

### Code Contributions

1. **Read [Development Flow](../.claude/context/development-flow.md)** for setup and workflows
2. **Follow [Code Standards](../.claude/context/code-standards.md)** for quality requirements
3. **Respect [Constraints](../.claude/context/constraints.md)** for security and architecture limits

---

💡 **Note**: This documentation structure is designed to serve both human developers and AI coding assistants
effectively. For the most comprehensive and up-to-date project context, AI assistants should primarily reference the
`.claude/` directory.
