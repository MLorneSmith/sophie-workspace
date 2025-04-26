# Deebo MCP Server: Comprehensive Usage Guide

## Overview

Deebo is an autonomous debugging system that uses multiple competing hypotheses to investigate and fix software bugs. It creates multiple scenarios, each testing a different theory about the bug's cause, before converging on a validated solution.

## Configuration Details

The Deebo MCP server has been installed and configured with the following environment variables:

- `NODE_ENV`: development
- `USE_MEMORY_BANK`: true
- `MOTHER_HOST`: claude
- `MOTHER_MODEL`: claude-3-opus-20240229
- `SCENARIO_HOST`: claude
- `SCENARIO_MODEL`: claude-3-sonnet-20240229

Configuration has been applied to:
`C:\Users\msmit\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

## Available Tools

Deebo provides four main tools through the MCP interface:

### 1. `start` - Begin a Debugging Session

This initiates a debugging session by launching a "mother agent" that:

- Analyzes the error
- Generates multiple hypotheses about potential causes
- Creates isolated "scenario agents" to test each hypothesis in separate git branches

**Required Parameters:**

- `error`: The error message or description of the bug to investigate
- `repoPath`: Absolute path to the git repository containing the code to debug

**Optional Parameters:**

- `context`: Additional context like code snippets or previous attempts
- `language`: Programming language of the code being debugged
- `filePath`: Relative path to the specific file containing the bug, if known

**Example:**

```typescript
<use_mcp_tool>
<server_name>deebo</server_name>
<tool_name>start</tool_name>
<arguments>
{
  "error": "TypeError: Cannot read property 'length' of undefined in UserList component",
  "repoPath": "d:/SlideHeroes/App/repos/2025slideheroes",
  "context": "The error happens when navigating to the user list page after logout",
  "language": "typescript",
  "filePath": "apps/web/app/home/(user)/users/page.tsx"
}
</arguments>
</use_mcp_tool>
```

**Returns:** A session ID that you'll use to check progress or cancel the session (e.g., `session-1745690498791`)

### 2. `check` - Monitor Debugging Progress

This retrieves the current status of a debugging session, providing a detailed "pulse report" of what's happening.

**Required Parameters:**

- `sessionId`: The session ID returned by the start tool

**Example:**

```typescript
<use_mcp_tool>
<server_name>deebo</server_name>
<tool_name>check</tool_name>
<arguments>
{
  "sessionId": "session-1745690498791"
}
</arguments>
</use_mcp_tool>
```

The pulse report includes:

- Overall session status and duration
- Mother agent's current stage (in OODA loop: Observe, Orient, Decide, Act)
- Running scenario agents with their hypotheses
- Findings and results from completed scenarios
- Final solution with code changes (for completed sessions)

### 3. `cancel` - Terminate a Debugging Session

This terminates all processes related to a debugging session, including the mother agent and all scenario agents.

**Required Parameters:**

- `sessionId`: The session ID to cancel
- `agentId`: ID of the agent receiving the cancellation (usually "mother")
- `observation`: Text explaining why you're cancelling

**Example:**

```typescript
<use_mcp_tool>
<server_name>deebo</server_name>
<tool_name>cancel</tool_name>
<arguments>
{
  "sessionId": "session-1745690498791",
  "agentId": "mother",
  "observation": "Cancelling the session as I found the issue manually"
}
</arguments>
</use_mcp_tool>
```

### 4. `add_observation` - Provide Additional Information

This allows you to add external observations to help guide the debugging process, such as test results or insights.

**Required Parameters:**

- `sessionId`: The session ID
- `agentId`: Target agent ID (either "mother" or a specific scenario agent like "scenario-session-1712268439123-2")
- `observation`: The information to provide

**Example:**

```typescript
<use_mcp_tool>
<server_name>deebo</server_name>
<tool_name>add_observation</tool_name>
<arguments>
{
  "sessionId": "session-1745690498791",
  "agentId": "mother",
  "observation": "I've confirmed the users array is undefined when the component mounts with no authentication"
}
</arguments>
</use_mcp_tool>
```

## Original Configuration Examples

The following examples from the original documentation are preserved for reference:

### Starting a debugging session:

```
<deebo>
  <start
    error="[Error message]"
    repoPath="[Path to repository]"
    context="[Additional context]"
    filePath="[Path to suspected file]"
    language="[Programming language]"
  />
</deebo>
```

### Checking session status:

```
<deebo>
  <check sessionId="[session ID]" />
</deebo>
```

### Canceling a debugging session:

```
<deebo>
  <cancel sessionId="[session ID]" />
</deebo>
```

### Adding an observation:

```
<deebo>
  <add_observation
    sessionId="[session ID]"
    agentId="[mother or scenario-session-ID-N]"
    observation="[Your observation as plain text]"
  />
</deebo>
```

## Typical Workflow

1. **Start a debugging session** with as much detail as possible about the error
2. **Check progress periodically** using the session ID
3. **Add observations** if you discover relevant information
4. **Review the solution** when Deebo completes the debugging
5. **Cancel the session** if needed (when you find the solution yourself or want to restart)

## Tips for Effective Usage

1. Provide detailed error messages and stack traces when starting a session
2. Include relevant context about what was happening when the error occurred
3. Specify the programming language to improve initial analysis
4. If you know the specific file(s) likely containing the bug, include the file path
5. Use the `check` tool periodically to monitor progress
6. Be patient - complex bugs may require time to analyze multiple hypotheses
7. If the solution isn't suitable, you can add observations to guide the investigation

## Technical Details

The Deebo MCP server runs using Node.js with the following configuration:

```
node --experimental-specifier-resolution=node --experimental-modules --max-old-space-size=4096 C:\Users\msmit\Documents\Cline\MCP\deebo\build\index.js
```

Remember that Deebo works by creating multiple git branches to test different solutions, so it's best used in a repository where this branching won't interfere with other development work.
