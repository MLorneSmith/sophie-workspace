# Perplexity Research: Claude Agent SDK

**Date**: 2026-01-06
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (combined research)

## Query Summary

Research into the official Anthropic Claude Agent SDK for building AI agents programmatically, focusing on:
1. Programmatically starting Claude Code sessions
2. Streaming responses and monitoring progress API
3. Session resumption capabilities
4. Correct package name and import patterns (TypeScript)
5. E2B sandbox limitations

## Findings

### 1. Package Name and Installation

The **official npm package** is:

```bash
npm install @anthropic-ai/claude-agent-sdk
```

**Important Migration Note**: The SDK was previously named `@anthropic-ai/claude-code` but has been renamed to `@anthropic-ai/claude-agent-sdk`. The old package still exists for the CLI tool but the SDK functionality has moved. A migration guide is available from Anthropic.

**GitHub Repository**: `anthropics/claude-agent-sdk-typescript`

### 2. Programmatically Starting Sessions

The primary interface is the `query()` function:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

// Basic usage - iterate over streaming messages
for await (const message of query({
  prompt: "Help me build a web application",
  options: {
    model: "claude-sonnet-4-5",
    maxTurns: 10,
    allowedTools: ["Read", "Edit", "Write", "Glob", "Grep", "Bash"]
  }
})) {
  console.log(message);
}
```

**Function Signature**:
```typescript
function query({
  prompt,
  options
}: {
  prompt: string | AsyncIterable<SDKUserMessage>;
  options?: Options;
}): Query
```

The `Query` object extends `AsyncGenerator<SDKMessage, void>` with additional control methods.

### 3. Streaming Responses and Monitoring Progress

**Two Input Modes**:

1. **Single Message Input** (simpler but limited):
```typescript
for await (const message of query({
  prompt: "Explain the authentication flow",
  options: { maxTurns: 1, allowedTools: ["Read", "Grep"] }
})) {
  if (message.type === "result") {
    console.log(message.result);
  }
}
```

2. **Streaming Input Mode** (preferred, full capabilities):
```typescript
async function* generateMessages() {
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: "Analyze this codebase for security issues"
    }
  };
  
  // Wait for conditions or user input
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Follow-up message
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: "Now check for performance issues"
    }
  };
}

for await (const message of query({
  prompt: generateMessages(),
  options: { maxTurns: 10 }
})) {
  // Handle different message types
  switch (message.type) {
    case 'assistant':
      console.log("Assistant:", message.message);
      break;
    case 'result':
      console.log("Final result:", message.result);
      break;
    case 'stream_event':
      // Partial messages (requires includePartialMessages: true)
      console.log("Streaming:", message.event);
      break;
  }
}
```

**Message Types** (`SDKMessage` union):
- `SDKAssistantMessage` - Assistant responses
- `SDKUserMessage` - User inputs
- `SDKResultMessage` - Final result with usage stats
- `SDKSystemMessage` - System messages (includes session_id on init)
- `SDKPartialAssistantMessage` - Streaming partials (when `includePartialMessages: true`)

**Query Control Methods** (streaming input mode only):
```typescript
interface Query extends AsyncGenerator<SDKMessage, void> {
  interrupt(): Promise<void>;
  rewindFiles(userMessageUuid: string): Promise<void>;
  setPermissionMode(mode: PermissionMode): Promise<void>;
  setModel(model?: string): Promise<void>;
  setMaxThinkingTokens(maxThinkingTokens: number | null): Promise<void>;
  supportedCommands(): Promise<SlashCommand[]>;
  supportedModels(): Promise<ModelInfo[]>;
  mcpServerStatus(): Promise<McpServerStatus[]>;
  accountInfo(): Promise<AccountInfo>;
}
```

### 4. Session Resumption

**Getting the Session ID**:
```typescript
let sessionId: string | undefined;

for await (const message of query({
  prompt: "Help me design a REST API",
  options: { model: "claude-sonnet-4-5" }
})) {
  // First message is system init with session_id
  if (message.type === 'system' && message.subtype === 'init') {
    sessionId = message.session_id;
    console.log(`Session started: ${sessionId}`);
  }
}
```

**Resuming a Session**:
```typescript
const resumedResponse = query({
  prompt: "Continue implementing the authentication system",
  options: {
    resume: sessionId,  // Session ID from previous conversation
    model: "claude-sonnet-4-5",
    allowedTools: ["Read", "Edit", "Write", "Glob", "Grep", "Bash"]
  }
});

for await (const message of resumedResponse) {
  console.log(message);
}
```

**Forking Sessions** (branching conversations):
```typescript
// Fork to explore alternative approach
const forkedResponse = query({
  prompt: "Let's redesign this as a GraphQL API instead",
  options: {
    resume: sessionId,
    forkSession: true,  // Creates new session ID, preserves original
    model: "claude-sonnet-4-5"
  }
});

for await (const message of forkedResponse) {
  if (message.type === 'system' && message.subtype === 'init') {
    console.log(`Forked session: ${message.session_id}`);
    // Original session remains unchanged
  }
}
```

**Fork vs Continue**:
| Behavior | `forkSession: false` (default) | `forkSession: true` |
|----------|-------------------------------|---------------------|
| Session ID | Same as original | New ID generated |
| History | Appends to original | Creates new branch |
| Original | Modified | Preserved unchanged |
| Use Case | Linear conversation | Explore alternatives |

### 5. E2B Sandbox Integration

**Claude Code CAN run in E2B sandboxes** with specific requirements:

**Requirements**:
- E2B account with API access
- Anthropic API key for Claude
- Node.js 18+ (for integration setup)
- Python 3.11+ (for E2B launcher script)

**Configuration Methods**:
1. CLI Parameters (recommended for CI/CD)
2. Environment Variables

**Key Limitations**:

1. **Filesystem Isolation**: Claude can only read/write within the current working directory; cannot modify files outside it.

2. **Network Isolation**: Internet access only through proxy server with domain restrictions; user confirmation required for new domains.

3. **Timeout Constraints**: 15-minute timeout for sandbox sessions.

4. **Credentials Handling**: Sensitive credentials (git credentials, signing keys) are kept outside the sandbox to prevent exfiltration.

**SDK Sandbox Configuration**:
```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const result = await query({
  prompt: "Build and test my project",
  options: {
    sandbox: {
      enabled: true,
      autoAllowBashIfSandboxed: true,
      excludedCommands: ["docker"],
      network: {
        allowLocalBinding: true,
        allowUnixSockets: ["/var/run/docker.sock"]
      }
    }
  }
});
```

**Security Trade-offs**:
- Sandbox reduces permission prompts by 84% in internal usage
- Both filesystem AND network isolation are required together (one alone can be bypassed)

### 6. Complete Options Reference

```typescript
interface Options {
  abortController?: AbortController;
  additionalDirectories?: string[];
  agents?: Record<string, AgentDefinition>;
  allowedTools?: string[];
  continue?: boolean;
  enableFileCheckpointing?: boolean;
  forkSession?: boolean;
  includePartialMessages?: boolean;
  maxTurns?: number;
  mcpServers?: Record<string, McpServerConfig>;
  model?: string;
  permissionMode?: PermissionMode;
  resume?: string;  // Session ID to resume
  sandbox?: SandboxSettings;
  settingSources?: ('user' | 'project' | 'local')[];
  systemPrompt?: string | { type: 'preset', preset: string };
}
```

## Sources & Citations

1. [Session Management - Claude Docs](https://code.claude.com/docs/en/sdk/sdk-sessions) - Official session management documentation
2. [Agent SDK Reference - TypeScript](https://platform.claude.com/docs/en/agent-sdk/typescript) - Complete API reference
3. [Streaming Input - Claude Docs](https://platform.claude.com/docs/en/agent-sdk/streaming-vs-single-mode) - Streaming modes comparison
4. [anthropics/claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript) - Official GitHub repository
5. [@anthropic-ai/claude-code on npm](https://www.npmjs.com/package/@anthropic-ai/claude-code) - CLI package (SDK moved to separate package)
6. [GitHub Issue #10191](https://github.com/anthropics/claude-code/issues/10191) - Migration notice to @anthropic-ai/claude-agent-sdk
7. [ben-vargas/ai-sdk-provider-claude-code](https://github.com/ben-vargas/ai-sdk-provider-claude-code) - Vercel AI SDK integration showing migration
8. [Streaming Messages - Claude Docs](https://platform.claude.com/docs/en/build-with-claude/streaming) - Streaming API reference

## Key Takeaways

- **Package Name**: `@anthropic-ai/claude-agent-sdk` (NOT `@anthropic-ai/claude-code` which is CLI only)
- **Primary API**: `query()` function returns AsyncGenerator with control methods
- **Session ID**: Captured from first system message with `subtype: 'init'`
- **Resume**: Use `options.resume` with session ID; `options.forkSession` to branch
- **Streaming**: Use AsyncIterable prompt for full control; single string for simple queries
- **E2B Ready**: Works in E2B sandboxes with filesystem/network isolation restrictions
- **Migration**: Old `@anthropic-ai/claude-code` SDK deprecated; use new package with migration guide

## Related Searches

- Claude Agent SDK Python implementation
- MCP (Model Context Protocol) server integration with Claude Agent SDK
- Claude Agent SDK hooks and lifecycle events
- Custom tool definitions with Zod schemas in Claude Agent SDK
- Multi-agent orchestration patterns with Claude Agent SDK
