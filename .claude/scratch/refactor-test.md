# /test command refactor

We have a command .claude/commands/test.md

We want to improve it. 

## Requirements

1. Determine if an orchestrator agent is required. 
   Currrently we have the /test command invoke an orchestrator agent, which then manages subagents. Is the use of the /test command plus the orchestroator agent repetitive? Is the orchastroator agent required, or is the management of the subagents better done by the /test command? What is best practice?
2. We are not seeing the subagents run, based on what is displayed by claude code. this is probabaly due to the subagents being managed bu the orchestrator agent

## Your Task

1. Fetch and read https://docs.anthropic.com/en/docs/claude-code/sub-agents
2. Use the .claude/agents/research-analyst.md agent to research the best practice management approach of managing subagents with claude code slash commands
3. Make a recommendation for optimizing the /test command's use of the orchestrator agent
4. Make any other suggestions you might have for improving the reliability and robustness of the /test command