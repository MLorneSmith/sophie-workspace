# Code Reasoning MCP Server

A Model Context Protocol (MCP) server that enhances Claude's ability to solve complex programming tasks through structured, step-by-step thinking.

[Badges for project]

## Quick Installation

1. Configure Claude Desktop by editing config file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "code-reasoning": {
      "command": "npx",
      "args": ["-y", "@mettamatt/code-reasoning"]
    }
  }
}
```

2. Configure VS Code similarly

## Usage

1. Append to chat messages: 
   ```
   Use sequential thinking to reason about this.
   ```

2. Use ready-to-go prompts from Code Reasoning tools

## Command Line Options

- `--debug`: Enable detailed logging
- `--help` or `-h`: Show help information

## Key Features

- **Programming Focus**: Optimized for coding tasks
- **Structured Thinking**: Break down complex problems
- **Thought Branching**: Explore multiple solution paths
- **Thought Revision**: Refine reasoning
- **Safety Limits**: Stops after 20 thought steps
- **Ready-to-Use Prompts**: Pre-defined templates

## Documentation

Detailed docs in `docs/` directory:
- [Usage Examples](/docs/examples.md)
- [Configuration Guide](/docs/configuration.md)
- [Prompts Guide](/docs/prompts.md)
- [Testing Framework](/docs/testing.md)

## Project Structure

```
├── index.ts                  # Entry point
├── src/                      # Implementation source files
└── test/                     # Testing framework
```

## Prompt Evaluation

Includes a prompt evaluation system to:
- Test prompt variations
- Verify parameter formats
- Score solution quality

Run with: `npm run eval`