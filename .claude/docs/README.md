# SlideHeroes Documentation

Consolidated technical documentation for the SlideHeroes AI-powered presentation platform.

## Overview

This documentation has been organized into four main categories to improve maintainability and reduce duplication. Previously 96 files (~30,500 lines), now consolidated into ~37 well-structured documents (~14,000 lines) for 67% reduction in file count.

## Documentation Structure

### 📁 [Development](./development/)
Core development patterns, frameworks, and architectural guidance.

- **Architecture & Patterns**: System design, service patterns, database patterns
- **Frameworks & Tools**: MakerKit integration, React Query, PRIME framework, CCPM system
- **UI & Components**: Shadcn UI components, React patterns
- **API & Actions**: Server actions, API patterns, error handling

### 🧪 [Testing & Quality](./testing+quality/)
Comprehensive testing strategies across all levels.

- **Fundamentals**: Core testing principles, TypeScript patterns, mocking strategies
- **Test Types**: Unit, integration, E2E (Playwright), accessibility, performance
- **Configuration**: Vitest setup, test organization, coverage requirements
- **Troubleshooting**: Common issues and debugging approaches

### 🚀 [Infrastructure](./infrastructure/)
Deployment, CI/CD, security, and operational patterns.

- **CI/CD**: Pipeline design, workflow patterns, automation
- **Deployment**: Docker setup, Vercel configuration, production security
- **Database**: Seeding strategies, migration automation
- **Auth**: Supabase Auth with RBAC (5 comprehensive docs)
- **Monitoring**: Enhanced logging, New Relic integration

### 🔧 [Tools](./tools/)
External services, CLI references, and specialized utilities.

- **CLI Tools**: Supabase CLI, Vercel CLI, project scripts
- **MCP Servers**: 8 active servers for enhanced capabilities
- **AI Services**: Portkey gateway, Exa search, Perplexity, Context7
- **Version Control**: Git aliases and automation

## Quick Reference

### Common Development Tasks

| Task | Documentation |
|------|---------------|
| Setting up React Query | [development/react-query-patterns.md](./development/react-query-patterns.md) |
| Writing server actions | [development/server-actions.md](./development/server-actions.md) |
| Database migrations | [development/database-patterns.md](./development/database-patterns.md) |
| UI components | [development/shadcn-ui-components.md](./development/shadcn-ui-components.md) |

### Common Testing Tasks

| Task | Documentation |
|------|---------------|
| Writing unit tests | [testing+quality/fundamentals.md](./testing+quality/fundamentals.md) |
| Integration testing | [testing+quality/integration-testing.md](./testing+quality/integration-testing.md) |
| E2E with Playwright | [testing+quality/e2e-testing.md](./testing+quality/e2e-testing.md) |
| Vitest configuration | [testing+quality/vitest-configuration.md](./testing+quality/vitest-configuration.md) |

### Common Infrastructure Tasks

| Task | Documentation |
|------|---------------|
| CI/CD workflows | [infrastructure/ci-cd-complete.md](./infrastructure/ci-cd-complete.md) |
| Docker setup | [infrastructure/docker-setup.md](./infrastructure/docker-setup.md) |
| Vercel deployment | [infrastructure/vercel-deployment.md](./infrastructure/vercel-deployment.md) |
| Database seeding | [infrastructure/database-seeding.md](./infrastructure/database-seeding.md) |
| Auth setup | [infrastructure/auth-overview.md](./infrastructure/auth-overview.md) |

### Common Tool Tasks

| Task | Documentation |
|------|---------------|
| Supabase commands | [tools/supabase-cli.md](./tools/supabase-cli.md) |
| Vercel commands | [tools/vercel-cli.md](./tools/vercel-cli.md) |
| MCP servers | [tools/mcp-servers.md](./tools/mcp-servers.md) |
| AI gateway | [tools/portkey-ai-gateway.md](./tools/portkey-ai-gateway.md) |

## Migration from Old Structure

The previous documentation at `.old.claude/context/` has been consolidated. See [Migration Guide](./../.old.claude/context/MIGRATION_GUIDE.md) for a complete mapping of old to new file locations.

### Key Changes

1. **96 files → 37 files**: Removed duplicates, archived deprecated content
2. **Logical grouping**: Organized by purpose (development, testing, infrastructure, tools)
3. **Token limits**: All files under 2,500 tokens (~1,900 words) for optimal LLM context
4. **Better cross-referencing**: Related files clearly linked
5. **Consistent structure**: Standardized frontmatter, headers, and organization

### Finding Content

Search across all documentation:
```bash
# Search by keyword
grep -r "keyword" .claude/docs/

# Find files by pattern
find .claude/docs -name "*pattern*"

# Count total documentation
find .claude/docs -type f -name "*.md" | wc -l
```

## Documentation Standards

All documentation follows these standards:

### File Structure
- Clear purpose statement (2-3 sentences)
- Consistent header hierarchy (H1 title, H2 sections, H3 subsections)
- Table of contents for files > 500 words
- Related Files section linking to complementary docs
- See Also section for external references

### Metadata (Frontmatter)
- Unique ID for cross-referencing
- Title, version, category
- Description and tags
- Dependencies and cross-references
- Creation and update dates

### Content Guidelines
- Focus on patterns over exhaustive examples
- Include specific, actionable code examples
- Prefer recent content over deprecated patterns
- Remove redundancy across files
- Maintain under 1,900 words per file

## Contributing

When updating documentation:

1. **Maintain token limits**: Keep files under 1,900 words
2. **Update cross-references**: Link related documentation
3. **Use consistent formatting**: Follow existing patterns
4. **Update category indexes**: Reflect changes in README files
5. **Test examples**: Ensure code samples work with current versions

## Archive Policy

Archived files (`.old.claude/context/_archived/`) are preserved for historical reference but removed from active documentation. Files are archived if they are:

- Duplicates of other content
- Incomplete or placeholder content
- Deprecated technology/patterns (e.g., Payload CMS)
- Project-specific UI details not relevant to AI guidance
- Legacy architecture no longer in use

See [Archive README](./../.old.claude/context/_archived/README.md) for the complete list of archived files and reasons.

## Support

For questions about this documentation structure:
- Check the Migration Guide for old → new file mappings
- Search across documentation with `grep -r "keyword" .claude/docs/`
- Review category README files for specific topics
- Consult CLAUDE.md for project-wide guidance

---

*Last consolidated: 2025-11-14*
*Documentation version: 2.0.0*
