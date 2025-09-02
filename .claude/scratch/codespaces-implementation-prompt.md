# GitHub Codespaces implementation

I want to implement the use of Github codespaces.

We have implemented a devcontainter (.devcontainer) based on the official Claude Code reference devcontainer implementation (https://docs.anthropic.com/en/docs/claude-code/devcontainer)

## Requirements 

1. I want to be able to use this devcontainer to run Github Codespaces
2. Be aware that our environment has three docker containers - 2025slideheres (the app), 2025slideheroes-e2e (for running e2e tests) and mcp-servers (for running mcp servers). I am not clear on how we ensure our devcontainer environment includes all three of these docker containers. I believe our current implementation of the devcontainer has taken this into account.
3. I want to be able to run github codespaces and develop locally at the same time - basically running multiple suessions of Claude Code at the same time - one locally and others in github Codespaces. 
   1. I need instructions on how to set this up or we need to use the github api or github mcp server
   2. I use the Warp terminal to run claude code locally 
   3. I also use VSCode

## Your Task

1. Fetch and read https://docs.anthropic.com/en/docs/claude-code/devcontainer
2. Use the research-analyst agent to 
   1. Research using devcontainers with github codespaces
   2. Research how to setup github codespaces
3. Identify any potential issues with our current implementation of devcontainer
4. Develop a plan for setting up github Codespaces
