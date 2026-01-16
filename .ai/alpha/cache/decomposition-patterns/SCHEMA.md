# Decomposition Pattern Cache Schema

## Overview

This cache stores reusable decomposition patterns for the Alpha workflow. Patterns are categorized by type and can be retrieved to accelerate future decompositions.

## How Patterns Work

1. **Complexity Estimator** checks for matching patterns before decomposition
2. If a pattern matches with >70% success rate, it's recommended
3. **Task Decomposer** adapts the pattern to the specific feature
4. After successful execution, patterns are updated with metrics

## Index Structure (index.json)

```json
{
  "version": "1.0.0",
  "created_at": "ISO-8601 timestamp",
  "last_updated": "ISO-8601 timestamp",
  "patterns_by_type": {
    "crud": [],
    "integration": [],
    "component": [],
    "refactor": [],
    "migration": [],
    "configuration": [],
    "testing": [],
    "other": []
  }
}
```

## Pattern Entry Structure (in index.json)

Each entry in a category array:

```json
{
  "id": "unique-pattern-id",
  "name": "Human-readable pattern name",
  "description": "What this pattern accomplishes",
  "created_at": "ISO-8601 timestamp",
  "usage_count": 0,
  "success_count": 0,
  "success_rate": 1.0,
  "file": "pattern-id.json"
}
```

## Pattern File Structure

Individual pattern files stored as `{pattern-id}.json`:

```json
{
  "id": "unique-pattern-id",
  "type": "crud | integration | component | refactor | migration | configuration | testing | other",
  "name": "Pattern name",
  "description": "Detailed description of what this pattern does",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "applicable_to": {
    "technologies": ["next.js", "supabase", "react"],
    "contexts": ["dashboard", "api", "form"]
  },
  "steps": [
    {
      "step_number": 1,
      "name": "Step name",
      "action_template": "{{verb}} {{target}} at {{path}}",
      "input_template": "{{prerequisite}} exists at {{location}}",
      "output_template": "{{result}} with {{properties}}",
      "critical": false,
      "parallel_group": "A",
      "estimated_hours": 2,
      "variables": ["verb", "target", "path", "prerequisite", "location", "result", "properties"]
    }
  ],
  "dependency_graph": {
    "1": [],
    "2": [1],
    "3": [1],
    "4": [2, 3]
  },
  "parallel_groups": {
    "A": [1],
    "B": [2, 3],
    "C": [4]
  },
  "adaptation_notes": [
    "Adjust file paths based on project structure",
    "Replace {{validation_library}} with project's choice (zod, yup, etc.)"
  ],
  "metadata": {
    "created_at": "ISO-8601 timestamp",
    "created_by": "agent or user",
    "last_used": "ISO-8601 timestamp",
    "usage_count": 0,
    "success_count": 0,
    "failure_count": 0,
    "avg_execution_hours": 0
  }
}
```

## Pattern Types

| Type | Description | Common Keywords |
|------|-------------|-----------------|
| crud | Create, Read, Update, Delete operations | form, list, table, api, endpoint |
| integration | External service connections | webhook, api, oauth, third-party |
| component | UI component creation | card, modal, form, dashboard |
| refactor | Code restructuring | extract, rename, move, consolidate |
| migration | Data or system migrations | schema, upgrade, migrate, convert |
| configuration | Setup and config changes | env, config, settings, feature-flag |
| testing | Test creation and updates | test, e2e, unit, integration |
| other | Tasks not fitting other categories | - |

## Variable Placeholders

Patterns use `{{variable}}` placeholders that get replaced during adaptation:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{resource_name}}` | The entity being operated on | "project", "user", "task" |
| `{{resource_plural}}` | Plural form | "projects", "users", "tasks" |
| `{{routes_path}}` | Path to routes directory | "apps/web/app/api" |
| `{{components_path}}` | Path to components | "apps/web/app/home/[account]/_components" |
| `{{validation_library}}` | Validation library used | "zod", "yup" |
| `{{test_framework}}` | Test framework | "vitest", "jest", "playwright" |

## Success Rate Calculation

```
success_rate = success_count / usage_count
```

- Patterns with success_rate < 0.5 after 5+ uses should be reviewed
- Patterns with success_rate < 0.3 should be deprecated
- New patterns start with success_rate = 1.0 (assumed success)

## Pattern Lifecycle

1. **Creation**: New pattern created from successful decomposition
2. **Usage**: Pattern matched and adapted for similar features
3. **Tracking**: Success/failure recorded after execution
4. **Evolution**: Low-success patterns reviewed and improved
5. **Deprecation**: Consistently failing patterns marked inactive

## Creating New Patterns

After a successful feature implementation:

1. Analyze the decomposition that worked well
2. Extract generalizable step structure
3. Identify variable placeholders
4. Add keywords for future matching
5. Create pattern file and update index

## Matching Algorithm

1. Extract keywords from feature description
2. For each pattern type likely to match:
   - Compare feature keywords against pattern keywords
   - Calculate match score (% of pattern keywords found)
3. Filter patterns with match_score > 50%
4. Sort by (match_score * success_rate)
5. Return top match if score > 0.5

## Files in This Directory

- `SCHEMA.md` - This documentation
- `index.json` - Pattern index with metadata
- `{pattern-id}.json` - Individual pattern files
