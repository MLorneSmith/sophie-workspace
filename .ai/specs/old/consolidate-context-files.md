# Chore: Consolidate Context Documentation Files

## Chore Description

Consolidate 96 legacy context files from `.old.claude/context/` into 4 logical groups within `.claude/docs/`, reducing duplication and organizing documentation by purpose. The consolidation will:

1. Remove 20 duplicate, incomplete, or deprecated files
2. Consolidate 40 overlapping files into 15 well-structured documents
3. Keep 20 files as-is with minor organization
4. Ensure no single file exceeds 2500 tokens
5. Organize into 4 directories: `development/`, `testing+quality/`, `infrastructure/`, and `tools/`

**Expected Outcome**: Reduce from 96 files (~30,500 lines) to ~32 files (~14,000 lines) with 67% fewer files and improved maintainability.

## Relevant Files

### Source Files (To Be Processed)

- `.old.claude/context/**/*.md` - 96 legacy context files across 13 categories
  - Foundation & architecture files (7 files)
  - Development standards & workflows (8 files)
  - Testing documentation (13 files)
  - Infrastructure & deployment (14 files)
  - Security & auth (5 files)
  - Data & migrations (6 files)
  - Integrations & APIs (7 files)
  - Operations & monitoring (4 files)
  - Team roles (17 files - to be archived)
  - Tools & CLI references (9 files)

### Target Directories

- `.claude/docs/development/` - Core development patterns and frameworks
- `.claude/docs/testing+quality/` - Testing strategies across all levels
- `.claude/docs/infrastructure/` - Deployment, CI/CD, security, and operations
- `.claude/docs/tools/` - External services and specialized utilities

### New Files

#### Group 1: Development (8 files)

- `.claude/docs/development/react-query-patterns.md` - TanStack Query patterns
- `.claude/docs/development/makerkit-integration.md` - MakerKit template usage & sync
- `.claude/docs/development/shadcn-ui-components.md` - UI component inventory
- `.claude/docs/development/prime-framework.md` - PRIME methodology for commands
- `.claude/docs/development/ccpm-system.md` - CCPM parallel execution system
- `.claude/docs/development/database-patterns.md` - Database, RLS, and migration patterns
- `.claude/docs/development/server-actions.md` - API patterns and server actions
- `.claude/docs/development/architecture-overview.md` - System architecture reference

#### Group 2: Testing & Quality (6 files)

- `.claude/docs/testing+quality/fundamentals.md` - Core testing principles and patterns
- `.claude/docs/testing+quality/integration-testing.md` - Integration test strategies
- `.claude/docs/testing+quality/e2e-testing.md` - Playwright E2E patterns
- `.claude/docs/testing+quality/accessibility-testing.md` - A11y testing approaches
- `.claude/docs/testing+quality/performance-testing.md` - Performance test patterns
- `.claude/docs/testing+quality/vitest-configuration.md` - Vitest setup and config

#### Group 3: Infrastructure (13 files)

- `.claude/docs/infrastructure/ci-cd-complete.md` - Comprehensive CI/CD guide
- `.claude/docs/infrastructure/production-security.md` - Production protection patterns
- `.claude/docs/infrastructure/docker-setup.md` - Docker configuration
- `.claude/docs/infrastructure/docker-troubleshooting.md` - Docker debugging guide
- `.claude/docs/infrastructure/vercel-deployment.md` - Vercel deployment patterns
- `.claude/docs/infrastructure/database-seeding.md` - Database seeding strategies
- `.claude/docs/infrastructure/enhanced-logger.md` - Logging patterns
- `.claude/docs/infrastructure/newrelic-monitoring.md` - New Relic integration
- `.claude/docs/infrastructure/auth-overview.md` - Authentication architecture
- `.claude/docs/infrastructure/auth-implementation.md` - Auth implementation details
- `.claude/docs/infrastructure/auth-configuration.md` - Auth configuration guide
- `.claude/docs/infrastructure/auth-security.md` - Auth security patterns
- `.claude/docs/infrastructure/auth-troubleshooting.md` - Auth debugging

#### Group 4: Tools (8 files)

- `.claude/docs/tools/mcp-servers.md` - MCP server integration
- `.claude/docs/tools/docs-mcp-server.md` - Documentation MCP tool
- `.claude/docs/tools/portkey-ai-gateway.md` - AI gateway patterns
- `.claude/docs/tools/git-aliases.md` - Git automation
- `.claude/docs/tools/exa-search.md` - Exa search integration
- `.claude/docs/tools/perplexity.md` - Perplexity integration
- `.claude/docs/tools/context7.md` - Context7 integration
- `.claude/docs/tools/cli-references.md` - Supabase & Vercel CLI guides

### Archive Directory

- `.old.claude/context/_archived/` - Archive location for removed files

## Step by Step Tasks

### Step 1: Create Archive Directory and Remove Files

- Create `.old.claude/context/_archived/` directory for removed files
- Move duplicate files to archive:
  - `development/workflows/feature-implementation-workflow.md` (duplicates CCPM)
  - `foundation/project-overview.md` (keep project-architecture.md instead)
- Move incomplete/trivial files to archive:
  - `data/schema.md` (only 1 line)
  - `operations/maintenance/bash-working-directory.md` (trivial)
- Move deprecated Payload CMS files to archive:
  - `development/tooling/payload/update-payload-version.md`
  - `development/tooling/payload/create-payload-custom-component.md`
  - `tools/payload/seeding-guide.md`
  - `tools/payload/seeding-architecture.md`
  - `tools/payload/seeding-troubleshooting.md`
- Move project-specific UI file to archive:
  - `development/standards/typography-system.md`
- Move all 17 legacy agent role files to archive:
  - `team/roles/*.md` (entire directory)
- Document archived files in `.old.claude/context/_archived/README.md` with reasons

### Step 2: Consolidate Development Files

- Create `.claude/docs/development/architecture-overview.md`:
  - Source: `foundation/architecture/project-architecture.md`
  - Include: System overview, monorepo structure, technology stack, core patterns
  - Split if exceeds 2500 tokens into architecture-overview.md + architecture-patterns.md
- Create `.claude/docs/development/database-patterns.md`:
  - Consolidate: `data/models.md`, `data/relationship-tables-management.md`, `data/migrations/overview.md`, `data/migrations/patterns.md`
  - Include: RLS patterns, migration workflows, junction tables, type safety
  - Ensure < 2500 tokens by focusing on patterns, not exhaustive examples
- Create `.claude/docs/development/server-actions.md`:
  - Consolidate: `integrations/api/api-patterns.md`, `integrations/api/endpoints.md`, `integrations/api/headers.md`, `foundation/architecture/service-patterns.md`
  - Include: enhanceAction pattern, server action conventions, error handling
  - Ensure < 2500 tokens
- Copy directly (already well-sized):
  - `development/standards/react-query-patterns.md` → `development/react-query-patterns.md`
  - `development/ui/shadcn-ui-components.md` → `development/shadcn-ui-components.md`
  - `development/tooling/claude-code/prime-framework.md` → `development/prime-framework.md`
  - `development/tooling/pm/ccpm-system-overview.md` → `development/ccpm-system.md`
- Create `.claude/docs/development/makerkit-integration.md`:
  - Consolidate: `development/standards/frameworks/makerkit/template-usage.md`, `development/standards/frameworks/makerkit/upstream-sync.md`, `development/workflows/merge-automation.md`
  - Include: Template integration, upstream syncing, merge automation
  - Ensure < 2500 tokens

### Step 3: Consolidate Testing Files

- Create `.claude/docs/testing+quality/fundamentals.md`:
  - Consolidate: `testing/fundamentals/testing-fundamentals.md`, `testing/fundamentals/testing-examples.md`, `testing/fundamentals/typescript-test-patterns.md`, `testing/fundamentals/mocking-and-typescript.md`
  - Include: Core principles, type-safe mocking, common patterns
  - Ensure < 2500 tokens by removing redundant examples
- Create `.claude/docs/testing+quality/integration-testing.md`:
  - Consolidate: `testing/integration/integration-testing-fundamentals.md`, `testing/integration/integration-testing-patterns.md`, `testing/integration/integration-testing-examples.md`, `testing/integration/integration-testing-troubleshooting.md`
  - Focus on unique patterns, remove duplicate content
  - Ensure < 2500 tokens
- Create `.claude/docs/testing+quality/vitest-configuration.md`:
  - Consolidate: `testing/infrastructure/vitest-unit-testing.md`, `testing/unit/vitest-setup.md`
  - Include: Configuration, workspace setup, common patterns
  - Ensure < 2500 tokens
- Copy directly (already well-sized):
  - `testing/e2e/e2e-testing-fundamentals.md` → `testing+quality/e2e-testing.md`
  - `testing/specialized/accessibility-testing-fundamentals.md` → `testing+quality/accessibility-testing.md`
  - `testing/specialized/performance-testing-fundamentals.md` → `testing+quality/performance-testing.md`

### Step 4: Consolidate Infrastructure Files

- Create `.claude/docs/infrastructure/ci-cd-complete.md`:
  - Consolidate: `infrastructure/ci-cd/cicd-llm-context.md`, `infrastructure/ci-cd/CI_CD_INVENTORY.md`, `infrastructure/ci-cd/pipeline-design.md`, `data/migrations/ci-cd.md`
  - Include: Pipeline design, workflow patterns, migration automation
  - If exceeds 2500 tokens, split into ci-cd-workflows.md + ci-cd-patterns.md
- Copy directly:
  - `infrastructure/ci-cd/PRODUCTION_PROTECTION_PRIVATE_REPO.md` → `infrastructure/production-security.md`
- Create `.claude/docs/infrastructure/docker-setup.md`:
  - Consolidate: `infrastructure/deployment/docker-architecture.md`, `infrastructure/deployment/docker-setup.md`, `infrastructure/deployment/docker-containers-management.md`, `foundation/architecture/test-architecture.md` (Docker sections only)
  - Include: Container orchestration, test containers, compose files
  - Ensure < 2500 tokens
- Create `.claude/docs/infrastructure/docker-troubleshooting.md`:
  - Consolidate: `infrastructure/deployment/docker-troubleshooting.md`, `infrastructure/docker-health-debugging.md`
  - Include: Common issues, health checks, debugging strategies
  - Ensure < 2500 tokens
- Copy directly (already well-sized):
  - `infrastructure/deployment/vercel/vercel-deployment-guide.md` → `infrastructure/vercel-deployment.md`
  - `infrastructure/deployment/database-seeding-strategy.md` → `infrastructure/database-seeding.md`
  - `operations/monitoring/enhanced-logger.md` → `infrastructure/enhanced-logger.md`
  - `operations/observability/newrelic.md` → `infrastructure/newrelic-monitoring.md`
- Copy auth files directly (well-structured set):
  - `security/auth/overview.md` → `infrastructure/auth-overview.md`
  - `security/auth/implementation.md` → `infrastructure/auth-implementation.md`
  - `security/auth/configuration.md` → `infrastructure/auth-configuration.md`
  - `security/auth/security.md` → `infrastructure/auth-security.md`
  - `security/auth/troubleshooting.md` → `infrastructure/auth-troubleshooting.md`

### Step 5: Consolidate Tools Files

- Create `.claude/docs/tools/cli-references.md`:
  - Consolidate: `tools/cli/supabase-cli.md`, `tools/cli/vercel-cli.md`, `tools/cli/cli.md`
  - Include: Command reference, common workflows, troubleshooting
  - Ensure < 2500 tokens
- Copy directly (already well-sized):
  - `integrations/services/mcp-servers.md` → `tools/mcp-servers.md`
  - `integrations/services/docs-mcp-server.md` → `tools/docs-mcp-server.md`
  - `integrations/services/portkey-implementation.md` → `tools/portkey-ai-gateway.md`
  - `tools/integrations/git-aliases.md` → `tools/git-aliases.md`
  - `tools/integrations/exa-search.md` → `tools/exa-search.md`
  - `tools/integrations/perplexity.md` → `tools/perplexity.md`
  - `tools/integrations/context7.md` → `tools/context7.md`

### Step 6: Validate Token Counts

- Use token counting tool to verify each file < 2500 tokens:
  - `wc -w <file>` as rough estimate (1 word ≈ 1.3 tokens)
  - Target: < 1900 words per file (≈ 2500 tokens)
- For files exceeding limit:
  - Split into logical sections (e.g., overview + patterns, setup + troubleshooting)
  - Move detailed examples to separate reference files
  - Link related files with cross-references
- Document splits in file headers with "See also" sections

### Step 7: Create Index Files

- Create `.claude/docs/README.md`:
  - Overview of documentation structure
  - Links to each category
  - Quick reference for common tasks
  - Migration notes from old structure
- Create category index files:
  - `.claude/docs/development/README.md`
  - `.claude/docs/testing+quality/README.md`
  - `.claude/docs/infrastructure/README.md`
  - `.claude/docs/tools/README.md`
- Include file purpose, prerequisites, and related documents in each index

### Step 8: Update Cross-References

- Update internal links in consolidated files:
  - Replace `[[old-file-name]]` with new file paths
  - Update "See also" sections
  - Fix broken references from removed files
- Add cross-references between related documents:
  - Development ↔ Testing (test patterns for features)
  - Infrastructure ↔ Tools (CI/CD with CLI tools)
  - Development ↔ Infrastructure (deployment patterns)

### Step 9: Create Migration Guide

- Create `.old.claude/context/MIGRATION_GUIDE.md`:
  - Mapping from old file structure to new structure
  - Table of removed files and their replacement locations
  - Archived files list with archive reasons
  - Instructions for finding consolidated content
- Include command to search new structure:
  - `grep -r "keyword" .claude/docs/`

### Step 10: Run Validation Commands

- Verify all new files created successfully
- Check token counts are within limits
- Validate markdown syntax
- Ensure no broken internal links
- Verify archive directory contains expected files

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `find .claude/docs -type f -name "*.md" | wc -l` - Should show ~35 files (32 content + 4 README + migration guide)
- `find .old.claude/context/_archived -type f -name "*.md" | wc -l` - Should show 20 archived files
- `for file in .claude/docs/**/*.md; do echo "$file: $(wc -w < "$file") words"; done | awk '$2 > 1900 {print "⚠️ " $0}'` - Flag files exceeding ~1900 words (≈2500 tokens)
- `markdownlint .claude/docs/**/*.md` - Validate markdown syntax (if installed)
- `grep -r "\[\[" .claude/docs/ | grep -v "http"` - Find broken wiki-style links
- `ls -la .claude/docs/development/ | wc -l` - Should show 8 files + README
- `ls -la .claude/docs/testing+quality/ | wc -l` - Should show 6 files + README
- `ls -la .claude/docs/infrastructure/ | wc -l` - Should show 13 files + README
- `ls -la .claude/docs/tools/ | wc -l` - Should show 8 files + README
- `test -f .old.claude/context/MIGRATION_GUIDE.md && echo "Migration guide exists" || echo "Missing migration guide"` - Verify migration guide created
- `test -f .claude/docs/README.md && echo "Main README exists" || echo "Missing main README"` - Verify main index exists

## Notes

### Token Counting Strategy

- Use word count as proxy: 1 word ≈ 1.3 tokens on average
- Target: < 1900 words per file to stay safely under 2500 tokens
- Markdown formatting (headers, lists, code blocks) increases token count slightly
- For files approaching limit, prioritize:
  1. Keep core concepts and patterns
  2. Summarize detailed examples
  3. Link to related files for additional detail
  4. Move exhaustive reference material to appendices

### File Splitting Guidelines

If a consolidated file exceeds 2500 tokens, split using these patterns:

- **Overview + Patterns**: `topic-overview.md` + `topic-patterns.md`
- **Setup + Troubleshooting**: `topic-setup.md` + `topic-troubleshooting.md`
- **Fundamentals + Advanced**: `topic-fundamentals.md` + `topic-advanced.md`
- **Reference + Examples**: `topic-reference.md` + `topic-examples.md`

### Consolidation Priority

When consolidating, prefer:

1. Most recently updated content
2. Content with specific examples over generic descriptions
3. Content with clear actionable steps
4. Content that references current project structure

### Quality Checks

Each consolidated file should:

- Start with clear purpose statement (2-3 sentences)
- Include table of contents for files > 500 words
- Use consistent header hierarchy (H1 for title, H2 for sections, H3 for subsections)
- Include "Related Files" section linking to complementary docs
- End with "See Also" section for deeper dives

### Archive Policy

Files are archived (not deleted) if they are:

- Duplicates of other content
- Incomplete or placeholder content
- Deprecated technology/patterns
- Project-specific UI details (not AI guidance)
- Legacy architecture no longer in use

This preserves historical context while cleaning up active documentation.
