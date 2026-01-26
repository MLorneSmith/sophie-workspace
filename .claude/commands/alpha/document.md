---
description: Generate spec-level documentation after Alpha implementation completes. Aggregates all features/initiatives into comprehensive documentation for Claude Code reference.
argument-hint: <S#|spec-id>
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task]
---

# Alpha Spec Documentation

Generate comprehensive spec-level documentation for a completed Alpha implementation. This documentation captures patterns, components, and architectural decisions to help Claude Code in future implementations.

**Arguments:**
- `<spec-id>` - Required. Spec ID (e.g., `S1692` or `1692`)

## Purpose

Unlike per-feature documentation (`/document`), spec-level documentation:
- Captures the **entire implementation** as a cohesive whole
- Documents **patterns established** across multiple features
- Highlights **reusable components** created
- Serves as **architectural reference** for similar future work

## Documentation Principles

When generating documentation, focus on what helps Claude Code in the future:

| Principle | What to Document | Why It Helps |
|-----------|------------------|--------------|
| **Patterns Established** | Data fetching, component, service patterns | Reuse proven approaches |
| **Reusable Components** | Components, utilities, hooks created | Avoid rebuilding |
| **File Organization** | Directory structure, naming conventions | Navigate efficiently |
| **Integration Points** | How features connect to each other | Understand dependencies |
| **Data Flow** | How data moves through the system | Debug and extend |
| **Configuration** | Environment variables, settings | Setup without guessing |
| **Troubleshooting** | Issues encountered and solutions | Avoid common pitfalls |
| **Testing Patterns** | How to test similar features | Write consistent tests |

## Implementation Flow

### Phase 1: Load Spec Context

1. **Parse spec ID from arguments**:
   ```typescript
   const input = '$ARGUMENTS'.trim();
   // Handle both S1692 and 1692 formats
   const specNum = input.replace(/^S/, '');
   ```

2. **Find spec directory**:
   ```bash
   # Use Glob to find spec directory
   .ai/alpha/specs/S${specNum}-Spec-*/
   ```

3. **Read spec-manifest.json**:
   - Load the manifest to get:
     - Spec metadata (name, ID)
     - All initiatives and their status
     - All features with task counts
     - Progress summary

4. **Read spec.md**:
   - Extract original requirements and goals
   - Understand the problem being solved
   - Get user personas and success criteria

5. **Verify implementation is complete**:
   - Check `progress.status === "completed"` OR
   - Check `progress.features_completed === progress.features_total`
   - If not complete, warn user and ask if they want to proceed

### Phase 2: Analyze Implementation

1. **Collect all feature summaries**:
   For each feature in `feature_queue`:
   ```
   Read: {feature_dir}/feature.md
   Read: {feature_dir}/tasks.json
   ```
   Extract:
   - Feature title and description
   - Tasks completed
   - Files created/modified
   - Patterns used

2. **Analyze git changes**:
   ```bash
   # Get all commits on the spec branch
   git log origin/main..alpha/spec-S${specNum} --oneline

   # Get changed files
   git diff origin/main..alpha/spec-S${specNum} --name-only

   # Get stats
   git diff origin/main..alpha/spec-S${specNum} --stat
   ```

3. **Identify patterns**:
   Use Explore agent to identify:
   - Data loader patterns (`**/server/*.loader.ts`)
   - Component patterns (`**/_components/*.tsx`)
   - Type definitions (`**/_lib/types/*.ts`)
   - Service patterns (`**/_lib/server/*.ts`)

4. **Catalog reusable components**:
   For files created in this implementation, identify:
   - Components that can be reused
   - Utilities with general applicability
   - Hooks that solve common problems
   - Types that define domain models

5. **Document configuration**:
   Search for:
   - Environment variables used
   - Configuration files modified
   - External services integrated

### Phase 3: Generate Documentation

Create documentation at: `.ai/ai_docs/context-docs/specs/S{specNum}-{slug}.md`

**Documentation Structure**:

```markdown
---
title: {Spec Name} Implementation
category: specs
tags: [{extracted-tags}]
related_commands: [implement, alpha:implement]
spec_id: S{specNum}
github_issue: #{specNum}
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
status: active
initiatives: {count}
features: {count}
tasks: {count}
---

# {Spec Name} (S{specNum})

**GitHub Issue:** #{specNum}
**Implementation Branch:** alpha/spec-S{specNum}
**Completed:** {date}

## Executive Summary

{2-3 sentence summary of what was built and the problem it solves}

## What Was Built

### Overview
{High-level description of the implementation}

### Initiatives Completed
| Initiative | Features | Description |
|------------|----------|-------------|
| {I1 name} | {count} | {brief description} |
| {I2 name} | {count} | {brief description} |

### Key Features
- **{Feature 1}**: {description}
- **{Feature 2}**: {description}
- ...

## Key Patterns Established

### Data Loader Pattern
{Description of how data loading was implemented}

```typescript
// Example pattern
import 'server-only';
import { cache } from 'react';

export const loadDashboardData = cache(async () => {
  // Pattern details...
});
```

### Component Pattern
{Description of component architecture}

```typescript
// Example pattern
'use client';

export function WidgetComponent({ data }: Props) {
  // Pattern details...
}
```

### {Other patterns...}

## Reusable Components

| Component | Location | Purpose | Reuse Scenarios |
|-----------|----------|---------|-----------------|
| {Name} | {path} | {purpose} | {when to reuse} |

## File Organization

```
apps/web/app/home/(user)/
├── page.tsx                    # Main entry point
├── loading.tsx                 # Skeleton loading states
├── _components/                # Feature components
│   ├── {component-1}.tsx
│   └── {component-2}.tsx
├── _lib/
│   ├── types/                  # TypeScript definitions
│   │   └── {types}.ts
│   └── server/                 # Server-side logic
│       └── {loaders}.ts
```

## Integration Points

### Internal Integrations
- **{System A}**: {how it integrates}
- **{System B}**: {how it integrates}

### External Integrations
- **{Service}**: {how it integrates, API used}

## Configuration Required

### Environment Variables
| Variable | Purpose | Required |
|----------|---------|----------|
| {VAR_NAME} | {purpose} | Yes/No |

### Database Changes
- {migration 1}: {description}
- {migration 2}: {description}

## Troubleshooting

### Common Issues

**Issue: {Error message or problem}**
- **Symptoms**: {what user sees}
- **Cause**: {why it happens}
- **Solution**: {how to fix}

## Testing Approach

### Test Files Created
- `{test-file-1}`: {what it tests}
- `{test-file-2}`: {what it tests}

### How to Test Similar Features
{Guidance on testing patterns used}

## Lessons Learned

### What Worked Well
- {lesson 1}
- {lesson 2}

### Challenges Encountered
- {challenge 1}: {how it was resolved}
- {challenge 2}: {how it was resolved}

## Related Documentation

- [Architecture Overview](../development/architecture-overview.md)
- [{Related doc}]({path})

## Changelog

- **{date}**: Initial documentation created from spec implementation
```

### Phase 4: Extract Tags

Analyze the implementation to determine appropriate tags:

**Tag Categories:**
- **Technical Domain**: dashboard, widgets, charts, forms, auth, database
- **Patterns**: data-loader, server-components, client-components, rls
- **Technologies**: recharts, cal-com, supabase, react-query
- **Features**: activity-feed, progress-tracking, coaching

Select 5-10 most relevant tags based on:
1. Keywords from spec title and description
2. Technologies used in implementation
3. Patterns established
4. Integration points

### Phase 5: Update Conditional Docs

1. **Create/update command-profiles.yaml** entry:
   Add rules to relevant profiles so future implementations can find this spec documentation.

2. **Suggest routing rules**:
   Based on the spec's domain, suggest which command profiles should reference this documentation.

### Phase 6: GitHub Integration (Optional)

If the spec has a GitHub issue:

```bash
# Post documentation summary to spec issue
gh issue comment ${specNum} \
  --repo MLorneSmith/2025slideheroes \
  --body "## 📚 Spec Documentation Created

**Documentation**: [\`.ai/ai_docs/context-docs/specs/S${specNum}-${slug}.md\`](link)

### Summary
${summary}

### Key Patterns Documented
${patterns}

### Reusable Components
${components}

---
*Generated by /alpha:document*
"

# Add documentation label if it exists
gh issue edit ${specNum} \
  --repo MLorneSmith/2025slideheroes \
  --add-label "documented"
```

## Output Location

Documentation is saved to:
```
.ai/ai_docs/context-docs/specs/S{specNum}-{slug}.md
```

Where `{slug}` is derived from the spec name (e.g., `user-dashboard`).

## Completion Criteria

Documentation is **COMPLETE** when:

- [ ] Spec-manifest.json read and analyzed
- [ ] All initiatives and features summarized
- [ ] Git changes analyzed for patterns
- [ ] Reusable components cataloged
- [ ] Configuration requirements documented
- [ ] Tags extracted and assigned
- [ ] Documentation file created with complete YAML frontmatter
- [ ] Patterns documented with code examples
- [ ] File organization documented
- [ ] Troubleshooting section populated
- [ ] Related documentation linked

## Report

After completion, display:

```
═══════════════════════════════════════════════════════════════
   SPEC DOCUMENTATION COMPLETE
═══════════════════════════════════════════════════════════════

📋 Spec: S{specNum} - {Spec Name}

📄 Documentation Created:
   Location: .ai/ai_docs/context-docs/specs/S{specNum}-{slug}.md

📊 Coverage:
   Initiatives: {count}
   Features: {count}
   Tasks: {count}
   Patterns documented: {count}
   Reusable components: {count}

🏷️ Tags: {tag1}, {tag2}, {tag3}, ...

🔗 Conditional Docs Integration:
   This documentation will be auto-loaded when tasks match:
   - Keywords: {keyword1}, {keyword2}, ...
   - Commands: /implement, /feature, /alpha:implement

📝 GitHub: {status - updated/skipped}

═══════════════════════════════════════════════════════════════
```

## Arguments

Spec ID: $ARGUMENTS
