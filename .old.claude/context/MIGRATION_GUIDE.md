# Documentation Migration Guide

This guide helps you find consolidated documentation in the new structure after migrating from 96 legacy files to 37 organized documents.

## Quick Navigation

- **Old location**: `.old.claude/context/` (96 files, 13 categories)
- **New location**: `.claude/docs/` (37 files, 4 categories)
- **Archive**: `.old.claude/context/_archived/` (20 archived files)

## New Structure Overview

```
.claude/docs/
├── README.md                    # Main documentation index
├── development/                 # 9 files (8 + README)
│   ├── README.md
│   ├── architecture-overview.md
│   ├── ccpm-system.md
│   ├── database-patterns.md
│   ├── makerkit-integration.md
│   ├── prime-framework.md
│   ├── react-query-patterns.md
│   ├── react-query-advanced.md
│   ├── server-actions.md
│   └── shadcn-ui-components.md
├── testing+quality/             # 7 files (6 + README)
│   ├── README.md
│   ├── accessibility-testing.md
│   ├── e2e-testing.md
│   ├── fundamentals.md
│   ├── integration-testing.md
│   ├── performance-testing.md
│   └── vitest-configuration.md
├── infrastructure/              # 14 files (13 + README)
│   ├── README.md
│   ├── auth-configuration.md
│   ├── auth-implementation.md
│   ├── auth-overview.md
│   ├── auth-security.md
│   ├── auth-troubleshooting.md
│   ├── ci-cd-complete.md
│   ├── database-seeding.md
│   ├── docker-setup.md
│   ├── docker-troubleshooting.md
│   ├── enhanced-logger.md
│   ├── newrelic-monitoring.md
│   ├── production-security.md
│   └── vercel-deployment.md
└── tools/                       # 11 files (10 + README)
    ├── README.md
    ├── cli-references.md
    ├── context7.md
    ├── docs-mcp-server.md
    ├── exa-search.md
    ├── git-aliases.md
    ├── mcp-servers.md
    ├── perplexity.md
    ├── portkey-ai-gateway.md
    ├── supabase-cli.md
    └── vercel-cli.md
```

## File Migration Mapping

### Development Files

| Old Location | New Location | Notes |
|-------------|--------------|-------|
| `foundation/architecture/project-architecture.md` | `development/architecture-overview.md` | Core architecture |
| `data/models.md` | `development/database-patterns.md` | Consolidated |
| `data/relationship-tables-management.md` | `development/database-patterns.md` | Consolidated |
| `data/migrations/overview.md` | `development/database-patterns.md` | Consolidated |
| `data/migrations/patterns.md` | `development/database-patterns.md` | Consolidated |
| `integrations/api/api-patterns.md` | `development/server-actions.md` | Consolidated |
| `integrations/api/endpoints.md` | `development/server-actions.md` | Consolidated |
| `integrations/api/headers.md` | `development/server-actions.md` | Consolidated |
| `foundation/architecture/service-patterns.md` | `development/server-actions.md` | Consolidated |
| `development/standards/react-query-patterns.md` | `development/react-query-patterns.md` | Direct copy, split |
| — | `development/react-query-advanced.md` | New split file |
| `development/ui/shadcn-ui-components.md` | `development/shadcn-ui-components.md` | Direct copy |
| `development/tooling/claude-code/prime-framework.md` | `development/prime-framework.md` | Direct copy |
| `development/tooling/pm/ccpm-system-overview.md` | `development/ccpm-system.md` | Direct copy |
| `development/standards/frameworks/makerkit/template-usage.md` | `development/makerkit-integration.md` | Consolidated |
| `development/standards/frameworks/makerkit/upstream-sync.md` | `development/makerkit-integration.md` | Consolidated |
| `development/workflows/merge-automation.md` | `development/makerkit-integration.md` | Consolidated |

### Testing Files

| Old Location | New Location | Notes |
|-------------|--------------|-------|
| `testing/fundamentals/testing-fundamentals.md` | `testing+quality/fundamentals.md` | Consolidated |
| `testing/fundamentals/testing-examples.md` | `testing+quality/fundamentals.md` | Consolidated |
| `testing/fundamentals/typescript-test-patterns.md` | `testing+quality/fundamentals.md` | Consolidated |
| `testing/fundamentals/mocking-and-typescript.md` | `testing+quality/fundamentals.md` | Consolidated |
| `testing/integration/integration-testing-fundamentals.md` | `testing+quality/integration-testing.md` | Consolidated |
| `testing/integration/integration-testing-patterns.md` | `testing+quality/integration-testing.md` | Consolidated |
| `testing/integration/integration-testing-examples.md` | `testing+quality/integration-testing.md` | Consolidated |
| `testing/integration/integration-testing-troubleshooting.md` | `testing+quality/integration-testing.md` | Consolidated |
| `testing/infrastructure/vitest-unit-testing.md` | `testing+quality/vitest-configuration.md` | Consolidated |
| `testing/unit/vitest-setup.md` | `testing+quality/vitest-configuration.md` | Consolidated |
| `testing/e2e/e2e-testing-fundamentals.md` | `testing+quality/e2e-testing.md` | Direct copy |
| `testing/specialized/accessibility-testing-fundamentals.md` | `testing+quality/accessibility-testing.md` | Direct copy |
| `testing/specialized/performance-testing-fundamentals.md` | `testing+quality/performance-testing.md` | Direct copy |

### Infrastructure Files

| Old Location | New Location | Notes |
|-------------|--------------|-------|
| `infrastructure/ci-cd/cicd-llm-context.md` | `infrastructure/ci-cd-complete.md` | Consolidated |
| `infrastructure/ci-cd/CI_CD_INVENTORY.md` | `infrastructure/ci-cd-complete.md` | Consolidated |
| `infrastructure/ci-cd/pipeline-design.md` | `infrastructure/ci-cd-complete.md` | Consolidated |
| `data/migrations/ci-cd.md` | `infrastructure/ci-cd-complete.md` | Consolidated |
| `infrastructure/ci-cd/PRODUCTION_PROTECTION_PRIVATE_REPO.md` | `infrastructure/production-security.md` | Direct copy |
| `infrastructure/deployment/docker-architecture.md` | `infrastructure/docker-setup.md` | Consolidated |
| `infrastructure/deployment/docker-setup.md` | `infrastructure/docker-setup.md` | Consolidated |
| `infrastructure/deployment/docker-containers-management.md` | `infrastructure/docker-setup.md` | Consolidated |
| `foundation/architecture/test-architecture.md` (Docker sections) | `infrastructure/docker-setup.md` | Consolidated |
| `infrastructure/deployment/docker-troubleshooting.md` | `infrastructure/docker-troubleshooting.md` | Consolidated |
| `infrastructure/docker-health-debugging.md` | `infrastructure/docker-troubleshooting.md` | Consolidated |
| `infrastructure/deployment/vercel/vercel-deployment-guide.md` | `infrastructure/vercel-deployment.md` | Direct copy |
| `infrastructure/deployment/database-seeding-strategy.md` | `infrastructure/database-seeding.md` | Direct copy |
| `operations/monitoring/enhanced-logger.md` | `infrastructure/enhanced-logger.md` | Direct copy |
| `operations/observability/newrelic.md` | `infrastructure/newrelic-monitoring.md` | Direct copy |
| `security/auth/overview.md` | `infrastructure/auth-overview.md` | Direct copy |
| `security/auth/implementation.md` | `infrastructure/auth-implementation.md` | Direct copy |
| `security/auth/configuration.md` | `infrastructure/auth-configuration.md` | Direct copy |
| `security/auth/security.md` | `infrastructure/auth-security.md` | Direct copy |
| `security/auth/troubleshooting.md` | `infrastructure/auth-troubleshooting.md` | Direct copy |

### Tools Files

| Old Location | New Location | Notes |
|-------------|--------------|-------|
| `tools/cli/supabase-cli.md` | `tools/supabase-cli.md` | Split from cli-references |
| `tools/cli/vercel-cli.md` | `tools/vercel-cli.md` | Split from cli-references |
| `tools/cli/cli.md` | `tools/cli-references.md` | Consolidated, split |
| `integrations/services/mcp-servers.md` | `tools/mcp-servers.md` | Direct copy |
| `integrations/services/docs-mcp-server.md` | `tools/docs-mcp-server.md` | Direct copy |
| `integrations/services/portkey-implementation.md` | `tools/portkey-ai-gateway.md` | Direct copy |
| `tools/integrations/git-aliases.md` | `tools/git-aliases.md` | Direct copy |
| `tools/integrations/exa-search.md` | `tools/exa-search.md` | Direct copy |
| `tools/integrations/perplexity.md` | `tools/perplexity.md` | Direct copy |
| `tools/integrations/context7.md` | `tools/context7.md` | Direct copy |

## Archived Files

These files were moved to `.old.claude/context/_archived/` and are no longer in active documentation:

### Duplicates
- `development/workflows/feature-implementation-workflow.md` → Duplicates CCPM documentation
- `foundation/project-overview.md` → Superseded by project-architecture.md

### Incomplete/Trivial
- `data/schema.md` → Only 1 line, incomplete
- `operations/maintenance/bash-working-directory.md` → Trivial content

### Deprecated Technology (Payload CMS)
- `development/tooling/payload/update-payload-version.md`
- `development/tooling/payload/create-payload-custom-component.md`
- `tools/payload/seeding-guide.md`
- `tools/payload/seeding-architecture.md`
- `tools/payload/seeding-troubleshooting.md`

### Project-Specific UI
- `development/standards/typography-system.md` → Not AI guidance

### Legacy Agent Roles (17 files)
- All files from `team/roles/*.md` → Streamlined agent system now

See [_archived/README.md](./_archived/README.md) for complete archive details.

## Finding Content

### By Keyword Search

```bash
# Search all new documentation
grep -r "keyword" .claude/docs/

# Search specific category
grep -r "keyword" .claude/docs/development/
grep -r "keyword" .claude/docs/testing+quality/
grep -r "keyword" .claude/docs/infrastructure/
grep -r "keyword" .claude/docs/tools/
```

### By Topic

| Topic | Location |
|-------|----------|
| Architecture | `development/architecture-overview.md` |
| Database | `development/database-patterns.md` |
| API/Actions | `development/server-actions.md` |
| React Query | `development/react-query-patterns.md` |
| Testing | `testing+quality/fundamentals.md` |
| E2E Tests | `testing+quality/e2e-testing.md` |
| CI/CD | `infrastructure/ci-cd-complete.md` |
| Docker | `infrastructure/docker-setup.md` |
| Auth | `infrastructure/auth-overview.md` |
| Deployment | `infrastructure/vercel-deployment.md` |
| CLI | `tools/cli-references.md` |
| MCP | `tools/mcp-servers.md` |

### By Use Case

| Use Case | Start Here |
|----------|------------|
| Building a feature | `development/README.md` |
| Writing tests | `testing+quality/README.md` |
| Deploying | `infrastructure/README.md` |
| Using CLI tools | `tools/README.md` |
| Understanding architecture | `development/architecture-overview.md` |
| Database work | `development/database-patterns.md` |
| Auth implementation | `infrastructure/auth-overview.md` |

## Key Improvements

### Consolidation Benefits

- **67% fewer files**: 96 → 37 files
- **Better organization**: 4 logical categories vs 13 fragmented ones
- **No duplication**: Removed redundant content
- **Optimal size**: All files < 2,500 tokens (~1,900 words)
- **Better discovery**: Clear README files with quick reference

### Quality Enhancements

- **Consistent structure**: All files follow same format
- **Clear metadata**: Frontmatter with purpose, tags, relationships
- **Cross-references**: Related files clearly linked
- **Focused content**: Each file has clear, specific purpose
- **Better examples**: Kept best examples, removed redundancy

### Navigation Improvements

- **Category READMEs**: Overview and quick reference for each category
- **Main README**: Central hub with quick links
- **Cross-links**: Files reference related documentation
- **Search-friendly**: Consistent naming and organization

## Migration Timeline

- **Consolidated**: 2025-11-14
- **Documentation version**: 2.0.0
- **Old structure**: Preserved at `.old.claude/context/`
- **Archive**: `.old.claude/context/_archived/`

## Questions?

### Can't find something?

1. Check this migration guide for file mapping
2. Search: `grep -r "keyword" .claude/docs/`
3. Review category README: `.claude/docs/[category]/README.md`
4. Check archive: `.old.claude/context/_archived/README.md`

### Need the old file?

Old files are preserved at `.old.claude/context/` for reference. You can still access them, but they won't be maintained going forward.

### Want to restore an archived file?

```bash
cp .old.claude/context/_archived/[filename] [new-location]
```

### Something missing?

If content is missing from the new documentation, it may have been:
1. Consolidated into a related file (check cross-references)
2. Archived as duplicate/deprecated (check archive README)
3. Removed as incomplete/trivial

---

*Migration completed: 2025-11-14*
*For questions, consult category README files or main documentation at `.claude/docs/README.md`*
