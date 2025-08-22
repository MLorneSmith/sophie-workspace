# /code-check command refactor

We have a command .claude/commands/code-check.md

We want to improve it. 

## Requirements

1. Use agents
We should create individual agents to conduct each of the different types of code checks

2. Fix the claude code statusline 

The claude code statusline has a codeckech component that is meant to display the status of the codecheck. It is not updating correctly

3. Stop tracking the fix history on github issue #101
This is not adding much. We can remove this


4. Fix issues as they are found, rather than at the end. Use each individual agent to fix them

## Your Task

1. Create a new command file /codecheck based on the old /code-check
2. Create new agents to help with code check. Make a recommendation on the agents we should create and solicite feedback from the user
3. Identify the issue with the claude code statusline to determine if there is anything in /codecheck we need to include to enaure it works
4. Create /codecheck based on the requirements above
5. Fix the claude code statusline issue