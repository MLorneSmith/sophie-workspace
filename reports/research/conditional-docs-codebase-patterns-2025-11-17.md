# Conditional Documentation Feature - Codebase Research Summary

## Executive Summary

The SlideHeroes project has a mature infrastructure for managing AI-driven development with well-established patterns for commands, documentation, configuration, and metadata. The codebase provides clear guidance for implementing the conditional documentation feature with specific patterns for YAML metadata, file organization, and command routing.

---

## 1. Project Structure & Conventions

### Repository Overview
- **Type**: Monorepo (pnpm workspaces)
- **Structure**: 
  - `apps/` - Multiple applications (web, payload, e2e, dev-tool)
  - `packages/` - Shared libraries and utilities
  - `.claude/` - Claude Code configuration and commands
  - `.ai/` - AI-specific documentation, scripts, and specifications

### Project Foundation
- **Main Project File**: `CLAUDE.md` - Comprehensive project conventions and standards
- **Core Tech Stack**: Next.js 16, React 19.2, TypeScript, Supabase, Tailwind CSS, Shadcn UI
- **Key Patterns**: Server Components, Server Actions, RLS, PRIME framework for commands

---

## 2. Command Structure & Patterns

### Command File Organization
**Location**: `.claude/commands/*.md`
**Current Count**: 21 commands

### Command File Format
Each command is a markdown file with YAML frontmatter:

```yaml
---
description: Brief description of what the command does
argument-hint: [optional] Format of arguments (e.g., [agent-name] [type] [scope])
model: [haiku|sonnet] - Model to use for execution
allowed-tools: [List of allowed tools/capabilities]
category: [optional] (e.g., development, infrastructure)
mcp-tools: [optional] MCP tools available
---
```

**Example from conditional_docs.md**:
```yaml
---
description: Determine what documentation you should read based on specific changes needed
argument-hint: [agent-name] [type] [scope]
model: haiku
allowed-tools: [Bash(git add:*), Bash(git commit:*), Bash(git diff:*), Bash(git status:*), Bash(git log:*), Read, Grep]
---
```

### Command Patterns Observed

1. **Simple Wrapper Commands** (`start.md`, `prime.md`, `tools.md`)
   - Just execute shell scripts or basic instructions
   - <200 lines total

2. **Complex PRIME Commands** (`codecheck.md`, `test.md`, `diagnose.md`)
   - Extensive instructions using PRIME framework
   - Purpose → Role → Inputs → Method → Expectations structure
   - Multiple help sections with examples
   - TodoWrite integration for progress tracking
   - 300-400+ lines

3. **Interactive Commands** (`feature.md`, `commit.md`)
   - User questionnaires and interviews
   - Multiple decision branches
   - Git integration for creating issues/PRs
   - Heavy context discovery

### Key Insights for Command Development
- Commands reference documentation with paths like `.ai/ai_docs/context-docs/testing+quality/e2e-testing.md`
- Commands define allowed tools explicitly for security
- Model selection (haiku vs sonnet) based on complexity
- Complex commands use PRIME framework for consistency
- Commands can delegate to Task tool for subagents

---

## 3. Context Documentation Structure

### Directory Organization
**Location**: `.ai/ai_docs/context-docs/`

**Three Main Categories**:
1. **development/** - 9 files
   - Architecture, database, server actions, frameworks
   - React Query patterns, Shadcn UI components
   
2. **infrastructure/** - 12 files  
   - Auth system (5 files: overview, implementation, configuration, security, troubleshooting)
   - CI/CD, deployment, database seeding, Docker, logging
   
3. **testing+quality/** - 8 files
   - Unit/integration/E2E/accessibility/performance testing
   - Vitest configuration, fundamentals

**Total**: 29 markdown files with comprehensive metadata

### YAML Frontmatter Structure

Each context document uses a standardized YAML frontmatter with sections:

**Identity Section**:
```yaml
id: "unique-document-id"          # kebab-case identifier
title: "Display Title"            # Human-readable title
version: "1.0.0"                  # Semantic versioning
category: "pattern|reference|implementation|guide"
```

**Discovery Section**:
```yaml
description: "Brief summary of what this doc covers"
tags: ["tag1", "tag2", "tag3"]   # Multiple tags for searching
```

**Relationships Section**:
```yaml
dependencies: ["id1", "id2"]      # Prerequisites to read first
cross_references:
  - id: "related-doc-id"
    type: "related|parent|prerequisite|alternative"
    description: "Brief explanation of relationship"
```

**Maintenance Section**:
```yaml
created: "YYYY-MM-DD"             # Creation date
last_updated: "YYYY-MM-DD"        # Last modification
author: "consolidation|create-context|etc"
```

### Example: Complete Frontmatter (auth-overview.md)
```yaml
---
id: "auth-overview"
title: "Authentication System Overview"
version: "3.0.0"
category: "implementation"
description: "MakerKit authentication overview using Supabase Auth with team-based RBAC"
tags: ["authentication", "supabase", "rbac", "mfa", "server-actions"]
dependencies: ["supabase-client", "server-actions", "team-accounts"]
cross_references:
  - id: "auth-implementation"
    type: "related"
    description: "Detailed code examples and patterns"
  - id: "auth-troubleshooting"
    type: "related"
    description: "Common issues and solutions"
  - id: "auth-configuration"
    type: "related"
    description: "Environment variables and setup"
created: "2025-01-09"
last_updated: "2025-09-13"
author: "create-context"
---
```

### Tag Vocabulary Patterns
**Observed Across Documents**:
- Technical: `nextjs`, `supabase`, `react`, `typescript`, `testing`, `database`
- Patterns: `rls`, `authentication`, `architecture`, `monorepo`
- Features: `multi-tenant`, `saas`, `server-components`
- Infrastructure: `deployment`, `ci-cd`, `docker`
- Testing: `unit-testing`, `e2e-testing`, `integration-testing`

### README Index Files
**Pattern**: Each subdirectory has a `README.md` that:
- Lists all files in category with summaries
- Shows "When to use" guidance for each file
- Provides common workflows (e.g., "Setting Up Tests for a New Feature")
- Links to related documentation
- Lists prerequisites and quick references

---

## 4. Configuration & Metadata Patterns

### Settings Files
**Main Config**: `.claude/settings.json`
- Contains permissions (allowed/denied tools)
- Defines hooks (PreToolUse, PostToolUse, Notification, Stop)
- Includes statusLine configuration
- Supports hook execution with timeout

**Example Hook Pattern**:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/validate-commit-message.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Local Overrides**: `.claude/settings.local.json`
- Extends main settings for local/development use
- Can disable MCP servers selectively
- Can extend permissions for testing

### Hook Infrastructure
**Location**: `.claude/hooks/`
**Types of Hooks**:
- `validate-commit-message.sh` - Pre-commit validation
- `pre_tool_use.py` - Before tool execution
- `post_tool_use.py` - After tool execution
- `notification.py` - Chat notifications
- `stop.py` - Session stop handling

**Pattern**: Hooks can be shell scripts or Python with UV runtime

### Package.json Scripting
**Relevant Patterns**:
- Scripts are named with scope: `lint:fix`, `format:fix`, `typecheck`, `codecheck`
- Monorepo filter syntax: `pnpm --filter web <command>`
- Wrapper scripts for statusline: `./.claude/statusline/codecheck-wrapper.sh`
- YAML/Markdown linting included in main lint flow

---

## 5. Recommended Patterns for Conditional Documentation Feature

### File Placement Strategy

**Option 1: Simple YAML Configuration (RECOMMENDED)**
```
.claude/
├── commands/
│   └── conditional_docs.md      # Already exists, reference main doc
├── config/                       # NEW: Create for metadata
│   └── command-profiles.yaml    # Define doc conditions per command
└── profiles/                     # NEW: Optional cache/compiled profiles
    └── dev-profiles.json
```

**Option 2: Distributed YAML (Flexible)**
```
.claude/
├── commands/
│   ├── conditional_docs.md
│   ├── test.md
│   ├── test.conditional-docs.yaml    # Metadata alongside command
│   ├── codecheck.md
│   └── codecheck.conditional-docs.yaml
```

### Configuration File Format

**Profile-based YAML** (`.claude/config/command-profiles.yaml`):
```yaml
profiles:
  # Web Development Profile
  web:
    description: "Documentation for web application development"
    tags: ["web", "nextjs", "react", "frontend"]
    docs:
      - id: "architecture-overview"
        required: true
        description: "Understand system structure"
      - id: "database-patterns"
        optional: true
        description: "For database changes"
  
  # Testing Profile
  testing:
    description: "Testing-focused documentation"
    tags: ["testing", "quality"]
    docs:
      - id: "e2e-testing"
        required: true
      - id: "fundamentals"
        optional: true

# Command Mappings
commands:
  test:
    profile: "testing"
    model: "haiku"
    description: "Run test suites"
    
  codecheck:
    profile: "web"
    model: "sonnet"
    description: "Code quality checks"
```

**Condition-based YAML** (Alternative):
```yaml
command_documentation:
  test:
    always:
      - ".ai/ai_docs/context-docs/testing+quality/e2e-testing.md"
    when:
      - condition: "changes include *.test.ts"
        docs: [".ai/ai_docs/context-docs/testing+quality/fundamentals.md"]
      - condition: "changes include apps/e2e/**"
        docs: [".ai/ai_docs/context-docs/testing+quality/vitest-configuration.md"]
```

### Router Logic Architecture

**Recommended Implementation**:
1. **Parser Script** (`.claude/bin/doc-router.sh` or Python)
   - Load YAML profile configuration
   - Parse command arguments and git changes
   - Evaluate conditions
   - Output documentation path list

2. **Integration Points**:
   - Called from command YAML frontmatter
   - Returns paths for context loading
   - Can be cached with `.claude/profiles/`

3. **Command Integration Example**:
```yaml
---
description: Code quality checks with conditional docs
model: sonnet
allowed-tools: [Bash, Read]
essential-context: |
  $(bash .claude/bin/doc-router.sh codecheck --scope ${GIT_SCOPE})
---

# Command instructions...
# Read: ${ESSENTIAL_CONTEXT}
```

### Cache Strategy

**Optional Compiled Profiles** (`.claude/profiles/`):
- Pre-compiled JSON versions of YAML for faster loading
- Regenerated when YAML changes
- Format: `{command}.profiles.json`

```json
{
  "codecheck": {
    "profiles": ["web"],
    "docs": [
      {
        "path": ".ai/ai_docs/context-docs/development/architecture-overview.md",
        "required": true,
        "reason": "Always needed for code quality checks"
      }
    ]
  }
}
```

---

## 6. Existing Patterns to Follow

### Naming Conventions
- **Files**: kebab-case (e.g., `conditional_docs.md`, `database-patterns.md`)
- **IDs**: kebab-case (e.g., `"auth-overview"`, `"e2e-testing"`)
- **Tags**: lowercase with hyphens (e.g., `"multi-tenant"`, `"unit-testing"`)
- **Commands**: single word or hyphenated (e.g., `test`, `codecheck`, `docker-fix`)

### Documentation Quality Standards
From context docs observations:
- Each doc has clear frontmatter with metadata
- "When to use" guidance is explicit
- Tags enable discoverability
- Cross-references maintain knowledge graph
- Version tracking for document evolution
- Author attribution for accountability

### Tool Execution Patterns
- Use Bash for file/git operations (read-only)
- Use Read for file content analysis
- Use Grep for searching patterns
- Use Glob for file discovery
- Use Python/UV for complex logic

---

## 7. Project-Specific Considerations

### CLAUDE.md Integration
- Any conditional documentation system should respect CLAUDE.md conventions
- Commands should follow Conventional Commits with agent traceability
- Must support monorepo structure (`pnpm --filter`)
- Should integrate with pre-commit hooks

### Tool Availability
**Always Available**:
- Bash (with pre-commit validation)
- Read, Grep, Glob
- Git operations (for metadata)

**Sometimes Available**:
- Task (for subagents)
- MCP tools (disabled in local settings)
- WebFetch/WebSearch

### Team Workflow Considerations
- Must not slow down command execution (cache layer important)
- Should integrate with existing status line/progress tracking
- Commands need predictable tool requirements
- Metadata should be maintainable without code changes

---

## 8. Gotchas & Considerations

### Critical Points
1. **Path Consistency**: Context docs use absolute paths starting with `.ai/ai_docs/`
2. **YAML Escaping**: Frontmatter uses YAML syntax - arrays need proper indentation
3. **Hook Execution**: Hooks have 5-second timeouts - router logic must be fast
4. **Monorepo Context**: Must determine scope from git changes or command arguments
5. **Model Selection**: Commands specify their model (haiku vs sonnet) - router shouldn't override

### Performance Requirements
- Router logic must complete in <1 second (pre-hook execution)
- Cache lookups should be instant (simple JSON file reads)
- No external API calls during routing

### Testing Approach
- Unit test the router logic with sample profiles and conditions
- Test cache invalidation when YAML changes
- Verify git scope detection across different file types
- Test edge cases (no matching docs, multiple profiles, etc.)

### Maintenance Patterns
- YAML schema should be documented in `.claude/config/README.md`
- Router script should include usage examples
- Keep profiles DRY with shared conditions
- Version the profile format in case of future changes

---

## 9. File Paths for Implementation

### Recommended File Structure
```
.claude/
├── commands/
│   └── conditional_docs.md          # Already exists - update
├── config/                          # NEW
│   ├── README.md                    # Document schema and patterns
│   ├── command-profiles.yaml        # Main configuration
│   └── profiles-schema.json         # Optional: JSON schema for validation
├── bin/                             # NEW or UPDATE
│   ├── doc-router.sh               # Main routing logic
│   └── profile-compiler.sh          # Optional: compile YAML to JSON
└── profiles/                        # NEW (optional cache)
    └── .gitignore                   # Ignore compiled profiles

.ai/ai_docs/context-docs/
├── development/README.md            # Already exists - might reference routing
├── infrastructure/README.md         # Already exists - might reference routing
└── testing+quality/README.md        # Already exists - might reference routing
```

### Integration Points
- `.claude/settings.json` - Add hook for profile compilation (optional)
- `.claude/commands/*.md` - Add `essential-context:` or similar frontmatter field
- `.claude/hooks/pre_tool_use.py` - Could validate profile format

---

## 10. Similar Patterns in Codebase

### Feature Planning Command
The `/feature` command in `.claude/commands/feature.md`:
- Takes user input and maps to categories
- Generates specs in `.ai/specs/`
- Integrates with GitHub via gh CLI
- Uses structured markdown format

**Lesson**: Complex conditional logic should generate structured output for downstream processing.

### CodeCheck Command  
The `/codecheck` command in `.claude/commands/codecheck.md`:
- Uses PRIME framework structure
- References context docs in "Essential Context" section
- Can delegate to specialized agents
- Tracks progress with TodoWrite

**Lesson**: Commands with conditional behavior can list docs in frontmatter comments.

### Test Command
The `/test` command in `.claude/commands/test.md`:
- References test environment context docs
- Calls wrapper scripts for execution
- Parses command arguments (--unit, --e2e, --debug)
- Shows safe output with full logs preserved

**Lesson**: Argument parsing patterns are established and reusable.

### Commit Command
The `/commit` command in `.claude/commands/commit.md`:
- Inspects git status and changes
- Infers scope from file paths
- Validates format against commitlint rules
- Can create multiple commits

**Lesson**: Git-based logic for determining context (like scope detection) is working pattern.

---

## Summary Table: Key Patterns

| Pattern | Location | Relevance | Usage |
|---------|----------|-----------|-------|
| YAML Frontmatter | Context docs | HIGH | Metadata standard to follow |
| Conditional Markdown | `.claude/commands/*.md` | HIGH | How to reference docs in commands |
| Git Change Detection | `commit.md`, `codecheck.md` | HIGH | Pattern for determining scope |
| Profile/Config Pattern | `settings.json` | HIGH | Configuration structure to emulate |
| Hook Infrastructure | `.claude/hooks/` | MEDIUM | For validation/compilation |
| README Index Files | Each context-docs subdirectory | MEDIUM | Documentation discovery pattern |
| Agent Delegation | `feature.md`, `codecheck.md` | LOW | Optional for complex analysis |
| Wrapper Scripts | `.claude/statusline/` | MEDIUM | For shell-based logic with output filtering |

---

## Conclusion

The SlideHeroes codebase provides a mature foundation for implementing conditional documentation:

1. **Metadata is standardized** - YAML frontmatter with clear sections
2. **Organization is clear** - Three main categories, 29 docs, consistent naming
3. **Commands have patterns** - PRIME framework, git integration, safe execution
4. **Configuration is managed** - JSON settings with hooks, no ad-hoc scripting
5. **Scaling is possible** - Cross-references and dependencies enable knowledge graph

**Recommended approach**: Create a simple YAML profile file in `.claude/config/` that maps commands to documentation based on tags and conditions, with an optional shell script router for integration into commands.

