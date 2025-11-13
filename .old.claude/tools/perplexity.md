# Perplexity Ask MCP Server

An MCP server implementation that integrates the Sonar API to provide Claude with unparalleled real-time, web-wide research.

Please refer to the official [DeepWiki page](https://deepwiki.com/ppl-ai/modelcontextprotocol) for assistance with implementation.

## High-level System Architecture

_Credits: DeepWiki powered by Devin_

[![System Architecture](/ppl-ai/modelcontextprotocol/raw/main/perplexity-ask/assets/system_architecture.png)](/ppl-ai/modelcontextprotocol/blob/main/perplexity-ask/assets/system_architecture.png)

[![Demo](/ppl-ai/modelcontextprotocol/raw/main/perplexity-ask/assets/demo_screenshot.png)](/ppl-ai/modelcontextprotocol/blob/main/perplexity-ask/assets/demo_screenshot.png)

## Tools

- **perplexity_ask**
  - Engage in a conversation with the Sonar API for live web searches.
  - **Inputs:**
    - `messages` (array): An array of conversation messages.
      - Each message must include:
        - `role` (string): The role of the message (e.g., `system`, `user`, `assistant`).
        - `content` (string): The content of the message.

## Configuration

### Step 1

Clone this repository:

```shell
git clone git@github.com:ppl-ai/modelcontextprotocol.git
```

Navigate to the `perplexity-ask` directory and install the necessary dependencies:

```shell
cd modelcontextprotocol/perplexity-ask && npm install
```

### Step 2: Get a Sonar API Key

1. Sign up for a [Sonar API account](https://docs.perplexity.ai/guides/getting-started).
2. Follow the account setup instructions and generate your API key from the developer dashboard.
3. Set the API key
