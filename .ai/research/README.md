# Research Manifest System

This directory contains research manifests for large initiatives that span multiple features. The manifest system ensures research knowledge persists and flows through the entire feature development lifecycle.

## Purpose

When working on large initiatives (like "local-first architecture with RxDB"), Claude needs to:
1. Research unfamiliar technologies and patterns
2. Preserve that research for use across multiple features
3. Share findings between planning, implementation, and documentation phases

The research manifest system solves this by creating a structured knowledge store per initiative.

## Directory Structure

```
.ai/research/
├── README.md                           # This file
├── _templates/
│   └── manifest-template.md            # Template for new manifests
└── <initiative-slug>/                  # One directory per initiative
    ├── manifest.md                     # Main research summary
    └── (linked research reports)       # Copies/links to detailed reports
```

## How It Works

### 1. Initiative Starts

When `/initiative` command runs, it:
1. Interviews the user about scope and technologies
2. Launches research agents in parallel (perplexity, context7, explore)
3. Creates a manifest directory: `.ai/research/<initiative-slug>/`
4. Writes `manifest.md` summarizing key findings
5. Links to detailed research reports in `.ai/reports/research-reports/`

### 2. Features Reference Manifest

Each feature created from the initiative:
- Has the manifest path in its GitHub issue body
- Loads the manifest when planning begins
- Uses research findings to inform implementation

### 3. Knowledge Flows Through

```
/initiative (creates manifest)
    │
    ├─> /initiative-feature-set (reads manifest for decomposition)
    │
    ├─> /initiative-feature (reads manifest for planning)
    │
    └─> /initiative-implement (references patterns from manifest)
```

## Manifest Format

See `_templates/manifest-template.md` for the full template.

Key sections:
- **Quick Reference**: Technologies, date, issue links
- **Research Reports**: Links to detailed reports
- **Key Findings Summary**: Condensed insights for quick loading
- **Code Patterns**: Recommended implementation patterns
- **Gotchas & Warnings**: Known issues and pitfalls
- **Feature Mapping**: Which features use which research sections

## Creating a New Manifest

Manifests are created automatically by the `/initiative` command. Manual creation:

```bash
# Create initiative directory
mkdir -p .ai/research/my-initiative-slug

# Copy template
cp .ai/research/_templates/manifest-template.md .ai/research/my-initiative-slug/manifest.md

# Edit manifest with research findings
```

## Linking Research Reports

Research reports are stored in `.ai/reports/research-reports/YYYY-MM-DD/`. The manifest links to them:

```markdown
## Research Reports
- [RxDB Comprehensive Guide](../../reports/research-reports/2025-12-10/context7-rxdb.md)
- [Local-First Security](../../reports/research-reports/2025-12-10/perplexity-local-first.md)
```

## Integration with Commands

| Command | Manifest Usage |
|---------|----------------|
| `/initiative` | Creates manifest during research phase |
| `/initiative-feature-set` | Reads manifest for decomposition guidance |
| `/initiative-feature` | Loads manifest for planning context |
| `/initiative-implement` | References patterns during implementation |
| `/feature` (standalone) | Can optionally load manifest if linked |

## Cleanup

Manifests are kept indefinitely for reference. To clean up old initiatives:

```bash
# List all initiatives
ls -la .ai/research/

# Remove completed initiative (optional)
rm -rf .ai/research/old-initiative-slug/
```

## Related

- `.ai/reports/research-reports/` - Detailed research reports
- `.claude/commands/initiative.md` - Main orchestrator
- `.claude/config/command-profiles.yaml` - Conditional docs system
