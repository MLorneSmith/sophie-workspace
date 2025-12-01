# Context7 Research: Claude Code Skills Invocation and Integration

**Date**: 2025-12-01
**Agent**: context7-expert
**Topic**: How Claude Code skills are invoked, triggered, and integrated with slash commands

## Query Summary

Researched the mechanics of how Claude Code skills work, focusing on:
1. How skills are invoked (syntax and methods)
2. How Claude detects which skills to load
3. How slash commands can direct Claude to use specific skills
4. The relationship between skill metadata and automatic triggering

## Findings

### 1. How Skills Are Invoked

Claude Code skills use **automatic detection** rather than explicit invocation syntax. There is **no `skill:name` syntax** or manual invocation command.

#### Automatic Triggering (Primary Method)

Skills are automatically loaded by Claude when:

1. **The `description` field in YAML frontmatter matches the task**
   - Claude analyzes the user's request
   - Compares keywords/intent against skill descriptions
   - Automatically loads matching skills just-in-time

2. **User mentions the skill by name** (informal invocation)
   ```
   "Use the frontend-design skill to create a landing page"
   "Apply the web-artifacts-builder skill to build a React app"
   ```

3. **Task patterns match trigger keywords** in the description
   - Example from `e2b-sandbox` skill description: "Triggers on requests like 'create a template for Claude Code', 'run tests in a sandbox', 'set up E2B for my project'"

#### Example: How `frontend-design` Skill Triggers

**YAML Frontmatter:**
```yaml
---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
---
```

**Triggering Requests:**
- "Build a landing page for a SaaS product" ✓ (matches "build...pages")
- "Create a React component" ✓ (matches "build web components")
- "Design an admin interface" ✓ (matches "applications")
- "Debug a CSS issue" ✗ (no match - would trigger `frontend-debugging` instead)

**Key Insight:** The `description` field is **critical** for automatic triggering. It should explicitly state "This skill should be used when..." with concrete examples.

### 2. Skill Detection Mechanism

#### Progressive Disclosure Model

Skills use a three-tier loading system:

1. **Level 1: Metadata (always in context)**
   - `name` field (~2-4 words)
   - `description` field (~50-100 words)
   - ~100-200 tokens total

2. **Level 2: SKILL.md body (when skill triggers)**
   - Full instructions and guidelines
   - ~400-5000 tokens
   - Loaded just-in-time when skill matches

3. **Level 3: Bundled resources (on-demand)**
   - `scripts/` - Executable code
   - `references/` - Documentation loaded as needed
   - `assets/` - Templates and resources
   - Loaded only when Claude determines they're needed

#### How Claude Decides Which Skills to Load

Based on analysis of existing skills, Claude uses:

**Keyword Matching:**
- Extracts keywords from user request
- Compares against skill descriptions
- Scores relevance

**Intent Recognition:**
- Understands task type (debugging, design, execution, etc.)
- Matches to skill purposes

**Explicit Mentions:**
- User says "use the X skill"
- Direct skill name reference

**Context Awareness:**
- Current files being edited
- Tools being used
- Previous conversation context

### 3. How Slash Commands Direct Skill Usage

Slash commands **do NOT directly invoke skills** with special syntax. Instead, they **set context** that helps Claude select appropriate skills.

#### Current Project Example: No Skill Invocation

Looking at this project's slash commands (`.claude/commands/`), **none of them explicitly invoke skills**. They rely on:

1. **Detailed instructions** in the command markdown
2. **Context setting** that triggers automatic skill loading
3. **Natural language** that Claude interprets

**Example from `/diagnose` command:**
- Does NOT say: `@skill:frontend-debugging` or `skill:frontend-debugging`
- DOES set context: "Debug front-end issues including rendering bugs..."
- Claude automatically loads `frontend-debugging` skill when the context matches

#### Pattern for Directing Skill Usage in Commands

Based on the existing skills, the recommended pattern is:

**Method 1: Implicit Context Setting (Recommended)**
```markdown
# My Command

You are debugging a React component with rendering issues.
Capture screenshots and console logs to diagnose the problem.

[Claude automatically loads frontend-debugging skill]
```

**Method 2: Explicit Mention (Optional)**
```markdown
# My Command

Use the frontend-debugging skill to investigate the issue.
Follow the visual debugging workflow.

[Explicit mention ensures skill loads]
```

**Method 3: Describe What to Do (Let Claude Choose)**
```markdown
# My Command

Analyze the frontend issue by:
1. Taking screenshots
2. Checking console errors
3. Running performance audits

[Claude may load frontend-debugging or choose other approach]
```

### 4. Writing Effective Skill Descriptions

The `description` field is the **primary mechanism** for automatic skill triggering.

#### Best Practices from Official Skills

**Good Description (frontend-debugging):**
```yaml
description: Debug front-end issues including rendering bugs, performance problems, network failures, and client-side errors. This skill should be used when investigating React/Next.js components, CSS styling problems, console errors, hydration mismatches, or Core Web Vitals issues. Leverages Playwright for browser automation and Lighthouse for performance audits.
```

**Why it works:**
- Lists specific use cases
- Uses "This skill should be used when..." pattern
- Mentions concrete technologies (React, Next.js, Playwright)
- Describes triggering scenarios (rendering bugs, console errors, etc.)

**Good Description (e2b-sandbox):**
```yaml
description: This skill should be used when managing E2B secure cloud sandboxes for AI agent workflows, especially for running Claude Code agents to build features and run tests. Use for creating custom templates with pre-cloned repositories, managing sandbox lifecycle, and integrating AI agents with isolated execution environments. Triggers on requests like "create a template for Claude Code", "run tests in a sandbox", "set up E2B for my project", or "spin up a dev environment".
```

**Why it works:**
- Explicitly states "Triggers on requests like..."
- Provides example user phrases verbatim
- Third-person voice ("This skill should be used when...")
- Comprehensive list of capabilities

#### Description Formula

```yaml
description: [Main purpose]. This skill should be used when [situation 1], [situation 2], or [situation 3]. [Technology/tool mentions]. Triggers on requests like "[example 1]", "[example 2]", "[example 3]".
```

**Components:**
1. **Main purpose** - One sentence describing what the skill does
2. **Use cases** - When to use it (situations, contexts)
3. **Technologies** - Specific tools/frameworks it works with
4. **Example phrases** - Actual user requests that should trigger it

### 5. Allowed Tools

Skills can specify which tools Claude is permitted to use:

```yaml
---
name: frontend-debugging
description: ...
allowed-tools: Bash, Read, Grep, Glob
---
```

**Purpose:**
- Restricts skill to safe, relevant tools
- Prevents skills from doing unintended operations
- Documents expected tool usage patterns

**Common tool sets:**
- **Debugging skills:** Bash, Read, Grep, Glob
- **Design skills:** (typically no restrictions - needs full creative freedom)
- **Code execution skills:** Bash, Read, Write

### 6. Integration with Slash Commands

#### Current Project Patterns

The project's slash commands use **natural language instructions** rather than explicit skill invocation:

**Example: No `/skill` command exists**
- Commands describe WHAT to do
- Claude automatically selects skills based on task
- Skills load just-in-time without manual intervention

**Example: `/diagnose` command**
```markdown
# Diagnose Command

Follow the diagnosis workflow:
1. Capture current state
2. Analyze logs and errors
3. Identify root cause

[Claude sees "logs", "errors", "diagnose" and may load debugging skills]
```

#### How to Guide Skill Selection in Commands

**Pattern 1: Set Task Context**
```markdown
# Feature Command

You are implementing a new frontend feature.
Build React components with distinctive design aesthetics.

[Triggers: frontend-design skill]
```

**Pattern 2: Mention Skill Explicitly**
```markdown
# Feature Command

Use the frontend-design skill to create components.

[Explicit mention ensures skill loads]
```

**Pattern 3: Describe Expected Tools**
```markdown
# Debug Command

Use Playwright to capture screenshots and console logs.
Run Lighthouse for performance metrics.

[Mentions Playwright/Lighthouse → triggers frontend-debugging]
```

## Key Takeaways

1. **No explicit syntax:** Skills don't use `skill:name` or `@skill` syntax
2. **Automatic detection:** Claude analyzes requests against skill descriptions
3. **Description is critical:** The `description` YAML field determines when skills load
4. **Slash commands guide indirectly:** Commands set context, Claude selects skills
5. **Third-person voice:** Descriptions should say "This skill should be used when..." not "Use this skill when..."
6. **Include trigger phrases:** List example requests in the description (e.g., "Triggers on requests like...")
7. **Progressive disclosure:** Only metadata is always loaded; full skill loads just-in-time
8. **Informal mentions work:** Saying "use the X skill" in natural language triggers the skill
9. **No manual loading needed:** Claude handles skill selection autonomously
10. **Tool restrictions:** Use `allowed-tools` to limit what the skill can do

## Code Examples

### Example 1: Creating a Skill That Auto-Triggers

```yaml
---
name: api-integration
description: Integrate external APIs into the application. This skill should be used when implementing REST API clients, handling authentication, managing rate limits, or debugging API responses. Use for tasks involving fetch calls, axios configuration, API key management, or webhook handlers. Triggers on requests like "integrate the Stripe API", "add authentication to API calls", "debug 401 errors", or "set up webhook handling".
allowed-tools: Bash, Read, Write, Grep, Glob
---

# API Integration Skill

[Detailed instructions...]
```

**This skill would auto-trigger on:**
- "Help me integrate Stripe into the checkout flow" ✓
- "The API is returning 401 errors" ✓
- "Set up a webhook endpoint for payments" ✓
- "How do I add authentication headers?" ✓

**Would NOT trigger on:**
- "Debug the frontend rendering issue" ✗
- "Optimize database queries" ✗

### Example 2: Slash Command That Guides Skill Selection

```markdown
# /api-implement Command

You are implementing an external API integration.

**Context:**
- Working with REST APIs
- Need authentication, error handling, and rate limiting
- May need to debug API responses and network issues

**Steps:**
1. Review the API documentation
2. Implement typed API client functions
3. Add authentication and error handling
4. Test with example requests
5. Handle rate limits and retries

[Claude sees "API", "authentication", "API responses" → loads api-integration skill]
```

### Example 3: Informal Skill Invocation

```markdown
User: "Use the frontend-design skill to build a landing page with a brutalist aesthetic"

[Claude loads frontend-design skill and follows its guidelines]
```

### Example 4: Checking Which Skills Would Trigger

Given a user request, Claude matches against skill descriptions:

**Request:** "The checkout page is broken - nothing renders and there are console errors"

**Skill Matching:**
```
frontend-debugging: ✓ HIGH MATCH
  - "rendering bugs" ✓
  - "console errors" ✓
  - "React/Next.js components" ✓

frontend-design: ✗ NO MATCH
  - No mention of design, aesthetics, building new UI

e2b-sandbox: ✗ NO MATCH
  - No mention of sandboxes, testing, or isolation
```

**Result:** Claude loads `frontend-debugging` skill automatically.

## Practical Guidelines

### For Skill Creators

1. **Write descriptive descriptions**
   - List 5-7 concrete use cases
   - Include "This skill should be used when..."
   - Add "Triggers on requests like..." with examples

2. **Use third-person voice**
   - ✓ "This skill should be used when..."
   - ✗ "Use this skill when..."

3. **Mention technologies explicitly**
   - ✓ "Leverages Playwright for browser automation"
   - ✗ "Uses testing tools"

4. **Include example trigger phrases**
   - ✓ `Triggers on requests like "debug the component", "capture screenshots"`
   - ✗ Just listing capabilities without examples

5. **Test triggering**
   - Write sample user requests
   - Verify the description would match
   - Adjust keywords if needed

### For Command Writers

1. **Set clear context**
   - Describe the task type
   - Mention relevant technologies
   - Use keywords that match skill descriptions

2. **Let Claude choose**
   - Don't over-specify the approach
   - Trust automatic skill selection
   - Only mention skills explicitly if critical

3. **Use natural language**
   - Write commands as you would instruct a human
   - Claude interprets intent, not syntax

4. **Provide examples**
   - Show sample inputs/outputs
   - Describe expected workflows
   - Reference tools by name

### For Users

1. **Natural language works**
   - "Debug this component" → triggers debugging skills
   - "Build a landing page" → triggers design skills
   - "Run tests in isolation" → triggers sandbox skills

2. **Explicit mentions work too**
   - "Use the frontend-design skill to create..."
   - "Apply the web-artifacts-builder skill..."

3. **No special syntax needed**
   - No `@skill` or `skill:name` required
   - Just describe what you want
   - Claude handles skill selection

## Related Documentation

**Official Anthropic Resources:**
- Skills Repository: https://github.com/anthropics/skills
- Skills API: https://docs.anthropic.com/en/docs/build-with-claude/skills
- Claude Code Plugin System: https://code.claude.com/docs/en/plugin-marketplaces

**Project Files:**
- Skill Creator Guide: `.claude/skills/skill-creator/SKILL.md`
- Example Skills: `.claude/skills/*/SKILL.md`
- Slash Commands: `.claude/commands/*.md`

**Previous Research:**
- Context7 Skills System: `.ai/reports/research-reports/2025-12-01/context7-claude-code-skills-system.md`
- Frontend Design Skill: `.ai/reports/research-reports/2025-12-01/perplexity-claude-code-frontend-design-skill.md`

## Conclusion

Claude Code skills use **automatic detection** based on task analysis and description matching. There is no special invocation syntax like `skill:name` or `@skill`. Instead:

1. **Skills define when they should be used** via detailed `description` fields
2. **Claude analyzes user requests** and matches them to skill descriptions
3. **Skills load just-in-time** with progressive disclosure (metadata → body → resources)
4. **Slash commands guide indirectly** by setting context and using keywords
5. **Users can mention skills informally** ("use the X skill") but it's optional

The system prioritizes **natural language understanding** over rigid syntax, making it flexible and user-friendly while maintaining precision through well-written skill descriptions.
