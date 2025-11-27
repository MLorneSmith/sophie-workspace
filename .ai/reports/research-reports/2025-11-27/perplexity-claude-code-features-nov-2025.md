# Perplexity Research: Claude Code New Features Since November 1, 2025

**Date**: 2025-11-27
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Researched all new features and capabilities announced for Claude Code (Anthropic's official CLI for Claude) since November 1, 2025. Focus areas included slash commands, agent/subagent features, hooks, MCP updates, CLAUDE.md configuration, settings, tools, and API enhancements.

## Major Platform Updates

### Claude Opus 4.5 Integration (November 24, 2025)

- **Most powerful frontier model** - Claude Code now supports Claude Opus 4.5, providing access to stronger intelligence and improved performance for complex coding tasks
- **Pricing**: Same as Sonnet 4.5 at $3/$15 per million tokens (more accessible than previous Opus models)
- **Performance**: Step-change improvements in vision, coding, and computer use
- **Best for**: Complex specialized tasks, professional software engineering, advanced agents
- **Handles 30+ hours of autonomous coding** with maintained coherence across massive codebases

### Claude Sonnet 4.5 (September 29, 2025)

- **State-of-the-art coding** - Best coding model in the world on SWE-bench Verified
- **Computer use improvements**: 61.4% on OSWorld (up from 42.2% with Sonnet 4)
- **Default model** in Claude Code as of v2.0.0
- **Parallel tool execution**: Maximizes actions per context window by running multiple bash commands at once

## Claude Code 2.0 Release (September 29, 2025)

### Major UI/UX Overhaul

**Native VS Code Extension (Beta)**:
- Dedicated sidebar panel accessed via Spark icon
- Real-time inline diffs visible in the IDE
- Plan mode with editing capabilities
- Auto-accept edits mode
- Extended thinking toggle button
- File management with @-mention and system file picker
- Conversation history access
- Multiple simultaneous sessions
- Most keyboard shortcuts and slash commands from CLI
- Download from VS Code Extension Marketplace

**Terminal Interface Refresh**:
- Complete visual redesign (v2.0)
- Improved status visibility
- Searchable prompt history (Ctrl+r)
- Better user experience for navigation

### Checkpoints System (Most Requested Feature)

**Automatic State Saving**:
- Saves code state before each Claude edit
- Persists across sessions
- Auto-cleanup after 30 days (configurable)
- Creates checkpoint at every user prompt

**Rewind Capability**:
- Access via `Esc` + `Esc` or `/rewind` command
- Three restoration options:
  - **Conversation only**: Rewind chat but keep code changes
  - **Code only**: Revert files but keep conversation
  - **Both**: Complete rollback of code and conversation

**Limitations**:
- Does NOT track bash command modifications
- Does NOT track external/manual changes
- NOT a replacement for Git (complementary tool)
- Designed for "local undo" vs Git's "permanent history"

**Impact**: Eliminates fear of AI mistakes, enables fearless experimentation

## Plugin System (October 2025)

**Release**: v2.0.12 introduced full plugin ecosystem

**Core Capabilities**:
- `/plugin install` - Install plugins from marketplaces
- `/plugin enable/disable` - Toggle plugins
- `/plugin marketplace` - Browse and add marketplaces
- Repository-level configuration via `extraKnownMarketplaces`

**Marketplace System**:
- JSON-based plugin discovery
- Centralized browsing from multiple sources
- Automatic version management
- Team distribution support
- Sources: Git repos, GitHub, local paths, package managers

**Adding Marketplaces**:
```bash
# GitHub repository
/plugin marketplace add owner/repo

# Git repository
/plugin marketplace add https://gitlab.com/company/plugins.git

# Local development
/plugin marketplace add ./my-marketplace
/plugin marketplace add ./path/to/marketplace.json

# Remote JSON
/plugin marketplace add https://url.of/marketplace.json
```

**Installing Plugins**:
```bash
# From any known marketplace
/plugin install plugin-name@marketplace-name

# Interactive browse
/plugin
```

**Popular Marketplaces**:
- `jeremylongshore/claude-code-plugins` (185+ Agent Skills, 243+ plugins)
- `ananddtyagi/claude-code-marketplace` (community-driven)
- `obra/superpowers-marketplace` (Jesse Vincent's productivity suite)
- Multiple specialized marketplaces for security, devops, finance, etc.

## Agent & Subagent Features

### Custom Subagents (July 24, 2025 - v1.0.60)

**Creation**:
- Run `/agents` to get started
- Create specialized subagents for focused tasks
- Model customization support (v1.0.64) - specify which model each agent uses
- Dynamic agent selection by Claude

**Capabilities**:
- Parallel development workflows (e.g., backend + frontend simultaneously)
- Specialized task delegation
- Full context awareness
- Isolated worktrees for parallel agents

**Plan Mode Subagent** (v2.0.28):
- New Plan subagent introduced
- Claude can resume subagents
- Dynamic model selection for subagents
- `--max-budget-usd` flag for SDK

### Claude Agent SDK (Renamed from Claude Code SDK)

**Release**: September 29, 2025

**Purpose**: Same infrastructure powering Claude Code, now available for building custom agents

**Key Components**:
- Memory management across long-running tasks
- Permission systems balancing autonomy with user control
- Subagent coordination toward shared goals
- Context management systems
- Hooks support

**SDK Features**:
- Subagents and hooks support (v2.0)
- Request cancellation support (v1.0.82)
- Session support and permission denial tracking (v1.0.77)
- Tool confirmation with `canUseTool` callback (v1.0.59, v1.0.64)
- Custom tools as callbacks (v1.0.94)
- UUID support for all SDK messages (v1.0.86)
- `--replay-user-messages` flag (v1.0.86)

**Migration**: Legacy SDK entrypoint removed in v2.0.25 (Oct 22, 2025) - users directed to `@anthropic-ai/claude-agent-sdk`

## Hooks System Updates

**Core Purpose**: Deterministic automation executing custom shell commands at specific lifecycle points

**Available Events**:
- **PreToolUse**: Before Claude runs any tool (validation, blocking)
- **PostToolUse**: After tool completes (formatting, testing, logging)
- **Notification**: When Claude sends notifications/needs permission
- **Stop**: When main agent finishes response
- **UserPromptSubmit**: User prompt submission checkpoint
- **SessionStart**: Beginning of new session

**Recent Enhancements**:
- **systemMessage field** (v1.0.64): Hook JSON output for displaying warnings and context
- **PermissionDecision exposed** (v1.0.59): Including "ask" option
- **UserPromptSubmit additionalContext** (v1.0.59): Advanced JSON output
- **CLAUDE_PROJECT_DIR env var** (v1.0.58): For hook commands
- **Reduced PostToolUse errors** (v2.0.0): Fewer "tool_use ids without tool_result" errors
- **disableAllHooks setting** (v1.0.75)
- **Condensed output** (v1.0.115): Post-tool hooks show less clutter

**Configuration**:
- Configured via `settings.json` in `.claude` directory
- Register: `claude-code hook register post-command scripts/format.sh`
- List: `claude-code hook list`
- Unregister: `claude-code hook unregister <hook-id>`

**Best Practice**: Use "block-at-submit" hooks (commit time validation) rather than "block-at-write" hooks to avoid confusing the agent mid-plan

## MCP (Model Context Protocol) Updates

### MCP RC Release (November 11, 2025)

**Full Release**: November 25, 2025 (scheduled)

**Key Protocol Improvements**:
1. **Asynchronous Operations**: Support for long-running tasks with async callbacks
2. **Official Extensions**: Curated collection for specialized domains (healthcare, finance, education)
3. **SDK Support Standardization**: Tiering system based on compliance speed, maintenance, feature completeness
4. **MCP Registry GA**: Progressing from preview (launched Sept 2025) to production-ready
5. **Formal Governance**: SEP (Specification Enhancement Proposal) process

### Claude Code MCP Integration

**Dynamic Headers** (v2.0.22):
- Support for dynamic headers via `headersHelper` configuration
- Enables authentication token refresh and custom header injection

**Enterprise Features** (v2.0.24):
- Enterprise-managed MCP allowlist and denylist
- Team-level control over allowed MCP servers

**MCP Server Management**:
- `/mcp` command for interactive server management
- `/mcp list` shows server health status (improved v1.0.58)
- Configuration through CLI works in VS Code extension
- Tool name consistency improvements (v1.0.82)

**Agent Skills Integration** (October 16, 2025 - API Feature):
- Anthropic-managed Skills for PowerPoint, Excel, Word, PDF
- Custom Skills via Skills API
- Skills are organized folders loaded dynamically
- Requires code execution tool enabled
- 185+ skills upgraded to 2025 schema with tool permissions

## Slash Commands

### New Commands Since v2.0

**Core Navigation & Management**:
- `/rewind` - Undo code changes, access checkpoint system
- `/usage` - See plan limits and usage statistics
- `/context` - Display token usage breakdown, debug context issues (v1.0.86)
- `/memory` - Direct editing of all imported memory files (v1.0.94)
- `/todos` - List current todo items (v1.0.94)

**Plugin & MCP**:
- `/plugin` - Browse and install plugins interactively
- `/plugin install` - Install specific plugins
- `/plugin marketplace` - Manage plugin marketplaces
- `/plugin marketplace add` - Add new marketplaces
- `/mcp` - Interactive MCP server management

**Agent Management**:
- `/agents` - Create and manage custom subagents
- `/model` - Switch models, configure Opus Plan Mode

**Other Commands**:
- `/add-dir` - Expand workspace to include additional directories
- `/clear` - Start fresh conversation
- `/help` - List all available slash commands
- `/doctor` - Validate settings, provide self-serve debugging (v1.0.75)
- `/t` - Temporarily disable thinking mode in prompt (v1.0.115)
- `/ide` - Connect Claude Code to VS Code from external terminal

**Command Improvements**:
- Fixed slash commands to properly update allowed tools instead of replacing (v2.0.22)
- Improved presentation and condensed layout (v2.0.5)
- Searchable with scrolling UI (v2.0)

## Settings & Configuration

### Model Configuration

**Default Models Updated**:
- Bedrock default: `global.anthropic.claude-sonnet-4-5-20250929-v1:0` (Oct 22, Oct 2, 2025)
- Sonnet 4.5 default across all platforms (Sept 29, 2025)

**Model Environment Variables**:
- `ANTHROPIC_DEFAULT_SONNET_MODEL` - Control sonnet alias (v1.0.88)
- `ANTHROPIC_DEFAULT_OPUS_MODEL` - Control opus alias (v1.0.88)
- `ANTHROPIC_MODEL` - Override primary model

**Opus Plan Mode** (v1.0.77):
- New setting to run Opus only in plan mode, Sonnet otherwise
- Balances power with cost efficiency

### VS Code Extension Settings

**Environment Variables** (for third-party providers):
- `CLAUDE_CODE_USE_BEDROCK` - Enable Amazon Bedrock
- `CLAUDE_CODE_USE_FOUNDRY` - Enable Microsoft Foundry
- `CLAUDE_CODE_USE_VERTEX` - Enable Google Vertex AI
- `AWS_REGION`, `AWS_PROFILE` - Bedrock configuration
- `CLOUD_ML_REGION`, `ANTHROPIC_VERTEX_PROJECT_ID` - Vertex AI
- `ANTHROPIC_FOUNDRY_RESOURCE`, `ANTHROPIC_FOUNDRY_API_KEY` - Foundry
- `ANTHROPIC_SMALL_FAST_MODEL` - Override small/fast model
- `CLAUDE_CODE_SKIP_AUTH_LOGIN` - Disable all login prompts

**Extension Settings**:
- Search for "Claude Code: Environment Variables" in VS Code settings
- `claude-code.useTerminal: true` - Use legacy terminal version

### General Configuration

**Settings File** (v1.0.90):
- Changes take effect immediately - no restart required
- Located in `.claude/settings.json`
- Validation prevents invalid fields (v1.0.82)

**AWS Auth Helpers** (v1.0.53):
- `awsAuthRefresh` - Foreground operations like `aws sso login`
- `awsCredentialExport` - Background STS-like responses

**Additional Directories** (v1.0.82):
- SDK option to search custom paths
- Improved slash command processing

**Checkpoint Cleanup** (configurable):
- Default: 30 days retention
- Configurable in settings

## Developer Platform API Updates

### Programmatic Tool Calling (November 24, 2025 - Public Beta)

- Call tools from within code execution
- Reduces latency and token usage in multi-tool workflows
- Enables more efficient agentic workflows

### Tool Search Tool (November 24, 2025 - Public Beta)

- Dynamically discover and load tools on-demand
- Works with large tool catalogs
- Eliminates need to pre-configure all tools
- More flexible tool management

### Effort Parameter (November 24, 2025 - Public Beta)

- Available for Claude Opus 4.5
- Control token usage by trading thoroughness vs efficiency
- Adjust response depth based on task complexity

### Context Window Compaction (November 24, 2025)

- **Client-side compaction** in Python and TypeScript SDKs
- Automatically manages conversation context
- Summarizes earlier messages when approaching context limits
- Enables infinite-length conversations (with exceptions)
- Significantly reduces length limit errors
- Works with `tool_runner`

### Structured Outputs (November 14, 2025 - Public Beta)

- Guaranteed schema conformance for responses
- **JSON outputs**: Structured data responses
- **Strict tool use**: Validated tool inputs
- Available for Claude Sonnet 4.5 and Claude Opus 4.1
- Enable with beta header: `structured-outputs-2025-11-13`

### Tool Helpers (September 17, 2025 - Beta)

- Python and TypeScript SDKs
- Simplifies tool creation and execution
- Type-safe input validation
- Tool runner for automated tool handling in conversations

### Context Editing Enhancements (October 28, 2025)

- **Thinking block clearing**: `clear_thinking_20251015`
- Automatic management of thinking blocks
- Reduces token usage in long conversations

## Sandbox & Security Features

### Sandbox Runtime (October 2025)

**New Library**: `anthropic-experimental/sandbox-runtime` (Apache 2, open source)

**Boundaries**:
1. **Filesystem isolation** - Relatively easy implementation
2. **Network isolation** - More complex, crucial for security
   - Unix domain socket connected to proxy server
   - Proxy enforces domain restrictions
   - User confirmation for new domains
   - Customizable proxy for arbitrary traffic rules

**Environments**:
- **No network access** - Maximum security (Claude Code for Web)
- **Trusted network access** - Dependency installation domains only
- **Custom allow-list** - User-defined domains
- **Everything** (`*`) - Full access (use with caution)

**Platform Support**:
- macOS: Uses seatbelt
- Linux: Uses Bubblewrap
- Bash tool sandboxing released v2.0.24

**Claude Code for Web** (October 20, 2025):
- Asynchronous coding agent
- Runs in Anthropic-managed container
- `--dangerously-skip-permissions` by default
- Teleport feature: Copy transcript + files to local CLI
- Opens branches and PRs on GitHub repos
- Environment options: locked down, restricted, or custom

## Background Tasks & Execution

**Background Tasks** (v2.0):
- Keep long-running processes active (dev servers)
- Don't block Claude Code's progress
- Works alongside subagents and hooks

**Tab to Toggle Thinking** (v1.0.115):
- Sticky across sessions
- Improved visual effects for thinking mode
- `/t` command to temporarily disable

**IME Fixes** (v2.0.5):
- Fixed unintended message submission with Enter and Tab
- Better international keyboard support

## Quality of Life Improvements

### Terminal & Input

**Input Performance** (v2.0.22):
- Fixed input lag during typing
- Especially noticeable with large prompts

**Windows Stability** (v2.0.22):
- Resolved visual freeze when entering interactive mode

**Bash Tool Improvements** (v1.0.77):
- Fixed heredoc and multiline string escaping
- Improved stderr redirection handling
- Fixed crash when auto-reading large files (v1.0.82)

**Path Validation** (v1.0.115):
- Improved for `glob` and `grep` tools

### File Operations

**PDF Support** (v1.0.58):
- Read and process PDF files
- Analyze both text and visual content

**File Truncation** (v1.0.53):
- Updated @-mention from 100 lines to 2000 lines
- More context available per file

**Hidden Files** (v1.0.64):
- Added to file search and @-mention suggestions

**Drag-and-Drop** (v2.0.22):
- Files and folders to IDE chat `/context` feature

### OAuth & Authentication

**OAuth Fixes** (v1.0.88):
- Fixed "OAuth authentication is currently not supported" issue
- Fixed unhandled OAuth expiration 401 errors (v2.0.5)

**Enterprise OAuth** (November 18, 2025 - Microsoft Foundry):
- Azure billing and OAuth authentication
- Full Messages API access

### Performance Monitoring

**Status Line** (v1.0.88):
- Input now includes `exceeds_200k_tokens` indicator

**Usage Tracking** (v1.0.88):
- Fixed incorrect usage tracking in `/cost`

**Token Limit Fixes** (v1.0.77):
- Fixed token limit errors in conversation summarization

## Third-Party Provider Support

### Microsoft Foundry (November 18, 2025)

- Claude in Microsoft Foundry launched
- Azure customers with Azure billing
- OAuth authentication
- Full Messages API including:
  - Extended thinking
  - Prompt caching (5-minute and 1-hour)
  - PDF support
  - Files API
  - Agent Skills
  - Tool use

### Amazon Bedrock

- Bedrock default updated to Sonnet 4.5 (v1.0.88, v2.0.2)
- Global endpoints support for Vertex (v1.0.94)
- `/context` command enabled (v1.0.126)

### Google Vertex AI

- Global endpoint pricing introduced (Sept 29, 2025)
- Global endpoints support (v1.0.94)
- Skip Sonnet 4.5 default for Bedrock/Vertex in early releases (v2.0.1)

## Not Yet Implemented in VS Code Extension

- MCP server and plugin configuration UI (use terminal-based)
- Subagents configuration (configure via CLI)
- Checkpoints/rewind (coming soon)
- `#` shortcut to add to memory
- `!` shortcut for direct bash commands
- Tab completion for file paths
- Model selection UI for older models (manual setting entry required)

## Deprecated & Removed Features

**Legacy SDK** (v2.0.25 - October 22, 2025):
- Removed legacy entrypoint
- Users must migrate to `@anthropic-ai/claude-agent-sdk`

**Claude Sonnet 3.7** (October 28, 2025):
- Announced deprecation

**Claude Sonnet 3.5 Models** (October 28, 2025):
- Retired - all requests return error
- Models: `claude-3-5-sonnet-20240620` and `claude-3-5-sonnet-20241022`

## Documentation & Learning Resources

### New Documentation Platform (November 19, 2025)

- Launched at `platform.claude.com/docs`
- Previous `docs.claude.com` redirects to new location
- Unified developer experience with Claude Console

### Reference Materials

- **Claude Code Docs**: `code.claude.com/docs`
- **Agent SDK Docs**: `docs.claude.com/en/docs/claude-code/sdk`
- **MCP Specification**: Progressive updates with SEP process
- **Plugin Marketplaces**: Multiple community-driven directories

## Key Takeaways

1. **Checkpoints are the game-changer**: Most requested feature eliminates fear of AI mistakes, enables fearless experimentation with instant rollback

2. **Plugin ecosystem is mature**: 243+ plugins, multiple marketplaces, easy installation and distribution for teams

3. **VS Code extension brings IDE experience**: Beta release provides graphical alternative to terminal with real-time diffs, conversation history, multiple sessions

4. **Agent SDK opens custom development**: Infrastructure powering Claude Code now available for building custom agents for any use case

5. **Opus 4.5 is the power model**: 30+ hour autonomous coding sessions, best-in-world performance at accessible pricing

6. **Sandbox security is production-ready**: Filesystem and network isolation with open-source runtime protects against data exfiltration

7. **Hooks enable deterministic automation**: Replace "should-do" suggestions with "must-do" guarantees at specific lifecycle points

8. **MCP ecosystem maturing**: Async operations, official extensions, formal governance, registry GA approaching

9. **Subagents enable parallel development**: Multiple specialized agents working simultaneously with model customization

10. **Quality of life improvements everywhere**: From input lag fixes to 2000-line file context to searchable command history

## Related Searches

- Claude Agent SDK migration guide from legacy SDK
- Plugin marketplace development (creating custom marketplaces)
- Advanced hooks patterns for enterprise compliance
- Sandbox configuration for different security levels
- Subagent coordination patterns and best practices
- MCP server development with async operations
- Context editing strategies for long-running agents
- Tool search implementation for large tool catalogs

## Sources & Citations

Note: Citations were retrieved but encountered formatting errors in the Perplexity API response. Key sources include:

- Official Anthropic blog posts announcing Claude Opus 4.5, Sonnet 4.5, and Claude Code updates
- Claude Code documentation at code.claude.com/docs
- Claude Developer Platform release notes at platform.claude.com/docs/en/release-notes
- Claude Code changelog at claudelog.com/claude-code-changelog
- Community resources: claudecodeplugins.io, claudepro.directory, various GitHub repositories
- Technical analyses by Simon Willison, Jesse Vincent (obra), and community experts

---

**Research Methodology**: Combined Perplexity Chat API (sonar-pro model with citations) and Search API (recency filtering, domain targeting) to gather comprehensive information about Claude Code updates since November 1, 2025. Cross-referenced multiple sources including official documentation, changelog sites, community marketplaces, and technical blog posts.
