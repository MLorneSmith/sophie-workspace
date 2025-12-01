# Comprehensive Claude Code Skills Guide

**Date**: 2025-12-01
**Purpose**: Complete reference for understanding, creating, and extending Claude Code skills
**Sources**: Existing research reports, official skills, project implementation

---

## Table of Contents

1. [What Are Claude Code Skills?](#what-are-claude-code-skills)
2. [Skill Architecture & Structure](#skill-architecture--structure)
3. [How Skills Are Invoked](#how-skills-are-invoked)
4. [Creating Custom Skills](#creating-custom-skills)
5. [Extending Existing Skills](#extending-existing-skills)
6. [Project Integration Patterns](#project-integration-patterns)
7. [Best Practices](#best-practices)
8. [Reference Examples](#reference-examples)

---

## What Are Claude Code Skills?

### Definition

Claude Code skills are **structured knowledge packages** that extend Claude's capabilities through modular, self-contained instruction sets. They are NOT traditional software plugins, but rather **documentation-based expertise bundles** that Claude loads just-in-time to become a specialist.

**Key Characteristics:**
- **Documentation-first**: Skills are primarily markdown instructions with optional scripts/assets
- **Progressive disclosure**: Only metadata loads by default; full content loads when triggered
- **Domain-specific**: Each skill transforms Claude into a specialist for specific tasks
- **Zero overhead**: Skills not in use don't consume context window tokens
- **Self-contained**: All resources bundled together in a single directory

### Progressive Disclosure Model

Skills use a three-tier loading system for efficient context management:

**Level 1: Metadata (Always Loaded - ~100-200 tokens)**

```yaml
---
name: skill-name
description: What the skill does and when it triggers (50-100 words)
license: Optional license
allowed-tools: Optional tool restrictions
---
```

**Level 2: SKILL.md Body (Loaded When Triggered - ~400-5000 tokens)**
- Full instructions and workflows
- Guidelines and best practices
- Code examples and patterns
- Reference documentation

**Level 3: Bundled Resources (On-Demand - Unlimited)**
- `scripts/` - Executable tools and automation
- `references/` - Detailed documentation loaded as needed
- `assets/` - Templates, fonts, images, configs
- Output from script execution

**Example Token Usage:**
```
WITHOUT skills (all in system prompt):
  Base: 5,000 tokens
  + Frontend debugging: 2,500 tokens
  + Design guidelines: 1,800 tokens
  + Testing patterns: 2,200 tokens
  = 11,500 tokens ALWAYS

WITH skills (progressive loading):
  Base: 5,000 tokens
  + All skill metadata: 600 tokens
  + Active skill (when triggered): 2,500 tokens
  = 8,100 tokens MAXIMUM (3,400 tokens saved)
```

---

## Skill Architecture & Structure

### Directory Structure

```
skill-name/
├── SKILL.md               # Core skill instructions (REQUIRED)
├── LICENSE.txt            # License information (optional)
├── scripts/               # Executable utilities (optional)
│   ├── tool.py
│   ├── helper.sh
│   └── config.json
├── references/            # Extended documentation (optional)
│   ├── checklist.md
│   ├── patterns.md
│   └── api-reference.md
└── assets/                # Static resources (optional)
    ├── templates/
    ├── fonts/
    └── examples/
```

### SKILL.md Format

**Complete Template:**

```markdown
---
name: skill-name
description: Clear description of what the skill does and when to use it. This skill should be used when [situation 1], [situation 2], or [situation 3]. Leverages [tool/technology names]. Triggers on requests like "example phrase 1", "example phrase 2", "example phrase 3".
license: Complete terms in LICENSE.txt
allowed-tools: Bash, Read, Grep, Glob
---

# Skill Title

[Opening paragraph explaining the skill's purpose and value proposition]

## When to Use This Skill

- [Use case 1]
- [Use case 2]
- [Use case 3]

## Quick Start

### Common Task 1

```bash
# Example command
script-name.sh --option value
```

### Common Task 2

```bash
# Another example
python scripts/tool.py --flag
```

## Detailed Workflows

### Workflow 1: [Name]

When [situation]:

1. **Step 1**: [Action]
   ```bash
   command example
   ```

2. **Step 2**: [Action]
   ```bash
   another command
   ```

3. **Step 3**: [Action]
   - Check for [condition]
   - Verify [outcome]

### Workflow 2: [Name]

[Description]

## Script Reference

### script-name.sh

[Description of what the script does]

| Option | Description |
|--------|-------------|
| `--flag` | What it does |
| `--param <value>` | What it accepts |

### tool.py

[Python script documentation]

## Common Issues Reference

For detailed troubleshooting, see: `references/checklist.md`

Quick reference:

| Issue | First Check | Tool |
|-------|-------------|------|
| [Issue 1] | [What to check] | [Which script] |
| [Issue 2] | [What to check] | [Which script] |

## Best Practices

- [Best practice 1]
- [Best practice 2]
- [Best practice 3]

## Related Resources

- **Project docs**: [path/to/docs]
- **External docs**: [URL]
- **Related skills**: [other-skill-name]
```

### YAML Frontmatter Fields

**Required Fields:**

```yaml
---
name: skill-name
description: Description with use cases and trigger phrases
---
```

**Optional Fields:**

```yaml
---
license: Complete terms in LICENSE.txt
allowed-tools: Bash, Read, Grep, Glob, Write
---
```

**Description Formula:**

```yaml
description: [Main purpose]. This skill should be used when [situation 1], [situation 2], or [situation 3]. [Technology/tool mentions]. Triggers on requests like "[example 1]", "[example 2]", "[example 3]".
```

**Components:**
1. **Main purpose** (1 sentence) - What the skill does
2. **Use cases** (2-5 situations) - When to use it
3. **Technologies** - Specific tools/frameworks
4. **Trigger phrases** - Actual user requests that should activate it

---

## How Skills Are Invoked

### Automatic Detection (Primary Method)

Skills use **automatic triggering** based on task analysis and description matching. There is **NO special syntax** like `skill:name` or `@skill`.

**How Claude Selects Skills:**

1. **User makes a request** with specific intent/keywords
2. **Claude analyzes the request** against all skill descriptions
3. **Keyword matching** identifies potentially relevant skills
4. **Context awareness** considers current files, tools, previous conversation
5. **Automatic loading** of best-match skill(s) just-in-time

**Example Matching Process:**

```
User Request: "The checkout page is broken - nothing renders and there are console errors"

Skill Matching:
  frontend-debugging: HIGH MATCH
    - "rendering bugs" ✓
    - "console errors" ✓
    - "React/Next.js components" ✓

  frontend-design: NO MATCH
    - No mention of design, aesthetics, building new UI

  e2b-sandbox: NO MATCH
    - No mention of sandboxes, testing, or isolation

Result: Claude loads frontend-debugging skill automatically
```

### Triggering Mechanisms

**Method 1: Natural Language (Automatic)**
```
User: "Debug this React component that won't render"
→ Triggers frontend-debugging skill automatically
```

**Method 2: Explicit Mention (Manual)**
```
User: "Use the frontend-debugging skill to investigate this issue"
→ Explicitly loads the skill
```

**Method 3: Context Setting (Indirect)**
```
User: "Take a screenshot and check console logs"
→ Claude recognizes Playwright/console keywords → loads frontend-debugging
```

**Method 4: Command Integration (Structured)**
```
Slash command mentions: "Use the frontend-debugging skill for systematic debugging"
→ Command sets context that triggers skill loading
```

### Writing Effective Descriptions

**Good Description (Triggers Correctly):**
```yaml
description: Debug front-end issues including rendering bugs, performance problems, network failures, and client-side errors. This skill should be used when investigating React/Next.js components, CSS styling problems, console errors, hydration mismatches, or Core Web Vitals issues. Leverages Playwright for browser automation and Lighthouse for performance audits.
```

**Why It Works:**
- Lists specific use cases with keywords
- Uses "This skill should be used when..." pattern
- Mentions concrete technologies (React, Next.js, Playwright)
- Describes triggering scenarios explicitly

**Poor Description (Won't Trigger):**
```yaml
description: Helps with frontend problems using various debugging tools.
```

**Why It Fails:**
- Vague and generic
- No specific use cases or technologies
- No trigger phrases
- Lacks concrete keywords

**Best Practices for Descriptions:**

1. **Use third-person voice**: "This skill should be used when..." not "Use this skill when..."
2. **List 5-7 concrete use cases**: Rendering bugs, console errors, performance issues, etc.
3. **Mention technologies explicitly**: React, Playwright, Lighthouse (not "testing tools")
4. **Include trigger phrases**: "Triggers on requests like 'debug the component', 'capture screenshots'"
5. **Test with sample requests**: Verify the description would match expected user queries

---

## Creating Custom Skills

### Step-by-Step Creation Process

**1. Initialize Skill Directory**
```bash
# Create skill structure
mkdir -p .claude/skills/my-skill/{scripts,references,assets}
cd .claude/skills/my-skill
```

**2. Create SKILL.md**
```bash
cat > SKILL.md << 'EOF'
---
name: my-skill
description: [Complete description with use cases and trigger phrases]
license: Complete terms in LICENSE.txt
allowed-tools: Bash, Read, Grep, Glob
---

# My Skill

[Full skill instructions...]
EOF
```

**3. Add Scripts (Optional)**
```bash
# Create a utility script
cat > scripts/my-tool.sh << 'EOF'
#!/bin/bash
# Tool description
# Usage: my-tool.sh [options]

echo "Tool implementation"
EOF

chmod +x scripts/my-tool.sh
```

**4. Add Reference Documentation (Optional)**
```bash
# Create extended documentation
cat > references/checklist.md << 'EOF'
# My Skill Checklist

Detailed troubleshooting and reference patterns.
EOF
```

**5. Add Assets (Optional)**
```bash
# Add templates, configs, or resources
mkdir -p assets/templates
echo "Template content" > assets/templates/example.json
```

**6. Test the Skill**
```bash
# Test script execution
bash scripts/my-tool.sh

# Verify skill is discoverable
ls -la .claude/skills/my-skill/SKILL.md
```

**7. Use the Skill**
```
User: "Use my-skill to [do something]"
OR
User: "[Natural language that matches description triggers]"
```

### Skill Template Checklist

When creating a new skill, ensure it has:

- [ ] **Clear name** - 1-3 words, kebab-case
- [ ] **Comprehensive description** - Use cases + trigger phrases
- [ ] **Well-structured SKILL.md** - Quick start + workflows + reference
- [ ] **Executable scripts** (if needed) - With proper permissions
- [ ] **Reference docs** (if complex) - Checklists, patterns, API references
- [ ] **Assets** (if applicable) - Templates, configs, examples
- [ ] **Testing** - Verify scripts work and skill triggers correctly
- [ ] **Documentation** - How to use, when to use, what it provides

---

## Extending Existing Skills

### When to Extend vs. Create New

**Extend Existing Skill When:**
- Adding new workflows to same domain
- Enhancing capabilities of existing functionality
- Adding new scripts/tools for same purpose
- Improving documentation/checklists

**Create New Skill When:**
- Targeting different domain/purpose
- Requires different allowed-tools
- Serves distinct use cases
- Would make existing skill too complex

### Extension Patterns

**Pattern 1: Add New Script**

```bash
# Add new capability script
cat > .claude/skills/frontend-debugging/scripts/new-tool.py << 'EOF'
#!/usr/bin/env python3
"""
New debugging capability
"""
# Implementation
EOF

# Update SKILL.md with new script documentation
```

**Pattern 2: Add Reference Documentation**

```bash
# Add specialized checklist
cat > .claude/skills/frontend-debugging/references/new-checklist.md << 'EOF'
# New Debugging Patterns

Additional troubleshooting workflows for [specific scenario]
EOF

# Reference in SKILL.md: "For [use case], see: `references/new-checklist.md`"
```

**Pattern 3: Add Workflow Section**

```markdown
## Debugging Workflows

### [Existing Workflow 1]
...

### [Existing Workflow 2]
...

### [NEW] Performance Profiling Workflow

When investigating performance bottlenecks:

1. **Capture baseline metrics**
   ```bash
   bash scripts/new-tool.sh --baseline
   ```

2. **Run profiler**
   ```bash
   python scripts/profiler.py --url http://localhost:3000
   ```

3. **Analyze results**
   [Steps to interpret output]
```

**Pattern 4: Enhance Description**

```yaml
# OLD
description: Debug front-end issues including rendering bugs and console errors.

# NEW (EXTENDED)
description: Debug front-end issues including rendering bugs, performance problems, network failures, client-side errors, and accessibility violations. This skill should be used when investigating React/Next.js components, CSS styling problems, console errors, hydration mismatches, Core Web Vitals issues, or WCAG compliance. Leverages Playwright for browser automation, Lighthouse for performance audits, and axe-core for accessibility testing.
```

---

## Project Integration Patterns

### Integration with Slash Commands

Slash commands don't explicitly invoke skills with special syntax. Instead, they **set context** that triggers automatic skill loading.

**Pattern 1: Mention Skill Explicitly**
```markdown
# /diagnose Command

[Instructions...]

**Use the `frontend-debugging` skill** for systematic frontend debugging. This skill provides:
- Playwright-based inspection
- Lighthouse audits
- Structured workflows

Quick commands from the skill:
```

**Pattern 2: Set Context Keywords**
```markdown
# /feature Command

You are implementing a new frontend feature.
Build React components with distinctive design aesthetics.

[Claude sees "frontend", "React", "design" → triggers frontend-design skill]
```

**Pattern 3: Describe Expected Tools**
```markdown
# /debug Command

Use Playwright to capture screenshots and console logs.
Run Lighthouse for performance metrics.

[Mentions Playwright/Lighthouse → triggers frontend-debugging skill]
```

---

## Best Practices

### Skill Design Principles

**1. Single Responsibility**
- Each skill focuses on ONE domain or task type
- Example: frontend-debugging handles ALL frontend debugging
- Counter-example: Don't create mega-skills that handle everything

**2. Progressive Disclosure**
- Keep SKILL.md body focused and actionable (400-5000 tokens)
- Move extensive documentation to `references/`
- Load references only when explicitly needed
- Use scripts for complex operations

**3. Clear Trigger Patterns**
- Write descriptions that match natural language requests
- Include "Triggers on requests like..." with actual examples
- Test with real user queries
- Update descriptions when trigger patterns change

**4. Executable Over Explanatory**
- Provide concrete commands, not just theory
- Include copy-paste ready examples
- Show real file paths and parameters
- Demonstrate complete workflows

**5. Self-Contained Resources**
- Bundle all dependencies (scripts, configs, assets)
- Don't rely on external resources that might disappear
- Include setup instructions if prerequisites needed
- Document all external dependencies

---

## Summary

**Key Takeaways:**

1. **Skills are documentation, not code**: They're structured instructions that transform Claude into a specialist
2. **Progressive disclosure is key**: Only load what's needed when it's needed
3. **Automatic triggering works**: Write good descriptions, let Claude handle invocation
4. **Extend, don't duplicate**: Add to existing skills before creating new ones
5. **Scripts enhance, don't define**: Skills work with or without executable scripts
6. **Integration is context-based**: Slash commands mention skills or set triggering context
7. **Self-contained is critical**: Bundle all resources, don't rely on external dependencies
8. **Test trigger patterns**: Verify skills load automatically with natural language

**When to Create Custom Skills:**
- Repeated workflows specific to your project
- Domain expertise not covered by official skills
- Project-specific tooling or conventions
- Integration with custom infrastructure

**When to Extend Existing Skills:**
- Adding capabilities to same domain
- Enhancing workflows for similar use cases
- Adding scripts/tools for same purpose
- Improving documentation for existing skill

**When to Use Official Skills:**
- Standard frontend development (artifacts-builder, frontend-design)
- Common debugging tasks (web-app-testing)
- Document processing (pdf, xlsx, docx skills)
- Visual design (canvas-design)

---

## Related Documentation

**Project Files:**
- Existing skills: `.claude/skills/*/SKILL.md`
- Diagnose command: `.claude/commands/diagnose.md`
- Frontend debugging skill: `.claude/skills/frontend-debugging/SKILL.md`
- Frontend design skill: `.claude/skills/frontend-design/SKILL.md`

**Research Reports:**
- Skills system overview: `.ai/reports/research-reports/2025-12-01/context7-claude-code-skills-system.md`
- Skills invocation: `.ai/reports/research-reports/2025-12-01/context7-claude-code-skills-invocation.md`
- Frontend design skill: `.ai/reports/research-reports/2025-12-01/perplexity-claude-code-frontend-design-skill.md`

**External Resources:**
- Official skills repository: https://github.com/anthropics/skills
- Community skills: https://github.com/composiohq/awesome-claude-skills
- Claude documentation: https://docs.anthropic.com/en/docs/build-with-claude/skills

---

*Generated: 2025-12-01*
*Purpose: Comprehensive reference for Claude Code skills architecture, creation, and extension*
