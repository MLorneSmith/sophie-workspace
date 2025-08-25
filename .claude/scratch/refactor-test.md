# /test command refactor

We have a command .claude/commands/test.md

We are in the process of debugging it. 

## Read
Read issues #235 and #236 on github

## Requirements

1. Run the /test command to verify its current status and identify any issues, errors or opportunities for optimization
2. Identify opporunities to enhance bash permissions to reduce the amount of user interaction required
3. The /test command is not correctly updating the test component in the claude code statusline

## Your Task

1. Fetch and read https://docs.anthropic.com/en/docs/claude-code/sub-agents
2. Use the .claude/agents/research-analyst.md agent to research the best practice management approach of managing subagents with claude code slash commands
3. Identify current errors and issues
4. Develop additional recommendations for further optiomization
5. Use the /log-issue command to create a new issue that consolidates all of the issues and recommended fixes