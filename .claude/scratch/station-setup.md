# Cloudshipai Station Setup

We are in the process of trying to setup https://github.com/cloudshipai/station to be used by the project. Specifically, I want to access the current set of mcp servers that are configured to be used by claude code cia Station. The purpose of this is to reduce the context overhead of loading all of these mcp servers into claude code for every session

The https://github.com/cloudshipai/station repo has been cloned here: "\\wsl.localhost\Ubuntu\home\msmith\projects\station"

In a previous task we installed station at a system level.

## Best practices
The MCP documentation emphasizes these best practices regardless of deployment method:

- Always log to stderr to prevent STDIO transport corruption
- Use the MCP inspector tool (npx @modelcontextprotocol/inspector) for testing

## Success criteria
1. I want to be able to access mcp servers from within claude code via station
2. I want the context overhead of running many mcp servers in claude code reduced

## Your task
1. Use the research-agent to deeply research cloudshipai Station and understand how to install it and set it up for use by claude code
2. Review the claudshipai station project repository here: "\\wsl.localhost\Ubuntu\home\msmith\projects\station" to understand its setup instructions and how it works
3. Read .claude/context/systems/mcp-servers.md to understand how we have configured claude code to use mcp servers in our project
4. Confirm that station has been installed at a system level
5. Explain to the user how we will use Station to run/access mcp servers from within Claude Code
6. Identify any mcp servers that might not run that well via station and should remain as mcp servers configured within claude code
7. Explain to the user how we will implement mcp best practices
8. Determine what else needs to be done to configure our project to use Station to run mcp servers