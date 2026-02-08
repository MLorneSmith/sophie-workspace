# Specs Documentation

This directory contains spec-level documentation generated after Alpha workflow implementations complete.

## Purpose

Spec documentation captures **completed implementations** as comprehensive reference material for Claude Code. Unlike feature-level documentation (per-issue), spec documentation:

- Covers the **entire implementation** across all initiatives and features
- Documents **patterns established** during implementation
- Catalogs **reusable components** created
- Provides **architectural reference** for similar future work

## How Documentation Is Generated

Documentation is created by the `/alpha:document` command after a spec implementation completes:

```bash
/alpha:document S1692
```

The command:
1. Reads the spec-manifest.json and all feature files
2. Analyzes git changes to identify patterns and components
3. Extracts tags for conditional docs routing
4. Generates comprehensive documentation
5. Optionally updates the GitHub issue

## Documentation Structure

Each spec document follows a consistent structure:

```markdown
---
title: {Spec Name} Implementation
category: specs
tags: [{auto-extracted tags}]
spec_id: S{number}
github_issue: #{number}
---

# {Spec Name}

## Executive Summary
## What Was Built
## Key Patterns Established
## Reusable Components
## File Organization
## Integration Points
## Configuration Required
## Troubleshooting
## Testing Approach
## Lessons Learned
```

## YAML Frontmatter

All spec documents include frontmatter for the conditional docs router:

| Field | Purpose | Example |
|-------|---------|---------|
| `title` | Human-readable name | "User Dashboard Implementation" |
| `category` | Document category | "specs" |
| `tags` | Keyword tags for routing | [dashboard, widgets, recharts] |
| `spec_id` | Alpha spec identifier | "S1692" |
| `github_issue` | GitHub issue number | "#1692" |
| `created` | Creation date | "2026-01-24" |
| `status` | Document status | "active" |

## Conditional Docs Integration

Spec documentation is automatically loaded by the conditional docs router when:

1. **Keyword matches**: Task description matches document tags
2. **Explicit reference**: Task references the spec ID or related patterns
3. **Similar domain**: Task is in a similar domain to the spec

Example routing in `command-profiles.yaml`:

```yaml
rules:
  - keywords: ["dashboard", "widget", "activity feed"]
    files:
      - "specs/S1692-user-dashboard.md"
    priority: medium
```

## Best Practices

### When to Generate Spec Documentation

- **Always** after a spec implementation completes successfully
- **Optional** for partially completed specs (with warning in document)

### What Makes Good Spec Documentation

1. **Concrete examples**: Include actual code snippets, not abstractions
2. **Clear patterns**: Document patterns with rationale, not just code
3. **Reuse guidance**: Explain *when* and *how* to reuse components
4. **Troubleshooting**: Document issues encountered during implementation

### Keeping Documentation Current

Spec documentation represents a **point-in-time snapshot** of the implementation. If significant changes are made later:

1. Update the `updated` field in frontmatter
2. Add a changelog entry
3. Note any deprecated patterns

## Relationship to Other Documentation

| Doc Type | Location | Purpose |
|----------|----------|---------|
| **Spec Docs** | `specs/` | Post-implementation reference |
| **Development Docs** | `development/` | How to build features |
| **Infrastructure Docs** | `infrastructure/` | System setup and config |
| **Testing Docs** | `testing+quality/` | Testing patterns |

Spec documentation **complements** these by providing:
- Real-world implementation examples
- Patterns proven in production
- Integration guidance specific to the codebase

## Files in This Directory

| File | Spec | Description |
|------|------|-------------|
| `README.md` | - | This file |
| *(generated docs appear here)* | | |
