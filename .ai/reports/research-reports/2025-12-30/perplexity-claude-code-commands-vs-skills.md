# Perplexity Research: Claude Code Commands vs Skills

**Date**: 2025-12-30
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Research into best practices for deciding between creating custom commands (in `.claude/commands/`) versus skills (in `.claude/skills/`) in Claude Code, the CLI tool from Anthropic. The investigation covered official documentation, decision criteria, organizational best practices, and whether both should coexist for the same functionality.

## Key Findings

### Fundamental Differences

| Aspect | Commands | Skills |
|--------|----------|--------|
| **Invocation** | Manual - user types `/command-name` | Automatic - Claude decides based on context |
| **Best For** | Quick actions, atomic tasks, CLI shortcuts | Domain expertise, complex workflows |
| **Control** | User-controlled, predictable | Model-driven, contextual |
| **Structure** | Single `.md` file | Directory with `SKILL.md` + supporting resources |
| **Complexity** | Low (simple, repeatable prompts) | Medium-High (complex workflows, bundled resources) |
| **Token Cost** | 100-1,000 tokens (full prompt every invocation) | 30-50 tokens at startup (metadata only), 500-5,000 when fully loaded |
| **Arguments** | Can accept arguments (e.g., issue number, file path) | Cannot accept arguments |
| **Concurrency** | Only one command at a time | Multiple skills can be active simultaneously |
| **Subagent Support** | Can invoke subagents | Can be executed BY subagents |

### How They Work Under the Hood

**Commands:**
1. Claude Code loads metadata (name, description) for each command at startup
2. When user types `/command-name`, the entire markdown file is loaded into context
3. The command executes with the full prompt content

**Skills:**
1. At startup, Claude reads only the name and description of each skill
2. When a request matches a skill's description (semantic similarity), Claude asks to use the skill
3. Only then is the full `SKILL.md` loaded into context
4. Supporting files are loaded on-demand (progressive disclosure)

### Decision Criteria / Rules of Thumb

**Use Commands when:**
- You want explicit, predictable shortcuts invoked frequently
- The task needs arguments (issue number, file path, version)
- The task is simple, repetitive, and fits in one markdown file
- You need full manual control over when the action happens
- Quick actions like running tests, creating git commits, scaffolding boilerplate

**Use Skills when:**
- You're codifying deep procedural or domain knowledge
- Claude should apply expertise automatically when tasks match
- You want to bundle instructions with executable code or data files
- The workflow has multiple steps, templates, scripts, or extra resources
- The task is conditional and may not be relevant to every user request
- You want multiple capabilities to potentially activate together

### Best Practices for Organization

1. **Description Clarity is Critical**: Generic skill descriptions fail. Use explicit boundaries with "WHEN + WHEN NOT" patterns and possessive pronouns to prevent false positives.

2. **Multi-Skill Coordination**: Claude successfully loads complementary skills together. Design them to coexist without conflicts.

3. **Progressive Disclosure**: Put essential information in `SKILL.md` and detailed reference material in separate files that Claude reads only when needed.

4. **Hybrid Patterns Work**: Combine subagents for analysis (using Read/Grep/Glob/TodoWrite) with the main Claude instance for execution (Write/Edit/Bash) to preserve security boundaries.

5. **Subagent Conciseness**: Keep subagents concise - a refactored subagent from 803 lines to 281 lines lost zero functionality while improving performance.

### Can Commands and Skills Coexist?

**Yes, they can coexist and should be used together for maximum effectiveness.** However:

- **Having both for the SAME functionality is an anti-pattern** that causes redundancy, confusion, and suboptimal performance
- Commands can invoke subagents or run bash scripts as workflow shortcuts
- Skills provide the underlying domain expertise
- Use Skills for contextual knowledge and Commands for frequently-triggered workflows

**Anti-pattern warning**: Creating both a command and a skill that do the same thing:
- Duplicates effort and fragments the system
- Skills handle automatic, context-driven invocation; adding a command bypasses this
- Leads to inconsistent behavior or overlooked automation
- Commands are best for shortcuts to subagents or utilities, not replicating skill complexity

### File Locations

| Type | Project Scope | Personal Scope |
|------|--------------|----------------|
| Commands | `.claude/commands/` | `~/.claude/commands/` |
| Skills | `.claude/skills/` | `~/.claude/skills/` |

### Sharing and Distribution

Both skills and commands are easy to share:
- They live inside the `.claude/` folder
- Once committed, anyone pulling the project gets them
- Both can be configured in two scopes: project-specific or personal
- For broader distribution, bundle into plugins

## Sources & Citations

1. [Claude Code: Best practices for agentic coding - Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices)
2. [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
3. [Claude Code: Skills vs Custom Slash Commands (Video)](https://www.youtube.com/watch?v=D9auszpVMQY)

## Key Takeaways

1. **Commands = Manual shortcuts**: User-triggered, argument-accepting, simple tasks
2. **Skills = Automatic expertise**: Model-triggered, context-aware, complex workflows
3. **Use both together**: Commands for explicit actions, Skills for domain knowledge
4. **Never duplicate**: Having both for the same functionality is an anti-pattern
5. **Description quality matters**: Skill descriptions are critical for proper activation
6. **Progressive disclosure**: Skills should load supporting files on-demand, not upfront

## Decision Tree

```
Is the task triggered explicitly by the user?
├─ YES → Does it need arguments?
│        ├─ YES → Use COMMAND
│        └─ NO  → Is it simple and atomic?
│                 ├─ YES → Use COMMAND
│                 └─ NO  → Consider SKILL
└─ NO  → Should Claude auto-detect when it's relevant?
         ├─ YES → Use SKILL
         └─ NO  → Use COMMAND or CLAUDE.md
```

## Related Searches

- Claude Code subagents best practices
- Claude Code hooks vs skills comparison
- MCP servers integration with Claude Code
- Claude Code plugin development
