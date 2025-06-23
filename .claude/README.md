# Claude Code Documentation Hub

This directory contains comprehensive context and documentation optimized for AI coding assistants, particularly Claude Code.

## Quick Navigation

### 🎯 Start Here for Any Task
- **[Current Focus](./context/current-focus.md)** - What we're working on right now
- **[Project Overview](./context/project-overview.md)** - High-level project understanding  
- **[Code Standards](./context/code-standards.md)** - Coding patterns and requirements

### 🏗️ System Understanding
- **[Architecture](./context/architecture.md)** - System design and technology stack
- **[Database Schema](./context/database-schema.md)** - Data models and relationships
- **[CI/CD Pipeline](./context/cicd-pipeline.md)** - Deployment and testing workflows

### 🔧 Development Context
- **[Development Flow](./context/development-flow.md)** - Local setup and daily workflows
- **[Constraints](./context/constraints.md)** - Technical limitations and requirements
- **[Design Reviews](./context/DesignReview.md)** - Current UI/UX work
- **[Typography System](./context/TypographySystem.md)** - Design system guidelines
- **[Engineering Roles](./context/roles/)** - Specialized engineering role definitions
- **[Available Tools](./context/tools/)** - MCP tools and integrations documentation

### 📚 External Libraries & APIs
- **[External Documentation](./docs/)** - Comprehensive docs for all external libraries
  - [Payload CMS](./docs/payload/) - Content management system
  - [Supabase](./docs/supabase/) - Database and backend services
  - [Makerkit](./docs/makerkit/) - SaaS boilerplate framework
  - [Portkey](./docs/portkey/) - AI gateway and proxy
  - [PptxGenJS](./docs/pptxgenjs/) - PowerPoint generation
  - [DnD Kit](./docs/dndkit/) - Drag and drop functionality
  - [Lexical](./docs/lexical/) - Rich text editor
  - [Cloudflare](./docs/cloudflare/) - Edge services and storage

### 🛠️ Implementation Guidance
- **[Instructions](./instructions/)** - Detailed coding patterns and guidelines
  - [Build Process](./instructions/build/) - Sprint planning and development methodology
  - [Commands](./instructions/commands/) - Common development commands
  - [Workflows](./instructions/workflows/) - Step-by-step workflow guides
  - [Templates](./instructions/templates/) - Reusable development templates
  - [Payload Reference Setup](./instructions/payload-reference-setup.md)
  - [React Query Patterns](./instructions/react-query-patterns.md)
  - [Local DB Reset Guide](./instructions/local-db-reset/)
  - [Vercel Deployment Guide](./instructions/vercel-deployment-guide.md)
  - [Content Migration System](./instructions/content-migration-system/)

### 📜 Historical Context
- **[Archive](./archive/)** - Historical plans and completed work
  - [Plans](./archive/plans/) - Development planning documents
  - [Issues](./archive/issues/) - Resolved issue tracking and documentation
  - [Solutions](./archive/solutions/) - Problem resolution reports
  - [Specifications](./archive/specs/) - Completed feature specifications
  - [Quiz System Work](./archive/plans/quizzes/) - Extensive quiz relationship fixes
  - [PowerPoint Generation](./archive/plans/pptx/) - PPTX system implementation
  - [Script Cleanup](./archive/plans/repair/) - Code organization efforts

### 🔧 Active Development
- **[Scripts](./scripts/)** - Utility scripts for development and maintenance
- **[Tasks](./tasks/)** - Current task tracking and workflow documentation
- **[Prompt Snippets](./prompt-snippets/)** - Useful prompts for AI interactions
- **[Scratch](./scratch/)** - Temporary working files and active planning

## How to Use This Documentation

### For Claude Code Assistants
1. **Always read [Current Focus](./context/current-focus.md) first** to understand what we're actively working on
2. **Check [Constraints](./context/constraints.md)** before making any architectural decisions
3. **Reference [Code Standards](./context/code-standards.md)** for coding patterns and requirements
4. **Use the external docs** in `./docs/` when working with specific libraries

### For Understanding the Project
1. Start with [Architecture](./context/architecture.md) for system overview
2. Read [Database Schema](./context/database-schema.md) for data understanding
3. Check [Development Flow](./context/development-flow.md) for setup and workflows
4. Review [CI/CD Pipeline](./context/cicd-pipeline.md) for deployment understanding

### For Specific Implementation Tasks
1. Check if there's specific guidance in [Instructions](./instructions/)
2. Look for relevant external library docs in [./docs/](./docs/)
3. Reference historical context in [Archive](./archive/) for similar past work

## File Organization Principles

### Context Files (`./context/`)
**Purpose**: Current project state and understanding
**Audience**: AI assistants and developers
**Update Frequency**: Regularly, as project evolves

### External Documentation (`./docs/`)
**Purpose**: Reference documentation for external libraries
**Audience**: AI assistants needing API/framework details
**Update Frequency**: When library versions change

### Instructions (`./instructions/`)
**Purpose**: Specific implementation patterns and guides
**Audience**: AI assistants and developers
**Update Frequency**: When new patterns emerge

### Archive (`./archive/`)
**Purpose**: Historical context and completed work
**Audience**: Reference for similar future work
**Update Frequency**: When major initiatives complete

## Key Project Constraints (Quick Reference)

🚫 **Never expose API keys** - Use server actions only
🔒 **Always validate input** - Use Zod schemas everywhere  
⚡ **Prefer Server Components** - Client components only when needed
📝 **Use proper typing** - No `any` types, define interfaces
🛡️ **Follow RLS patterns** - Never bypass security policies
🔧 **Use enhanceAction** - For all server actions
🚨 **Implement error handling** - User-friendly messages

## Current Project Status

**Branch**: `dev`  
**Version**: 2.11.0  
**Focus**: Documentation consolidation, bundle optimization, security improvements  
**Architecture**: Next.js 15 + Supabase + Payload CMS  
**Deployment**: Vercel with multi-environment pipeline  

## Quick Commands

```bash
# Development
pnpm dev                    # Start all dev servers
pnpm test                   # Run unit tests
pnpm typecheck              # TypeScript checking
pnpm lint                   # Code quality checks

# Database
pnpm supabase:web:start     # Start local Supabase
pnpm supabase:web:reset     # Reset local database

# Build & Deploy
pnpm build                  # Build all applications
# Deployment via git push to respective branches
```

---

💡 **Tip**: This documentation is optimized for AI assistants. For human-readable project documentation, see the `docs/` directory in the project root.