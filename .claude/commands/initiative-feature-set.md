---
description: Sandbox-optimized feature-set decomposition that loads research manifest and outputs structured data for /initiative orchestrator
argument-hint: [initiative-description] --manifest [path]
model: opus
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion]
---

# Initiative Feature Set Decomposition

Sandbox-optimized version of `/feature-set` that integrates with the `/initiative` orchestrator workflow. Loads pre-generated research manifest and outputs structured data for orchestration.

## Key Differences from /feature-set

| Aspect | /feature-set | /initiative-feature-set |
|--------|-------------|------------------------|
| Research | Does its own exploration | Loads research manifest |
| Output | Human-readable report | Structured JSON + files |
| Context | Standalone command | Part of /initiative workflow |
| Interview | Full user interview | Minimal (context from orchestrator) |

## Instructions

IMPORTANT: This command is called by `/initiative` orchestrator with research context already gathered.
IMPORTANT: Load and use the research manifest - do NOT duplicate research.
IMPORTANT: Output must be structured for orchestrator consumption.

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- **Initiative description**: The main description
- **Manifest path**: Path to research manifest (look for `--manifest` flag)

```typescript
// Expected format:
// $ARGUMENTS = "local-first architecture with RxDB --manifest .ai/research/local-first-rxdb/manifest.md"

const args = "$ARGUMENTS";
const manifestMatch = args.match(/--manifest\s+(\S+)/);
const manifestPath = manifestMatch ? manifestMatch[1] : null;
const initiative = args.replace(/--manifest\s+\S+/, '').trim();
```

### Step 2: Load Research Manifest

If manifest path provided:

```bash
# Read the research manifest
cat <manifest-path>
```

Extract from manifest:
- Technology overview
- Recommended patterns
- Gotchas and warnings
- Code examples

This research informs your decomposition - use it extensively.

### Step 3: Quick Context Validation

Use AskUserQuestion ONLY if critical information is missing:

```typescript
// Only ask if NOT provided by orchestrator:
// - Primary domains affected
// - Complexity/feature count expectation
// - Risk level
```

In most cases, the orchestrator has already gathered this context. Proceed with decomposition using manifest research.

### Step 4: Architecture-Informed Decomposition

Using research manifest findings, decompose into features:

**Research-Guided Boundaries:**
- Use technology patterns from manifest to identify natural boundaries
- Reference code examples for implementation approach
- Consider gotchas when defining feature scope
- Apply recommended patterns to structure

**Standard Boundaries** (from /feature-set):
- Separate database/schema layer from service layer
- Separate API/server action layer from UI layer
- Identify bounded domains

**Dependency Analysis:**
- Which features depend on others (from research insights)
- Infrastructure vs. application features
- Integration points

### Step 5: Create Dependency Graph

Build dependency model with research context:

```
Feature A (database layer) ──┐
                             ├──> Feature C (API layer)
Feature B (shared utils) ────┘
                             │
                             └──> Feature D (UI layer)
```

### Step 6: Group into Phases

**Phase 1: Foundation**
- Infrastructure, database, core utilities
- Features with no dependencies

**Phase 2: Core Implementation**
- Features depending on Phase 1
- Parallel work where possible

**Phase 3: Integration**
- Features integrating Phase 2 components
- Testing and polish

### Step 7: Create GitHub Issues

Follow standard GitHub issue creation process (see /feature-set).

Create:
1. Master feature-set issue
2. Feature stub issues for each feature
3. Link with dependencies
4. Create github-mapping.md

### Step 8: Generate Structured Output

**CRITICAL**: Output structured JSON for orchestrator:

```json
{
  "success": true,
  "initiative": {
    "title": "Local-First Architecture with RxDB",
    "slug": "local-first-rxdb",
    "description": "Implement local-first data architecture with encrypted sync"
  },
  "master_issue": {
    "number": 123,
    "url": "https://github.com/MLorneSmith/2025slideheroes/issues/123"
  },
  "features": [
    {
      "name": "Database Schema Layer",
      "issue_number": 124,
      "phase": 1,
      "dependencies": [],
      "effort": "M",
      "description": "Create RxDB schemas and collections for presentation data"
    },
    {
      "name": "Encryption Service",
      "issue_number": 125,
      "phase": 1,
      "dependencies": [],
      "effort": "S",
      "description": "Implement Web Crypto API encryption utilities"
    },
    {
      "name": "Sync Engine",
      "issue_number": 126,
      "phase": 2,
      "dependencies": [124, 125],
      "effort": "L",
      "description": "Build bi-directional sync with conflict resolution"
    }
  ],
  "dependency_graph": {
    "124": [],
    "125": [],
    "126": [124, 125]
  },
  "phases": {
    "1": {"name": "Foundation", "features": [124, 125]},
    "2": {"name": "Core Implementation", "features": [126]},
    "3": {"name": "Integration", "features": []}
  },
  "plan_file": ".ai/specs/feature-sets/local-first-rxdb/123-overview.md",
  "mapping_file": ".ai/specs/feature-sets/local-first-rxdb/github-mapping.md"
}
```

## Research Manifest Integration

When loading the manifest, extract and use:

### Technology Overview
Use to understand the domain and make informed decomposition decisions.

### Recommended Patterns
Apply these patterns when defining feature boundaries and implementation approach.

### Gotchas & Warnings
Consider these when scoping features to avoid known pitfalls.

### Code Examples
Reference these when describing what each feature should implement.

### Feature Mapping
If manifest includes feature suggestions, use as starting point for decomposition.

## Plan Storage

Same as /feature-set:
```
.ai/specs/feature-sets/[initiative-slug]/
├── <issue#>-overview.md    # Master plan
├── dependency-graph.md     # Visual dependency mapping
├── github-mapping.md       # Issue tracking reference
└── notes.md                # Implementation notes
```

## Initiative Input

$ARGUMENTS

## Report

After completion, output:

1. **Structured JSON** (for orchestrator - output FIRST)
2. **Human-readable summary** (for user visibility)

### JSON Output

```json
{
  "success": true,
  "initiative": {...},
  "master_issue": {...},
  "features": [...],
  "dependency_graph": {...},
  "phases": {...},
  "plan_file": "...",
  "mapping_file": "..."
}
```

### Summary

- **Features identified**: <count> features across <count> phases
- **Master issue**: #<number>
- **Feature issues**: #<n1>, #<n2>, #<n3>, ...
- **Plan file**: <path>
- **Next**: Run `/initiative-feature` on each feature (orchestrator handles this)

## Related Commands

- **`/initiative`**: Main orchestrator (calls this command)
- **`/initiative-feature`**: Create detailed plan for a feature
- **`/initiative-implement`**: Execute a feature plan
- **`/feature-set`**: Standalone version (without orchestrator)
