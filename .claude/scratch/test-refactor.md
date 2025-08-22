# /test command refactor

We have a command .claude/commands/test.md

We want to improve it. 

## Requirements

1. Use agents
We should create individual claude code agents to conduct each of the different types of tests. Can we organize these agents in s subdirectory of /agents? Perhaps /agentes/test?

2. Format the /test file based on the YAML Structured output style

3. E2E tests take a long time. Identify a strategy to manage this.
4. Ensure the claude code statusline test componenet is working
The claude code statusline has a test component that is meant to display the status of the tests.
- Make sure it is updating correctly. It should show the status (pass/ fail) as a red or green circle, the number of errors, and the time since the /test command was last run.

## Your Task

1. Create new agents to help with testing. Make a recommendation on the agents we should create and solicite feedback from the user on what agents to create
2. Identify if there are any issues with the claude code statusline to determine if there is anything in the new /test we need to include to ensure it works. Pay specific attention to what commands we are running to conduct each testus
3. Create a new command file /codecheck based on the old /code-check using the YAML Structured output syle. Incorporate the requirements above
4. Fix the claude code statusline issue. Review how the other comoponents of the statusline are implemented (the test component works properly for example)