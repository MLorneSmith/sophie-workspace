# Perplexity Research: Claude Code Sub-Agents, Task Tool, and Slash Command Invocation

**Date**: 2025-12-30
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Research was conducted to understand:
1. How to properly invoke sub-agents from within Claude Code slash commands or skills
2. Whether sub-agents can run slash commands
3. The correct syntax for Task tool invocation
4. The relationship between Task tool, sub-agents, and slash commands
5. Official patterns for having sub-agents execute slash commands

## Key Findings

### 1. Sub-Agents CANNOT Invoke Slash Commands

**Critical finding**: Sub-agents cannot directly invoke slash commands. Slash commands are designed for the main orchestrator (primary Claude instance), while sub-agents handle delegated tasks in isolated contexts.

- Slash commands are user-initiated prompts stored as Markdown files
- They inject prompts into the main thread and can orchestrate sub-agents
- Sub-agents operate in isolated context windows with their descriptions loaded into main context
- There is NO mechanism for sub-agents to execute slash commands programmatically

### 2. The Task Tool and Sub-Agent Relationship

The **Task tool** is Claude Code's mechanism for spawning sub-agents:

- Sub-agents are invoked via the Task tool internally
- To detect sub-agent invocation, check for `tool_use` blocks with `name: "Task"`
- Messages from within a sub-agent's context include a `parent_tool_use_id` field
- Sub-agents CANNOT spawn other sub-agents (prevents infinite nesting)

**Important**: The Task tool must be included in `allowedTools` for sub-agent functionality.

### 3. Correct Sub-Agent Invocation Patterns

#### From Natural Language (Recommended)
```
> Use the test-runner subagent to fix failing tests
> Have the code-reviewer subagent look at my recent changes
> Ask the debugger subagent to investigate this error
```

#### Using @-Mention Syntax
```
> @agent-name analyze this code
```

#### Automatic Delegation
Claude automatically delegates based on:
- The task description in your request
- The `description` field in subagent configurations
- Current context and available tools

### 4. The SlashCommand Tool (Main Thread Only)

There IS a `SlashCommand` tool, but it only works in the main thread, NOT in sub-agents:

```
# In CLAUDE.md or prompts:
> Run /write-unit-test when you are about to start writing tests.
```

**Requirements for SlashCommand tool**:
- Only supports user-defined custom slash commands
- Built-in commands like `/compact` and `/init` are NOT supported
- Commands must have the `description` frontmatter field populated
- Can be disabled via `/permissions` by adding `SlashCommand` to deny rules

### 5. Answering Your Specific Question

**Is this syntax correct?**
```
Task("run slashCommand .claude/commands/conditional_docs.md to identify relevant context files about [XYZ]")
```

**INCORRECT** - This syntax will not work because:

1. Sub-agents invoked via Task cannot execute slash commands
2. There is no `Task()` function call syntax - Claude uses natural language delegation
3. The Task tool is an internal mechanism, not a callable function

**Correct approach** - Use one of these patterns instead:

```markdown
# Option 1: Main thread SlashCommand tool (if custom command with description)
Run /conditional_docs to identify relevant context files about authentication

# Option 2: Delegate research to a sub-agent (without slash command)
Use the research-assistant subagent to read .claude/commands/conditional_docs.md 
and follow its instructions to identify relevant context files about authentication

# Option 3: Direct natural language task
Analyze the task "[XYZ]" and identify which context documentation files from 
.ai/ai_docs/context-docs/ would be most relevant based on the keywords in the task
```

### 6. Sub-Agent Configuration Format

Sub-agents are defined in Markdown files with YAML frontmatter:

```markdown
---
name: your-sub-agent-name
description: Description of when this subagent should be invoked
tools: tool1, tool2, tool3  # Optional - inherits all tools if omitted
model: sonnet               # Optional - specify model alias or 'inherit'
permissionMode: default     # Optional
skills: skill1, skill2      # Optional - skills to auto-load
---

Your subagent's system prompt goes here.
```

### 7. SDK Programmatic Usage

For programmatic invocation (Agent SDK), sub-agents are defined via the `agents` parameter:

```python
from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition

async for message in query(
    prompt="Review the authentication module",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Grep", "Glob", "Task"],  # Task required!
        agents={
            "code-reviewer": AgentDefinition(
                description="Expert code review specialist.",
                prompt="You are a code review specialist...",
                tools=["Read", "Grep", "Glob"],
                model="sonnet"
            )
        }
    )
):
    ...
```

### 8. Workaround Patterns

Since sub-agents cannot invoke slash commands, use these workarounds:

#### Pattern A: Pre-Execute Slash Command
Execute the slash command BEFORE delegating to sub-agent:
```
1. Run /conditional_docs to get relevant files
2. Use findings as context for sub-agent task
```

#### Pattern B: Inline the Command Content
Instead of invoking the slash command, have the sub-agent READ the command file and follow its instructions:
```
Use the research-assistant subagent to:
1. Read .claude/commands/conditional_docs.md
2. Follow the instructions in that file to identify relevant context
3. Return the list of recommended documentation files
```

#### Pattern C: Convert to Skill
Convert the slash command to a Skill and assign it to the sub-agent:
```yaml
---
name: context-researcher
skills: conditional-docs-skill
---
```

## Sources & Citations

1. **Official Claude Code Subagents Documentation**
   - https://code.claude.com/docs/en/sub-agents
   - Authoritative source on subagent creation, configuration, and usage

2. **Claude Agent SDK Documentation**
   - https://platform.claude.com/docs/en/agent-sdk/subagents
   - Programmatic subagent definition and invocation patterns

3. **Claude Code Slash Commands Documentation**
   - https://code.claude.com/docs/en/slash-commands
   - SlashCommand tool, plugin commands, MCP integration

4. **Anthropic Engineering Blog - Best Practices**
   - https://www.anthropic.com/engineering/claude-code-best-practices
   - Official patterns for CLAUDE.md, subagent usage, and workflow optimization

5. **Anthropic Engineering Blog - Agent SDK**
   - https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
   - SDK architecture and subagent patterns

6. **Claude Code Market Documentation**
   - https://www.ccmarket.dev/docs
   - Community patterns for agent usage

7. **ClaudeLog - Task/Agent Tools**
   - https://claudelog.com/mechanics/task-agent-tools/
   - Practical Task tool usage patterns

## Key Takeaways

1. **Sub-agents CANNOT invoke slash commands** - This is a fundamental architectural limitation
2. **Task tool is internal** - No `Task()` function call syntax exists
3. **SlashCommand tool exists** but only for main thread, not sub-agents
4. **Natural language delegation** is the correct pattern for sub-agent invocation
5. **Workarounds exist** - Pre-execute, inline content, or convert to Skills

## Recommendations for Your Use Case

For the `conditional_docs` scenario:

1. **If used frequently**: Convert to a Skill that can be assigned to sub-agents
2. **If needed in main thread**: Use SlashCommand tool with proper description frontmatter
3. **If sub-agent needs the logic**: Have sub-agent read and follow the command file directly
4. **If orchestrating**: Execute slash command first, then delegate with the results

## Related Searches

- Claude Code Skills vs Slash Commands comparison
- Claude Code MCP prompt integration patterns
- Agent SDK advanced delegation patterns
- Claude Code hook system for command automation
