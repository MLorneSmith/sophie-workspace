# /code-check command refactor

We have a command .claude/commands/code-check.md

We want to improve it. 

## Requirements

1. Use agents
We should create individual claude code agents to conduct each of the different types of code checks. Can we organize these agents in s subdirectory of /agents? Perhaps /agentes/codecheck?

2. Stop tracking the fix history on github issue #101
This is not adding much. We can remove this

3. Fix code issues as they are found, rather than at the end. Use each individual agent to fix them

4. Fix the claude code statusline 
The claude code statusline has a codecheck component that is meant to display the status of the codecheck. It is not updating correctly. The time since a last update is not updating. When tereh are errors, the color is not changing

## Your Task

1. Create a new command file /codecheck based on the old /code-check
2. Create new agents to help with code check. Make a recommendation on the agents we should create and solicite feedback from the user on what agents to create
3. Identify the issue with the claude code statusline to determine if there is anything in /codecheck we need to include to ensure it works
4. Create /codecheck based on the requirements above
5. Fix the claude code statusline issue. Review how the other comoponents of the statusline are implemented (the test component works properly for example)